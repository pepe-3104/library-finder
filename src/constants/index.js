/**
 * 定数統合エクスポート
 * アプリケーション全体で使用される定数の統一インターフェース
 */

// タイムアウト・時間関連
export {
  API_TIMEOUTS,
  POLLING_INTERVALS,
  CACHE_DURATIONS,
  RETRY_CONFIG,
  LIMITS,
  UI_TIMING,
  DEBUG_TIMING
} from './timeouts';

/**
 * 推奨使用方法:
 * 
 * import { API_TIMEOUTS, LIMITS } from '@/constants';
 * 
 * // タイムアウト設定
 * const timeout = API_TIMEOUTS.RAKUTEN_BOOKS;
 * 
 * // 表示制限
 * const maxResults = LIMITS.MAX_SEARCH_RESULTS;
 */