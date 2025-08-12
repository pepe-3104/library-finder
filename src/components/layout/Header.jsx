import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import LocationStatus from '../common/LocationStatus';
import { LibraryBooks } from '@mui/icons-material';
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
        
        <nav className="header-nav">
          <ul>
            <li>
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                図書館検索
              </Link>
            </li>
            <li>
              <Link 
                to="/map" 
                className={`nav-link ${location.pathname === '/map' ? 'active' : ''}`}
              >
                地図で見る
              </Link>
            </li>
            <li>
              <Link 
                to="/books" 
                className={`nav-link ${location.pathname === '/books' ? 'active' : ''}`}
              >
                蔵書検索
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;