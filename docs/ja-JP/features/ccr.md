---
title: CCX プロキシ管理
---

# CCX プロキシ管理

CCX（旧称 CCR / Claude Code Router）は、複数の AI コードツールに対応する API プロキシです。ccx-kit に完全統合されており、Claude Code、Codex、Gemini CLI など異なるツールのリクエストを各種モデルプロバイダーへ中継します。

## CCX とは

CCX は AI コードツール向けの統合プロキシサーバーです。各ツールが使用するプロトコルの違いを吸収し、単一のプロキシ経由で複数のモデルプロバイダーにアクセスできるようにします。

## 対応プロトコル

CCX は 4 種類のプロトコルをサポートしています：

| プロトコル | 対象ツール | エンドポイント |
|-----------|-----------|--------------|
| `messages` | Claude Code | `/v1/messages` |
| `responses` | Codex | `/v1/responses` |
| `gemini` | Gemini CLI | `/v1beta/models/{model}:generateContent` |
| `chat` | OpenAI 互換 | `/v1/chat/completions` |

各プリセットチャンネルは対応するプロトコルに応じて適切なエンドポイントへリクエストを転送します。

## 内蔵プリセットチャンネル

CCX には以下のプロバイダーがプリセットとして組み込まれています：

| プリセット | 対応プロトコル | 説明 |
|-----------|--------------|------|
| **DeepSeek** | messages / responses / gemini | DeepSeek AI - 高性能推論モデル |
| **MiMo（小米）** | messages / responses | 小米 MiMo AI - 複数リージョン対応 |
| **SiliconFlow** | chat | 硅基流動 - 複数オープンソースモデルを集約 |
| **OpenRouter** | chat | OpenRouter - 統一モデルアクセス |
| **智谱 GLM** | messages / responses | 智谱 AI - GLM シリーズ |
| **Kimi Code** | messages / responses | Kimi Code - サブスクリプション制コーディングモデル |
| **Kimi 開放平台** | chat | Kimi 開放平台 - 従量課金 |

### モデルマッピング

プリセットにはモデルマッピングが組み込まれており、ツールが要求するモデル名を実際のプロバイダーモデルに自動変換します。

**DeepSeek の例：**

| ツール側モデル名 | マッピング先 |
|----------------|------------|
| `gpt` | `deepseek-v4-pro` |
| `mini` | `deepseek-v4-flash` |
| `haiku` | `deepseek-v4-flash` |
| `sonnet` | `deepseek-v4-pro` |
| `opus` | `deepseek-v4-pro` |
| `pro` | `deepseek-v4-pro` |
| `flash` | `deepseek-v4-flash` |

これにより、Claude Code が `sonnet` を要求した場合は `deepseek-v4-pro` に、Codex が `mini` を要求した場合は `deepseek-v4-flash` に自動的にルーティングされます。

## CCX メニュー

`npx ccx-kit ccr` を実行すると、以下の管理メニューが表示されます：

```
═══════════════════════════════════════════════════
  CCX 管理メニュー
═══════════════════════════════════════════════════

  1. CCX を初期化 - インストールと初期設定
  2. UI を起動 - Web 管理画面を開く
  3. 状態を確認 - サービスの実行状態を表示
  4. サービスを再起動
  5. サービスを起動
  6. サービスを停止
  7. プリセットチャンネルを追加
  8. チャンネルをテスト
  9. CCX をアップグレード
  10. 接続を修復
  0. メインメニューに戻る
```

### チャンネルテスト

メニューの項目 8「チャンネルをテスト」では、設定済みチャンネルに対して実際にリクエストを送信し、接続性を検証します。テストでは `pong` という応答が返ってくることを確認します。

テストの流れ：
1. チャンネルのプロトコル種別に応じたエンドポイントへリクエスト送信
2. モデルに「Reply with exactly: pong」というプロンプトを送信
3. レスポンスに `pong` が含まれていれば成功
4. レイテンシ（応答時間）も計測して表示

### 接続の自動修復

メニューの項目 10「接続を修復」は、ローカルの CCX サービスに接続できない場合に使用します。

修復の流れ：
1. `127.0.0.1` での接続を試行
2. 失敗した場合、ローカルネットワークインターフェースをスキャン
3. 到達可能なアドレスを検出し、Claude Code / Codex / Gemini CLI の設定を自動更新

これは WSL 環境やリモートサーバーなど、ループバックアドレスが使えない環境で特に有用です。

## 使用ガイド

### 基本的な使い方

```bash
# CCX 管理メニューを開く
npx ccx-kit ccr

# メインメニューからアクセス
npx ccx-kit
# → R. CCX 管理 を選択
```

### 初期設定の流れ

1. `npx ccx-kit ccr` を実行
2. 「1. CCX を初期化」を選択
3. プリセットチャンネルを選択（DeepSeek、MiMo など）
4. API キーを入力
5. CCX が自動的にインストール・設定され、各ツールのプロキシ設定も更新

### 設定ファイル

CCX の設定は `~/.ccx/.env` に保存されます。PID ファイルは `~/.ccx/ccx.pid` です。

## 各ツールとの連携

### Claude Code

Claude Code は `messages` プロトコルを使用します。CCX 初期化時に `ANTHROPIC_BASE_URL` が自動設定されます。

### Codex

Codex は `responses` プロトコルを使用します。詳細は [Codex サポート](codex.md) の CCX プロキシセクションを参照してください。

### Gemini CLI

Gemini CLI は `gemini` プロトコルを使用します。CCX 経由で DeepSeek などのモデルを Gemini CLI から利用できます。

## もっと詳しく

- [Codex サポート](codex.md) - Codex と CCX の連携について
- [Claude Code 設定](claude-code.md) - Claude Code と CCX の統合について
- [CCX プロキシ管理コマンド](../cli/ccr.md) - CLI コマンドの詳細
