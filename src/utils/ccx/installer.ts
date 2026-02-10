import type { CcxInstallStatus } from '../../types/ccx'
import { createWriteStream, existsSync } from 'node:fs'
import { chmod, mkdir } from 'node:fs/promises'
import { arch, homedir, platform } from 'node:os'
import process from 'node:process'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import ansis from 'ansis'
import { join } from 'pathe'
import { exec } from 'tinyexec'
import { ensureI18nInitialized, i18n } from '../../i18n'

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
 * Get latest CCX version from GitHub releases
 */
export async function getLatestCcxVersion(): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(
      `https://api.github.com/repos/${CCX_GITHUB_REPO}/releases/latest`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/vnd.github.v3+json' },
      },
    )
    clearTimeout(timeoutId)

    if (!response.ok)
      return null

    const data = await response.json() as { tag_name?: string }
    const tag = data.tag_name || ''
    // Strip leading 'v' if present
    return tag.startsWith('v') ? tag.slice(1) : tag
  }
  catch {
    return null
  }
}

/**
 * Download and install CCX binary from GitHub releases
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
    // Get latest release info
    const assetName = getCcxAssetName()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(
      `https://api.github.com/repos/${CCX_GITHUB_REPO}/releases/latest`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/vnd.github.v3+json' },
      },
    )
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const release = await response.json() as {
      tag_name: string
      assets: Array<{ name: string, browser_download_url: string }>
    }

    const asset = release.assets.find(a => a.name === assetName)
    if (!asset) {
      throw new Error(`No binary found for ${assetName} in release ${release.tag_name}`)
    }

    // Ensure install directory exists
    await mkdir(CCX_INSTALL_DIR, { recursive: true })

    // Download binary
    console.log(ansis.cyan(`  ${i18n.t('ccx:downloading')} ${asset.name}...`))
    const downloadResponse = await fetch(asset.browser_download_url)
    if (!downloadResponse.ok || !downloadResponse.body) {
      throw new Error(`Download failed: ${downloadResponse.status}`)
    }

    const fileStream = createWriteStream(CCX_BINARY_PATH)
    await pipeline(Readable.fromWeb(downloadResponse.body as any), fileStream)

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
