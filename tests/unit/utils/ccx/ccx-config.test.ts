import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as ccxConfig from '../../../../src/utils/ccx/config'

vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  copyFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}))
vi.mock('../../../../src/utils/json-config')
vi.mock('../../../../src/utils/claude-config')
vi.mock('../../../../src/utils/config')
vi.mock('../../../../src/i18n', () => ({
  ensureI18nInitialized: vi.fn(),
  i18n: {
    t: vi.fn((key: string, opts?: any) => {
      const translations: Record<string, string> = {
        'ccx:statusSummary.notConfigured': 'not configured',
        'ccx:settingsDiff.title': 'Settings changes:',
        'ccx:settingsDiff.confirm': 'Apply changes?',
        'ccx:settingsDiff.skipped': 'Skipped',
        'ccx:settingsDiff.willBeRemoved': '(will be removed)',
        'ccx:accessKeyPrompt.title': `Current key: ${opts?.key || ''}`,
        'ccx:accessKeyPrompt.keepExisting': 'Keep existing key',
        'ccx:accessKeyPrompt.setNew': 'Set new key',
        'ccx:accessKeyPrompt.enterNewKey': 'Enter new key:',
        'ccx:existingCcxConfig': 'Found existing config',
        'ccx:overwriteCcxConfig': 'Overwrite?',
        'ccx:keepingExistingConfig': 'Keeping existing',
        'ccx:ccxConfigSuccess': 'Config saved',
        'ccx:proxyConfigSuccess': 'Proxy configured',
        'ccx:apiKeyApprovalSuccess': 'API key approval OK',
        'ccx:apiKeyApprovalFailed': 'API key approval failed',
        'mcp:primaryApiKeySetFailed': 'Primary API key set failed',
        'common:cancelled': 'Cancelled',
      }
      return translations[key] || key
    }),
  },
}))
vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}))
vi.mock('../../../../src/utils/toggle-prompt', () => ({
  promptBoolean: vi.fn(),
}))

const { formatMaskedKey, configureCcxProxy } = ccxConfig

describe('formatMaskedKey', () => {
  it('should mask a normal key showing first 5 and last 2 chars', () => {
    expect(formatMaskedKey('sk-ccx-kit-default')).toBe('sk-cc****lt')
  })

  it('should return **** for keys shorter than 8 chars', () => {
    expect(formatMaskedKey('short')).toBe('****')
    expect(formatMaskedKey('abc')).toBe('****')
  })

  it('should return **** for empty string', () => {
    expect(formatMaskedKey('')).toBe('****')
  })

  it('should mask exactly 8-char key', () => {
    expect(formatMaskedKey('12345678')).toBe('12345****78')
  })
})

describe('configureCcxProxy diff/confirm', () => {
  let readJsonConfig: any
  let writeJsonConfig: any
  let promptBoolean: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const jsonConfig = await import('../../../../src/utils/json-config')
    readJsonConfig = vi.mocked(jsonConfig.readJsonConfig)
    writeJsonConfig = vi.mocked(jsonConfig.writeJsonConfig)
    const togglePrompt = await import('../../../../src/utils/toggle-prompt')
    promptBoolean = vi.mocked(togglePrompt.promptBoolean)
  })

  it('should show diff and proceed when user confirms', async () => {
    readJsonConfig.mockReturnValue({
      env: {
        ANTHROPIC_BASE_URL: 'http://old:1111',
        ANTHROPIC_API_KEY: 'sk-old-key-value',
      },
    })
    promptBoolean.mockResolvedValue(true)

    await configureCcxProxy({ PROXY_ACCESS_KEY: 'sk-new-key-value', PORT: 3688, ENABLE_WEB_UI: true })

    expect(promptBoolean).toHaveBeenCalled()
    expect(writeJsonConfig).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        env: expect.objectContaining({
          ANTHROPIC_BASE_URL: 'http://127.0.0.1:3688',
          ANTHROPIC_API_KEY: 'sk-new-key-value',
        }),
      }),
    )
  })

  it('should skip write when user rejects diff', async () => {
    readJsonConfig.mockReturnValue({
      env: {
        ANTHROPIC_BASE_URL: 'http://old:1111',
        ANTHROPIC_API_KEY: 'sk-old-key-value',
      },
    })
    promptBoolean.mockResolvedValue(false)

    await configureCcxProxy({ PROXY_ACCESS_KEY: 'sk-new-key-value', PORT: 3688, ENABLE_WEB_UI: true })

    expect(writeJsonConfig).not.toHaveBeenCalled()
  })

  it('should skip diff when skipConfirm is true', async () => {
    readJsonConfig.mockReturnValue({
      env: {
        ANTHROPIC_BASE_URL: 'http://old:1111',
        ANTHROPIC_API_KEY: 'sk-old-key-value',
      },
    })

    await configureCcxProxy(
      { PROXY_ACCESS_KEY: 'sk-new-key-value', PORT: 3688, ENABLE_WEB_UI: true },
      { skipConfirm: true },
    )

    expect(promptBoolean).not.toHaveBeenCalled()
    expect(writeJsonConfig).toHaveBeenCalled()
  })

  it('should not prompt when values are identical', async () => {
    readJsonConfig.mockReturnValue({
      env: {
        ANTHROPIC_BASE_URL: 'http://127.0.0.1:3688',
        ANTHROPIC_API_KEY: 'sk-same-key-value',
      },
    })

    await configureCcxProxy({ PROXY_ACCESS_KEY: 'sk-same-key-value', PORT: 3688, ENABLE_WEB_UI: true })

    expect(promptBoolean).not.toHaveBeenCalled()
    expect(writeJsonConfig).toHaveBeenCalled()
  })

  it('should detect ANTHROPIC_AUTH_TOKEN removal in diff', async () => {
    readJsonConfig.mockReturnValue({
      env: {
        ANTHROPIC_AUTH_TOKEN: 'sk-auth-token-old',
        ANTHROPIC_BASE_URL: 'http://127.0.0.1:3688',
        ANTHROPIC_API_KEY: 'sk-same-key-value',
      },
    })
    promptBoolean.mockResolvedValue(true)

    await configureCcxProxy({ PROXY_ACCESS_KEY: 'sk-same-key-value', PORT: 3688, ENABLE_WEB_UI: true })

    expect(promptBoolean).toHaveBeenCalled()
    expect(writeJsonConfig).toHaveBeenCalled()
  })
})
