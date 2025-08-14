/**
 * サービスレイヤー統合エクスポート
 * APIサービスクラスと統合サービスのエクスポート
 */

// 統合サービス
export { LibrarySearchService } from './LibrarySearchService';

// 個別APIサービス
export { RakutenBooksService } from './api/RakutenBooksService';
export { CalilApiService } from './api/CalilApiService';
export { OpenBDApiService } from './api/OpenBDApiService';
export { BaseApiClient } from './api/BaseApiClient';

/**
 * 推奨使用方法:
 * 
 * 1. 統合サービスを使用（推奨）:
 *    import { LibrarySearchService } from '@/services';
 *    const searchService = new LibrarySearchService();
 * 
 * 2. 個別APIサービスを使用:
 *    import { RakutenBooksService, CalilApiService } from '@/services';
 *    const rakuten = new RakutenBooksService();
 *    const calil = new CalilApiService();
 * 
 * 3. カスタムAPIクライアント作成:
 *    import { BaseApiClient } from '@/services';
 *    class CustomApiService extends BaseApiClient { ... }
 */

/**
 * サービスレイヤーアーキテクチャ:
 * 
 * LibrarySearchService (統合サービス)
 * ├── RakutenBooksService (楽天Books API)
 * ├── CalilApiService (カーリル図書館API)
 * ├── OpenBDApiService (OpenBD書誌情報API)
 * └── BaseApiClient (共通基盤クラス)
 * 
 * 各サービスは以下を提供:
 * - 統一されたエラーハンドリング
 * - レート制限とリトライ機能
 * - 進捗追跡
 * - 統計情報
 * - 接続テスト
 */