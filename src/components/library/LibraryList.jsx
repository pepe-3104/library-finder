import React from 'react';
import './LibraryList.css';

const LibraryList = ({ libraries, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="library-list-container">
        <div className="library-loading">
          <div className="loading-spinner"></div>
          <p>図書館を検索中...</p>
          <div className="loading-note">周辺の図書館データを取得しています</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="library-list-container">
        <div className="library-error">
          <div className="error-icon">⚠️</div>
          <h4>図書館検索エラー</h4>
          <p>{error}</p>
          {onRetry && (
            <button onClick={onRetry} className="retry-button">
              🔄 再試行
            </button>
          )}
        </div>
      </div>
    );
  }

  if (libraries.length === 0) {
    return (
      <div className="library-list-container">
        <div className="library-empty">
          <div className="empty-icon">📚</div>
          <h4>図書館が見つかりませんでした</h4>
          <p>この地域には登録されている図書館がありません。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="library-list-container">
      <div className="library-list-header">
        <h4>📍 近隣の図書館 ({libraries.length}件)</h4>
        <p>距離の近い順に表示しています</p>
      </div>
      
      <div className="library-list">
        {libraries.map((library) => (
          <div key={library.id} className="library-item">
            <div className="library-header">
              <h5 className="library-name">{library.name}</h5>
              {library.distance && (
                <span className="library-distance">
                  📏 約 {library.distance}km
                </span>
              )}
            </div>
            
            <div className="library-details">
              {library.address && (
                <div className="library-address">
                  <span className="detail-icon">🏢</span>
                  <span>{library.address}</span>
                </div>
              )}
              
              {library.tel && (
                <div className="library-tel">
                  <span className="detail-icon">📞</span>
                  <a href={`tel:${library.tel}`}>{library.tel}</a>
                </div>
              )}
              
              {library.category && (
                <div className="library-category">
                  <span className="detail-icon">📋</span>
                  <span className="category-tag">{library.category}</span>
                </div>
              )}
            </div>
            
            <div className="library-actions">
              {library.url && (
                <a 
                  href={library.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="library-link"
                >
                  🌐 公式サイト
                </a>
              )}
              <button 
                className="map-button"
                onClick={() => showOnMap(library)}
                title="地図で表示"
              >
                🗺️ 地図
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 地図表示機能（今後実装予定）
const showOnMap = (library) => {
  if (library.geocode) {
    console.log('🗺️ 地図表示予定:', library);
    // TODO: React Leaflet マップとの連携
    alert(`地図機能は次のステップで実装予定です。\n\n図書館: ${library.name}\n住所: ${library.address || '住所情報なし'}`);
  }
};

export default LibraryList;