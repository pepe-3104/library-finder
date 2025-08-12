import React, { useState } from 'react';
import { useBookSearch } from '../../hooks/useBookSearch';
import BookSearchResults from './BookSearchResults';
import { getAvailableTitles } from '../../utils/openBD';
import { isRakutenAPIAvailable } from '../../utils/rakutenBooks';
import './BookSearch.css';

const BookSearch = ({ libraries = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('isbn'); // 'isbn' or 'title'
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { results, loading, error, searchBooks, clearResults } = useBookSearch();
  
  // タイトル候補を取得
  const availableTitles = getAvailableTitles();
  const suggestions = searchType === 'title' && searchQuery.length >= 2 
    ? availableTitles.filter(title => 
        title.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8) // 最大8件表示
    : [];

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
    setShowSuggestions(true);
    
    // ISBNの可能性がある場合は自動でISBN検索モードに切り替え
    if (isISBN(query)) {
      setSearchType('isbn');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    if (searchType === 'title' && searchQuery.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // 少し遅延させて候補クリックを可能にする
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="book-search-container">
      <div className="search-form-container">
        <form onSubmit={handleSearch} className="book-search-form">
          <div className="search-input-group">
            <div className="input-container">
              <input
                type="text"
                value={searchQuery}
                onChange={handleQueryChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder={searchType === 'isbn' ? 'ISBN (例: 9784334926946)' : isRakutenAPIAvailable() ? 'キーワード検索 (例: 星の王子さま、村上春樹)' : '書籍タイトル (例: 星の王子さま)'}
                className="search-input"
                disabled={loading}
              />
              
              {/* タイトル候補表示 */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      📚 {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                {isRakutenAPIAvailable() ? 'キーワード検索' : 'タイトル検索'}
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


        {/* API状況とヘルプ情報 */}
        <div className="api-status-info">
          {isRakutenAPIAvailable() ? (
            <div className="api-status enabled">
              <p>🚀 <strong>楽天Books API</strong> 有効 - 豊富な書籍データベースから検索可能</p>
              <p className="api-detail">タイトル、著者名、キーワードで幅広い検索ができます</p>
            </div>
          ) : (
            <div className="api-status limited">
              <p>📚 <strong>限定検索モード</strong> - 楽天APIキー未設定</p>
              <p className="api-detail">現在{getAvailableTitles().length}冊の書籍に対応しています</p>
            </div>
          )}
        </div>

        {/* 検索対象の図書館情報 */}
        {libraries.length > 0 && (
          <div className="target-libraries-info">
            <p className="info-text">
              🏢 検索対象: {libraries.length}件の図書館システム
            </p>
            <div className="library-chips">
              {libraries.slice(0, 5).map((lib, index) => (
                <span key={`${lib.id}-${lib.name}-${index}`} className="library-chip">
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