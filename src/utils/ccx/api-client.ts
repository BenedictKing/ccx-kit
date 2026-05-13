import type { CcxUpstreamConfig } from '../../types/channel'
import { DEFAULT_CCX_PORT, readCcxEnv } from './config'

interface CcxApiClientOptions {
  port?: number
  apiKey?: string
}

/**
 * Thin wrapper around CCX Admin API
 */
export class CcxApiClient {
  private baseUrl: string
  private apiKey: string

  constructor(options: CcxApiClientOptions = {}) {
    const config = readCcxEnv()
    const port = options.port || config?.PORT || DEFAULT_CCX_PORT
    this.apiKey = options.apiKey || config?.PROXY_ACCESS_KEY || 'sk-ccx-kit'
    this.baseUrl = `http://127.0.0.1:${port}`
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(`CCX API error ${response.status}: ${text}`)
      }

      return await response.json() as T
    }
    finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Check CCX service health
   */
  async getHealth(): Promise<boolean> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response.ok
    }
    catch {
      clearTimeout(timeoutId)
      return false
    }
  }

  /**
   * List channels for a given kind
   */
  async listChannels(kind: string): Promise<CcxUpstreamConfig[]> {
    const result = await this.request<{ channels: CcxUpstreamConfig[] }>('GET', `/api/${kind}/channels`)
    return result.channels || []
  }

  /**
   * Add a channel
   */
  async addChannel(kind: string, upstream: CcxUpstreamConfig): Promise<void> {
    await this.request('POST', `/api/${kind}/channels`, upstream)
  }

  /**
   * Delete a channel by index
   */
  async deleteChannel(kind: string, index: number): Promise<void> {
    await this.request('DELETE', `/api/${kind}/channels/${index}`)
  }
}
