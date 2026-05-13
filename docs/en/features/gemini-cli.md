---
title: Gemini CLI Support
---

# Gemini CLI Support

[Gemini CLI](https://www.npmjs.com/package/@google/gemini-cli) is Google's official code generation CLI tool. ZCF supports Gemini CLI integration with automated installation, API configuration, and CCX proxy setup.

## Core Features

- **Automated Installation**: Detect and install `@google/gemini-cli` via npm or Homebrew
- **CCX Proxy Integration**: Route Gemini CLI requests through CCX for centralized provider management
- **Custom API Configuration**: Direct connection to Google's Gemini API or third-party providers
- **Version Management**: One-click upgrade with automatic detection of installation method

## Installation

### Auto Detection and Installation

ZCF automatically detects whether Gemini CLI is installed:

```bash
# Initialize Gemini CLI
npx ccx-kit
# Select G (Switch to Gemini CLI)
# Select 1 (Complete Initialization)
```

If not detected, ZCF installs via npm:
```bash
npm install -g @google/gemini-cli
```

On macOS, ZCF also detects Homebrew installations and uses `brew upgrade` for updates.

## API Configuration

### CCX Proxy (Recommended)

The recommended approach routes Gemini CLI through the CCX proxy, which handles upstream provider routing via the `gemini` protocol.

Configuration is stored in `~/.gemini/.env`:

```env
GEMINI_API_KEY=sk-ccx-kit
GEMINI_MODEL=gemini-3-pro-preview
GOOGLE_GEMINI_BASE_URL=http://127.0.0.1:3688
```

Key points:
- **`GOOGLE_GEMINI_BASE_URL`** points to the CCX proxy (no path suffix needed)
- **`GEMINI_API_KEY`** uses the CCX proxy access key
- CCX routes requests using the gemini protocol endpoint (`/v1beta/models/{model}:generateContent`)

### Custom API

For direct connection to Google or third-party providers:

```bash
npx ccx-kit
# Select G (Switch to Gemini CLI)
# Select API Configuration
# Choose "Custom API"
# Enter API key, base URL, and model
```

## CCX Channel Presets for Gemini CLI

When adding preset channels in CCX, select the Gemini CLI variant:

| Provider | Variant | Model Mapping |
|----------|---------|---------------|
| DeepSeek | DeepSeek (Gemini CLI) | `pro` → `deepseek-v4-pro`, `flash` → `deepseek-v4-flash` |

```bash
npx ccx-kit ccx
# Select 7. Add Preset Channel
# Choose DeepSeek
# Choose "DeepSeek (Gemini CLI)" variant
# Enter API key
```

## Upgrade

```bash
# Through update check
npx ccx-kit check-updates --code-type gemini-cli

# Or through menu
npx ccx-kit → Select G → Select upgrade option
```

ZCF detects the installation method (npm or Homebrew) and uses the appropriate upgrade command.

## Related Documentation

- [CCX Proxy Management](ccr.md) - Centralized proxy configuration
- [Codex Support](codex.md) - Codex integration with CCX
- [Claude Code Configuration](claude-code.md) - Claude Code setup
