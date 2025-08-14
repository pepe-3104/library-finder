import { useState, useCallback } from 'react';
import { searchISBNsByTitle, getBookInfoFromISBN, getAvailableTitles } from '../utils/openBD';
import { extractValidISBNs, isRakutenAPIAvailable, searchBookByISBN, searchBooksWithPaging } from '../utils/rakutenBooks';
import { searchLibraryBooks } from '../utils/calilApi';

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

    
    try {
      let searchResults = [];
      
      // 1. 楽天Books APIが利用可能な場合はページング付きで検索
      if (isRakutenAPIAvailable()) {

        
        try {
          // 指定されたページのみ取得（10件ずつ）
          const rakutenResult = await searchBooksWithPaging(keyword, searchType, page, 10);
          
          if (rakutenResult.books.length > 0) {

            
            // ページ情報を保存
            setTotalCount(rakutenResult.totalCount);
            setPageInfo(rakutenResult.pageInfo);
            
            // 複数の書籍の蔵書検索を並行実行
            const validISBNs = extractValidISBNs(rakutenResult.books);
            
            if (validISBNs.length === 0) {
              throw new Error('検索結果からISBNを取得できませんでした。');
            }
            

            
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

          }
          
        } catch {

        }
      }
      
      // 2. 楽天APIが利用できない場合や結果がない場合は、従来の検索方法を使用
      if (searchResults.length === 0) {

        
        const isbnCandidates = searchISBNsByTitle(keyword);
        
        if (isbnCandidates.length > 0) {

          
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
      

      return searchResults;
      
    } catch {

      throw error;
    }
  };

  // ISBN検索の実装
  const searchByISBN = async (isbn, systemIds, bookTitle = null, rakutenBookInfo = null) => {
    const normalizedISBN = normalizeISBN(isbn);
    const systemIdParam = systemIds.join(',');
    
    // カーリルAPI呼び出し
    const apiUrl = `https://api.calil.jp/check?appkey=${CALIL_API_KEY}&isbn=${normalizedISBN}&systemid=${systemIdParam}&format=json&callback=?`;
    
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

          
          setCurrentSession(data.session);
          
          // 初回応答の処理
          const processedResults = processBookSearchResults(data, bookTitle, rakutenBookInfo, isbn);
          
          // continue=1の場合、継続的に確認
          if (data.continue === 1) {

            await pollForResults(data.session, normalizedISBN, systemIdParam, processedResults, bookTitle, resolve, reject, rakutenBookInfo, isbn);
          } else {

            resolve(processedResults);
          }
        } catch {

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
        } catch {

        }
      };
      
      // タイムアウト処理
      timeoutId = setTimeout(() => {

        cleanupScript();
        reject(new Error('カーリルAPIの応答がタイムアウトしました'));
      }, 30000); // 30秒タイムアウト
      
      // エラーハンドリング
      script.onerror = () => {

        cleanupScript();
        reject(new Error('図書館システムとの通信に失敗しました'));
      };
      
      // スクリプトのURLを設定
      const finalApiUrl = apiUrl.replace('callback=?', `callback=${callbackName}`);
      script.src = finalApiUrl;

      
      // DOMに追加
      try {
        document.head.appendChild(script);

      } catch {

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
          } catch {

          }
        };
        
        try {

          
          const updatedResults = processBookSearchResults(data, bookTitle, rakutenBookInfo, searchedISBN);
          
          if (data.continue === 1) {
            // まだ続きがある場合、2秒後に再ポーリング
            cleanup();
            setTimeout(poll, 2000);
          } else {

            cleanup();
            resolve(updatedResults);
          }
        } catch {
          cleanup();
          reject(error);
        }
      };
      
      // スクリプト要素を作成
      const script = document.createElement('script');
      
      script.onerror = () => {

        try {
          if (script && script.parentNode) {
            script.parentNode.removeChild(script);
          }
          if (window[callbackName]) {
            delete window[callbackName];
          }
        } catch {

        }
        reject(new Error('継続検索でエラーが発生しました'));
      };
      
      // スクリプトのURLを設定してDOM追加
      try {
        script.src = pollUrl.replace('callback=?', `callback=${callbackName}`);
        document.head.appendChild(script);

      } catch {

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

    // 新しい検索の場合（page = 1）のみページトップにスクロール
    if (page === 1) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setCurrentSession(null);
    setCurrentQuery(query);
    setCurrentSearchType(searchType);
    setLastSearchedQuery(query); // 検索実行時にキーワードを保存

    try {
      let searchResults = [];
      
      if (searchType === 'isbn') {

        
        // 1. 楽天Books APIで書籍情報を取得
        let rakutenBookInfo = null;
        if (isRakutenAPIAvailable()) {

          try {
            rakutenBookInfo = await searchBookByISBN(query);
          } catch {

          }
        }
        
        // 2. カーリルAPIで蔵書情報を取得
        const bookTitle = rakutenBookInfo?.title || `書籍 (ISBN: ${query})`;
        const libraryResults = await searchByISBN(query, systemIds, bookTitle, rakutenBookInfo);
        

        
        // searchByISBNは配列を返すので、各結果にisLibraryDataLoadedフラグを追加
        if (libraryResults && Array.isArray(libraryResults) && libraryResults.length > 0) {
          searchResults = libraryResults.map(result => ({
            ...result,
            isLibraryDataLoaded: true // ISBN検索では蔵書情報が既に読み込まれている
          }));

        } else {

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
      

      setResults(flatResults);
      
      if (flatResults.length === 0) {
        setError('検索条件に一致する蔵書が見つかりませんでした');
      }
    } catch (err) {

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
    
    // 該当する書籍を取得
    const bookIndex = results.findIndex(book => book.isbn === isbn);
    if (bookIndex === -1) {
      throw new Error('書籍が見つかりません');
    }

    const book = results[bookIndex];
    
    // 既に読み込み済みまたは読み込み中の場合はスキップ
    if (book.isLibraryDataLoaded || book.isLibraryDataLoading) {
      return;
    }
    
    // 書籍の読み込み状態を更新
    setResults(prevResults => {
      const newResults = [...prevResults];
      newResults[bookIndex] = { ...book, isLibraryDataLoading: true };
      return newResults;
    });

    try {
      // 進捗更新コールバック関数を作成
      const handleProgressUpdate = (progressData) => {
        setResults(prevResults => {
          const newResults = [...prevResults];
          const currentBook = newResults[bookIndex];
          
          // 既存のsystems情報と新しい情報をマージ
          const mergedSystems = {
            ...(currentBook.systems || {}),
            ...(progressData.systems || {})
          };
          
          // 進捗情報を追加
          const totalLibraries = cachedSystemIds.length;
          const completedLibraries = Object.keys(mergedSystems).length;
          
          newResults[bookIndex] = {
            ...currentBook,
            systems: mergedSystems,
            isLibraryDataLoading: !progressData.isComplete,
            isLibraryDataLoaded: progressData.isComplete,
            // 進捗情報を追加
            librarySearchProgress: {
              total: totalLibraries,
              completed: completedLibraries,
              isComplete: progressData.isComplete
            }
          };
          
          return newResults;
        });
      };

      // searchLibraryBooksを使用して順次更新対応の検索を実行
      await searchLibraryBooks(isbn, cachedSystemIds, handleProgressUpdate);
      
    } catch {
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
    
    // ページ切り替え時にページトップにスクロール
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
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