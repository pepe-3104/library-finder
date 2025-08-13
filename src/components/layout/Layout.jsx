import React from 'react';
import Header from './Header';
import Footer from './Footer';
import './Layout.css';

const Layout = ({ 
  children, 
  userLocation, 
  onLocationRefresh, 
  libraries,
  allLibraries,
  distanceFilter,
  onDistanceFilterChange,
  categoryFilter,
  onCategoryFilterChange
}) => {
  return (
    <div className="app-layout">
      <Header 
        userLocation={userLocation} 
        onLocationRefresh={onLocationRefresh}
        libraries={libraries}
        allLibraries={allLibraries}
        distanceFilter={distanceFilter}
        onDistanceFilterChange={onDistanceFilterChange}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={onCategoryFilterChange}
      />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;