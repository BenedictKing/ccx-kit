import type { AiOutputLanguage } from '../../constants'
import ansis from 'ansis'
import inquirer from 'inquirer'
import semver from 'semver'
import { x } from 'tinyexec'
import { GEMINI_DIR, GEMINI_SETTINGS_FILE } from '../../constants'
import { ensureI18nInitialized, i18n } from '../../i18n'
import { ensureDir, exists, readFile, writeFile } from '../fs-operations'
import { installGeminiCli, isGeminiCliInstalled } from '../installer'
import { wrapCommandWithSudo } from '../platform'
import { addNumbersToChoices } from '../prompt-helpers'

export { GEMINI_DIR }

const GEMINI_ENV_FILE = `${GEMINI_DIR}/.env`

export interface GeminiVersionInfo {
  installed: boolean
  currentVersion: string | null
  latestVersion: string | null
  needsUpdate: boolean
}

export interface GeminiEnvConfig {
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
  GOOGLE_GEMINI_BASE_URL?: string
  [key: string]: string | undefined
}

// ─── .env helpers ────────────────────────────────────────────

/**
 * Read Gemini CLI .env configuration
 */
export function readGeminiEnv(): GeminiEnvConfig | null {
  if (!exists(GEMINI_ENV_FILE))
    return null

  try {
    const content = readFile(GEMINI_ENV_FILE)
    const config: GeminiEnvConfig = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#'))
        continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1)
        continue
      const key = trimmed.slice(0, eqIndex).trim()
      const value = trimmed.slice(eqIndex + 1).trim()
      config[key] = value
    }
    return config
  }
  catch {
    return null
  }
}

/**
 * Write Gemini CLI .env configuration
 */
export function writeGeminiEnv(config: GeminiEnvConfig): void {
  ensureDir(GEMINI_DIR)
  const lines = Object.entries(config)
    .filter(([_, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${v}`)
  writeFile(GEMINI_ENV_FILE, `${lines.join('\n')}\n`)
}

// ─── Version / update ────────────────────────────────────────

/**
 * Check if Gemini CLI is installed
 */
export async function isGeminiInstalled(): Promise<boolean> {
  return await isGeminiCliInstalled()
}

/**
 * Get current Gemini CLI version
 */
export async function getGeminiVersion(): Promise<string | null> {
  try {
    const result = await x('gemini', ['--version'], { throwOnError: false })
    if (result.exitCode === 0 && result.stdout) {
      const match = result.stdout.match(/(\d+\.\d+\.\d+)/)
      return match ? match[1] : result.stdout.trim()
    }
  }
  catch {
    // Command not found
  }
  return null
}

/**
 * Check for Gemini CLI updates
 */
export async function checkGeminiUpdate(): Promise<GeminiVersionInfo> {
  try {
    const currentVersion = await getGeminiVersion()
    if (!currentVersion) {
      return { installed: false, currentVersion: null, latestVersion: null, needsUpdate: false }
    }

    const result = await x('npm', ['view', '@google/gemini-cli', '--json'])
    if (result.exitCode !== 0) {
      return { installed: true, currentVersion, latestVersion: null, needsUpdate: false }
    }

    const packageInfo = JSON.parse(result.stdout)
    const latestVersion = packageInfo['dist-tags']?.latest
    if (!latestVersion) {
      return { installed: true, currentVersion, latestVersion: null, needsUpdate: false }
    }

    return {
      installed: true,
      currentVersion,
      latestVersion,
      needsUpdate: semver.gt(latestVersion, currentVersion),
    }
  }
  catch {
    return { installed: false, currentVersion: null, latestVersion: null, needsUpdate: false }
  }
}

async function detectGeminiInstallMethod(): Promise<'homebrew' | 'npm'> {
  try {
    const result = await x('brew', ['list', 'gemini-cli'], { throwOnError: false })
    if (result.exitCode === 0) {
      return 'homebrew'
    }
  }
  catch {
    // Not installed via Homebrew
  }
  return 'npm'
}

async function executeGeminiUpdate(): Promise<void> {
  const method = await detectGeminiInstallMethod()

  if (method === 'homebrew') {
    console.log(ansis.cyan(i18n.t('gemini-cli:updatingViaBrew')))
    const result = await x('brew', ['upgrade', 'gemini-cli'], { throwOnError: false })
    if (result.exitCode !== 0) {
      throw new Error(`Failed to update Gemini CLI via Homebrew: exit code ${result.exitCode}`)
    }
    return
  }

  const { command, args, usedSudo } = wrapCommandWithSudo('npm', ['install', '-g', '@google/gemini-cli@latest'])
  if (usedSudo) {
    console.log(ansis.yellow(i18n.t('gemini-cli:usingSudo')))
  }

  const result = await x(command, args)
  if (result.exitCode !== 0) {
    throw new Error(`Failed to update Gemini CLI: exit code ${result.exitCode}`)
  }
}

/**
 * Run Gemini CLI update check and update if needed
 */
export async function runGeminiUpdate(force = false, skipPrompt = false): Promise<boolean> {
  ensureI18nInitialized()
  console.log(ansis.bold.cyan(`\n🔍 ${i18n.t('updater:checkingTools')}\n`))

  try {
    const { installed, currentVersion, latestVersion, needsUpdate } = await checkGeminiUpdate()

    if (!installed) {
      console.log(ansis.yellow(i18n.t('gemini-cli:notInstalled')))
      return false
    }

    if (!needsUpdate && !force) {
      console.log(ansis.green(i18n.t('gemini-cli:upToDate', { version: currentVersion || '' })))
      return true
    }

    if (!latestVersion) {
      console.log(ansis.yellow(i18n.t('gemini-cli:cannotCheckVersion')))
      return false
    }

    console.log(ansis.cyan(i18n.t('gemini-cli:currentVersion', { version: currentVersion || '' })))
    console.log(ansis.cyan(i18n.t('gemini-cli:latestVersion', { version: latestVersion })))

    if (!skipPrompt) {
      const { promptBoolean } = await import('../toggle-prompt')
      const confirm = await promptBoolean({
        message: i18n.t('gemini-cli:confirmUpdate'),
        defaultValue: true,
      })
      if (!confirm) {
        console.log(ansis.gray(i18n.t('gemini-cli:updateSkipped')))
        return true
      }
    }
    else {
      console.log(ansis.cyan(i18n.t('gemini-cli:autoUpdating')))
    }

    await executeGeminiUpdate()
    console.log(ansis.green(i18n.t('gemini-cli:updateSuccess')))
    return true
  }
  catch (error) {
    console.error(ansis.red(i18n.t('gemini-cli:updateFailed')))
    console.error(ansis.red(error instanceof Error ? error.message : String(error)))
    return false
  }
}

// ─── API configuration ───────────────────────────────────────

/**
 * Configure Gemini CLI to use CCX proxy
 */
async function configureGeminiSettings(): Promise<void> {
  const { readJsonConfig, writeJsonConfig } = await import('../json-config')
  const settings = readJsonConfig<any>(GEMINI_SETTINGS_FILE) || {}
  settings.security = settings.security || {}
  settings.security.auth = settings.security.auth || {}
  settings.security.auth.selectedType = 'gemini-api-key'
  settings.model = settings.model || {}
  settings.model.name = 'gemini-3-pro-preview'
  writeJsonConfig(GEMINI_SETTINGS_FILE, settings)
}

async function configureGeminiCcxProxy(): Promise<boolean> {
  try {
    // Step 1: Check / install CCX
    const { isCcxInstalled, installCcx } = await import('../ccx/installer')
    const installStatus = await isCcxInstalled()
    if (!installStatus.isInstalled) {
      console.log(ansis.cyan(i18n.t('gemini-cli:ccxInstalling')))
      await installCcx()
    }

    // Step 2: Read or create CCX config
    const { DEFAULT_CCX_PORT, readCcxEnv, createDefaultCcxConfig, writeCcxEnv, ensureCcxConfigDir, showConfigurationTips } = await import('../ccx/config')
    let ccxConfig = readCcxEnv()

    // Step 3: Start CCX if not running
    const { isCcxRunning, startCcxService } = await import('../ccx/commands')
    const port = ccxConfig?.PORT || DEFAULT_CCX_PORT
    const running = await isCcxRunning(port)

    if (running) {
      console.log(ansis.blue(`ℹ ${i18n.t('gemini-cli:ccxReusing')}`))
    }
    else {
      console.log(ansis.cyan(i18n.t('gemini-cli:ccxConfiguringAndStarting')))
      if (!ccxConfig) {
        ensureCcxConfigDir()
        ccxConfig = createDefaultCcxConfig()
        writeCcxEnv(ccxConfig)
        console.log(ansis.green(`✔ ${i18n.t('gemini-cli:ccxConfigCreated')}`))
      }
      try {
        await startCcxService()
      }
      catch (error: any) {
        console.error(ansis.red(`✖ ${i18n.t('gemini-cli:ccxStartFailed')}`))
        console.error(ansis.gray(error.message || error))
        return false
      }
    }

    if (!ccxConfig) {
      ccxConfig = createDefaultCcxConfig()
    }

    const accessKey = ccxConfig.PROXY_ACCESS_KEY || 'sk-ccx-kit'
    const ccxPort = ccxConfig.PORT || DEFAULT_CCX_PORT

    // Step 4: Write Gemini .env
    const envConfig: GeminiEnvConfig = {
      ...readGeminiEnv(),
      GEMINI_API_KEY: accessKey,
      GEMINI_MODEL: 'gemini-3-pro-preview',
      GOOGLE_GEMINI_BASE_URL: `http://127.0.0.1:${ccxPort}`,
    }
    writeGeminiEnv(envConfig)
    await configureGeminiSettings()
    console.log(ansis.green(`✔ ${i18n.t('gemini-cli:envConfigured')}`))

    // Step 5: Show tips
    await showConfigurationTips(accessKey, 'gemini-cli')
    console.log(ansis.green(`✔ ${i18n.t('gemini-cli:ccxConfigComplete')}`))
    return true
  }
  catch (error: any) {
    if (error.name === 'ExitPromptError') {
      console.log(ansis.yellow(i18n.t('common:cancelled')))
      return false
    }
    console.error(ansis.red(`✖ ${i18n.t('gemini-cli:ccxConfigFailed')}`))
    console.error(ansis.gray(error.message || error))
    return false
  }
}

/**
 * Configure Gemini CLI API with custom key / base URL
 */
async function configureGeminiCustomApi(): Promise<boolean> {
  const existing = readGeminiEnv()

  const answers = await inquirer.prompt<{ apiKey: string, baseUrl: string, model: string }>([
    {
      type: 'input',
      name: 'apiKey',
      message: i18n.t('gemini-cli:enterApiKey'),
      default: existing?.GEMINI_API_KEY,
      validate: (v: string) => !!v.trim() || i18n.t('gemini-cli:apiKeyRequired'),
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: `${i18n.t('gemini-cli:enterBaseUrl')}${i18n.t('common:emptyToSkip')}`,
      default: existing?.GOOGLE_GEMINI_BASE_URL || '',
    },
    {
      type: 'input',
      name: 'model',
      message: `${i18n.t('gemini-cli:enterModel')}${i18n.t('common:emptyToSkip')}`,
      default: existing?.GEMINI_MODEL || 'gemini-2.5-pro',
    },
  ])

  const envConfig: GeminiEnvConfig = {
    ...existing,
    GEMINI_API_KEY: answers.apiKey.trim(),
  }
  if (answers.baseUrl.trim())
    envConfig.GOOGLE_GEMINI_BASE_URL = answers.baseUrl.trim()
  if (answers.model.trim())
    envConfig.GEMINI_MODEL = answers.model.trim()

  writeGeminiEnv(envConfig)
  console.log(ansis.green(`✔ ${i18n.t('gemini-cli:envConfigured')}`))
  return true
}

/**
 * Interactive API configuration for Gemini CLI
 */
export async function configureGeminiApi(options?: GeminiFullInitOptions): Promise<void> {
  ensureI18nInitialized()

  const { skipPrompt = false, apiMode } = options ?? {}

  // Handle skipPrompt / direct mode
  if (skipPrompt) {
    if (apiMode === 'skip')
      return
    if (apiMode === 'ccx') {
      await configureGeminiCcxProxy()
      return
    }
    // For skip-prompt with no explicit mode, skip API config
    return
  }

  const { mode } = await inquirer.prompt<{ mode: 'custom' | 'ccx' | 'skip' }>([{
    type: 'list',
    name: 'mode',
    message: i18n.t('gemini-cli:apiModePrompt'),
    choices: addNumbersToChoices([
      { name: `${i18n.t('gemini-cli:apiModeCcx')} ${ansis.green(`[${i18n.t('installation:recommendedMethod')}]`)}`, value: 'ccx', short: i18n.t('gemini-cli:apiModeCcx') },
      { name: i18n.t('gemini-cli:apiModeCustom'), value: 'custom' },
      { name: i18n.t('common:skip'), value: 'skip' },
    ]),
    default: 'ccx',
  }])

  if (mode === 'skip')
    return

  if (mode === 'ccx') {
    await configureGeminiCcxProxy()
    return
  }

  await configureGeminiCustomApi()
}

// ─── Full init ───────────────────────────────────────────────

export interface GeminiFullInitOptions {
  aiOutputLang?: AiOutputLanguage | string
  skipPrompt?: boolean
  apiMode?: 'custom' | 'ccx' | 'skip'
}

/**
 * Run full Gemini CLI initialization
 * Install CLI → Configure API (with CCX support)
 */
export async function runGeminiCliFullInit(
  options?: GeminiFullInitOptions,
): Promise<AiOutputLanguage | string> {
  ensureI18nInitialized()

  const { skipPrompt = false, aiOutputLang } = options ?? {}

  // Step 1: Install Gemini CLI if not installed
  await installGeminiCli(skipPrompt)

  // Step 2: Configure API (custom / CCX / skip)
  await configureGeminiApi(options)

  // Preserve existing AI output language setting if not explicitly provided
  if (!aiOutputLang) {
    const { readAppConfig } = await import('../app-config')
    const appConfig = readAppConfig()
    if (appConfig?.aiOutputLang) {
      console.log(ansis.green(i18n.t('gemini-cli:setupComplete')))
      return appConfig.aiOutputLang
    }
  }

  const resolvedLang = aiOutputLang ?? 'en'
  console.log(ansis.green(i18n.t('gemini-cli:setupComplete')))
  return resolvedLang
}

/**
 * Run Gemini CLI uninstall
 */
export async function runGeminiUninstall(): Promise<void> {
  ensureI18nInitialized()

  const installed = await isGeminiCliInstalled()
  if (!installed) {
    console.log(ansis.yellow(i18n.t('gemini-cli:notInstalled')))
    return
  }

  const { promptBoolean } = await import('../toggle-prompt')
  const confirm = await promptBoolean({
    message: i18n.t('gemini-cli:confirmUninstall'),
    defaultValue: false,
  })

  if (!confirm) {
    console.log(ansis.gray(i18n.t('common:cancelled')))
    return
  }

  try {
    const { uninstallCodeTool } = await import('../installer')
    const success = await uninstallCodeTool('gemini-cli')
    if (success) {
      console.log(ansis.green(i18n.t('gemini-cli:uninstallSuccess')))
    }
  }
  catch (error) {
    console.error(ansis.red(i18n.t('gemini-cli:uninstallFailed')))
    console.error(ansis.red(error instanceof Error ? error.message : String(error)))
  }
}
