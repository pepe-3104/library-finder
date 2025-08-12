import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function takeAllPagesScreenshots() {
  const screenshotDir = path.join(__dirname, '..', 'screenshots');
  
  // ディレクトリ作成
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await puppeteer.launch();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  // 各ページのURLと名前
  const pages = [
    { url: 'http://localhost:5186/', name: 'library-search', title: '図書館検索ページ' },
    { url: 'http://localhost:5186/map', name: 'map-page', title: '地図表示ページ' },
    { url: 'http://localhost:5186/books', name: 'book-search', title: '蔵書検索ページ' }
  ];

  try {
    for (const pageInfo of pages) {
      console.log(`\n📸 ${pageInfo.title}のスクリーンショット撮影中...`);
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      
      try {
        await page.goto(pageInfo.url, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });
        
        // モックデータ設定（全ページ共通）
        await page.evaluate((pageData) => {
          const mockLibraries = [
            {
              id: "Chiyoda_Central_Library",
              name: "千代田区立日比谷図書文化館",
              shortName: "日比谷図書文化館",
              address: "東京都千代田区日比谷公園1-4",
              tel: "03-3502-3340",
              distance: 1.2,
              category: "LARGE",
              geocode: "139.7594,35.6741",
              systemid: "Tokyo_Chiyoda"
            },
            {
              id: "Chuo_Kyoboshi_Library",
              name: "中央区立京橋図書館",
              shortName: "京橋図書館",
              address: "東京都中央区京橋2-6-7",
              tel: "03-3561-0968",
              distance: 0.7,
              category: "MEDIUM",
              geocode: "139.7709,35.6751",
              systemid: "Tokyo_Chuo"
            },
            {
              id: "National_Diet_Library",
              name: "国立国会図書館東京本館",
              shortName: "国会図書館",
              address: "東京都千代田区永田町1-10-1",
              tel: "03-3581-2331",
              distance: 2.1,
              category: "SPECIAL",
              geocode: "139.7431,35.6782",
              systemid: "National_Diet"
            }
          ];
          
          const mockUserLocation = {
            latitude: 35.6812,
            longitude: 139.7671,
            accuracy: 10
          };

          console.log(`📸 ${pageData.title}用モックデータ設定中...`);
          
          const event = new CustomEvent('mockDataForScreenshot', {
            detail: { userLocation: mockUserLocation, libraries: mockLibraries }
          });
          window.dispatchEvent(event);
          
          return mockLibraries.length;
        }, pageInfo);
        
        // レンダリング待機
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const filename = `${pageInfo.name}-${timestamp}.png`;
        const filepath = path.join(screenshotDir, filename);
        
        await page.screenshot({
          path: filepath,
          fullPage: true
        });
        
        console.log(`✅ ${pageInfo.title}のスクリーンショット保存: ${filename}`);
        
      } catch (error) {
        console.error(`❌ ${pageInfo.title}のエラー:`, error.message);
      } finally {
        await page.close();
      }
    }
    
  } catch (error) {
    console.error('全体エラー:', error.message);
  } finally {
    await browser.close();
  }
}

takeAllPagesScreenshots();