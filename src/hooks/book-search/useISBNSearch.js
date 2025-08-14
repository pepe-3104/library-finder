/**
 * ISBN検索専用フック
 * 単一のISBNに対する書籍情報と蔵書検索を処理
 */

import { useState, useCallback } from 'react';
import { searchBookByISBN, isRakutenAPIAvailable } from '../../utils/rakutenBooks';
import { normalizeISBN, makeJsonpRequest } from '../../utils/common';
import { createError, errorLogger } from '../../utils/errors';
import { getApiKey } from '../../config/apiConfig';

export const useISBNSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * ISBNから楽天Books APIで書籍情報を取得
   * @param {string} isbn - 検索するISBN
   * @returns {Promise<Object|null>} 書籍情報
   */
  const searchBookInfo = useCallback(async (isbn) => {
    if (!isbn || !isbn.trim()) {
      throw createError.invalidISBN(isbn);
    }

    setLoading(true);
    setError(null);

    try {
      let rakutenBookInfo = null;
      if (isRakutenAPIAvailable()) {
        try {
          rakutenBookInfo = await searchBookByISBN(isbn);
        } catch (error) {
          errorLogger.log(error, { operation: 'searchBookByISBN', isbn });
          // 楽天APIのエラーは致命的ではないため、続行
        }
      }

      return rakutenBookInfo;
    } catch (error) {
      setError(error.message || 'ISBN検索中にエラーが発生しました');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * カーリルAPIで蔵書検索を実行
   * @param {string} isbn - 検索するISBN
   * @param {string[]} systemIds - 検索対象の図書館システムID
   * @param {string} [bookTitle] - 書籍タイトル
   * @param {Object} [rakutenBookInfo] - 楽天Books API情報
   * @returns {Promise<Object>} 蔵書検索結果
   */
  const searchLibraryByISBN = useCallback(async (isbn, systemIds, bookTitle = null, rakutenBookInfo = null) => {
    if (!systemIds || systemIds.length === 0) {
      throw new Error('図書館システムIDが指定されていません');
    }

    const normalizedISBN = normalizeISBN(isbn);
    const systemIdParam = systemIds.join(',');
    
    // カーリルAPI呼び出し
    const apiKeyResult = getApiKey.calil();
    if (!apiKeyResult.isAvailable) {
      throw apiKeyResult.error;
    }

    const apiUrl = `https://api.calil.jp/check?appkey=${apiKeyResult.key}&isbn=${normalizedISBN}&systemid=${systemIdParam}&format=json&callback=?`;

    try {
      const data = await makeJsonpRequest(apiUrl, {
        timeout: 30000,
        callbackPrefix: 'calil_callback'
      });

      // 初回応答の処理
      let results = processBookSearchResults(data, bookTitle, rakutenBookInfo, isbn);
      
      // continue=1の場合、ポーリングで継続検索
      if (data.continue === 1) {
        results = await pollForFinalResults(data.session, normalizedISBN, systemIdParam, results, bookTitle, rakutenBookInfo, isbn);
      }

      return results;
    } catch (error) {
      errorLogger.log(error, { operation: 'searchLibraryByISBN', isbn, systemIds });
      throw error;
    }
  }, []);

  /**
   * カーリルAPIポーリングで最終結果を取得
   */
  const pollForFinalResults = async (sessionId, isbn, systemIds, currentResults, bookTitle, rakutenBookInfo, searchedISBN) => {
    const apiKeyResult = getApiKey.calil();
    const pollUrl = `https://api.calil.jp/check?appkey=${apiKeyResult.key}&session=${sessionId}&format=json&callback=?`;
    
    const MAX_POLLS = 10;
    const POLL_INTERVAL = 2000;
    
    for (let pollCount = 0; pollCount < MAX_POLLS; pollCount++) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      
      try {
        const data = await makeJsonpRequest(pollUrl, {
          timeout: 15000,
          callbackPrefix: 'calil_poll'
        });

        const updatedResults = processBookSearchResults(data, bookTitle, rakutenBookInfo, searchedISBN);
        
        if (data.continue !== 1) {
          return updatedResults;
        }
      } catch (error) {
        errorLogger.log(error, { operation: 'pollForFinalResults', pollCount, sessionId });
        // ポーリングエラーの場合、現在の結果を返す
        break;
      }
    }
    
    return currentResults;
  };

  /**
   * カーリルAPI応答を処理して結果配列に変換
   */
  const processBookSearchResults = (apiData, bookTitle, rakutenBookInfo = null, searchedISBN = null) => {
    const results = [];
    
    if (!apiData.books) {
      return results;
    }
    
    Object.entries(apiData.books).forEach(([isbn, systemsData]) => {
      // ISBN検索の場合は完全一致のみを処理
      if (searchedISBN) {
        const normalizedSearchedISBN = normalizeISBN(searchedISBN);
        const normalizedResultISBN = normalizeISBN(isbn);
        
        if (normalizedResultISBN !== normalizedSearchedISBN) {
          return;
        }
      }

      const bookResult = {
        isbn,
        title: bookTitle || `書籍 (ISBN: ${isbn})`,
        systems: {},
        isLibraryDataLoaded: true, // ISBN検索では蔵書情報が既に読み込まれている
        // 楽天Books APIから取得した追加情報
        ...(rakutenBookInfo && {
          author: rakutenBookInfo.author,
          publisher: rakutenBookInfo.publisher,
          publishDate: rakutenBookInfo.publishDate,
          imageUrl: rakutenBookInfo.largeImageUrl || rakutenBookInfo.mediumImageUrl,
          reviewAverage: rakutenBookInfo.reviewAverage,
          reviewCount: rakutenBookInfo.reviewCount,
          itemCaption: rakutenBookInfo.itemCaption,
          itemUrl: rakutenBookInfo.itemUrl
        })
      };
      
      // 図書館システム情報の変換
      Object.entries(systemsData).forEach(([systemId, systemInfo]) => {
        bookResult.systems[systemId] = {
          systemName: getSystemName(systemId),
          status: systemInfo.status,
          reserveurl: systemInfo.reserveurl,
          libkey: systemInfo.libkey || {}
        };
      });
      
      results.push(bookResult);
    });
    
    return results;
  };

  /**
   * 図書館システムIDからシステム名を取得
   */
  const getSystemName = (systemId) => {
    const systemNames = {
      'Tokyo_Chiyoda': '千代田区立図書館',
      'Tokyo_Chuo': '中央区立図書館', 
      'Tokyo_Minato': '港区立図書館',
      'Tokyo_Setagaya': '世田谷区立図書館',
      'Tokyo_Metro': '東京都立図書館',
      'National_Diet': '国立国会図書館'
    };
    return systemNames[systemId] || systemId;
  };

  /**
   * 統合ISBN検索（書籍情報取得 + 蔵書検索）
   * @param {string} isbn - 検索するISBN
   * @param {string[]} systemIds - 検索対象の図書館システムID
   * @returns {Promise<Array>} 検索結果
   */
  const searchByISBN = useCallback(async (isbn, systemIds) => {
    setLoading(true);
    setError(null);

    try {
      // 1. 楽天Books APIで書籍情報を取得
      const rakutenBookInfo = await searchBookInfo(isbn);
      
      // 2. カーリルAPIで蔵書情報を取得
      const bookTitle = rakutenBookInfo?.title || `書籍 (ISBN: ${isbn})`;
      const libraryResults = await searchLibraryByISBN(isbn, systemIds, bookTitle, rakutenBookInfo);
      
      if (!libraryResults || libraryResults.length === 0) {
        throw createError.noResults(isbn, 'ISBN');
      }

      return libraryResults;
    } catch (error) {
      setError(error.userMessage || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [searchBookInfo, searchLibraryByISBN]);

  return {
    loading,
    error,
    searchByISBN,
    searchBookInfo,
    searchLibraryByISBN
  };
};