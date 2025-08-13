import { useState, useCallback } from 'react';
import { searchISBNsByTitle, getBookInfoFromISBN, getAvailableTitles } from '../utils/openBD';
import { searchBooksByTitle, searchBooksByAuthor, extractValidISBNs, isRakutenAPIAvailable, searchBookByISBN, searchBooksWithPaging } from '../utils/rakutenBooks';

// カーリルAPIのアプリケーションキー（環境変数から取得）
const CALIL_API_KEY = import.meta.env.VITE_CALIL_API_KEY;

export const useBookSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [cachedSystemIds, setCachedSystemIds] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageInfo, setPageInfo] = useState(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentSearchType, setCurrentSearchType] = useState('');
  const [lastSearchedQuery, setLastSearchedQuery] = useState(''); // 最後に検索されたキーワード

  // 図書館システムIDからシステム名を取得するマッピング
  const getSystemName = (systemId) => {
    const systemNames = {
      'Tokyo_Chiyoda': '千代田区立図書館',
      'Tokyo_Chuo': '中央区立図書館', 
      'Tokyo_Minato': '港区立図書館',
      'Tokyo_Setagaya': '世田谷区立図書館',
      'Tokyo_Metro': '東京都立図書館',
      'National_Diet': '国立国会図書館'
    };
    return systemNames[systemId] || systemId;
  };

  // ISBNを正規化（ハイフン除去）
  const normalizeISBN = (isbn) => {
    return isbn.replace(/[-\s]/g, '');
  };

  // キーワード検索の実装（楽天Books API統合版・ページング対応）
  const searchByTitle = async (keyword, systemIds, searchType = 'title', page = 1) => {
    console.log(`🔍 ${searchType === 'title' ? 'タイトル' : '著者'}検索開始:`, keyword, `ページ${page}`);
    
    try {
      let searchResults = [];
      
      // 1. 楽天Books APIが利用可能な場合はページング付きで検索
      if (isRakutenAPIAvailable()) {
        console.log(`📚 楽天Books APIで${searchType === 'title' ? 'タイトル' : '著者'}検索中...`);
        
        try {
          // 指定されたページのみ取得（10件ずつ）
          const rakutenResult = await searchBooksWithPaging(keyword, searchType, page, 10);
          
          if (rakutenResult.books.length > 0) {
            console.log(`🎯 楽天Books APIで ${rakutenResult.books.length} 件の書籍が見つかりました（総数: ${rakutenResult.totalCount}件）`);
            
            // ページ情報を保存
            setTotalCount(rakutenResult.totalCount);
            setPageInfo(rakutenResult.pageInfo);
            
            // 複数の書籍の蔵書検索を並行実行
            const validISBNs = extractValidISBNs(rakutenResult.books);
            
            if (validISBNs.length === 0) {
              throw new Error('検索結果からISBNを取得できませんでした。');
            }
            
            console.log(`📖 ${validISBNs.length} 件の書籍を表示、蔵書検索は段階的に実行`);
            
            // 楽天Books APIの結果をすべて表示用に変換（蔵書情報なし）
            const bookResults = validISBNs.map(isbn => {
              const rakutenBook = rakutenResult.books.find(book => {
                const normalizedIsbn = normalizeISBN(isbn);
                const normalizedBookIsbn = normalizeISBN(book.isbn || '');
                const normalizedBookIsbn13 = normalizeISBN(book.isbn13 || '');
                const normalizedBookIsbn10 = normalizeISBN(book.isbn10 || '');
                
                return normalizedBookIsbn13 === normalizedIsbn || 
                       normalizedBookIsbn10 === normalizedIsbn || 
                       normalizedBookIsbn === normalizedIsbn;
              });
              
              return {
                isbn,
                title: rakutenBook?.title || `書籍 (ISBN: ${isbn})`,
                systems: {}, // 最初は蔵書情報なし
                isLibraryDataLoaded: false, // 蔵書情報が読み込まれているかのフラグ
                ...(rakutenBook && {
                  author: rakutenBook.author,
                  publisher: rakutenBook.publisher,
                  publishDate: rakutenBook.publishDate,
                  imageUrl: rakutenBook.largeImageUrl || rakutenBook.mediumImageUrl,
                  reviewAverage: rakutenBook.reviewAverage,
                  reviewCount: rakutenBook.reviewCount,
                  itemCaption: rakutenBook.itemCaption,
                  itemUrl: rakutenBook.itemUrl
                })
              };
            });
            
            // 蔵書検索用データをキャッシュ
            setCachedSystemIds(systemIds);
            
            // 最初に全書籍を蔵書情報なしで表示
            searchResults = bookResults;
            
          } else {
            console.log('📭 楽天Books APIで検索結果が見つかりませんでした');
          }
          
        } catch (rakutenError) {
          console.warn('⚠️ 楽天Books API検索に失敗、フォールバック検索を実行:', rakutenError.message);
        }
      }
      
      // 2. 楽天APIが利用できない場合や結果がない場合は、従来の検索方法を使用
      if (searchResults.length === 0) {
        console.log('📖 ローカル書籍データベースで検索中...');
        
        const isbnCandidates = searchISBNsByTitle(keyword);
        
        if (isbnCandidates.length > 0) {
          console.log(`📚 ローカルデータベースで ${isbnCandidates.length} 件のISBN候補が見つかりました`);
          
          const bookInfo = await getBookInfoFromISBN(isbnCandidates[0]).catch(() => null);
          const bookTitle = bookInfo ? bookInfo.title : keyword;
          const singleResult = await searchByISBN(isbnCandidates[0], systemIds, bookTitle);
          searchResults = [singleResult];
          
        } else {
          const availableTitles = getAvailableTitles();
          throw new Error(
            `"${keyword}" の検索結果が見つかりませんでした。\n\n` +
            `【検索のコツ】\n` +
            `• 書籍のタイトルの一部を入力してください\n` +
            `• 著者名でも検索できます\n` +
            `• ひらがな・カタカナ・漢字を使い分けてみてください\n\n` +
            `【検索可能な書籍例】\n${availableTitles.slice(0, 8).join('、')} など`
          );
        }
      }
      
      console.log(`✅ 最終的に ${searchResults.length} 件の蔵書検索結果を取得`);
      return searchResults;
      
    } catch (error) {
      console.error('❌ キーワード検索エラー:', error);
      throw error;
    }
  };

  // ISBN検索の実装
  const searchByISBN = async (isbn, systemIds, bookTitle = null, rakutenBookInfo = null) => {
    const normalizedISBN = normalizeISBN(isbn);
    const systemIdParam = systemIds.join(',');
    
    // カーリルAPI呼び出し
    const apiUrl = `https://api.calil.jp/check?appkey=${CALIL_API_KEY}&isbn=${normalizedISBN}&systemid=${systemIdParam}&format=json&callback=?`;
    
    console.log('🔍 カーリル蔵書検索API呼び出し:', apiUrl);

    return new Promise((resolve, reject) => {
      // より一意性の高いコールバック名を生成
      const callbackName = `calil_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // JSONPコールバック関数を最初に定義（スクリプト作成前）
      window[callbackName] = async (data) => {
        // タイムアウトをクリア
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        try {
          console.log('📚 カーリルAPI応答:', data);
          
          setCurrentSession(data.session);
          
          // 初回応答の処理
          const processedResults = processBookSearchResults(data, bookTitle, rakutenBookInfo, isbn);
          
          // continue=1の場合、継続的に確認
          if (data.continue === 1) {
            console.log('🔄 検索継続中... セッション:', data.session);
            await pollForResults(data.session, normalizedISBN, systemIdParam, processedResults, bookTitle, resolve, reject, rakutenBookInfo, isbn);
          } else {
            console.log('✅ 蔵書検索完了');
            resolve(processedResults);
          }
        } catch (error) {
          console.error('❌ カーリルAPI応答処理エラー:', error);
          reject(error);
        } finally {
          // クリーンアップ
          cleanupScript();
        }
      };

      // スクリプト要素を作成
      const script = document.createElement('script');
      let timeoutId = null;

      // クリーンアップ関数
      const cleanupScript = () => {
        try {
          if (script && script.parentNode) {
            script.parentNode.removeChild(script);
          }
          if (window[callbackName]) {
            delete window[callbackName];
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        } catch (cleanupError) {
          console.warn('⚠️ スクリプトクリーンアップエラー:', cleanupError);
        }
      };
      
      // タイムアウト処理
      timeoutId = setTimeout(() => {
        console.error('❌ カーリルAPI タイムアウト');
        cleanupScript();
        reject(new Error('カーリルAPIの応答がタイムアウトしました'));
      }, 30000); // 30秒タイムアウト
      
      // エラーハンドリング
      script.onerror = () => {
        console.error('❌ カーリルAPI呼び出しエラー');
        cleanupScript();
        reject(new Error('図書館システムとの通信に失敗しました'));
      };
      
      // スクリプトのURLを設定
      const finalApiUrl = apiUrl.replace('callback=?', `callback=${callbackName}`);
      script.src = finalApiUrl;
      console.log('📡 JSONP URL:', finalApiUrl);
      
      // DOMに追加
      try {
        document.head.appendChild(script);
        console.log('✅ JSONPスクリプトを追加しました');
      } catch (appendError) {
        console.error('❌ スクリプト追加エラー:', appendError);
        cleanupScript();
        reject(new Error('APIリクエストの初期化に失敗しました'));
      }
    });
  };

  // 継続検索のポーリング
  const pollForResults = async (sessionId, isbn, systemIds, currentResults, bookTitle, resolve, reject, rakutenBookInfo = null, searchedISBN = null) => {
    const pollUrl = `https://api.calil.jp/check?appkey=${CALIL_API_KEY}&session=${sessionId}&format=json&callback=?`;
    
    const poll = () => {
      // より一意性の高いコールバック名を生成
      const callbackName = `calil_poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // JSONPコールバック関数を先に定義
      window[callbackName] = (data) => {
        // クリーンアップ関数
        const cleanup = () => {
          try {
            if (script && script.parentNode) {
              script.parentNode.removeChild(script);
            }
            if (window[callbackName]) {
              delete window[callbackName];
            }
          } catch (cleanupError) {
            console.warn('⚠️ ポーリングクリーンアップエラー:', cleanupError);
          }
        };
        
        try {
          console.log('🔄 継続検索応答:', data);
          
          const updatedResults = processBookSearchResults(data, bookTitle, rakutenBookInfo, searchedISBN);
          
          if (data.continue === 1) {
            // まだ続きがある場合、2秒後に再ポーリング
            cleanup();
            setTimeout(poll, 2000);
          } else {
            console.log('✅ 継続検索完了');
            cleanup();
            resolve(updatedResults);
          }
        } catch (error) {
          cleanup();
          reject(error);
        }
      };
      
      // スクリプト要素を作成
      const script = document.createElement('script');
      
      script.onerror = () => {
        console.error('❌ 継続検索API呼び出しエラー');
        try {
          if (script && script.parentNode) {
            script.parentNode.removeChild(script);
          }
          if (window[callbackName]) {
            delete window[callbackName];
          }
        } catch (cleanupError) {
          console.warn('⚠️ エラー時クリーンアップエラー:', cleanupError);
        }
        reject(new Error('継続検索でエラーが発生しました'));
      };
      
      // スクリプトのURLを設定してDOM追加
      try {
        script.src = pollUrl.replace('callback=?', `callback=${callbackName}`);
        document.head.appendChild(script);
        console.log('🔄 継続検索JSONPスクリプトを追加');
      } catch (appendError) {
        console.error('❌ 継続検索スクリプト追加エラー:', appendError);
        reject(new Error('継続検索の初期化に失敗しました'));
      }
    };
    
    // 最初のポーリング（2秒待機後）
    setTimeout(poll, 2000);
  };

  // カーリルAPI応答を処理して結果配列に変換
  const processBookSearchResults = (apiData, bookTitle, rakutenBookInfo = null, searchedISBN = null) => {
    const results = [];
    
    if (!apiData.books) {
      return results;
    }
    
    Object.entries(apiData.books).forEach(([isbn, systemsData]) => {
      // ISBN検索の場合は完全一致のみを処理
      if (searchedISBN) {
        const normalizedSearchedISBN = normalizeISBN(searchedISBN);
        const normalizedResultISBN = normalizeISBN(isbn);
        
        // 完全一致しない場合はスキップ
        if (normalizedResultISBN !== normalizedSearchedISBN) {
          console.log(`📋 ISBN不一致のためスキップ: 検索=${normalizedSearchedISBN}, 結果=${normalizedResultISBN}`);
          return;
        }
      }
      const bookResult = {
        isbn,
        title: bookTitle || `書籍 (ISBN: ${isbn})`,
        systems: {},
        // 楽天Books APIから取得した追加情報
        ...(rakutenBookInfo && {
          author: rakutenBookInfo.author,
          publisher: rakutenBookInfo.publisher,
          publishDate: rakutenBookInfo.publishDate,
          imageUrl: rakutenBookInfo.largeImageUrl || rakutenBookInfo.mediumImageUrl,
          reviewAverage: rakutenBookInfo.reviewAverage,
          reviewCount: rakutenBookInfo.reviewCount,
          itemCaption: rakutenBookInfo.itemCaption
        })
      };
      
      Object.entries(systemsData).forEach(([systemId, systemInfo]) => {
        bookResult.systems[systemId] = {
          systemName: getSystemName(systemId),
          status: systemInfo.status,
          reserveurl: systemInfo.reserveurl,
          libkey: systemInfo.libkey || {}
        };
      });
      
      results.push(bookResult);
    });
    
    return results;
  };

  // メイン検索関数（ページング対応）
  const searchBooks = useCallback(async (query, searchType, systemIds, page = 1) => {
    if (!query.trim() || !systemIds || systemIds.length === 0) {
      setError('検索条件が正しくありません');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setCurrentSession(null);
    setCurrentQuery(query);
    setCurrentSearchType(searchType);
    setLastSearchedQuery(query); // 検索実行時にキーワードを保存

    try {
      console.log('📚 蔵書検索開始:', { query, searchType, systemIds, page });

      let searchResults = [];
      
      if (searchType === 'isbn') {
        console.log('📖 ISBN検索モード:', query);
        
        // 1. 楽天Books APIで書籍情報を取得
        let rakutenBookInfo = null;
        if (isRakutenAPIAvailable()) {
          console.log('🔍 楽天Books APIでISBN検索中...');
          try {
            rakutenBookInfo = await searchBookByISBN(query);
          } catch (error) {
            console.warn('⚠️ 楽天Books ISBN検索エラー:', error.message);
          }
        }
        
        // 2. カーリルAPIで蔵書情報を取得
        const bookTitle = rakutenBookInfo?.title || `書籍 (ISBN: ${query})`;
        const libraryResults = await searchByISBN(query, systemIds, bookTitle, rakutenBookInfo);
        
        console.log('📚 ISBN検索結果:', libraryResults);
        
        // searchByISBNは配列を返すので、各結果にisLibraryDataLoadedフラグを追加
        if (libraryResults && Array.isArray(libraryResults) && libraryResults.length > 0) {
          searchResults = libraryResults.map(result => ({
            ...result,
            isLibraryDataLoaded: true // ISBN検索では蔵書情報が既に読み込まれている
          }));
          console.log('✅ ISBN検索結果を変換:', searchResults);
        } else {
          console.error('❌ ISBN検索結果が空または配列でない:', libraryResults);
          throw new Error(`ISBN ${query} の蔵書情報が見つかりませんでした`);
        }
        
        // システムIDをキャッシュ（個別読み込み用）
        setCachedSystemIds(systemIds);
        
        // ISBN検索の場合はページング情報をクリア（1件のみの結果なので）
        setTotalCount(1);
        setPageInfo({
          page: 1,
          pageCount: 1,
          hits: 1,
          first: 1,
          last: 1
        });
        
      } else {
        // タイトル・著者検索は複数結果を返す可能性がある（ページング対応）
        const titleResults = await searchByTitle(query, systemIds, searchType, page);
        searchResults = Array.isArray(titleResults) ? titleResults : [titleResults];
      }

      // 結果をフラット化（ネストされた配列を平坦化）
      const flatResults = searchResults.flat().filter(result => result !== null);
      
      console.log('📚 最終検索結果:', flatResults);
      setResults(flatResults);
      
      if (flatResults.length === 0) {
        setError('検索条件に一致する蔵書が見つかりませんでした');
      }
    } catch (err) {
      console.error('❌ 蔵書検索エラー:', err);
      setError(err.message || '蔵書検索中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  // 個別書籍の蔵書情報読み込み
  const loadLibraryDataForBook = useCallback(async (isbn) => {
    if (!cachedSystemIds.length) {
      throw new Error('図書館システム情報が見つかりません');
    }

    console.log(`📚 ISBN ${isbn} の蔵書情報読み込み開始`);
    
    // 該当する書籍を取得
    const bookIndex = results.findIndex(book => book.isbn === isbn);
    if (bookIndex === -1) {
      throw new Error('書籍が見つかりません');
    }

    const book = results[bookIndex];
    
    // 書籍の読み込み状態を更新
    setResults(prevResults => {
      const newResults = [...prevResults];
      newResults[bookIndex] = { ...book, isLibraryDataLoading: true };
      return newResults;
    });

    try {
      const libraryDataArray = await searchByISBN(isbn, cachedSystemIds, book.title, book);
      
      console.log(`📚 ISBN ${isbn} 蔵書検索結果:`, libraryDataArray);
      
      // searchByISBNは配列を返すので、最初の要素を取得
      if (libraryDataArray && libraryDataArray.length > 0) {
        const libraryData = libraryDataArray[0];
        
        // 結果を更新（既存の書籍情報を保持してマージ）
        setResults(prevResults => {
          const newResults = [...prevResults];
          newResults[bookIndex] = { 
            ...book, // 既存の書籍情報（画像、著者、出版社等）を保持
            systems: libraryData.systems || {}, // 蔵書情報のみ更新
            isLibraryDataLoaded: true, 
            isLibraryDataLoading: false 
          };
          return newResults;
        });
        
        console.log(`✅ ISBN ${isbn} の蔵書情報読み込み完了:`, libraryData);
      } else {
        // 蔵書情報が見つからない場合
        setResults(prevResults => {
          const newResults = [...prevResults];
          newResults[bookIndex] = { 
            ...book, 
            systems: {}, // 空の蔵書情報
            isLibraryDataLoaded: true, 
            isLibraryDataLoading: false,
            libraryDataError: '蔵書情報が見つかりませんでした'
          };
          return newResults;
        });
        
        console.log(`📭 ISBN ${isbn} の蔵書情報が見つかりませんでした`);
      }
      
    } catch (error) {
      console.error(`❌ ISBN ${isbn} の蔵書検索エラー:`, error);
      
      // エラー状態を更新
      setResults(prevResults => {
        const newResults = [...prevResults];
        newResults[bookIndex] = { 
          ...book, 
          isLibraryDataLoaded: true, 
          isLibraryDataLoading: false,
          libraryDataError: error.message 
        };
        return newResults;
      });
      
      throw error;
    }
  }, [results, cachedSystemIds]);

  // ページ切り替え検索
  const searchBooksPage = useCallback(async (page) => {
    if (!currentQuery || !currentSearchType || !cachedSystemIds.length) {
      setError('検索状態が不正です');
      return;
    }
    
    await searchBooks(currentQuery, currentSearchType, cachedSystemIds, page);
  }, [currentQuery, currentSearchType, cachedSystemIds, searchBooks]);

  // 検索結果クリア
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setCurrentSession(null);
    setCachedSystemIds([]);
    setTotalCount(0);
    setPageInfo(null);
    setCurrentQuery('');
    setCurrentSearchType('');
    setLastSearchedQuery('');
  }, []);

  return {
    results,
    loading,
    error,
    searchBooks,
    searchBooksPage,
    clearResults,
    currentSession,
    loadLibraryDataForBook,
    totalCount,
    pageInfo,
    lastSearchedQuery
  };
};