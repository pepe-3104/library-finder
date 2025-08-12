import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import LocationStatus from '../common/LocationStatus';
import { LibraryBooks, Search, Map, MenuBook } from '@mui/icons-material';
import './Header.css';

const Header = ({ 
  userLocation, 
  onLocationRefresh, 
  libraries = [],
  distanceFilter,
  onDistanceFilterChange 
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
              libraries={libraries}
              distanceFilter={distanceFilter}
              onDistanceFilterChange={onDistanceFilterChange} 
            />
          </div>
          
          <div className="header-brand">
            <Link to="/" className="brand-link">
              <h1>
                <LibraryBooks style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
                Library Finder
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
          <nav className="header-nav">
            <ul>
              <li>
                <Link 
                  to="/" 
                  className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                >
                  <LibraryBooks className="nav-icon" fontSize="small" />
                  図書館検索
                </Link>
              </li>
              <li>
                <Link 
                  to="/map" 
                  className={`nav-link ${location.pathname === '/map' ? 'active' : ''}`}
                >
                  <Map className="nav-icon" fontSize="small" />
                  地図で見る
                </Link>
              </li>
              <li>
                <Link 
                  to="/books" 
                  className={`nav-link ${location.pathname === '/books' ? 'active' : ''}`}
                >
                  <Search className="nav-icon" fontSize="small" />
                  蔵書検索
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;