/**
 * Multi-source version fetching for CCX
 *
 * Provides fallback mechanism to fetch latest version from multiple sources:
 * 1. GitHub Tags API (primary) - Gets latest tag even if no release created
 * 2. GitHub Releases API (fallback) - Gets latest official release
 * 3. GitHub Raw Content (fallback) - Gets version from VERSION file if exists
 *
 * Note: Tags API is prioritized because new versions may be tagged before
 * creating a GitHub Release, and release assets are available immediately
 * after tagging.
 */

import type { VersionSource } from '../../types/ccx'

const CCX_GITHUB_REPO = 'BenedictKing/ccx'

const VERSION_SOURCES: VersionSource[] = [
  {
    name: 'github-tags',
    url: `https://api.github.com/repos/${CCX_GITHUB_REPO}/tags?per_page=1`,
    parser: (data: any) => {
      if (Array.isArray(data) && data.length > 0) {
        const tag = data[0].name || ''
        return tag.startsWith('v') ? tag.slice(1) : tag
      }
      return null
    },
    timeout: 8000,
  },
  {
    name: 'github-api',
    url: `https://api.github.com/repos/${CCX_GITHUB_REPO}/releases/latest`,
    parser: (data: any) => {
      const tag = data.tag_name || ''
      return tag.startsWith('v') ? tag.slice(1) : tag
    },
    timeout: 10000,
  },
  {
    name: 'github-raw',
    url: `https://raw.githubusercontent.com/${CCX_GITHUB_REPO}/main/VERSION`,
    parser: (text: string) => text.trim() || null,
    timeout: 5000,
  },
]

/**
 * Fetch latest CCX version from multiple sources with fallback
 *
 * Tries each source in order until one succeeds. This provides resilience against:
 * - GitHub API rate limiting
 * - Network restrictions in certain regions
 * - Temporary API outages
 *
 * @returns Latest version string or null if all sources fail
 */
export async function getLatestCcxVersionFromSources(): Promise<string | null> {
  for (const source of VERSION_SOURCES) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        source.timeout || 10000,
      )

      const response = await fetch(source.url, {
        signal: controller.signal,
        headers: { Accept: 'application/vnd.github.v3+json' },
      })
      clearTimeout(timeoutId)

      if (!response.ok)
        continue

      const data = source.name === 'github-raw'
        ? await response.text()
        : await response.json()

      const version = source.parser(data)

      if (version) {
        return version
      }
    }
    catch {
      continue
    }
  }

  return null
}
