import { homedir } from 'node:os'
import { join } from 'pathe'

// Gemini CLI configuration paths
export const GEMINI_DIR = join(homedir(), '.gemini')
export const GEMINI_SETTINGS_FILE = join(GEMINI_DIR, 'settings.json')
export const GEMINI_MD_FILE = join(GEMINI_DIR, 'GEMINI.md')

/**
 * Get the command name for Gemini CLI
 */
export function getGeminiCommand(): string {
  return 'gemini'
}

/**
 * Get the npm package name for Gemini CLI
 */
export function getGeminiPackageName(): string {
  return '@google/gemini-cli'
}
