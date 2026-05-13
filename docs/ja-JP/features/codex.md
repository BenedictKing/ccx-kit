---
title: Codex サポート
---

# Codex サポート

ZCF は OpenAI 提供の CLI ツール Codex を Claude Code と同じ操作感で管理できます。メニューからワンクリックで切り替え、インストール、設定、バックアップを自動化します。

## コア機能

- ツール統合：メニューで Claude Code / Codex をシームレスに切替
- スマート設定：Codex CLI の自動インストール、API プロバイダー設定、MCP 連携
- バックアップ：設定変更ごとにタイムスタンプ付きバックアップ
- マルチプロバイダー：OpenAI / カスタムエンドポイントを複数登録して切替
- システムプロンプト：プロ向け出力スタイルをインストール
- ワークフロー：コード生成向けに最適化されたテンプレートを導入
- アンインストーラー：不要構成を選択的に削除

## インストール/アップグレード

```bash
# Codex を自動検出し、未インストールなら導入
npx ccx-kit i -s -T codex -p 302ai -k "sk-xxx"

# アップデートチェックから更新
npx ccx-kit check-updates --code-type codex
# またはメニューの (+) から Codex を選択
```

## ディレクトリとバックアップ

```
~/.codex/
├─ config.toml      # メイン設定
├─ auth.json        # 認証情報
├─ AGENTS.md        # システムプロンプト
├─ prompts/         # ワークフロー/テンプレート
└─ backup/YYYY-MM-DD_HH-mm-ss/
```

- 変更時に自動バックアップ  
- 必要に応じて特定項目のみバックアップ/復元可能

## API/プロバイダー設定

```bash
# 302.ai プリセット + API Key
npx ccx-kit init -s -T codex -p 302ai -k "sk-xxx"

# カスタムエンドポイント
npx ccx-kit init -s -T codex -t api_key -k "sk-xxx" -u "https://api.example.com/v1" -M "gpt-4.1"
```

複数設定を `config-switch` で切り替え可能。`AGENTS.md` で出力言語やスタイルも管理します。

## ワークフローと MCP

- `~/.codex/prompts/ccx-kit/` に 6 段階ワークフローや Git スマートコマンドを導入  
- MCP も Claude Code と同じ一覧をインストール可能（Context7 / Open Web Search / Spec Workflow など）

## クリーンアップ

```bash
# Codex 関連を選択削除
npx ccx-kit uninstall --mode custom --items codex
```

## CCX プロキシ経由での利用

Codex は CCX プロキシを経由して各種モデルプロバイダーに接続できます。Codex は OpenAI の `responses` プロトコル（`wire_api=responses`）を使用するため、CCX 側で `responses` 対応のチャンネルを設定する必要があります。

### 設定のポイント

- **プロトコル**: `wire_api=responses`（Codex のネイティブプロトコル）
- **base_url**: CCX のアドレスに `/v1` サフィックスが必要（例: `http://127.0.0.1:3000/v1`）
- **認証**: `OPENAI_API_KEY` 環境変数で CCX のアクセスキーを設定
- **認証要件**: `requires_openai_auth=false`（CCX が認証を処理するため）

### config.toml の設定例

```toml
[api]
api_key = "your-ccx-access-key"
base_url = "http://127.0.0.1:3000/v1"
wire_api = "responses"

[auth]
requires_openai_auth = false
```

### CLI での設定

```bash
# CCX プロキシ経由で Codex を初期化
npx ccx-kit init -s -T codex \
  --api-type api_key \
  --api-key "your-ccx-access-key" \
  --api-url "http://127.0.0.1:3000/v1"
```

### 対応プリセット

CCX の内蔵プリセットのうち、`responses` プロトコルに対応しているものが Codex で利用可能です：

- **DeepSeek (Codex)** - `deepseek-v4-pro` / `deepseek-v4-flash`
- **MiMo 各クラスター (Codex)** - `mimo-v2.5-pro`
- **智谱 GLM Coding (Codex)** - `glm-5.1`
- **Kimi Code (Codex)** - `kimi-for-coding`

詳細は [CCX プロキシ管理](ccr.md) を参照してください。

## ヒント

- Codex 用でも `--all-lang` / `--config-lang` / `--ai-output-lang` を同様に利用可能  
- 出力スタイルは `~/.codex/prompts/output-style/` （サポートされる場合）で管理  
- 問題が起きたらバックアップから復元し、`npx ccx-kit init -T codex --config-action merge` で再適用してください。
