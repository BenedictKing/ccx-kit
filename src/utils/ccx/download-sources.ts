import type { DownloadSource } from '../../types/ccx'
import { exec } from 'tinyexec'

const DOWNLOAD_SOURCES: DownloadSource[] = [
  {
    name: 'github-releases',
    getUrl: (repo, tag, assetName) =>
      `https://github.com/${repo}/releases/download/v${tag}/${assetName}`,
    timeout: 30000,
  },
  {
    name: 'github-proxy',
    getUrl: (repo, tag, assetName) =>
      `https://ghproxy.com/https://github.com/${repo}/releases/download/v${tag}/${assetName}`,
    timeout: 25000,
  },
  {
    name: 'github-mirror',
    getUrl: (repo, tag, assetName) =>
      `https://mirror.ghproxy.com/https://github.com/${repo}/releases/download/v${tag}/${assetName}`,
    timeout: 25000,
  },
]

/**
 * Get all download URLs for a CCX asset across all sources
 */
export function getCcxDownloadUrls(repo: string, tag: string, assetName: string): string[] {
  return DOWNLOAD_SOURCES.map(source => source.getUrl(repo, tag, assetName))
}

/**
 * Download CCX binary from multiple sources with fallback.
 * Uses curl so HTTP_PROXY/HTTPS_PROXY are honored for mitmproxy caching.
 */
export async function downloadCcxFromSources(
  repo: string,
  tag: string,
  assetName: string,
  destPath: string,
): Promise<boolean> {
  // Hard caps applied per-source to prevent infinite hangs:
  // - connect-timeout: cap how long curl waits to establish TCP connection
  // - max-time: cap the entire transfer (connect + transfer); a stalled
  //   stream after a successful connect previously hung forever.
  const CONNECT_TIMEOUT_SEC = 15
  const MAX_TIME_SEC = 180
  for (const source of DOWNLOAD_SOURCES) {
    try {
      const url = source.getUrl(repo, tag, assetName)
      await exec(
        'curl',
        [
          '-fL',
          '--connect-timeout',
          String(CONNECT_TIMEOUT_SEC),
          '--max-time',
          String(MAX_TIME_SEC),
          url,
          '-o',
          destPath,
        ],
        // Outer guard in case curl itself wedges; leave headroom over --max-time.
        { timeout: (MAX_TIME_SEC + 10) * 1000 },
      )
      return true
    }
    catch {
      continue
    }
  }

  return false
}
