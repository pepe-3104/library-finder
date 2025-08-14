/**
 * 書籍検索フック統合エクスポート
 * 分割されたフックとリファクタリング版の統一インターフェース
 */

// 分割された専用フック
export { useISBNSearch } from './useISBNSearch';
export { useTitleSearch } from './useTitleSearch';
export { useLibraryDataLoader } from './useLibraryDataLoader';
export { useBookSearchPagination } from './useBookSearchPagination';

// リファクタリング版統合フック
export { useBookSearchRefactored } from './useBookSearchRefactored';

/**
 * 推奨使用方法:
 * 
 * 1. 単純な使用:
 *    import { useBookSearchRefactored as useBookSearch } from '@/hooks/book-search';
 * 
 * 2. 個別機能のみ必要:
 *    import { useISBNSearch, useTitleSearch } from '@/hooks/book-search';
 * 
 * 3. 高度なカスタマイズ:
 *    import { 
 *      useISBNSearch,
 *      useTitleSearch, 
 *      useLibraryDataLoader,
 *      useBookSearchPagination 
 *    } from '@/hooks/book-search';
 */