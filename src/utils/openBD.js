// OpenBD API 統合ユーティリティ
// 国立国会図書館の書誌データを活用した書籍情報取得

import { normalizeISBN } from './common';

/**
 * ISBNから書籍情報を取得
 * @param {string} isbn - ISBN（10桁または13桁）
 * @returns {Promise<Object|null>} 書籍情報またはnull
 */
export const getBookInfoFromISBN = async (isbn) => {
  try {
    const normalizedISBN = normalizeISBN(isbn);
    const apiUrl = `https://api.openbd.jp/v1/get?isbn=${normalizedISBN}`;
    
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data && data[0] && data[0].summary) {
      const bookInfo = data[0].summary;
      return {
        isbn: normalizedISBN,
        title: bookInfo.title,
        author: bookInfo.author,
        publisher: bookInfo.publisher,
        pubdate: bookInfo.pubdate,
        cover: bookInfo.cover,
        series: bookInfo.series
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ OpenBD API エラー:', error);
    return null;
  }
};

/**
 * 複数のISBNから書籍情報を一括取得
 * @param {string[]} isbns - ISBN配列
 * @returns {Promise<Object[]>} 書籍情報配列
 */
export const getBooksInfoFromISBNs = async (isbns) => {
  try {
    const normalizedISBNs = isbns.map(isbn => normalizeISBN(isbn));
    const apiUrl = `https://api.openbd.jp/v1/get?isbn=${normalizedISBNs.join(',')}`;
    
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    const books = [];
    data.forEach((item, index) => {
      if (item && item.summary) {
        const bookInfo = item.summary;
        books.push({
          isbn: normalizedISBNs[index],
          title: bookInfo.title,
          author: bookInfo.author,
          publisher: bookInfo.publisher,
          pubdate: bookInfo.pubdate,
          cover: bookInfo.cover,
          series: bookInfo.series
        });
      }
    });
    
    return books;
  } catch (error) {
    console.error('❌ OpenBD API 一括取得エラー:', error);
    return [];
  }
};

/**
 * 拡張書籍データベース - よく検索される書籍
 * 実際のプロダクションでは、データベースや外部ファイルから読み込み
 */
export const EXTENDED_BOOK_DATABASE = {
  // 日本文学
  '星の王子さま': ['9784102122044', '9784061470255'],
  '吾輩は猫である': ['9784003101018', '9784101001012'],
  'こころ': ['9784003101124', '9784101001029'],
  '人間失格': ['9784101006048', '9784061319882'],
  '坊っちゃん': ['9784003101131', '9784101001036'],
  '走れメロス': ['9784003104224', '9784061319875'],
  
  // 世界文学
  'ハリーポッター': ['9784915512377', '9784863890299'],
  'ハリー・ポッター': ['9784915512377', '9784863890299'],
  '不思議の国のアリス': ['9784003231012', '9784041003992'],
  'アリス': ['9784003231012', '9784041003992'],
  'シャーロック・ホームズ': ['9784003230121', '9784102100011'],
  'ホームズ': ['9784003230121', '9784102100011'],
  
  // 現代小説
  '君の名は': ['9784046013743', '9784041026229'],
  '君の名は。': ['9784046013743', '9784041026229'],
  '天気の子': ['9784046039378', '9784041088432'],
  'すずめの戸締り': ['9784046055842'],
  
  // ビジネス・自己啓発
  '7つの習慣': ['9784863940246', '9784906638017'],
  'セブンハビッツ': ['9784863940246', '9784906638017'],
  '嫌われる勇気': ['9784478025819', '9784478066119'],
  'アドラー心理学': ['9784478025819', '9784478066119'],
  
  // 技術書
  'リーダブルコード': ['9784873115658'],
  'クリーンコード': ['9784048676887'],
  'デザインパターン': ['9784797311129', '9784274050084'],
  '人月の神話': ['9784621066077']
};

/**
 * タイトルからISBN候補を検索
 * @param {string} title - 検索するタイトル
 * @returns {string[]} ISBN配列
 */
export const searchISBNsByTitle = (title) => {
  const results = [];
  const searchTerm = title.toLowerCase().trim();
  
  // 完全一致検索
  for (const [bookTitle, isbns] of Object.entries(EXTENDED_BOOK_DATABASE)) {
    if (bookTitle.toLowerCase() === searchTerm) {
      results.push(...isbns);
    }
  }
  
  // 部分一致検索（完全一致がない場合）
  if (results.length === 0) {
    for (const [bookTitle, isbns] of Object.entries(EXTENDED_BOOK_DATABASE)) {
      if (bookTitle.toLowerCase().includes(searchTerm) || searchTerm.includes(bookTitle.toLowerCase())) {
        results.push(...isbns);
      }
    }
  }
  
  return [...new Set(results)]; // 重複除去
};

/**
 * 検索可能な書籍タイトル一覧を取得
 * @returns {string[]} タイトル配列
 */
export const getAvailableTitles = () => {
  return Object.keys(EXTENDED_BOOK_DATABASE);
};