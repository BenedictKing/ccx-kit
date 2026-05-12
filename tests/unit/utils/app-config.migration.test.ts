import { renameSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'pathe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    existsSync: vi.fn(),
    renameSync: vi.fn(),
    copyFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    rmSync: vi.fn(),
  }
})

vi.mock('../../../src/utils/json-config', () => ({
  readJsonConfig: vi.fn(),
  writeJsonConfig: vi.fn(),
}))

vi.mock('../../../src/utils/fs-operations', () => ({
  exists: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  ensureDir: vi.fn(),
}))

vi.mock('../../../src/utils/toml-edit', () => ({
  parseToml: vi.fn(),
  stringifyToml: vi.fn(),
  batchEditToml: vi.fn(),
}))

describe('app-config migration', () => {
  const home = homedir()
  const newPath = join(home, '.ccx-kit', 'config.toml')

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns unchanged result when no migration needed', async () => {
    const { existsSync } = await import('node:fs')
    vi.mocked(existsSync).mockReturnValue(false)

    const { migrateAppConfigIfNeeded } = await import('../../../src/utils/app-config')
    const result = migrateAppConfigIfNeeded()

    expect(renameSync).not.toHaveBeenCalled()
    expect(rmSync).not.toHaveBeenCalled()
    expect(result).toEqual({ migrated: false, target: newPath, removed: [] })
  })

  it('returns unchanged result when target already exists', async () => {
    const { existsSync } = await import('node:fs')
    vi.mocked(existsSync).mockImplementation(path => path === newPath)

    const { migrateAppConfigIfNeeded } = await import('../../../src/utils/app-config')
    const result = migrateAppConfigIfNeeded()

    expect(renameSync).not.toHaveBeenCalled()
    expect(result.migrated).toBe(false)
    expect(result.removed).toEqual([])
  })
})
