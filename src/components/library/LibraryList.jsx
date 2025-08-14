import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Warning,
  Refresh,
  LibraryBooks,
  LocationOn,
  Straighten,
  Business,
  Phone,
  Category,
  Language,
  Map
} from '@mui/icons-material';
import './LibraryList.css';

const LibraryList = ({ libraries, loading, error, onRetry, onLibrarySelect }) => {
  const navigate = useNavigate();
  
  // 一意なキーを生成する関数
  const generateUniqueKey = (library, index) => {
    const parts = [
      library.id || 'unknown',
      library.name || 'unnamed', 
      library.address || 'no-address',
      library.distance || 'no-distance',
      index
    ];
    return parts.join('-').replace(/\s+/g, '-');
  };

  // カテゴリを日本語表記に変換する関数（マップ凡例と統一）
  const getCategoryDisplayName = (category) => {
    switch (category) {
      case 'LARGE': return '大規模図書館';
      case 'MEDIUM': return '中規模図書館';
      case 'SMALL': return '小規模図書館';
      case 'UNIV': return '大学図書館';
      case 'SPECIAL': return '専門図書館';
      default: return 'その他';
    }
  };

  // 地図表示機能
  const handleShowOnMap = (library) => {
    // 図書館を選択状態にする
    if (onLibrarySelect) {
      onLibrarySelect(library);
    }
    // mapページにナビゲート
    navigate('/map');
  };
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
          <div className="error-icon">
            <Warning fontSize="large" style={{ color: '#dc3545' }} />
          </div>
          <h4>図書館検索エラー</h4>
          <p>{error}</p>
          {onRetry && (
            <button onClick={onRetry} className="retry-button">
              <Refresh fontSize="small" style={{ marginRight: '6px' }} />
              再試行
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
          <div className="empty-icon">
            <LibraryBooks fontSize="large" style={{ color: '#6c757d' }} />
          </div>
          <h4>図書館が見つかりませんでした</h4>
          <p>この地域には登録されている図書館がありません。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="library-list-container">
      <div className="library-list-header">
        <h4>
          <LocationOn fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
          近隣の図書館 ({libraries.length}件表示中)
        </h4>
        <p>距離の近い順に表示しています</p>
      </div>
      
      <div className="library-list">
        {libraries.map((library, index) => (
          <div key={generateUniqueKey(library, index)} className="library-item">
            <div className="library-header">
              <h5 className="library-name">{library.name}</h5>
              {library.distance && (
                <span className="library-distance">
                  <Straighten fontSize="small" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                  約 {typeof library.distance === 'number' ? library.distance.toFixed(2) : library.distance}km
                </span>
              )}
            </div>
            
            <div className="library-details">
              {library.address && (
                <div className="library-address">
                  <span className="detail-icon">
                    <Business fontSize="small" />
                  </span>
                  <span>{library.address}</span>
                </div>
              )}
              
              {library.tel && (
                <div className="library-tel">
                  <span className="detail-icon">
                    <Phone fontSize="small" />
                  </span>
                  <a href={`tel:${library.tel}`}>{library.tel}</a>
                </div>
              )}
              
              {library.category && (
                <div className="library-category">
                  <span className="detail-icon">
                    <Category fontSize="small" />
                  </span>
                  <span className="category-tag">{getCategoryDisplayName(library.category)}</span>
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
                  <Language fontSize="small" style={{ marginRight: '6px' }} />
                  公式サイト
                </a>
              )}
              <button 
                className="map-button"
                onClick={() => handleShowOnMap(library)}
                title="地図で表示"
              >
                <Map fontSize="small" style={{ marginRight: '6px' }} />
                地図
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LibraryList;