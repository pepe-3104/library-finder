/**
 * 書籍検索ページング管理専用フック
 * ページネーションの状態管理と操作を提供
 */

import { useState, useCallback } from 'react';

export const useBookSearchPagination = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageInfo, setPageInfo] = useState(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentSearchType, setCurrentSearchType] = useState('');
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');

  /**
   * ページ情報を更新
   * @param {Object} newPageInfo - 新しいページ情報
   * @param {number} newTotalCount - 新しい総件数
   */
  const updatePageInfo = useCallback((newPageInfo, newTotalCount) => {
    setPageInfo(newPageInfo);
    setTotalCount(newTotalCount || 0);
    if (newPageInfo) {
      setCurrentPage(newPageInfo.page || 1);
    }
  }, []);

  /**
   * 検索情報を更新
   * @param {string} query - 検索クエリ
   * @param {string} searchType - 検索タイプ
   */
  const updateSearchInfo = useCallback((query, searchType) => {
    setCurrentQuery(query);
    setCurrentSearchType(searchType);
    setLastSearchedQuery(query);
  }, []);

  /**
   * 新しい検索の開始
   * @param {string} query - 検索クエリ
   * @param {string} searchType - 検索タイプ
   */
  const startNewSearch = useCallback((query, searchType) => {
    setCurrentPage(1);
    setTotalCount(0);
    setPageInfo(null);
    updateSearchInfo(query, searchType);
  }, [updateSearchInfo]);

  /**
   * ページ変更
   * @param {number} page - 新しいページ番号
   */
  const changePage = useCallback((page) => {
    if (page >= 1 && pageInfo && page <= pageInfo.pageCount) {
      setCurrentPage(page);
      
      // ページ変更時にページトップにスクロール
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [pageInfo]);

  /**
   * 次のページに移動
   */
  const goToNextPage = useCallback(() => {
    if (pageInfo && currentPage < pageInfo.pageCount) {
      changePage(currentPage + 1);
    }
  }, [currentPage, pageInfo, changePage]);

  /**
   * 前のページに移動
   */
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      changePage(currentPage - 1);
    }
  }, [currentPage, changePage]);

  /**
   * 最初のページに移動
   */
  const goToFirstPage = useCallback(() => {
    changePage(1);
  }, [changePage]);

  /**
   * 最後のページに移動
   */
  const goToLastPage = useCallback(() => {
    if (pageInfo && pageInfo.pageCount) {
      changePage(pageInfo.pageCount);
    }
  }, [pageInfo, changePage]);

  /**
   * ページング情報をクリア
   */
  const clearPagination = useCallback(() => {
    setCurrentPage(1);
    setTotalCount(0);
    setPageInfo(null);
    setCurrentQuery('');
    setCurrentSearchType('');
    setLastSearchedQuery('');
  }, []);

  /**
   * ページング可能かどうかをチェック
   * @returns {boolean} ページング可能かどうか
   */
  const canPaginate = useCallback(() => {
    return pageInfo && pageInfo.pageCount > 1;
  }, [pageInfo]);

  /**
   * 次のページが存在するかチェック
   * @returns {boolean} 次のページが存在するか
   */
  const hasNextPage = useCallback(() => {
    return pageInfo && currentPage < pageInfo.pageCount;
  }, [currentPage, pageInfo]);

  /**
   * 前のページが存在するかチェック
   * @returns {boolean} 前のページが存在するか
   */
  const hasPreviousPage = useCallback(() => {
    return currentPage > 1;
  }, [currentPage]);

  /**
   * ページ範囲情報を取得
   * @returns {Object} ページ範囲情報
   */
  const getPageRange = useCallback(() => {
    if (!pageInfo) {
      return { start: 0, end: 0, total: 0 };
    }

    const itemsPerPage = pageInfo.hits || 10;
    const start = ((currentPage - 1) * itemsPerPage) + 1;
    const end = Math.min(currentPage * itemsPerPage, totalCount);

    return {
      start,
      end,
      total: totalCount,
      itemsPerPage
    };
  }, [currentPage, pageInfo, totalCount]);

  /**
   * ページネーション表示用の数値配列を生成
   * @param {number} maxVisible - 最大表示ページ数
   * @returns {Array} ページ番号配列
   */
  const getVisiblePages = useCallback((maxVisible = 5) => {
    if (!pageInfo || pageInfo.pageCount <= 1) {
      return [];
    }

    const totalPages = pageInfo.pageCount;
    const pages = [];

    if (totalPages <= maxVisible) {
      // 全ページを表示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 現在のページを中心とした範囲を計算
      const half = Math.floor(maxVisible / 2);
      let start = Math.max(1, currentPage - half);
      let end = Math.min(totalPages, start + maxVisible - 1);

      // 範囲調整
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }, [currentPage, pageInfo]);

  /**
   * 検索状態の検証
   * @returns {boolean} 検索が実行可能な状態か
   */
  const isSearchValid = useCallback(() => {
    return currentQuery.trim().length > 0 && currentSearchType.length > 0;
  }, [currentQuery, currentSearchType]);

  /**
   * デバッグ情報を取得
   * @returns {Object} デバッグ情報
   */
  const getDebugInfo = useCallback(() => {
    return {
      currentPage,
      totalCount,
      pageInfo,
      currentQuery,
      currentSearchType,
      lastSearchedQuery,
      canPaginate: canPaginate(),
      hasNextPage: hasNextPage(),
      hasPreviousPage: hasPreviousPage(),
      pageRange: getPageRange(),
      visiblePages: getVisiblePages()
    };
  }, [
    currentPage,
    totalCount,
    pageInfo,
    currentQuery,
    currentSearchType,
    lastSearchedQuery,
    canPaginate,
    hasNextPage,
    hasPreviousPage,
    getPageRange,
    getVisiblePages
  ]);


  return {
    // 状態
    currentPage,
    totalCount,
    pageInfo,
    currentQuery,
    currentSearchType,
    lastSearchedQuery,

    // 操作
    updatePageInfo,
    updateSearchInfo,
    startNewSearch,
    changePage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    clearPagination,

    // 計算値
    canPaginate,
    hasNextPage,
    hasPreviousPage,
    getPageRange,
    getVisiblePages,
    isSearchValid,

    // ユーティリティ
    getDebugInfo
  };
};