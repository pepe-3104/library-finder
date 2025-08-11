import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand">
          <h1>📚 Library Finder</h1>
          <p>あなたの近くの図書館と蔵書を見つけよう</p>
        </div>
        <nav className="header-nav">
          <ul>
            <li><a href="#search" className="nav-link">図書館検索</a></li>
            <li><a href="#map" className="nav-link">地図で見る</a></li>
            <li><a href="#books" className="nav-link">蔵書検索</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;