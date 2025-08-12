/* eslint-env node */
// 楽天Books APIの動作テストスクリプト
import puppeteer from 'puppeteer';

async function testRakutenBooksAPI() {
  const browser = await puppeteer.launch({ headless: false }); // ブラウザを表示
  const page = await browser.newPage();
  
  try {
    console.log('🚀 楽天Books API テスト開始...');
    
    // アプリケーションにアクセス
    await page.goto('http://localhost:5183', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // モックデータを設定（図書館情報を取得するため）
    await page.evaluate(() => {
      const mockUserLocation = {
        latitude: 35.6812,
        longitude: 139.7671,
        accuracy: 10
      };
      
      const mockLibraries = [
        {
          id: "Tokyo_Chiyoda",
          systemid: "Tokyo_Chiyoda",
          name: "千代田区立日比谷図書文化館",
          shortName: "日比谷図書文化館"
        },
        {
          id: "Tokyo_Chuo", 
          systemid: "Tokyo_Chuo",
          name: "中央区立京橋図書館",
          shortName: "京橋図書館"
        }
      ];
      
      const event = new CustomEvent('mockDataForScreenshot', {
        detail: { userLocation: mockUserLocation, libraries: mockLibraries }
      });
      window.dispatchEvent(event);
    });
    
    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 蔵書検索セクションにスクロール
    await page.evaluate(() => {
      document.querySelector('.book-search-container')?.scrollIntoView();
    });
    
    // キーワード検索を選択
    await page.click('input[value="title"]');
    console.log('📚 キーワード検索モードを選択');
    
    // 検索語を入力
    const searchKeyword = '村上春樹';
    await page.type('.search-input', searchKeyword);
    console.log(`🔍 検索キーワード入力: ${searchKeyword}`);
    
    // 検索実行
    await page.click('.search-button');
    console.log('🚀 検索開始...');
    
    // コンソールログを監視
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'warn') {
        console.log(`🖥️ [Browser]: ${msg.text()}`);
      }
      if (msg.type() === 'error') {
        console.error(`❌ [Browser Error]: ${msg.text()}`);
      }
    });
    
    // 検索結果を待機（最大30秒）
    try {
      await page.waitForSelector('.book-result-item, .search-error, .loading-spinner', { 
        timeout: 30000 
      });
      
      // 結果の確認
      const hasResults = await page.$('.book-result-item');
      const hasError = await page.$('.search-error');
      const isLoading = await page.$('.loading-spinner');
      
      if (isLoading) {
        console.log('⏳ 検索処理中...');
        // さらに待機
        await page.waitForSelector('.book-result-item, .search-error', { 
          timeout: 30000 
        });
      }
      
      if (hasResults) {
        console.log('✅ 検索結果が表示されました！');
        
        // 結果の詳細を取得
        const results = await page.evaluate(() => {
          const items = document.querySelectorAll('.book-result-item');
          return Array.from(items).map(item => ({
            title: item.querySelector('.book-title')?.textContent,
            author: item.querySelector('.book-author')?.textContent,
            isbn: item.querySelector('.book-isbn')?.textContent,
            hasImage: !!item.querySelector('.book-image img'),
            hasRakutenLink: !!item.querySelector('.rakuten-link')
          }));
        });
        
        console.log('📚 検索結果詳細:', results);
        
        // スクリーンショット撮影
        await page.screenshot({
          path: 'screenshots/rakuten-books-test-result.png',
          fullPage: true
        });
        console.log('📸 検索結果スクリーンショット保存完了');
        
      } else if (hasError) {
        console.log('⚠️ 検索エラーが発生しました');
        const errorText = await page.$eval('.search-error', el => el.textContent);
        console.log('エラー内容:', errorText);
      }
      
    } catch {
      console.log('⏰ 検索タイムアウト - APIの応答を確認中...');
    }
    
    // 5秒待機してブラウザの状態を確認
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ テスト中にエラーが発生:', error);
  } finally {
    console.log('🏁 テスト完了 - ブラウザは開いたまま（手動確認用）');
    // await browser.close(); // 手動確認のためコメントアウト
  }
}

testRakutenBooksAPI();