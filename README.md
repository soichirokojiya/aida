# Aida - AI Mediator / Facilitator SaaS

LINEグループに参加し、会話の温度を下げ、論点を整理し、次の一歩を提案するAIファシリテーター。

## 機能

- **会話温度判定**: 対立スコア(0-100)をルールベース+LLMで自動判定
- **自動仲介**: スコアが閾値を超えたとき、中立的なメッセージで介入
- **言い換え**: 「柔らかくして」などのリクエストに応じてメッセージを変換
- **要約**: 「まとめて」で直近の会話を要約
- **安全性チェック**: 脅迫・自傷示唆等を検知し相談窓口を案内
- **管理画面**: 会話ログ・介入履歴・スコアを一覧表示

## セットアップ

### 1. 環境変数

```bash
cp .env.example .env
```

`.env` を編集し、以下を設定:

| 変数 | 説明 |
|------|------|
| `DATABASE_URL` | PostgreSQL接続URL |
| `LINE_CHANNEL_SECRET` | LINE Messaging APIのChannel Secret |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging APIのChannel Access Token |
| `OPENAI_API_KEY` | OpenAI APIキー |
| `OPENAI_MODEL` | 使用モデル（デフォルト: `gpt-4o-mini`） |
| `CONFLICT_THRESHOLD` | 自動介入の閾値（デフォルト: 50） |

### 2. データベース

PostgreSQLを用意し、マイグレーションを実行:

```bash
npx prisma migrate dev --name init
```

### 3. 起動

```bash
npm run dev
```

- アプリ: http://localhost:3000
- 管理画面: http://localhost:3000/admin

### 4. LINE Webhook設定

1. [LINE Developers Console](https://developers.line.biz/) でMessaging APIチャネルを作成
2. Channel SecretとChannel Access Tokenを `.env` に設定
3. Webhook URLを設定: `https://your-domain.com/api/webhook/line`
4. Webhookを有効化
5. 応答メッセージをオフに設定
6. ボットをLINEグループに追加

### ローカル開発でのWebhookテスト

ngrokなどでローカルサーバーを公開:

```bash
npx ngrok http 3000
```

表示されたURLを LINE Webhook URLに設定。

## Vercelデプロイ

```bash
npm i -g vercel
vercel
```

環境変数をVercelダッシュボードで設定し、デプロイ。
Vercel Postgresまたは外部PostgreSQL (Supabase, Neon等) をDATABASE_URLに設定。

## アーキテクチャ

```
src/lib/
├── channels/     # チャネルアダプタ（LINE, 将来Slack/Teams）
├── intent/       # 意図判定（ルールベース + LLM）
├── conflict/     # 会話温度判定
├── llm/          # OpenAI呼び出しラッパー
├── mediation/    # 仲介メッセージ生成
├── rewrite/      # 言い換え生成
├── summarize/    # 要約・合意メモ生成
├── safety/       # 安全性チェック
├── prompts/      # LLMシステムプロンプト定義
└── db/           # Prismaクライアント
```

## MVPで割り切った点

- **認証なし**: 管理画面は認証なし（本番では要追加）
- **Slack/Teams**: 設計のみ、実装なし
- **文脈タイプ推定**: DB上のフィールドのみ、自動推定は未実装
- **課金**: 未実装
- **マルチテナント**: 未対応
- **LLMキャッシュ**: 未実装
- **レート制限**: 未実装

## 今後の拡張ポイント

1. **Slack/Teams対応**: `ChannelAdapter`を実装するだけで追加可能
2. **認証**: NextAuth.js等で管理画面にログイン機能を追加
3. **文脈タイプ自動推定**: LLMで会話内容からcontextTypeを自動設定
4. **分析ダッシュボード**: スコア推移のグラフ表示
5. **課金**: Stripe連携でSaaS化
6. **Web chat**: ブラウザ上で直接会話できるチャネル
7. **LLMキャッシュ**: 類似リクエストのキャッシュでコスト削減
