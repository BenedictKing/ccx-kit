import { networkInterfaces } from 'node:os'
import ansis from 'ansis'
import inquirer from 'inquirer'
import { ensureI18nInitialized, i18n } from '../../i18n'
import { DEFAULT_CCX_PORT, readCcxEnv } from './config'

interface NetworkAddress {
  address: string
  name: string
}

export async function testCcxConnectivity(host: string, port: number, timeout = 3000): Promise<boolean> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(`http://${host}:${port}/health`, { signal: controller.signal })
    clearTimeout(timeoutId)
    return response.ok
  }
  catch {
    clearTimeout(timeoutId)
    return false
  }
}

export function getLocalIPv4Addresses(): NetworkAddress[] {
  const interfaces = networkInterfaces()
  const addresses: NetworkAddress[] = []
  for (const [name, nets] of Object.entries(interfaces)) {
    if (!nets)
      continue
    for (const net of nets) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({ address: net.address, name })
      }
    }
  }
  return addresses
}

export async function detectCcxHost(port: number): Promise<string | null> {
  ensureI18nInitialized()

  if (await testCcxConnectivity('127.0.0.1', port))
    return '127.0.0.1'

  console.log(ansis.yellow(`\n⚠️  ${i18n.t('ccx:connectivity.loopbackFailed')}`))
  console.log(ansis.gray(i18n.t('ccx:connectivity.scanning')))

  const addresses = getLocalIPv4Addresses()
  if (addresses.length === 0) {
    console.log(ansis.red(i18n.t('ccx:connectivity.noAddresses')))
    return null
  }

  const reachable: NetworkAddress[] = []
  for (const addr of addresses) {
    if (await testCcxConnectivity(addr.address, port)) {
      reachable.push(addr)
    }
  }

  if (reachable.length === 0) {
    console.log(ansis.red(i18n.t('ccx:connectivity.noneReachable')))
    console.log(ansis.gray(i18n.t('ccx:connectivity.manualHint')))
    const { manualIp } = await inquirer.prompt<{ manualIp: string }>({
      type: 'input',
      name: 'manualIp',
      message: i18n.t('ccx:connectivity.enterManualIp'),
    })
    if (manualIp && await testCcxConnectivity(manualIp, port))
      return manualIp
    return null
  }

  if (reachable.length === 1)
    return reachable[0].address

  const { selected } = await inquirer.prompt<{ selected: string }>({
    type: 'list',
    name: 'selected',
    message: i18n.t('ccx:connectivity.selectAddress'),
    choices: reachable.map(a => ({
      name: `${a.address} (${a.name})`,
      value: a.address,
    })),
  })
  return selected
}

export async function fixCcxBaseUrl(): Promise<void> {
  ensureI18nInitialized()
  const config = readCcxEnv()
  const port = config?.PORT || DEFAULT_CCX_PORT

  const host = await detectCcxHost(port)
  if (!host) {
    console.log(ansis.red(i18n.t('ccx:connectivity.fixFailed')))
    return
  }

  if (host === '127.0.0.1') {
    console.log(ansis.green(`✔ ${i18n.t('ccx:connectivity.loopbackOk')}`))
    return
  }

  const { readJsonConfig, writeJsonConfig } = await import('../json-config')
  const { SETTINGS_FILE } = await import('../../constants')

  const claudeUrl = `http://${host}:${port}`
  const codexUrl = `http://${host}:${port}/v1`

  // Update Claude Code settings.json
  const settings = readJsonConfig<any>(SETTINGS_FILE) || {}
  if (settings.env) {
    settings.env.ANTHROPIC_BASE_URL = claudeUrl
    writeJsonConfig(SETTINGS_FILE, settings)
    console.log(ansis.green(`✔ ${i18n.t('ccx:connectivity.updatedClaude', { url: claudeUrl })}`))
  }

  // Update Codex config.toml
  try {
    const { updateCodexCcxBaseUrl } = await import('../code-tools/codex')
    updateCodexCcxBaseUrl(codexUrl)
    console.log(ansis.green(`✔ ${i18n.t('ccx:connectivity.updatedCodex', { url: codexUrl })}`))
  }
  catch {
    // Codex may not be installed
  }

  // Update Gemini CLI .env
  try {
    const { readGeminiEnv, writeGeminiEnv } = await import('../code-tools/gemini-cli')
    const env = readGeminiEnv()
    if (env) {
      env.GOOGLE_GEMINI_BASE_URL = claudeUrl
      writeGeminiEnv(env)
      console.log(ansis.green(`✔ ${i18n.t('ccx:connectivity.updatedGemini', { url: claudeUrl })}`))
    }
  }
  catch {
    // Gemini CLI may not be configured
  }
}
