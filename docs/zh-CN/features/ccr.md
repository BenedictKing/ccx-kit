---
title: CCX 代理管理
---

# CCX 代理管理

[CCX](https://github.com/nicepkg/ccx)（原 Claude Code Router / CCR）是一个强大的代理路由器，可以实现多个 AI 模型的智能路由和成本优化。ccx-kit 内置完整的 CCX 管理能力，帮助您快速搭建高可用的 AI 代码工具代理系统，支持 Claude Code、Codex 和 Gemini CLI 三种工具。

## 什么是 CCX

CCX 是一个强大的代理路由器，旨在解决单一模型成本高、可用性低的问题。它可以作为中间层，智能地将 Claude Code、Codex、Gemini CLI 的请求转发到不同的模型提供商。

## 核心优势

### 🎯 智能模型路由

通过内置模型映射（Model Mapping），自动将工具请求的模型名映射到实际提供商模型：

- **Claude Code**：haiku → deepseek-v4-flash，sonnet/opus → deepseek-v4-pro
- **Codex**：gpt → deepseek-v4-pro，mini → deepseek-v4-flash
- **Gemini CLI**：pro → deepseek-v4-pro，flash → deepseek-v4-flash

### 💰 成本优化

通过智能路由，为不同任务选择最经济的模型，最高可将 API 成本降低 50-80%。

### 🌐 多提供商预设渠道

支持一键添加预设渠道，无需手动配置：

- **DeepSeek**：DeepSeek V4 系列模型
- **MiMo（小米）**：支持多地区集群（中国/新加坡/欧洲）
- **SiliconFlow 硅基流动**：聚合多家开源模型
- **OpenRouter**：统一访问多家模型
- **智谱 GLM**：GLM 系列模型
- **Kimi Code**：会员订阅制编码模型
- **Kimi 开放平台**：按量付费

### 🔌 多协议支持

每个预设渠道提供多种协议变体，适配不同工具：

| 协议类型 | kind 值 | 适用工具 | 端点 |
|---------|---------|---------|------|
| Anthropic Messages | `messages` | Claude Code | `/v1/messages` |
| OpenAI Responses | `responses` | Codex | `/v1/responses` |
| Gemini | `gemini` | Gemini CLI | `/v1beta/models/{model}:generateContent` |
| OpenAI Chat | `chat` | 通用 | `/v1/chat/completions` |

### 📊 可视化管理

内置 Web UI，提供直观的配置界面和详细的使用统计。

- **实时监控**：查看请求流量和响应时间
- **成本分析**：详细的成本统计报表
- **图形化配置**：无需手动编辑配置即可调整路由规则

## 使用指南

### CCX 管理菜单

通过 CLI 命令进入 CCX 管理菜单：

```bash
# 打开 CCX 管理菜单
npx ccx-kit ccr

# 或通过主菜单访问
npx ccx-kit
# 然后选择 R. CCX 管理
```

### 菜单选项（共 10 项）

```
═══════════════════════════════════════════════════
  CCX 管理菜单
═══════════════════════════════════════════════════

  1. 初始化 CCX - 安装并配置 CCX
  2. 启动 UI - 启动 CCX Web 界面
  3. 检查状态 - 查看当前 CCX 服务状态
  4. 重启服务 - 重启 CCX 服务
  5. 启动服务 - 启动 CCX 服务
  6. 停止服务 - 停止 CCX 服务
  7. 添加预设渠道 - 一键添加内置模型映射的渠道
  8. 测试渠道 - 验证渠道连通性
  9. 升级 CCX - 检查并升级 CCX 版本
  10. 修复连接地址 - 自动检测并修复 base URL
  0. 返回主菜单
```

## 功能详解

### 1. 初始化 CCX

首次设置 CCX 或重新配置：

1. 自动检测是否已安装 CCX
2. 如果未安装，自动下载安装
3. 创建配置文件 `~/.ccx/.env`
4. 自动配置 Claude Code 使用 CCX 代理
5. 启动 CCX 服务
6. 自动检测连通性并修复 base URL

### 2-6. 服务管理

- **启动 UI**：打开 CCX Web 管理界面
- **检查状态**：查看服务运行状态、端口、PID
- **重启/启动/停止服务**：CCX 服务生命周期管理

### 7. 添加预设渠道

一键添加预配置的上游渠道，内置模型映射：

```bash
npx ccx-kit ccr
# 选择 7
# 选择提供商（如 DeepSeek）
# 选择协议变体（如 DeepSeek (Codex) - Responses 协议）
# 输入 API Key
# 自动添加并测试渠道
```

**预设渠道列表**：

| 提供商 | 协议变体 | 模型映射示例 |
|--------|---------|-------------|
| DeepSeek | Codex (responses) | gpt → deepseek-v4-pro, mini → deepseek-v4-flash |
| DeepSeek | Claude Code (messages) | haiku → deepseek-v4-flash, sonnet/opus → deepseek-v4-pro |
| DeepSeek | Gemini CLI (gemini) | pro → deepseek-v4-pro, flash → deepseek-v4-flash |
| MiMo (小米) | 余额/订阅 Plan (多集群) | haiku/opus/sonnet → mimo-v2.5-pro |
| SiliconFlow | chat | - |
| OpenRouter | chat | - |
| 智谱 GLM | Codex / Claude Code | gpt/haiku/opus/sonnet → glm-5.1 |
| Kimi Code | Codex / Claude Code | gpt/haiku/opus/sonnet → kimi-for-coding |
| Kimi 开放平台 | chat | gpt → kimi-k2.6 |

### 8. 测试渠道

验证已添加渠道的连通性：

- 发送 "Reply with exactly: pong" 测试提示
- 验证模型响应中包含 "pong"
- 显示响应延迟（毫秒）
- 支持按协议类型（chat/messages/responses/gemini）分组测试

### 9. 升级 CCX

检查并升级 CCX 到最新版本。

### 10. 修复连接地址

自动检测并修复 base URL 连接问题（主要针对 Windows 用户）：

1. 检测 `127.0.0.1` 是否可达
2. 如果不可达，扫描本机网络接口
3. 找到可用地址后，自动更新以下配置：
   - Claude Code `settings.json` 中的 `ANTHROPIC_BASE_URL`
   - Codex `config.toml` 中的 base_url
   - Gemini CLI `.env` 中的 `GOOGLE_GEMINI_BASE_URL`

## 配置说明

### CCX 配置文件

CCX 配置保存在 `~/.ccx/.env`：

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `PROXY_ACCESS_KEY` | CCX 访问密钥 | `sk-ccx-kit` |
| `PORT` | 服务端口 | `3688` |
| `ENABLE_WEB_UI` | 是否启用 Web UI | `true` |

### 渠道配置文件

渠道配置保存在 `~/.ccx/.config/config.json`，按协议类型分组：

```json
{
  "upstream": [...],
  "chatUpstream": [...],
  "responsesUpstream": [...],
  "geminiUpstream": [...],
  "fuzzyModeEnabled": true
}
```

### Fuzzy Mode（模糊模式）

启用 `fuzzyModeEnabled` 后，CCX 会自动将请求中的模型名通过模型映射转换为实际模型名。例如 Codex 请求 `gpt-5.5` 时，CCX 会自动映射为 `deepseek-v4-pro`。

## 常见问题

### Q: 提示"CCX 未配置"怎么办？

A: 需要先运行选项 1（初始化 CCX）完成配置。

### Q: Web UI 无法访问？

A:
1. 确保已启动 UI（选项 2）
2. 检查端口 3688 是否被占用
3. 使用访问密钥 `sk-ccx-kit` 登录（或查看 `~/.ccx/.env` 中的 `PROXY_ACCESS_KEY`）

### Q: Windows 下 127.0.0.1 无法连接？

A: 使用选项 10（修复连接地址），CCX 会自动扫描网络接口并更新配置。

### Q: 如何为不同工具添加渠道？

A: 使用选项 7（添加预设渠道），选择提供商后会列出所有协议变体：
- 选择 `(Codex)` 变体用于 Codex
- 选择 `(Claude Code)` 变体用于 Claude Code
- 选择 `(Gemini CLI)` 变体用于 Gemini CLI

### Q: 渠道测试失败？

A:
1. 确认 CCX 服务已启动（选项 3 检查状态）
2. 确认 API Key 正确
3. 检查网络连接是否正常
4. 查看测试错误信息中的 HTTP 状态码

## 了解更多

- [Codex 支持](codex.md) - 了解 Codex 与 CCX 的集成
- [Claude Code 配置](claude-code.md) - 了解 Claude Code 与 CCX 的集成
