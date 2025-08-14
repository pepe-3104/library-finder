// 楽天Books API統合ユーティリティ
// キーワード検索で書籍情報とISBNを取得

import { normalizeISBN } from './common';
import { createError } from './errors';
import { getApiKey } from '../config/apiConfig';

/**
 * 楽天Books APIでタイトル検索
 * @param {string} title - 検索タイトルキーワード
 * @param {number} hits - 1ページあたりの取得件数（デフォルト: 10）
 * @param {number} page - ページ番号（1から開始、デフォルト: 1）
 * @returns {Promise<{books: Object[], totalCount: number, pageInfo: Object}>} 書籍情報とページング情報
 */
export const searchBooksByTitle = async (title, hits = 10, page = 1) => {
  try {
    // 楽天APIのアプリケーションID（一元化された設定から取得）
    const apiKeyResult = getApiKey.rakuten();
    
    if (!apiKeyResult.isAvailable) {
      throw apiKeyResult.error;
    }
    
    const appId = apiKeyResult.key;

    // APIエンドポイント - 楽天Books API の必須パラメータ + ページング
    const params = new URLSearchParams({
      format: 'json',
      title: title,
      applicationId: appId,
      hits: hits, // 指定された件数
      page: page
    });
    
    const apiUrl = `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?${params.toString()}`;


    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ 楽天API HTTPエラー:', response.status, response.statusText);
      console.error('❌ レスポンスデータ:', data);
      throw createError.apiRequestFailed('楽天Books', response.status);
    }

    // APIエラーレスポンスのチェック
    if (data.error) {
      console.error('❌ 楽天API レスポンスエラー:', data.error);
      console.error('❌ エラー詳細:', data.error_description || 'エラー詳細なし');
      throw createError.apiRequestFailed('楽天Books', 400, new Error(data.error));
    }

    if (!data.Items || data.Items.length === 0) {
      return {
        books: [],
        totalCount: data.count || 0,
        pageInfo: {
          page: data.page || page,
          pageCount: data.pageCount || 0,
          hits: data.hits || hits,
          first: data.first || 1,
          last: data.last || 1
        }
      };
    }

    // レスポンスデータを統一形式に変換
    const books = data.Items.map((item) => {
      const book = item.Item;
      
      
      return {
        isbn: book.jan || book.isbn, // ISBN-13を優先、なければISBN-10
        title: book.title,
        titleKana: book.titleKana,
        author: book.author,
        authorKana: book.authorKana,
        publisher: book.publisherName,
        publishDate: book.salesDate,
        smallImageUrl: book.smallImageUrl,
        mediumImageUrl: book.mediumImageUrl,
        largeImageUrl: book.largeImageUrl,
        reviewCount: book.reviewCount,
        reviewAverage: book.reviewAverage,
        itemCaption: book.itemCaption,
        contents: book.contents,
        seriesName: book.seriesName,
        size: book.size,
        isbn10: book.isbn,    // ISBN-10
        isbn13: book.jan      // ISBN-13 (JAN/EAN)
      };
    });

    
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

  } catch (error) {
    console.error('❌ 楽天Books API エラー:', error);
    throw error;
  }
};

/**
 * 楽天Books APIで著者検索
 * @param {string} author - 検索著者名
 * @param {number} hits - 1ページあたりの取得件数（デフォルト: 10）
 * @param {number} page - ページ番号（1から開始、デフォルト: 1）
 * @returns {Promise<{books: Object[], totalCount: number, pageInfo: Object}>} 書籍情報とページング情報
 */
export const searchBooksByAuthor = async (author, hits = 10, page = 1) => {
  try {
    // 楽天APIのアプリケーションID（一元化された設定から取得）
    const apiKeyResult = getApiKey.rakuten();
    
    if (!apiKeyResult.isAvailable) {
      throw apiKeyResult.error;
    }
    
    const appId = apiKeyResult.key;

    // APIエンドポイント - 楽天Books API の著者検索パラメータ + ページング
    const params = new URLSearchParams({
      format: 'json',
      author: author,
      applicationId: appId,
      hits: hits, // 指定された件数
      page: page
    });
    
    const apiUrl = `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?${params.toString()}`;


    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ 楽天API HTTPエラー:', response.status, response.statusText);
      console.error('❌ レスポンスデータ:', data);
      throw createError.apiRequestFailed('楽天Books', response.status);
    }

    // APIエラーレスポンスのチェック
    if (data.error) {
      console.error('❌ 楽天API レスポンスエラー:', data.error);
      console.error('❌ エラー詳細:', data.error_description || 'エラー詳細なし');
      throw createError.apiRequestFailed('楽天Books', 400, new Error(data.error));
    }

    if (!data.Items || data.Items.length === 0) {
      return {
        books: [],
        totalCount: data.count || 0,
        pageInfo: {
          page: data.page || page,
          pageCount: data.pageCount || 0,
          hits: data.hits || hits,
          first: data.first || 1,
          last: data.last || 1
        }
      };
    }

    // レスポンスデータを統一形式に変換
    const books = data.Items.map(item => {
      const book = item.Item;
      return {
        title: book.title,
        author: book.author,
        publisherName: book.publisherName,
        salesDate: book.salesDate,
        itemPrice: book.itemPrice,
        itemUrl: book.itemUrl,
        affiliateUrl: book.affiliateUrl,
        smallImageUrl: book.smallImageUrl,
        mediumImageUrl: book.mediumImageUrl,
        largeImageUrl: book.largeImageUrl,
        chirayomiUrl: book.chirayomiUrl,
        itemCaption: book.itemCaption,
        reviewCount: book.reviewCount,
        reviewAverage: book.reviewAverage,
        contents: book.contents,
        seriesName: book.seriesName,
        size: book.size,
        isbn10: book.isbn,    // ISBN-10
        isbn13: book.jan      // ISBN-13 (JAN/EAN)
      };
    });

    
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

  } catch (error) {
    console.error('❌ 楽天Books API 著者検索エラー:', error);
    throw error;
  }
};

// ISBN検索専用関数
export const searchBookByISBN = async (isbn) => {
  const apiKeyResult = getApiKey.rakuten();
  
  if (!apiKeyResult.isAvailable) {
    console.warn('⚠️ 楽天Books APIキーが設定されていません');
    return null;
  }

  try {
    
    const apiUrl = 'https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404';
    const params = new URLSearchParams({
      format: 'json',
      applicationId: apiKeyResult.key,
      isbn: isbn.replace(/[-\s]/g, ''), // ハイフンと空白を削除
      hits: '1' // ISBN検索は通常1件のみ
    });

    const response = await fetch(`${apiUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`楽天Books API HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.Items || data.Items.length === 0) {
      return null;
    }

    const book = data.Items[0].Item;
    const bookInfo = {
      isbn: book.isbn || book.jan, // ISBN-10を基本、なければISBN-13
      title: book.title,
      titleKana: book.titleKana,
      author: book.author,
      authorKana: book.authorKana,
      publisher: book.publisherName,
      publishDate: book.salesDate,
      smallImageUrl: book.smallImageUrl,
      mediumImageUrl: book.mediumImageUrl,
      largeImageUrl: book.largeImageUrl,
      reviewCount: book.reviewCount,
      reviewAverage: book.reviewAverage,
      itemCaption: book.itemCaption,
      contents: book.contents,
      seriesName: book.seriesName,
      size: book.size,
      isbn10: book.isbn,    // ISBN-10
      isbn13: book.jan      // ISBN-13 (JAN/EAN)
    };

    return bookInfo;

  } catch (error) {
    console.error('❌ 楽天Books API - ISBN検索エラー:', error);
    return null;
  }
};


// ISBN正規化関数は共通ユーティリティ（./common.js）から使用

/**
 * 楽天Books検索結果から有効なISBNのみを抽出
 * @param {Object[]} books - 楽天Books検索結果
 * @returns {string[]} ISBN配列
 */
export const extractValidISBNs = (books) => {
  const isbns = [];
  
  books.forEach(book => {
    
    // まずisbn10フィールドをチェック（実際は10桁または13桁の可能性）
    if (book.isbn10) {
      const normalized = normalizeISBN(book.isbn10);
      if (normalized.length === 10 || normalized.length === 13) {
        isbns.push(normalized);
        return;
      }
    }
    
    // isbn13フィールドをフォールバック
    if (book.isbn13) {
      const normalized = normalizeISBN(book.isbn13);
      if (normalized.length === 10 || normalized.length === 13) {
        isbns.push(normalized);
        return;
      }
    }
    
  });
  
  const uniqueIsbns = [...new Set(isbns)]; // 重複除去
  return uniqueIsbns;
};

/**
 * 楽天Books APIの統一検索関数（ページング対応）
 * @param {string} query - 検索クエリ
 * @param {string} searchType - 検索タイプ（'title' または 'author'）
 * @param {number} page - ページ番号（デフォルト: 1）
 * @param {number} hits - 1ページあたりの件数（デフォルト: 10）
 * @returns {Promise<{books: Object[], totalCount: number, pageInfo: Object}>} 書籍情報とページング情報
 */
export const searchBooksWithPaging = async (query, searchType, page = 1, hits = 10) => {
  
  try {
    if (searchType === 'title') {
      return await searchBooksByTitle(query, hits, page);
    } else if (searchType === 'author') {
      return await searchBooksByAuthor(query, hits, page);
    } else {
      throw new Error(`未対応の検索タイプ: ${searchType}`);
    }
  } catch (error) {
    console.error(`❌ 楽天Books API検索エラー:`, error);
    throw error;
  }
};

/**
 * 楽天Books APIの利用可能性をチェック
 * @returns {boolean} 利用可能かどうか
 */
export const isRakutenAPIAvailable = () => {
  return getApiKey.rakuten().isAvailable;
};