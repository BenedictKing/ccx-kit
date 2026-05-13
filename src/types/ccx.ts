/**
 * CCX (Claude/Codex/Gemini API Proxy) type definitions
 *
 * CCX is a high-performance API proxy server supporting multiple upstream
 * AI providers, failover, multi-key management, and a built-in Web UI.
 * Distributed as GitHub Release binaries.
 */

export interface CcxConfig {
  /** Access key for the proxy, default: 'sk-ccx-kit' */
  PROXY_ACCESS_KEY: string
  /** Port number, default: 3688 */
  PORT: number
  /** Enable Web UI management interface, default: true */
  ENABLE_WEB_UI: boolean
}

export interface CcxInstallStatus {
  isInstalled: boolean
  binaryPath: string | null
  version: string | null
}

export interface CcxServiceStatus {
  running: boolean
  port: number
  pid: number | null
  webUiUrl: string | null
}

export interface CcxReleaseInfo {
  version: string
  downloadUrl: string
}

/**
 * Version source configuration for multi-source fetching
 */
export interface VersionSource {
  /** Source name for logging */
  name: string
  /** URL to fetch version from */
  url: string
  /** Parser function to extract version from response */
  parser: (data: any) => string | null
  /** Request timeout in milliseconds */
  timeout?: number
}

/**
 * Download source configuration for multi-source downloading
 */
export interface DownloadSource {
  /** Source name for logging */
  name: string
  /** Function to generate download URL */
  getUrl: (repo: string, tag: string, assetName: string) => string
  /** Request timeout in milliseconds */
  timeout?: number
}
