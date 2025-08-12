import React from 'react';
import Header from './Header';
import Footer from './Footer';
import './Layout.css';

const Layout = ({ 
  children, 
  userLocation, 
  onLocationRefresh, 
  libraries,
  distanceFilter,
  onDistanceFilterChange 
}) => {
  return (
    <div className="app-layout">
      <Header 
        userLocation={userLocation} 
        onLocationRefresh={onLocationRefresh}
        libraries={libraries}
        distanceFilter={distanceFilter}
        onDistanceFilterChange={onDistanceFilterChange}
      />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;