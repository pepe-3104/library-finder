import { useState, useCallback } from 'react';

// カーリルAPIのアプリケーションキー（環境変数または設定ファイルから取得）
const CALIL_API_KEY = import.meta.env.VITE_CALIL_API_KEY || 'demo-key-for-development';

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

  // タイトル検索用のISBN検索APIラッパー（デモ用）
  const searchByTitle = async (title, systemIds) => {
    // 実際の実装では、OpenBD APIなどを使用してタイトルからISBNを取得
    // ここではデモ用のダミーデータを返す
    console.log('📚 タイトル検索（デモ実装）:', title);
    
    // よく知られた書籍のタイトル → ISBN マッピング（デモ用）
    const titleToISBN = {
      '星の王子さま': '9784102122044',
      'ハリーポッター': '9784915512377', 
      '吾輩は猫である': '9784003101018',
      'こころ': '9784003101124',
      '人間失格': '9784101006048'
    };

    // 部分一致でISBNを検索
    const matchedISBN = Object.entries(titleToISBN).find(([bookTitle]) => 
      bookTitle.includes(title) || title.includes(bookTitle)
    );

    if (matchedISBN) {
      return searchByISBN(matchedISBN[1], systemIds, matchedISBN[0]);
    } else {
      throw new Error(`"${title}" に該当する書籍が見つかりませんでした。デモ版では限定的な書籍のみ検索可能です。`);
    }
  };

  // ISBN検索の実装
  const searchByISBN = async (isbn, systemIds, bookTitle = null) => {
    const normalizedISBN = normalizeISBN(isbn);
    const systemIdParam = systemIds.join(',');
    
    // カーリルAPI呼び出し
    const apiUrl = `https://api.calil.jp/check?appkey=${CALIL_API_KEY}&isbn=${normalizedISBN}&systemid=${systemIdParam}&format=json&callback=?`;
    
    console.log('🔍 カーリル蔵書検索API呼び出し:', apiUrl);

    return new Promise((resolve, reject) => {
      // JSONPを使用してCORS回避
      const script = document.createElement('script');
      const callbackName = `calil_callback_${Date.now()}`;
      
      // JSONPコールバック関数を定義
      window[callbackName] = async (data) => {
        try {
          console.log('📚 カーリルAPI応答:', data);
          
          setCurrentSession(data.session);
          
          // 初回応答の処理
          const processedResults = processBookSearchResults(data, bookTitle);
          
          // continue=1の場合、継続的に確認
          if (data.continue === 1) {
            console.log('🔄 検索継続中... セッション:', data.session);
            await pollForResults(data.session, normalizedISBN, systemIdParam, processedResults, bookTitle, resolve, reject);
          } else {
            console.log('✅ 蔵書検索完了');
            resolve(processedResults);
          }
        } catch (error) {
          console.error('❌ カーリルAPI応答処理エラー:', error);
          reject(error);
        } finally {
          // クリーンアップ
          document.head.removeChild(script);
          delete window[callbackName];
        }
      };
      
      // エラーハンドリング
      script.onerror = () => {
        console.error('❌ カーリルAPI呼び出しエラー');
        document.head.removeChild(script);
        delete window[callbackName];
        reject(new Error('図書館システムとの通信に失敗しました'));
      };
      
      script.src = apiUrl.replace('callback=?', `callback=${callbackName}`);
      document.head.appendChild(script);
    });
  };

  // 継続検索のポーリング
  const pollForResults = async (sessionId, isbn, systemIds, currentResults, bookTitle, resolve, reject) => {
    const pollUrl = `https://api.calil.jp/check?appkey=${CALIL_API_KEY}&session=${sessionId}&format=json&callback=?`;
    
    const poll = () => {
      const script = document.createElement('script');
      const callbackName = `calil_poll_${Date.now()}`;
      
      window[callbackName] = (data) => {
        try {
          console.log('🔄 継続検索応答:', data);
          
          const updatedResults = processBookSearchResults(data, bookTitle);
          
          if (data.continue === 1) {
            // まだ続きがある場合、2秒後に再ポーリング
            setTimeout(() => {
              document.head.removeChild(script);
              delete window[callbackName];
              poll();
            }, 2000);
          } else {
            console.log('✅ 継続検索完了');
            resolve(updatedResults);
            document.head.removeChild(script);
            delete window[callbackName];
          }
        } catch (error) {
          reject(error);
          document.head.removeChild(script);
          delete window[callbackName];
        }
      };
      
      script.onerror = () => {
        document.head.removeChild(script);
        delete window[callbackName];
        reject(new Error('継続検索でエラーが発生しました'));
      };
      
      script.src = pollUrl.replace('callback=?', `callback=${callbackName}`);
      document.head.appendChild(script);
    };
    
    // 最初のポーリング（2秒待機後）
    setTimeout(poll, 2000);
  };

  // カーリルAPI応答を処理して結果配列に変換
  const processBookSearchResults = (apiData, bookTitle) => {
    const results = [];
    
    if (!apiData.books) {
      return results;
    }
    
    Object.entries(apiData.books).forEach(([isbn, systemsData]) => {
      const bookResult = {
        isbn,
        title: bookTitle || `書籍 (ISBN: ${isbn})`,
        systems: {}
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

      let searchResults;
      
      if (searchType === 'isbn') {
        searchResults = await searchByISBN(query, systemIds);
      } else {
        searchResults = await searchByTitle(query, systemIds);
      }

      console.log('📚 検索結果:', searchResults);
      setResults(searchResults);
      
      if (searchResults.length === 0) {
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