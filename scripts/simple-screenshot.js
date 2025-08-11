import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function takeScreenshot() {
  const screenshotDir = path.join(__dirname, '..', 'screenshots');
  
  // ディレクトリ作成
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:5181', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // モックデータを自動的に設定
    const mockDataResult = await page.evaluate(() => {
      // 東京駅周辺の図書館モックデータ（カーリルAPI形式: 経度,緯度）
      const mockLibraries = [
        {
          id: "Chiyoda_Central_Library",
          name: "千代田区立日比谷図書文化館",
          shortName: "日比谷図書文化館",
          address: "東京都千代田区日比谷公園1-4",
          tel: "03-3502-3340",
          url: "https://www.library.chiyoda.tokyo.jp/",
          distance: 1.2,
          category: "LARGE",
          geocode: "139.7594,35.6741",
          isil: "JP-1000001"
        },
        {
          id: "Chuo_Kyoboshi_Library",
          name: "中央区立京橋図書館",
          shortName: "京橋図書館",
          address: "東京都中央区京橋2-6-7",
          tel: "03-3561-0968",
          url: "https://www.library.city.chuo.tokyo.jp/",
          distance: 0.7,
          category: "MEDIUM",
          geocode: "139.7709,35.6751",
          isil: "JP-1000002"
        },
        {
          id: "Chuo_Chuo_Library",
          name: "中央区立中央図書館",
          shortName: "中央区立中央図書館",
          address: "東京都中央区明石町12-1",
          tel: "03-3543-9025",
          url: "https://www.library.city.chuo.tokyo.jp/",
          distance: 1.8,
          category: "LARGE",
          geocode: "139.7735,35.6694",
          isil: "JP-1000003"
        },
        {
          id: "National_Diet_Library",
          name: "国立国会図書館東京本館",
          shortName: "国会図書館",
          address: "東京都千代田区永田町1-10-1",
          tel: "03-3581-2331",
          url: "https://www.ndl.go.jp/",
          distance: 2.1,
          category: "SPECIAL",
          geocode: "139.7431,35.6782",
          isil: "JP-1000004"
        },
        {
          id: "Chiyoda_Kanda_Library",
          name: "千代田区立神田まちかど図書館",
          shortName: "神田まちかど図書館",
          address: "東京都千代田区神田司町2-16",
          tel: "03-3256-6061",
          url: "https://www.library.chiyoda.tokyo.jp/",
          distance: 1.1,
          category: "SMALL",
          geocode: "139.7632,35.6916",
          isil: "JP-1000005"
        },
        {
          id: "Minato_Akasaka_Library", 
          name: "港区立赤坂図書館",
          shortName: "赤坂図書館",
          address: "東京都港区赤坂4-18-21",
          tel: "03-3408-5090",
          url: "https://www.lib.city.minato.tokyo.jp/",
          distance: 2.3,
          category: "MEDIUM",
          geocode: "139.7364,35.6779",
          isil: "JP-1000006"
        }
      ];
      
      // 東京駅の位置情報
      const mockUserLocation = {
        latitude: 35.6812,
        longitude: 139.7671,
        accuracy: 10
      };

      console.log('📸 スクリーンショット用モックデータを設定中...');
      
      // ReactのAppコンポーネントの状態を直接操作
      // 実際のReactイベントをトリガー
      const event = new CustomEvent('mockDataForScreenshot', {
        detail: { userLocation: mockUserLocation, libraries: mockLibraries }
      });
      window.dispatchEvent(event);
      
      return mockLibraries.length;
    });
    
    console.log(`✅ ${mockDataResult}件の図書館モックデータを設定しました`);
    
    // 地図とマーカーの表示を待つ
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Reactコンポーネントの状態を確認
    const reactState = await page.evaluate(() => {
      // LibrarySearchSectionコンポーネントの状態を確認
      const searchSection = document.querySelector('[data-component="library-search"]');
      
      // MapSectionコンポーネントの状態を確認  
      const mapSection = document.querySelector('[data-section="map"]');
      
      console.log('🔍 Search section:', searchSection ? 'found' : 'not found');
      console.log('🗺️ Map section:', mapSection ? 'found' : 'not found');
      
      return {
        hasSearchSection: !!searchSection,
        hasMapSection: !!mapSection
      };
    });
    
    console.log('📦 React状態:', reactState);
    
    // 少し待ってから地図マーカーをチェック
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 地図上のマーカーが実際に表示されているかチェック
    const markerInfo = await page.evaluate(() => {
      const markers = document.querySelectorAll('.leaflet-marker-icon');
      const libraryMarkers = document.querySelectorAll('.custom-library-marker');
      const locationMarkers = document.querySelectorAll('.custom-location-marker');
      const leafletMarkerPanes = document.querySelectorAll('.leaflet-marker-pane');
      
      console.log('🗺️ 全マーカー数:', markers.length);
      console.log('📚 図書館マーカー数:', libraryMarkers.length);
      console.log('📍 位置マーカー数:', locationMarkers.length);
      console.log('🎯 Leaflet marker panes:', leafletMarkerPanes.length);
      
      // DOM内の図書館リストも確認
      const libraryListItems = document.querySelectorAll('.library-item');
      console.log('📋 図書館リストアイテム数:', libraryListItems.length);
      
      return {
        total: markers.length,
        library: libraryMarkers.length,
        location: locationMarkers.length,
        libraryListItems: libraryListItems.length
      };
    });
    
    console.log(`🗺️ 地図マーカー情報:`, markerInfo);
    console.log(`📍 総マーカー数: ${markerInfo.total}, 図書館: ${markerInfo.library}, 位置: ${markerInfo.location}`);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `library-app-initial-${timestamp}.png`;
    const filepath = path.join(screenshotDir, filename);
    
    await page.screenshot({
      path: filepath,
      fullPage: true
    });
    
    console.log(`📸 スクリーンショット保存: ${filename}`);
    return filepath;
    
  } catch (error) {
    console.error('エラー:', error.message);
  } finally {
    await browser.close();
  }
}

takeScreenshot();