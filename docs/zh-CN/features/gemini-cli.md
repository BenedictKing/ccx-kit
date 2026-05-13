---
title: Gemini CLI 支持
---

# Gemini CLI 支持

[@google/gemini-cli](https://www.npmjs.com/package/@google/gemini-cli) 是 Google 官方的 Gemini AI 命令行工具。CCX-Kit 支持完整的 Gemini CLI 集成，通过 CCX 代理实现与 Claude Code、Codex 相同的一键配置体验。

## 快速开始

```bash
# 一键初始化 Gemini CLI + CCX 代理
npx ccx-kit i --skip-prompt --code-type gemini-cli --api-type ccx_proxy --all-lang zh-CN
```

初始化完成后，CCX-Kit 会自动：
1. 安装 `@google/gemini-cli`
2. 配置 CCX 代理连接
3. 写入 `~/.gemini/.env` 和 `~/.gemini/settings.json`

## 配置文件

### ~/.gemini/.env

```env
GEMINI_API_KEY=sk-ccx-kit
GEMINI_MODEL=gemini-3-pro-preview
GOOGLE_GEMINI_BASE_URL=http://127.0.0.1:3688
```

### ~/.gemini/settings.json

```json
{
  "security": {
    "auth": {
      "selectedType": "gemini-api-key"
    }
  },
  "model": {
    "name": "gemini-3-pro-preview"
  }
}
```

## CCX 代理集成

Gemini CLI 通过 CCX 的 Gemini 协议端点工作。

### 协议路由

| 工具 | CCX 端点 | kind |
|------|---------|------|
| Claude Code | `/v1/messages` | messages |
| Codex | `/v1/responses` | responses |
| **Gemini CLI** | `/v1beta/models/{model}:generateContent` | **gemini** |

### 模型重定向

CCX 使用子串匹配规则自动重定向模型：

| Gemini 请求模型 | 匹配规则 | 转发到 |
|---|---|---|
| `gemini-3-pro-preview` | 包含 `pro` | `deepseek-v4-pro` |
| `gemini-3-flash-preview` | 包含 `flash` | `deepseek-v4-flash` |

### 添加 Gemini 渠道

通过 CCX 菜单添加预设渠道时，选择 "DeepSeek (Gemini CLI)" variant：

```bash
npx ccx-kit ccx
# 选择 7（添加预设渠道）
# 选择 DeepSeek
# 选择 "DeepSeek (Gemini CLI)" variant
# 输入 API Key
```

## 使用

```bash
# 非交互模式
gemini -p "你的问题" --skip-trust

# 交互模式
gemini
```

## 与其他工具的对比

| 特性 | Claude Code | Codex | Gemini CLI |
|------|------------|-------|-----------|
| 配置文件 | `~/.claude/settings.json` | `~/.codex/config.toml` | `~/.gemini/.env` + `settings.json` |
| CCX 协议 | messages | responses | gemini |
| 默认模型 | sonnet | gpt-5.5 | gemini-3-pro-preview |
| 认证方式 | ANTHROPIC_AUTH_TOKEN | OPENAI_API_KEY | GEMINI_API_KEY |

## 下一步

- [CCX 代理管理](ccr.md) - 了解 CCX 渠道配置和模型映射
- [Codex 支持](codex.md) - 了解 Codex 集成
- [故障排除](../advanced/troubleshooting.md) - 连接问题排查
