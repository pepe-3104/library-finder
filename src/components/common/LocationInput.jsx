import React from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';
import './LocationInput.css';

const LocationInput = ({ onLocationChange }) => {
  const { location, error, loading, getCurrentLocation, clearLocation } = useGeolocation();

  // 位置情報が更新されたら親コンポーネントに通知
  React.useEffect(() => {
    if (location && onLocationChange) {
      onLocationChange(location);
    }
  }, [location, onLocationChange]);

  return (
    <div className="location-input">
      {/* 自動取得中の表示 */}
      {loading && (
        <div className="location-loading">
          <span className="spinner"></span>
          <span className="loading-message">位置情報を自動取得中...</span>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="location-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button 
            onClick={getCurrentLocation} 
            className="retry-button"
          >
            🔄 再試行
          </button>
        </div>
      )}

      {/* 位置情報表示 */}
      {location && (
        <div className="location-result">
          <div className="location-success">
            <div>
              <span className="success-icon">✅</span>
              <span className="success-message">位置情報を取得しました</span>
            </div>
            <button 
              onClick={getCurrentLocation}
              className="refresh-button"
              title="位置情報を再取得"
              disabled={loading}
            >
              🔄 再取得
            </button>
          </div>
          
          <div className="location-details">
            <div className="location-coord">
              <strong>緯度:</strong> {location.latitude.toFixed(6)}
            </div>
            <div className="location-coord">
              <strong>経度:</strong> {location.longitude.toFixed(6)}
            </div>
            <div className="location-accuracy">
              <strong>精度:</strong> 約 {Math.round(location.accuracy)} メートル
            </div>
          </div>
        </div>
      )}

      {/* 初期状態の説明 */}
      {!location && !error && !loading && (
        <div className="location-help">
          <p>📱 位置情報を自動取得しています...</p>
          <div className="help-note">
            ※ 位置情報の利用を許可するダイアログが表示される場合があります
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationInput;