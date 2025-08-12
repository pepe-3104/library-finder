// 楽天Books API統合ユーティリティ
// キーワード検索で書籍情報とISBNを取得

/**
 * 楽天Books APIでタイトル検索
 * @param {string} title - 検索タイトルキーワード
 * @returns {Promise<Object[]>} 書籍情報配列
 */
export const searchBooksByTitle = async (title) => {
  try {
    // 楽天APIのアプリケーションID（環境変数から取得）
    const appId = import.meta.env.VITE_RAKUTEN_API_KEY;
    
    if (!appId) {
      throw new Error('楽天APIキーが設定されていません。.envファイルにVITE_RAKUTEN_API_KEYを追加してください。');
    }

    // APIエンドポイント - 楽天Books API の必須パラメータのみ
    const params = new URLSearchParams({
      format: 'json',
      title: title,
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
 * 楽天Books APIで著者検索
 * @param {string} author - 検索著者名
 * @returns {Promise<Object[]>} 書籍情報配列
 */
export const searchBooksByAuthor = async (author) => {
  try {
    // 楽天APIのアプリケーションID（環境変数から取得）
    const appId = import.meta.env.VITE_RAKUTEN_API_KEY;
    
    if (!appId) {
      throw new Error('楽天APIキーが設定されていません。.envファイルにVITE_RAKUTEN_API_KEYを追加してください。');
    }

    // APIエンドポイント - 楽天Books API の著者検索パラメータ
    const params = new URLSearchParams({
      format: 'json',
      author: author,
      applicationId: appId
    });
    
    const apiUrl = `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?${params.toString()}`;

    console.log('👨‍💼 楽天Books API 著者検索:', apiUrl);

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

    console.log(`👨‍💼 楽天Books API 著者検索結果: ${books.length}件の書籍が見つかりました`);
    return books;

  } catch (error) {
    console.error('❌ 楽天Books API 著者検索エラー:', error);
    throw error;
  }
};

// ISBN検索専用関数
export const searchBookByISBN = async (isbn) => {
  const RAKUTEN_API_KEY = import.meta.env.VITE_RAKUTEN_API_KEY;
  
  if (!RAKUTEN_API_KEY) {
    console.warn('⚠️ 楽天Books APIキーが設定されていません');
    return null;
  }

  try {
    console.log(`🔍 楽天Books API - ISBN検索: ${isbn}`);
    
    const apiUrl = 'https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404';
    const params = new URLSearchParams({
      format: 'json',
      applicationId: RAKUTEN_API_KEY,
      isbn: isbn.replace(/[-\s]/g, ''), // ハイフンと空白を削除
      hits: '1' // ISBN検索は通常1件のみ
    });

    const response = await fetch(`${apiUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`楽天Books API HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📚 楽天Books API - ISBN検索応答:', data);

    if (!data.Items || data.Items.length === 0) {
      console.log('📭 ISBN検索結果が見つかりませんでした');
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

    console.log(`✅ 楽天Books API - ISBN検索成功:`, bookInfo);
    return bookInfo;

  } catch (error) {
    console.error('❌ 楽天Books API - ISBN検索エラー:', error);
    return null;
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
    console.log('📖 ISBN抽出対象書籍:', { title: book.title, isbn10: book.isbn10, isbn13: book.isbn13 });
    
    // まずisbn10フィールドをチェック（実際は10桁または13桁の可能性）
    if (book.isbn10) {
      const normalized = normalizeISBN(book.isbn10);
      if (normalized.length === 10 || normalized.length === 13) {
        isbns.push(normalized);
        console.log(`✅ ISBN追加 (${normalized.length}桁):`, normalized);
        return;
      }
    }
    
    // isbn13フィールドをフォールバック
    if (book.isbn13) {
      const normalized = normalizeISBN(book.isbn13);
      if (normalized.length === 10 || normalized.length === 13) {
        isbns.push(normalized);
        console.log(`✅ ISBN追加 (${normalized.length}桁):`, normalized);
        return;
      }
    }
    
    console.log('⚠️ 有効なISBNなし:', book.title);
  });
  
  const uniqueIsbns = [...new Set(isbns)]; // 重複除去
  console.log(`📚 有効なISBN抽出結果: ${uniqueIsbns.length}件`, uniqueIsbns);
  return uniqueIsbns;
};

/**
 * 楽天Books APIの利用可能性をチェック
 * @returns {boolean} 利用可能かどうか
 */
export const isRakutenAPIAvailable = () => {
  return !!import.meta.env.VITE_RAKUTEN_API_KEY;
};