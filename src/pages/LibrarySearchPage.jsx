import React from 'react';
import LibrarySearchSection from '../components/common/LibrarySearchSection';

const LibrarySearchPage = ({ userLocation, libraries, onLibrarySelect }) => {
  return (
    <div className="page-container">
      <LibrarySearchSection 
        userLocation={userLocation}
        libraries={libraries}
        onLibrarySelect={onLibrarySelect}
      />
    </div>
  );
};

export default LibrarySearchPage;