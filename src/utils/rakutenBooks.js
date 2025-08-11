// 楽天Books API統合ユーティリティ
// キーワード検索で書籍情報とISBNを取得

/**
 * 楽天Books APIでキーワード検索
 * @param {string} keyword - 検索キーワード（タイトル、著者名など）
 * @param {number} hits - 取得件数（デフォルト: 10, 最大: 30）
 * @returns {Promise<Object[]>} 書籍情報配列
 */
export const searchBooksByKeyword = async (keyword, hits = 10) => {
  try {
    // 楽天APIのアプリケーションID（環境変数から取得）
    const appId = import.meta.env.VITE_RAKUTEN_API_KEY;
    
    if (!appId) {
      throw new Error('楽天APIキーが設定されていません。.envファイルにVITE_RAKUTEN_API_KEYを追加してください。');
    }

    // APIエンドポイント - 楽天Books API の必須パラメータのみ
    const params = new URLSearchParams({
      format: 'json',
      title: keyword,
      applicationId: appId
    });
    
    const apiUrl = `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?${params.toString()}`;

    console.log('📚 楽天Books API呼び出し:', apiUrl);

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ 楽天API HTTPエラー:', response.status, response.statusText);
      console.error('❌ レスポンスデータ:', data);
      throw new Error(`楽天API エラー (${response.status}): ${data.error || data.message || response.statusText}`);
    }

    // APIエラーレスポンスのチェック
    if (data.error) {
      console.error('❌ 楽天API レスポンスエラー:', data.error);
      console.error('❌ エラー詳細:', data.error_description || 'エラー詳細なし');
      throw new Error(`楽天API エラー: ${data.error} - ${data.error_description || 'パラメータを確認してください'}`);
    }

    if (!data.Items || data.Items.length === 0) {
      return [];
    }

    // レスポンスデータを統一形式に変換
    const books = data.Items.map((item, index) => {
      const book = item.Item;
      
      // デバッグ用：最初の3冊のISBN情報をログ出力
      if (index < 3) {
        console.log(`📖 書籍[${index}]: ${book.title}`);
        console.log(`   isbn: ${book.isbn}, jan: ${book.jan}`);
      }
      
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

    console.log(`📖 楽天Books API結果: ${books.length}件の書籍が見つかりました`);
    return books;

  } catch (error) {
    console.error('❌ 楽天Books API エラー:', error);
    throw error;
  }
};

/**
 * 楽天Books APIで著者名検索
 * @param {string} author - 著者名
 * @param {number} hits - 取得件数
 * @returns {Promise<Object[]>} 書籍情報配列
 */
export const searchBooksByAuthor = async (author, hits = 10) => {
  try {
    const appId = import.meta.env.VITE_RAKUTEN_API_KEY;
    
    if (!appId) {
      throw new Error('楽天APIキーが設定されていません。');
    }

    const params = new URLSearchParams({
      format: 'json',
      author: author,
      applicationId: appId
    });
    
    const apiUrl = `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?${params.toString()}`;

    console.log('👤 楽天Books API著者検索:', apiUrl);

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ 楽天API 著者検索エラー:', response.status, response.statusText);
      console.error('❌ レスポンスデータ:', data);
      return [];
    }

    if (data.error) {
      console.error('❌ 楽天API 著者検索レスポンスエラー:', data.error);
      return [];
    }

    if (!data.Items || data.Items.length === 0) {
      return [];
    }

    return data.Items.map(item => ({
      isbn: item.Item.isbn || item.Item.jan,
      title: item.Item.title,
      author: item.Item.author,
      publisher: item.Item.publisherName,
      publishDate: item.Item.salesDate,
      imageUrl: item.Item.largeImageUrl,
      reviewAverage: item.Item.reviewAverage,
      itemCaption: item.Item.itemCaption
    }));

  } catch (error) {
    console.error('❌ 著者検索エラー:', error);
    throw error;
  }
};

/**
 * ISBN正規化（ハイフン除去）
 * @param {string} isbn - ISBN文字列
 * @returns {string} 正規化されたISBN
 */
export const normalizeISBN = (isbn) => {
  if (!isbn) return '';
  return isbn.replace(/[-\s]/g, '');
};

/**
 * 楽天Books検索結果から有効なISBNのみを抽出
 * @param {Object[]} books - 楽天Books検索結果
 * @returns {string[]} ISBN配列
 */
export const extractValidISBNs = (books) => {
  const isbns = [];
  
  books.forEach(book => {
    if (book.isbn13 && book.isbn13.length === 13) {
      isbns.push(book.isbn13);
    } else if (book.isbn10 && book.isbn10.length === 10) {
      isbns.push(book.isbn10);
    } else if (book.isbn) {
      const normalized = normalizeISBN(book.isbn);
      if (normalized.length === 10 || normalized.length === 13) {
        isbns.push(normalized);
      }
    }
  });
  
  return [...new Set(isbns)]; // 重複除去
};

/**
 * 楽天Books APIの利用可能性をチェック
 * @returns {boolean} 利用可能かどうか
 */
export const isRakutenAPIAvailable = () => {
  return !!import.meta.env.VITE_RAKUTEN_API_KEY;
};