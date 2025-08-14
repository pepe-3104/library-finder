/**
 * 蔵書情報読み込み専用フック
 * 個別書籍の図書館蔵書情報を非同期で読み込む
 */

import { useState, useCallback } from 'react';
import { searchLibraryBooks } from '../../utils/calilApi';
import { errorLogger } from '../../utils/errors';

export const useLibraryDataLoader = () => {
  const [loadingBooks, setLoadingBooks] = useState(new Set());
  const [loadingErrors, setLoadingErrors] = useState(new Map());

  /**
   * 個別書籍の蔵書情報読み込み
   * @param {string} isbn - 読み込み対象のISBN
   * @param {string[]} systemIds - 検索対象の図書館システムID配列
   * @param {Function} onProgress - 進捗更新コールバック
   * @returns {Promise<Object>} 蔵書情報
   */
  const loadLibraryDataForBook = useCallback(async (isbn, systemIds, onProgress) => {
    if (!systemIds || systemIds.length === 0) {
      throw new Error('図書館システム情報が見つかりません');
    }

    if (!isbn || !isbn.trim()) {
      throw new Error('ISBNが指定されていません');
    }

    // 既に読み込み中かチェック
    if (loadingBooks.has(isbn)) {
      console.log(`📚 ISBN ${isbn} は既に読み込み中です`);
      return;
    }

    // 読み込み開始状態を設定
    setLoadingBooks(prev => new Set([...prev, isbn]));
    setLoadingErrors(prev => {
      const newMap = new Map(prev);
      newMap.delete(isbn);
      return newMap;
    });

    try {
      // 進捗更新のラッパー関数
      const progressHandler = (progressData) => {
        if (onProgress) {
          onProgress(isbn, progressData);
        }
      };

      // searchLibraryBooksを使用して順次更新対応の検索を実行
      const libraryData = await searchLibraryBooks(isbn, systemIds, progressHandler);
      
      return libraryData;
    } catch (error) {
      errorLogger.log(error, { operation: 'loadLibraryDataForBook', isbn, systemIds });
      
      // エラー状態を保存
      setLoadingErrors(prev => {
        const newMap = new Map(prev);
        newMap.set(isbn, error.message || '蔵書情報の読み込みに失敗しました');
        return newMap;
      });
      
      throw error;
    } finally {
      // 読み込み完了状態を設定
      setLoadingBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(isbn);
        return newSet;
      });
    }
  }, [loadingBooks]);

  /**
   * 複数書籍の蔵書情報を並行読み込み
   * @param {Array} books - 読み込み対象の書籍配列
   * @param {string[]} systemIds - 検索対象の図書館システムID配列
   * @param {Function} onProgress - 進捗更新コールバック
   * @returns {Promise<Array>} 読み込み結果配列
   */
  const loadLibraryDataForBooks = useCallback(async (books, systemIds, onProgress) => {
    if (!books || books.length === 0) {
      return [];
    }

    const loadPromises = books.map(book => {
      if (book.isLibraryDataLoaded || book.isLibraryDataLoading) {
        return Promise.resolve(book);
      }

      return loadLibraryDataForBook(book.isbn, systemIds, onProgress)
        .then(libraryData => ({
          ...book,
          systems: libraryData.systems || {},
          isLibraryDataLoaded: true,
          isLibraryDataLoading: false
        }))
        .catch(error => ({
          ...book,
          isLibraryDataLoaded: true,
          isLibraryDataLoading: false,
          libraryDataError: error.message
        }));
    });

    try {
      const results = await Promise.allSettled(loadPromises);
      return results.map(result => result.status === 'fulfilled' ? result.value : result.reason);
    } catch (error) {
      errorLogger.log(error, { operation: 'loadLibraryDataForBooks', bookCount: books.length });
      throw error;
    }
  }, [loadLibraryDataForBook]);

  /**
   * 特定の書籍が読み込み中かチェック
   * @param {string} isbn - チェック対象のISBN
   * @returns {boolean} 読み込み中かどうか
   */
  const isBookLoading = useCallback((isbn) => {
    return loadingBooks.has(isbn);
  }, [loadingBooks]);

  /**
   * 特定の書籍のエラー情報を取得
   * @param {string} isbn - チェック対象のISBN
   * @returns {string|null} エラーメッセージ
   */
  const getBookError = useCallback((isbn) => {
    return loadingErrors.get(isbn) || null;
  }, [loadingErrors]);

  /**
   * 読み込み状態をクリア
   * @param {string} [isbn] - 特定のISBN（省略時は全て）
   */
  const clearLoadingState = useCallback((isbn = null) => {
    if (isbn) {
      setLoadingBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(isbn);
        return newSet;
      });
      setLoadingErrors(prev => {
        const newMap = new Map(prev);
        newMap.delete(isbn);
        return newMap;
      });
    } else {
      setLoadingBooks(new Set());
      setLoadingErrors(new Map());
    }
  }, []);

  /**
   * 読み込み統計情報を取得
   * @returns {Object} 統計情報
   */
  const getLoadingStats = useCallback(() => {
    return {
      loadingCount: loadingBooks.size,
      errorCount: loadingErrors.size,
      loadingBooks: Array.from(loadingBooks),
      errorBooks: Array.from(loadingErrors.keys())
    };
  }, [loadingBooks, loadingErrors]);

  /**
   * バッチ処理で蔵書情報を効率的に読み込み
   * @param {Array} books - 読み込み対象の書籍配列
   * @param {string[]} systemIds - 検索対象の図書館システムID配列
   * @param {Function} onProgress - 進捗更新コールバック
   * @param {number} batchSize - バッチサイズ（デフォルト: 3）
   * @returns {Promise<Array>} 読み込み結果配列
   */
  const loadLibraryDataBatch = useCallback(async (books, systemIds, onProgress, batchSize = 3) => {
    const pendingBooks = books.filter(book => !book.isLibraryDataLoaded && !book.isLibraryDataLoading);
    
    if (pendingBooks.length === 0) {
      return books;
    }

    const results = [...books];
    
    // バッチごとに処理
    for (let i = 0; i < pendingBooks.length; i += batchSize) {
      const batch = pendingBooks.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (book) => {
        try {
          const libraryData = await loadLibraryDataForBook(book.isbn, systemIds, onProgress);
          const bookIndex = results.findIndex(b => b.isbn === book.isbn);
          if (bookIndex !== -1) {
            results[bookIndex] = {
              ...book,
              systems: libraryData.systems || {},
              isLibraryDataLoaded: true,
              isLibraryDataLoading: false
            };
          }
        } catch (error) {
          const bookIndex = results.findIndex(b => b.isbn === book.isbn);
          if (bookIndex !== -1) {
            results[bookIndex] = {
              ...book,
              isLibraryDataLoaded: true,
              isLibraryDataLoading: false,
              libraryDataError: error.message
            };
          }
        }
      });

      await Promise.allSettled(batchPromises);
      
      // バッチ間の間隔（APIレート制限対応）
      if (i + batchSize < pendingBooks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }, [loadLibraryDataForBook]);

  return {
    loadingBooks: Array.from(loadingBooks),
    loadingErrors: Object.fromEntries(loadingErrors),
    loadLibraryDataForBook,
    loadLibraryDataForBooks,
    loadLibraryDataBatch,
    isBookLoading,
    getBookError,
    clearLoadingState,
    getLoadingStats
  };
};