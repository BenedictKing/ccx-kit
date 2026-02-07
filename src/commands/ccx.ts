import { displayBannerWithInfo } from '../utils/banner'
import { handleExitPromptError, handleGeneralError } from '../utils/error-handler'
import { showCcxMenu } from '../utils/tools/ccx-menu'
import { showMainMenu } from './menu'

export interface CcxOptions {
  skipBanner?: boolean
}

export async function ccx(options: CcxOptions = {}): Promise<void> {
  try {
    // Display banner if not skipped
    if (!options.skipBanner) {
      displayBannerWithInfo()
    }

    // Show CCX menu
    const continueInCcx = await showCcxMenu()

    // If user selected back (0) and not called from main menu, show main menu
    if (!continueInCcx && !options.skipBanner) {
      await showMainMenu()
    }
  }
  catch (error) {
    if (!handleExitPromptError(error)) {
      handleGeneralError(error)
    }
  }
}
