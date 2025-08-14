import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LibrarySearchPage from './pages/LibrarySearchPage';
import MapPage from './pages/MapPage';
import BookSearchPage from './pages/BookSearchPage';
import PopularBooksPage from './pages/PopularBooksPage';
import { useGeolocation } from './hooks/useGeolocation';
import { useLibrarySearch } from './hooks/useLibrarySearch';
import { getDefaultCategoryFilter, filterLibrariesByCategory } from './utils/libraryCategoryFilter';
import './App.css';
import './pages/Pages.css';


function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [libraries, setLibraries] = useState([]);
  const [allLibraries, setAllLibraries] = useState([]); // フィルタ前の全図書館データ
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [maxDistance, setMaxDistance] = useState(5); // デフォルト5km
  const [categoryFilter, setCategoryFilter] = useState(getDefaultCategoryFilter()); // カテゴリフィルタ
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
      // 距離フィルタの現在値で検索（デフォルト10km）
      searchNearbyLibraries(location.latitude, location.longitude, maxDistance);
    }
  }, [location, searchNearbyLibraries, maxDistance]);

  // 図書館検索結果をallLibrariesに保存し、フィルタリングして表示
  useEffect(() => {
    if (searchedLibraries && searchedLibraries.length > 0) {
      setAllLibraries(searchedLibraries);
    }
  }, [searchedLibraries]);

  // カテゴリフィルタが変更されたらlibrariesを更新
  useEffect(() => {
    if (allLibraries.length > 0) {
      const filteredLibraries = filterLibrariesByCategory(allLibraries, categoryFilter);
      setLibraries(filteredLibraries);
    }
  }, [allLibraries, categoryFilter]);

  // カテゴリフィルタ変更ハンドラ
  const handleCategoryFilterChange = (newFilter) => {
    setCategoryFilter(newFilter);
  };

  // スクリーンショット用モックデータのイベントリスナー
  useEffect(() => {
    const handleMockDataForScreenshot = (event) => {
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

  // 距離フィルタが変更された時の図書館再検索
  const handleDistanceFilterChange = (newDistance) => {
    setMaxDistance(newDistance);
    // 現在位置がある場合は新しい距離で再検索
    if (userLocation) {
      searchNearbyLibraries(userLocation.latitude, userLocation.longitude, newDistance);
    }
  };

  return (
    <Router>
      <Layout 
        userLocation={userLocation} 
        onLocationRefresh={handleLocationRefresh}
        libraries={libraries}
        allLibraries={allLibraries}
        distanceFilter={maxDistance}
        onDistanceFilterChange={handleDistanceFilterChange}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={handleCategoryFilterChange}
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
                userLocation={userLocation}
              />
            } 
          />
          <Route 
            path="/popular" 
            element={
              <PopularBooksPage 
                libraries={libraries}
                userLocation={userLocation}
              />
            } 
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;