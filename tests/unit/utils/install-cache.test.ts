import { existsSync } from 'node:fs'
import { copyFile, mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'pathe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cacheFile, getCacheDir, getCachedPath, urlToCachePath } from '../../../src/utils/install-cache'

vi.mock('node:fs')
vi.mock('node:fs/promises')

const CACHE_DIR = join(homedir(), '.local', 'share', 'ccx-kit-cache')

describe('install-cache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('urlToCachePath', () => {
    it('should map URL to cache path with hostname and path', () => {
      const result = urlToCachePath('https://github.com/BenedictKing/ccx/releases/download/v1.0.0/ccx-linux-arm64')
      expect(result).toBe(join(CACHE_DIR, 'github.com', 'BenedictKing', 'ccx', 'releases', 'download', 'v1.0.0', 'ccx-linux-arm64'))
    })

    it('should map claude.ai install URL', () => {
      const result = urlToCachePath('https://claude.ai/install.sh')
      expect(result).toBe(join(CACHE_DIR, 'claude.ai', 'install.sh'))
    })

    it('should decode percent-encoded paths', () => {
      const result = urlToCachePath('https://example.com/path%20with%20spaces/file')
      expect(result).toBe(join(CACHE_DIR, 'example.com', 'path with spaces', 'file'))
    })

    it('should return null for invalid URLs', () => {
      expect(urlToCachePath('not-a-url')).toBeNull()
    })
  })

  describe('getCacheDir', () => {
    it('should return the cache directory', () => {
      expect(getCacheDir()).toBe(CACHE_DIR)
    })
  })

  describe('getCachedPath', () => {
    it('should return path when cached file exists', () => {
      vi.mocked(existsSync).mockReturnValue(true)
      const result = getCachedPath('https://claude.ai/install.sh')
      expect(result).toBe(join(CACHE_DIR, 'claude.ai', 'install.sh'))
    })

    it('should return null when cached file does not exist', () => {
      vi.mocked(existsSync).mockReturnValue(false)
      expect(getCachedPath('https://claude.ai/install.sh')).toBeNull()
    })
  })

  describe('cacheFile', () => {
    it('should copy file to cache directory', async () => {
      vi.mocked(mkdir).mockResolvedValue(undefined)
      vi.mocked(copyFile).mockResolvedValue(undefined)

      await cacheFile('https://claude.ai/install.sh', '/tmp/install.sh')

      expect(mkdir).toHaveBeenCalledWith(join(CACHE_DIR, 'claude.ai'), { recursive: true })
      expect(copyFile).toHaveBeenCalledWith('/tmp/install.sh', join(CACHE_DIR, 'claude.ai', 'install.sh'))
    })
  })
})
