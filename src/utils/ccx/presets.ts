import type { ChannelPreset } from '../../types/channel'

const presets: ChannelPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek AI - 高性能推理模型',
    website: 'https://platform.deepseek.com',
    defaultModels: ['deepseek-v4-pro', 'deepseek-v4-flash'],
    apiKeyHint: 'https://platform.deepseek.com/api-keys',
    variants: [
      {
        id: 'deepseek-openai',
        name: 'DeepSeek (Codex)',
        kind: 'responses',
        serviceType: 'openai',
        baseUrl: 'https://api.deepseek.com',
        description: 'Responses 协议，适用于 Codex',
        modelMapping: {
          gpt: 'deepseek-v4-pro',
          mini: 'deepseek-v4-flash',
        },
        normalizeNonstandardChatRoles: true,
      },
      {
        id: 'deepseek-anthropic',
        name: 'DeepSeek (Anthropic 协议 / Claude Code)',
        kind: 'messages',
        serviceType: 'claude',
        baseUrl: 'https://api.deepseek.com/anthropic',
        description: 'Anthropic 兼容协议，适用于 Claude Code',
        modelMapping: {
          haiku: 'deepseek-v4-flash',
          opus: 'deepseek-v4-pro',
          sonnet: 'deepseek-v4-pro',
        },
      },
      {
        id: 'deepseek-gemini',
        name: 'DeepSeek (Gemini CLI)',
        kind: 'gemini',
        serviceType: 'openai',
        baseUrl: 'https://api.deepseek.com',
        description: 'Gemini 协议入口，适用于 @google/gemini-cli',
        modelMapping: {
          pro: 'deepseek-v4-pro',
          flash: 'deepseek-v4-flash',
        },
      },
    ],
  },
  {
    id: 'mimo',
    name: 'MiMo (小米)',
    description: '小米 MiMo AI - 支持多地区集群',
    website: 'https://mimo.xiaomi.com',
    defaultModels: ['mimo-v2.5-pro'],
    apiKeyHint: 'https://mimo.xiaomi.com',
    variants: [
      {
        id: 'mimo-balance-anthropic',
        name: 'MiMo 余额 (Anthropic 协议)',
        kind: 'messages',
        serviceType: 'claude',
        baseUrl: 'https://api.xiaomimimo.com/anthropic',
        description: '余额用户，Anthropic 兼容协议',
        modelMapping: {
          haiku: 'mimo-v2.5-pro',
          opus: 'mimo-v2.5-pro',
          sonnet: 'mimo-v2.5-pro',
        },
      },
      {
        id: 'mimo-plan-cn-openai',
        name: 'MiMo 订阅 Plan - 中国集群 (Codex)',
        kind: 'responses',
        serviceType: 'openai',
        baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
        description: '订阅 Plan 中国集群，OpenAI 兼容协议',
        modelMapping: {
          gpt: 'mimo-v2.5-pro',
          mini: 'mimo-v2.5-pro',
        },
      },
      {
        id: 'mimo-plan-sgp-openai',
        name: 'MiMo 订阅 Plan - 新加坡集群 (Codex)',
        kind: 'responses',
        serviceType: 'openai',
        baseUrl: 'https://token-plan-sgp.xiaomimimo.com/v1',
        description: '订阅 Plan 新加坡集群，OpenAI 兼容协议',
        modelMapping: {
          gpt: 'mimo-v2.5-pro',
          mini: 'mimo-v2.5-pro',
        },
      },
      {
        id: 'mimo-plan-ams-openai',
        name: 'MiMo 订阅 Plan - 欧洲集群 (Codex)',
        kind: 'responses',
        serviceType: 'openai',
        baseUrl: 'https://token-plan-ams.xiaomimimo.com/v1',
        description: '订阅 Plan 欧洲集群，OpenAI 兼容协议',
        modelMapping: {
          gpt: 'mimo-v2.5-pro',
          mini: 'mimo-v2.5-pro',
        },
      },
      {
        id: 'mimo-plan-cn-anthropic',
        name: 'MiMo 订阅 Plan - 中国集群 (Anthropic)',
        kind: 'messages',
        serviceType: 'claude',
        baseUrl: 'https://token-plan-cn.xiaomimimo.com/anthropic',
        description: '订阅 Plan 中国集群，Anthropic 兼容协议',
        modelMapping: {
          haiku: 'mimo-v2.5-pro',
          opus: 'mimo-v2.5-pro',
          sonnet: 'mimo-v2.5-pro',
        },
      },
      {
        id: 'mimo-plan-sgp-anthropic',
        name: 'MiMo 订阅 Plan - 新加坡集群 (Anthropic)',
        kind: 'messages',
        serviceType: 'claude',
        baseUrl: 'https://token-plan-sgp.xiaomimimo.com/anthropic',
        description: '订阅 Plan 新加坡集群，Anthropic 兼容协议',
        modelMapping: {
          haiku: 'mimo-v2.5-pro',
          opus: 'mimo-v2.5-pro',
          sonnet: 'mimo-v2.5-pro',
        },
      },
      {
        id: 'mimo-plan-ams-anthropic',
        name: 'MiMo 订阅 Plan - 欧洲集群 (Anthropic)',
        kind: 'messages',
        serviceType: 'claude',
        baseUrl: 'https://token-plan-ams.xiaomimimo.com/anthropic',
        description: '订阅 Plan 欧洲集群，Anthropic 兼容协议',
        modelMapping: {
          haiku: 'mimo-v2.5-pro',
          opus: 'mimo-v2.5-pro',
          sonnet: 'mimo-v2.5-pro',
        },
      },
    ],
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow 硅基流动',
    kind: 'chat',
    serviceType: 'openai',
    baseUrl: 'https://api.siliconflow.cn/v1',
    description: '硅基流动 - 聚合多家开源模型',
    website: 'https://siliconflow.cn',
    defaultModels: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-72B-Instruct'],
    apiKeyHint: 'https://cloud.siliconflow.cn/account/ak',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    kind: 'chat',
    serviceType: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    description: 'OpenRouter - 统一访问多家模型',
    website: 'https://openrouter.ai',
    defaultModels: ['anthropic/claude-sonnet-4', 'deepseek/deepseek-chat'],
    apiKeyHint: 'https://openrouter.ai/keys',
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    description: '智谱 AI - GLM 系列模型',
    website: 'https://open.bigmodel.cn',
    defaultModels: ['glm-5.1'],
    apiKeyHint: 'https://open.bigmodel.cn/usercenter/apikeys',
    variants: [
      {
        id: 'zhipu-coding-openai',
        name: '智谱 GLM Coding (Codex)',
        kind: 'responses',
        serviceType: 'openai',
        baseUrl: 'https://open.bigmodel.cn/api/coding/paas/v4#',
        description: 'Coding 端点，适用于 Codex',
        modelMapping: {
          gpt: 'glm-5.1',
          mini: 'glm-5.1',
        },
      },
      {
        id: 'zhipu-coding-anthropic',
        name: '智谱 GLM Coding (Claude Code)',
        kind: 'messages',
        serviceType: 'openai',
        baseUrl: 'https://open.bigmodel.cn/api/coding/paas/v4#',
        description: 'Coding 端点，适用于 Claude Code',
        modelMapping: {
          haiku: 'glm-5.1',
          opus: 'glm-5.1',
          sonnet: 'glm-5.1',
        },
      },
    ],
  },
  {
    id: 'kimi-code',
    name: 'Kimi Code',
    description: 'Kimi Code - 会员订阅制编码模型',
    website: 'https://kimi.moonshot.cn',
    defaultModels: ['kimi-for-coding'],
    apiKeyHint: 'Kimi Code 控制台获取 API Key',
    variants: [
      {
        id: 'kimi-code-openai',
        name: 'Kimi Code (Codex)',
        kind: 'responses',
        serviceType: 'openai',
        baseUrl: 'https://api.kimi.com/coding/v1',
        description: 'Responses 协议，适用于 Codex',
        modelMapping: {
          gpt: 'kimi-for-coding',
          mini: 'kimi-for-coding',
        },
      },
      {
        id: 'kimi-code-anthropic',
        name: 'Kimi Code (Anthropic 协议 / Claude Code)',
        kind: 'messages',
        serviceType: 'claude',
        baseUrl: 'https://api.kimi.com/coding/',
        description: 'Anthropic 兼容协议，适用于 Claude Code',
        modelMapping: {
          haiku: 'kimi-for-coding',
          opus: 'kimi-for-coding',
          sonnet: 'kimi-for-coding',
        },
      },
    ],
  },
  {
    id: 'moonshot',
    name: 'Kimi 开放平台',
    kind: 'chat',
    serviceType: 'openai',
    baseUrl: 'https://api.moonshot.cn/v1',
    description: 'Kimi 开放平台 - 按量付费',
    website: 'https://platform.moonshot.cn',
    defaultModels: ['kimi-k2.6'],
    apiKeyHint: 'https://platform.moonshot.cn/console/api-keys',
    modelMapping: {
      gpt: 'kimi-k2.6',
      mini: 'kimi-k2.6',
    },
  },
]

/**
 * Get all available channel presets
 */
export function getAllPresets(): ChannelPreset[] {
  return presets
}

/**
 * Get a preset by ID
 */
export function getPresetById(id: string): ChannelPreset | undefined {
  return presets.find(p => p.id === id)
}
