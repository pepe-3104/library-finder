import React from 'react';
import { ChevronLeft, ChevronRight, FirstPage, LastPage } from '@mui/icons-material';
import './Pagination.css';

const Pagination = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  showFirstLast = true,
  showInfo = true
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // 表示するページ番号の範囲を計算
  const getVisiblePages = () => {
    const maxVisible = 5; // 最大5つのページ番号を表示
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    // 終端調整
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) {
    return null; // ページが1つ以下なら表示しない
  }

  return (
    <div className="pagination-container">
      {showInfo && (
        <div className="pagination-info">
          <span>
            {startItem}-{endItem} / {totalItems}件
          </span>
        </div>
      )}
      
      <div className="pagination-controls">
        {/* 最初のページ */}
        {showFirstLast && currentPage > 1 && (
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(1)}
            title="最初のページ"
          >
            <FirstPage fontSize="small" />
          </button>
        )}
        
        {/* 前のページ */}
        <button
          className={`pagination-btn ${currentPage <= 1 ? 'disabled' : ''}`}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title="前のページ"
        >
          <ChevronLeft fontSize="small" />
        </button>
        
        {/* ページ番号 */}
        {visiblePages.map(page => (
          <button
            key={page}
            className={`pagination-btn page-number ${page === currentPage ? 'active' : ''}`}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </button>
        ))}
        
        {/* 次のページ */}
        <button
          className={`pagination-btn ${currentPage >= totalPages ? 'disabled' : ''}`}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title="次のページ"
        >
          <ChevronRight fontSize="small" />
        </button>
        
        {/* 最後のページ */}
        {showFirstLast && currentPage < totalPages && (
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(totalPages)}
            title="最後のページ"
          >
            <LastPage fontSize="small" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Pagination;