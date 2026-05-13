---
title: CCX Proxy Management
---

# CCX Proxy Management

`npx ccx-kit ccx` provides a complete management menu for CCX (the API proxy for Claude Code, Codex, and Gemini CLI), including installation, configuration, service control, channel management, and connectivity repair.

## Command Format

```bash
# Open CCX management menu
npx ccx-kit ccx

# Or access through main menu
npx ccx-kit
# Then select R. CCX Management
```

## Menu Options

Running `npx ccx-kit ccx` will display the following menu:

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
npx ccx-kit ccx
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
npx ccx-kit ccx
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
npx ccx-kit ccx
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
npx ccx-kit ccx
# Select 4
```

### 5. Start Service

**Function**: Start CCX service

**Use Cases**:
- Need to restart after service stopped
- Start service after system restart

**Example**:
```bash
npx ccx-kit ccx
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
npx ccx-kit ccx
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
npx ccx-kit ccx
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
npx ccx-kit ccx
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
npx ccx-kit ccx
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
npx ccx-kit ccx
# Select 10
# Auto-detects working IP and updates configurations
```

## Configuration Files

### CCX Environment (`~/.ccx/.env`)

```env
PROXY_ACCESS_KEY=sk-ccx-kit
PORT=3688
ENABLE_WEB_UI=true
```

| Field | Default | Description |
|-------|---------|-------------|
| `PROXY_ACCESS_KEY` | `sk-ccx-kit` | Access key for proxy authentication |
| `PORT` | `3688` | Service listen port |
| `ENABLE_WEB_UI` | `true` | Enable Web management interface |

### Channel Configuration (`~/.ccx/.config/config.json`)

Channels are organized by protocol:

```json
{
  "upstream": [
    {
      "baseUrl": "https://api.deepseek.com/anthropic",
      "apiKeys": ["sk-xxx"],
      "serviceType": "claude",
      "name": "DeepSeek (Claude Code)",
      "modelMapping": {
        "sonnet": "deepseek-v4-pro",
        "haiku": "deepseek-v4-flash"
      }
    }
  ],
  "responsesUpstream": [
    {
      "baseUrl": "https://api.deepseek.com",
      "apiKeys": ["sk-xxx"],
      "serviceType": "openai",
      "name": "DeepSeek (Codex)",
      "modelMapping": {
        "gpt": "deepseek-v4-pro",
        "mini": "deepseek-v4-flash"
      },
      "normalizeNonstandardChatRoles": true
    }
  ],
  "geminiUpstream": [
    {
      "baseUrl": "https://api.deepseek.com",
      "apiKeys": ["sk-xxx"],
      "serviceType": "openai",
      "name": "DeepSeek (Gemini CLI)",
      "modelMapping": {
        "pro": "deepseek-v4-pro",
        "flash": "deepseek-v4-flash"
      }
    }
  ],
  "chatUpstream": [],
  "fuzzyModeEnabled": true
}
```

### Channel Fields

| Field | Type | Description |
|-------|------|-------------|
| `baseUrl` | string | Provider API base URL |
| `apiKeys` | string[] | API keys (supports multi-key rotation) |
| `serviceType` | string | Protocol type (`claude` or `openai`) |
| `name` | string | Channel display name |
| `modelMapping` | object | Maps tool model names to upstream model names |
| `normalizeNonstandardChatRoles` | boolean | Normalize non-standard chat roles (needed for DeepSeek + Codex) |

## Common Questions

### Q: What to do if prompted "CCX not configured"?

Run Option 1 (Initialize CCX) first to complete configuration.

### Q: Web UI cannot be accessed?

1. Ensure CCX service is running (Option 3 to check status)
2. Check if port 3688 is occupied: `lsof -i :3688` (macOS/Linux) or `netstat -ano | findstr :3688` (Windows)
3. Use access key `sk-ccx-kit` to authenticate (or check `PROXY_ACCESS_KEY` in `~/.ccx/.env`)

### Q: Service failed to start?

1. Check if port is occupied
2. Verify the CCX binary is properly installed (Option 9 to upgrade/reinstall)
3. Check PID file: `cat ~/.ccx/ccx.pid`
4. View process: `lsof -i :3688 | grep LISTEN`

### Q: How to add channels for multiple tools?

Add preset channels (Option 7) multiple times, selecting different variants each time:
- For Claude Code: select the `(Claude Code)` or `(Anthropic)` variant
- For Codex: select the `(Codex)` variant
- For Gemini CLI: select the `(Gemini CLI)` variant

### Q: Channel test fails with unexpected response?

The test sends "Reply with exactly: pong" and expects "pong" in the response. If the upstream model doesn't follow this instruction, the test reports failure even though the channel may be functional. Try a different model or verify the model mapping is correct.

### Q: Windows connectivity issues?

Use Option 10 (Fix Connectivity). This is a common issue on Windows where `127.0.0.1` loopback doesn't work. The fix discovers a working local IP and updates all tool configurations.

## Related Documentation

- [CCX Feature Overview](../features/ccr.md) - Learn about CCX architecture and capabilities
- [Codex CCX Integration](../features/codex.md#ccx-proxy-integration) - Codex-specific CCX setup
- [Gemini CLI Support](../features/gemini-cli.md) - Gemini CLI integration
- [Troubleshooting](../advanced/troubleshooting.md) - Solve common problems
