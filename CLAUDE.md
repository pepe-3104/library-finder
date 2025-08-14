# としょみる Project - Development Guidelines

## プロジェクト概要
図書館蔵書検索システム「としょみる」 - 複数の図書館APIを統合したReact Webアプリケーション

## 🏗️ アーキテクチャ・設計思想

### **Clean Architecture 原則（必須遵守）**
- **関心の分離**: 各コンポーネント・関数は単一の責任を持つ
- **依存性の逆転**: 高レベルモジュールは低レベルモジュールに依存しない
- **レイヤード・アーキテクチャ**: UI → Services → Utils → Config の依存方向を維持
- **テスタビリティ**: 各層は独立してテスト可能な設計

### **SOLID原則（コード品質基準）**
```javascript
// S: Single Responsibility Principle - 単一責任原則
// 各関数・クラスは1つの責任のみを持つ
const useISBNSearch = () => { /* ISBN検索のみ */ };
const useTitleSearch = () => { /* タイトル検索のみ */ };

// O: Open/Closed Principle - 開放/閉鎖原則
// 拡張に対して開放、修正に対して閉鎖
class BaseApiClient { /* 拡張可能な基盤クラス */ }

// L: Liskov Substitution Principle - リスコフの置換原則
// 派生クラスは基底クラスと置換可能
class RakutenBooksService extends BaseApiClient { /* 基底クラスと同じインターフェース */ }

// I: Interface Segregation Principle - インターフェース分離原則
// クライアントは不要なインターフェースに依存しない
const { searchByISBN } = useISBNSearch(); // 必要な機能のみ使用

// D: Dependency Inversion Principle - 依存性逆転原則
// 抽象に依存し、具象に依存しない
const LibrarySearchService = () => { /* 具体実装ではなく抽象的なAPIに依存 */ };
```

### **DRY原則（Don't Repeat Yourself）の実装**
```javascript
// ✅ Before: 重複していたコード（80行削除）
// src/hooks/useBookSearch.js（592行）内で重複
const normalizeISBN1 = (isbn) => isbn.replace(/[-\s]/g, ''); // 重複1
const normalizeISBN2 = (isbn) => isbn.replace(/[-\s]/g, ''); // 重複2
const normalizeISBN3 = (isbn) => isbn.replace(/[-\s]/g, ''); // 重複3

// ✅ After: 共通ユーティリティに統合
// src/utils/common.js
export const normalizeISBN = (isbn) => {
  if (!isbn) return '';
  return isbn.replace(/[-\s]/g, '');
};

// ✅ DRY実装例: 距離計算の統一
// Before: 3箇所で同じロジックが重複
// After: 1つの関数で全体をカバー
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // 地球の半径 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
};

// ✅ APIキー管理の統一（重複削除）
// Before: 各ファイルでAPIキー取得ロジックが重複
// After: src/config/apiConfig.js で一元管理
export const getApiKey = {
  rakuten: () => validateAndGetKey('VITE_RAKUTEN_API_KEY'),
  calil: () => validateAndGetKey('VITE_CALIL_API_KEY')
};
```

### **DRY適用の成果**
- **削減された重複コード**: 約80行
- **統一された関数**: normalizeISBN, calculateDistance, makeJsonpRequest, generateCallbackName
- **一元管理**: APIキー設定、エラーハンドリング、共通設定
- **メンテナンス性向上**: 1箇所の変更で全体に反映

### **採用デザインパターン**
- **Repository Pattern**: データアクセス層の抽象化（APIサービス層）
- **Strategy Pattern**: 複数API間の切り替え戦略（楽天→OpenBDフォールバック）
- **Facade Pattern**: 複雑なAPIを統一インターフェースで隠蔽（LibrarySearchService）
- **Observer Pattern**: 進捗更新の通知システム（カーリル蔵書検索）
- **DRY Principle**: 重複コード排除による保守性向上

### **ファイル構成ルール**
```
src/
├── components/          # UIコンポーネント（表示責任のみ）
├── hooks/              # ビジネスロジック（状態管理・API呼び出し）
│   └── book-search/    # 機能別フック分割
├── services/           # 外部API抽象化レイヤー
│   └── api/           # 個別APIサービス
├── utils/              # 共通ユーティリティ（純粋関数）
├── config/             # 設定・環境変数管理
└── constants/          # 定数定義
```

### **コーディング規約（強制）**
```javascript
// ✅ 良い例: 責任分離・単一目的
export const useISBNSearch = () => {
  const [loading, setLoading] = useState(false);
  const searchByISBN = useCallback(async (isbn) => {
    // ISBN検索のみの責任
  }, []);
  return { searchByISBN, loading };
};

// ❌ 悪い例: 複数責任・巨大関数
export const useBookSearch = () => {
  // 592行の巨大フック（リファクタリング前の状態）
};

// ✅ 良い例: エラーハンドリング統一
try {
  const result = await apiCall();
} catch (error) {
  errorLogger.log(error, { operation: 'searchBooks' });
  throw createError.apiRequestFailed();
}

// ❌ 悪い例: 個別エラーハンドリング
try {
  const result = await apiCall();
} catch (error) {
  console.error('API failed:', error); // 非統一・トレースできない
}
```

## 🔧 開発環境ルール

### **サーバー起動ポート**
- **標準**: サーバー起動時はport 5173を使用する（Viteデフォルト）
- **設定**: vite.config.jsで固定済み
- **実行**: `npm run dev`

## 🎯 セッション終了前の必須チェックリスト

### **高優先度（必須実行）**
- [ ] **スクリーンショット実行**: UI変更がある場合の記録
- [ ] **ログファイル更新**: 今回のセッション内容を記録
- [ ] **会話ログ記録**: cli-conversation-log.mdにユーザーとの対話内容を詳細記録
- [ ] **次回作業項目**: TodoWriteで未完了タスクを明確化
- [ ] **Git状態確認**: 全ての変更がコミット・プッシュ済み（最後に実行）

### **中優先度（推奨実行）**
- [ ] **テスト実行**: 主要機能の動作確認
- [ ] **リンター確認**: コード品質の最終チェック
- [ ] **コンソールエラー確認**: ブラウザコンソールでエラー・警告がないかチェック
- [ ] **依存関係確認**: 新しいパッケージ追加時の記録

## 📋 自動実行ルール

### **TodoWrite自動追加タイミング**
```javascript
// 以下の条件でTodoWriteに自動追加
const autoAddConditions = {
  newFeature: "新機能実装完了時",
  bugFix: "重要なバグ修正時", 
  gitCommit: "Git commit/push後",
  sessionEnd: "セッション終了30分前",
  multiFileChange: "3つ以上のファイル変更時"
}
```

### **実行コマンド例**
```bash
# スクリーンショット
npm run screenshot  # または node scripts/screenshot-all-pages.js

# テスト実行
npm test

# リンター
npm run lint

# Git確認
git status && git log --oneline -5
```

## 📝 ログ更新項目

### **development-log.md**
- ✅ 今回の作業内容（機能追加/修正/改善）
- ✅ 解決した技術課題と解決方法
- ✅ Git commit履歴（最新5件）
- ✅ パフォーマンス改善項目
- ✅ 次セッションの作業予定

### **cli-conversation-log.md**
- ✅ ユーザーとの会話要約
- ✅ 実行したコマンドとその結果
- ✅ 作成・修正されたファイル一覧
- ✅ 発生した問題と解決プロセス
- ✅ スクリーンショット情報

## 🔧 定期的な品質確認

### **毎セッション終了時**
1. **コード品質**: ESLint警告ゼロを目指す
2. **コンソールエラー**: ブラウザコンソールのエラー・警告を確認・修正
3. **UI一貫性**: デザインシステムに準拠
4. **パフォーマンス**: 重い処理の最適化確認
5. **アクセシビリティ**: 基本的なa11yチェック

### **週次確認項目**
- 📊 スクリーンショット履歴のレビュー
- 📈 Git履歴の整理とタグ付け
- 📝 ドキュメント更新
- 🧹 不要なファイル・依存関係のクリーンアップ

## 🎪 セッション引き継ぎテンプレート

### **次回セッション用メモ**
```markdown
## [日付] セッション完了報告

### 完了項目
- [x] [具体的な機能/修正内容]
- [x] [テスト/確認事項]

### 継続項目
- [ ] [未完了のタスク]
- [ ] [改善予定の項目]

### 技術メモ
- **新しい知見**: [学習した内容]
- **課題**: [解決すべき問題]
- **次の優先度**: [High/Medium/Low]

### ファイル変更情報
- 新規作成: `[ファイルパス]`
- 修正: `[ファイルパス]` - [変更内容]
- 削除: `[ファイルパス]` - [理由]
```

## 🚨 緊急時対応

### **セッション中断時の最小限チェック**
1. 現在の作業状態をTodoWriteに記録
2. 変更ファイルをstash/commit
3. 重要な設定変更があればメモ保存

### **問題発生時の記録**
- エラーメッセージの全文保存
- 再現手順の詳細記録
- 解決に至るまでのプロセス記録
- 今後の予防策

## 📚 関連ファイル
- `development-log.md` - 技術的な開発ログ
- `cli-conversation-log.md` - 会話・操作ログ
- `scripts/screenshot-*.js` - スクリーンショット自動化
- `.git/logs/` - Git操作履歴

---

**最終更新:** 2025-08-12  
**作成者:** Claude Code (Sonnet 4)  
**用途:** 開発セッション品質向上とプロジェクト継続性確保