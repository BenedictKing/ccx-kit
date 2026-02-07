import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkAndUpdateTools, execWithSudoIfNeeded, updateCcx, updateClaudeCode, updateCometixLine } from '../../../src/utils/auto-updater'
import { promptBoolean } from '../../../src/utils/toggle-prompt'
import { checkCcxVersion, checkClaudeCodeVersion, checkCometixLineVersion } from '../../../src/utils/version-checker'

// Mock tinyexec
const execMock = vi.hoisted(() => vi.fn())

vi.mock('tinyexec', () => ({
  exec: execMock,
}))

// Mock platform module for sudo detection
const shouldUseSudoMock = vi.hoisted(() => vi.fn(() => false))

vi.mock('../../../src/utils/platform', () => ({
  shouldUseSudoForGlobalInstall: shouldUseSudoMock,
}))

// Mock ccx installer
const installCcxMock = vi.hoisted(() => vi.fn())

vi.mock('../../../src/utils/ccx/installer', () => ({
  installCcx: installCcxMock,
}))

vi.mock('ansis', () => ({
  default: {
    yellow: vi.fn((text: string) => text),
    green: vi.fn((text: string) => text),
    cyan: vi.fn((text: string) => text),
    gray: vi.fn((text: string) => text),
    red: vi.fn((text: string) => text),
    bold: {
      cyan: vi.fn((text: string) => text),
    },
  },
}))

const oraMock = vi.hoisted(() => vi.fn(() => ({
  start: vi.fn().mockReturnThis(),
  stop: vi.fn(),
  succeed: vi.fn(),
  fail: vi.fn(),
})))

vi.mock('ora', () => ({
  default: oraMock,
}))

vi.mock('../../../src/i18n', () => ({
  ensureI18nInitialized: vi.fn(),
  format: vi.fn((template: string, params: Record<string, string>) => {
    return template.replace(/\{(\w+)\}/g, (_, key) => params[key] || `{${key}}`)
  }),
  i18n: {
    t: vi.fn((key: string) => key),
  },
}))

vi.mock('../../../src/utils/version-checker', () => ({
  checkCcxVersion: vi.fn(),
  checkClaudeCodeVersion: vi.fn(),
  checkCometixLineVersion: vi.fn(),
  handleDuplicateInstallations: vi.fn().mockResolvedValue({
    hadDuplicates: false,
    resolved: true,
    action: 'no-duplicates',
  }),
}))

vi.mock('../../../src/utils/toggle-prompt', () => ({
  promptBoolean: vi.fn(),
}))

// Mock console methods
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

interface MockSpinner {
  start: any
  stop: any
  succeed: any
  fail: any
}

interface TestMocks {
  exec: any
  oraSpinner: MockSpinner
  checkCcxVersion: any
  checkClaudeCodeVersion: any
  checkCometixLineVersion: any
  shouldUseSudo: any
  installCcx: any
}

let testMocks: TestMocks

describe('auto-updater', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockConsoleLog.mockClear()
    mockConsoleError.mockClear()

    // Setup mocks
    const mockSpinner: MockSpinner = {
      start: vi.fn().mockReturnThis(),
      stop: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
    }

    execMock.mockReset()
    shouldUseSudoMock.mockReset()
    shouldUseSudoMock.mockReturnValue(false)
    installCcxMock.mockReset()
    installCcxMock.mockResolvedValue(undefined)

    // Setup ora mock to return our controlled spinner
    oraMock.mockReturnValue(mockSpinner)

    testMocks = {
      exec: execMock,
      oraSpinner: mockSpinner,
      checkCcxVersion: (checkCcxVersion as any),
      checkClaudeCodeVersion: (checkClaudeCodeVersion as any),
      checkCometixLineVersion: (checkCometixLineVersion as any),
      shouldUseSudo: shouldUseSudoMock,
      installCcx: installCcxMock,
    }
  })

  describe('updateCcx', () => {
    it('should return false when CCX is not installed', async () => {
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: false,
        currentVersion: null,
        latestVersion: '1.0.0',
        needsUpdate: false,
      })

      const result = await updateCcx()

      expect(result).toBe(false)
      expect(testMocks.oraSpinner.stop).toHaveBeenCalled()
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:ccxNotInstalled'),
      )
    })

    it('should return true when CCX is up to date and force is false', async () => {
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })

      const result = await updateCcx(false)

      expect(result).toBe(true)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:ccxUpToDate'),
      )
    })

    it('should return false when cannot check latest version', async () => {
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: null,
        needsUpdate: true,
      })

      const result = await updateCcx()

      expect(result).toBe(false)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:cannotCheckVersion'),
      )
    })

    it('should return true when user declines update', async () => {
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      vi.mocked(promptBoolean).mockResolvedValueOnce(false)

      const result = await updateCcx()

      expect(result).toBe(true)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:updateSkipped'),
      )
    })

    it('should successfully prompt for CCX update when user confirms', async () => {
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      vi.mocked(promptBoolean).mockResolvedValueOnce(true)

      const result = await updateCcx()

      expect(result).toBe(true)
      expect(promptBoolean).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('confirmUpdate'),
      }))
      expect(testMocks.installCcx).toHaveBeenCalled()
    })

    it('should update CCX automatically when skipPrompt is enabled', async () => {
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })

      const result = await updateCcx(false, true)

      expect(result).toBe(true)
      expect(testMocks.installCcx).toHaveBeenCalled()
    })

    it('should handle update execution errors gracefully', async () => {
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      vi.mocked(promptBoolean).mockResolvedValueOnce(true)
      testMocks.installCcx.mockRejectedValue(new Error('Update failed'))

      // The function should handle errors gracefully
      const result = await updateCcx()

      expect(result).toBe(false)
      expect(testMocks.oraSpinner.fail).toHaveBeenCalled()
    })

    it('should handle version check errors', async () => {
      testMocks.checkCcxVersion.mockRejectedValue(new Error('Version check failed'))

      const result = await updateCcx()

      expect(result).toBe(false)
      expect(testMocks.oraSpinner.fail).toHaveBeenCalledWith('updater:checkFailed')
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Version check failed'),
      )
    })

    it('should force update even when up to date', async () => {
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })
      vi.mocked(promptBoolean).mockResolvedValueOnce(true)

      const result = await updateCcx(true)

      expect(result).toBe(true)
      // Should prompt for confirmation
      expect(promptBoolean).toHaveBeenCalled()
    })

    it('should skip prompt when skipPrompt is true', async () => {
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })

      const result = await updateCcx(false, true)

      expect(result).toBe(true)
      // Should NOT prompt for confirmation
      expect(promptBoolean).not.toHaveBeenCalled()
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:autoUpdating'),
      )
    })

    it('should call installCcx regardless of sudo setting', async () => {
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      testMocks.shouldUseSudo.mockReturnValue(true)

      const result = await updateCcx(false, true)

      expect(result).toBe(true)
      expect(testMocks.installCcx).toHaveBeenCalled()
    })

    it('should fail when installCcx throws an error', async () => {
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      testMocks.installCcx.mockRejectedValue(new Error('Permission denied'))

      const result = await updateCcx(false, true)

      expect(result).toBe(false)
      expect(testMocks.oraSpinner.fail).toHaveBeenCalled()
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Permission denied'),
      )
    })
  })

  describe('updateClaudeCode', () => {
    it('should return false when Claude Code is not installed', async () => {
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: false,
        currentVersion: null,
        latestVersion: '1.0.0',
        needsUpdate: false,
      })

      const result = await updateClaudeCode()

      expect(result).toBe(false)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:claudeCodeNotInstalled'),
      )
    })

    it('should return true when Claude Code is up to date', async () => {
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })

      const result = await updateClaudeCode()

      expect(result).toBe(true)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:claudeCodeUpToDate'),
      )
    })

    it('should initiate Claude Code update flow', async () => {
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
        isHomebrew: false,
      })
      vi.mocked(promptBoolean).mockResolvedValueOnce(true)
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

      const result = await updateClaudeCode()

      expect(result).toBe(true)
      expect(promptBoolean).toHaveBeenCalled()
      expect(testMocks.exec).toHaveBeenCalledWith('claude', ['update'])
    })

    it('should handle Claude Code update errors gracefully', async () => {
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
        isHomebrew: false,
      })
      vi.mocked(promptBoolean).mockResolvedValueOnce(true)
      testMocks.exec.mockRejectedValue(new Error('Update failed'))

      const result = await updateClaudeCode()

      expect(result).toBe(false)
      expect(testMocks.oraSpinner.fail).toHaveBeenCalled()
    })

    it('should skip prompt in skip-prompt mode for Claude Code', async () => {
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
        isHomebrew: false,
      })
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

      const result = await updateClaudeCode(false, true)

      expect(result).toBe(true)
      // Should NOT prompt for confirmation in skip mode
      expect(promptBoolean).not.toHaveBeenCalled()
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:autoUpdating'),
      )
    })

    it('should use sudo for Claude Code update when needed on Linux', async () => {
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
        isHomebrew: false,
      })
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
      testMocks.shouldUseSudo.mockReturnValue(true)

      const result = await updateClaudeCode(false, true)

      expect(result).toBe(true)
      expect(testMocks.exec).toHaveBeenCalledWith('sudo', ['claude', 'update'])
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:usingSudo'),
      )
    })

    it('should fail when Claude Code update exits with non-zero code', async () => {
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
        isHomebrew: false,
      })
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: 'Network error', exitCode: 1 })

      const result = await updateClaudeCode(false, true)

      expect(result).toBe(false)
      expect(testMocks.oraSpinner.fail).toHaveBeenCalled()
    })
  })

  describe('updateCometixLine', () => {
    it('should return false when CometixLine is not installed', async () => {
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: false,
        currentVersion: null,
        latestVersion: '1.0.0',
        needsUpdate: false,
      })

      const result = await updateCometixLine()

      expect(result).toBe(false)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:cometixLineNotInstalled'),
      )
    })

    it('should return true when CometixLine is up to date', async () => {
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })

      const result = await updateCometixLine()

      expect(result).toBe(true)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:cometixLineUpToDate'),
      )
    })

    it('should initiate CometixLine update flow', async () => {
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      vi.mocked(promptBoolean).mockResolvedValueOnce(true)
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

      const result = await updateCometixLine()

      expect(result).toBe(true)
      expect(promptBoolean).toHaveBeenCalled()
      expect(testMocks.exec).toHaveBeenCalledWith('npm', ['update', '-g', '@cometix/ccline'])
    })

    it('should skip prompt in skip-prompt mode for CometixLine', async () => {
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

      const result = await updateCometixLine(false, true)

      expect(result).toBe(true)
      // Should NOT prompt for confirmation in skip mode
      expect(promptBoolean).not.toHaveBeenCalled()
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:autoUpdating'),
      )
    })

    it('should use sudo for CometixLine update when needed on Linux', async () => {
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
      testMocks.shouldUseSudo.mockReturnValue(true)

      const result = await updateCometixLine(false, true)

      expect(result).toBe(true)
      expect(testMocks.exec).toHaveBeenCalledWith('sudo', ['npm', 'update', '-g', '@cometix/ccline'])
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:usingSudo'),
      )
    })

    it('should fail when CometixLine update exits with non-zero code', async () => {
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: 'Registry timeout', exitCode: 1 })

      const result = await updateCometixLine(false, true)

      expect(result).toBe(false)
      expect(testMocks.oraSpinner.fail).toHaveBeenCalled()
    })
  })

  describe('checkAndUpdateTools', () => {
    it('should check and update all tools in interactive mode', async () => {
      // Mock all tools to have updates
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
        isHomebrew: false,
      })
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      vi.mocked(promptBoolean).mockResolvedValue(true)
      testMocks.exec.mockRejectedValue(new Error('Execution mock error'))

      // Should not throw error and handle all tools
      await checkAndUpdateTools(false)

      // Should call all three version check functions
      expect(testMocks.checkCcxVersion).toHaveBeenCalled()
      expect(testMocks.checkClaudeCodeVersion).toHaveBeenCalled()
      expect(testMocks.checkCometixLineVersion).toHaveBeenCalled()
    })

    it('should check and update all tools in skip-prompt mode', async () => {
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
        isHomebrew: false,
      })
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      testMocks.exec.mockRejectedValue(new Error('Execution mock error'))

      await checkAndUpdateTools(true)

      // Should NOT prompt for any confirmations in skip mode
      expect(promptBoolean).not.toHaveBeenCalled()
      // Should show checking tools header
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:checkingTools'),
      )
    })

    it('should handle individual tool failures and continue with others', async () => {
      // Mock first tool to fail, others to succeed
      testMocks.checkCcxVersion.mockRejectedValue(new Error('CCX check failed'))
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })

      // Should not throw, should handle errors gracefully
      await checkAndUpdateTools(true)

      // Should have called all version checks despite CCX failure
      expect(testMocks.checkCcxVersion).toHaveBeenCalled()
      expect(testMocks.checkClaudeCodeVersion).toHaveBeenCalled()
      expect(testMocks.checkCometixLineVersion).toHaveBeenCalled()

      // Should show error for failed tool
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('CCX check failed'),
      )
    })

    it('should show update summary with successful tools', async () => {
      // All tools up to date (success)
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })

      await checkAndUpdateTools(true)

      // Should show update summary in skip-prompt mode
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:updateSummary'),
      )
      // Should show success for each tool
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:success'),
      )
    })

    it('should show update summary with failed tools', async () => {
      // CCX fails, others succeed
      testMocks.checkCcxVersion.mockRejectedValue(new Error('CCX check failed'))
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })

      await checkAndUpdateTools(true)

      // Should show update summary
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:updateSummary'),
      )
      // Should show failed status for CCX
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:failed'),
      )
    })

    it('should not show update summary in interactive mode', async () => {
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })

      await checkAndUpdateTools(false)

      // Should NOT show update summary in interactive mode
      const summaryLogCalled = mockConsoleLog.mock.calls.some(
        call => call[0] && call[0].includes('updater:updateSummary'),
      )
      expect(summaryLogCalled).toBe(false)
    })

    it('should warn when duplicate installation detection fails', async () => {
      const versionCheckerModule = await import('../../../src/utils/version-checker')
      vi.mocked(versionCheckerModule.handleDuplicateInstallations).mockRejectedValueOnce(new Error('duplicate failure'))

      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        needsUpdate: false,
      })

      await checkAndUpdateTools(false)

      expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('Duplicate installation check failed'))
    })
  })

  describe('error handling edge cases', () => {
    it('should handle non-Error objects in catch blocks', async () => {
      testMocks.checkCcxVersion.mockRejectedValue('String error')

      const result = await updateCcx()

      expect(result).toBe(false)
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('String error'),
      )
    })

    it('should handle null/undefined errors gracefully', async () => {
      testMocks.checkCcxVersion.mockRejectedValue(null)

      const result = await updateCcx()

      expect(result).toBe(false)
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('null'),
      )
    })
  })

  describe('updateClaudeCode - additional branches', () => {
    it('should return false when cannot check latest version', async () => {
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: null,
        needsUpdate: true,
        isHomebrew: false,
      })

      const result = await updateClaudeCode()

      expect(result).toBe(false)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:cannotCheckVersion'),
      )
    })

    it('should return true when user declines update', async () => {
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
        isHomebrew: false,
      })
      vi.mocked(promptBoolean).mockResolvedValueOnce(false)

      const result = await updateClaudeCode()

      expect(result).toBe(true)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:updateSkipped'),
      )
    })

    it('should handle version check failure', async () => {
      testMocks.checkClaudeCodeVersion.mockRejectedValue(new Error('Version check failed'))

      const result = await updateClaudeCode()

      expect(result).toBe(false)
      expect(testMocks.oraSpinner.fail).toHaveBeenCalledWith('updater:checkFailed')
    })

    it('should use brew upgrade for Homebrew installations', async () => {
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
        isHomebrew: true,
      })
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

      const result = await updateClaudeCode(false, true)

      expect(result).toBe(true)
      expect(testMocks.exec).toHaveBeenCalledWith('brew', ['upgrade', '--cask', 'claude-code'])
    })

    it('should run claude update for npm installations', async () => {
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
        isHomebrew: false,
      })
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

      const result = await updateClaudeCode(false, true)

      expect(result).toBe(true)
      expect(testMocks.exec).toHaveBeenCalledWith('claude', ['update'])
    })

    it('should not use sudo for Homebrew installations even when shouldUseSudo is true', async () => {
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
        isHomebrew: true,
      })
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
      testMocks.shouldUseSudo.mockReturnValue(true)

      const result = await updateClaudeCode(false, true)

      expect(result).toBe(true)
      // Should use brew without sudo
      expect(testMocks.exec).toHaveBeenCalledWith('brew', ['upgrade', '--cask', 'claude-code'])
    })

    it('should fail when Homebrew upgrade exits with non-zero code', async () => {
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
        isHomebrew: true,
      })
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: 'Homebrew error', exitCode: 1 })

      const result = await updateClaudeCode(false, true)

      expect(result).toBe(false)
      expect(testMocks.oraSpinner.fail).toHaveBeenCalled()
    })
  })

  describe('updateCometixLine - additional branches', () => {
    it('should return true when user declines update', async () => {
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      vi.mocked(promptBoolean).mockResolvedValueOnce(false)

      const result = await updateCometixLine()

      expect(result).toBe(true)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:updateSkipped'),
      )
    })

    it('should return false when cannot check latest version', async () => {
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: null,
        needsUpdate: true,
      })

      const result = await updateCometixLine()

      expect(result).toBe(false)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('updater:cannotCheckVersion'),
      )
    })

    it('should handle version check failure', async () => {
      testMocks.checkCometixLineVersion.mockRejectedValue(new Error('Version check failed'))

      const result = await updateCometixLine()

      expect(result).toBe(false)
      expect(testMocks.oraSpinner.fail).toHaveBeenCalledWith('updater:checkFailed')
    })

    it('should perform CometixLine update automatically when skipPrompt is true', async () => {
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

      const result = await updateCometixLine(false, true)

      expect(result).toBe(true)
      expect(testMocks.exec).toHaveBeenCalledWith('npm', ['update', '-g', '@cometix/ccline'])
    })

    it('should handle update failure for CometixLine', async () => {
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      vi.mocked(promptBoolean).mockResolvedValueOnce(true)
      testMocks.exec.mockRejectedValue(new Error('Update failed'))

      const result = await updateCometixLine()

      expect(result).toBe(false)
      expect(testMocks.oraSpinner.fail).toHaveBeenCalled()
    })
  })

  describe('sudo support for Linux non-root users', () => {
    it('should use sudo for all tools when shouldUseSudoForGlobalInstall returns true', async () => {
      testMocks.shouldUseSudo.mockReturnValue(true)
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

      // Test CCX update - uses installCcx(), not exec/sudo
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      await updateCcx(false, true)
      expect(testMocks.installCcx).toHaveBeenCalled()

      testMocks.installCcx.mockClear()
      testMocks.exec.mockClear()

      // Test Claude Code update with sudo
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
        isHomebrew: false,
      })
      await updateClaudeCode(false, true)
      expect(testMocks.exec).toHaveBeenCalledWith('sudo', ['claude', 'update'])

      testMocks.exec.mockClear()

      // Test CometixLine update with sudo
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      await updateCometixLine(false, true)
      expect(testMocks.exec).toHaveBeenCalledWith('sudo', ['npm', 'update', '-g', '@cometix/ccline'])
    })

    it('should not use sudo when shouldUseSudoForGlobalInstall returns false', async () => {
      testMocks.shouldUseSudo.mockReturnValue(false)
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

      // Test CCX update without sudo - uses installCcx(), not exec
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      await updateCcx(false, true)
      expect(testMocks.installCcx).toHaveBeenCalled()

      testMocks.installCcx.mockClear()
      testMocks.exec.mockClear()

      // Test Claude Code update without sudo
      testMocks.checkClaudeCodeVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
        isHomebrew: false,
      })
      await updateClaudeCode(false, true)
      expect(testMocks.exec).toHaveBeenCalledWith('claude', ['update'])

      testMocks.exec.mockClear()

      // Test CometixLine update without sudo
      testMocks.checkCometixLineVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })
      await updateCometixLine(false, true)
      expect(testMocks.exec).toHaveBeenCalledWith('npm', ['update', '-g', '@cometix/ccline'])
    })

    it('should call installCcx for CCX update even when sudo is configured', async () => {
      testMocks.shouldUseSudo.mockReturnValue(true)
      testMocks.checkCcxVersion.mockResolvedValue({
        installed: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        needsUpdate: true,
      })

      await updateCcx(false, true)

      expect(testMocks.installCcx).toHaveBeenCalled()
    })
  })

  describe('execWithSudoIfNeeded helper function', () => {
    it('should execute command without sudo when not needed', async () => {
      testMocks.shouldUseSudo.mockReturnValue(false)
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

      const result = await execWithSudoIfNeeded('npm', ['update', '-g', 'test-package'])

      expect(result.usedSudo).toBe(false)
      expect(testMocks.exec).toHaveBeenCalledWith('npm', ['update', '-g', 'test-package'])
    })

    it('should execute command with sudo when needed', async () => {
      testMocks.shouldUseSudo.mockReturnValue(true)
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

      const result = await execWithSudoIfNeeded('npm', ['update', '-g', 'test-package'])

      expect(result.usedSudo).toBe(true)
      expect(testMocks.exec).toHaveBeenCalledWith('sudo', ['npm', 'update', '-g', 'test-package'])
    })

    it('should throw error when command exits with non-zero code', async () => {
      testMocks.shouldUseSudo.mockReturnValue(false)
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: 'Permission denied', exitCode: 1 })

      await expect(execWithSudoIfNeeded('npm', ['update', '-g', 'test-package']))
        .rejects
        .toThrow('Permission denied')
    })

    it('should throw error with default message when stderr is empty', async () => {
      testMocks.shouldUseSudo.mockReturnValue(false)
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: '', exitCode: 127 })

      await expect(execWithSudoIfNeeded('npm', ['update', '-g', 'test-package']))
        .rejects
        .toThrow('Command failed with exit code 127')
    })

    it('should throw error when sudo command exits with non-zero code', async () => {
      testMocks.shouldUseSudo.mockReturnValue(true)
      testMocks.exec.mockResolvedValue({ stdout: '', stderr: 'sudo: password required', exitCode: 1 })

      await expect(execWithSudoIfNeeded('npm', ['update', '-g', 'test-package']))
        .rejects
        .toThrow('sudo: password required')
    })
  })
})
