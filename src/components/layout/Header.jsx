import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LocationStatus from '../common/LocationStatus';
import DistanceFilterPopup from '../common/DistanceFilterPopup';
import { LibraryBooks, Search, Map, MenuBook, Tune, Whatshot } from '@mui/icons-material';
import './Header.css';

const DistanceFilterComponent = ({ 
  distanceFilter, 
  onDistanceFilterChange, 
  libraries,
  allLibraries,
  categoryFilter,
  onCategoryFilterChange
}) => {
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);

  return (
    <div className="nav-distance-filter">
      <button 
        onClick={() => setIsFilterPopupOpen(true)}
        className="distance-filter-btn-nav"
        title="表示フィルタ設定"
      >
        <Tune fontSize="small" />
        <span className="filter-label">{distanceFilter}km</span>
      </button>
      
      <DistanceFilterPopup
        selectedDistance={distanceFilter}
        onDistanceChange={onDistanceFilterChange}
        libraryCount={libraries.length}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={onCategoryFilterChange}
        allLibraries={allLibraries}
        isOpen={isFilterPopupOpen}
        onClose={() => setIsFilterPopupOpen(false)}
      />
    </div>
  );
};

const Header = ({ 
  userLocation, 
  onLocationRefresh, 
  libraries = [],
  allLibraries = [],
  distanceFilter,
  onDistanceFilterChange,
  categoryFilter,
  onCategoryFilterChange
}) => {
  const location = useLocation();
  
  return (
    <header className="app-header">
      {/* 上部: ブランド情報と位置情報 */}
      <div className="header-top">
        <div className="header-container">
          <div className="header-left">
            <LocationStatus 
              userLocation={userLocation} 
              onLocationRefresh={onLocationRefresh}
            />
          </div>
          
          <div className="header-brand">
            <Link to="/" className="brand-link">
              <h1>
                <LibraryBooks style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
                としょみる
              </h1>
              <p>あなたの近くの図書館と蔵書を見つけよう</p>
            </Link>
          </div>
          
          <div className="header-right">
            {/* 必要に応じて右側に追加要素 */}
          </div>
        </div>
      </div>
      
      {/* 下部: ナビゲーション */}
      <div className="header-nav-section">
        <div className="nav-container">
          {/* 左側: 距離フィルタ */}
          <div className="nav-left">
            {libraries.length > 0 && (
              <DistanceFilterComponent
                distanceFilter={distanceFilter}
                onDistanceFilterChange={onDistanceFilterChange}
                libraries={libraries}
                allLibraries={allLibraries}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={onCategoryFilterChange}
              />
            )}
          </div>
          
          {/* 中央: ナビゲーション */}
          <nav className="header-nav">
            <ul>
              <li>
                <Link 
                  to="/" 
                  className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                >
                  <LibraryBooks className="nav-icon" fontSize="small" />
                  <span className="nav-text">図書館検索</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/map" 
                  className={`nav-link ${location.pathname === '/map' ? 'active' : ''}`}
                >
                  <Map className="nav-icon" fontSize="small" />
                  <span className="nav-text">地図で見る</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/books" 
                  className={`nav-link ${location.pathname === '/books' ? 'active' : ''}`}
                >
                  <Search className="nav-icon" fontSize="small" />
                  <span className="nav-text">蔵書検索</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/popular" 
                  className={`nav-link ${location.pathname === '/popular' ? 'active' : ''}`}
                >
                  <Whatshot className="nav-icon" fontSize="small" />
                  <span className="nav-text">人気の本</span>
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* 右側: 予備 */}
          <div className="nav-right">
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;