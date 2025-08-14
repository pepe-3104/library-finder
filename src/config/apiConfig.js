/**
 * API設定管理システム
 * 全てのAPIキーと設定を一元管理
 */

import { createError } from '../utils/errors';
import { API_TIMEOUTS, RETRY_CONFIG, LIMITS, CACHE_DURATIONS } from '../constants';

/**
 * APIキー取得結果の型定義
 * @typedef {Object} ApiKeyResult
 * @property {string|null} key - APIキー（取得失敗時はnull）
 * @property {boolean} isAvailable - 利用可能かどうか
 * @property {Error|null} error - エラー情報（成功時はnull）
 */

/**
 * API設定情報
 * @typedef {Object} ApiConfig
 * @property {string} name - API名
 * @property {string} envKey - 環境変数名
 * @property {string} baseUrl - ベースURL
 * @property {number} timeout - タイムアウト時間（ミリ秒）
 * @property {number} retryCount - リトライ回数
 * @property {number} rateLimit - レート制限（リクエスト/分）
 */

/**
 * API設定定数
 */
const API_CONFIGS = {
  RAKUTEN: {
    name: '楽天Books',
    envKey: 'VITE_RAKUTEN_API_KEY',
    baseUrl: 'https://app.rakuten.co.jp/services/api',
    timeout: API_TIMEOUTS.RAKUTEN_BOOKS,
    retryCount: RETRY_CONFIG.MAX_RETRIES.RAKUTEN,
    rateLimit: LIMITS.RATE_LIMITS.RAKUTEN
  },
  CALIL: {
    name: 'カーリル',
    envKey: 'VITE_CALIL_API_KEY',
    baseUrl: 'https://api.calil.jp',
    timeout: API_TIMEOUTS.CALIL_SEARCH,
    retryCount: RETRY_CONFIG.MAX_RETRIES.CALIL,
    rateLimit: LIMITS.RATE_LIMITS.CALIL
  },
  OPENBD: {
    name: 'openBD',
    envKey: null, // APIキー不要
    baseUrl: 'https://api.openbd.jp',
    timeout: API_TIMEOUTS.OPENBD,
    retryCount: RETRY_CONFIG.MAX_RETRIES.OPENBD,
    rateLimit: LIMITS.RATE_LIMITS.OPENBD
  }
};

/**
 * APIキー管理クラス
 */
class ApiKeyManager {
  constructor() {
    this._cache = new Map();
    this._lastValidated = new Map();
    this._validationInterval = CACHE_DURATIONS.API_KEY_VALIDATION;
  }

  /**
   * APIキーを取得
   * @param {string} apiName - API名（RAKUTEN, CALIL, OPENBD）
   * @returns {ApiKeyResult} APIキー取得結果
   */
  getApiKey(apiName) {
    const config = API_CONFIGS[apiName];
    if (!config) {
      return {
        key: null,
        isAvailable: false,
        error: new Error(`Unknown API: ${apiName}`)
      };
    }

    // APIキーが不要な場合
    if (!config.envKey) {
      return {
        key: null,
        isAvailable: true,
        error: null
      };
    }

    // キャッシュチェック
    const cacheKey = `${apiName}_key`;
    const lastValidated = this._lastValidated.get(cacheKey);
    const now = Date.now();
    
    if (this._cache.has(cacheKey) && 
        lastValidated && 
        (now - lastValidated) < this._validationInterval) {
      return this._cache.get(cacheKey);
    }

    // 環境変数から取得
    const apiKey = import.meta.env[config.envKey];
    const result = {
      key: apiKey || null,
      isAvailable: !!apiKey,
      error: apiKey ? null : createError.apiKeyMissing(config.name)
    };

    // キャッシュに保存
    this._cache.set(cacheKey, result);
    this._lastValidated.set(cacheKey, now);

    return result;
  }

  /**
   * API設定を取得
   * @param {string} apiName - API名
   * @returns {ApiConfig|null} API設定情報
   */
  getApiConfig(apiName) {
    return API_CONFIGS[apiName] || null;
  }

  /**
   * APIが利用可能かチェック
   * @param {string} apiName - API名
   * @returns {boolean} 利用可能かどうか
   */
  isApiAvailable(apiName) {
    const result = this.getApiKey(apiName);
    return result.isAvailable;
  }

  /**
   * 全APIの利用可能状況を取得
   * @returns {Object} 全APIの状況
   */
  getApiAvailability() {
    const availability = {};
    
    Object.keys(API_CONFIGS).forEach(apiName => {
      const result = this.getApiKey(apiName);
      availability[apiName] = {
        available: result.isAvailable,
        name: API_CONFIGS[apiName].name,
        error: result.error ? result.error.message : null
      };
    });

    return availability;
  }

  /**
   * APIキーキャッシュをクリア
   * @param {string} [apiName] - 特定のAPI名（省略時は全て）
   */
  clearCache(apiName = null) {
    if (apiName) {
      const cacheKey = `${apiName}_key`;
      this._cache.delete(cacheKey);
      this._lastValidated.delete(cacheKey);
    } else {
      this._cache.clear();
      this._lastValidated.clear();
    }
  }

  /**
   * 開発環境での設定確認
   * @returns {Object} 設定状況レポート
   */
  generateConfigReport() {
    if (!import.meta.env.DEV) {
      return { message: 'Configuration report is only available in development mode' };
    }

    const report = {
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
      apis: {}
    };

    Object.entries(API_CONFIGS).forEach(([apiName, config]) => {
      const result = this.getApiKey(apiName);
      report.apis[apiName] = {
        name: config.name,
        envKey: config.envKey,
        configured: result.isAvailable,
        baseUrl: config.baseUrl,
        timeout: config.timeout,
        error: result.error ? result.error.message : null
      };
    });

    return report;
  }
}

// シングルトンインスタンス
const apiKeyManager = new ApiKeyManager();

/**
 * APIキー取得のヘルパー関数
 */
export const getApiKey = {
  /**
   * 楽天Books APIキーを取得
   * @returns {ApiKeyResult}
   */
  rakuten() {
    return apiKeyManager.getApiKey('RAKUTEN');
  },

  /**
   * カーリルAPIキーを取得
   * @returns {ApiKeyResult}
   */
  calil() {
    return apiKeyManager.getApiKey('CALIL');
  },

  /**
   * openBD API設定を取得（キーは不要）
   * @returns {ApiKeyResult}
   */
  openbd() {
    return apiKeyManager.getApiKey('OPENBD');
  }
};

/**
 * API設定取得のヘルパー関数
 */
export const getApiConfig = {
  /**
   * 楽天Books API設定を取得
   * @returns {ApiConfig}
   */
  rakuten() {
    return apiKeyManager.getApiConfig('RAKUTEN');
  },

  /**
   * カーリルAPI設定を取得
   * @returns {ApiConfig}
   */
  calil() {
    return apiKeyManager.getApiConfig('CALIL');
  },

  /**
   * openBD API設定を取得
   * @returns {ApiConfig}
   */
  openbd() {
    return apiKeyManager.getApiConfig('OPENBD');
  }
};

/**
 * API利用可能性チェックのヘルパー関数
 */
export const isApiAvailable = {
  /**
   * 楽天Books APIが利用可能かチェック
   * @returns {boolean}
   */
  rakuten() {
    return apiKeyManager.isApiAvailable('RAKUTEN');
  },

  /**
   * カーリルAPIが利用可能かチェック
   * @returns {boolean}
   */
  calil() {
    return apiKeyManager.isApiAvailable('CALIL');
  },

  /**
   * openBD APIが利用可能かチェック
   * @returns {boolean}
   */
  openbd() {
    return apiKeyManager.isApiAvailable('OPENBD');
  }
};

/**
 * APIキー管理インスタンスのエクスポート
 * 高度な操作が必要な場合に使用
 */
export { apiKeyManager };

/**
 * 開発環境での便利関数
 */
export const dev = {
  /**
   * API設定レポートを生成
   * @returns {Object}
   */
  getConfigReport() {
    return apiKeyManager.generateConfigReport();
  },

  /**
   * 設定レポートをコンソールに出力
   */
  logConfigReport() {
    if (import.meta.env.DEV) {
      console.group('🔧 API Configuration Report');
      console.table(apiKeyManager.generateConfigReport().apis);
      console.groupEnd();
    }
  },

  /**
   * キャッシュをクリア
   * @param {string} [apiName] - 特定のAPI名
   */
  clearCache(apiName) {
    apiKeyManager.clearCache(apiName);
  }
};