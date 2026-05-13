---
title: CCX Proxy Management
---

# CCX Proxy Management

`npx ccx-kit ccr` provides a complete management menu for CCX (the API proxy for Claude Code, Codex, and Gemini CLI), including installation, configuration, service control, channel management, and connectivity repair.

## Command Format

```bash
# Open CCX management menu
npx ccx-kit ccr

# Or access through main menu
npx ccx-kit
# Then select R. CCX Management
```

## Menu Options

Running `npx ccx-kit ccr` will display the following menu:

```
══════════════════════════════════════════════════════
  CCX Management Menu
══════════════════════════════════════════════════════

  1. Initialize CCX       - Install and configure CCX
  2. Open Web UI          - Open CCX Web management interface
  3. Check Status         - View current service status
  4. Restart Service      - Restart CCX service
  5. Start Service        - Start CCX service
  6. Stop Service         - Stop CCX service
  7. Add Preset Channel   - Add a preset upstream channel
  8. Test Channel         - Test channel connectivity
  9. Upgrade CCX          - Check and upgrade CCX binary
  10. Fix Connectivity    - Fix base URL for Windows users
  0. Return to Main Menu
```

## Function Details

### 1. Initialize CCX

**Function**: First-time CCX setup or reconfigure CCX

**Process**:
1. Automatically detect if CCX binary is installed
2. If not installed, download and install the CCX binary from GitHub Releases
3. Create or update CCX configuration (`~/.ccx/.env`)
4. Configure Claude Code to use CCX proxy (update `settings.json`)
5. Start CCX service
6. Verify connectivity and fix base URL if needed
7. Backup existing configuration (if exists)

**Use Cases**:
- First-time use of CCX
- Need to reconfigure after changes
- Configuration lost and needs reset

**Example**:
```bash
npx ccx-kit ccr
# Select 1
# Complete configuration according to prompts
```

### 2. Open Web UI

**Function**: Open CCX Web management interface in browser

**Access Address**: `http://127.0.0.1:3688` (default port)

**Web UI Features**:
- Channel management (add, edit, delete upstream channels)
- Service status monitoring
- Configuration management

**Prerequisites**:
- Must complete CCX initialization first (Option 1)
- CCX service must be running

**Access Key**:
- Default access key: `sk-ccx-kit`
- Use this key to authenticate with the Web UI

**Example**:
```bash
npx ccx-kit ccr
# Select 2
# Browser opens to http://127.0.0.1:3688
```

### 3. Check Status

**Function**: View CCX service current running status

**Displayed Information**:
- Whether service is running
- Running port
- Process ID (PID)
- Web UI URL

**Use Cases**:
- Verify service started normally
- Troubleshoot connection issues
- View current configuration status

**Example**:
```bash
npx ccx-kit ccr
# Select 3
```

### 4. Restart Service

**Function**: Restart CCX service, reload configuration

**Use Cases**:
- Need to reload after modifying channel configuration
- Service abnormal and needs restart
- Need to restart after port conflict

**Example**:
```bash
npx ccx-kit ccr
# Select 4
```

### 5. Start Service

**Function**: Start CCX service

**Use Cases**:
- Need to restart after service stopped
- Start service after system restart

**Example**:
```bash
npx ccx-kit ccr
# Select 5
```

### 6. Stop Service

**Function**: Stop currently running CCX service

**Use Cases**:
- Need to pause CCX proxy
- Need to stop service for debugging
- Stop service before changing configuration

**Example**:
```bash
npx ccx-kit ccr
# Select 6
```

### 7. Add Preset Channel

**Function**: Add a pre-configured upstream channel from built-in presets

**Available Presets**:
- **DeepSeek** — with variants for Codex (responses), Claude Code (messages), and Gemini CLI (gemini)
- **MiMo (Xiaomi)** — with variants for multiple regions and protocols
- **SiliconFlow** — chat protocol, aggregated open-source models
- **OpenRouter** — chat protocol, unified multi-provider access
- **Zhipu GLM** — with variants for Codex and Claude Code
- **Kimi Code** — with variants for Codex and Claude Code
- **Kimi Open Platform** — chat protocol, pay-per-use

**Process**:
1. Select provider from preset list
2. If provider has variants, select the appropriate variant for your tool
3. Enter API key
4. Channel is automatically added and tested

**Example**:
```bash
npx ccx-kit ccr
# Select 7
# Choose DeepSeek
# Choose "DeepSeek (Codex)" for responses protocol
# Enter API key
# Auto-test runs to verify connectivity
```

### 8. Test Channel

**Function**: Test an existing channel's connectivity and response

**Process**:
1. Lists all configured channels grouped by protocol (chat, messages, responses, gemini)
2. Select a channel to test
3. Enter or confirm model name
4. Sends test prompt: "Reply with exactly: pong"
5. Validates response contains "pong" and reports latency

**Use Cases**:
- Verify a newly added channel works
- Diagnose connectivity issues
- Check response latency

**Example**:
```bash
npx ccx-kit ccr
# Select 8
# Choose channel from list
# Confirm model name
# View test result
```

### 9. Upgrade CCX

**Function**: Check for and install CCX binary updates

**Process**:
1. Check current installed version
2. Query latest version from GitHub Releases (with fallback sources)
3. If update available, download and install new binary
4. Restart service if it was running

**Example**:
```bash
npx ccx-kit ccr
# Select 9
```

### 10. Fix Connectivity

**Function**: Fix base URL connectivity issues, primarily for Windows users

**Problem**: On some Windows systems, `127.0.0.1` loopback doesn't work correctly, preventing tools from connecting to the local CCX proxy.

**Process**:
1. Test connectivity to `127.0.0.1` on the CCX port
2. If loopback fails, scan local network interfaces using `os.networkInterfaces()`
3. Test each discovered IPv4 address for CCX reachability
4. If multiple addresses work, prompt user to select one
5. Update base URLs in all tool configurations:
   - Claude Code: `ANTHROPIC_BASE_URL` in `settings.json`
   - Codex: `base_url` in `config.toml` (with `/v1` suffix)
   - Gemini CLI: `GOOGLE_GEMINI_BASE_URL` in `.env`

**Example**:
```bash
npx ccx-kit ccr
# Select 10
# Auto-detects working IP and updates configurations
```

## Route Rule Configuration

CCR supports flexible route rule configuration, which can be set through Web UI or configuration file. The configuration file is located at `~/.claude-code-router/config.json` and uses JSON format.

### Complete Configuration Example

```json
{
  "LOG": true,
  "HOST": "127.0.0.1",
  "PORT": 3456,
  "APIKEY": "sk-zcf-x-ccr",
  "API_TIMEOUT_MS": "600000",
  "PROXY_URL": "",
  "Providers": [
    {
      "name": "openrouter",
      "api_base_url": "https://openrouter.ai/api/v1/chat/completions",
      "api_key": "sk-xxx",
      "models": [
        "google/gemini-2.5-pro-preview",
        "anthropic/claude-sonnet-4",
        "anthropic/claude-3.5-sonnet"
      ],
      "transformer": {
        "use": ["openrouter"]
      }
    },
    {
      "name": "deepseek",
      "api_base_url": "https://api.deepseek.com/v1/chat/completions",
      "api_key": "sk-xxx",
      "models": ["deepseek-chat", "deepseek-reasoner"],
      "transformer": {
        "use": ["deepseek"],
        "deepseek-chat": {
          "use": ["tooluse"]
        }
      }
    },
    {
      "name": "ollama",
      "api_base_url": "http://localhost:11434/v1/chat/completions",
      "api_key": "ollama",
      "models": ["qwen2.5-coder:latest"],
      "transformer": {
        "use": ["ollama"]
      }
    },
    {
      "name": "gemini",
      "api_base_url": "https://generativelanguage.googleapis.com/v1beta/models/",
      "api_key": "sk-xxx",
      "models": ["gemini-2.5-flash", "gemini-2.5-pro"],
      "transformer": {
        "use": ["gemini"]
      }
    }
  ],
  "Router": {
    "default": "openrouter,google/gemini-2.5-pro-preview",
    "background": "deepseek,deepseek-chat",
    "think": "deepseek,deepseek-reasoner",
    "longContext": "openrouter,anthropic/claude-sonnet-4",
    "longContextThreshold": 60000,
    "webSearch": "gemini,gemini-2.5-flash"
  }
}
```

### Configuration Field Descriptions

#### Basic Configuration

| Field | Type | Description | Default |
|------|------|------|--------|
| `LOG` | boolean | Enable logging | `true` |
| `HOST` | string | Service listen address | `127.0.0.1` |
| `PORT` | number | Service port | `3456` |
| `APIKEY` | string | CCR API key | `sk-zcf-x-ccr` |
| `API_TIMEOUT_MS` | string | API timeout (milliseconds) | `600000` |
| `PROXY_URL` | string | Proxy URL (optional) | `""` |

#### Providers Configuration

`Providers` is an array, each Provider contains:

| Field | Type | Description |
|------|------|------|
| `name` | string | Provider name (used for route rules) |
| `api_base_url` | string | API base URL |
| `api_key` | string | API key (free models can use `sk-free`) |
| `models` | string[] | List of models supported by this provider |
| `transformer` | object | Optional request transformer (for API compatibility) |

#### Router Configuration

`Router` defines model routing rules for different scenarios, format: `${providerName},${modelName}`

| Field | Type | Description |
|------|------|------|
| `default` | string | Default route (format: `provider,model`) |
| `background` | string | Background task route (optional) |
| `think` | string | Thinking task route (optional) |
| `longContext` | string | Long context task route (optional) |
| `longContextThreshold` | number | Long context token threshold (optional) |
| `webSearch` | string | Web search task route (optional) |

## Provider Presets

ZCF supports multiple CCR provider presets to simplify configuration:

```bash
npx zcf ccr
# Select 1. Initialize CCR
# Select provider preset
```

Supported presets include:
- **302.AI**: Enterprise-grade AI service
- **GLM**: Zhipu AI
- **MiniMax**: MiniMax AI service
- **Custom**: Configure custom provider

## Common Questions

### Q: What to do if prompted "CCR not configured"?

A: Need to run Option 1 (Initialize CCR) first to complete configuration.

### Q: Web UI cannot be accessed?

A: 
1. Ensure UI is started (Option 2)
2. Check if port 3456 is occupied
3. Use API key `sk-zcf-x-ccr` to log in (or check `APIKEY` in configuration)

### Q: How to modify route rules?

A: You can modify through Web UI or directly edit `~/.claude-code-router/config.json` file, then restart service after modification.

### Q: Service failed to start?

A: 
1. Check if configuration file format is correct
2. Check if port is occupied: `lsof -i :3456` (macOS/Linux) or `netstat -ano | findstr :3456` (Windows)
3. Confirm `@musistudio/claude-code-router` is correctly installed
4. View error logs or use `ccr status` command

### Q: How to configure multiple models?

A: Add multiple provider configurations in the `Providers` array, then specify models for different scenarios in `Router`.

## Related Documentation

- [CCR Feature Overview](../features/ccr.md) - Learn about CCR's core benefits
- [Troubleshooting](../advanced/troubleshooting.md) - Solve common problems
