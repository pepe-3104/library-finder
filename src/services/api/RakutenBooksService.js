/**
 * 楽天Books APIサービス
 * 楽天Books APIへの全アクセスを抽象化
 */

import { BaseApiClient } from './BaseApiClient';
import { getApiKey, getApiConfig } from '../../config/apiConfig';
import { createError, errorLogger } from '../../utils/errors';
import { normalizeISBN } from '../../utils/common';

export class RakutenBooksService extends BaseApiClient {
  constructor() {
    const config = getApiConfig.rakuten();
    super({
      ...config,
      name: '楽天Books'
    });
  }

  /**
   * APIキーを取得
   * @returns {string} APIキー
   * @throws {LibrarySearchError} APIキーが利用できない場合
   */
  getApiKey() {
    const result = getApiKey.rakuten();
    if (!result.isAvailable) {
      throw result.error;
    }
    return result.key;
  }

  /**
   * タイトル検索（ページング対応）
   * @param {string} title - 検索タイトル
   * @param {number} hits - 取得件数
   * @param {number} page - ページ番号
   * @returns {Promise<Object>} 検索結果
   */
  async searchByTitle(title, hits = 10, page = 1) {
    if (!title || !title.trim()) {
      throw createError.invalidSearchQuery();
    }

    const apiKey = this.getApiKey();
    const params = new URLSearchParams({
      format: 'json',
      applicationId: apiKey,
      title: title.trim(),
      hits: Math.min(hits, 30).toString(),
      page: page.toString(),
      sort: 'sales', // 売れ筋順
      availability: '1', // 在庫ありのみ
      orFlag: '1' // OR検索
    });

    const url = `${this.config.baseUrl}/BooksBook/Search/20170404?${params}`;

    try {
      const data = await this.makeRequestWithRetry(() => 
        this.makeHttpRequest(url)
      );

      return this.transformSearchResponse(data, hits, page);
    } catch (error) {
      errorLogger.log(error, { operation: 'searchByTitle', title, hits, page });
      throw error;
    }
  }

  /**
   * 著者検索（ページング対応）
   * @param {string} author - 検索著者名
   * @param {number} hits - 取得件数
   * @param {number} page - ページ番号
   * @returns {Promise<Object>} 検索結果
   */
  async searchByAuthor(author, hits = 10, page = 1) {
    if (!author || !author.trim()) {
      throw createError.invalidSearchQuery();
    }

    const apiKey = this.getApiKey();
    const params = new URLSearchParams({
      format: 'json',
      applicationId: apiKey,
      author: author.trim(),
      hits: Math.min(hits, 30).toString(),
      page: page.toString(),
      sort: 'sales',
      availability: '1',
      orFlag: '1'
    });

    const url = `${this.config.baseUrl}/BooksBook/Search/20170404?${params}`;

    try {
      const data = await this.makeRequestWithRetry(() => 
        this.makeHttpRequest(url)
      );

      return this.transformSearchResponse(data, hits, page);
    } catch (error) {
      errorLogger.log(error, { operation: 'searchByAuthor', author, hits, page });
      throw error;
    }
  }

  /**
   * ISBN検索
   * @param {string} isbn - 検索するISBN
   * @returns {Promise<Object|null>} 書籍情報
   */
  async searchByISBN(isbn) {
    if (!isbn || !isbn.trim()) {
      throw createError.invalidISBN(isbn);
    }

    const normalizedISBN = normalizeISBN(isbn);
    const apiKey = this.getApiKey();
    const params = new URLSearchParams({
      format: 'json',
      applicationId: apiKey,
      isbn: normalizedISBN,
      hits: '1'
    });

    const url = `${this.config.baseUrl}/BooksBook/Search/20170404?${params}`;

    try {
      const data = await this.makeRequestWithRetry(() => 
        this.makeHttpRequest(url)
      );

      if (!data.Items || data.Items.length === 0) {
        return null;
      }

      return this.transformBookItem(data.Items[0].Item);
    } catch (error) {
      errorLogger.log(error, { operation: 'searchByISBN', isbn });
      throw error;
    }
  }

  /**
   * ジャンル検索
   * @param {string} booksGenreId - ジャンルID
   * @returns {Promise<Array>} ジャンル情報配列
   */
  async getGenres(booksGenreId = '001') {
    const apiKey = this.getApiKey();
    const params = new URLSearchParams({
      format: 'json',
      applicationId: apiKey,
      booksGenreId: booksGenreId
    });

    const url = `${this.config.baseUrl}/BooksGenre/Search/20121128?${params}`;

    try {
      const data = await this.makeRequestWithRetry(() => 
        this.makeHttpRequest(url)
      );

      if (!data.children || data.children.length === 0) {
        return [];
      }

      return data.children.map((item) => {
        const child = item.child;
        return {
          id: child.booksGenreId,
          name: child.booksGenreName,
          level: child.genreLevel
        };
      });
    } catch (error) {
      errorLogger.log(error, { operation: 'getGenres', booksGenreId });
      return []; // ジャンル取得失敗は致命的ではない
    }
  }

  /**
   * ジャンル別人気書籍検索
   * @param {string} genreId - ジャンルID
   * @param {number} hits - 取得件数
   * @param {number} page - ページ番号
   * @returns {Promise<Object>} 検索結果
   */
  async getPopularBooksByGenre(genreId = '001', hits = 20, page = 1) {
    const apiKey = this.getApiKey();
    const params = new URLSearchParams({
      format: 'json',
      applicationId: apiKey,
      booksGenreId: genreId,
      sort: 'sales',
      hits: Math.min(hits, 30).toString(),
      page: page.toString()
    });

    const url = `${this.config.baseUrl}/BooksBook/Search/20170404?${params}`;

    try {
      const data = await this.makeRequestWithRetry(() => 
        this.makeHttpRequest(url)
      );

      return this.transformSearchResponse(data, hits, page);
    } catch (error) {
      errorLogger.log(error, { operation: 'getPopularBooksByGenre', genreId, hits, page });
      throw error;
    }
  }

  /**
   * 検索レスポンスを統一形式に変換
   * @param {Object} data - APIレスポンス
   * @param {number} hits - リクエストした件数
   * @param {number} page - ページ番号
   * @param {boolean} isPopular - 人気書籍検索かどうか
   * @returns {Object} 変換されたレスポンス
   */
  transformSearchResponse(data, hits, page) {
    const books = data.Items ? data.Items.map(item => 
      this.transformBookItem(item.Item)
    ) : [];

    return {
      books,
      totalCount: data.count || 0,
      pageInfo: {
        page: data.page || page,
        pageCount: data.pageCount || 0,
        hits: data.hits || hits,
        first: data.first || 1,
        last: data.last || Math.ceil((data.count || 0) / hits)
      }
    };
  }

  /**
   * 書籍アイテムを統一形式に変換
   * @param {Object} book - 楽天Books書籍データ
   * @param {boolean} isPopular - 人気書籍検索かどうか
   * @returns {Object} 変換された書籍データ
   */
  transformBookItem(book) {
    // 未来日判定
    let isFutureRelease = false;
    if (book.salesDate) {
      try {
        const dateStr = book.salesDate;
        const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        
        if (match) {
          const [, year, month, day] = match;
          const publishDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          const today = new Date();
          
          if (publishDate > today) {
            isFutureRelease = true;
          }
        }
      } catch {
        // 発売日の解析に失敗した場合は未来日ではないとみなす
      }
    }

    return {
      isbn: book.jan || book.isbn,
      title: book.title,
      titleKana: book.titleKana,
      author: book.author,
      authorKana: book.authorKana,
      publisher: book.publisherName,
      publishDate: book.salesDate,
      pubdate: book.salesDate, // 互換性のため
      imageUrl: book.mediumImageUrl || book.largeImageUrl || book.smallImageUrl,
      smallImageUrl: book.smallImageUrl,
      mediumImageUrl: book.mediumImageUrl,
      largeImageUrl: book.largeImageUrl,
      reviewCount: book.reviewCount,
      reviewAverage: book.reviewAverage,
      itemCaption: book.itemCaption,
      contents: book.contents,
      seriesName: book.seriesName,
      size: book.size,
      price: book.itemPrice,
      itemUrl: book.itemUrl,
      affiliateUrl: book.affiliateUrl,
      isbn10: book.isbn,
      isbn13: book.jan,
      isFutureRelease,
      // 蔵書検索関連の初期値
      isLibraryDataLoaded: false,
      isLibraryDataLoading: false,
      systems: {}
    };
  }

  /**
   * APIの利用可能性をチェック
   * @returns {boolean} 利用可能かどうか
   */
  isAvailable() {
    return getApiKey.rakuten().isAvailable;
  }

  /**
   * サービス情報を取得
   * @returns {Object} サービス情報
   */
  getServiceInfo() {
    return {
      name: 'RakutenBooks',
      available: this.isAvailable(),
      baseUrl: this.config.baseUrl,
      ...this.getStats()
    };
  }
}