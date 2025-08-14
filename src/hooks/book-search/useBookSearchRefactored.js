/**
 * リファクタリング版 - 統合書籍検索フック
 * 分割された専用フックを組み合わせたクリーンな実装
 */

import { useState, useCallback } from 'react';
import { useISBNSearch } from './useISBNSearch';
import { useTitleSearch } from './useTitleSearch';
import { useLibraryDataLoader } from './useLibraryDataLoader';
import { useBookSearchPagination } from './useBookSearchPagination';
import { errorLogger } from '../../utils/errors';

export const useBookSearchRefactored = () => {
  // 分割されたフックを使用
  const isbnSearch = useISBNSearch();
  const titleSearch = useTitleSearch();
  const libraryLoader = useLibraryDataLoader();
  const pagination = useBookSearchPagination();

  // 統合状態
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [cachedSystemIds, setCachedSystemIds] = useState([]);

  /**
   * メイン検索関数
   * @param {string} query - 検索クエリ
   * @param {string} searchType - 検索タイプ ('isbn' | 'title' | 'author')
   * @param {string[]} systemIds - 図書館システムID配列
   * @param {number} page - ページ番号
   */
  const searchBooks = useCallback(async (query, searchType, systemIds, page = 1) => {
    if (!query.trim() || !systemIds || systemIds.length === 0) {
      setError('検索条件が正しくありません');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setCurrentSession(null);
    setCachedSystemIds(systemIds);

    // 新しい検索の場合はページング情報をリセット
    if (page === 1) {
      pagination.startNewSearch(query, searchType);
    }

    try {
      let searchResults = [];

      if (searchType === 'isbn') {
        // ISBN検索
        const isbnResults = await isbnSearch.searchByISBN(query, systemIds);
        searchResults = Array.isArray(isbnResults) ? isbnResults : [isbnResults];
        
        // ISBN検索の場合はページング情報をクリア（1件のみの結果なので）
        pagination.updatePageInfo({
          page: 1,
          pageCount: 1,
          hits: 1,
          first: 1,
          last: 1
        }, 1);
      } else {
        // タイトル・著者検索
        const titleResults = await titleSearch.searchByTitle(query, systemIds, searchType, page);
        searchResults = Array.isArray(titleResults) ? titleResults : [titleResults];
        
        // ページング情報を更新
        pagination.updatePageInfo(titleSearch.pageInfo, titleSearch.totalCount);
      }

      // 結果をフラット化
      const flatResults = searchResults.flat().filter(result => result !== null);
      setResults(flatResults);

      if (flatResults.length === 0) {
        setError('検索条件に一致する蔵書が見つかりませんでした');
      }
    } catch (err) {
      const errorMessage = err.userMessage || err.message || '蔵書検索中にエラーが発生しました';
      setError(errorMessage);
      errorLogger.log(err, { operation: 'searchBooks', query, searchType, systemIds, page });
    } finally {
      setLoading(false);
    }
  }, [isbnSearch, titleSearch, pagination]);

  /**
   * ページ切り替え検索
   * @param {number} page - ページ番号
   */
  const searchBooksPage = useCallback(async (page) => {
    if (!pagination.isSearchValid() || !cachedSystemIds.length) {
      setError('検索状態が不正です');
      return;
    }

    pagination.changePage(page);
    await searchBooks(pagination.currentQuery, pagination.currentSearchType, cachedSystemIds, page);
  }, [searchBooks, pagination, cachedSystemIds]);

  /**
   * 個別書籍の蔵書情報読み込み
   * @param {string} isbn - 読み込み対象のISBN
   */
  const loadLibraryDataForBook = useCallback(async (isbn) => {
    if (!cachedSystemIds.length) {
      throw new Error('図書館システム情報が見つかりません');
    }

    const bookIndex = results.findIndex(book => book.isbn === isbn);
    if (bookIndex === -1) {
      throw new Error('書籍が見つかりません');
    }

    const book = results[bookIndex];

    // 既に読み込み済みまたは読み込み中の場合はスキップ
    if (book.isLibraryDataLoaded || book.isLibraryDataLoading) {
      return;
    }

    // 書籍の読み込み状態を更新
    setResults(prevResults => {
      const newResults = [...prevResults];
      newResults[bookIndex] = { ...book, isLibraryDataLoading: true };
      return newResults;
    });

    try {
      // 進捗更新コールバック関数
      const handleProgressUpdate = (isbn, progressData) => {
        setResults(prevResults => {
          const newResults = [...prevResults];
          const currentBook = newResults[bookIndex];

          if (currentBook) {
            // 既存のsystems情報と新しい情報をマージ
            const mergedSystems = {
              ...(currentBook.systems || {}),
              ...(progressData.systems || {})
            };

            // 進捗情報を追加
            const totalLibraries = cachedSystemIds.length;
            const completedLibraries = Object.keys(mergedSystems).length;

            newResults[bookIndex] = {
              ...currentBook,
              systems: mergedSystems,
              isLibraryDataLoading: !progressData.isComplete,
              isLibraryDataLoaded: progressData.isComplete,
              librarySearchProgress: {
                total: totalLibraries,
                completed: completedLibraries,
                isComplete: progressData.isComplete
              }
            };
          }

          return newResults;
        });
      };

      await libraryLoader.loadLibraryDataForBook(isbn, cachedSystemIds, handleProgressUpdate);
    } catch (error) {
      // エラー状態を更新
      setResults(prevResults => {
        const newResults = [...prevResults];
        newResults[bookIndex] = {
          ...book,
          isLibraryDataLoaded: true,
          isLibraryDataLoading: false,
          libraryDataError: error.message
        };
        return newResults;
      });

      throw error;
    }
  }, [results, cachedSystemIds, libraryLoader]);

  /**
   * 検索結果クリア
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setCurrentSession(null);
    setCachedSystemIds([]);
    pagination.clearPagination();
    titleSearch.clearSearchResults();
    libraryLoader.clearLoadingState();
  }, [pagination, titleSearch, libraryLoader]);

  /**
   * バッチで蔵書情報を読み込み
   * @param {Array} books - 対象書籍配列
   */
  const loadLibraryDataBatch = useCallback(async (books = results) => {
    if (!cachedSystemIds.length || !books.length) {
      return;
    }

    const handleBatchProgress = (isbn, progressData) => {
      setResults(prevResults => {
        return prevResults.map(book => {
          if (book.isbn === isbn) {
            return {
              ...book,
              systems: { ...(book.systems || {}), ...(progressData.systems || {}) },
              isLibraryDataLoading: !progressData.isComplete,
              isLibraryDataLoaded: progressData.isComplete
            };
          }
          return book;
        });
      });
    };

    try {
      const updatedBooks = await libraryLoader.loadLibraryDataBatch(
        books,
        cachedSystemIds,
        handleBatchProgress,
        3 // バッチサイズ
      );

      setResults(updatedBooks);
    } catch (error) {
      errorLogger.log(error, { operation: 'loadLibraryDataBatch', bookCount: books.length });
      setError('蔵書情報の一括読み込みに失敗しました');
    }
  }, [results, cachedSystemIds, libraryLoader]);

  /**
   * 検索状態の診断情報を取得
   */
  const getDiagnosticInfo = useCallback(() => {
    return {
      results: results.length,
      loading,
      error,
      currentSession,
      cachedSystemIds: cachedSystemIds.length,
      pagination: pagination.getDebugInfo(),
      libraryLoader: libraryLoader.getLoadingStats(),
      titleSearch: {
        loading: titleSearch.loading,
        error: titleSearch.error,
        totalCount: titleSearch.totalCount,
        pageInfo: titleSearch.pageInfo
      },
      isbnSearch: {
        loading: isbnSearch.loading,
        error: isbnSearch.error
      }
    };
  }, [
    results,
    loading,
    error,
    currentSession,
    cachedSystemIds,
    pagination,
    libraryLoader,
    titleSearch,
    isbnSearch
  ]);

  // 統合されたloading状態
  const isLoading = loading || titleSearch.loading || isbnSearch.loading;

  // 統合されたerror状態
  const currentError = error || titleSearch.error || isbnSearch.error;


  return {
    // 基本状態
    results,
    loading: isLoading,
    error: currentError,
    currentSession,

    // ページング関連
    totalCount: pagination.totalCount,
    pageInfo: pagination.pageInfo,
    lastSearchedQuery: pagination.lastSearchedQuery,

    // 操作関数
    searchBooks,
    searchBooksPage,
    loadLibraryDataForBook,
    loadLibraryDataBatch,
    clearResults,

    // ページング操作
    changePage: pagination.changePage,
    goToNextPage: pagination.goToNextPage,
    goToPreviousPage: pagination.goToPreviousPage,

    // ユーティリティ
    getDiagnosticInfo,

    // 個別フックへのアクセス（高度な使用のため）
    hooks: {
      isbnSearch,
      titleSearch,
      libraryLoader,
      pagination
    }
  };
};