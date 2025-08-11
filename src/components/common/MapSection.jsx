import React from 'react';

const MapSection = () => {
  return (
    <div className="content-section">
      <h2 className="section-title">🗺️ 地図表示</h2>
      <div className="placeholder-content">
        <div className="map-placeholder">
          <p>📍 地図がここに表示されます</p>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            React Leafletを使用した<br />
            インタラクティブマップ（実装予定）
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapSection;