import React, { useState, useEffect } from 'react';
import LibraryList from '../library/LibraryList';

const LibrarySearchSection = ({ userLocation, libraries, onLibrarySelect }) => {
  const [mockLibraries, setMockLibraries] = useState([]);

  // スクリーンショット用モックデータのイベントリスナー
  useEffect(() => {
    const handleMockDataForScreenshot = (event) => {
      console.log('📚 LibrarySearchSection: モックデータ受信', event.detail);
      setMockLibraries(event.detail.libraries);
    };

    window.addEventListener('mockDataForScreenshot', handleMockDataForScreenshot);
    
    return () => {
      window.removeEventListener('mockDataForScreenshot', handleMockDataForScreenshot);
    };
  }, []);

  // 表示用の図書館データを決定（モックデータがある場合は優先）
  const displayLibraries = mockLibraries.length > 0 ? mockLibraries : libraries;

  return (
    <div className="content-section" data-component="library-search">
      <h2 className="section-title">📍 図書館検索</h2>
      <div className="search-content">
        <p>現在位置から最寄りの図書館を検索します。</p>
        
        {/* 図書館検索結果を表示 */}
        <LibraryList 
          libraries={displayLibraries}
          loading={false}
          error={null}
          onLibrarySelect={onLibrarySelect}
        />
      </div>
    </div>
  );
};

export default LibrarySearchSection;