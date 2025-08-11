import React, { useState, useEffect } from 'react';
import LocationInput from './LocationInput';
import LibraryList from '../library/LibraryList';
import { useLibrarySearch } from '../../hooks/useLibrarySearch';

const LibrarySearchSection = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const { libraries, loading, error, searchNearbyLibraries, clearResults } = useLibrarySearch();

  const handleLocationChange = (location) => {
    setCurrentLocation(location);
    console.log('📍 図書館検索用位置情報が更新されました:', location);
  };

  // 位置情報が更新されたら自動的に図書館検索を実行
  useEffect(() => {
    if (currentLocation) {
      console.log('🔍 図書館検索を開始します...');
      searchNearbyLibraries(currentLocation.latitude, currentLocation.longitude);
    } else {
      // 位置情報がクリアされた場合は検索結果もクリア
      clearResults();
    }
  }, [currentLocation, searchNearbyLibraries, clearResults]);

  const handleRetry = () => {
    if (currentLocation) {
      searchNearbyLibraries(currentLocation.latitude, currentLocation.longitude);
    }
  };

  return (
    <div className="content-section">
      <h2 className="section-title">📍 図書館検索</h2>
      <div className="search-content">
        <p>現在位置から最寄りの図書館を検索します。</p>
        
        <LocationInput onLocationChange={handleLocationChange} />
        
        {/* 図書館検索結果を表示 */}
        {(currentLocation || loading || error || libraries.length > 0) && (
          <LibraryList 
            libraries={libraries}
            loading={loading}
            error={error}
            onRetry={handleRetry}
          />
        )}
      </div>
    </div>
  );
};

export default LibrarySearchSection;