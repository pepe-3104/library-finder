# 📚 Library Finder

位置情報を活用した図書館検索アプリケーション。日本全国の図書館を検索し、蔵書情報を確認できます。

## ✨ 機能

- 📍 **位置情報取得**: GPS を使った現在位置の取得
- 🔍 **図書館検索**: カーリル API による周辺図書館の検索
- 🗺️ **地図表示**: React Leaflet による図書館位置のマップ表示（実装予定）
- 📖 **蔵書検索**: ISBN や書名による蔵書検索（実装予定）

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

- **Frontend**: React 18 + Vite
- **UI**: CSS3 (レスポンシブデザイン)
- **API連携**: カーリル図書館API (JSONP)
- **地図表示**: React Leaflet（実装予定）
- **状態管理**: React Hooks (useState, useCallback, useEffect)

## 📁 プロジェクト構造

```
src/
├── components/
│   ├── common/           # 共通コンポーネント
│   │   ├── LocationInput.jsx
│   │   └── LibrarySearchSection.jsx
│   ├── layout/           # レイアウトコンポーネント
│   │   ├── Header.jsx
│   │   ├── Layout.jsx
│   │   └── Footer.jsx
│   └── library/          # 図書館関連コンポーネント
│       └── LibraryList.jsx
├── hooks/                # カスタムフック
│   ├── useGeolocation.js
│   └── useLibrarySearch.js
└── App.jsx
```

## 🔧 主要コンポーネント

### useGeolocation
位置情報取得のカスタムフック
- GPS による現在位置取得
- エラーハンドリング
- ローディング状態管理

### useLibrarySearch  
図書館検索のカスタムフック
- カーリル API との JSONP 通信
- 検索結果のフォーマット
- エラーハンドリングとタイムアウト処理

### LibraryList
図書館検索結果の表示
- 図書館詳細情報の表示
- 距離順ソート
- レスポンシブデザイン

## 📝 開発ログ

開発の進捗は以下のファイルで確認できます：
- `work-log.md` - 作業ログ
- `cli-conversation-log.md` - CLI 会話ログ

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
- [React](https://reactjs.org/) - UI フレームワーク  
- [Vite](https://vitejs.dev/) - ビルドツール
