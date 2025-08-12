import React from 'react';
import BookSearch from '../components/book/BookSearch';
import { LibraryBooks } from '@mui/icons-material';

const BookSearchPage = ({ libraries, userLocation }) => {
  return (
    <div className="page-container">
      <div className="book-search-page-content">
        <h2 className="section-title">
          <LibraryBooks style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
          蔵書検索
        </h2>
        <div className="page-description">
          <p>ISBNまたは書籍名で図書館の蔵書を検索できます。</p>
          {libraries.length > 0 ? (
            <p>現在 <strong>{libraries.length}</strong> 件の図書館から検索できます。</p>
          ) : (
            <p>図書館検索ページで位置情報を取得すると、検索対象が設定されます。</p>
          )}
        </div>
        
        <BookSearch libraries={libraries} userLocation={userLocation} />
      </div>
    </div>
  );
};

export default BookSearchPage;