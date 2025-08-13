/**
 * 図書館カテゴリフィルタリング用ユーティリティ
 * カーリルAPIのcategoryフィールドベース
 */

// 図書館カテゴリの定義（カーリルAPIの実際の値）
export const LIBRARY_CATEGORIES = {
  LARGE: 'LARGE',     // 大規模図書館
  MEDIUM: 'MEDIUM',   // 中規模図書館 
  SMALL: 'SMALL',     // 小規模図書館
  UNIV: 'UNIV',       // 大学図書館
  SPECIAL: 'SPECIAL', // 専門図書館
};

// カテゴリ表示名
export const getCategoryDisplayName = (category) => {
  switch (category) {
    case 'LARGE': return '大規模図書館';
    case 'MEDIUM': return '中規模図書館';
    case 'SMALL': return '小規模図書館';
    case 'UNIV': return '大学図書館';
    case 'SPECIAL': return '専門図書館';
    default: return 'その他';
  }
};

// フィルタオプション設定
export const CATEGORY_FILTER_OPTIONS = [
  {
    category: LIBRARY_CATEGORIES.LARGE,
    label: '大規模図書館',
    description: '蔵書数の多い大きな図書館',
    defaultEnabled: true,
    icon: '🏛️',
    color: '#007bff'
  },
  {
    category: LIBRARY_CATEGORIES.MEDIUM,
    label: '中規模図書館', 
    description: '地域の中心的な図書館',
    defaultEnabled: true,
    icon: '📚',
    color: '#28a745'
  },
  {
    category: LIBRARY_CATEGORIES.SMALL,
    label: '小規模図書館',
    description: '地域密着型の図書館',
    defaultEnabled: true,
    icon: '📖',
    color: '#ffc107'
  },
  {
    category: LIBRARY_CATEGORIES.UNIV,
    label: '大学図書館',
    description: '利用に制限がある場合があります',
    defaultEnabled: false, // デフォルトで除外
    icon: '🎓',
    color: '#6f42c1'
  },
  {
    category: LIBRARY_CATEGORIES.SPECIAL,
    label: '専門図書館',
    description: '特定分野に特化した図書館',
    defaultEnabled: true,
    icon: '🔬',
    color: '#fd7e14'
  }
];

/**
 * デフォルトのカテゴリフィルタ設定を取得
 * @returns {Object} デフォルトフィルタ設定 {LARGE: true, MEDIUM: true, ...}
 */
export const getDefaultCategoryFilter = () => {
  const filter = {};
  CATEGORY_FILTER_OPTIONS.forEach(option => {
    filter[option.category] = option.defaultEnabled;
  });
  return filter;
};

/**
 * 図書館リストをカテゴリでフィルタリング
 * @param {Array} libraries - 図書館データ配列
 * @param {Object} categoryFilter - 有効なカテゴリ {LARGE: boolean, MEDIUM: boolean, ...}
 * @returns {Array} フィルタリング後の図書館配列
 */
export const filterLibrariesByCategory = (libraries, categoryFilter) => {
  if (!Array.isArray(libraries)) {
    return [];
  }

  return libraries.filter(library => {
    const category = library.category;
    
    // categoryが未定義の場合は「その他」として扱い、デフォルトで表示
    if (!category) {
      return true;
    }
    
    // フィルタ設定に基づいて判定
    return categoryFilter[category] !== false;
  });
};

/**
 * カテゴリ別の図書館件数をカウント
 * @param {Array} libraries - 図書館データ配列
 * @returns {Object} カテゴリ別件数 {LARGE: number, MEDIUM: number, ...}
 */
export const countLibrariesByCategory = (libraries) => {
  if (!Array.isArray(libraries)) {
    return {};
  }

  const counts = {
    total: libraries.length,
    uncategorized: 0
  };

  // 各カテゴリの初期化
  CATEGORY_FILTER_OPTIONS.forEach(option => {
    counts[option.category] = 0;
  });

  // カウント実行
  libraries.forEach(library => {
    const category = library.category;
    if (category && counts[category] !== undefined) {
      counts[category]++;
    } else {
      counts.uncategorized++;
    }
  });

  return counts;
};