---
title: Codex Support
---

# Codex Support

[Codex](https://www.npmjs.com/package/@openai/codex) is OpenAI's official code generation CLI tool. ZCF now supports complete Codex integration with the same configuration convenience as Claude Code.

## Core Features

ZCF provides a complete automated configuration experience for Codex, with core features including:

- **Unified Tool Management**: Seamlessly switch between Claude Code and Codex through ZCF menu
- **Smart Configuration System**: Automatic Codex CLI installation, API provider setup, and MCP service integration
- **Complete Backup Mechanism**: All configuration changes include timestamped backups with restore functionality
- **Multi-Provider Support**: Configure multiple API providers (OpenAI, custom endpoints) with easy switching
- **System Prompt Integration**: Install professional AI personalities (engineer, nekomata engineer, laowang engineer)
- **Workflow Templates**: Import structured development workflows optimized for code generation tasks
- **Advanced Uninstaller**: Selectively remove Codex components with conflict resolution support

## Installation and Upgrade

### Auto Detection and Installation

ZCF automatically detects whether `@openai/codex` CLI is installed on the system:

```bash
# Initialize Codex (auto-detect and install)
npx zcf i -s -T codex -p 302ai -k "sk-xxx"
```

If Codex is not detected, ZCF will automatically execute:
```bash
npm install -g @openai/codex
```

### Upgrade Codex

ZCF supports one-click Codex CLI upgrade:

```bash
# Upgrade through update check
npx zcf check-updates --code-type codex

# Or through menu
npx zcf → Select + (Check Updates) → Select Codex
```

> ✅ **Automatic Processing**: If upgrade fails, ZCF will provide detailed error information to help diagnose issues.

## Configuration File Management

### Directory Structure

ZCF creates the following directory structure for Codex:

```
~/.codex/
├── config.toml          # Codex main configuration file (TOML format)
├── auth.json            # Authentication information
├── AGENTS.md            # AI agent configuration and system prompts
├── prompts/             # Workflow prompt directory
│   ├── zcf/
│   │   ├── workflow.md  # Six-stage workflow
│   │   └── ...
│   └── ...
└── backup/              # Configuration backup directory
    └── YYYY-MM-DD_HH-mm-ss/
```

### Backup Mechanism

ZCF provides a complete backup mechanism:

- **Automatic Backup**: Automatically creates timestamped backups on each configuration modification
- **Backup Location**: `~/.codex/backup/YYYY-MM-DD_HH-mm-ss/`
- **Backup Content**: Includes all configuration files, authentication, workflows, prompts
- **Selective Backup**: Supports backing up only specific items (config, auth, API, MCP, etc.)

> 💡 **Restore Configuration**: If you need to restore previous configuration, you can restore corresponding files from the backup directory.

### Management Mode Identifier

ZCF adds `managed = true` identifier in configuration files to ensure:

- Automatically determine if configuration is managed by ZCF
- Avoid overwriting handwritten configurations
- Intelligently merge ZCF-managed configurations and user custom configurations

## API Providers and Models

### API Configuration Methods

Codex supports the same API configuration methods as Claude Code:

#### 1. Provider Preset (Recommended)

```bash
# Use 302.AI provider
npx zcf i -s -T codex -p 302ai -k "sk-xxx"

# Use other providers
npx zcf i -s -T codex -p glm -k "sk-xxx"
npx zcf i -s -T codex -p minimax -k "sk-xxx"
```

#### 2. Official Login

```bash
npx zcf
# Select S (Switch to Codex)
# Select 3 (Configure API)
# Select "Use Official Login"
```

#### 3. Custom API

```bash
npx zcf i -s -T codex \
  --api-type api_key \
  --api-key "sk-xxx" \
  --api-url "https://api.example.com" \
  --api-model "gpt-5"
```

### Multi-Provider Configuration

Codex supports configuring multiple API providers:

```bash
npx zcf i -s -T codex --api-configs '[
  {"provider":"302ai","key":"sk-xxx","default":true},
  {"name":"custom","type":"api_key","key":"sk-yyy","url":"https://custom.api.com","primaryModel":"gpt-5"}
]'
```

> 📖 **Switch Provider**: Use `npx zcf config-switch -T codex` to switch between multiple providers.

### Model Configuration

Codex supports configuring primary and fast models:

```bash
npx zcf i -s -T codex -p 302ai -k "sk-xxx" \
  --api-model "gpt-5" \
  --api-fast-model "gpt-4"
```

## CCX Proxy Integration

Codex can connect to upstream AI providers through the CCX proxy. This is the recommended approach when you want centralized channel management across multiple code tools.

### How It Works

Codex communicates with CCX using the `responses` wire API (OpenAI Responses protocol). CCX receives requests at `/v1/responses` and forwards them to the configured upstream provider with model name mapping.

### Configuration

When using CCX proxy, Codex's `~/.codex/config.toml` is configured as follows:

```toml
[api]
base_url = "http://127.0.0.1:3688/v1"
wire_api = "responses"

[auth]
api_key = "sk-ccx-kit"
requires_openai_auth = false
```

Key points:
- **`base_url`** must include the `/v1` suffix (CCX serves the responses endpoint at `/v1/responses`)
- **`api_key`** uses `OPENAI_API_KEY` format — set to the CCX proxy access key
- **`requires_openai_auth = false`** disables OpenAI's native authentication since CCX handles auth with upstream providers
- **`wire_api = "responses"`** tells Codex to use the OpenAI Responses API protocol

### Model Name Routing

CCX uses fuzzy mode to route model names from Codex to upstream models. When Codex sends a request with model name `gpt` or `mini`, CCX maps it to the actual upstream model based on the channel's `modelMapping` configuration.

For example, with a DeepSeek channel configured:
- `gpt` → `deepseek-v4-pro`
- `mini` → `deepseek-v4-flash`

### DeepSeek-Specific Note

When using DeepSeek as the upstream provider for Codex, the channel requires `normalizeNonstandardChatRoles: true` in its configuration. This is automatically set when adding the DeepSeek (Codex) preset channel through the CCX menu.

### Setup via CCX Menu

```bash
npx ccx-kit ccr
# Select 7. Add Preset Channel
# Choose DeepSeek (or other provider)
# Choose the (Codex) variant — uses responses protocol
# Enter API key
```

CCX will automatically configure Codex's `config.toml` to point at the proxy during initialization.

> 💡 **Tip**: Use `npx ccx-kit ccr` → option 8 to test the channel after setup. Select the responses protocol channel and verify you get a successful response.

## MCP Service Integration

### Supported MCP Services

Codex supports the same MCP services as Claude Code:

| Service | Description | Requires API Key |
|------|------|-----------------|
| Context7 | Document query | ❌ |
| Open Web Search | Web search | ❌ |
| Spec Workflow | Workflow management | ❌ |
| DeepWiki | GitHub documentation | ❌ |
| Playwright | Browser control | ❌ |
| Exa | Exa search | ✅ |
| Serena | Semantic code search | ❌ |

### Configure MCP Services

```bash
# Install all MCP services
npx zcf i -s -T codex --mcp-services all

# Selective installation
npx zcf i -s -T codex --mcp-services context7,open-websearch

# Configure through menu
npx zcf → Select S (Switch to Codex) → Select 4 (Configure MCP)
```

### Configuration File Location

MCP service configuration is saved in the `[mcp_server]` entries of `~/.codex/config.toml`.

## Workflow System

Codex currently supports the following workflow templates (using `/prompts:` prefix):

| Workflow | Codex Command | Claude Code Command | Description |
|--------|-----------|-----------------|------|
| **Six-Stage Workflow** | `/prompts:workflow` | `/zcf:workflow` | Complete six-stage development process (Research→Ideation→Planning→Execution→Optimization→Review) |
| **Git Workflow** | `/prompts:git-commit` | `/git-commit` | Smart Git commit |
| | `/prompts:git-rollback` | `/git-rollback` | Safe rollback |
| | `/prompts:git-cleanBranches` | `/git-cleanBranches` | Clean merged branches |
| | `/prompts:git-worktree` | `/git-worktree` | Git worktree management |

> 💡 **Tip**:
> - Codex uses `/prompts:` prefix to access workflow commands, which is Codex's command format specification
> - Codex currently only supports six-stage workflow and Git workflows. Feature development workflow (feat), project initialization (init-project), and BMad workflow are not yet available in Codex

### Differences from Claude Code

Although Codex and Claude Code share the same MCP services, there are differences in workflow support:

| Workflow Type | Claude Code | Codex |
|-----------|------------|-------|
| Six-Stage Workflow | ✅ `/zcf:workflow` | ✅ `/prompts:workflow` |
| Feature Development Workflow | ✅ `/zcf:feat` | ❌ Not yet supported |
| Project Initialization | ✅ `/init-project` | ❌ Not yet supported |
| Git Workflow | ✅ `/git-commit` etc. | ✅ `/prompts:git-commit` etc. |
| BMad Workflow | ✅ `/bmad-init` | ❌ Not yet supported |

### Import Workflows

```bash
# Install all workflows
npx zcf i -s -T codex --workflows all

# Selective installation
npx zcf i -s -T codex --workflows commonTools,sixStepsWorkflow

# Import through menu
npx zcf → Select S (Switch to Codex) → Select 4 (Import Workflows)
```

Workflow files are saved in the `~/.codex/prompts/` directory.

## System Prompts and Output Styles

### System Prompt Configuration

Codex system prompts are saved in `~/.codex/AGENTS.md`, including:

- AI output language settings
- Global output style configuration
- Custom instructions and rules

### Output Styles

Codex supports the same output styles as Claude Code:

- `engineer-professional` - Professional Engineer
- `nekomata-engineer` - Nekomata Engineer
- `laowang-engineer` - Laowang Aggressive Tech Flow
- `ojousama-engineer` - Ojousama Engineer

```bash
# Install output styles
npx zcf i -s -T codex --output-styles engineer-professional

# Set default output style
npx zcf i -s -T codex --default-output-style engineer-professional
```

## Tool Switching

### Switch Through Menu

```bash
npx zcf
# Enter S to switch between Claude Code and Codex
```

After switching, menu options will dynamically adjust based on current tool:

- **In Codex mode**:
  - `3` is API and MCP configuration
  - `4` is workflow import

### Tool Migration

ZCF allows seamless switching between Claude Code and Codex while preserving your preference settings and workflow configurations:

- **Shared Configuration**: Both tools share the same MCP services and workflow templates
- **Independent Configuration**: API configuration and system prompts are managed independently
- **Consistent Experience**: Ensures consistent development experience across both tools

> 💡 **Best Practices**:
> - On first use, it's recommended to complete configuration in Claude Code first
> - Then switch to Codex, configurations will automatically sync MCP and workflows
> - Both tools can be used simultaneously without interference

## Common Operations

### Initialize Codex

```bash
# Command line method
npx zcf i -s -T codex -p 302ai -k "sk-xxx"

# Interactive method
npx zcf → Select S (Switch to Codex) → Select 1 (Complete Initialization)
```

### Update Workflows

```bash
npx zcf update -T codex -g zh-CN
```

### Configuration Switch

```bash
# List all providers
npx zcf config-switch -T codex --list

# Switch to specified provider
npx zcf config-switch -T codex provider-name
```

### Uninstall Codex

```bash
npx zcf uninstall -T codex
```

## Comparison with Claude Code

| Feature | Claude Code | Codex |
|------|------------|-------|
| **Configuration File Format** | JSON (`settings.json`) | TOML (`config.toml`) |
| **System Prompt File** | `CLAUDE.md` | `AGENTS.md` |
| **Workflow Directory** | `workflows/` | `prompts/` |
| **API Configuration** | Supports three modes | Supports three modes |
| **MCP Services** | ✅ Fully supported | ✅ Fully supported |
| **Output Styles** | ✅ Supported | ✅ Supported |
| **Workflow Templates** | ✅ Supported | ✅ Supported |

> 💡 **Note**: Although configuration file formats differ, ZCF provides a unified configuration interface, ensuring consistent user experience across both tools.

## Next Steps

Learn more about Codex related features:

- 📚 [Workflow Details](../workflows/) - Learn about workflows available in Codex
- 🔧 [Configuration Management](../advanced/configuration.md) - Deep dive into Codex configuration management
- 🎯 [MCP Service Integration](mcp.md) - Detailed information about MCP service usage in Codex


