/**
 * CCX (Claude/Codex/Gemini API Proxy) type definitions
 *
 * CCX is a high-performance API proxy server supporting multiple upstream
 * AI providers, failover, multi-key management, and a built-in Web UI.
 * Distributed as GitHub Release binaries.
 */

export interface CcxConfig {
  /** Access key for the proxy, default: 'sk-zcf-x-ccx' */
  PROXY_ACCESS_KEY: string
  /** Port number, default: 3000 */
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
