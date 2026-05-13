import inquirer from 'inquirer'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}))

vi.mock('../../../../src/i18n', () => ({
  ensureI18nInitialized: vi.fn(),
  i18n: {
    t: vi.fn((key: string, opts?: Record<string, string>) => {
      if (!opts)
        return key
      return Object.keys(opts).reduce((text, optKey) => text.replace(`{${optKey}}`, opts[optKey]), key)
    }),
  },
}))

vi.mock('../../../../src/utils/ccx/installer', () => ({
  installCcx: vi.fn(),
  isCcxInstalled: vi.fn().mockResolvedValue({ isInstalled: true, binaryPath: '/mock/ccx', version: '1.0.0' }),
}))

vi.mock('../../../../src/utils/ccx/commands', () => ({
  getCcxStatus: vi.fn().mockResolvedValue({ running: true, port: 3688, pid: 1234, webUiUrl: 'http://localhost:3688' }),
  openCcxWebUi: vi.fn(),
  restartCcxService: vi.fn(),
  startCcxService: vi.fn(),
  stopCcxService: vi.fn(),
}))

vi.mock('../../../../src/utils/ccx/config', () => ({
  configureCcxFeature: vi.fn(),
  DEFAULT_CCX_PORT: 3688,
  formatMaskedKey: vi.fn(() => 'sk-pr****ey'),
  readCcxEnv: vi.fn().mockReturnValue({ PROXY_ACCESS_KEY: 'sk-proxy-key', PORT: 3688, ENABLE_WEB_UI: true }),
}))

const mockListChannels = vi.fn()
vi.mock('../../../../src/utils/ccx/channel-manager', () => ({
  addPresetChannel: vi.fn(),
  listChannels: mockListChannels,
}))

const mockTestChannel = vi.fn()
vi.mock('../../../../src/utils/ccx/channel-test', () => ({
  testChannel: mockTestChannel,
}))

vi.mock('../../../../src/utils/ccx/presets', () => ({
  getAllPresets: vi.fn(() => []),
}))

vi.mock('../../../../src/utils/ccx/upgrade', () => ({
  checkAndUpgradeCcx: vi.fn(),
}))

vi.mock('../../../../src/utils/error-handler', () => ({
  handleExitPromptError: vi.fn(() => true),
  handleGeneralError: vi.fn(),
}))

vi.mock('../../../../src/utils/toggle-prompt', () => ({
  promptBoolean: vi.fn().mockResolvedValue(false),
}))

describe('showCcxMenu channel test flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListChannels.mockImplementation(async (kind: string) => {
      if (kind === 'messages') {
        return [
          {
            name: 'MiMo upstream',
            baseUrl: 'https://example.com/anthropic',
            apiKeys: ['sk-upstream-key'],
            supportedModels: ['mimo-model'],
          },
        ]
      }
      return []
    })
    mockTestChannel.mockResolvedValue({ success: true, latency: 12 })
  })

  it('should test selected channel kind with proxy access key instead of upstream key', async () => {
    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ choice: '8' })
      .mockResolvedValueOnce({ selected: { kind: 'messages', index: 0 } })
      .mockResolvedValueOnce({ model: 'mimo-model' })

    const { showCcxMenu } = await import('../../../../src/utils/tools/ccx-menu')

    await showCcxMenu()

    expect(mockListChannels).toHaveBeenCalledWith('chat')
    expect(mockListChannels).toHaveBeenCalledWith('messages')
    expect(mockTestChannel).toHaveBeenCalledWith('messages', 3688, 'sk-proxy-key', 'mimo-model')
    expect(mockTestChannel).not.toHaveBeenCalledWith('messages', 3688, 'sk-upstream-key', 'mimo-model')
  })
})
