import { describe, expect, it } from 'vitest'
import { getLatestCcxVersionFromSources } from '../../../src/utils/ccx/version-sources'

describe('cCX Version Sources', () => {
  it('should fetch latest version from GitHub tags API', async () => {
    const version = await getLatestCcxVersionFromSources()

    expect(version).toBeTruthy()
    expect(version).toMatch(/^\d+\.\d+\.\d+$/)

    // Should get the latest tag, not just the latest release
    // As of this test, v2.6.86 is the latest tag
    const [major, minor, patch] = version!.split('.').map(Number)
    expect(major).toBeGreaterThanOrEqual(2)
    expect(minor).toBeGreaterThanOrEqual(6)
    expect(patch).toBeGreaterThanOrEqual(86)
  }, 15000) // 15s timeout for network request
})
