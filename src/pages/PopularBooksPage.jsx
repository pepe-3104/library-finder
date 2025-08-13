import React, { useState, useEffect } from 'react';
import { Whatshot, AutoStories, Category, ExpandMore, ExpandLess } from '@mui/icons-material';
import { getPopularBooksByGenre, getBookGenres, getSubGenres, getGenreHierarchy, POPULAR_GENRES, isRakutenGenreAPIAvailable } from '../utils/rakutenGenres';
import { searchLibraryBooks } from '../utils/calilApi';

// カーリルAPIキー（環境変数から取得）
const CALIL_API_KEY = import.meta.env.VITE_CALIL_API_KEY;
import BookSearchResults from '../components/book/BookSearchResults';
import './PopularBooksPage.css';

const PopularBooksPage = ({ libraries = [], userLocation }) => {
  const [availableGenres, setAvailableGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [subGenres, setSubGenres] = useState([]);
  const [selectedSubGenre, setSelectedSubGenre] = useState(null);
  const [showSubGenres, setShowSubGenres] = useState(false);
  const [isSubGenresExpanded, setIsSubGenresExpanded] = useState(false);
  const [isGenreSelectorExpanded, setIsGenreSelectorExpanded] = useState(true);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genresLoading, setGenresLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pageInfo, setPageInfo] = useState(null);
  const [_currentPage, setCurrentPage] = useState(1);

  // ページング設定
  const ITEMS_PER_PAGE = 20;
  const MAX_TOTAL_ITEMS = 100;


  // 蔵書情報読み込み機能を実装
  const loadLibraryDataForBook = async (isbn) => {
    if (!libraries.length) {
      console.warn('図書館情報がありません');
      return;
    }

    if (!CALIL_API_KEY) {
      console.warn('カーリルAPIキーが設定されていません');
      return;
    }

    console.log(`📚 人気の本 ISBN ${isbn} の蔵書情報読み込み開始`);
    
    // 該当する書籍を取得
    const bookIndex = books.findIndex(book => book.isbn === isbn);
    if (bookIndex === -1) {
      console.error('書籍が見つかりません');
      return;
    }

    const book = books[bookIndex];
    
    // 書籍の読み込み状態を更新
    setBooks(prevBooks => {
      const newBooks = [...prevBooks];
      newBooks[bookIndex] = { ...book, isLibraryDataLoading: true };
      return newBooks;
    });

    try {
      // 図書館システムIDを取得
      const systemIds = [...new Set(libraries.map(lib => lib.systemid))];
      console.log(`🏛️ 検索対象図書館システム: ${systemIds.length}件`);

      // カーリルAPIで一括蔵書検索
      const libraryData = await searchLibraryBooks(isbn, systemIds);
      
      // 書籍情報を更新（既存の情報を保持）
      setBooks(prevBooks => {
        const newBooks = [...prevBooks];
        newBooks[bookIndex] = { 
          ...book, // 既存の書籍情報（画像、著者、出版社等）を保持
          systems: libraryData.systems || {}, // 蔵書情報のみ更新
          isLibraryDataLoaded: true, 
          isLibraryDataLoading: false 
        };
        return newBooks;
      });

      console.log(`✅ ISBN ${isbn} の蔵書情報読み込み完了`);
    } catch (err) {
      console.error('❌ 蔵書情報読み込みエラー:', err);
      
      // エラー時は読み込み状態をリセット
      setBooks(prevBooks => {
        const newBooks = [...prevBooks];
        newBooks[bookIndex] = { ...book, isLibraryDataLoading: false };
        return newBooks;
      });
    }
  };

  // 子ジャンルを取得する関数
  const loadSubGenres = async (parentGenreId) => {
    if (!isRakutenGenreAPIAvailable()) {
      console.warn('楽天Books APIが利用できません');
      return;
    }

    try {
      console.log(`🔍 子ジャンル取得中: 親ジャンル=${parentGenreId}`);
      const subGenresData = await getSubGenres(parentGenreId);
      
      setSubGenres(subGenresData);
      setShowSubGenres(subGenresData.length > 0);
      setIsSubGenresExpanded(false); // 新しいジャンル選択時は子ジャンルを折りたたむ
      
      if (subGenresData.length > 0) {
        console.log(`✅ ${subGenresData.length}件の子ジャンルを取得`);
      } else {
        console.log('📭 子ジャンルが見つかりませんでした');
      }
      
    } catch (error) {
      console.error('❌ 子ジャンル取得エラー:', error);
      setSubGenres([]);
      setShowSubGenres(false);
    }
  };

  // 選択されたジャンルの人気本を取得
  const loadPopularBooks = async (genreId, page = 1) => {
    if (!isRakutenGenreAPIAvailable()) {
      setError('楽天Books APIが利用できません。環境設定を確認してください。');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔥 ジャンル「${selectedGenre?.name || genreId}」の人気本を取得中... (ページ${page})`);
      const result = await getPopularBooksByGenre(genreId, ITEMS_PER_PAGE, page);
      
      // 最大100件制限を適用
      const limitedTotalCount = Math.min(result.totalCount, MAX_TOTAL_ITEMS);
      
      setBooks(result.books);
      setTotalCount(limitedTotalCount);
      setPageInfo({
        ...result.pageInfo,
        // ページ情報も100件制限に合わせて調整
        last: Math.ceil(limitedTotalCount / ITEMS_PER_PAGE)
      });
      setCurrentPage(page);
      
      console.log(`✅ ${result.books.length}件の人気本を取得しました (総数: ${limitedTotalCount}件, ページ${page})`);
    } catch (err) {
      console.error('❌ 人気本取得エラー:', err);
      setError('人気本の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ジャンル情報を動的取得
  const loadGenres = async () => {
    if (!isRakutenGenreAPIAvailable()) {
      setError('楽天Books APIが利用できません。環境設定を確認してください。');
      setGenresLoading(false);
      return;
    }

    try {
      console.log('📂 楽天Books APIからジャンル情報を取得中...');
      const genres = await getBookGenres('001');
      
      if (genres.length > 0) {
        // 人気ジャンルのみフィルタリング（オプション）
        const popularGenres = genres.filter(genre => 
          ['001001', '001002', '001003', '001004', '001005', '001006', 
           '001007', '001008', '001009', '001010', '001012', '001016'].includes(genre.id)
        );
        
        setAvailableGenres(popularGenres.length > 0 ? popularGenres : genres.slice(0, 12));
        setSelectedGenre(popularGenres[0] || genres[0]);
        console.log('✅ ジャンル情報取得完了:', popularGenres.length || genres.length, '件');
      } else {
        setError('ジャンル情報の取得に失敗しました');
      }
    } catch (err) {
      console.error('❌ ジャンル取得エラー:', err);
      setError('ジャンル情報の取得に失敗しました');
    } finally {
      setGenresLoading(false);
    }
  };

  // 初回ロード: ジャンル情報取得
  useEffect(() => {
    loadGenres();
  }, []);

  // 画面サイズに応じてアコーディオン初期状態を制御
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setIsGenreSelectorExpanded(!isMobile);
    };

    // 初回実行
    handleResize();
    
    // リサイズイベントリスナー追加
    window.addEventListener('resize', handleResize);
    
    // クリーンアップ
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 選択ジャンル変更時: サブジャンル取得と書籍取得
  useEffect(() => {
    if (selectedGenre) {
      // 初回ジャンル設定時もサブジャンルを読み込む
      loadSubGenres(selectedGenre.id);
      
      // 子ジャンルが選択されている場合は子ジャンルで検索、そうでなければメインジャンルで検索
      const targetGenreId = selectedSubGenre ? selectedSubGenre.id : selectedGenre.id;
      loadPopularBooks(targetGenreId);
    }
  }, [selectedGenre, selectedSubGenre]);

  // メインジャンル変更
  const handleGenreChange = async (genre) => {
    setSelectedGenre(genre);
    setSelectedSubGenre(null); // 子ジャンル選択をリセット
    setCurrentPage(1); // ジャンル変更時はページを1にリセット
    
    // モバイルサイズの場合のみアコーディオンを閉じる
    if (window.innerWidth <= 768) {
      setIsGenreSelectorExpanded(false);
    }
    
    // ジャンル変更時にページトップにスクロール
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // 子ジャンルの取得を開始
    await loadSubGenres(genre.id);
  };

  // 子ジャンル変更
  const handleSubGenreChange = (subGenre) => {
    setSelectedSubGenre(subGenre);
    setCurrentPage(1); // 子ジャンル変更時もページを1にリセット
    setIsSubGenresExpanded(false); // サブジャンル選択時にアコーディオンを折りたたむ
    
    // 子ジャンル変更時にページトップにスクロール
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 子ジャンル展開/折りたたみ切り替え
  const toggleSubGenres = () => {
    setIsSubGenresExpanded(!isSubGenresExpanded);
  };

  // ジャンル選択展開/折りたたみ切り替え
  const toggleGenreSelector = () => {
    setIsGenreSelectorExpanded(!isGenreSelectorExpanded);
  };

  // ページ変更
  const handlePageChange = (page) => {
    if (selectedGenre) {
      const targetGenreId = selectedSubGenre ? selectedSubGenre.id : selectedGenre.id;
      
      // ページ切り替え時にページトップにスクロール
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      loadPopularBooks(targetGenreId, page);
    }
  };

  // 蔵書情報読み込み（BookSearchResultsとの互換性のため）
  const handleLoadLibraryData = (isbn) => {
    loadLibraryDataForBook(isbn);
  };

  return (
    <div className="page-container">
      <div className="popular-books-page-content">
        <h2 className="section-title">
          <Whatshot style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
          人気の本
        </h2>
        <div className="page-description">
          <p>今話題の人気本をジャンル別にご紹介します。</p>
          {totalCount > 0 && selectedGenre && (
            <p>
              <AutoStories fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
              「{selectedSubGenre ? selectedSubGenre.name : selectedGenre.name}」ジャンルの人気本: <strong>{totalCount.toLocaleString()}</strong> 冊
              {selectedSubGenre && (
                <span style={{ fontSize: '0.9em', color: '#666', marginLeft: '8px' }}>
                  ({selectedGenre.name} &gt; {selectedSubGenre.name})
                </span>
              )}
            </p>
          )}
        </div>

        {/* ジャンル選択 */}
        <div className="genre-selector">
          <div className="genre-selector-header" onClick={toggleGenreSelector}>
            <h3>
              <Category fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
              ジャンルを選択
              {selectedGenre && (
                <span className="selected-genre">
                  （現在選択: {selectedGenre.name}）
                </span>
              )}
            </h3>
            <div className="expand-icon">
              {isGenreSelectorExpanded ? (
                <ExpandLess fontSize="small" />
              ) : (
                <ExpandMore fontSize="small" />
              )}
            </div>
          </div>
          
          {isGenreSelectorExpanded && (
            <>
              {genresLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>ジャンル情報を読み込み中...</p>
                </div>
              ) : (
                <div className="genre-buttons">
                  {availableGenres.map((genre) => (
                    <button
                      key={genre.id}
                      className={`genre-button ${selectedGenre && selectedGenre.id === genre.id ? 'active' : ''}`}
                      onClick={() => handleGenreChange(genre)}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* 子ジャンル選択（アコーディオン式） */}
        {showSubGenres && subGenres.length > 0 && (
          <div className="sub-genre-selector">
            <div className="sub-genre-header" onClick={toggleSubGenres}>
              <h4>
                <Category fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                {selectedGenre.name}の詳細カテゴリ
                {selectedSubGenre && (
                  <span className="selected-sub-genre">
                    （現在選択: {selectedSubGenre.name}）
                  </span>
                )}
              </h4>
              <div className="expand-icon">
                {isSubGenresExpanded ? (
                  <ExpandLess fontSize="small" />
                ) : (
                  <ExpandMore fontSize="small" />
                )}
              </div>
            </div>
            
            {isSubGenresExpanded && (
              <div className="sub-genre-buttons">
                <button
                  className={`sub-genre-button ${!selectedSubGenre ? 'active' : ''}`}
                  onClick={() => handleSubGenreChange(null)}
                >
                  すべて
                </button>
                {subGenres.map((subGenre) => (
                  <button
                    key={subGenre.id}
                    className={`sub-genre-button ${selectedSubGenre && selectedSubGenre.id === subGenre.id ? 'active' : ''}`}
                    onClick={() => handleSubGenreChange(subGenre)}
                  >
                    {subGenre.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* 人気本リスト - BookSearchResultsコンポーネントを使用 */}
        {selectedGenre && (
          <BookSearchResults
            results={books}
            loading={loading}
            searchQuery={`「${selectedGenre.name}」の人気本`}
            searchType="popular"
            onLoadLibraryData={handleLoadLibraryData}
            userLocation={userLocation}
            libraries={libraries}
            totalCount={totalCount}
            pageInfo={pageInfo}
            onPageChange={handlePageChange} // ページング機能を有効化
          />
        )}
      </div>
    </div>
  );
};

export default PopularBooksPage;