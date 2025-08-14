// 楽天Books API ジャンル管理ユーティリティ

import { getApiKey } from '../config/apiConfig';

/**
 * 楽天Books APIのジャンル検索
 * @param {string} booksGenreId - ジャンルID（'001'でルート取得）
 * @returns {Promise<Object[]>} ジャンル情報配列
 */
export const getBookGenres = async (booksGenreId = '001') => {
  const apiKeyResult = getApiKey.rakuten();
  
  if (!apiKeyResult.isAvailable) {
    return [];
  }

  try {
    const apiUrl = 'https://app.rakuten.co.jp/services/api/BooksGenre/Search/20121128';
    const params = new URLSearchParams({
      format: 'json',
      applicationId: apiKeyResult.key,
      booksGenreId: booksGenreId
    });
    
    const response = await fetch(`${apiUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`楽天ジャンルAPI HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.children || data.children.length === 0) {
      return [];
    }

    const genres = data.children.map((item) => {
      const child = item.child;
      return {
        id: child.booksGenreId,
        name: child.booksGenreName,
        level: child.genreLevel
      };
    });
    
    return genres;

  } catch {
    return [];
  }
};

/**
 * 人気の本をジャンル別で取得
 * @param {string} genreId - ジャンルID
 * @param {number} hits - 取得件数（デフォルト: 20）
 * @param {number} page - ページ番号（デフォルト: 1）
 * @returns {Promise<{books: Object[], totalCount: number, pageInfo: Object}>} 書籍情報とページング情報
 */
export const getPopularBooksByGenre = async (genreId = '001', hits = 20, page = 1) => {
  const apiKeyResult = getApiKey.rakuten();
  
  if (!apiKeyResult.isAvailable) {
    return { books: [], totalCount: 0, pageInfo: null };
  }

  try {
    const apiUrl = 'https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404';
    const params = new URLSearchParams({
      format: 'json',
      applicationId: apiKeyResult.key,
      booksGenreId: genreId,
      sort: 'sales', // 売れ筋順
      hits: Math.min(hits, 30), // 必要な件数のみ取得
      page: page
    });

    const response = await fetch(`${apiUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`楽天Books API HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

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

    // 現在の日付を取得
    const today = new Date();
    
    // レスポンスデータを統一形式に変換（BookSearchResultsコンポーネントと互換性を保つ）
    const books = data.Items.map(item => {
      const book = item.Item;
      
      // 未来日かどうかを判定
      let isFutureRelease = false;
      if (book.salesDate) {
        try {
          // 日本語の日付形式を解析 (例: "2024年12月25日頃", "2025年01月15日")
          const dateStr = book.salesDate;
          const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
          
          if (match) {
            const [, year, month, day] = match;
            const publishDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            
            if (publishDate > today) {
              isFutureRelease = true;
            }
          }
        } catch {
          // 発売日の解析に失敗した場合は未来日ではないとみなす
        }
      }
      
      return {
        isbn: book.jan || book.isbn, // ISBN-13を優先
        title: book.title,
        titleKana: book.titleKana,
        author: book.author,
        authorKana: book.authorKana,
        publisher: book.publisherName,
        publishDate: book.salesDate,
        pubdate: book.salesDate, // BookSearchResultsとの互換性
        imageUrl: book.mediumImageUrl || book.largeImageUrl || book.smallImageUrl, // BookSearchResultsが期待するプロパティ名
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
        isbn10: book.isbn,    // ISBN-10
        isbn13: book.jan,     // ISBN-13 (JAN/EAN)
        // BookSearchResultsとの互換性のため蔵書情報関連プロパティを追加
        isLibraryDataLoaded: false,
        isLibraryDataLoading: false,
        systems: {},
        // 未来日フラグを追加
        isFutureRelease: isFutureRelease
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

  } catch {
    return { books: [], totalCount: 0, pageInfo: null };
  }
};

/**
 * 人気のジャンル（楽天Books API公式ジャンル - rakutenGenre.jsonから取得）
 */
export const POPULAR_GENRES = [
  { id: '001001', name: '漫画（コミック）' },
  { id: '001002', name: '語学・学習参考書' },
  { id: '001003', name: '絵本・児童書・図鑑' },
  { id: '001004', name: '小説・エッセイ' },
  { id: '001005', name: 'パソコン・システム開発' },
  { id: '001006', name: 'ビジネス・経済・就職' },
  { id: '001007', name: '旅行・留学・アウトドア' },
  { id: '001008', name: '人文・思想・社会' },
  { id: '001009', name: 'ホビー・スポーツ・美術' },
  { id: '001010', name: '美容・暮らし・健康・料理' },
  { id: '001012', name: '科学・技術' },
  { id: '001016', name: '資格・検定' }
];

/**
 * 子ジャンルを取得する関数
 * @param {string} parentGenreId - 親ジャンルID
 * @returns {Promise<Object[]>} 子ジャンル情報配列
 */
export const getSubGenres = async (parentGenreId) => {
  try {
    const subGenres = await getBookGenres(parentGenreId);
    return subGenres;
  } catch {
    return [];
  }
};

/**
 * ジャンル階層情報を取得する関数
 * @param {string} genreId - ジャンルID
 * @returns {Promise<{genre: Object, subGenres: Object[]}>} ジャンルと子ジャンルの情報
 */
export const getGenreHierarchy = async (genreId) => {
  try {
    // 現在のジャンル情報を取得
    const currentGenre = POPULAR_GENRES.find(g => g.id === genreId) || {
      id: genreId,
      name: `ジャンル (${genreId})`
    };
    
    // 子ジャンルを取得
    const subGenres = await getSubGenres(genreId);
    
    return {
      genre: currentGenre,
      subGenres: subGenres
    };
    
  } catch {
    return {
      genre: null,
      subGenres: []
    };
  }
};

/**
 * 楽天Books APIの利用可能性をチェック
 * @returns {boolean} 利用可能かどうか
 */
export const isRakutenGenreAPIAvailable = () => {
  return getApiKey.rakuten().isAvailable;
};