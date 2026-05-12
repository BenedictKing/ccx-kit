import type { ChannelPreset } from '../../types/channel'

const presets: ChannelPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    kind: 'chat',
    serviceType: 'openai',
    baseUrl: 'https://api.deepseek.com',
    description: 'DeepSeek AI - 高性能推理模型',
    website: 'https://platform.deepseek.com',
    defaultModels: ['deepseek-chat', 'deepseek-reasoner'],
    apiKeyHint: 'https://platform.deepseek.com/api-keys',
  },
  {
    id: 'mimo',
    name: 'MiMo (小米)',
    description: '小米 MiMo AI - 支持多地区集群',
    website: 'https://mimo.xiaomi.com',
    defaultModels: ['mimo-vl-pro'],
    apiKeyHint: 'https://mimo.xiaomi.com',
    variants: [
      {
        id: 'mimo-balance-anthropic',
        name: 'MiMo 余额 (Anthropic 协议)',
        kind: 'messages',
        serviceType: 'claude',
        baseUrl: 'https://api.xiaomimimo.com/anthropic',
        description: '余额用户，Anthropic 兼容协议',
      },
      {
        id: 'mimo-plan-cn-openai',
        name: 'MiMo 订阅 Plan - 中国集群 (OpenAI)',
        kind: 'chat',
        serviceType: 'openai',
        baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
        description: '订阅 Plan 中国集群，OpenAI 兼容协议',
      },
      {
        id: 'mimo-plan-sgp-openai',
        name: 'MiMo 订阅 Plan - 新加坡集群 (OpenAI)',
        kind: 'chat',
        serviceType: 'openai',
        baseUrl: 'https://token-plan-sgp.xiaomimimo.com/v1',
        description: '订阅 Plan 新加坡集群，OpenAI 兼容协议',
      },
      {
        id: 'mimo-plan-ams-openai',
        name: 'MiMo 订阅 Plan - 欧洲集群 (OpenAI)',
        kind: 'chat',
        serviceType: 'openai',
        baseUrl: 'https://token-plan-ams.xiaomimimo.com/v1',
        description: '订阅 Plan 欧洲集群，OpenAI 兼容协议',
      },
      {
        id: 'mimo-plan-cn-anthropic',
        name: 'MiMo 订阅 Plan - 中国集群 (Anthropic)',
        kind: 'messages',
        serviceType: 'claude',
        baseUrl: 'https://token-plan-cn.xiaomimimo.com/anthropic',
        description: '订阅 Plan 中国集群，Anthropic 兼容协议',
      },
      {
        id: 'mimo-plan-sgp-anthropic',
        name: 'MiMo 订阅 Plan - 新加坡集群 (Anthropic)',
        kind: 'messages',
        serviceType: 'claude',
        baseUrl: 'https://token-plan-sgp.xiaomimimo.com/anthropic',
        description: '订阅 Plan 新加坡集群，Anthropic 兼容协议',
      },
      {
        id: 'mimo-plan-ams-anthropic',
        name: 'MiMo 订阅 Plan - 欧洲集群 (Anthropic)',
        kind: 'messages',
        serviceType: 'claude',
        baseUrl: 'https://token-plan-ams.xiaomimimo.com/anthropic',
        description: '订阅 Plan 欧洲集群，Anthropic 兼容协议',
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
    kind: 'chat',
    serviceType: 'openai',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    description: '智谱 AI - GLM 系列模型',
    website: 'https://open.bigmodel.cn',
    defaultModels: ['glm-4-flash', 'glm-4-plus'],
    apiKeyHint: 'https://open.bigmodel.cn/usercenter/apikeys',
  },
  {
    id: 'moonshot',
    name: 'Moonshot Kimi',
    kind: 'chat',
    serviceType: 'openai',
    baseUrl: 'https://api.moonshot.cn/v1',
    description: 'Moonshot AI - Kimi 长上下文模型',
    website: 'https://platform.moonshot.cn',
    defaultModels: ['moonshot-v1-8k', 'moonshot-v1-128k'],
    apiKeyHint: 'https://platform.moonshot.cn/console/api-keys',
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
