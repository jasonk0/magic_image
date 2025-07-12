// 环境变量 API 配置管理
// 用于从环境变量中加载预配置的 API 设置

export interface ApiConfig {
  name: string;
  apiKey: string;
  baseUrl: string;
  modelName?: string;
  type: 'openai' | 'azure' | 'anthropic' | 'google' | 'custom' | 'stability' | 'midjourney';
  description: string;
  enabled: boolean;
}

// 从环境变量获取 API 配置
export function getEnvApiConfigs(): ApiConfig[] {
  const configs: ApiConfig[] = [];

  // OpenAI 配置
  if (process.env.OPENAI_API_KEY) {
    configs.push({
      name: 'OpenAI (环境变量)',
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      type: 'openai',
      description: '从环境变量加载的 OpenAI API 配置',
      enabled: true,
    });
  }

  // Azure OpenAI 配置
  if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
    configs.push({
      name: 'Azure OpenAI (环境变量)',
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseUrl: process.env.AZURE_OPENAI_ENDPOINT,
      type: 'azure',
      description: `从环境变量加载的 Azure OpenAI 配置 (API版本: ${process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'})`,
      enabled: true,
    });
  }

  // Anthropic Claude 配置
  if (process.env.ANTHROPIC_API_KEY) {
    configs.push({
      name: 'Anthropic Claude (环境变量)',
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
      type: 'anthropic',
      description: '从环境变量加载的 Anthropic Claude API 配置',
      enabled: true,
    });
  }

  // Google Gemini 配置
  if (process.env.GOOGLE_API_KEY) {
    configs.push({
      name: 'Google Gemini (环境变量)',
      apiKey: process.env.GOOGLE_API_KEY,
      baseUrl: process.env.GOOGLE_BASE_URL || 'https://generativelanguage.googleapis.com/v1',
      type: 'google',
      description: '从环境变量加载的 Google Gemini API 配置',
      enabled: true,
    });
  }

  // 自定义 API 配置
  if (process.env.CUSTOM_API_KEY && process.env.CUSTOM_BASE_URL) {
    configs.push({
      name: process.env.CUSTOM_MODEL_NAME || '自定义 API (环境变量)',
      apiKey: process.env.CUSTOM_API_KEY,
      baseUrl: process.env.CUSTOM_BASE_URL,
      modelName: process.env.CUSTOM_MODEL_NAME,
      type: 'custom',
      description: '从环境变量加载的自定义 API 配置',
      enabled: true,
    });
  }

  // Stability AI 配置
  if (process.env.STABILITY_API_KEY) {
    configs.push({
      name: 'Stability AI (环境变量)',
      apiKey: process.env.STABILITY_API_KEY,
      baseUrl: process.env.STABILITY_BASE_URL || 'https://api.stability.ai',
      type: 'stability',
      description: '从环境变量加载的 Stability AI 配置',
      enabled: true,
    });
  }

  // Midjourney API 配置
  if (process.env.MIDJOURNEY_API_KEY && process.env.MIDJOURNEY_BASE_URL) {
    configs.push({
      name: 'Midjourney (环境变量)',
      apiKey: process.env.MIDJOURNEY_API_KEY,
      baseUrl: process.env.MIDJOURNEY_BASE_URL,
      type: 'midjourney',
      description: '从环境变量加载的 Midjourney API 配置',
      enabled: true,
    });
  }

  return configs;
}

// 检查是否有环境变量配置的 API
export function hasEnvApiConfigs(): boolean {
  return getEnvApiConfigs().length > 0;
}

// 获取特定类型的环境变量 API 配置
export function getEnvApiConfigByType(type: ApiConfig['type']): ApiConfig | null {
  const configs = getEnvApiConfigs();
  return configs.find(config => config.type === type) || null;
}

// 合并环境变量配置和用户配置
export function mergeApiConfigs(userConfigs: ApiConfig[]): ApiConfig[] {
  const envConfigs = getEnvApiConfigs();
  const merged = [...envConfigs];

  // 添加用户配置，但避免重复
  userConfigs.forEach(userConfig => {
    const exists = envConfigs.some(envConfig => 
      envConfig.type === userConfig.type && 
      envConfig.baseUrl === userConfig.baseUrl
    );
    
    if (!exists) {
      merged.push(userConfig);
    }
  });

  return merged;
}

// 验证 API 配置
export function validateApiConfig(config: ApiConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.name?.trim()) {
    errors.push('API 名称不能为空');
  }

  if (!config.apiKey?.trim()) {
    errors.push('API Key 不能为空');
  }

  if (!config.baseUrl?.trim()) {
    errors.push('API 地址不能为空');
  } else {
    try {
      new URL(config.baseUrl);
    } catch {
      errors.push('API 地址格式不正确');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// 获取环境变量配置的摘要信息
export function getEnvConfigSummary(): string {
  const configs = getEnvApiConfigs();
  
  if (configs.length === 0) {
    return '未检测到环境变量中的 API 配置';
  }

  const summary = configs.map(config => {
    const maskedKey = config.apiKey.substring(0, 8) + '...';
    return `${config.name}: ${maskedKey}`;
  }).join(', ');

  return `检测到 ${configs.length} 个环境变量 API 配置: ${summary}`;
}
