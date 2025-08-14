/**
 * タイトル/著者検索専用フック
 * キーワード検索とページング機能を提供
 */

import { useState, useCallback } from 'react';
import { extractValidISBNs, isRakutenAPIAvailable, searchBooksWithPaging } from '../../utils/rakutenBooks';
import { searchISBNsByTitle, getBookInfoFromISBN, getAvailableTitles } from '../../utils/openBD';
import { normalizeISBN } from '../../utils/common';
import { createError, errorLogger } from '../../utils/errors';

export const useTitleSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pageInfo, setPageInfo] = useState(null);

  /**
   * キーワード検索の実装（楽天Books API統合版・ページング対応）
   * @param {string} keyword - 検索キーワード
   * @param {string[]} systemIds - 図書館システムID配列
   * @param {string} searchType - 検索タイプ（'title' | 'author'）
   * @param {number} page - ページ番号
   * @returns {Promise<Array>} 検索結果
   */
  const searchByTitle = useCallback(async (keyword, systemIds, searchType = 'title', page = 1) => {
    if (!keyword || !keyword.trim()) {
      throw createError.invalidSearchQuery();
    }

    if (!systemIds || systemIds.length === 0) {
      throw new Error('図書館システムIDが指定されていません');
    }

    setLoading(true);
    setError(null);

    try {
      let searchResults = [];
      
      // 1. 楽天Books APIが利用可能な場合はページング付きで検索
      if (isRakutenAPIAvailable()) {
        try {
          // 指定されたページのみ取得（10件ずつ）
          const rakutenResult = await searchBooksWithPaging(keyword, searchType, page, 10);
          
          if (rakutenResult.books.length > 0) {
            // ページ情報を保存
            setTotalCount(rakutenResult.totalCount);
            setPageInfo(rakutenResult.pageInfo);
            
            // 複数の書籍の蔵書検索を並行実行
            const validISBNs = extractValidISBNs(rakutenResult.books);
            
            if (validISBNs.length === 0) {
              throw new Error('検索結果からISBNを取得できませんでした。');
            }
            
            // 楽天Books APIの結果をすべて表示用に変換（蔵書情報なし）
            searchResults = validISBNs.map(isbn => {
              const rakutenBook = rakutenResult.books.find(book => {
                const normalizedIsbn = normalizeISBN(isbn);
                const normalizedBookIsbn = normalizeISBN(book.isbn || '');
                const normalizedBookIsbn13 = normalizeISBN(book.isbn13 || '');
                const normalizedBookIsbn10 = normalizeISBN(book.isbn10 || '');
                
                return normalizedBookIsbn13 === normalizedIsbn || 
                       normalizedBookIsbn10 === normalizedIsbn || 
                       normalizedBookIsbn === normalizedIsbn;
              });
              
              return {
                isbn,
                title: rakutenBook?.title || `書籍 (ISBN: ${isbn})`,
                systems: {}, // 最初は蔵書情報なし
                isLibraryDataLoaded: false, // 蔵書情報が読み込まれているかのフラグ
                isLibraryDataLoading: false,
                ...(rakutenBook && {
                  author: rakutenBook.author,
                  publisher: rakutenBook.publisher,
                  publishDate: rakutenBook.publishDate,
                  pubdate: rakutenBook.publishDate, // BookSearchResultsとの互換性
                  imageUrl: rakutenBook.largeImageUrl || rakutenBook.mediumImageUrl,
                  smallImageUrl: rakutenBook.smallImageUrl,
                  mediumImageUrl: rakutenBook.mediumImageUrl,
                  largeImageUrl: rakutenBook.largeImageUrl,
                  reviewAverage: rakutenBook.reviewAverage,
                  reviewCount: rakutenBook.reviewCount,
                  itemCaption: rakutenBook.itemCaption,
                  itemUrl: rakutenBook.itemUrl,
                  contents: rakutenBook.contents,
                  seriesName: rakutenBook.seriesName,
                  size: rakutenBook.size,
                  price: rakutenBook.price,
                  affiliateUrl: rakutenBook.affiliateUrl,
                  isbn10: rakutenBook.isbn10,
                  isbn13: rakutenBook.isbn13,
                  isFutureRelease: rakutenBook.isFutureRelease
                })
              };
            });
          }
        } catch (error) {
          errorLogger.log(error, { operation: 'searchBooksWithPaging', keyword, searchType, page });
          // 楽天APIエラーの場合、フォールバック検索を試行
        }
      }
      
      // 2. 楽天APIが利用できない場合や結果がない場合は、従来の検索方法を使用
      if (searchResults.length === 0) {
        const fallbackResults = await performFallbackSearch(keyword);
        searchResults = fallbackResults;
        
        // フォールバック検索の場合はページング情報をクリア
        setTotalCount(1);
        setPageInfo({
          page: 1,
          pageCount: 1,
          hits: 1,
          first: 1,
          last: 1
        });
      }
      
      return searchResults;
    } catch (error) {
      setError(error.userMessage || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * フォールバック検索（OpenBD APIを使用）
   * @param {string} keyword - 検索キーワード
   * @returns {Promise<Array>} 検索結果
   */
  const performFallbackSearch = async (keyword) => {
    const isbnCandidates = searchISBNsByTitle(keyword);
    
    if (isbnCandidates.length > 0) {
      try {
        const bookInfo = await getBookInfoFromISBN(isbnCandidates[0]);
        const bookTitle = bookInfo ? bookInfo.title : keyword;
        
        return [{
          isbn: isbnCandidates[0],
          title: bookTitle,
          systems: {},
          isLibraryDataLoaded: false,
          isLibraryDataLoading: false,
          ...(bookInfo && {
            author: bookInfo.author,
            publisher: bookInfo.publisher,
            publishDate: bookInfo.publishDate,
            imageUrl: bookInfo.imageUrl
          })
        }];
      } catch (error) {
        errorLogger.log(error, { operation: 'getBookInfoFromISBN', isbn: isbnCandidates[0] });
      }
    }
    
    // 検索結果がない場合のエラー
    const availableTitles = getAvailableTitles();
    throw new Error(
      `"${keyword}" の検索結果が見つかりませんでした。\n\n` +
      `【検索のコツ】\n` +
      `• 書籍のタイトルの一部を入力してください\n` +
      `• 著者名でも検索できます\n` +
      `• ひらがな・カタカナ・漢字を使い分けてみてください\n\n` +
      `【検索可能な書籍例】\n${availableTitles.slice(0, 8).join('、')} など`
    );
  };

  /**
   * 検索結果のクリア
   */
  const clearSearchResults = useCallback(() => {
    setTotalCount(0);
    setPageInfo(null);
    setError(null);
  }, []);

  /**
   * ページング情報の更新
   * @param {Object} newPageInfo - 新しいページング情報
   */
  const updatePageInfo = useCallback((newPageInfo) => {
    setPageInfo(newPageInfo);
  }, []);

  /**
   * 検索可能かどうかをチェック
   * @returns {boolean} 検索可能かどうか
   */
  const canSearch = useCallback(() => {
    return isRakutenAPIAvailable();
  }, []);

  return {
    loading,
    error,
    totalCount,
    pageInfo,
    searchByTitle,
    clearSearchResults,
    updatePageInfo,
    canSearch
  };
};