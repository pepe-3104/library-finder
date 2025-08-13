import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function takeMobileScreenshots() {
  const screenshotDir = path.join(__dirname, '..', 'screenshots');
  
  // ディレクトリ作成
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await puppeteer.launch();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  // 各ページのURLと名前（BrowserRouterのルート）
  const pages = [
    { url: 'http://localhost:5174/', name: 'library-search', title: '図書館検索ページ (Mobile)' },
    { url: 'http://localhost:5174/map', name: 'map-page', title: '地図表示ページ (Mobile)' },
    { url: 'http://localhost:5174/books', name: 'book-search', title: '蔵書検索ページ (Mobile)' }
  ];

  try {
    for (const pageInfo of pages) {
      console.log(`\n📱 ${pageInfo.title}のスクリーンショット撮影中...`);
      
      const page = await browser.newPage();
      
      // iPhone 12のViewport設定
      await page.setViewport({
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true
      });
      
      try {
        await page.goto(pageInfo.url, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });
        
        // ページコンテンツの完全ロードを待機
        await page.waitForSelector('main', { timeout: 10000 });
        
        // モックデータ設定（全ページ共通 - 15件で確実にページング表示）
        await page.evaluate((pageData) => {
          const mockLibraries = [
            {
              id: "Chiyoda_Central_Library",
              name: "千代田区立日比谷図書文化館",
              shortName: "日比谷図書文化館",
              address: "東京都千代田区日比谷公園1-4",
              tel: "03-3502-3340",
              distance: 0.7,
              category: "LARGE",
              geocode: "139.7594,35.6741",
              systemid: "Tokyo_Chiyoda",
              url: "https://www.library.chiyoda.tokyo.jp/"
            },
            {
              id: "Chuo_Kyoboshi_Library",
              name: "中央区立京橋図書館",
              shortName: "京橋図書館",
              address: "東京都中央区京橋2-6-7",
              tel: "03-3561-0968",
              distance: 1.2,
              category: "MEDIUM",
              geocode: "139.7709,35.6751",
              systemid: "Tokyo_Chuo",
              url: "https://www.library.city.chuo.tokyo.jp/"
            },
            {
              id: "Minato_Akasaka_Library",
              name: "港区立赤坂図書館",
              shortName: "赤坂図書館",
              address: "東京都港区赤坂4-18-13",
              tel: "03-3408-5090",
              distance: 1.4,
              category: "MEDIUM",
              geocode: "139.7380,35.6735",
              systemid: "Tokyo_Minato",
              url: "https://www.lib.city.minato.tokyo.jp/"
            },
            {
              id: "Shibuya_Central_Library",
              name: "渋谷区立中央図書館",
              shortName: "渋谷中央図書館",
              address: "東京都渋谷区猿楽町17-5",
              tel: "03-3463-1211",
              distance: 1.8,
              category: "LARGE",
              geocode: "139.6982,35.6465",
              systemid: "Tokyo_Shibuya",
              url: "https://www.lib.city.shibuya.tokyo.jp/"
            },
            {
              id: "Shinjuku_Central_Library",
              name: "新宿区立中央図書館",
              shortName: "新宿中央図書館",
              address: "東京都新宿区大久保3-1-1",
              tel: "03-3364-1421",
              distance: 2.1,
              category: "LARGE",
              geocode: "139.7006,35.7018",
              systemid: "Tokyo_Shinjuku",
              url: "https://www.library.shinjuku.tokyo.jp/"
            },
            {
              id: "National_Diet_Library",
              name: "国立国会図書館東京本館",
              shortName: "国会図書館",
              address: "東京都千代田区永田町1-10-1",
              tel: "03-3581-2331",
              distance: 2.3,
              category: "SPECIAL",
              geocode: "139.7431,35.6782",
              systemid: "National_Diet",
              url: "https://www.ndl.go.jp/"
            },
            {
              id: "Bunkyo_Central_Library",
              name: "文京区立中央図書館",
              shortName: "文京中央図書館",
              address: "東京都文京区春日1-16-21",
              tel: "03-3814-6745",
              distance: 2.5,
              category: "LARGE",
              geocode: "139.7527,35.7067",
              systemid: "Tokyo_Bunkyo",
              url: "https://www.lib.city.bunkyo.tokyo.jp/"
            },
            {
              id: "Taito_Central_Library",
              name: "台東区立中央図書館",
              shortName: "台東中央図書館",
              address: "東京都台東区西浅草3-25-16",
              tel: "03-5246-5911",
              distance: 2.8,
              category: "MEDIUM",
              geocode: "139.7890,35.7141",
              systemid: "Tokyo_Taito",
              url: "https://www.library.city.taito.tokyo.jp/"
            },
            {
              id: "Sumida_Midori_Library",
              name: "墨田区立緑図書館",
              shortName: "緑図書館",
              address: "東京都墨田区緑2-24-5",
              tel: "03-3631-5315",
              distance: 3.2,
              category: "SMALL",
              geocode: "139.8187,35.7084",
              systemid: "Tokyo_Sumida",
              url: "https://www.lib.city.sumida.tokyo.jp/"
            },
            {
              id: "Koto_Kameido_Library",
              name: "江東区立亀戸図書館",
              shortName: "亀戸図書館",
              address: "東京都江東区亀戸7-39-02",
              tel: "03-3636-6061",
              distance: 3.6,
              category: "MEDIUM",
              geocode: "139.8263,35.6965",
              systemid: "Tokyo_Koto",
              url: "https://www.koto-lib.tokyo.jp/"
            },
            {
              id: "Edogawa_Central_Library",
              name: "江戸川区立中央図書館",
              shortName: "江戸川中央図書館",
              address: "東京都江戸川区中央3-1-3",
              tel: "03-3656-6211",
              distance: 4.1,
              category: "LARGE",
              geocode: "139.8685,35.6782",
              systemid: "Tokyo_Edogawa",
              url: "https://www.library.city.edogawa.tokyo.jp/"
            },
            {
              id: "Katsushika_Central_Library",
              name: "葛飾区立中央図書館",
              shortName: "葛飾中央図書館",
              address: "東京都葛飾区金町6-2-1",
              tel: "03-3607-9201",
              distance: 4.5,
              category: "LARGE",
              geocode: "139.8707,35.7655",
              systemid: "Tokyo_Katsushika",
              url: "https://www.lib.city.katsushika.tokyo.jp/"
            },
            {
              id: "Adachi_Central_Library",
              name: "足立区立中央図書館",
              shortName: "足立中央図書館",
              address: "東京都足立区千住5-13-5",
              tel: "03-5813-3740",
              distance: 4.8,
              category: "LARGE",
              geocode: "139.8043,35.7490",
              systemid: "Tokyo_Adachi",
              url: "https://www.city.adachi.tokyo.jp/tosyokan/"
            },
            {
              id: "Arakawa_Central_Library",
              name: "荒川区立中央図書館",
              shortName: "荒川中央図書館",
              address: "東京都荒川区荒川3-49-1",
              tel: "03-3891-4349",
              distance: 5.2,
              category: "MEDIUM",
              geocode: "139.7831,35.7362",
              systemid: "Tokyo_Arakawa",
              url: "https://www.arakawa-lib.tokyo.jp/"
            },
            {
              id: "Kita_Central_Library",
              name: "北区立中央図書館",
              shortName: "北中央図書館", 
              address: "東京都北区十条台1-2-5",
              tel: "03-5993-1125",
              distance: 5.5,
              category: "MEDIUM",
              geocode: "139.7289,35.7520",
              systemid: "Tokyo_Kita",
              url: "https://www.library.city.kita.tokyo.jp/"
            }
          ];
          
          const mockUserLocation = {
            latitude: 35.6812,
            longitude: 139.7671,
            accuracy: 10
          };

          console.log(`📱 ${pageData.title}用モックデータ設定中...`);
          
          const event = new CustomEvent('mockDataForScreenshot', {
            detail: { userLocation: mockUserLocation, libraries: mockLibraries }
          });
          window.dispatchEvent(event);
          
          return mockLibraries.length;
        }, pageInfo);
        
        // ページ固有の要素をチェック
        if (pageInfo.name === 'map-page') {
          await page.waitForSelector('.library-map', { timeout: 10000 });
        } else if (pageInfo.name === 'book-search') {
          await page.waitForSelector('.book-search-container', { timeout: 10000 });
        }
        
        // レンダリング待機（モバイルはより長く待機）
        await new Promise(resolve => setTimeout(resolve, 7000));
        
        const filename = `${pageInfo.name}-mobile-${timestamp}.png`;
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

takeMobileScreenshots();