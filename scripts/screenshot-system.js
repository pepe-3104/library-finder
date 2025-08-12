/* eslint-env node */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 図書館検索アプリのスクリーンショット撮影システム
 */
class LibraryAppScreenshotSystem {
  constructor() {
    this.screenshotDir = path.join(__dirname, '..', 'screenshots');
    this.ensureScreenshotDir();
  }

  // スクリーンショット保存ディレクトリを作成
  ensureScreenshotDir() {
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  // タイムスタンプ付きのファイル名を生成
  generateFilename(prefix = 'library-app', suffix = '') {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-')
      .slice(0, 19);
    return `${prefix}${suffix ? '-' + suffix : ''}-${timestamp}.png`;
  }

  // 基本的なスクリーンショット撮影
  async captureBasicScreenshot(url = 'http://localhost:5173', options = {}) {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    try {
      // ビューポートサイズを設定
      await page.setViewport({
        width: options.width || 1280,
        height: options.height || 800
      });

      // ページにアクセス
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // 追加の待機時間
      await page.waitForTimeout(2000);

      // スクリーンショットを撮影
      const filename = this.generateFilename('library-app', options.suffix);
      const filepath = path.join(this.screenshotDir, filename);
      
      await page.screenshot({
        path: filepath,
        fullPage: options.fullPage || true
      });

      console.log(`📸 スクリーンショット保存: ${filename}`);
      return { filename, filepath };

    } catch (error) {
      console.error('❌ スクリーンショット撮影エラー:', error.message);
      throw error;
    } finally {
      await browser.close();
    }
  }

  // アプリの主要機能のスクリーンショット撮影
  async captureAppFlow(url = 'http://localhost:5173') {
    const browser = await puppeteer.launch({
      headless: false, // デバッグ用
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    const screenshots = [];
    
    try {
      await page.setViewport({ width: 1280, height: 800 });
      
      // 位置情報のモック設定（東京駅）
      const context = browser.defaultBrowserContext();
      await context.overridePermissions(url, ['geolocation']);
      await page.setGeolocation({
        latitude: 35.6812,
        longitude: 139.7671
      });

      await page.goto(url, { waitUntil: 'networkidle0' });
      await page.waitForTimeout(2000);

      // 1. 初期状態
      let result = await this.capturePageState(page, '01-initial');
      screenshots.push(result);

      // 2. 位置情報取得後（ボタンクリック）
      try {
        const locationButton = await page.$('.location-button, [data-testid="location-button"], button');
        if (locationButton) {
          await locationButton.click();
          await page.waitForTimeout(3000);
          
          result = await this.capturePageState(page, '02-location-obtained');
          screenshots.push(result);
        }
      } catch {
        console.log('ℹ️ 位置情報ボタンが見つからないか、まだ実装されていません');
      }

      // 3. 図書館リスト表示
      try {
        await page.waitForSelector('.library-list, .library-card', { timeout: 5000 });
        await page.waitForTimeout(2000);
        
        result = await this.capturePageState(page, '03-library-list');
        screenshots.push(result);
      } catch {
        console.log('ℹ️ 図書館リストの表示を待機中にタイムアウト');
      }

      // 4. 地図表示
      try {
        await page.waitForSelector('.leaflet-container, .map-container', { timeout: 5000 });
        await page.waitForTimeout(2000);
        
        result = await this.capturePageState(page, '04-map-view');
        screenshots.push(result);
      } catch {
        console.log('ℹ️ 地図表示の待機中にタイムアウト');
      }

      // 5. 蔵書検索
      try {
        const searchInput = await page.$('input[type="search"], input[placeholder*="検索"], .search-input');
        if (searchInput) {
          await searchInput.type('図書館');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(3000);
          
          result = await this.capturePageState(page, '05-book-search');
          screenshots.push(result);
        }
      } catch {
        console.log('ℹ️ 蔵書検索機能がまだ実装されていません');
      }

      console.log(`\n✅ アプリフローのスクリーンショット撮影完了!`);
      console.log('📁 保存されたファイル:');
      screenshots.forEach(shot => {
        if (shot) console.log(`   - ${shot.filename}`);
      });

      return screenshots;

    } catch (error) {
      console.error('アプリフロー撮影エラー:', error.message);
      throw error;
    } finally {
      await browser.close();
    }
  }

  // ページ状態のスクリーンショット撮影
  async capturePageState(page, suffix) {
    try {
      const filename = this.generateFilename('library-app', suffix);
      const filepath = path.join(this.screenshotDir, filename);
      
      await page.screenshot({
        path: filepath,
        fullPage: true
      });

      console.log(`📸 ${suffix} スクリーンショット保存: ${filename}`);
      return { filename, filepath, suffix };
    } catch (error) {
      console.error(`${suffix} スクリーンショット撮影エラー:`, error.message);
      return null;
    }
  }

  // レスポンシブ対応スクリーンショット
  async captureResponsive(url = 'http://localhost:5173') {
    const viewports = [
      { name: 'desktop', width: 1280, height: 800 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 667 }
    ];

    const screenshots = [];

    for (const viewport of viewports) {
      try {
        const result = await this.captureBasicScreenshot(url, {
          width: viewport.width,
          height: viewport.height,
          suffix: `responsive-${viewport.name}`,
          fullPage: true
        });
        screenshots.push(result);
      } catch (error) {
        console.error(`${viewport.name}スクリーンショット撮影エラー:`, error.message);
      }
    }

    console.log('📱 レスポンシブスクリーンショット撮影完了');
    return screenshots;
  }
}

// コマンドライン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const screenshotSystem = new LibraryAppScreenshotSystem();
  const command = process.argv[2] || 'basic';
  const url = process.argv[3] || 'http://localhost:5173';

  (async () => {
    try {
      switch (command) {
        case 'basic':
          await screenshotSystem.captureBasicScreenshot(url);
          break;
        case 'flow':
          await screenshotSystem.captureAppFlow(url);
          break;
        case 'responsive':
          await screenshotSystem.captureResponsive(url);
          break;
        case 'all':
          await screenshotSystem.captureBasicScreenshot(url);
          await screenshotSystem.captureResponsive(url);
          break;
        default:
          console.log('使用方法: node screenshot-system.js [basic|flow|responsive|all] [url]');
      }
    } catch (error) {
      console.error('実行エラー:', error.message);
      process.exit(1);
    }
  })();
}

export default LibraryAppScreenshotSystem;