import React, { useState } from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { LocationOn, Refresh, Tune } from '@mui/icons-material';
import DistanceFilterPopup from './DistanceFilterPopup';
import './LocationStatus.css';

const LocationStatus = ({ 
  userLocation, 
  onLocationRefresh,
  libraries = [],
  distanceFilter,
  onDistanceFilterChange 
}) => {
  const { loading, error, getCurrentLocation } = useGeolocation();
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);

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
      <div className="location-buttons">
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className={`location-refresh-btn ${loading ? 'loading' : ''}`}
          title="位置情報を再取得"
        >
          {loading ? (
            <Refresh className="refresh-spinner" fontSize="small" />
          ) : (
            <LocationOn fontSize="small" />
          )}
        </button>
        
        {libraries.length > 0 && (
          <button 
            onClick={() => setIsFilterPopupOpen(true)}
            className="distance-filter-btn"
            title="距離フィルタ設定"
          >
            <Tune fontSize="small" />
            <span className="filter-label">{distanceFilter}km</span>
          </button>
        )}
      </div>
      
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
            <span className="location-label">
              <LocationOn fontSize="small" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
              現在位置
            </span>
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
      
      {/* 距離フィルタポップアップ */}
      <DistanceFilterPopup
        selectedDistance={distanceFilter}
        onDistanceChange={onDistanceFilterChange}
        libraryCount={libraries.length}
        isOpen={isFilterPopupOpen}
        onClose={() => setIsFilterPopupOpen(false)}
      />
    </div>
  );
};

export default LocationStatus;