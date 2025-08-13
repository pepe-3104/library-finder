// 楽天Books API ジャンル管理ユーティリティ

/**
 * 楽天Books APIのジャンル検索
 * @param {string} booksGenreId - ジャンルID（'001'でルート取得）
 * @returns {Promise<Object[]>} ジャンル情報配列
 */
export const getBookGenres = async (booksGenreId = '001') => {
  const RAKUTEN_API_KEY = import.meta.env.VITE_RAKUTEN_API_KEY;
  
  if (!RAKUTEN_API_KEY) {
    console.warn('⚠️ 楽天APIキーが設定されていません');
    return [];
  }

  try {
    console.log(`📂 楽天Books ジャンル検索: ${booksGenreId}`);
    
    const apiUrl = 'https://app.rakuten.co.jp/services/api/BooksGenre/Search/20121128';
    const params = new URLSearchParams({
      format: 'json',
      applicationId: RAKUTEN_API_KEY,
      booksGenreId: booksGenreId
    });

    console.log(`📡 ジャンルAPIリクエストURL: ${apiUrl}?${params}`);
    
    const response = await fetch(`${apiUrl}?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 楽天ジャンルAPI詳細エラー (${response.status}):`, errorText);
      throw new Error(`楽天ジャンルAPI HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📂 楽天ジャンルAPI応答の全体構造:', JSON.stringify(data, null, 2));

    // レスポンス構造の詳細確認
    if (data.children) {
      console.log('📂 children配列の最初の要素:', JSON.stringify(data.children[0], null, 2));
    }
    if (data.current) {
      console.log('📂 current要素:', JSON.stringify(data.current, null, 2));
    }

    if (!data.children || data.children.length === 0) {
      console.log('📭 ジャンル検索結果が見つかりませんでした');
      return [];
    }

    const genres = data.children.map((item, index) => {
      const child = item.child; // 正しい構造: children[].child
      console.log(`📂 ジャンル${index}の生データ:`, JSON.stringify(child, null, 2));
      return {
        id: child.booksGenreId,
        name: child.booksGenreName,
        level: child.genreLevel
      };
    });

    console.log('📂 取得したジャンル一覧:', genres);
    
    return genres;

  } catch (error) {
    console.error('❌ 楽天ジャンルAPI エラー:', error);
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
  const RAKUTEN_API_KEY = import.meta.env.VITE_RAKUTEN_API_KEY;
  
  if (!RAKUTEN_API_KEY) {
    console.warn('⚠️ 楽天APIキーが設定されていません');
    return { books: [], totalCount: 0, pageInfo: null };
  }

  try {
    console.log(`🔥 売れ筋書籍取得: ジャンル${genreId}, ページ${page}, ${hits}件ずつ`);
    
    const apiUrl = 'https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404';
    const params = new URLSearchParams({
      format: 'json',
      applicationId: RAKUTEN_API_KEY,
      booksGenreId: genreId,
      sort: 'sales', // 売れ筋順
      hits: Math.min(hits, 30), // 最大30件に制限
      page: page
    });

    console.log(`📡 APIリクエストURL: ${apiUrl}?${params}`);

    const response = await fetch(`${apiUrl}?${params}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 楽天Books API詳細エラー (${response.status}):`, errorText);
      throw new Error(`楽天Books API HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🔥 売れ筋書籍API応答:', data);

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

    // レスポンスデータを統一形式に変換（BookSearchResultsコンポーネントと互換性を保つ）
    const books = data.Items.map(item => {
      const book = item.Item;
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
        systems: {}
      };
    });

    console.log(`🔥 売れ筋書籍結果: ${books.length}件の書籍が見つかりました（総数: ${data.count}件）`);
    
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
    console.error('❌ 売れ筋書籍API エラー:', error);
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
  console.log(`🔍 子ジャンル取得開始: 親ジャンルID=${parentGenreId}`);
  
  try {
    const subGenres = await getBookGenres(parentGenreId);
    console.log(`✅ 子ジャンル取得完了: ${subGenres.length}件`, subGenres);
    return subGenres;
  } catch (error) {
    console.error(`❌ 子ジャンル取得エラー (親ID: ${parentGenreId}):`, error);
    return [];
  }
};

/**
 * ジャンル階層情報を取得する関数
 * @param {string} genreId - ジャンルID
 * @returns {Promise<{genre: Object, subGenres: Object[]}>} ジャンルと子ジャンルの情報
 */
export const getGenreHierarchy = async (genreId) => {
  console.log(`🌳 ジャンル階層取得開始: ${genreId}`);
  
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
    
  } catch (error) {
    console.error(`❌ ジャンル階層取得エラー (${genreId}):`, error);
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
  return !!import.meta.env.VITE_RAKUTEN_API_KEY;
};