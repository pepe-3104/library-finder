// シンプルな楽天Books API動作確認

async function testRakutenAPI() {
  // 環境変数から楽天APIキーを取得（Node.jsの場合は直接process.env）
  const apiKey = process.env.VITE_RAKUTEN_API_KEY;
  
  if (!apiKey) {
    console.log('❌ 楽天APIキーが設定されていません');
    console.log('環境変数 VITE_RAKUTEN_API_KEY を確認してください');
    return;
  }
  
  console.log('🔑 楽天APIキーが設定されています');
  console.log('🚀 楽天Books API テスト開始...');
  
  try {
    // 「村上春樹」で検索テスト
    const keyword = '村上春樹';
    const apiUrl = `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404` +
      `?format=json` +
      `&keyword=${encodeURIComponent(keyword)}` +
      `&hits=5` +
      `&page=1` +
      `&availability=1` +
      `&sort=sales` +
      `&applicationId=${apiKey}`;
    
    console.log(`🔍 検索キーワード: ${keyword}`);
    console.log('📡 API呼び出し中...');
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ APIエラー:', data);
      return;
    }
    
    if (data.Items && data.Items.length > 0) {
      console.log(`✅ 成功! ${data.Items.length}件の書籍が見つかりました`);
      console.log('\n📚 検索結果:');
      
      data.Items.forEach((item, index) => {
        const book = item.Item;
        console.log(`\n${index + 1}. ${book.title}`);
        console.log(`   著者: ${book.author}`);
        console.log(`   ISBN: ${book.isbn || book.jan}`);
        console.log(`   出版社: ${book.publisherName}`);
        console.log(`   価格: ¥${book.itemPrice?.toLocaleString()}`);
        if (book.reviewAverage) {
          console.log(`   評価: ⭐${book.reviewAverage} (${book.reviewCount}件)`);
        }
      });
      
      console.log('\n🎉 楽天Books APIは正常に動作しています！');
      
    } else {
      console.log('📭 検索結果が見つかりませんでした');
    }
    
  } catch (error) {
    console.error('❌ テスト中にエラーが発生:', error.message);
  }
}

testRakutenAPI();