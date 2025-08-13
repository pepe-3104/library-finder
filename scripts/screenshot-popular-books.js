import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateTimestamp = () => {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
};

const screenshotPopularBooksPage = async () => {
  let browser;
  
  try {
    console.log('📸 人気の本ページのスクリーンショット撮影中...');
    
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // ビューポートを設定
    await page.setViewport({ width: 1200, height: 800 });
    
    // ページを訪問
    await page.goto('http://localhost:5173/popular', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    // APIの読み込み待機
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // スクリーンショット保存
    const timestamp = generateTimestamp();
    const filename = `popular-books-final-${timestamp}.png`;
    const screenshotPath = path.join(__dirname, '..', 'screenshots', filename);
    
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    
    console.log(`✅ 人気の本ページのスクリーンショット保存: ${filename}`);
    
  } catch (error) {
    console.error('❌ 人気の本ページのスクリーンショット撮影エラー:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// メイン実行
screenshotPopularBooksPage();