import React from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';
import './LocationStatus.css';

const LocationStatus = ({ userLocation, onLocationRefresh }) => {
  const { loading, error, getCurrentLocation } = useGeolocation();

  const handleRefresh = () => {
    getCurrentLocation();
    if (onLocationRefresh) {
      onLocationRefresh();
    }
  };

  // 位置情報を緯度経度で表示
  const getLocationText = (location) => {
    if (!location) return null;
    
    const { latitude, longitude } = location;
    return `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
  };

  return (
    <div className="location-status">
      <button 
        onClick={handleRefresh}
        disabled={loading}
        className={`location-refresh-btn ${loading ? 'loading' : ''}`}
        title="位置情報を再取得"
      >
        {loading ? (
          <span className="refresh-spinner">⟳</span>
        ) : (
          <span>📍</span>
        )}
      </button>
      
      <div className="location-info">
        {loading && (
          <div className="location-text loading-text">
            <span className="location-label">位置取得中...</span>
          </div>
        )}
        
        {error && (
          <div className="location-text error-text">
            <span className="location-label">位置情報エラー</span>
            <span className="location-detail">再取得してください</span>
          </div>
        )}
        
        {userLocation && !loading && !error && (
          <div className="location-text success-text">
            <span className="location-label">📍 現在位置</span>
            <span className="location-detail">{getLocationText(userLocation)}</span>
          </div>
        )}
        
        {!userLocation && !loading && !error && (
          <div className="location-text">
            <span className="location-label">位置情報なし</span>
            <span className="location-detail">クリックして取得</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationStatus;