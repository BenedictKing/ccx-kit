import type { ChannelTestResult } from '../../types/channel'
import { ensureI18nInitialized, i18n } from '../../i18n'

const TEST_PROMPT = 'Reply with exactly: pong'

interface TestOptions {
  port: number
  apiKey: string
  model: string
  timeout?: number
}

/**
 * Test chat endpoint (POST /v1/chat/completions)
 */
async function testChatEndpoint(options: TestOptions): Promise<ChannelTestResult> {
  const { port, apiKey, model, timeout = 15000 } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  const start = Date.now()

  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: TEST_PROMPT }],
        max_tokens: 10,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const latency = Date.now() - start

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return { success: false, latency, error: `HTTP ${response.status}: ${text.slice(0, 200)}` }
    }

    const data = await response.json() as any
    const content = data?.choices?.[0]?.message?.content || ''
    if (!content.toLowerCase().includes('pong')) {
      ensureI18nInitialized()
      return { success: false, latency, error: i18n.t('ccx:channel.testUnexpectedResponse', { content: content.slice(0, 100) }) }
    }

    return { success: true, latency }
  }
  catch (error: any) {
    clearTimeout(timeoutId)
    return { success: false, latency: Date.now() - start, error: error.message }
  }
}

/**
 * Test messages endpoint (POST /v1/messages)
 */
async function testMessagesEndpoint(options: TestOptions): Promise<ChannelTestResult> {
  const { port, apiKey, model, timeout = 15000 } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  const start = Date.now()

  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: TEST_PROMPT }],
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const latency = Date.now() - start

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return { success: false, latency, error: `HTTP ${response.status}: ${text.slice(0, 200)}` }
    }

    const data = await response.json() as any
    const content = data?.content?.[0]?.text || ''
    if (!content.toLowerCase().includes('pong')) {
      ensureI18nInitialized()
      return { success: false, latency, error: i18n.t('ccx:channel.testUnexpectedResponse', { content: content.slice(0, 100) }) }
    }

    return { success: true, latency }
  }
  catch (error: any) {
    clearTimeout(timeoutId)
    return { success: false, latency: Date.now() - start, error: error.message }
  }
}

/**
 * Test responses endpoint (POST /v1/responses)
 */
async function testResponsesEndpoint(options: TestOptions): Promise<ChannelTestResult> {
  const { port, apiKey, model, timeout = 15000 } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  const start = Date.now()

  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: TEST_PROMPT,
        max_output_tokens: 10,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const latency = Date.now() - start

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return { success: false, latency, error: `HTTP ${response.status}: ${text.slice(0, 200)}` }
    }

    const data = await response.json() as any
    const content = data?.output?.[0]?.content?.[0]?.text || ''
    if (!content.toLowerCase().includes('pong')) {
      ensureI18nInitialized()
      return { success: false, latency, error: i18n.t('ccx:channel.testUnexpectedResponse', { content: content.slice(0, 100) }) }
    }

    return { success: true, latency }
  }
  catch (error: any) {
    clearTimeout(timeoutId)
    return { success: false, latency: Date.now() - start, error: error.message }
  }
}

/**
 * Test gemini endpoint (POST /v1beta/models/{model}:generateContent)
 */
async function testGeminiEndpoint(options: TestOptions): Promise<ChannelTestResult> {
  const { port, apiKey, model, timeout = 15000 } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  const start = Date.now()

  try {
    const response = await fetch(`http://127.0.0.1:${port}/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: TEST_PROMPT }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const latency = Date.now() - start

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return { success: false, latency, error: `HTTP ${response.status}: ${text.slice(0, 200)}` }
    }

    const data = await response.json() as any
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    if (!content.toLowerCase().includes('pong')) {
      ensureI18nInitialized()
      return { success: false, latency, error: i18n.t('ccx:channel.testUnexpectedResponse', { content: content.slice(0, 100) }) }
    }

    return { success: true, latency }
  }
  catch (error: any) {
    clearTimeout(timeoutId)
    return { success: false, latency: Date.now() - start, error: error.message }
  }
}

/**
 * Test a channel endpoint by kind
 */
export async function testChannel(
  kind: string,
  port: number,
  apiKey: string,
  model: string,
): Promise<ChannelTestResult> {
  const options = { port, apiKey, model }

  switch (kind) {
    case 'chat': return testChatEndpoint(options)
    case 'messages': return testMessagesEndpoint(options)
    case 'responses': return testResponsesEndpoint(options)
    case 'gemini': return testGeminiEndpoint(options)
    default: return { success: false, latency: 0, error: `Unsupported kind: ${kind}` }
  }
}
