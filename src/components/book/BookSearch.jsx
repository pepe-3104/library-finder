import React, { useState } from 'react';
import { useBookSearch } from '../../hooks/useBookSearch';
import BookSearchResults from './BookSearchResults';
import './BookSearch.css';

const BookSearch = ({ libraries = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('isbn'); // 'isbn' or 'title'
  const { results, loading, error, searchBooks, clearResults } = useBookSearch();

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      alert('検索キーワードを入力してください');
      return;
    }

    if (libraries.length === 0) {
      alert('先に図書館を検索してください');
      return;
    }

    // 図書館システムIDを抽出
    let systemIds = libraries.map(lib => lib.systemid).filter(Boolean);
    
    console.log('🔍 図書館データ詳細:', libraries);
    console.log('📋 システムID抽出結果:', systemIds);
    
    // systemidがない場合はidをフォールバックとして使用
    if (systemIds.length === 0) {
      systemIds = libraries.map(lib => lib.id).filter(Boolean);
      console.log('🔄 IDをsystemidとしてフォールバック:', systemIds);
    }
    
    if (systemIds.length === 0) {
      console.error('❌ SystemID抽出失敗。図書館データ:', libraries);
      alert('利用可能な図書館システムが見つかりません。図書館を再検索してください。');
      return;
    }

    console.log('📚 書籍検索開始:', { searchQuery, searchType, systemIds });
    searchBooks(searchQuery, searchType, systemIds);
  };

  const handleClear = () => {
    setSearchQuery('');
    clearResults();
  };

  const isISBN = (query) => {
    // ISBN-10: 10桁の数字またはハイフン付き
    // ISBN-13: 13桁の数字またはハイフン付き
    const cleanQuery = query.replace(/[-\s]/g, '');
    return /^\d{10}$/.test(cleanQuery) || /^\d{13}$/.test(cleanQuery);
  };

  const handleQueryChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // ISBNの可能性がある場合は自動でISBN検索モードに切り替え
    if (isISBN(query)) {
      setSearchType('isbn');
    }
  };

  return (
    <div className="book-search-container">
      <div className="search-form-container">
        <form onSubmit={handleSearch} className="book-search-form">
          <div className="search-input-group">
            <input
              type="text"
              value={searchQuery}
              onChange={handleQueryChange}
              placeholder={searchType === 'isbn' ? 'ISBN (例: 9784334926946)' : '書籍タイトル (例: 星の王子さま)'}
              className="search-input"
              disabled={loading}
            />
            <div className="search-type-toggles">
              <label className="search-type-option">
                <input
                  type="radio"
                  value="isbn"
                  checked={searchType === 'isbn'}
                  onChange={(e) => setSearchType(e.target.value)}
                  disabled={loading}
                />
                ISBN検索
              </label>
              <label className="search-type-option">
                <input
                  type="radio"
                  value="title"
                  checked={searchType === 'title'}
                  onChange={(e) => setSearchType(e.target.value)}
                  disabled={loading}
                />
                タイトル検索
              </label>
            </div>
          </div>
          
          <div className="search-buttons">
            <button
              type="submit"
              className="search-button"
              disabled={loading || !searchQuery.trim()}
            >
              {loading ? '🔍 検索中...' : '📚 蔵書検索'}
            </button>
            {(searchQuery || results.length > 0) && (
              <button
                type="button"
                onClick={handleClear}
                className="clear-button"
                disabled={loading}
              >
                🗑️ クリア
              </button>
            )}
          </div>
        </form>

        {/* 検索対象の図書館情報 */}
        {libraries.length > 0 && (
          <div className="target-libraries-info">
            <p className="info-text">
              🏢 検索対象: {libraries.length}件の図書館システム
            </p>
            <div className="library-chips">
              {libraries.slice(0, 5).map(lib => (
                <span key={lib.id} className="library-chip">
                  {lib.shortName || lib.name}
                </span>
              ))}
              {libraries.length > 5 && (
                <span className="library-chip more">
                  +{libraries.length - 5}件
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="search-error">
          <div className="error-content">
            <h4>❌ 検索エラー</h4>
            <p>{error}</p>
            <button onClick={() => clearResults()} className="error-dismiss">
              ✕ 閉じる
            </button>
          </div>
        </div>
      )}

      {/* 検索結果 */}
      <BookSearchResults 
        results={results} 
        loading={loading}
        searchQuery={searchQuery}
        searchType={searchType}
      />
    </div>
  );
};

export default BookSearch;