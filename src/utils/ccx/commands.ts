import type { CcxServiceStatus } from '../../types/ccx'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import process from 'node:process'
import ansis from 'ansis'
import { join } from 'pathe'
import { exec } from 'tinyexec'
import { ensureI18nInitialized, i18n } from '../../i18n'
import { DEFAULT_CCX_PORT, readCcxEnv } from './config'

const CCX_DIR = join(homedir(), '.ccx')
const CCX_PID_FILE = join(CCX_DIR, 'ccx.pid')
const CCX_BINARY_NAME = platform() === 'win32' ? 'ccx.exe' : 'ccx'
const CCX_BINARY_PATH = join(homedir(), '.local', 'bin', CCX_BINARY_NAME)

/**
 * Read PID from the PID file
 */
function readPid(): number | null {
  try {
    if (!existsSync(CCX_PID_FILE))
      return null
    const pid = Number.parseInt(readFileSync(CCX_PID_FILE, 'utf-8').trim(), 10)
    return Number.isNaN(pid) ? null : pid
  }
  catch {
    return null
  }
}

/**
 * Write PID to the PID file
 */
function writePid(pid: number): void {
  if (!existsSync(CCX_DIR)) {
    mkdirSync(CCX_DIR, { recursive: true })
  }
  writeFileSync(CCX_PID_FILE, String(pid), 'utf-8')
}

/**
 * Check if a process with given PID is running
 */
function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  }
  catch {
    return false
  }
}

/**
 * Check if CCX service is running via /health endpoint
 */
export async function isCcxRunning(port?: number): Promise<boolean> {
  const config = readCcxEnv()
  const targetPort = port || config?.PORT || DEFAULT_CCX_PORT

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`http://127.0.0.1:${targetPort}/health`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    return response.ok
  }
  catch {
    return false
  }
}

/**
 * Get CCX service status
 */
export async function getCcxStatus(): Promise<CcxServiceStatus> {
  const config = readCcxEnv()
  const port = config?.PORT || DEFAULT_CCX_PORT
  const running = await isCcxRunning(port)
  const pid = readPid()

  return {
    running,
    port,
    pid: running ? pid : null,
    webUiUrl: running && config?.ENABLE_WEB_UI ? `http://localhost:${port}` : null,
  }
}

/**
 * Start CCX service as a detached background process
 */
export async function startCcxService(): Promise<void> {
  ensureI18nInitialized()
  console.log(ansis.cyan(`\n▶️  ${i18n.t('ccx:startingCcx')}`))

  // Check if already running
  if (await isCcxRunning()) {
    console.log(ansis.yellow(`⚠ ${i18n.t('ccx:ccxAlreadyRunning')}`))
    return
  }

  // Ensure binary exists
  if (!existsSync(CCX_BINARY_PATH)) {
    // Try PATH fallback
    try {
      await exec('which', ['ccx'], { timeout: 3000 })
    }
    catch {
      throw new Error(i18n.t('ccx:ccxNotInstalled'))
    }
  }

  try {
    // Ensure config directory exists
    if (!existsSync(CCX_DIR)) {
      mkdirSync(CCX_DIR, { recursive: true })
    }

    const binaryPath = existsSync(CCX_BINARY_PATH) ? CCX_BINARY_PATH : 'ccx'
    const child = spawn(binaryPath, [], {
      cwd: CCX_DIR,
      detached: true,
      stdio: 'ignore',
    })

    child.unref()

    if (child.pid) {
      writePid(child.pid)
    }

    // Wait for service to be ready
    await new Promise(resolve => setTimeout(resolve, 2000))

    const running = await isCcxRunning()
    if (running) {
      console.log(ansis.green(`✔ ${i18n.t('ccx:ccxStarted')}`))
    }
    else {
      console.log(ansis.yellow(`⚠ ${i18n.t('ccx:ccxStartedButNotReady')}`))
    }
  }
  catch (error: any) {
    console.error(ansis.red(`✖ ${i18n.t('ccx:ccxCommandFailed')}: ${error.message || error}`))
    throw error
  }
}

/**
 * Stop CCX service
 */
export async function stopCcxService(): Promise<void> {
  ensureI18nInitialized()
  console.log(ansis.cyan(`\n⏹️  ${i18n.t('ccx:stoppingCcx')}`))

  const pid = readPid()

  if (pid && isProcessRunning(pid)) {
    try {
      process.kill(pid, 'SIGTERM')
      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log(ansis.green(`✔ ${i18n.t('ccx:ccxStopped')}`))
      return
    }
    catch {
      // Fallback to platform-specific kill
    }
  }

  // Fallback: use pkill/taskkill
  try {
    if (platform() === 'win32') {
      await exec('taskkill', ['/F', '/IM', 'ccx.exe'])
    }
    else {
      await exec('pkill', ['-f', 'ccx'])
    }
    console.log(ansis.green(`✔ ${i18n.t('ccx:ccxStopped')}`))
  }
  catch {
    console.log(ansis.yellow(`⚠ ${i18n.t('ccx:ccxNotRunning')}`))
  }
}

/**
 * Restart CCX service
 */
export async function restartCcxService(): Promise<void> {
  ensureI18nInitialized()
  console.log(ansis.cyan(`\n🔄 ${i18n.t('ccx:restartingCcx')}`))

  await stopCcxService()
  await new Promise(resolve => setTimeout(resolve, 1000))
  await startCcxService()
}

/**
 * Open CCX Web UI in the default browser
 */
export async function openCcxWebUi(): Promise<void> {
  ensureI18nInitialized()

  const config = readCcxEnv()
  const port = config?.PORT || DEFAULT_CCX_PORT
  const url = `http://localhost:${port}`

  console.log(ansis.cyan(`\n🖥️  ${i18n.t('ccx:openingWebUi')}`))

  // Show access key
  if (config?.PROXY_ACCESS_KEY) {
    console.log(ansis.bold.green(`\n🔑 ${i18n.t('ccx:accessKeyTip')}: ${config.PROXY_ACCESS_KEY}`))
  }

  try {
    const os = platform()
    if (os === 'darwin') {
      await exec('open', [url])
    }
    else if (os === 'win32') {
      await exec('cmd', ['/c', 'start', url])
    }
    else {
      await exec('xdg-open', [url])
    }
    console.log(ansis.green(`✔ ${i18n.t('ccx:webUiOpened')}`))
  }
  catch {
    console.log(ansis.yellow(`⚠ ${i18n.t('ccx:webUiOpenFailed')}`))
    console.log(ansis.gray(`  ${url}`))
  }
}
