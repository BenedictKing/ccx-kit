import type { CcxInstallStatus } from '../../types/ccx'
import { existsSync } from 'node:fs'
import { chmod, copyFile, mkdir } from 'node:fs/promises'
import { arch, homedir, platform } from 'node:os'
import process from 'node:process'
import ansis from 'ansis'
import { join } from 'pathe'
import { exec } from 'tinyexec'
import { ensureI18nInitialized, i18n } from '../../i18n'
import { cacheFile, getCachedPath } from '../install-cache'
import { downloadCcxFromSources, getCcxDownloadUrls } from './download-sources'
import { getLatestCcxVersionFromSources } from './version-sources'

const CCX_GITHUB_REPO = 'BenedictKing/ccx'
const CCX_INSTALL_DIR = join(homedir(), '.local', 'bin')
const CCX_BINARY_NAME = platform() === 'win32' ? 'ccx.exe' : 'ccx'
const CCX_BINARY_PATH = join(CCX_INSTALL_DIR, CCX_BINARY_NAME)

/**
 * Map OS platform and architecture to CCX release asset name
 */
function getCcxAssetName(): string {
  const os = platform()
  const cpuArch = arch()

  let osName: string
  switch (os) {
    case 'darwin':
      osName = 'darwin'
      break
    case 'linux':
      osName = 'linux'
      break
    case 'win32':
      osName = 'windows'
      break
    default: throw new Error(`Unsupported platform: ${os}`)
  }

  let archName: string
  switch (cpuArch) {
    case 'x64':
      archName = 'amd64'
      break
    case 'arm64':
      archName = 'arm64'
      break
    default: throw new Error(`Unsupported architecture: ${cpuArch}`)
  }

  const ext = os === 'win32' ? '.exe' : ''
  return `ccx-${osName}-${archName}${ext}`
}

/**
 * Check if CCX is installed and get its status
 */
export async function isCcxInstalled(): Promise<CcxInstallStatus> {
  // Check if binary exists at expected path
  if (existsSync(CCX_BINARY_PATH)) {
    const version = await getCcxVersion()
    return { isInstalled: true, binaryPath: CCX_BINARY_PATH, version }
  }

  // Fallback: check if ccx is in PATH
  try {
    const result = await exec('ccx', ['--version'])
    const match = result.stdout.match(/(\d+\.\d+\.\d+)/)
    return {
      isInstalled: true,
      binaryPath: null, // In PATH but not at expected location
      version: match ? match[1] : null,
    }
  }
  catch {
    return { isInstalled: false, binaryPath: null, version: null }
  }
}

/**
 * Get installed CCX version
 */
export async function getCcxVersion(): Promise<string | null> {
  try {
    const result = await exec(CCX_BINARY_PATH, ['--version'])
    const match = result.stdout.match(/(\d+\.\d+\.\d+)/)
    return match ? match[1] : null
  }
  catch {
    // Fallback: try ccx in PATH
    try {
      const result = await exec('ccx', ['--version'])
      const match = result.stdout.match(/(\d+\.\d+\.\d+)/)
      return match ? match[1] : null
    }
    catch {
      return null
    }
  }
}

/**
 * Get latest CCX version from multiple sources with fallback
 */
export async function getLatestCcxVersion(): Promise<string | null> {
  return await getLatestCcxVersionFromSources()
}

/**
 * Download and install CCX binary from multiple sources with fallback
 */
export async function installCcx(): Promise<void> {
  ensureI18nInitialized()

  // Check if already installed
  const status = await isCcxInstalled()
  if (status.isInstalled) {
    console.log(ansis.green(`✔ ${i18n.t('ccx:ccxAlreadyInstalled')}`))
    return
  }

  console.log(ansis.cyan(`📦 ${i18n.t('ccx:installingCcx')}`))

  try {
    // Get latest version from multiple sources
    const assetName = getCcxAssetName()
    const latestVersion = await getLatestCcxVersion()

    if (!latestVersion) {
      throw new Error('Failed to fetch latest version from all sources')
    }

    // Ensure install directory exists
    await mkdir(CCX_INSTALL_DIR, { recursive: true })

    // Check local cache first (URL-to-path mapping)
    const downloadUrls = getCcxDownloadUrls(CCX_GITHUB_REPO, latestVersion, assetName)
    let installedFromCache = false
    for (const url of downloadUrls) {
      const cached = getCachedPath(url)
      if (cached) {
        console.log(ansis.green(`  ${i18n.t('ccx:downloading')} ${assetName} (from cache)...`))
        await copyFile(cached, CCX_BINARY_PATH)
        installedFromCache = true
        break
      }
    }

    if (!installedFromCache) {
      // Download binary from multiple sources
      console.log(ansis.cyan(`  ${i18n.t('ccx:downloading')} ${assetName}...`))

      const success = await downloadCcxFromSources(
        CCX_GITHUB_REPO,
        latestVersion,
        assetName,
        CCX_BINARY_PATH,
      )

      if (!success) {
        throw new Error('Failed to download from all sources')
      }

      // Cache the downloaded binary for future installs
      try {
        await cacheFile(downloadUrls[0], CCX_BINARY_PATH)
      }
      catch {
        // Caching is best-effort, don't fail the install
      }
    }

    // Set executable permission on non-Windows
    if (platform() !== 'win32') {
      await chmod(CCX_BINARY_PATH, 0o755)
    }

    console.log(ansis.green(`✔ ${i18n.t('ccx:ccxInstallSuccess')}`))

    // Check if ~/.local/bin is in PATH
    const pathDirs = (process.env.PATH || '').split(platform() === 'win32' ? ';' : ':')
    const isInPath = pathDirs.includes(CCX_INSTALL_DIR)
    if (!isInPath) {
      console.log(ansis.yellow(`⚠ ${i18n.t('ccx:pathNotInPath')}`))
      console.log(ansis.gray(`  export PATH="$HOME/.local/bin:$PATH"`))
    }
  }
  catch (error: any) {
    console.error(ansis.red(`✖ ${i18n.t('ccx:ccxInstallFailed')}`))
    throw error
  }
}
