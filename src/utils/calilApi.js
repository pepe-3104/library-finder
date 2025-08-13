// カーリルAPI ユーティリティ

// カーリルAPIのアプリケーションキー（環境変数から取得）
const CALIL_API_KEY = import.meta.env.VITE_CALIL_API_KEY;

/**
 * ISBN正規化関数
 * @param {string} isbn - 正規化するISBN
 * @returns {string} 正規化されたISBN
 */
export const normalizeISBN = (isbn) => {
  return isbn.replace(/[-\s]/g, '');
};

/**
 * カーリルAPIで蔵書検索（順次更新対応）
 * @param {string} isbn - 検索するISBN
 * @param {string[]} systemIds - 検索対象の図書館システムID配列
 * @param {Function} onProgressUpdate - 進捗更新コールバック関数
 * @returns {Promise<{isbn: string, systems: Object, title: string}>} 蔵書検索結果
 */
export const searchLibraryBooks = async (isbn, systemIds, onProgressUpdate = null) => {
  if (!CALIL_API_KEY) {
    throw new Error('カーリルAPIキーが設定されていません');
  }

  if (!systemIds || systemIds.length === 0) {
    return { isbn: normalizeISBN(isbn), systems: {}, title: isbn };
  }

  const normalizedISBN = normalizeISBN(isbn);
  const systemIdParam = systemIds.join(',');
  
  const apiUrl = `https://api.calil.jp/check?appkey=${CALIL_API_KEY}&isbn=${normalizedISBN}&systemid=${systemIdParam}&format=json&callback=?`;

  // タイムアウト処理（30秒）
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('蔵書検索がタイムアウトしました（30秒）'));
    }, 30000);
  });

  const searchPromise = new Promise((resolve, reject) => {
    const callbackName = `calil_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    window[callbackName] = (data) => {
      delete window[callbackName];
      
      // 進捗更新コールバックがある場合、取得できた図書館情報を即座に通知
      if (onProgressUpdate && data.books && data.books[normalizedISBN]) {
        const currentSystems = data.books[normalizedISBN];
        const systemKeys = Object.keys(currentSystems);
        
        console.log('カーリルAPI進捗更新 (初回):', {
          isbn: normalizedISBN,
          systemCount: systemKeys.length,
          continue: data.continue,
          systemKeys: systemKeys
        });
        
        onProgressUpdate({
          isbn: normalizedISBN,
          systems: currentSystems,
          title: isbn,
          isComplete: data.continue !== 1
        });
      }
      
      if (data.continue === 1) {
        // 継続検索が必要な場合
        setTimeout(() => {
          pollForResults(data.session, isbn, systemIds, data.books, resolve, reject, onProgressUpdate, normalizedISBN, 1);
        }, 1000); // 間隔を500msから1000msに延長
      } else {
        // 検索完了
        resolve({
          isbn: normalizedISBN,
          systems: data.books?.[normalizedISBN] || {},
          title: isbn
        });
      }
    };

    const script = document.createElement('script');
    script.src = apiUrl.replace('callback=?', `callback=${callbackName}`);
    script.onerror = () => {
      delete window[callbackName];
      reject(new Error('カーリルAPI呼び出しに失敗しました'));
    };
    
    document.head.appendChild(script);
    setTimeout(() => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    }, 100);
  });

  // タイムアウトと競合させる
  return Promise.race([searchPromise, timeoutPromise]);
};

/**
 * 継続検索のポーリング
 * @param {string} sessionId - セッションID
 * @param {string} isbn - ISBN
 * @param {string[]} systemIds - システムID配列
 * @param {Object} currentResults - 現在の結果
 * @param {Function} resolve - Promise resolve
 * @param {Function} reject - Promise reject
 * @param {Function} onProgressUpdate - 進捗更新コールバック関数
 * @param {string} normalizedISBN - 正規化されたISBN
 * @param {number} pollCount - ポーリング回数
 */
const pollForResults = async (sessionId, isbn, systemIds, currentResults, resolve, reject, onProgressUpdate = null, normalizedISBN = null, pollCount = 0) => {
  // 最大ポーリング回数制限（30回まで）
  const MAX_POLL_COUNT = 30;
  
  if (pollCount >= MAX_POLL_COUNT) {
    console.warn('カーリルAPIポーリング回数上限に達しました。現在の結果で完了します。');
    const finalNormalizedISBN = normalizedISBN || normalizeISBN(isbn);
    resolve({
      isbn: finalNormalizedISBN,
      systems: currentResults?.[finalNormalizedISBN] || {},
      title: isbn
    });
    return;
  }
  
  const pollUrl = `https://api.calil.jp/check?appkey=${CALIL_API_KEY}&session=${sessionId}&format=json&callback=?`;
  
  const callbackName = `calil_poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  window[callbackName] = (data) => {
    delete window[callbackName];
    
    // 進捗更新コールバックがある場合、取得できた図書館情報を即座に通知
    if (onProgressUpdate && data.books && normalizedISBN && data.books[normalizedISBN]) {
      const currentSystems = data.books[normalizedISBN];
      const systemKeys = Object.keys(currentSystems);
      
      console.log('カーリルAPIポーリング進捗更新:', {
        isbn: normalizedISBN,
        systemCount: systemKeys.length,
        continue: data.continue,
        systemKeys: systemKeys,
        pollCount: pollCount + 1,
        maxPollCount: MAX_POLL_COUNT
      });
      
      onProgressUpdate({
        isbn: normalizedISBN,
        systems: currentSystems,
        title: isbn,
        isComplete: data.continue !== 1
      });
    }
    
    if (data.continue === 1) {
      // まだ継続が必要
      setTimeout(() => {
        pollForResults(sessionId, isbn, systemIds, data.books, resolve, reject, onProgressUpdate, normalizedISBN, pollCount + 1);
      }, 1000); // 間隔を500msから1000msに延長
    } else {
      // 検索完了
      const finalNormalizedISBN = normalizedISBN || normalizeISBN(isbn);
      resolve({
        isbn: finalNormalizedISBN,
        systems: data.books?.[finalNormalizedISBN] || {},
        title: isbn
      });
    }
  };

  const script = document.createElement('script');
  script.src = pollUrl.replace('callback=?', `callback=${callbackName}`);
  script.onerror = () => {
    delete window[callbackName];
    reject(new Error('カーリルAPIポーリングに失敗しました'));
  };
  
  document.head.appendChild(script);
  setTimeout(() => {
    if (document.head.contains(script)) {
      document.head.removeChild(script);
    }
  }, 100);
};

/**
 * カーリルAPIの利用可能性をチェック
 * @returns {boolean} 利用可能かどうか
 */
export const isCalilAPIAvailable = () => {
  return !!CALIL_API_KEY;
};