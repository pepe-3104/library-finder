/**
 * カーリルAPIサービス
 * カーリル図書館API（蔵書検索）への全アクセスを抽象化
 */

import { BaseApiClient } from './BaseApiClient';
import { getApiKey, getApiConfig } from '../../config/apiConfig';
import { createError, errorLogger } from '../../utils/errors';
import { normalizeISBN } from '../../utils/common';

export class CalilApiService extends BaseApiClient {
  constructor() {
    const config = getApiConfig.calil();
    super({
      ...config,
      name: 'カーリル'
    });
    this.activeSessions = new Map(); // アクティブなセッション管理
  }

  /**
   * APIキーを取得
   * @returns {string} APIキー
   * @throws {LibrarySearchError} APIキーが利用できない場合
   */
  getApiKey() {
    const result = getApiKey.calil();
    if (!result.isAvailable) {
      throw result.error;
    }
    return result.key;
  }

  /**
   * 蔵書検索（進捗更新対応）
   * @param {string} isbn - 検索するISBN
   * @param {string[]} systemIds - 検索対象の図書館システムID配列
   * @param {Function} onProgressUpdate - 進捗更新コールバック関数
   * @returns {Promise<Object>} 蔵書検索結果
   */
  async searchLibraryBooks(isbn, systemIds, onProgressUpdate = null) {
    if (!isbn || !isbn.trim()) {
      throw createError.invalidISBN(isbn);
    }

    if (!systemIds || systemIds.length === 0) {
      return { isbn: normalizeISBN(isbn), systems: {}, title: isbn };
    }

    const normalizedISBN = normalizeISBN(isbn);
    const apiKey = this.getApiKey();
    const systemIdParam = systemIds.join(',');
    
    const baseUrl = `${this.config.baseUrl}/check`;
    const params = new URLSearchParams({
      appkey: apiKey,
      isbn: normalizedISBN,
      systemid: systemIdParam,
      format: 'json',
      callback: '?'
    });

    const apiUrl = `${baseUrl}?${params}`;

    try {
      // 初回検索リクエスト
      const initialResponse = await this.makeJsonpRequest(apiUrl, {
        callbackPrefix: 'calil_callback',
        timeout: this.config.timeout
      });

      // 進捗更新コールバックがある場合、初回結果を通知
      if (onProgressUpdate && initialResponse.books && initialResponse.books[normalizedISBN]) {
        const currentSystems = initialResponse.books[normalizedISBN];
        
        onProgressUpdate({
          isbn: normalizedISBN,
          systems: currentSystems,
          title: isbn,
          isComplete: initialResponse.continue !== 1
        });
      }

      // 継続検索が必要な場合
      if (initialResponse.continue === 1) {
        const finalResult = await this.pollForResults(
          initialResponse.session,
          isbn,
          normalizedISBN,
          initialResponse.books,
          onProgressUpdate
        );
        return finalResult;
      }

      // 初回で完了
      return {
        isbn: normalizedISBN,
        systems: initialResponse.books?.[normalizedISBN] || {},
        title: isbn
      };
    } catch (error) {
      errorLogger.log(error, { operation: 'searchLibraryBooks', isbn, systemIds: systemIds.length });
      throw error;
    }
  }

  /**
   * 継続検索のポーリング
   * @param {string} sessionId - セッションID
   * @param {string} originalISBN - 元のISBN
   * @param {string} normalizedISBN - 正規化されたISBN
   * @param {Object} currentResults - 現在の結果
   * @param {Function} onProgressUpdate - 進捗更新コールバック関数
   * @returns {Promise<Object>} 最終結果
   */
  async pollForResults(sessionId, originalISBN, normalizedISBN, currentResults, onProgressUpdate = null) {
    const MAX_POLL_COUNT = 30;
    const POLL_INTERVAL = 1000; // 1秒間隔
    
    let pollCount = 0;
    let latestResults = currentResults;

    // セッション管理
    this.activeSessions.set(sessionId, {
      isbn: normalizedISBN,
      startTime: Date.now(),
      pollCount: 0
    });

    try {
      while (pollCount < MAX_POLL_COUNT) {
        // ポーリング待機
        await this.delay(POLL_INTERVAL);
        pollCount++;

        const apiKey = this.getApiKey();
        const pollUrl = `${this.config.baseUrl}/check`;
        const params = new URLSearchParams({
          appkey: apiKey,
          session: sessionId,
          format: 'json',
          callback: '?'
        });

        const fullPollUrl = `${pollUrl}?${params}`;

        try {
          const pollResponse = await this.makeJsonpRequest(fullPollUrl, {
            callbackPrefix: 'calil_poll',
            timeout: this.config.timeout
          });

          // セッション情報を更新
          if (this.activeSessions.has(sessionId)) {
            this.activeSessions.get(sessionId).pollCount = pollCount;
          }

          // 結果を更新
          latestResults = pollResponse.books || latestResults;

          // 進捗更新コールバック
          if (onProgressUpdate && latestResults && latestResults[normalizedISBN]) {
            const currentSystems = latestResults[normalizedISBN];
            
            onProgressUpdate({
              isbn: normalizedISBN,
              systems: currentSystems,
              title: originalISBN,
              isComplete: pollResponse.continue !== 1,
              pollCount,
              maxPollCount: MAX_POLL_COUNT
            });
          }

          // 検索完了判定
          if (pollResponse.continue !== 1) {
            this.activeSessions.delete(sessionId);
            return {
              isbn: normalizedISBN,
              systems: latestResults?.[normalizedISBN] || {},
              title: originalISBN
            };
          }
        } catch (pollError) {
          errorLogger.log(pollError, { 
            operation: 'pollForResults', 
            sessionId, 
            pollCount,
            isbn: normalizedISBN 
          });
          
          // ポーリングエラーは継続を試みる（最大回数まで）
          if (pollCount >= MAX_POLL_COUNT) {
            throw pollError;
          }
        }
      }

      // 最大ポーリング回数に達した場合
      console.warn(`カーリルAPIポーリング回数上限に達しました (${MAX_POLL_COUNT}回)`);
      this.activeSessions.delete(sessionId);
      
      return {
        isbn: normalizedISBN,
        systems: latestResults?.[normalizedISBN] || {},
        title: originalISBN,
        timeout: true
      };
    } catch (error) {
      this.activeSessions.delete(sessionId);
      throw error;
    }
  }

  /**
   * 複数ISBNの並列蔵書検索
   * @param {string[]} isbns - ISBN配列
   * @param {string[]} systemIds - システムID配列
   * @param {Function} onProgressUpdate - 進捗更新コールバック
   * @param {number} batchSize - バッチサイズ
   * @returns {Promise<Object[]>} 検索結果配列
   */
  async searchLibraryBooksBatch(isbns, systemIds, onProgressUpdate = null, batchSize = 3) {
    if (!isbns || isbns.length === 0) {
      return [];
    }

    const results = [];
    
    // バッチ処理
    for (let i = 0; i < isbns.length; i += batchSize) {
      const batch = isbns.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (isbn) => {
        try {
          const result = await this.searchLibraryBooks(isbn, systemIds, onProgressUpdate);
          return result;
        } catch (error) {
          errorLogger.log(error, { operation: 'searchLibraryBooksBatch', isbn });
          return {
            isbn: normalizeISBN(isbn),
            systems: {},
            title: isbn,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // バッチ間の待機（レート制限対応）
      if (i + batchSize < isbns.length) {
        await this.delay(500);
      }
    }

    return results;
  }

  /**
   * アクティブセッション情報を取得
   * @returns {Object} セッション情報
   */
  getActiveSessions() {
    const sessions = {};
    
    for (const [sessionId, info] of this.activeSessions.entries()) {
      sessions[sessionId] = {
        ...info,
        duration: Date.now() - info.startTime
      };
    }
    
    return sessions;
  }

  /**
   * 特定セッションをキャンセル
   * @param {string} sessionId - キャンセルするセッションID
   */
  cancelSession(sessionId) {
    if (this.activeSessions.has(sessionId)) {
      this.activeSessions.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * 全セッションをクリア
   */
  clearAllSessions() {
    this.activeSessions.clear();
  }

  /**
   * APIの利用可能性をチェック
   * @returns {boolean} 利用可能かどうか
   */
  isAvailable() {
    return getApiKey.calil().isAvailable;
  }

  /**
   * サービス情報を取得
   * @returns {Object} サービス情報
   */
  getServiceInfo() {
    return {
      name: 'Calil',
      available: this.isAvailable(),
      baseUrl: this.config.baseUrl,
      activeSessions: this.activeSessions.size,
      ...this.getStats()
    };
  }
}