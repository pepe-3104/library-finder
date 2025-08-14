/**
 * 図書館検索統合サービス
 * 全APIサービスを統合し、統一されたインターフェースを提供
 */

import { RakutenBooksService } from './api/RakutenBooksService';
import { CalilApiService } from './api/CalilApiService';
import { OpenBDApiService } from './api/OpenBDApiService';
import { createError, errorLogger } from '../utils/errors';

export class LibrarySearchService {
  constructor() {
    // APIサービスインスタンス
    this.rakutenBooks = new RakutenBooksService();
    this.calil = new CalilApiService();
    this.openBD = new OpenBDApiService();
    
    // サービス統計
    this.searchStats = {
      totalSearches: 0,
      successfulSearches: 0,
      failedSearches: 0,
      apiUsage: {
        rakuten: 0,
        calil: 0,
        openbd: 0
      }
    };
  }

  /**
   * ISBN検索（統合）
   * 楽天Books -> OpenBD の順でフォールバック検索
   * @param {string} isbn - 検索するISBN
   * @param {string[]} systemIds - 図書館システムID（蔵書検索用）
   * @param {Object} options - 検索オプション
   * @returns {Promise<Object>} 統合された書籍情報
   */
  async searchByISBN(isbn, systemIds = [], options = {}) {
    const {
      includeLibraryData = true,
      enableFallback = true,
      onProgressUpdate = null
    } = options;

    this.searchStats.totalSearches++;

    try {
      let bookInfo = null;
      let primarySource = 'unknown';

      // 楽天Books APIで検索
      if (this.rakutenBooks.isAvailable()) {
        try {
          bookInfo = await this.rakutenBooks.searchByISBN(isbn);
          if (bookInfo) {
            primarySource = 'rakuten';
            this.searchStats.apiUsage.rakuten++;
          }
        } catch (searchError) {
          errorLogger.log(searchError, { operation: 'rakuten-isbn-search', isbn });
          
          if (!enableFallback) {
            throw searchError;
          }
        }
      }

      // 楽天で見つからない場合、OpenBDで検索
      if (!bookInfo && enableFallback) {
        try {
          bookInfo = await this.openBD.searchByISBN(isbn);
          if (bookInfo) {
            primarySource = 'openbd';
            this.searchStats.apiUsage.openbd++;
          }
        } catch (searchError) {
          errorLogger.log(searchError, { operation: 'openbd-isbn-search', isbn });
        }
      }

      // 書籍情報が見つからない場合
      if (!bookInfo) {
        this.searchStats.failedSearches++;
        return null;
      }

      // 蔵書情報を追加
      if (includeLibraryData && systemIds.length > 0) {
        try {
          const libraryData = await this.calil.searchLibraryBooks(
            isbn,
            systemIds,
            onProgressUpdate
          );
          
          bookInfo.systems = libraryData.systems || {};
          bookInfo.isLibraryDataLoaded = true;
          this.searchStats.apiUsage.calil++;
        } catch (searchError) {
          errorLogger.log(searchError, { operation: 'calil-library-search', isbn });
          
          // 蔵書検索失敗は致命的ではない
          bookInfo.systems = {};
          bookInfo.isLibraryDataLoaded = false;
          bookInfo.libraryDataError = searchError.message;
        }
      }

      // メタ情報を追加
      bookInfo.searchMetadata = {
        primarySource,
        searchTime: new Date().toISOString(),
        hasLibraryData: includeLibraryData && systemIds.length > 0,
        librarySystemCount: systemIds.length
      };

      this.searchStats.successfulSearches++;
      return bookInfo;
    } catch (error) {
      this.searchStats.failedSearches++;
      errorLogger.log(error, { operation: 'searchByISBN-integrated', isbn });
      throw error;
    }
  }

  /**
   * タイトル検索（楽天Books）
   * @param {string} title - 検索タイトル
   * @param {Object} options - 検索オプション
   * @returns {Promise<Object>} 検索結果
   */
  async searchByTitle(title, options = {}) {
    const {
      hits = 10,
      page = 1,
      systemIds = [],
      includeLibraryData = false
    } = options;

    this.searchStats.totalSearches++;

    try {
      if (!this.rakutenBooks.isAvailable()) {
        throw createError.serviceUnavailable('楽天Books');
      }

      const searchResult = await this.rakutenBooks.searchByTitle(title, hits, page);
      this.searchStats.apiUsage.rakuten++;

      // 蔵書情報を一括取得（オプション）
      if (includeLibraryData && systemIds.length > 0 && searchResult.books.length > 0) {
        try {
          const booksWithLibraryData = await this.addLibraryDataToBatch(
            searchResult.books,
            systemIds,
            3 // バッチサイズ
          );
          searchResult.books = booksWithLibraryData;
        } catch (error) {
          errorLogger.log(error, { operation: 'batch-library-data-add', title });
          // 蔵書データ追加失敗は警告レベル
        }
      }

      this.searchStats.successfulSearches++;
      return searchResult;
    } catch (error) {
      this.searchStats.failedSearches++;
      errorLogger.log(error, { operation: 'searchByTitle-integrated', title });
      throw error;
    }
  }

  /**
   * 著者検索（楽天Books）
   * @param {string} author - 検索著者名
   * @param {Object} options - 検索オプション
   * @returns {Promise<Object>} 検索結果
   */
  async searchByAuthor(author, options = {}) {
    const {
      hits = 10,
      page = 1,
      systemIds = [],
      includeLibraryData = false
    } = options;

    this.searchStats.totalSearches++;

    try {
      if (!this.rakutenBooks.isAvailable()) {
        throw createError.serviceUnavailable('楽天Books');
      }

      const searchResult = await this.rakutenBooks.searchByAuthor(author, hits, page);
      this.searchStats.apiUsage.rakuten++;

      // 蔵書情報を一括取得（オプション）
      if (includeLibraryData && systemIds.length > 0 && searchResult.books.length > 0) {
        try {
          const booksWithLibraryData = await this.addLibraryDataToBatch(
            searchResult.books,
            systemIds,
            3
          );
          searchResult.books = booksWithLibraryData;
        } catch (error) {
          errorLogger.log(error, { operation: 'batch-library-data-add', author });
        }
      }

      this.searchStats.successfulSearches++;
      return searchResult;
    } catch (error) {
      this.searchStats.failedSearches++;
      errorLogger.log(error, { operation: 'searchByAuthor-integrated', author });
      throw error;
    }
  }

  /**
   * 複数書籍の蔵書情報を並列取得
   * @param {Object[]} books - 書籍配列
   * @param {string[]} systemIds - システムID配列
   * @param {number} batchSize - バッチサイズ
   * @returns {Promise<Object[]>} 蔵書情報付き書籍配列
   */
  async addLibraryDataToBatch(books, systemIds, batchSize = 3) {
    if (!books || books.length === 0 || !systemIds || systemIds.length === 0) {
      return books;
    }

    const updatedBooks = [];

    // バッチ処理で蔵書情報を取得
    for (let i = 0; i < books.length; i += batchSize) {
      const batch = books.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (book) => {
        if (!book.isbn) {
          return { ...book, systems: {}, isLibraryDataLoaded: false };
        }

        try {
          const libraryData = await this.calil.searchLibraryBooks(book.isbn, systemIds);
          this.searchStats.apiUsage.calil++;
          
          return {
            ...book,
            systems: libraryData.systems || {},
            isLibraryDataLoaded: true,
            isLibraryDataLoading: false
          };
        } catch (error) {
          errorLogger.log(error, { operation: 'addLibraryDataToBatch', isbn: book.isbn });
          
          return {
            ...book,
            systems: {},
            isLibraryDataLoaded: false,
            libraryDataError: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      updatedBooks.push(...batchResults);

      // バッチ間の待機（レート制限対応）
      if (i + batchSize < books.length) {
        await this.delay(500);
      }
    }

    return updatedBooks;
  }

  /**
   * 単一書籍の蔵書情報を取得
   * @param {string} isbn - ISBN
   * @param {string[]} systemIds - システムID配列
   * @param {Function} onProgressUpdate - 進捗更新コールバック
   * @returns {Promise<Object>} 蔵書情報
   */
  async getLibraryDataForBook(isbn, systemIds, onProgressUpdate = null) {
    try {
      const libraryData = await this.calil.searchLibraryBooks(isbn, systemIds, onProgressUpdate);
      this.searchStats.apiUsage.calil++;
      return libraryData;
    } catch (error) {
      errorLogger.log(error, { operation: 'getLibraryDataForBook', isbn });
      throw error;
    }
  }

  /**
   * ジャンル別人気書籍を取得
   * @param {string} genreId - ジャンルID
   * @param {Object} options - オプション
   * @returns {Promise<Object>} 人気書籍リスト
   */
  async getPopularBooksByGenre(genreId, options = {}) {
    const { hits = 20, page = 1 } = options;

    try {
      if (!this.rakutenBooks.isAvailable()) {
        throw createError.serviceUnavailable('楽天Books');
      }

      const result = await this.rakutenBooks.getPopularBooksByGenre(genreId, hits, page);
      this.searchStats.apiUsage.rakuten++;
      return result;
    } catch (error) {
      errorLogger.log(error, { operation: 'getPopularBooksByGenre', genreId });
      throw error;
    }
  }

  /**
   * 利用可能なサービス情報を取得
   * @returns {Object} サービス情報
   */
  getAvailableServices() {
    return {
      rakutenBooks: this.rakutenBooks.getServiceInfo(),
      calil: this.calil.getServiceInfo(),
      openBD: this.openBD.getServiceInfo(),
      integrated: {
        name: 'LibrarySearchService',
        available: true,
        stats: this.searchStats,
        features: [
          'ISBN統合検索（楽天Books + OpenBD）',
          'タイトル・著者検索（楽天Books）',
          '蔵書検索（カーリル）',
          'バッチ処理対応',
          'フォールバック機能',
          '進捗追跡'
        ]
      }
    };
  }

  /**
   * 統計情報をリセット
   */
  resetStats() {
    this.searchStats = {
      totalSearches: 0,
      successfulSearches: 0,
      failedSearches: 0,
      apiUsage: {
        rakuten: 0,
        calil: 0,
        openbd: 0
      }
    };

    // 各APIクライアントの統計もリセット
    this.rakutenBooks.resetStats();
    this.calil.resetStats();
    this.openBD.resetStats();
  }

  /**
   * 待機関数
   * @param {number} ms - 待機時間（ミリ秒）
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 全サービスの接続テスト
   * @returns {Promise<Object>} 接続テスト結果
   */
  async testAllConnections() {
    const results = {
      rakutenBooks: false,
      calil: false,
      openBD: false,
      timestamp: new Date().toISOString()
    };

    // 楽天Books接続テスト
    try {
      results.rakutenBooks = this.rakutenBooks.isAvailable();
    } catch {
      results.rakutenBooks = false;
    }

    // カーリル接続テスト
    try {
      results.calil = this.calil.isAvailable();
    } catch {
      results.calil = false;
    }

    // OpenBD接続テスト
    try {
      results.openBD = await this.openBD.testConnection();
    } catch {
      results.openBD = false;
    }

    return results;
  }
}