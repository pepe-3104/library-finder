// ブラウザのコンソールから楽天Books APIをテストするためのユーティリティ

/**
 * ブラウザのコンソールから楽天Books APIをテストする関数
 * 使用方法: ブラウザのコンソールで testRakutenAPI('村上春樹') を実行
 */
window.testRakutenAPI = async function(keyword = '村上春樹') {
  console.log('🚀 楽天Books APIテスト開始');
  console.log(`🔍 検索キーワード: ${keyword}`);
  
  try {
    const apiKey = import.meta.env.VITE_RAKUTEN_API_KEY;
    
    if (!apiKey) {
      console.error('❌ 楽天APIキーが設定されていません');
      console.log('環境変数 VITE_RAKUTEN_API_KEY を確認してください');
      return;
    }
    
    console.log('🔑 楽天APIキー確認OK');
    
    const apiUrl = `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404` +
      `?format=json` +
      `&keyword=${encodeURIComponent(keyword)}` +
      `&hits=5` +
      `&page=1` +
      `&availability=1` +
      `&sort=sales` +
      `&applicationId=${apiKey}`;
    
    console.log('📡 API呼び出し中...');
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ APIエラー:', data);
      return null;
    }
    
    if (data.Items && data.Items.length > 0) {
      console.log(`✅ 成功! ${data.Items.length}件の書籍が見つかりました`);
      
      data.Items.forEach((item, index) => {
        const book = item.Item;
        console.log(`\n📚 ${index + 1}. ${book.title}`);
        console.log(`👤 著者: ${book.author}`);
        console.log(`📖 ISBN: ${book.isbn || book.jan}`);
        console.log(`🏢 出版社: ${book.publisherName}`);
        console.log(`💰 価格: ¥${book.itemPrice?.toLocaleString()}`);
        if (book.reviewAverage) {
          console.log(`⭐ 評価: ${book.reviewAverage} (${book.reviewCount}件)`);
        }
        if (book.largeImageUrl) {
          console.log(`🖼️ 画像: ${book.largeImageUrl}`);
        }
      });
      
      console.log('\n🎉 楽天Books APIは正常に動作しています！');
      return data;
      
    } else {
      console.log('📭 検索結果が見つかりませんでした');
      return null;
    }
    
  } catch (error) {
    console.error('❌ テスト中にエラー:', error);
    return null;
  }
};

/**
 * 蔵書検索のフルテスト
 */
window.testFullBookSearch = async function(keyword = '星の王子さま') {
  console.log('🔍 フル蔵書検索テスト開始');
  
  // 1. 楽天Books APIテスト
  const rakutenResult = await window.testRakutenAPI(keyword);
  
  if (!rakutenResult || !rakutenResult.Items) {
    console.log('❌ 楽天Books API テスト失敗');
    return;
  }
  
  // 2. ISBN抽出
  const book = rakutenResult.Items[0].Item;
  const isbn = book.isbn || book.jan;
  
  console.log(`\n🔍 "${book.title}" (ISBN: ${isbn}) の蔵書検索テスト`);
  
  // 3. カーリルAPI用のモックシステムID
  const mockSystemIds = ['Tokyo_Chiyoda', 'Tokyo_Chuo'];
  
  console.log(`📚 システムID: ${mockSystemIds.join(', ')}`);
  console.log('この後、実際の蔵書検索UIで検索を実行してください');
  
  return {
    rakutenData: rakutenResult,
    selectedBook: book,
    isbn: isbn,
    systemIds: mockSystemIds
  };
};

console.log('🛠️ コンソールテスト関数が利用可能になりました:');
console.log('• testRakutenAPI("キーワード") - 楽天Books API テスト');
console.log('• testFullBookSearch("キーワード") - フル蔵書検索テスト');
console.log('例: testRakutenAPI("村上春樹")');

export {};