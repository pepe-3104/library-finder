import { useState, useCallback } from 'react';
import { searchISBNsByTitle, getBookInfoFromISBN, getAvailableTitles } from '../utils/openBD';
import { searchBooksByKeyword, extractValidISBNs, isRakutenAPIAvailable } from '../utils/rakutenBooks';

// カーリルAPIのアプリケーションキー（環境変数から取得）
const CALIL_API_KEY = import.meta.env.VITE_CALIL_API_KEY;

export const useBookSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);

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

  // キーワード検索の実装（楽天Books API統合版）
  const searchByTitle = async (keyword, systemIds) => {
    console.log('🔍 キーワード検索開始:', keyword);
    
    try {
      let searchResults = [];
      
      // 1. 楽天Books APIが利用可能な場合はAPIを使用
      if (isRakutenAPIAvailable()) {
        console.log('📚 楽天Books APIでキーワード検索中...');
        
        try {
          const rakutenBooks = await searchBooksByKeyword(keyword, 15);
          
          if (rakutenBooks.length > 0) {
            console.log(`🎯 楽天Books APIで ${rakutenBooks.length} 件の書籍が見つかりました`);
            
            // 複数の書籍の蔵書検索を並行実行
            const validISBNs = extractValidISBNs(rakutenBooks);
            
            if (validISBNs.length === 0) {
              throw new Error('検索結果からISBNを取得できませんでした。');
            }
            
            console.log(`📖 ${validISBNs.length} 件のISBNで蔵書検索を実行`);
            
            // 最初の3冊について蔵書検索を実行（パフォーマンス考慮）
            const isbnBatch = validISBNs.slice(0, 3);
            const bookSearchPromises = isbnBatch.map(async (isbn, index) => {
              const rakutenBook = rakutenBooks.find(book => {
                const normalizedIsbn = normalizeISBN(isbn);
                const normalizedBookIsbn = normalizeISBN(book.isbn || '');
                const normalizedBookIsbn13 = normalizeISBN(book.isbn13 || '');
                const normalizedBookIsbn10 = normalizeISBN(book.isbn10 || '');
                
                return normalizedBookIsbn13 === normalizedIsbn || 
                       normalizedBookIsbn10 === normalizedIsbn || 
                       normalizedBookIsbn === normalizedIsbn;
              });
              
              try {
                console.log(`📚 [${index + 1}/${isbnBatch.length}] "${rakutenBook?.title || isbn}" の蔵書検索中...`);
                console.log(`🔍 検索ISBN: ${isbn}, マッチした書籍: ${rakutenBook?.title || '見つかりませんでした'}`);
                return await searchByISBN(isbn, systemIds, rakutenBook?.title, rakutenBook);
              } catch (error) {
                console.warn(`⚠️ ISBN ${isbn} の蔵書検索に失敗:`, error.message);
                return null;
              }
            });
            
            const results = await Promise.all(bookSearchPromises);
            searchResults = results.filter(result => result !== null);
            
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
          const processedResults = processBookSearchResults(data, bookTitle, rakutenBookInfo);
          
          // continue=1の場合、継続的に確認
          if (data.continue === 1) {
            console.log('🔄 検索継続中... セッション:', data.session);
            await pollForResults(data.session, normalizedISBN, systemIdParam, processedResults, bookTitle, resolve, reject, rakutenBookInfo);
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
  const pollForResults = async (sessionId, isbn, systemIds, currentResults, bookTitle, resolve, reject, rakutenBookInfo = null) => {
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
          
          const updatedResults = processBookSearchResults(data, bookTitle, rakutenBookInfo);
          
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
  const processBookSearchResults = (apiData, bookTitle, rakutenBookInfo = null) => {
    const results = [];
    
    if (!apiData.books) {
      return results;
    }
    
    Object.entries(apiData.books).forEach(([isbn, systemsData]) => {
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

  // メイン検索関数
  const searchBooks = useCallback(async (query, searchType, systemIds) => {
    if (!query.trim() || !systemIds || systemIds.length === 0) {
      setError('検索条件が正しくありません');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setCurrentSession(null);

    try {
      console.log('📚 蔵書検索開始:', { query, searchType, systemIds });

      let searchResults = [];
      
      if (searchType === 'isbn') {
        const singleResult = await searchByISBN(query, systemIds);
        searchResults = [singleResult];
      } else {
        // タイトル検索は複数結果を返す可能性がある
        const titleResults = await searchByTitle(query, systemIds);
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

  // 検索結果クリア
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setCurrentSession(null);
  }, []);

  return {
    results,
    loading,
    error,
    searchBooks,
    clearResults,
    currentSession
  };
};