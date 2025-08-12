import React, { useState } from 'react';
import { useBookSearch } from '../../hooks/useBookSearch';
import BookSearchResults from './BookSearchResults';
import { Search, MenuBook, Business, Error, Close } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import './BookSearch.css';

const BookSearch = ({ libraries = [], userLocation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('title'); // 'title' or 'isbn'
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { results, loading, error, searchBooks, loadLibraryDataForBook, clearResults } = useBookSearch();
  
  const suggestions = [];



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
    
    // フォーカスが外れた時点で自動検索
    if (searchQuery.trim() && libraries.length > 0) {
      console.log('🔍 フォーカスアウト時の自動検索開始:', { searchQuery, searchType });
      
      // 図書館システムIDを抽出
      let systemIds = libraries.map(lib => lib.systemid).filter(Boolean);
      
      // systemidがない場合はidをフォールバックとして使用
      if (systemIds.length === 0) {
        systemIds = libraries.map(lib => lib.id).filter(Boolean);
      }
      
      if (systemIds.length > 0) {
        searchBooks(searchQuery, searchType, systemIds);
      }
    }
  };

  return (
    <div className="book-search-container">
      <div className="search-form-container">
        <div className="book-search-form">
          <div className="search-input-group">
            <div className="input-container">
              <input
                type="text"
                value={searchQuery}
                onChange={handleQueryChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder={
                  searchType === 'isbn' 
                    ? 'ISBN (例: 9784334926946)' 
                    : searchType === 'author'
                    ? '著者名検索 (例: 村上春樹、夏目漱石)'
                    : 'タイトル検索 (例: 星の王子さま、吾輩は猫である)'
                }
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
                      <MenuBook fontSize="small" style={{ marginRight: '6px' }} />
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="search-type-toggles">
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
              <label className="search-type-option">
                <input
                  type="radio"
                  value="author"
                  checked={searchType === 'author'}
                  onChange={(e) => setSearchType(e.target.value)}
                  disabled={loading}
                />
                著者検索
              </label>
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
            </div>
          </div>
          
        </div>



        {/* 検索対象の図書館情報 */}
        {libraries.length > 0 && (
          <div className="target-libraries-info">
            <p className="info-text">
              <Business fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
              検索対象: {libraries.length}件の図書館システム
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
            <h4>
              <Error fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
              検索エラー
            </h4>
            <p>{error}</p>
            <button onClick={() => clearResults()} className="error-dismiss">
              <Close fontSize="small" style={{ marginRight: '4px' }} />
              閉じる
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
        onLoadLibraryData={loadLibraryDataForBook}
        userLocation={userLocation}
        libraries={libraries}
      />
    </div>
  );
};

export default BookSearch;