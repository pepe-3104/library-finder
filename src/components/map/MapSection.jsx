import React from 'react';
import LibraryMap from './LibraryMap';

const MapSection = ({ userLocation, libraries, selectedLibrary, onLibrarySelect }) => {
  if (!userLocation && libraries.length === 0) {
    return (
      <div className="content-section">
        <h2 className="section-title">🗺️ 地図表示</h2>
        <div className="map-placeholder">
          <div className="map-placeholder-content">
            <p>🗺️ 地図がここに表示されます</p>
            <p>React Leafletを使用した<br />インタラクティブマップ（実装済み）</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-section">
      <h2 className="section-title">🗺️ 地図表示</h2>
      <div className="search-content">
        {userLocation && (
          <p>📍 現在位置と周辺図書館をマップで確認できます。</p>
        )}
        {libraries.length > 0 && (
          <p>📚 {libraries.length}件の図書館が表示されています。マーカーをクリックして詳細を確認してください。</p>
        )}
        
        <LibraryMap
          userLocation={userLocation}
          libraries={libraries}
          selectedLibrary={selectedLibrary}
          onLibrarySelect={onLibrarySelect}
          height="450px"
        />
        
        {libraries.length > 0 && (
          <div className="map-info">
            <h4>🎯 地図の使い方</h4>
            <ul>
              <li>📍 <strong>赤いマーカー</strong>: あなたの現在位置</li>
              <li>📚 <strong>青いマーカー</strong>: 図書館の位置</li>
              <li>🖱️ マーカーをクリックすると詳細情報が表示されます</li>
              <li>🔍 マウスホイールでズーム、ドラッグで地図移動ができます</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapSection;