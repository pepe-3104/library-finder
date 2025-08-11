import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LibraryMap.css';

// デフォルトアイコンの修正（Leafletの既知の問題対応）
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// カスタムアイコンを作成
const createLibraryIcon = (category) => {
  const iconColor = getIconColor(category);
  return L.divIcon({
    className: 'custom-library-marker',
    html: `<div class="library-marker-icon" style="background-color: ${iconColor}">📚</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

const createLocationIcon = () => {
  return L.divIcon({
    className: 'custom-location-marker',
    html: '<div class="location-marker-icon">📍</div>',
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -25]
  });
};

// 図書館カテゴリに応じた色分け
const getIconColor = (category) => {
  switch (category) {
    case 'MEDIUM': return '#28a745'; // 中規模図書館 - 緑
    case 'LARGE': return '#007bff';  // 大規模図書館 - 青
    case 'SMALL': return '#ffc107';  // 小規模図書館 - 黄
    case 'UNIV': return '#6f42c1';   // 大学図書館 - 紫
    case 'SPECIAL': return '#fd7e14'; // 専門図書館 - オレンジ
    default: return '#6c757d';       // その他 - グレー
  }
};

// マップの中心とズームを制御するコンポーネント
const MapController = ({ center, libraries, selectedLibrary }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView([center.latitude, center.longitude], 13);
    }
  }, [center, map]);

  useEffect(() => {
    if (selectedLibrary && selectedLibrary.geocode) {
      // カーリルAPIのgeocode形式: "経度,緯度" (longitude,latitude)
      const [lng, lat] = selectedLibrary.geocode.split(',').map(Number);
      map.setView([lat, lng], 16);
      
      // 選択された図書館のポップアップを開く
      map.eachLayer((layer) => {
        if (layer.options && layer.options.libraryId === selectedLibrary.id) {
          layer.openPopup();
        }
      });
    }
  }, [selectedLibrary, map]);

  return null;
};

const LibraryMap = ({ 
  userLocation, 
  libraries = [], 
  selectedLibrary = null,
  onLibrarySelect = null,
  height = '400px' 
}) => {
  const mapRef = useRef();



  // デフォルトの中心位置（東京駅）
  const defaultCenter = { latitude: 35.6812, longitude: 139.7671 };
  const center = userLocation || defaultCenter;

  const handleMarkerClick = (library) => {
    if (onLibrarySelect) {
      onLibrarySelect(library);
    }
  };

  return (
    <div className="library-map-container" style={{ height }}>
      <MapContainer
        ref={mapRef}
        center={[center.latitude, center.longitude]}
        zoom={userLocation ? 13 : 10}
        style={{ height: '100%', width: '100%' }}
        className="library-map"
      >
        <MapController 
          center={center} 
          libraries={libraries}
          selectedLibrary={selectedLibrary}
        />
        
        {/* 地図タイル */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ユーザーの現在位置マーカー */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={createLocationIcon()}
          >
            <Popup>
              <div className="location-popup">
                <h4>📍 現在位置</h4>
                <p>緯度: {userLocation.latitude.toFixed(6)}</p>
                <p>経度: {userLocation.longitude.toFixed(6)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 図書館マーカー */}
        {libraries.map((library) => {
          if (!library.geocode) return null;
          
          // カーリルAPIのgeocode形式: "経度,緯度" (longitude,latitude)
          const [lng, lat] = library.geocode.split(',').map(Number);
          if (isNaN(lat) || isNaN(lng)) return null;
          
          return (
            <Marker
              key={library.id}
              position={[lat, lng]}
              icon={createLibraryIcon(library.category)}
              libraryId={library.id}
              eventHandlers={{
                click: () => handleMarkerClick(library)
              }}
            >
              <Popup>
                <div className="library-popup">
                  <h4>📚 {library.name}</h4>
                  {library.address && (
                    <p className="popup-address">🏢 {library.address}</p>
                  )}
                  {library.tel && (
                    <p className="popup-tel">
                      📞 <a href={`tel:${library.tel}`}>{library.tel}</a>
                    </p>
                  )}
                  {library.distance && (
                    <p className="popup-distance">📏 約 {library.distance}km</p>
                  )}
                  {library.category && (
                    <p className="popup-category">
                      📋 <span className="category-tag">{library.category}</span>
                    </p>
                  )}
                  {library.url && (
                    <div className="popup-actions">
                      <a 
                        href={library.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="popup-link"
                      >
                        🌐 公式サイト
                      </a>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* 地図の凡例 */}
      {libraries.length > 0 && (
        <div className="map-legend">
          <h5>📍 凡例</h5>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-marker location">📍</div>
              <span>現在位置</span>
            </div>
            <div className="legend-item">
              <div className="legend-marker library">📚</div>
              <span>図書館</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryMap;