/**
 * Multi-source download for CCX binary
 *
 * Provides fallback mechanism to download CCX binary from multiple sources:
 * 1. GitHub Releases (primary)
 * 2. GitHub Proxy (ghproxy.com - acceleration for China)
 * 3. GitHub Mirror (mirror.ghproxy.com - backup proxy)
 */

import type { DownloadSource } from '../../types/ccx'
import { createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

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
 * Download CCX binary from multiple sources with fallback
 *
 * Tries each source in order until one succeeds. This provides resilience against:
 * - GitHub CDN issues
 * - Network restrictions in certain regions
 * - Download failures due to temporary outages
 *
 * @param repo - GitHub repository (e.g., 'BenedictKing/ccx')
 * @param tag - Release tag (e.g., '1.0.0')
 * @param assetName - Binary asset filename
 * @param destPath - Destination file path
 * @returns true if download succeeded, false if all sources failed
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

      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        source.timeout || 30000,
      )

      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok || !response.body) {
        continue
      }

      const fileStream = createWriteStream(destPath)
      await pipeline(Readable.fromWeb(response.body as any), fileStream)

      return true
    }
    catch {
      continue
    }
  }

  return false
}
