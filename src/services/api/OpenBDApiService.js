/**
 * OpenBD APIサービス
 * OpenBD（書誌情報）APIへの全アクセスを抽象化
 */

import { BaseApiClient } from './BaseApiClient';
import { createError, errorLogger } from '../../utils/errors';
import { normalizeISBN } from '../../utils/common';

export class OpenBDApiService extends BaseApiClient {
  constructor() {
    // OpenBDはAPIキー不要でpublicなサービス
    super({
      name: 'OpenBD',
      baseUrl: 'https://api.openbd.jp',
      timeout: 10000,
      retryCount: 2,
      rateLimit: 100 // 1分間に100リクエスト
    });
  }

  /**
   * ISBN検索（単一）
   * @param {string} isbn - 検索するISBN
   * @returns {Promise<Object|null>} 書籍情報
   */
  async searchByISBN(isbn) {
    if (!isbn || !isbn.trim()) {
      throw createError.invalidISBN(isbn);
    }

    const normalizedISBN = normalizeISBN(isbn);
    const url = `${this.config.baseUrl}/v1/get?isbn=${normalizedISBN}`;

    try {
      const response = await this.makeRequestWithRetry(() => 
        this.makeHttpRequest(url)
      );

      // OpenBDは配列形式でレスポンスを返す
      if (!Array.isArray(response) || response.length === 0 || !response[0]) {
        return null;
      }

      const bookData = response[0];
      return this.transformBookData(bookData);
    } catch (error) {
      errorLogger.log(error, { operation: 'searchByISBN', isbn });
      
      // OpenBDでエラーが発生した場合はnullを返す（フォールバック扱い）
      if (error.name === 'LibrarySearchError' && error.code === 'API_REQUEST_FAILED') {
        return null;
      }
      
      throw error;
    }
  }

  /**
   * 複数ISBN検索（バッチ）
   * @param {string[]} isbns - ISBN配列（最大1000件）
   * @returns {Promise<Object[]>} 書籍情報配列
   */
  async searchByISBNs(isbns) {
    if (!isbns || isbns.length === 0) {
      return [];
    }

    // OpenBDの制限: 1回のリクエストで最大1000件
    const normalizedISBNs = isbns.map(isbn => normalizeISBN(isbn)).slice(0, 1000);
    const isbnParam = normalizedISBNs.join(',');
    const url = `${this.config.baseUrl}/v1/get?isbn=${isbnParam}`;

    try {
      const response = await this.makeRequestWithRetry(() => 
        this.makeHttpRequest(url)
      );

      if (!Array.isArray(response)) {
        return [];
      }

      // レスポンスを変換（nullの要素を除外）
      return response
        .map((bookData, index) => {
          if (!bookData) return null;
          
          try {
            return this.transformBookData(bookData);
          } catch (error) {
            errorLogger.log(error, { 
              operation: 'searchByISBNs', 
              isbn: normalizedISBNs[index],
              index 
            });
            return null;
          }
        })
        .filter(book => book !== null);
    } catch (error) {
      errorLogger.log(error, { operation: 'searchByISBNs', isbnCount: isbns.length });
      return []; // バッチ検索失敗時は空配列を返す
    }
  }

  /**
   * OpenBD書籍データを統一形式に変換
   * @param {Object} bookData - OpenBD書籍データ
   * @returns {Object} 変換された書籍データ
   */
  transformBookData(bookData) {
    try {
      const summary = bookData.summary || {};
      const onix = bookData.onix || {};
      const hanmoto = bookData.hanmoto || {};

      // ISBNを取得
      const isbn = summary.isbn || '';
      
      // タイトル情報
      let title = summary.title || '';
      let titleKana = '';
      
      // ONIXからより詳細な情報を取得
      if (onix.DescriptiveDetail) {
        const titleDetail = onix.DescriptiveDetail.TitleDetail;
        if (titleDetail && titleDetail.TitleElement) {
          const titleElement = Array.isArray(titleDetail.TitleElement) 
            ? titleDetail.TitleElement[0] 
            : titleDetail.TitleElement;
            
          if (titleElement.TitleText) {
            title = titleElement.TitleText.content || title;
          }
        }
      }

      // 著者情報
      let author = summary.author || '';
      let authorKana = '';
      
      if (onix.DescriptiveDetail && onix.DescriptiveDetail.Contributor) {
        const contributors = Array.isArray(onix.DescriptiveDetail.Contributor)
          ? onix.DescriptiveDetail.Contributor
          : [onix.DescriptiveDetail.Contributor];
          
        const mainAuthor = contributors.find(c => 
          c.ContributorRole && c.ContributorRole === 'A01' // 主著者
        ) || contributors[0];
        
        if (mainAuthor && mainAuthor.PersonName) {
          author = mainAuthor.PersonName.content || author;
        }
      }

      // 出版社情報
      let publisher = summary.publisher || '';
      
      if (onix.PublishingDetail && onix.PublishingDetail.Publisher) {
        const publisherInfo = Array.isArray(onix.PublishingDetail.Publisher)
          ? onix.PublishingDetail.Publisher[0]
          : onix.PublishingDetail.Publisher;
          
        if (publisherInfo.PublisherName) {
          publisher = publisherInfo.PublisherName || publisher;
        }
      }

      // 発売日情報
      let publishDate = summary.pubdate || '';
      
      if (onix.PublishingDetail && onix.PublishingDetail.PublishingDate) {
        const pubDates = Array.isArray(onix.PublishingDetail.PublishingDate)
          ? onix.PublishingDetail.PublishingDate
          : [onix.PublishingDetail.PublishingDate];
          
        const pubDate = pubDates.find(pd => pd.PublishingDateRole === '01') || pubDates[0];
        if (pubDate && pubDate.Date) {
          publishDate = this.formatPublishDate(pubDate.Date);
        }
      }

      // 価格情報
      let price = null;
      if (onix.ProductSupply && onix.ProductSupply.SupplyDetail) {
        const supplyDetail = Array.isArray(onix.ProductSupply.SupplyDetail)
          ? onix.ProductSupply.SupplyDetail[0]
          : onix.ProductSupply.SupplyDetail;
          
        if (supplyDetail.Price) {
          const priceInfo = Array.isArray(supplyDetail.Price)
            ? supplyDetail.Price[0]
            : supplyDetail.Price;
          price = priceInfo.PriceAmount || null;
        }
      }

      // 説明文
      let itemCaption = '';
      if (onix.CollateralDetail && onix.CollateralDetail.TextContent) {
        const textContents = Array.isArray(onix.CollateralDetail.TextContent)
          ? onix.CollateralDetail.TextContent
          : [onix.CollateralDetail.TextContent];
          
        const description = textContents.find(tc => 
          tc.TextType === '03' // 説明文
        );
        
        if (description && description.Text) {
          itemCaption = description.Text || '';
        }
      }

      // 画像URL（版元ドットコムから）
      let imageUrl = '';
      if (hanmoto && hanmoto.imageUrl) {
        imageUrl = hanmoto.imageUrl;
      }

      return {
        isbn: isbn,
        title: title,
        titleKana: titleKana,
        author: author,
        authorKana: authorKana,
        publisher: publisher,
        publishDate: publishDate,
        pubdate: publishDate, // 互換性のため
        imageUrl: imageUrl,
        smallImageUrl: imageUrl,
        mediumImageUrl: imageUrl,
        largeImageUrl: imageUrl,
        price: price,
        itemCaption: itemCaption,
        contents: itemCaption, // 互換性のため
        reviewCount: 0,
        reviewAverage: 0,
        itemUrl: hanmoto?.ndlBibID ? `https://ndlsearch.ndl.go.jp/books/${hanmoto.ndlBibID}` : '',
        isbn10: this.extractISBN10(isbn),
        isbn13: this.extractISBN13(isbn),
        isFutureRelease: this.isFutureDate(publishDate),
        source: 'OpenBD',
        // 蔵書検索関連の初期値
        isLibraryDataLoaded: false,
        isLibraryDataLoading: false,
        systems: {}
      };
    } catch (error) {
      errorLogger.log(error, { operation: 'transformBookData', bookData });
      throw createError.dataTransformFailed('OpenBD book data');
    }
  }

  /**
   * 発売日フォーマット変換
   * @param {string} dateStr - YYYYMMDD形式の日付
   * @returns {string} YYYY年MM月DD日形式の日付
   */
  formatPublishDate(dateStr) {
    if (!dateStr || dateStr.length !== 8) {
      return dateStr;
    }

    try {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      
      return `${year}年${parseInt(month)}月${parseInt(day)}日`;
    } catch {
      return dateStr;
    }
  }

  /**
   * 未来日判定
   * @param {string} publishDate - 発売日
   * @returns {boolean} 未来日かどうか
   */
  isFutureDate(publishDate) {
    if (!publishDate) return false;

    try {
      const match = publishDate.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      if (!match) return false;

      const [, year, month, day] = match;
      const pubDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const today = new Date();

      return pubDate > today;
    } catch {
      return false;
    }
  }

  /**
   * ISBN-10を抽出
   * @param {string} isbn - ISBN
   * @returns {string} ISBN-10
   */
  extractISBN10(isbn) {
    if (!isbn) return '';
    
    const normalized = normalizeISBN(isbn);
    if (normalized.length === 10) {
      return normalized;
    }
    
    if (normalized.length === 13 && normalized.startsWith('978')) {
      // ISBN-13からISBN-10への変換は複雑なため、元のISBNがISBN-10の場合のみ返す
      return '';
    }
    
    return '';
  }

  /**
   * ISBN-13を抽出
   * @param {string} isbn - ISBN
   * @returns {string} ISBN-13
   */
  extractISBN13(isbn) {
    if (!isbn) return '';
    
    const normalized = normalizeISBN(isbn);
    if (normalized.length === 13) {
      return normalized;
    }
    
    return normalized; // ISBN-10の場合もそのまま返す
  }

  /**
   * APIの利用可能性をチェック
   * @returns {boolean} 常にtrue（OpenBDはAPIキー不要）
   */
  isAvailable() {
    return true;
  }

  /**
   * 検索可能性をテスト
   * @returns {Promise<boolean>} 接続可能かどうか
   */
  async testConnection() {
    try {
      // ダミーISBNで接続テスト
      const testUrl = `${this.config.baseUrl}/v1/get?isbn=9784000000000`;
      await this.makeHttpRequest(testUrl);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * サービス情報を取得
   * @returns {Object} サービス情報
   */
  getServiceInfo() {
    return {
      name: 'OpenBD',
      available: this.isAvailable(),
      baseUrl: this.config.baseUrl,
      description: '書誌情報・書影を日本全国の書店・図書館等へ提供',
      features: ['ISBN検索', '書誌情報取得', '書影取得', 'バッチ検索'],
      ...this.getStats()
    };
  }
}