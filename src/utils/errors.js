/**
 * 統一エラーハンドリングシステム
 * アプリケーション全体で使用される一貫したエラー管理
 */

/**
 * エラーコード定数
 */
export const ERROR_CODES = {
  // API関連エラー
  API_KEY_MISSING: 'API_KEY_MISSING',
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
  API_TIMEOUT: 'API_TIMEOUT',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  
  // 検索関連エラー
  NO_RESULTS: 'NO_RESULTS',
  INVALID_ISBN: 'INVALID_ISBN',
  INVALID_SEARCH_QUERY: 'INVALID_SEARCH_QUERY',
  
  // 位置情報関連エラー
  GEOLOCATION_DENIED: 'GEOLOCATION_DENIED',
  GEOLOCATION_UNAVAILABLE: 'GEOLOCATION_UNAVAILABLE',
  GEOLOCATION_TIMEOUT: 'GEOLOCATION_TIMEOUT',
  
  // 図書館関連エラー
  LIBRARY_DATA_FAILED: 'LIBRARY_DATA_FAILED',
  LIBRARY_SYSTEM_UNAVAILABLE: 'LIBRARY_SYSTEM_UNAVAILABLE',
  
  // ネットワーク関連エラー
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  
  // 一般的なエラー
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INITIALIZATION_FAILED: 'INITIALIZATION_FAILED'
};

/**
 * 統一エラークラス
 */
export class LibrarySearchError extends Error {
  constructor(message, code, cause = null, userMessage = null) {
    super(message);
    this.name = 'LibrarySearchError';
    this.code = code;
    this.cause = cause;
    this.userMessage = userMessage || this.generateUserMessage(code);
    this.timestamp = new Date().toISOString();
    
    // スタックトレースを正しく設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LibrarySearchError);
    }
  }

  /**
   * エラーコードに基づいてユーザー向けメッセージを生成
   * @param {string} code - エラーコード
   * @returns {string} ユーザー向けメッセージ
   */
  generateUserMessage(code) {
    const userMessages = {
      [ERROR_CODES.API_KEY_MISSING]: 'サービス設定に問題があります。管理者にお問い合わせください。',
      [ERROR_CODES.API_REQUEST_FAILED]: 'データの取得に失敗しました。しばらく待ってから再度お試しください。',
      [ERROR_CODES.API_TIMEOUT]: 'サーバーの応答に時間がかかっています。しばらく待ってから再度お試しください。',
      [ERROR_CODES.API_RATE_LIMIT]: 'リクエストが多すぎます。しばらく待ってから再度お試しください。',
      
      [ERROR_CODES.NO_RESULTS]: '検索条件に一致する結果が見つかりませんでした。',
      [ERROR_CODES.INVALID_ISBN]: 'ISBNの形式を確認してください（10桁または13桁の数字）。',
      [ERROR_CODES.INVALID_SEARCH_QUERY]: '検索キーワードを入力してください。',
      
      [ERROR_CODES.GEOLOCATION_DENIED]: '位置情報の使用が許可されていません。ブラウザの設定を確認してください。',
      [ERROR_CODES.GEOLOCATION_UNAVAILABLE]: '位置情報が利用できません。',
      [ERROR_CODES.GEOLOCATION_TIMEOUT]: '位置情報の取得がタイムアウトしました。再度お試しください。',
      
      [ERROR_CODES.LIBRARY_DATA_FAILED]: '図書館の蔵書情報の取得に失敗しました。',
      [ERROR_CODES.LIBRARY_SYSTEM_UNAVAILABLE]: '図書館システムが一時的に利用できません。',
      
      [ERROR_CODES.NETWORK_ERROR]: 'ネットワーク接続を確認してください。',
      [ERROR_CODES.CONNECTION_TIMEOUT]: '接続がタイムアウトしました。ネットワーク状況を確認してください。',
      
      [ERROR_CODES.UNKNOWN_ERROR]: '予期しないエラーが発生しました。',
      [ERROR_CODES.INITIALIZATION_FAILED]: 'アプリケーションの初期化に失敗しました。'
    };
    
    return userMessages[code] || userMessages[ERROR_CODES.UNKNOWN_ERROR];
  }

  /**
   * エラー詳細をJSON形式で取得
   * @returns {Object} エラー詳細オブジェクト
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      userMessage: this.userMessage,
      timestamp: this.timestamp,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message
      } : null
    };
  }
}

/**
 * 共通エラー生成関数
 */
export const createError = {
  /**
   * APIキー不足エラー
   * @param {string} apiName - API名
   * @returns {LibrarySearchError}
   */
  apiKeyMissing(apiName) {
    return new LibrarySearchError(
      `${apiName} APIキーが設定されていません`,
      ERROR_CODES.API_KEY_MISSING
    );
  },

  /**
   * APIリクエストエラー
   * @param {string} apiName - API名
   * @param {number} status - HTTPステータスコード
   * @param {Error} cause - 原因となったエラー
   * @returns {LibrarySearchError}
   */
  apiRequestFailed(apiName, status, cause) {
    return new LibrarySearchError(
      `${apiName} API request failed with status ${status}`,
      ERROR_CODES.API_REQUEST_FAILED,
      cause
    );
  },

  /**
   * タイムアウトエラー
   * @param {string} operation - タイムアウトした操作
   * @param {number} timeout - タイムアウト時間（ミリ秒）
   * @returns {LibrarySearchError}
   */
  timeout(operation, timeout) {
    return new LibrarySearchError(
      `${operation} timed out after ${timeout}ms`,
      ERROR_CODES.API_TIMEOUT
    );
  },

  /**
   * 検索結果なしエラー
   * @param {string} query - 検索クエリ
   * @param {string} searchType - 検索タイプ
   * @returns {LibrarySearchError}
   */
  noResults(query, searchType) {
    return new LibrarySearchError(
      `No results found for ${searchType} search: "${query}"`,
      ERROR_CODES.NO_RESULTS
    );
  },

  /**
   * 無効なISBNエラー
   * @param {string} isbn - 無効なISBN
   * @returns {LibrarySearchError}
   */
  invalidISBN(isbn) {
    return new LibrarySearchError(
      `Invalid ISBN format: ${isbn}`,
      ERROR_CODES.INVALID_ISBN
    );
  },

  /**
   * 位置情報エラー
   * @param {string} message - エラーメッセージ
   * @param {string} code - 位置情報エラーコード
   * @returns {LibrarySearchError}
   */
  geolocation(message, code) {
    const errorCodeMap = {
      1: ERROR_CODES.GEOLOCATION_DENIED,
      2: ERROR_CODES.GEOLOCATION_UNAVAILABLE,
      3: ERROR_CODES.GEOLOCATION_TIMEOUT
    };
    
    return new LibrarySearchError(
      message,
      errorCodeMap[code] || ERROR_CODES.GEOLOCATION_UNAVAILABLE
    );
  },

  /**
   * ネットワークエラー
   * @param {Error} cause - 原因となったエラー
   * @returns {LibrarySearchError}
   */
  network(cause) {
    return new LibrarySearchError(
      'Network request failed',
      ERROR_CODES.NETWORK_ERROR,
      cause
    );
  }
};

/**
 * エラーロガー
 */
export const errorLogger = {
  /**
   * エラーをコンソールに記録
   * @param {LibrarySearchError} error - 記録するエラー
   * @param {Object} context - 追加のコンテキスト情報
   */
  log(error, context = {}) {
    const logData = {
      ...error.toJSON(),
      context,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    if (error.code === ERROR_CODES.UNKNOWN_ERROR) {
      console.error('🚨 Critical Error:', logData);
    } else {
      console.warn('⚠️ Application Error:', logData);
    }
  },

  /**
   * 開発環境でのデバッグ情報記録
   * @param {LibrarySearchError} error - 記録するエラー
   * @param {Object} debugInfo - デバッグ情報
   */
  debug(error, debugInfo = {}) {
    if (import.meta.env.DEV) {
      console.group(`🔍 Debug Info: ${error.code}`);
      console.log('Error:', error);
      console.log('Context:', debugInfo);
      console.log('Stack:', error.stack);
      console.groupEnd();
    }
  }
};

/**
 * エラーハンドリングユーティリティ
 */
export const handleError = {
  /**
   * 非同期関数のエラーをキャッチしてLibrarySearchErrorに変換
   * @param {Function} asyncFn - 非同期関数
   * @param {string} operation - 操作名
   * @returns {Function} エラーハンドリング付きの関数
   */
  async(asyncFn, operation) {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        if (error instanceof LibrarySearchError) {
          throw error;
        }
        
        // 一般的なエラーをLibrarySearchErrorに変換
        const wrappedError = new LibrarySearchError(
          `${operation} failed: ${error.message}`,
          ERROR_CODES.UNKNOWN_ERROR,
          error
        );
        
        errorLogger.log(wrappedError, { operation, args });
        throw wrappedError;
      }
    };
  },

  /**
   * fetch APIのエラーをハンドリング
   * @param {Response} response - fetchのレスポンス
   * @param {string} apiName - API名
   * @returns {Response} レスポンス（エラーの場合は例外をthrow）
   */
  fetchResponse(response, apiName) {
    if (!response.ok) {
      throw createError.apiRequestFailed(apiName, response.status);
    }
    return response;
  }
};

/**
 * Promise用のタイムアウト機能
 * @param {Promise} promise - タイムアウトを適用するPromise
 * @param {number} timeoutMs - タイムアウト時間（ミリ秒）
 * @param {string} operation - 操作名
 * @returns {Promise} タイムアウト機能付きのPromise
 */
export const withTimeout = (promise, timeoutMs, operation) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(createError.timeout(operation, timeoutMs));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
};