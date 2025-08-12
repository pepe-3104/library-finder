import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Library Finder</h4>
            <p>全国の図書館と蔵書情報を簡単に検索</p>
          </div>
          <div className="footer-section">
            <h4>データ提供</h4>
            <p>
              <a href="https://calil.jp" target="_blank" rel="noopener noreferrer">
                カーリル図書館API
              </a>
            </p>
            <p>
              <a href="https://webservice.rakuten.co.jp/" target="_blank" rel="noopener noreferrer">
                Supported by Rakuten Developers
              </a>
            </p>
          </div>
          <div className="footer-section">
            <h4>リンク</h4>
            <ul>
              <li><a href="https://github.com/pepe-3104/library-finder" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href="#privacy">プライバシーポリシー</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Library Finder. Powered by Calil API.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;