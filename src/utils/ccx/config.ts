import type { CcxConfig } from '../../types/ccx'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import ansis from 'ansis'
import dayjs from 'dayjs'
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
export async function configureCcxProxy(ccxConfig: CcxConfig): Promise<void> {
  const settings = readJsonConfig<any>(SETTINGS_FILE) || {}

  const port = ccxConfig.PORT || 3688
  const apiKey = ccxConfig.PROXY_ACCESS_KEY || 'sk-ccx-kit'

  if (!settings.env) {
    settings.env = {}
  }

  // Remove ANTHROPIC_AUTH_TOKEN when switching to CCX proxy to avoid conflicts
  delete settings.env.ANTHROPIC_AUTH_TOKEN

  // Set CCX proxy configuration
  settings.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${port}`
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
        await configureCcxProxy(existingConfig)

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

    // Create default config (no preset selection needed - use Web UI)
    const config = createDefaultCcxConfig()

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
