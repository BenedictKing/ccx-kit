import type { CcxConfig } from '../../types/ccx'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import ansis from 'ansis'
import dayjs from 'dayjs'
import inquirer from 'inquirer'
import { join } from 'pathe'
import { SETTINGS_FILE } from '../../constants'
import { ensureI18nInitialized, i18n } from '../../i18n'
import { addCompletedOnboarding, setPrimaryApiKey } from '../claude-config'
import { backupExistingConfig } from '../config'
import { readJsonConfig, writeJsonConfig } from '../json-config'
import { promptBoolean } from '../toggle-prompt'

const CCX_CONFIG_DIR = join(homedir(), '.ccx')
const CCX_ENV_FILE = join(CCX_CONFIG_DIR, '.env')

/**
 * Mask an access key for display: show first 5 + **** + last 2
 */
export function formatMaskedKey(key: string): string {
  if (!key || key.length < 8)
    return '****'
  return `${key.slice(0, 5)}****${key.slice(-2)}`
}

/**
 * Ensure CCX config directory exists
 */
export function ensureCcxConfigDir(): void {
  if (!existsSync(CCX_CONFIG_DIR)) {
    mkdirSync(CCX_CONFIG_DIR, { recursive: true })
  }
}

/**
 * Create default CCX configuration
 */
export function createDefaultCcxConfig(): CcxConfig {
  return {
    PROXY_ACCESS_KEY: 'sk-ccx-kit',
    PORT: 3688,
    ENABLE_WEB_UI: true,
  }
}

/**
 * Read CCX .env configuration file
 */
export function readCcxEnv(): CcxConfig | null {
  if (!existsSync(CCX_ENV_FILE)) {
    return null
  }

  try {
    const content = readFileSync(CCX_ENV_FILE, 'utf-8')
    const config = createDefaultCcxConfig()

    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#'))
        continue

      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1)
        continue

      const key = trimmed.slice(0, eqIndex).trim()
      const value = trimmed.slice(eqIndex + 1).trim()

      switch (key) {
        case 'PROXY_ACCESS_KEY':
          config.PROXY_ACCESS_KEY = value
          break
        case 'PORT':
          config.PORT = Number.parseInt(value, 10) || 3688
          break
        case 'ENABLE_WEB_UI':
          config.ENABLE_WEB_UI = value.toLowerCase() !== 'false'
          break
      }
    }

    return config
  }
  catch {
    return null
  }
}

/**
 * Write CCX .env configuration file
 */
export function writeCcxEnv(config: CcxConfig): void {
  ensureCcxConfigDir()

  const lines = [
    `PROXY_ACCESS_KEY=${config.PROXY_ACCESS_KEY}`,
    `PORT=${config.PORT}`,
    `ENABLE_WEB_UI=${config.ENABLE_WEB_UI}`,
  ]

  writeFileSync(CCX_ENV_FILE, `${lines.join('\n')}\n`, 'utf-8')
}

/**
 * Backup existing CCX configuration
 */
export async function backupCcxConfig(): Promise<string | null> {
  ensureI18nInitialized()

  try {
    if (!existsSync(CCX_ENV_FILE)) {
      return null
    }

    const timestamp = `${dayjs().format('YYYY-MM-DDTHH-mm-ss-SSS')}Z`
    const backupFileName = `.env.${timestamp}.bak`
    const backupPath = join(CCX_CONFIG_DIR, backupFileName)

    console.log(ansis.cyan(`${i18n.t('ccx:backupCcxConfig')}`))
    copyFileSync(CCX_ENV_FILE, backupPath)
    console.log(ansis.green(`✔ ${i18n.t('ccx:ccxBackupSuccess').replace('{path}', backupPath)}`))

    return backupPath
  }
  catch (error: any) {
    console.error(ansis.red(`${i18n.t('ccx:ccxBackupFailed')}:`), error.message)
    return null
  }
}

/**
 * Configure CCX proxy in Claude Code settings.json
 */
export async function configureCcxProxy(
  ccxConfig: CcxConfig,
  options: { skipConfirm?: boolean } = {},
): Promise<void> {
  const settings = readJsonConfig<any>(SETTINGS_FILE) || {}

  const port = ccxConfig.PORT || 3688
  const apiKey = ccxConfig.PROXY_ACCESS_KEY || 'sk-ccx-kit'

  if (!settings.env) {
    settings.env = {}
  }

  // Compute diff before writing
  const existingEnv = settings.env
  const newBaseUrl = `http://127.0.0.1:${port}`
  const changes: Array<{ key: string, old: string, new: string }> = []

  if (existingEnv.ANTHROPIC_BASE_URL !== newBaseUrl) {
    changes.push({
      key: 'ANTHROPIC_BASE_URL',
      old: existingEnv.ANTHROPIC_BASE_URL || i18n.t('ccx:statusSummary.notConfigured'),
      new: newBaseUrl,
    })
  }
  if (existingEnv.ANTHROPIC_API_KEY !== apiKey) {
    changes.push({
      key: 'ANTHROPIC_API_KEY',
      old: existingEnv.ANTHROPIC_API_KEY ? formatMaskedKey(existingEnv.ANTHROPIC_API_KEY) : i18n.t('ccx:statusSummary.notConfigured'),
      new: formatMaskedKey(apiKey),
    })
  }
  if (existingEnv.ANTHROPIC_AUTH_TOKEN) {
    changes.push({
      key: 'ANTHROPIC_AUTH_TOKEN',
      old: formatMaskedKey(existingEnv.ANTHROPIC_AUTH_TOKEN),
      new: i18n.t('ccx:settingsDiff.willBeRemoved'),
    })
  }

  // Prompt for confirmation if there are changes and not skipped
  if (changes.length > 0 && !options.skipConfirm) {
    ensureI18nInitialized()
    console.log(`\n${ansis.bold(i18n.t('ccx:settingsDiff.title'))}`)
    for (const change of changes) {
      console.log(`  ${ansis.gray(change.key)}: ${ansis.red(change.old)} → ${ansis.green(change.new)}`)
    }

    const confirmed = await promptBoolean({
      message: i18n.t('ccx:settingsDiff.confirm'),
      defaultValue: true,
    })

    if (!confirmed) {
      console.log(ansis.yellow(i18n.t('ccx:settingsDiff.skipped')))
      return
    }
  }

  // Remove ANTHROPIC_AUTH_TOKEN when switching to CCX proxy to avoid conflicts
  delete settings.env.ANTHROPIC_AUTH_TOKEN

  // Set CCX proxy configuration
  settings.env.ANTHROPIC_BASE_URL = newBaseUrl
  settings.env.ANTHROPIC_API_KEY = apiKey

  writeJsonConfig(SETTINGS_FILE, settings)

  // Set primaryApiKey for CCX proxy (Claude Code 2.0 requirement)
  try {
    setPrimaryApiKey()
  }
  catch (error) {
    ensureI18nInitialized()
    console.error(i18n.t('mcp:primaryApiKeySetFailed'), error)
  }
}

/**
 * Show configuration tips after setup
 */
export async function showConfigurationTips(accessKey?: string): Promise<void> {
  ensureI18nInitialized()

  console.log(ansis.bold.cyan(`\n📌 ${i18n.t('ccx:configTips')}:`))
  console.log(ansis.blue(`  • ${i18n.t('ccx:webUiTip')}`))
  console.log(ansis.bold.yellow(`  • ${i18n.t('ccx:useClaudeCommand')}`))

  if (accessKey) {
    console.log(ansis.bold.green(`  • ${i18n.t('ccx:accessKeyTip')}: ${accessKey}`))
  }

  console.log('')
}

/**
 * Main CCX setup flow: create config → configure proxy → start service → show Web UI
 */
export async function setupCcxConfiguration(): Promise<boolean> {
  ensureI18nInitialized()

  try {
    // Check for existing config
    const existingConfig = readCcxEnv()
    if (existingConfig) {
      console.log(ansis.blue(`ℹ ${i18n.t('ccx:existingCcxConfig')}`))
      let shouldBackupAndReconfigure = false
      try {
        shouldBackupAndReconfigure = await promptBoolean({
          message: i18n.t('ccx:overwriteCcxConfig'),
          defaultValue: false,
        })
      }
      catch (error: any) {
        if (error.name === 'ExitPromptError') {
          console.log(ansis.yellow(i18n.t('common:cancelled')))
          return false
        }
        throw error
      }

      if (!shouldBackupAndReconfigure) {
        console.log(ansis.yellow(`${i18n.t('ccx:keepingExistingConfig')}`))
        await configureCcxProxy(existingConfig, { skipConfirm: true })

        // Manage API key approval status
        try {
          const { manageApiKeyApproval } = await import('../claude-config')
          manageApiKeyApproval(existingConfig.PROXY_ACCESS_KEY)
          console.log(ansis.green(`✔ ${i18n.t('ccx:apiKeyApprovalSuccess')}`))
        }
        catch (error) {
          console.error(ansis.red(`${i18n.t('ccx:apiKeyApprovalFailed')}:`), error)
        }

        return true
      }

      // Backup existing config
      await backupCcxConfig()
    }

    // Create config, preserving existing access key if reconfiguring
    let config: CcxConfig
    if (existingConfig) {
      // Prompt user to keep existing key or set a new one
      const maskedKey = formatMaskedKey(existingConfig.PROXY_ACCESS_KEY)
      console.log(ansis.blue(`ℹ ${i18n.t('ccx:accessKeyPrompt.title', { key: maskedKey })}`))

      const { keyChoice } = await inquirer.prompt<{ keyChoice: string }>({
        type: 'list',
        name: 'keyChoice',
        message: i18n.t('ccx:accessKeyPrompt.title', { key: maskedKey }),
        choices: [
          { name: i18n.t('ccx:accessKeyPrompt.keepExisting'), value: 'keep' },
          { name: i18n.t('ccx:accessKeyPrompt.setNew'), value: 'new' },
        ],
        default: 'keep',
      })

      if (keyChoice === 'keep') {
        config = {
          PROXY_ACCESS_KEY: existingConfig.PROXY_ACCESS_KEY,
          PORT: existingConfig.PORT || 3688,
          ENABLE_WEB_UI: existingConfig.ENABLE_WEB_UI ?? true,
        }
      }
      else {
        const { newKey } = await inquirer.prompt<{ newKey: string }>({
          type: 'password',
          name: 'newKey',
          message: i18n.t('ccx:accessKeyPrompt.enterNewKey'),
          mask: '*',
        })
        config = {
          ...createDefaultCcxConfig(),
          PROXY_ACCESS_KEY: newKey || 'sk-ccx-kit',
        }
      }
    }
    else {
      // First-time setup, use default
      config = createDefaultCcxConfig()
    }

    // Write CCX config
    writeCcxEnv(config)
    console.log(ansis.green(`✔ ${i18n.t('ccx:ccxConfigSuccess')}`))

    // Configure proxy in settings.json
    await configureCcxProxy(config)
    console.log(ansis.green(`✔ ${i18n.t('ccx:proxyConfigSuccess')}`))

    // Start CCX service
    try {
      const { startCcxService } = await import('./commands')
      await startCcxService()
    }
    catch (error: any) {
      console.error(ansis.yellow(`⚠ ${i18n.t('ccx:failedToStartCcxService')}:`), error.message || error)
    }

    // Show configuration tips with access key
    await showConfigurationTips(config.PROXY_ACCESS_KEY)

    // Add hasCompletedOnboarding flag
    try {
      addCompletedOnboarding()
    }
    catch (error) {
      console.error(ansis.red(i18n.t('errors:failedToSetOnboarding')), error)
    }

    // Manage API key approval status
    try {
      const { manageApiKeyApproval } = await import('../claude-config')
      manageApiKeyApproval(config.PROXY_ACCESS_KEY)
      console.log(ansis.green(`✔ ${i18n.t('ccx:apiKeyApprovalSuccess')}`))
    }
    catch (error) {
      console.error(ansis.red(`${i18n.t('ccx:apiKeyApprovalFailed')}:`), error)
    }

    return true
  }
  catch (error: any) {
    if (error.name === 'ExitPromptError') {
      console.log(ansis.yellow(i18n.t('common:cancelled')))
      return false
    }
    console.error(ansis.red(`${i18n.t('ccx:ccxConfigFailed')}:`), error)
    return false
  }
}

/**
 * Feature entry point for CCX configuration
 */
export async function configureCcxFeature(): Promise<void> {
  ensureI18nInitialized()

  const backupDir = backupExistingConfig()
  if (backupDir) {
    console.log(ansis.gray(`✔ ${i18n.t('configuration:backupSuccess')}: ${backupDir}`))
  }

  await setupCcxConfiguration()
}
