import type { CcxConfigFile, CcxUpstreamConfig } from '../../types/channel'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import dayjs from 'dayjs'
import { join } from 'pathe'

const CCX_CONFIG_DIR = join(homedir(), '.ccx')
const CCX_CONFIG_FILE = join(CCX_CONFIG_DIR, '.config', 'config.json')

/**
 * Map channel kind to config file array key
 */
function getUpstreamKey(kind: string): keyof CcxConfigFile {
  switch (kind) {
    case 'chat': return 'chatUpstream'
    case 'responses': return 'responsesUpstream'
    case 'gemini': return 'geminiUpstream'
    case 'images': return 'imagesUpstream'
    default: return 'upstream'
  }
}

/**
 * Read CCX config file
 */
export function readCcxConfigFile(): CcxConfigFile | null {
  try {
    if (!existsSync(CCX_CONFIG_FILE))
      return null
    const content = readFileSync(CCX_CONFIG_FILE, 'utf-8')
    return JSON.parse(content) as CcxConfigFile
  }
  catch {
    return null
  }
}

/**
 * Write CCX config file
 */
export function writeCcxConfigFile(config: CcxConfigFile): void {
  const dir = join(CCX_CONFIG_DIR, '.config')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(CCX_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

/**
 * Backup CCX config file
 */
export function backupCcxConfigFile(): string | null {
  try {
    if (!existsSync(CCX_CONFIG_FILE))
      return null
    const timestamp = dayjs().format('YYYY-MM-DDTHH-mm-ss-SSS')
    const backupPath = join(CCX_CONFIG_DIR, '.config', `config.${timestamp}.json.bak`)
    copyFileSync(CCX_CONFIG_FILE, backupPath)
    return backupPath
  }
  catch {
    return null
  }
}

/**
 * Add a channel to the config file directly
 */
export function addChannelToFile(kind: string, upstream: CcxUpstreamConfig): void {
  const config = readCcxConfigFile() || { upstream: [] }
  const key = getUpstreamKey(kind)

  if (!config[key]) {
    ;(config as any)[key] = []
  }
  ;(config as any)[key].push(upstream)

  writeCcxConfigFile(config)
}
