import React from 'react';
import LibraryMap from './LibraryMap';
import './LibraryMap.css';
import { Map, LocationOn, LibraryBooks, TrackChanges, Mouse, Search } from '@mui/icons-material';

const MapSection = ({ userLocation, libraries, selectedLibrary, onLibrarySelect, fullscreen = false }) => {
  // 凡例コンポーネント（共通使用）
  const LegendSection = () => (
    <div className="map-legend-section" style={{ 
      background: '#f8f9fa', 
      padding: '1rem', 
      borderRadius: '8px', 
      marginBottom: '1rem', 
      border: '1px solid #e9ecef' 
    }}>
      <h4 style={{ 
        margin: '0 0 0.75rem 0', 
        fontSize: '1rem', 
        fontWeight: '600', 
        color: '#2c3e50', 
        display: 'flex', 
        alignItems: 'center' 
      }}>
        <LocationOn fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
        凡例
      </h4>
      <div className="legend-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
        gap: '0.75rem' 
      }}>
        <div className="legend-item" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          fontSize: '0.85rem', 
          color: '#495057', 
          padding: '0.25rem 0' 
        }}>
          <div className="legend-marker location" style={{ 
            fontSize: '16px', 
            width: '20px', 
            textAlign: 'center', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <LocationOn fontSize="small" style={{ color: '#d32f2f' }} />
          </div>
          <span>現在位置</span>
        </div>
        <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#495057', padding: '0.25rem 0' }}>
          <div className="legend-marker library-marker" style={{ backgroundColor: '#007bff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LibraryBooks fontSize="small" style={{ color: 'white', fontSize: '10px' }} />
          </div>
          <span>大規模図書館</span>
        </div>
        <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#495057', padding: '0.25rem 0' }}>
          <div className="legend-marker library-marker" style={{ backgroundColor: '#28a745', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LibraryBooks fontSize="small" style={{ color: 'white', fontSize: '10px' }} />
          </div>
          <span>中規模図書館</span>
        </div>
        <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#495057', padding: '0.25rem 0' }}>
          <div className="legend-marker library-marker" style={{ backgroundColor: '#ffc107', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LibraryBooks fontSize="small" style={{ color: 'white', fontSize: '10px' }} />
          </div>
          <span>小規模図書館</span>
        </div>
        <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#495057', padding: '0.25rem 0' }}>
          <div className="legend-marker library-marker" style={{ backgroundColor: '#6f42c1', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LibraryBooks fontSize="small" style={{ color: 'white', fontSize: '10px' }} />
          </div>
          <span>大学図書館</span>
        </div>
        <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#495057', padding: '0.25rem 0' }}>
          <div className="legend-marker library-marker" style={{ backgroundColor: '#fd7e14', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LibraryBooks fontSize="small" style={{ color: 'white', fontSize: '10px' }} />
          </div>
          <span>専門図書館</span>
        </div>
        <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#495057', padding: '0.25rem 0' }}>
          <div className="legend-marker library-marker" style={{ backgroundColor: '#6c757d', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LibraryBooks fontSize="small" style={{ color: 'white', fontSize: '10px' }} />
          </div>
          <span>その他</span>
        </div>
      </div>
    </div>
  );

  if (!userLocation && libraries.length === 0) {
    return (
      <div className="content-section">
        <h2 className="section-title">
          <Map style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
          地図表示
        </h2>
        
        {/* 凡例を常に表示 */}
        <LegendSection />
        
        <div className="map-placeholder">
          <div className="map-placeholder-content">
            <p>
              <Map style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
              地図がここに表示されます
            </p>
            <p>React Leafletを使用した<br />インタラクティブマップ（実装済み）</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={fullscreen ? "map-section-fullscreen" : "content-section"}>
      {!fullscreen && (
        <h2 className="section-title">
          <Map style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
          地図表示
        </h2>
      )}
      <div className="search-content">
        {!fullscreen && userLocation && (
          <p>
            <LocationOn fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            現在位置と周辺図書館をマップで確認できます。
          </p>
        )}
        {!fullscreen && libraries.length > 0 && (
          <p>
            <LibraryBooks fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {libraries.length}件の図書館が表示されています。マーカーをクリックして詳細を確認してください。
          </p>
        )}
        
        {/* 地図の凡例 - 常に表示 */}
        <LegendSection />
        
        <LibraryMap
          userLocation={userLocation}
          libraries={libraries}
          selectedLibrary={selectedLibrary}
          onLibrarySelect={onLibrarySelect}
          height={fullscreen ? "100%" : "450px"}
          fullscreen={fullscreen}
        />
        
        {!fullscreen && libraries.length > 0 && (
          <div className="map-info">
            <h4>
              <TrackChanges fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
              地図の使い方
            </h4>
            <ul>
              <li>
                <LocationOn fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom', color: '#d32f2f' }} />
                <strong>赤いマーカー</strong>: あなたの現在位置
              </li>
              <li>
                <LibraryBooks fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom', color: '#1976d2' }} />
                <strong>青いマーカー</strong>: 図書館の位置
              </li>
              <li>
                <Mouse fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                マーカーをクリックすると詳細情報が表示されます
              </li>
              <li>
                <Search fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                マウスホイールでズーム、ドラッグで地図移動ができます
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapSection;