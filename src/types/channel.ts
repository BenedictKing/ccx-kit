/**
 * Channel preset variant for providers with multiple base URLs
 */
export interface ChannelPresetVariant {
  id: string
  name: string
  kind: 'messages' | 'chat' | 'responses' | 'gemini' | 'images'
  serviceType: string
  baseUrl: string
  description?: string
  modelMapping?: Record<string, string>
  normalizeNonstandardChatRoles?: boolean
}

/**
 * Channel preset definition for common upstream providers
 */
export interface ChannelPreset {
  id: string
  name: string
  kind?: 'messages' | 'chat' | 'responses' | 'gemini' | 'images'
  serviceType?: string
  baseUrl?: string
  description: string
  website: string
  defaultModels: string[]
  apiKeyHint: string
  customHeaders?: Record<string, string>
  modelMapping?: Record<string, string>
  variants?: ChannelPresetVariant[]
}

/**
 * Result of a channel connectivity test
 */
export interface ChannelTestResult {
  success: boolean
  latency: number
  error?: string
}

/**
 * CCX upstream config for channel creation
 */
export interface CcxUpstreamConfig {
  baseUrl: string
  apiKeys: string[]
  serviceType: string
  name: string
  description?: string
  website?: string
  modelMapping?: Record<string, string>
  customHeaders?: Record<string, string>
  supportedModels?: string[]
  normalizeNonstandardChatRoles?: boolean
}

/**
 * CCX config file structure (~/.ccx/.config/config.json)
 */
export interface CcxConfigFile {
  upstream: CcxUpstreamConfig[]
  chatUpstream?: CcxUpstreamConfig[]
  responsesUpstream?: CcxUpstreamConfig[]
  geminiUpstream?: CcxUpstreamConfig[]
  imagesUpstream?: CcxUpstreamConfig[]
  fuzzyModeEnabled?: boolean
  stripBillingHeader?: boolean
}
