import React from 'react';
import './BookSearchResults.css';

const BookSearchResults = ({ results, loading, searchQuery, searchType }) => {
  if (loading) {
    return (
      <div className="search-results loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>📚 蔵書情報を検索中...</p>
          <p className="loading-detail">複数の図書館システムから情報を取得しています</p>
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    if (searchQuery) {
      return (
        <div className="search-results empty">
          <div className="empty-state">
            <p>📭 検索結果が見つかりませんでした</p>
            <p className="empty-detail">
              {searchType === 'isbn' ? 'ISBN' : 'タイトル'}: "{searchQuery}"
            </p>
            <div className="search-tips">
              <h4>🔍 検索のコツ</h4>
              <ul>
                <li>ISBNは正確な13桁または10桁の数字を入力してください</li>
                <li>タイトル検索では一部のキーワードでも検索できます</li>
                <li>全角・半角文字に注意してください</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="search-results">
      <div className="results-header">
        <h3>📚 蔵書検索結果</h3>
        <p className="results-info">
          "{searchQuery}" の検索結果: {results.length}冊
        </p>
      </div>

      <div className="results-list">
        {results.map((book, index) => (
          <BookResultItem key={`${book.isbn}-${index}`} book={book} />
        ))}
      </div>
    </div>
  );
};

const BookResultItem = ({ book }) => {
  const getAvailabilityStatus = (status) => {
    switch (status) {
      case '貸出可':
        return { icon: '✅', text: '貸出可', class: 'available' };
      case '貸出中':
        return { icon: '📖', text: '貸出中', class: 'unavailable' };
      case '館内のみ':
        return { icon: '🏢', text: '館内のみ', class: 'in-library' };
      case '予約可':
        return { icon: '📅', text: '予約可', class: 'reservable' };
      default:
        return { icon: '❓', text: status || '不明', class: 'unknown' };
    }
  };

  const getTotalLibrariesCount = (systems) => {
    return Object.values(systems).reduce((total, system) => {
      return total + (system.libkey ? Object.keys(system.libkey).length : 0);
    }, 0);
  };

  const getAvailableCount = (systems) => {
    return Object.values(systems).reduce((total, system) => {
      if (!system.libkey) return total;
      return total + Object.values(system.libkey).filter(status => status === '貸出可').length;
    }, 0);
  };

  return (
    <div className="book-result-item">
      <div className="book-header">
        {/* 書籍画像 */}
        {book.imageUrl && (
          <div className="book-image">
            <img 
              src={book.imageUrl} 
              alt={book.title}
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        )}
        
        <div className="book-info">
          <h4 className="book-title">{book.title || 'タイトル不明'}</h4>
          <p className="book-isbn">📖 ISBN: {book.isbn}</p>
          
          {/* 書籍の詳細情報 */}
          {book.author && <p className="book-author">👤 著者: {book.author}</p>}
          {book.publisher && <p className="book-publisher">🏢 出版社: {book.publisher}</p>}
          {(book.pubdate || book.publishDate) && (
            <p className="book-pubdate">📅 出版日: {book.pubdate || book.publishDate}</p>
          )}
          
          {/* 楽天Books情報 */}
          {book.reviewAverage && (
            <p className="book-review">⭐ 評価: {book.reviewAverage} ({book.reviewCount}件)</p>
          )}
          {book.price && (
            <p className="book-price">💰 価格: ¥{book.price.toLocaleString()}</p>
          )}
          <div className="availability-summary">
            <span className="total-libraries">
              🏢 {getTotalLibrariesCount(book.systems)}館中
            </span>
            <span className="available-libraries">
              ✅ {getAvailableCount(book.systems)}館で貸出可
            </span>
          </div>
          
          {/* 楽天Books購入リンク */}
          {book.itemUrl && (
            <div className="book-actions">
              <a 
                href={book.itemUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="rakuten-link"
              >
                🛒 楽天で購入
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="library-systems">
        {Object.entries(book.systems).map(([systemId, systemData]) => (
          <div key={systemId} className="library-system">
            <h5 className="system-name">{systemData.systemName || systemId}</h5>
            
            {systemData.reserveurl && (
              <a 
                href={systemData.reserveurl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="reserve-link"
              >
                🔗 予約・詳細を見る
              </a>
            )}

            {systemData.libkey && (
              <div className="library-branches">
                {Object.entries(systemData.libkey).map(([branchName, status]) => {
                  const statusInfo = getAvailabilityStatus(status);
                  return (
                    <div key={branchName} className={`branch-item ${statusInfo.class}`}>
                      <span className="branch-name">{branchName}</span>
                      <span className="branch-status">
                        {statusInfo.icon} {statusInfo.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {systemData.status === 'Running' && (
              <div className="system-loading">
                <div className="mini-spinner"></div>
                <span>データ取得中...</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookSearchResults;