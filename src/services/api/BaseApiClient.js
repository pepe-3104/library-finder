/**
 * 基盤APIクライアント
 * 全APIサービスの共通機能を提供
 */

import { createError, withTimeout } from '../../utils/errors';
import { makeJsonpRequest } from '../../utils/common';

export class BaseApiClient {
  constructor(config) {
    this.config = {
      timeout: 15000,
      retryCount: 3,
      retryDelay: 1000,
      ...config
    };
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }

  /**
   * HTTPリクエストを実行
   * @param {string} url - リクエストURL
   * @param {Object} options - リクエストオプション
   * @returns {Promise<Object>} レスポンス
   */
  async makeHttpRequest(url, options = {}) {
    const requestOptions = {
      method: 'GET',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    // レート制限の適用
    await this.enforceRateLimit();

    try {
      const response = await withTimeout(
        fetch(url, requestOptions),
        this.config.timeout,
        `HTTP request to ${url}`
      );

      if (!response.ok) {
        throw createError.apiRequestFailed(this.config.name, response.status);
      }

      const data = await response.json();
      this.requestCount++;
      return data;
    } catch (error) {
      if (error.name === 'LibrarySearchError') {
        throw error;
      }
      throw createError.network(error);
    }
  }

  /**
   * JSONPリクエストを実行
   * @param {string} url - リクエストURL（callback=?を含む）
   * @param {Object} options - リクエストオプション
   * @returns {Promise<Object>} レスポンス
   */
  async makeJsonpRequest(url, options = {}) {
    await this.enforceRateLimit();

    try {
      const data = await withTimeout(
        makeJsonpRequest(url, {
          timeout: this.config.timeout,
          callbackPrefix: options.callbackPrefix || 'api_callback',
          ...options
        }),
        this.config.timeout,
        `JSONP request to ${url}`
      );

      this.requestCount++;
      return data;
    } catch (error) {
      if (error.name === 'LibrarySearchError') {
        throw error;
      }
      throw createError.network(error);
    }
  }

  /**
   * リトライ付きリクエスト実行
   * @param {Function} requestFn - リクエスト関数
   * @param {number} maxRetries - 最大リトライ回数
   * @returns {Promise<Object>} レスポンス
   */
  async makeRequestWithRetry(requestFn, maxRetries = this.config.retryCount) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        // 最後の試行または致命的なエラーの場合はリトライしない
        if (attempt === maxRetries || this.isFatalError(error)) {
          throw error;
        }

        // リトライ前の待機
        await this.delay(this.config.retryDelay * Math.pow(2, attempt));
      }
    }

    throw lastError;
  }

  /**
   * レート制限の適用
   */
  async enforceRateLimit() {
    if (!this.config.rateLimit) return;

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = (60 * 1000) / this.config.rateLimit; // 1分あたりのリクエスト数から間隔を計算

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await this.delay(waitTime);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * エラーが致命的（リトライ不要）かどうかを判定
   * @param {Error} error - エラーオブジェクト
   * @returns {boolean} 致命的なエラーかどうか
   */
  isFatalError(error) {
    if (error.name === 'LibrarySearchError') {
      // APIキー不足、不正なリクエストなどはリトライ不要
      return ['API_KEY_MISSING', 'INVALID_ISBN', 'INVALID_SEARCH_QUERY'].includes(error.code);
    }
    return false;
  }

  /**
   * 指定時間待機
   * @param {number} ms - 待機時間（ミリ秒）
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * APIクライアントの統計情報を取得
   * @returns {Object} 統計情報
   */
  getStats() {
    return {
      name: this.config.name,
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      config: {
        timeout: this.config.timeout,
        retryCount: this.config.retryCount,
        rateLimit: this.config.rateLimit
      }
    };
  }

  /**
   * 統計情報をリセット
   */
  resetStats() {
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }
}