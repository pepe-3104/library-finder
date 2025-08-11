import React from 'react';

const LibrarySearchSection = () => {
  return (
    <div className="content-section">
      <h2 className="section-title">📍 図書館検索</h2>
      <div className="placeholder-content">
        <p>現在位置から最寄りの図書館を検索します。</p>
        <button className="placeholder-button" disabled>
          位置情報を取得（実装予定）
        </button>
      </div>
    </div>
  );
};

export default LibrarySearchSection;