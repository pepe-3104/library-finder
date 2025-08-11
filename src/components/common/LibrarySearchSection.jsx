import React, { useState, useEffect } from 'react';
import LocationInput from './LocationInput';
import LibraryList from '../library/LibraryList';
import { useLibrarySearch } from '../../hooks/useLibrarySearch';

const LibrarySearchSection = ({ onLocationUpdate, onLibrariesUpdate, onLibrarySelect }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mockLibraries, setMockLibraries] = useState([]);
  const { libraries, loading, error, searchNearbyLibraries, clearResults } = useLibrarySearch();

  // スクリーンショット用モックデータのイベントリスナー
  useEffect(() => {
    const handleMockDataForScreenshot = (event) => {
      console.log('📚 LibrarySearchSection: モックデータ受信', event.detail);
      setCurrentLocation(event.detail.userLocation);
      setMockLibraries(event.detail.libraries);
      
      // 親コンポーネントにも通知
      if (onLocationUpdate) {
        onLocationUpdate(event.detail.userLocation);
      }
      if (onLibrariesUpdate) {
        onLibrariesUpdate(event.detail.libraries);
      }
    };

    window.addEventListener('mockDataForScreenshot', handleMockDataForScreenshot);
    
    return () => {
      window.removeEventListener('mockDataForScreenshot', handleMockDataForScreenshot);
    };
  }, [onLocationUpdate, onLibrariesUpdate]);

  const handleLocationChange = (location) => {
    setCurrentLocation(location);
    console.log('📍 図書館検索用位置情報が更新されました:', location);
    
    // 親コンポーネントに位置情報を通知
    if (onLocationUpdate) {
      onLocationUpdate(location);
    }
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

  // 図書館検索結果が更新されたら親コンポーネントに通知
  useEffect(() => {
    if (onLibrariesUpdate) {
      onLibrariesUpdate(libraries);
    }
  }, [libraries, onLibrariesUpdate]);

  // 表示用の図書館データを決定（モックデータがある場合は優先）
  const displayLibraries = mockLibraries.length > 0 ? mockLibraries : libraries;

  const handleRetry = () => {
    if (currentLocation) {
      searchNearbyLibraries(currentLocation.latitude, currentLocation.longitude);
    }
  };


  return (
    <div className="content-section" data-component="library-search">
      <h2 className="section-title">📍 図書館検索</h2>
      <div className="search-content">
        <p>現在位置から最寄りの図書館を検索します。</p>
        
        <LocationInput onLocationChange={handleLocationChange} />
        
        {/* 図書館検索結果を表示 */}
        {(currentLocation || loading || error || displayLibraries.length > 0) && (
          <LibraryList 
            libraries={displayLibraries}
            loading={loading}
            error={error}
            onRetry={handleRetry}
            onLibrarySelect={onLibrarySelect}
          />
        )}
      </div>
    </div>
  );
};

export default LibrarySearchSection;