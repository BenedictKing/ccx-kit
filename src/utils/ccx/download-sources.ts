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
  for (const source of DOWNLOAD_SOURCES) {
    try {
      const url = source.getUrl(repo, tag, assetName)
      await exec('curl', [
        '-fL',
        '--connect-timeout',
        String(Math.ceil((source.timeout || 30000) / 1000)),
        url,
        '-o',
        destPath,
      ])
      return true
    }
    catch {
      continue
    }
  }

  return false
}
