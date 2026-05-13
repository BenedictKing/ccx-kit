import type { CcxUpstreamConfig, ChannelPreset, ChannelPresetVariant } from '../../types/channel'
import { ensureI18nInitialized, i18n } from '../../i18n'
import { CcxApiClient } from './api-client'
import { isCcxRunning, startCcxService } from './commands'
import { addChannelToFile, readCcxConfigFile } from './config-file'

/**
 * Ensure CCX is running, attempt to start if not
 */
export async function ensureCcxRunning(): Promise<boolean> {
  if (await isCcxRunning())
    return true

  ensureI18nInitialized()
  console.log(i18n.t('ccx:channel.startingCcx'))

  await startCcxService()
  return isCcxRunning()
}

/**
 * Build upstream config from preset + variant + user API keys
 */
function buildUpstream(
  preset: ChannelPreset,
  variant: ChannelPresetVariant | undefined,
  apiKeys: string[],
): CcxUpstreamConfig {
  const serviceType = variant?.serviceType || preset.serviceType || 'openai'
  const baseUrl = variant?.baseUrl || preset.baseUrl || ''

  return {
    baseUrl,
    apiKeys,
    serviceType,
    name: variant ? `${preset.name} - ${variant.name}` : preset.name,
    description: preset.description,
    website: preset.website,
    supportedModels: preset.defaultModels,
    ...(preset.customHeaders && { customHeaders: preset.customHeaders }),
    ...((variant?.modelMapping || preset.modelMapping) && { modelMapping: variant?.modelMapping || preset.modelMapping }),
  }
}

/**
 * Add a preset channel - smart routing between API and file mode
 */
export async function addPresetChannel(
  preset: ChannelPreset,
  apiKeys: string[],
  variant?: ChannelPresetVariant,
): Promise<{ success: boolean, method: 'api' | 'file', error?: string }> {
  ensureI18nInitialized()

  const kind = variant?.kind || preset.kind || 'chat'
  const upstream = buildUpstream(preset, variant, apiKeys)

  // Try API mode first
  const running = await ensureCcxRunning()
  if (running) {
    try {
      const client = new CcxApiClient()
      await client.addChannel(kind, upstream)
      console.log(i18n.t('ccx:channel.addSuccess'))
      return { success: true, method: 'api' }
    }
    catch {
      console.log(i18n.t('ccx:channel.apiFailedFallback'))
    }
  }

  // Fallback to file mode
  try {
    addChannelToFile(kind, upstream)
    console.log(i18n.t('ccx:channel.addSuccessFile'))
    return { success: true, method: 'file' }
  }
  catch (error: any) {
    return { success: false, method: 'file', error: error.message }
  }
}

/**
 * List channels - prefer API, fallback to file
 */
export async function listChannels(kind: string): Promise<CcxUpstreamConfig[]> {
  const running = await isCcxRunning()
  if (running) {
    try {
      const client = new CcxApiClient()
      return await client.listChannels(kind)
    }
    catch {
      // fallback to file
    }
  }

  const config = readCcxConfigFile()
  if (!config)
    return []

  switch (kind) {
    case 'chat': return config.chatUpstream || []
    case 'responses': return config.responsesUpstream || []
    case 'gemini': return config.geminiUpstream || []
    case 'images': return config.imagesUpstream || []
    default: return config.upstream || []
  }
}
