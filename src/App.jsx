import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LibrarySearchPage from './pages/LibrarySearchPage';
import MapPage from './pages/MapPage';
import BookSearchPage from './pages/BookSearchPage';
import { useGeolocation } from './hooks/useGeolocation';
import { useLibrarySearch } from './hooks/useLibrarySearch';
import './App.css';
import './pages/Pages.css';

// 開発環境でのみコンソールテスト機能を読み込み
if (import.meta.env.DEV) {
  import('./utils/consoleTest.js');
}

function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [libraries, setLibraries] = useState([]);
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const { location, getCurrentLocation } = useGeolocation();
  const { libraries: searchedLibraries, searchNearbyLibraries } = useLibrarySearch();

  // 位置情報をuserLocationに同期
  useEffect(() => {
    if (location) {
      setUserLocation(location);
    }
  }, [location]);

  // 位置情報が更新されたら自動的に図書館検索を実行
  useEffect(() => {
    if (location) {
      console.log('🔍 App: 位置情報取得、図書館検索を開始:', location);
      searchNearbyLibraries(location.latitude, location.longitude);
    }
  }, [location, searchNearbyLibraries]);

  // 図書館検索結果をlibrariesに同期
  useEffect(() => {
    if (searchedLibraries && searchedLibraries.length > 0) {
      console.log('📚 App: 図書館検索結果を更新:', searchedLibraries.length, '件');
      setLibraries(searchedLibraries);
    }
  }, [searchedLibraries]);

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


  const handleLibrarySelect = (library) => {
    setSelectedLibrary(library);
  };

  // ヘッダーからの位置情報再取得
  const handleLocationRefresh = () => {
    getCurrentLocation();
  };

  return (
    <Router>
      <Layout 
        userLocation={userLocation} 
        onLocationRefresh={handleLocationRefresh}
      >
        <Routes>
          <Route 
            path="/" 
            element={
              <LibrarySearchPage 
                userLocation={userLocation}
                libraries={libraries}
                onLibrarySelect={handleLibrarySelect}
              />
            } 
          />
          <Route 
            path="/map" 
            element={
              <MapPage 
                userLocation={userLocation}
                libraries={libraries}
                selectedLibrary={selectedLibrary}
                onLibrarySelect={handleLibrarySelect}
              />
            } 
          />
          <Route 
            path="/books" 
            element={
              <BookSearchPage 
                libraries={libraries}
              />
            } 
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;