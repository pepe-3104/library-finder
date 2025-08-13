import React, { useState, useMemo, useEffect } from 'react';
import LibraryList from '../components/library/LibraryList';
import Pagination from '../components/common/Pagination';
import { LocationOn, Assessment } from '@mui/icons-material';

const ITEMS_PER_PAGE = 10;

const LibrarySearchPage = ({ libraries, onLibrarySelect }) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // 図書館データが変更されたら1ページ目に戻る
  useEffect(() => {
    setCurrentPage(1);
  }, [libraries]);
  
  // 現在のページに表示する図書館データを計算
  const paginatedLibraries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return libraries.slice(startIndex, endIndex);
  }, [libraries, currentPage]);
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // ページ変更時にページトップまでスムーズにスクロール
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

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
          libraries={paginatedLibraries}
          loading={false}
          error={null}
          onLibrarySelect={onLibrarySelect}
        />
        
        {/* ページング表示 */}
        {libraries.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={libraries.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
            showFirstLast={true}
            showInfo={true}
          />
        )}
      </div>
    </div>
  );
};

export default LibrarySearchPage;