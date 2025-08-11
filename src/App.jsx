import React, { useState, useEffect } from 'react';
import Layout from './components/layout/Layout';
import LibrarySearchSection from './components/common/LibrarySearchSection';
import MapSection from './components/map/MapSection';
import './App.css';

function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [libraries, setLibraries] = useState([]);
  const [selectedLibrary, setSelectedLibrary] = useState(null);

  // スクリーンショット用モックデータのイベントリスナー
  useEffect(() => {
    const handleMockDataForScreenshot = (event) => {
      console.log('📸 スクリーンショット用モックデータを適用中...', event.detail);
      setUserLocation(event.detail.userLocation);
      setLibraries(event.detail.libraries);
    };

    window.addEventListener('mockDataForScreenshot', handleMockDataForScreenshot);
    
    return () => {
      window.removeEventListener('mockDataForScreenshot', handleMockDataForScreenshot);
    };
  }, []);

  // 位置情報とライブラリデータの共有
  const handleLocationUpdate = (location) => {
    setUserLocation(location);
  };

  const handleLibrariesUpdate = (libraryList) => {
    setLibraries(libraryList);
  };

  const handleLibrarySelect = (library) => {
    setSelectedLibrary(library);
  };

  return (
    <Layout>
      <div className="content-grid">
        <LibrarySearchSection 
          onLocationUpdate={handleLocationUpdate}
          onLibrariesUpdate={handleLibrariesUpdate}
          onLibrarySelect={handleLibrarySelect}
        />
        <div data-section="map">
          <MapSection 
            userLocation={userLocation}
            libraries={libraries}
            selectedLibrary={selectedLibrary}
            onLibrarySelect={handleLibrarySelect}
          />
        </div>
      </div>
      
      <div className="content-section" style={{ marginTop: '2rem' }}>
        <h2 className="section-title">📚 蔵書検索</h2>
        <div className="placeholder-content">
          <p>ISBNまたは書籍名で図書館の蔵書を検索できます。</p>
          <input 
            type="text" 
            placeholder="書籍名またはISBNを入力（実装予定）" 
            className="placeholder-input"
            disabled
          />
        </div>
      </div>
      
      <div className="development-info">
        <h3>🚧 開発状況</h3>
        <ul>
          <li>✅ 基本的なレイアウト構造</li>
          <li>✅ コンポーネント設計</li>
          <li>✅ 位置情報取得機能</li>
          <li>✅ カーリルAPI連携</li>
          <li>✅ 地図表示機能</li>
          <li>⏳ 蔵書検索機能（次の実装予定）</li>
        </ul>
      </div>
    </Layout>
  );
}

export default App;