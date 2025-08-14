/**
 * 共通ユーティリティ関数
 * アプリケーション全体で使用される汎用的な関数を定義
 */

/**
 * ISBNを正規化（ハイフンとスペースを除去）
 * @param {string} isbn - ISBN文字列
 * @returns {string} 正規化されたISBN
 */
export const normalizeISBN = (isbn) => {
  if (!isbn) return '';
  return isbn.replace(/[-\s]/g, '');
};

/**
 * Haversine公式による2点間の距離計算（km単位）
 * @param {number} lat1 - 地点1の緯度
 * @param {number} lon1 - 地点1の経度
 * @param {number} lat2 - 地点2の緯度
 * @param {number} lon2 - 地点2の経度
 * @returns {number} 距離（km、小数点以下2桁）
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // 地球の半径 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

/**
 * 一意なコールバック名を生成
 * @param {string} prefix - コールバック名のプレフィックス
 * @returns {string} 一意なコールバック名
 */
export const generateCallbackName = (prefix = 'callback') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * JSONPリクエストを実行する汎用関数
 * @param {string} url - リクエストURL（callback=?を含む）
 * @param {Object} options - オプション設定
 * @param {number} options.timeout - タイムアウト時間（ミリ秒）
 * @param {string} options.callbackPrefix - コールバック名のプレフィックス
 * @returns {Promise} JSONPリクエストのPromise
 */
export const makeJsonpRequest = (url, options = {}) => {
  const { timeout = 15000, callbackPrefix = 'jsonp_callback' } = options;
  
  return new Promise((resolve, reject) => {
    const callbackName = generateCallbackName(callbackPrefix);
    let timeoutId = null;
    let script = null;

    // クリーンアップ関数
    const cleanup = () => {
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
      } catch (error) {
        console.warn('JSONP cleanup error:', error);
      }
    };

    // コールバック関数を定義
    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    // タイムアウト設定
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`JSONP request timeout (${timeout}ms)`));
    }, timeout);

    // スクリプト要素を作成
    script = document.createElement('script');
    script.onerror = () => {
      cleanup();
      reject(new Error('JSONP request failed'));
    };

    // URL設定とDOM追加
    try {
      script.src = url.replace('callback=?', `callback=${callbackName}`);
      document.head.appendChild(script);
    } catch (error) {
      cleanup();
      reject(new Error(`JSONP request initialization failed: ${error.message}`));
    }
  });
};

/**
 * 文字列が空かどうかをチェック
 * @param {string} str - チェック対象の文字列
 * @returns {boolean} 空文字列の場合true
 */
export const isEmpty = (str) => {
  return !str || str.trim().length === 0;
};

/**
 * 数値の範囲チェック
 * @param {number} value - チェック対象の値
 * @param {number} min - 最小値
 * @param {number} max - 最大値
 * @returns {boolean} 範囲内の場合true
 */
export const isInRange = (value, min, max) => {
  return value >= min && value <= max;
};

/**
 * 遅延実行（指定時間待機）
 * @param {number} ms - 待機時間（ミリ秒）
 * @returns {Promise} 待機完了のPromise
 */
export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};