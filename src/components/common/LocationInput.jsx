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
      <div className="location-controls">
        <button 
          onClick={getCurrentLocation} 
          disabled={loading}
          className={`location-button ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              位置情報を取得中...
            </>
          ) : (
            <>
              📍 現在位置を取得
            </>
          )}
        </button>
        
        {location && (
          <button 
            onClick={clearLocation}
            className="clear-button"
            title="位置情報をクリア"
          >
            🗑️ クリア
          </button>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="location-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
        </div>
      )}

      {/* 位置情報表示 */}
      {location && (
        <div className="location-result">
          <div className="location-success">
            <span className="success-icon">✅</span>
            <span className="success-message">位置情報を取得しました</span>
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

      {/* 使用方法の説明 */}
      {!location && !error && !loading && (
        <div className="location-help">
          <p>📱 「現在位置を取得」ボタンをクリックして、最寄りの図書館を検索しましょう</p>
          <div className="help-note">
            ※ 位置情報の利用を許可するダイアログが表示される場合があります
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationInput;