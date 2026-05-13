---
title: CCX Proxy Management
---

# CCX Proxy Management

CCX is a high-performance API proxy that routes requests from code tools (Claude Code, Codex, Gemini CLI) to upstream AI providers. It supports multiple protocols, built-in preset channels, model name mapping, and a Web UI for management.

## What is CCX

CCX acts as a local proxy server between your code tools and upstream AI providers. Instead of configuring each tool individually with provider-specific settings, you point all tools at CCX and manage upstream channels centrally.

## Core Features

### Multi-Protocol Support

CCX handles four distinct API protocols, each corresponding to a different code tool:

| Protocol | Endpoint | Target Tool |
|----------|----------|-------------|
| `messages` | `/v1/messages` | Claude Code (Anthropic protocol) |
| `responses` | `/v1/responses` | Codex (OpenAI Responses API) |
| `gemini` | `/v1beta/models/{model}:generateContent` | Gemini CLI |
| `chat` | `/v1/chat/completions` | OpenAI-compatible tools |

Each protocol has its own upstream channel pool, allowing different providers per tool.

### Model Mapping

CCX maps generic model names used by code tools to actual upstream model names. This means you don't need to reconfigure your tools when switching providers.

**Claude Code model mapping** (messages protocol):
- `sonnet` → upstream model (e.g., `deepseek-v4-pro`)
- `haiku` → upstream model (e.g., `deepseek-v4-flash`)
- `opus` → upstream model (e.g., `deepseek-v4-pro`)

**Codex model mapping** (responses protocol):
- `gpt` → upstream model
- `mini` → upstream model

**Gemini CLI model mapping** (gemini protocol):
- `pro` → upstream model
- `flash` → upstream model

### Fuzzy Mode

When `fuzzyModeEnabled` is set in the CCX config, model name routing becomes flexible. CCX will match partial model names to configured upstream models, so tools can request any model name and CCX will route it to the appropriate upstream.

### Built-in Preset Channels

CCX ships with preset configurations for popular providers:

| Provider | Protocols Available | Description |
|----------|-------------------|-------------|
| **DeepSeek** | messages, responses, gemini | High-performance reasoning models |
| **MiMo (Xiaomi)** | messages, responses | Multi-region cluster support |
| **SiliconFlow** | chat | Aggregated open-source models |
| **OpenRouter** | chat | Unified multi-provider access |
| **Zhipu GLM** | messages, responses | GLM series models |
| **Kimi Code** | messages, responses | Subscription-based coding model |
| **Kimi Open Platform** | chat | Pay-per-use Kimi models |

Each provider may offer multiple variants targeting different protocols. For example, DeepSeek provides:
- `DeepSeek (Codex)` — responses protocol with `normalizeNonstandardChatRoles: true`
- `DeepSeek (Claude Code)` — messages protocol via `/anthropic` endpoint
- `DeepSeek (Gemini CLI)` — gemini protocol for @google/gemini-cli

### Channel Testing

CCX includes built-in channel connectivity testing. The test sends a prompt ("Reply with exactly: pong") to the selected channel and validates that the response contains "pong". Test results include latency measurement.

### Connectivity Auto-Fix (Windows)

Menu option 10 provides automatic connectivity repair for Windows users where `127.0.0.1` loopback may not work. It uses `os.networkInterfaces()` to discover local IPv4 addresses, tests each for CCX reachability, and updates the base URLs in Claude Code, Codex, and Gemini CLI configurations to use a working IP.

## Usage Guide

### Accessing the CCX Menu

```bash
# Open CCX management menu directly
npx ccx-kit ccx

# Or through the main menu
npx ccx-kit
# Then select R. CCX Management
```

### Menu Options

The CCX menu provides 10 options:

```
══════════════════════════════════════════════════════
  CCX Management Menu
══════════════════════════════════════════════════════

  1. Initialize CCX      - Install and configure CCX
  2. Open Web UI         - Open CCX Web management interface
  3. Check Status        - View current service status
  4. Restart Service     - Restart CCX service
  5. Start Service       - Start CCX service
  6. Stop Service        - Stop CCX service
  7. Add Preset Channel  - Add a preset upstream channel
  8. Test Channel        - Test channel connectivity
  9. Upgrade CCX         - Check and upgrade CCX binary
  10. Fix Connectivity   - Fix base URL for Windows users
  0. Return to Main Menu
```

### Adding a Preset Channel

```bash
npx ccx-kit ccx
# Select 7. Add Preset Channel
# Choose provider (e.g., DeepSeek)
# Choose variant (e.g., DeepSeek (Codex) for responses protocol)
# Enter API key
# Channel is auto-tested after creation
```

### Testing a Channel

```bash
npx ccx-kit ccx
# Select 8. Test Channel
# Choose from available channels grouped by protocol
# Enter model name (or accept default)
# View test result with latency
```

## Configuration

### CCX Environment File

CCX stores its configuration in `~/.ccx/.env`:

```env
PROXY_ACCESS_KEY=sk-ccx-kit
PORT=3688
ENABLE_WEB_UI=true
```

| Field | Default | Description |
|-------|---------|-------------|
| `PROXY_ACCESS_KEY` | `sk-ccx-kit` | Access key for authenticating with the proxy |
| `PORT` | `3688` | Port the proxy listens on |
| `ENABLE_WEB_UI` | `true` | Enable the built-in Web management UI |

### Channel Configuration

Upstream channels are stored in `~/.ccx/.config/config.json`:

```json
{
  "upstream": [],
  "chatUpstream": [],
  "responsesUpstream": [],
  "geminiUpstream": [],
  "fuzzyModeEnabled": true
}
```

Each upstream entry contains:

| Field | Description |
|-------|-------------|
| `baseUrl` | Provider API base URL |
| `apiKeys` | Array of API keys (supports multi-key rotation) |
| `serviceType` | Protocol type (`claude`, `openai`) |
| `name` | Channel display name |
| `modelMapping` | Maps tool model names to upstream model names |
| `normalizeNonstandardChatRoles` | Required for some providers (e.g., DeepSeek with Codex) |

### How Tools Connect to CCX

**Claude Code** (`settings.json`):
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:3688",
    "ANTHROPIC_AUTH_TOKEN": "sk-ccx-kit"
  }
}
```

**Codex** (`~/.codex/config.toml`):
```toml
[api]
base_url = "http://127.0.0.1:3688/v1"
wire_api = "responses"

[auth]
api_key = "sk-ccx-kit"
requires_openai_auth = false
```

**Gemini CLI** (environment):
```
GOOGLE_GEMINI_BASE_URL=http://127.0.0.1:3688
```

## Common Questions

### Q: What is the difference between CCX and CCR?

CCX is the successor to CCR (Claude Code Router). While CCR only supported the messages protocol for Claude Code, CCX supports four protocols (messages, responses, gemini, chat) and works with Claude Code, Codex, and Gemini CLI simultaneously.

### Q: How does CCX handle model names it doesn't recognize?

With `fuzzyModeEnabled: true`, CCX performs fuzzy matching on model names. If a tool requests a model name that doesn't exactly match a configured mapping, CCX will attempt to route it to the most appropriate upstream based on partial matching.

### Q: Can I use multiple providers at the same time?

Yes. Each protocol (messages, responses, gemini, chat) has its own upstream pool. You can configure different providers for different protocols, or multiple channels within the same protocol for failover.

### Q: The proxy is running but my tool can't connect?

Use menu option 10 (Fix Connectivity) to diagnose and fix connection issues. This is especially common on Windows where `127.0.0.1` may not resolve correctly. The fix scans local network interfaces and updates tool configurations with a reachable IP.

### Q: How do I access the Web UI?

After starting CCX (menu option 1 or 5), access the Web UI at `http://127.0.0.1:3688`. Use the access key (`sk-ccx-kit` by default) to authenticate.

## Related Documentation

- [Codex Support](codex.md) - CCX proxy configuration for Codex
- [Claude Code Configuration](claude-code.md) - Claude Code integration with CCX
- [CCX CLI Commands](../cli/ccr.md) - Detailed CLI command reference
