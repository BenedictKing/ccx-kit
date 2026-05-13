---
title: CCX 代理管理
---

# CCX 代理管理

`npx ccx-kit ccx` 提供 CCX 代理的完整管理菜单，包括安装、配置、服务控制、渠道管理和连通性修复等功能。

## 命令格式

```bash
# 打开 CCX 管理菜单
npx ccx-kit ccx

# 或通过主菜单访问
npx ccx-kit
# 然后选择 R. CCX 管理
```

## 菜单选项

运行 `npx ccx-kit ccx` 后会显示以下菜单（共 10 项）：

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

**功能**：首次设置 CCX 或重新配置 CCX

**流程**：
1. 自动检测是否已安装 CCX
2. 如果未安装，自动下载安装
3. 创建配置文件 `~/.ccx/.env`（端口、访问密钥、Web UI 开关）
4. 自动配置 Claude Code 使用 CCX 代理（更新 `settings.json`）
5. 启动 CCX 服务
6. 自动检测连通性并修复 base URL（如需要）

**使用场景**：
- 首次使用 CCX
- 需要重新配置
- 配置丢失需要重新设置

**示例**：
```bash
npx ccx-kit ccx
# 选择 1
# 按提示完成配置
```

### 2. 启动 UI

**功能**：启动 CCX Web 管理界面

**访问地址**：`http://localhost:3688/ui`（默认端口）

**Web UI 功能**：
- 实时使用统计和成本分析
- 渠道管理（添加、编辑、删除）
- 模型映射配置
- 服务控制（启动、停止、重启）

**前置条件**：
- 必须先完成 CCX 初始化（选项 1）
- 配置文件 `~/.ccx/.env` 必须存在

**API 密钥**：
- 使用 CCX 访问密钥登录 Web UI（默认：`sk-ccx-kit`）

**示例**：
```bash
npx ccx-kit ccx
# 选择 2
# 等待服务启动后，访问 http://localhost:3688/ui
```

### 3. 检查状态

**功能**：查看 CCX 服务当前运行状态

**显示信息**：
- 服务是否运行
- 运行端口
- PID
- Web UI 地址

**示例**：
```bash
npx ccx-kit ccx
# 选择 3
```

### 4. 重启服务

**功能**：重启 CCX 服务，重新加载配置

**使用场景**：
- 修改配置文件后需要重新加载
- 服务异常需要重启
- 添加新渠道后重启生效

**示例**：
```bash
npx ccx-kit ccx
# 选择 4
```

### 5. 启动服务

**功能**：启动 CCX 服务

**使用场景**：
- 服务停止后需要重新启动
- 系统重启后启动服务

**示例**：
```bash
npx ccx-kit ccx
# 选择 5
```

### 6. 停止服务

**功能**：停止当前运行的 CCX 服务

**使用场景**：
- 需要暂停 CCX 代理
- 调试时需要停止服务
- 更换配置前先停止服务

**示例**：
```bash
npx ccx-kit ccx
# 选择 6
```

### 7. 添加预设渠道

**功能**：一键添加预配置的上游渠道，内置模型映射

**流程**：
1. 选择提供商（DeepSeek、MiMo、SiliconFlow、OpenRouter、智谱 GLM、Kimi Code、Kimi 开放平台）
2. 如果提供商有多个变体，选择协议变体：
   - `(Codex)` - Responses 协议，适用于 Codex
   - `(Claude Code)` - Anthropic Messages 协议，适用于 Claude Code
   - `(Gemini CLI)` - Gemini 协议，适用于 Gemini CLI
3. 输入 API Key
4. 自动添加渠道并测试连通性

**预设渠道列表**：

| 提供商 | 可用变体 | 模型映射 |
|--------|---------|---------|
| DeepSeek | Codex / Claude Code / Gemini CLI | gpt→deepseek-v4-pro, haiku→deepseek-v4-flash |
| MiMo (小米) | 余额 (Anthropic) / 订阅 Plan (多集群, Codex/Anthropic) | → mimo-v2.5-pro |
| SiliconFlow | chat (通用) | - |
| OpenRouter | chat (通用) | - |
| 智谱 GLM | Codex / Claude Code | gpt/haiku/opus/sonnet → glm-5.1 |
| Kimi Code | Codex / Claude Code | → kimi-for-coding |
| Kimi 开放平台 | chat (通用) | gpt → kimi-k2.6 |

**示例**：
```bash
npx ccx-kit ccx
# 选择 7
# 选择 DeepSeek
# 选择 DeepSeek (Codex) - Responses 协议
# 输入 API Key
# 自动测试连通性
```

### 8. 测试渠道

**功能**：验证已添加渠道的连通性

**测试方式**：
- 向渠道发送 "Reply with exactly: pong" 测试提示
- 验证模型响应中包含 "pong"
- 显示响应延迟（毫秒）

**支持的协议类型**：
- `chat` - OpenAI Chat Completions (`/v1/chat/completions`)
- `messages` - Anthropic Messages (`/v1/messages`)
- `responses` - OpenAI Responses (`/v1/responses`)
- `gemini` - Gemini (`/v1beta/models/{model}:generateContent`)

**示例**：
```bash
npx ccx-kit ccx
# 选择 8
# 选择要测试的渠道
# 确认测试模型
# 查看测试结果
```

### 9. 升级 CCX

**功能**：检查并升级 CCX 到最新版本

**示例**：
```bash
npx ccx-kit ccx
# 选择 9
```

### 10. 修复连接地址

**功能**：自动检测并修复 base URL 连接问题

**适用场景**：
- Windows 下 `127.0.0.1` 无法连接
- WSL 环境下需要使用宿主机 IP
- 网络配置变更后连接失败

**修复流程**：
1. 检测 `127.0.0.1:3688` 是否可达
2. 如果不可达，扫描本机所有 IPv4 网络接口
3. 测试每个地址的连通性
4. 找到可用地址后，自动更新以下配置：
   - Claude Code `settings.json` → `ANTHROPIC_BASE_URL`
   - Codex `config.toml` → `base_url`（带 `/v1` 后缀）
   - Gemini CLI `.env` → `GOOGLE_GEMINI_BASE_URL`

**示例**：
```bash
npx ccx-kit ccx
# 选择 10
# 自动检测并修复
```

## 配置文件

### CCX 环境配置 (`~/.ccx/.env`)

```bash
PROXY_ACCESS_KEY=sk-ccx-kit
PORT=3688
ENABLE_WEB_UI=true
```

| 字段 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `PROXY_ACCESS_KEY` | string | CCX 访问密钥 | `sk-ccx-kit` |
| `PORT` | number | 服务端口 | `3688` |
| `ENABLE_WEB_UI` | boolean | 是否启用 Web UI | `true` |

### 渠道配置 (`~/.ccx/.config/config.json`)

渠道按协议类型分组存储：

```json
{
  "upstream": [...],
  "chatUpstream": [...],
  "responsesUpstream": [...],
  "geminiUpstream": [...],
  "imagesUpstream": [...],
  "fuzzyModeEnabled": true,
  "stripBillingHeader": true
}
```

每个渠道包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 渠道名称 |
| `baseUrl` | string | 上游 API 地址 |
| `apiKeys` | string[] | API 密钥列表 |
| `serviceType` | string | 服务类型（openai/claude） |
| `modelMapping` | object | 模型映射规则 |
| `supportedModels` | string[] | 支持的模型列表 |

## 常见问题

### Q: 提示"CCX 未配置"怎么办？

A: 需要先运行选项 1（初始化 CCX）完成配置。

### Q: Web UI 无法访问？

A:
1. 确保已启动 UI（选项 2）
2. 检查端口 3688 是否被占用：`lsof -i :3688`（macOS/Linux）或 `netstat -ano | findstr :3688`（Windows）
3. 使用访问密钥 `sk-ccx-kit` 登录

### Q: Windows 下 127.0.0.1 无法连接？

A: 使用选项 10（修复连接地址），CCX 会自动扫描网络接口并更新所有工具的配置。

### Q: 渠道测试失败？

A:
1. 确认 CCX 服务已启动（选项 3 检查状态）
2. 确认 API Key 正确
3. 检查上游提供商是否可用
4. 查看错误信息中的 HTTP 状态码

### Q: 如何为不同工具添加渠道？

A: 使用选项 7（添加预设渠道），选择提供商后会列出所有协议变体。选择对应工具的变体即可。

### Q: Fuzzy Mode 是什么？

A: 启用 `fuzzyModeEnabled` 后，CCX 会自动将请求中的模型名通过模型映射转换为实际模型名。例如 Codex 请求 `gpt-5.5` 时，CCX 会自动映射为 `deepseek-v4-pro`。

## 相关文档

- [CCX 功能介绍](../features/ccr.md) - CCX 的核心优势和预设渠道详情
- [Codex 支持](../features/codex.md) - Codex 与 CCX 的集成
- [Gemini CLI 支持](../features/gemini-cli.md) - Gemini CLI 与 CCX 的集成
- [故障排除](../advanced/troubleshooting.md) - 解决常见问题
