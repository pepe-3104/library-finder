import React from 'react';
import LibraryMap from './LibraryMap';
import { Map, LocationOn, LibraryBooks, TrackChanges, Mouse, Search } from '@mui/icons-material';

const MapSection = ({ userLocation, libraries, selectedLibrary, onLibrarySelect, fullscreen = false }) => {
  if (!userLocation && libraries.length === 0) {
    return (
      <div className="content-section">
        <h2 className="section-title">
          <Map style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
          地図表示
        </h2>
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