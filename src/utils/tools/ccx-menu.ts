import ansis from 'ansis'
import inquirer from 'inquirer'
import { ensureI18nInitialized, i18n } from '../../i18n'
import { addPresetChannel, listChannels } from '../ccx/channel-manager'
import { testChannel } from '../ccx/channel-test'
import {
  getCcxStatus,
  openCcxWebUi,
  restartCcxService,
  startCcxService,
  stopCcxService,
} from '../ccx/commands'
import { configureCcxFeature, readCcxEnv } from '../ccx/config'
import { installCcx, isCcxInstalled } from '../ccx/installer'
import { getAllPresets } from '../ccx/presets'
import { checkAndUpgradeCcx } from '../ccx/upgrade'
import { handleExitPromptError, handleGeneralError } from '../error-handler'
import { promptBoolean } from '../toggle-prompt'

// Helper function to check if CCX is properly configured
function isCcxConfigured(): boolean {
  const config = readCcxEnv()
  return config !== null
}

export async function showCcxMenu(): Promise<boolean> {
  try {
    // Initialize i18next
    ensureI18nInitialized()

    // Display CCX menu title
    console.log(`\n${ansis.cyan('═'.repeat(50))}`)
    console.log(ansis.bold.cyan(`  ${i18n.t('ccx:ccxMenuTitle')}`))
    console.log(`${ansis.cyan('═'.repeat(50))}\n`)

    // Display menu options
    console.log(`  ${ansis.cyan('1.')} ${i18n.t('ccx:ccxMenuOptions.initCcx')} ${ansis.gray(`- ${i18n.t('ccx:ccxMenuDescriptions.initCcx')}`)}`)
    console.log(`  ${ansis.cyan('2.')} ${i18n.t('ccx:ccxMenuOptions.openWebUi')} ${ansis.gray(`- ${i18n.t('ccx:ccxMenuDescriptions.openWebUi')}`)}`)
    console.log(`  ${ansis.cyan('3.')} ${i18n.t('ccx:ccxMenuOptions.checkStatus')} ${ansis.gray(`- ${i18n.t('ccx:ccxMenuDescriptions.checkStatus')}`)}`)
    console.log(`  ${ansis.cyan('4.')} ${i18n.t('ccx:ccxMenuOptions.restart')} ${ansis.gray(`- ${i18n.t('ccx:ccxMenuDescriptions.restart')}`)}`)
    console.log(`  ${ansis.cyan('5.')} ${i18n.t('ccx:ccxMenuOptions.start')} ${ansis.gray(`- ${i18n.t('ccx:ccxMenuDescriptions.start')}`)}`)
    console.log(`  ${ansis.cyan('6.')} ${i18n.t('ccx:ccxMenuOptions.stop')} ${ansis.gray(`- ${i18n.t('ccx:ccxMenuDescriptions.stop')}`)}`)
    console.log(`  ${ansis.cyan('7.')} ${i18n.t('ccx:ccxMenuOptions.addPresetChannel')} ${ansis.gray(`- ${i18n.t('ccx:ccxMenuDescriptions.addPresetChannel')}`)}`)
    console.log(`  ${ansis.cyan('8.')} ${i18n.t('ccx:ccxMenuOptions.testChannel')} ${ansis.gray(`- ${i18n.t('ccx:ccxMenuDescriptions.testChannel')}`)}`)
    console.log(`  ${ansis.cyan('9.')} ${i18n.t('ccx:ccxMenuOptions.upgradeCcx')} ${ansis.gray(`- ${i18n.t('ccx:ccxMenuDescriptions.upgradeCcx')}`)}`)
    console.log(`  ${ansis.yellow('0.')} ${i18n.t('ccx:ccxMenuOptions.back')}`)
    console.log('')

    // Get user choice
    const { choice } = await inquirer.prompt<{ choice: string }>({
      type: 'input',
      name: 'choice',
      message: i18n.t('common:enterChoice'),
      validate: (value) => {
        const valid = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
        return valid.includes(value) || i18n.t('common:invalidChoice')
      },
    })

    // Handle menu selection
    switch (choice) {
      case '1': {
        // Initialize CCX
        const ccxStatus = await isCcxInstalled()
        if (!ccxStatus.isInstalled) {
          await installCcx()
        }
        else {
          console.log(ansis.green(`✔ ${i18n.t('ccx:ccxAlreadyInstalled')}`))
        }
        await configureCcxFeature()
        console.log(ansis.green(`\n✔ ${i18n.t('ccx:ccxSetupComplete')}`))
        break
      }

      case '2':
        // Open Web UI - Check if CCX is configured first
        if (!isCcxConfigured()) {
          console.log(ansis.yellow(`\n⚠️  ${i18n.t('ccx:ccxNotConfigured')}`))
          console.log(ansis.cyan(`   ${i18n.t('ccx:pleaseInitFirst')}\n`))
        }
        else {
          await openCcxWebUi()
        }
        break

      case '3': {
        // Check CCX Status
        if (!isCcxConfigured()) {
          console.log(ansis.yellow(`\n⚠️  ${i18n.t('ccx:ccxNotConfigured')}`))
          console.log(ansis.cyan(`   ${i18n.t('ccx:pleaseInitFirst')}\n`))
        }
        else {
          const status = await getCcxStatus()
          console.log(`\n${ansis.bold(i18n.t('ccx:ccxStatusTitle'))}`)
          console.log(`  ${i18n.t('ccx:statusRunning')}: ${status.running ? ansis.green('✔') : ansis.red('✖')}`)
          console.log(`  ${i18n.t('ccx:statusPort')}: ${status.port}`)
          if (status.pid)
            console.log(`  PID: ${status.pid}`)
          if (status.webUiUrl)
            console.log(`  Web UI: ${ansis.cyan(status.webUiUrl)}`)
        }
        break
      }

      case '4':
        // Restart CCX
        if (!isCcxConfigured()) {
          console.log(ansis.yellow(`\n⚠️  ${i18n.t('ccx:ccxNotConfigured')}`))
          console.log(ansis.cyan(`   ${i18n.t('ccx:pleaseInitFirst')}\n`))
        }
        else {
          await restartCcxService()
        }
        break

      case '5':
        // Start CCX
        if (!isCcxConfigured()) {
          console.log(ansis.yellow(`\n⚠️  ${i18n.t('ccx:ccxNotConfigured')}`))
          console.log(ansis.cyan(`   ${i18n.t('ccx:pleaseInitFirst')}\n`))
        }
        else {
          await startCcxService()
        }
        break

      case '6':
        // Stop CCX
        if (!isCcxConfigured()) {
          console.log(ansis.yellow(`\n⚠️  ${i18n.t('ccx:ccxNotConfigured')}`))
          console.log(ansis.cyan(`   ${i18n.t('ccx:pleaseInitFirst')}\n`))
        }
        else {
          await stopCcxService()
        }
        break

      case '7': {
        // Add preset channel
        await handleAddPresetChannel()
        break
      }

      case '8': {
        // Test channel
        await handleTestChannel()
        break
      }

      case '9': {
        // Upgrade CCX
        await checkAndUpgradeCcx()
        break
      }

      case '0':
        // Back to main menu
        return false
    }

    // Ask if user wants to continue in CCX menu
    if (choice !== '0') {
      console.log(`\n${ansis.dim('─'.repeat(50))}\n`)
      const continueInCcx = await promptBoolean({
        message: i18n.t('common:returnToMenu'),
        defaultValue: true,
      })

      if (continueInCcx) {
        return await showCcxMenu()
      }
    }

    return false
  }
  catch (error) {
    if (!handleExitPromptError(error)) {
      handleGeneralError(error)
    }
    return false
  }
}

/**
 * Handle adding a preset channel
 */
async function handleAddPresetChannel(): Promise<void> {
  const presets = getAllPresets()

  const { presetId } = await inquirer.prompt<{ presetId: string }>({
    type: 'list',
    name: 'presetId',
    message: i18n.t('ccx:presets.selectPrompt'),
    choices: presets.map(p => ({
      name: `${p.name} - ${ansis.gray(p.description)}`,
      value: p.id,
    })),
  })

  const preset = presets.find(p => p.id === presetId)!
  let variant

  // If preset has variants, ask user to select one
  if (preset.variants && preset.variants.length > 0) {
    const { variantId } = await inquirer.prompt<{ variantId: string }>({
      type: 'list',
      name: 'variantId',
      message: i18n.t('ccx:presets.selectVariant'),
      choices: preset.variants.map(v => ({
        name: `${v.name}${v.description ? ` - ${ansis.gray(v.description)}` : ''}`,
        value: v.id,
      })),
    })
    variant = preset.variants.find(v => v.id === variantId)
  }

  // Prompt for API key
  console.log(ansis.gray(i18n.t('ccx:presets.enterApiKeyHint', { url: preset.apiKeyHint })))
  const { apiKey } = await inquirer.prompt<{ apiKey: string }>({
    type: 'password',
    name: 'apiKey',
    message: i18n.t('ccx:presets.enterApiKey'),
    mask: '*',
  })

  if (!apiKey) {
    console.log(ansis.yellow(i18n.t('common:cancelled')))
    return
  }

  const result = await addPresetChannel(preset, [apiKey], variant)
  if (result.success) {
    console.log(ansis.green(i18n.t('ccx:presets.addSuccess')))
  }
  else {
    console.log(ansis.red(i18n.t('ccx:presets.addFailed', { error: result.error || '' })))
  }
}

/**
 * Handle testing a channel
 */
async function handleTestChannel(): Promise<void> {
  const channels = await listChannels('chat')

  if (channels.length === 0) {
    console.log(ansis.yellow(i18n.t('ccx:channel.noChannels')))
    return
  }

  const { channelIndex } = await inquirer.prompt<{ channelIndex: number }>({
    type: 'list',
    name: 'channelIndex',
    message: i18n.t('ccx:channel.selectChannel'),
    choices: channels.map((ch, i) => ({
      name: `${ch.name} (${ch.baseUrl})`,
      value: i,
    })),
  })

  const channel = channels[channelIndex]
  const defaultModel = channel.supportedModels?.[0] || 'deepseek-chat'

  const { model } = await inquirer.prompt<{ model: string }>({
    type: 'input',
    name: 'model',
    message: i18n.t('ccx:channel.selectModel'),
    default: defaultModel,
  })

  const config = readCcxEnv()
  const port = config?.PORT || 3688
  const apiKey = channel.apiKeys?.[0] || config?.PROXY_ACCESS_KEY || ''

  console.log(ansis.cyan(i18n.t('ccx:channel.testRunning')))
  const result = await testChannel('chat', port, apiKey, model)

  if (result.success) {
    console.log(ansis.green(i18n.t('ccx:channel.testSuccess', { latency: String(result.latency) })))
  }
  else {
    console.log(ansis.red(i18n.t('ccx:channel.testFailed', { error: result.error || '' })))
  }
}
