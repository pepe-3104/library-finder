import React from 'react';
import MapSection from '../components/map/MapSection';

const MapPage = ({ userLocation, libraries, selectedLibrary, onLibrarySelect }) => {
  return (
    <div className="page-container">
      <div className="map-page-content">
        <h2 className="section-title">🗺️ 地図で見る</h2>
        <p>周辺の図書館を地図上で確認できます。マーカーをクリックして詳細情報を表示してください。</p>
        
        <div className="map-container-fullscreen">
          <MapSection 
            userLocation={userLocation}
            libraries={libraries}
            selectedLibrary={selectedLibrary}
            onLibrarySelect={onLibrarySelect}
            fullscreen={true}
          />
        </div>
        
        {libraries.length > 0 && (
          <div className="map-stats">
            <p>📊 表示中: {libraries.length}件の図書館</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;