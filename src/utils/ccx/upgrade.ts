import { copyFileSync, existsSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import ansis from 'ansis'
import dayjs from 'dayjs'
import { join } from 'pathe'
import semver from 'semver'
import { ensureI18nInitialized, i18n } from '../../i18n'
import { promptBoolean } from '../toggle-prompt'
import { isCcxRunning, restartCcxService, stopCcxService } from './commands'
import { getCcxVersion, getLatestCcxVersion, installCcx } from './installer'

const CCX_INSTALL_DIR = join(homedir(), '.local', 'bin')
const CCX_BINARY_NAME = platform() === 'win32' ? 'ccx.exe' : 'ccx'
const CCX_BINARY_PATH = join(CCX_INSTALL_DIR, CCX_BINARY_NAME)

/**
 * Check for CCX updates and upgrade if available
 */
export async function checkAndUpgradeCcx(): Promise<boolean> {
  ensureI18nInitialized()

  const currentVersion = await getCcxVersion()
  const latestVersion = await getLatestCcxVersion()

  if (!currentVersion) {
    console.log(ansis.yellow(i18n.t('ccx:upgrade.notInstalled')))
    return false
  }

  if (!latestVersion) {
    console.log(ansis.red(i18n.t('ccx:upgrade.checkFailed')))
    return false
  }

  console.log(ansis.cyan(`${i18n.t('ccx:upgrade.currentVersion')}: ${currentVersion}`))
  console.log(ansis.cyan(`${i18n.t('ccx:upgrade.latestVersion')}: ${latestVersion}`))

  if (!semver.gt(latestVersion, currentVersion)) {
    console.log(ansis.green(i18n.t('ccx:upgrade.upToDate')))
    return false
  }

  const confirm = await promptBoolean({
    message: i18n.t('ccx:upgrade.confirmUpgrade'),
    defaultValue: true,
  })

  if (!confirm) {
    console.log(ansis.yellow(i18n.t('common:cancelled')))
    return false
  }

  // Stop service if running
  const wasRunning = await isCcxRunning()
  if (wasRunning) {
    console.log(ansis.cyan(i18n.t('ccx:upgrade.stopping')))
    await stopCcxService()
  }

  // Backup binary
  const backupPath = `${CCX_BINARY_PATH}.bak.${dayjs().format('YYYY-MM-DDTHH-mm-ss')}`
  if (existsSync(CCX_BINARY_PATH)) {
    try {
      copyFileSync(CCX_BINARY_PATH, backupPath)
      console.log(ansis.gray(`${i18n.t('ccx:upgrade.backupCreated')}: ${backupPath}`))
    }
    catch (error: any) {
      console.log(ansis.red(`${i18n.t('ccx:upgrade.backupFailed')}: ${error.message}`))
    }
  }

  // Download and install new version
  try {
    console.log(ansis.cyan(i18n.t('ccx:upgrade.downloading')))
    await installCcx()

    const newVersion = await getCcxVersion()
    if (newVersion && semver.gt(newVersion, currentVersion)) {
      console.log(ansis.green(`${i18n.t('ccx:upgrade.success')}: ${currentVersion} -> ${newVersion}`))

      // Restart if it was running
      if (wasRunning) {
        await restartCcxService()
      }
      return true
    }
    else {
      throw new Error('Version verification failed after upgrade')
    }
  }
  catch (error: any) {
    console.log(ansis.red(`${i18n.t('ccx:upgrade.failed')}: ${error.message}`))

    // Rollback
    if (existsSync(backupPath)) {
      console.log(ansis.yellow(i18n.t('ccx:upgrade.rollback')))
      try {
        copyFileSync(backupPath, CCX_BINARY_PATH)
        if (wasRunning) {
          await restartCcxService()
        }
        console.log(ansis.green(i18n.t('ccx:upgrade.rollbackSuccess')))
      }
      catch (rollbackError: any) {
        console.log(ansis.red(`${i18n.t('ccx:upgrade.rollbackFailed')}: ${rollbackError.message}`))
      }
    }

    return false
  }
}
