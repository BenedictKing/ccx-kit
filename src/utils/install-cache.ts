import { existsSync } from 'node:fs'
import { copyFile, mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'pathe'

const CACHE_DIR = join(homedir(), '.local', 'share', 'ccx-kit-cache')

/**
 * Map a URL to a local cache path, mirroring the URL structure under CACHE_DIR
 * e.g. https://github.com/foo/bar/v1.0/file → CACHE_DIR/github.com/foo/bar/v1.0/file
 */
export function urlToCachePath(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url)
    if (!hostname)
      return null
    const relPath = decodeURIComponent(pathname.replace(/^\/+/, ''))
    if (!relPath)
      return null
    return join(CACHE_DIR, hostname, relPath)
  }
  catch {
    return null
  }
}

/**
 * Get the cache directory root path
 */
export function getCacheDir(): string {
  return CACHE_DIR
}

/**
 * Check if a URL is already cached, returns the cached file path or null
 */
export function getCachedPath(url: string): string | null {
  const cached = urlToCachePath(url)
  if (!cached)
    return null
  return existsSync(cached) ? cached : null
}

/**
 * Copy a local file into the cache at the given URL's cache path
 */
export async function cacheFile(url: string, srcPath: string): Promise<void> {
  const destPath = urlToCachePath(url)
  if (!destPath)
    return
  await mkdir(join(destPath, '..'), { recursive: true })
  await copyFile(srcPath, destPath)
}

/**
 * Download a URL to the cache directory, returns the cached path or null on failure
 */
export async function downloadToCache(
  url: string,
  timeout = 30000,
): Promise<string | null> {
  const destPath = urlToCachePath(url)
  if (!destPath)
    return null

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok || !response.body) {
      return null
    }

    await mkdir(join(destPath, '..'), { recursive: true })
    const { createWriteStream } = await import('node:fs')
    const { pipeline } = await import('node:stream/promises')
    const { Readable } = await import('node:stream')

    const fileStream = createWriteStream(destPath)
    await pipeline(Readable.fromWeb(response.body as any), fileStream)

    return destPath
  }
  catch {
    return null
  }
}
