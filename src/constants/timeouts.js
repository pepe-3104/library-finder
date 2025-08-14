/**
 * タイムアウト・時間関連の定数
 * アプリケーション全体で使用される時間設定を一元管理
 */

// API タイムアウト設定（ミリ秒）
export const API_TIMEOUTS = {
  // 標準的なAPI呼び出し
  DEFAULT: 15000,           // 15秒
  
  // 楽天Books API
  RAKUTEN_BOOKS: 15000,     // 15秒
  
  // カーリル図書館API（蔵書検索は時間がかかる）
  CALIL_SEARCH: 30000,      // 30秒
  CALIL_POLLING: 30000,     // 30秒
  
  // OpenBD API（軽量）
  OPENBD: 10000,           // 10秒
  
  // 地理位置情報取得
  GEOLOCATION: 10000,      // 10秒
  
  // スクリーンショット・テスト用
  SCREENSHOT: 30000,       // 30秒
  TEST_WAIT: 5000,        // 5秒
};

// ポーリング間隔（ミリ秒）
export const POLLING_INTERVALS = {
  // カーリルAPI継続検索
  CALIL_POLLING: 1000,     // 1秒間隔
  CALIL_RETRY_DELAY: 500,  // 0.5秒
  
  // UI更新間隔
  UI_DEBOUNCE: 300,        // 0.3秒
  SEARCH_DEBOUNCE: 500,    // 0.5秒
};

// キャッシュ有効期間（ミリ秒）
export const CACHE_DURATIONS = {
  // APIキーキャッシュ
  API_KEY_VALIDATION: 5 * 60 * 1000,      // 5分
  
  // 地理位置情報キャッシュ
  GEOLOCATION: 5 * 60 * 1000,             // 5分
  
  // 検索結果キャッシュ
  SEARCH_RESULTS: 10 * 60 * 1000,         // 10分
  
  // 図書館情報キャッシュ
  LIBRARY_DATA: 30 * 60 * 1000,           // 30分
};

// リトライ設定
export const RETRY_CONFIG = {
  // 最大リトライ回数
  MAX_RETRIES: {
    DEFAULT: 3,
    RAKUTEN: 3,
    CALIL: 2,
    OPENBD: 3,
    GEOLOCATION: 2,
  },
  
  // リトライ間隔（ミリ秒）
  RETRY_DELAY: {
    DEFAULT: 1000,          // 1秒
    EXPONENTIAL_BASE: 2,    // 指数バックオフ用
  },
};

// ページング・表示制限
export const LIMITS = {
  // 検索結果表示件数
  SEARCH_RESULTS_PER_PAGE: 10,
  MAX_SEARCH_RESULTS: 30,
  
  // 図書館検索
  MAX_LIBRARIES_DISPLAY: 50,
  DEFAULT_SEARCH_RADIUS: 5,  // km
  
  // APIレート制限（1分あたりのリクエスト数）
  RATE_LIMITS: {
    RAKUTEN: 100,
    CALIL: 60,
    OPENBD: 100,
  },
};

// UI関連の時間設定
export const UI_TIMING = {
  // アニメーション
  ANIMATION_DURATION: 300,     // 0.3秒
  TRANSITION_DURATION: 200,    // 0.2秒
  
  // 通知表示時間
  NOTIFICATION_DURATION: 4000, // 4秒
  ERROR_DISPLAY_DURATION: 6000, // 6秒
  
  // ローディング表示
  MIN_LOADING_DURATION: 500,   // 最小ローディング時間
  
  // スクロール
  SMOOTH_SCROLL_DURATION: 800, // 0.8秒
};

// デバッグ・開発用
export const DEBUG_TIMING = {
  // コンソールログの間隔
  LOG_THROTTLE: 1000,         // 1秒
  
  // パフォーマンス測定
  PERFORMANCE_SAMPLE_RATE: 0.1, // 10%をサンプリング
};