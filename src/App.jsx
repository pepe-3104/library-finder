import React from 'react';
import Layout from './components/layout/Layout';
import LibrarySearchSection from './components/common/LibrarySearchSection';
import MapSection from './components/common/MapSection';
import './App.css';

function App() {
  return (
    <Layout>
      <div className="content-grid">
        <LibrarySearchSection />
        <MapSection />
      </div>
      
      <div className="content-section" style={{ marginTop: '2rem' }}>
        <h2 className="section-title">📚 蔵書検索</h2>
        <div className="placeholder-content">
          <p>ISBNまたは書籍名で図書館の蔵書を検索できます。</p>
          <input 
            type="text" 
            placeholder="書籍名またはISBNを入力（実装予定）" 
            className="placeholder-input"
            disabled
          />
        </div>
      </div>
      
      <div className="development-info">
        <h3>🚧 開発状況</h3>
        <ul>
          <li>✅ 基本的なレイアウト構造</li>
          <li>✅ コンポーネント設計</li>
          <li>⏳ 位置情報取得機能（次の実装）</li>
          <li>⏳ カーリルAPI連携</li>
          <li>⏳ 地図表示機能</li>
        </ul>
      </div>
    </Layout>
  );
}

export default App;