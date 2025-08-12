import React from 'react';
import LibraryList from '../components/library/LibraryList';
import { LocationOn, Assessment } from '@mui/icons-material';

const LibrarySearchPage = ({ libraries, onLibrarySelect }) => {
  return (
    <div className="page-container">
      <div className="library-search-page-content">
        <h2 className="section-title">
          <LocationOn style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
          図書館検索
        </h2>
        <div className="page-description">
          <p>現在位置から最寄りの図書館を検索します。</p>
          {libraries.length > 0 ? (
            <p>
              <Assessment fontSize="small" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
              検索結果: <strong>{libraries.length}</strong> 件の図書館が見つかりました。
            </p>
          ) : (
            <p>位置情報を取得すると、周辺の図書館が表示されます。</p>
          )}
        </div>
        
        <LibraryList 
          libraries={libraries}
          loading={false}
          error={null}
          onLibrarySelect={onLibrarySelect}
        />
      </div>
    </div>
  );
};

export default LibrarySearchPage;