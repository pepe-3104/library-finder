# 📚 Library Finder

位置情報を活用した図書館検索アプリケーション。日本全国の図書館を検索し、蔵書情報を確認できます。

## ✨ 機能

### 📍 位置情報機能
- GPS による現在位置の自動取得
- 手動での住所入力による位置指定
- 位置情報取得エラーハンドリング

### 🔍 図書館検索機能  
- カーリル API による全国図書館データの検索
- 現在位置からの距離順表示
- 図書館カテゴリ別分類（大規模・中規模・小規模・大学・専門・その他）
- 距離フィルタリング機能（1km、3km、5km、10km）

### 🗺️ インタラクティブ地図表示
- React Leaflet による高機能マップ
- 図書館位置のカテゴリ別カラーマーカー表示
- 現在位置とターゲット図書館の視覚的表示
- マーカークリックによる詳細情報ポップアップ
- 地図凡例による色分け説明

### 📖 蔵書検索機能
- ISBN・書名・著者名による書籍検索
- 楽天ブックス API との連携による書籍情報取得
- 書籍詳細情報（表紙画像、価格、発売日など）の表示
- 各図書館での蔵書有無確認

### 📱 PWA対応
- オフライン対応（Service Worker）
- ホーム画面への追加可能
- レスポンシブデザイン（PC・タブレット・スマートフォン対応）
- プッシュ通知準備完了

## 🚀 セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/pepe-3104/library-finder.git
cd library-finder
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成し、必要な API キーを設定してください。

```bash
cp .env.example .env
```

`.env` ファイルを編集：

```env
# カーリル API キー（必須）
VITE_CALIL_API_KEY=your-api-key-here
```

### 4. カーリル API キーの取得

1. [カーリル API 登録ページ](https://calil.jp/api/registration/) にアクセス
2. アプリケーション情報を入力してAPI キーを取得
3. 取得したAPI キーを `.env` ファイルの `VITE_CALIL_API_KEY` に設定

### 5. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:5173` で起動します。

## 🛠️ 技術スタック

### フロントエンド
- **Framework**: React 19 + Vite 7
- **ルーティング**: React Router DOM 7
- **UI Framework**: Material-UI (MUI) 7 + Emotion
- **スタイリング**: CSS3 + Material-UI System
- **状態管理**: React Hooks (useState, useCallback, useEffect)

### 地図・位置情報
- **地図ライブラリ**: React Leaflet 5 + Leaflet
- **地図データ**: OpenStreetMap
- **位置情報**: Geolocation API

### API連携
- **図書館検索**: カーリル図書館API (JSONP)
- **書籍検索**: 楽天ブックス API
- **API キャッシング**: Service Worker + Workbox

### PWA・開発支援
- **PWA**: Vite PWA Plugin + Service Worker
- **テスト**: Vitest + React Testing Library + jsdom
- **リンター**: ESLint 9
- **自動化**: Puppeteer (スクリーンショット自動生成)
- **開発サーバー**: Vite Dev Server (ホットリロード対応)

## 📁 プロジェクト構造

```
src/
├── components/
│   ├── book/             # 書籍検索関連
│   │   ├── BookSearch.jsx
│   │   └── BookSearchResults.jsx
│   ├── common/           # 共通コンポーネント
│   │   ├── DistanceFilterPopup.jsx
│   │   ├── LibrarySearchSection.jsx
│   │   ├── LocationInput.jsx
│   │   ├── LocationStatus.jsx
│   │   └── MapSection.jsx
│   ├── layout/           # レイアウトコンポーネント
│   │   ├── Footer.jsx
│   │   ├── Header.jsx
│   │   └── Layout.jsx
│   ├── library/          # 図書館関連コンポーネント
│   │   └── LibraryList.jsx
│   └── map/              # 地図関連コンポーネント
│       ├── LibraryMap.jsx
│       ├── LibraryMap.css
│       └── MapSection.jsx
├── hooks/                # カスタムフック
│   ├── useBookSearch.js
│   ├── useGeolocation.js
│   └── useLibrarySearch.js
├── pages/                # ページコンポーネント
│   ├── BookSearchPage.jsx
│   ├── LibrarySearchPage.jsx
│   └── MapPage.jsx
├── utils/                # ユーティリティ
│   └── mockData.js
├── App.jsx
└── main.jsx
```

### スクリプト・設定ファイル
```
scripts/                 # 自動化スクリプト
├── screenshot-system.js  # 統合スクリーンショット
├── screenshot-all-pages.js
└── simple-screenshot.js
```

## 🔧 主要コンポーネント

### カスタムフック

#### useGeolocation
位置情報取得のカスタムフック
- GPS による現在位置の自動取得
- 位置情報許可状態の管理
- エラーハンドリングとリトライ機能

#### useLibrarySearch  
図書館検索のカスタムフック
- カーリル API との JSONP 通信
- 検索結果のフォーマットと距離計算
- エラーハンドリングとタイムアウト処理
- 距離フィルタリング機能

#### useBookSearch
書籍検索のカスタムフック
- 楽天ブックス API との通信
- ISBN・書名・著者名による多様な検索
- 蔵書確認機能との連携

### UI コンポーネント

#### LibraryMap
インタラクティブ地図コンポーネント
- React Leaflet による地図表示
- カテゴリ別カラーマーカー表示
- ポップアップによる詳細情報表示
- 地図凡例とコントロール機能

#### LibraryList
図書館検索結果の一覧表示
- MUI アイコンを使用した視認性の高いデザイン
- 距離順ソートと詳細情報表示
- 地図連携機能とレスポンシブデザイン

#### BookSearchResults
書籍検索結果の表示
- 書籍詳細情報（表紙・価格・発売日）
- 各図書館での蔵書有無確認
- 外部サイトへのリンク機能

## 🧪 テスト・品質管理

### テスト環境
```bash
# 単体テスト実行
npm test

# テストUI起動
npm test:ui

# テスト実行（CI用）
npm test:run
```

### 品質管理ツール
```bash
# ESLint によるコード品質チェック
npm run lint

# 全ページスクリーンショット生成
npm run screenshot:all

# レスポンシブ対応スクリーンショット
npm run screenshot:responsive
```

## 📝 開発ログ・ドキュメント

プロジェクトの開発進捗と技術的な詳細は以下のファイルで管理されています：
- `CLAUDE.md` - 開発ガイドラインと品質管理ルール
- `development-log.md` - 技術的な開発ログ
- `cli-conversation-log.md` - CLI 操作と会話ログ

## 🤝 Contributing

1. このリポジトリをフォーク
2. feature ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Request を作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 🙏 謝辞

- [カーリル](https://calil.jp/) - 図書館検索API提供
- [楽天ブックス API](https://webservice.rakuten.co.jp/document/books/) - 書籍検索API提供
- [React](https://reactjs.org/) - UI フレームワーク  
- [Vite](https://vitejs.dev/) - 高速ビルドツール
- [Material-UI](https://mui.com/) - UI コンポーネントライブラリ
- [React Leaflet](https://react-leaflet.js.org/) - 地図表示ライブラリ
- [OpenStreetMap](https://www.openstreetmap.org/) - 地図データ提供
