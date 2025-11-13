/**
 * 大模型API配置
 * 支持多种大模型API提供商
 */
require('dotenv').config();

// 支持的API提供商类型
const PROVIDERS = {
  OPENAI: 'openai',
  BAIDU: 'baidu',      // 文心一言
  ALIBABA: 'alibaba',  // 通义千问
  CUSTOM: 'custom'     // 自定义API
};

// 默认配置
const defaultConfig = {
  provider: process.env.LLM_PROVIDER || PROVIDERS.OPENAI,
  enabled: process.env.LLM_ENABLED === 'true',
  apiKey: process.env.LLM_API_KEY || '',
  apiUrl: process.env.LLM_API_URL || '',
  model: process.env.LLM_MODEL || '',
  temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.7,
  maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 2000,
  timeout: parseInt(process.env.LLM_TIMEOUT) || 30000
};

// 不同提供商的默认配置
const providerConfigs = {
  [PROVIDERS.OPENAI]: {
    // 默认URL，如果环境变量设置了LLM_API_URL则使用环境变量的值
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
    getHeaders: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    // OpenAI API 请求格式
    buildRequest: (messages, config) => ({
      model: config.model,
      messages: messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens
    }),
    // OpenAI API 响应解析
    parseResponse: (data) => {
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      }
      throw new Error('OpenAI API返回格式异常');
    }
  },
  
  [PROVIDERS.BAIDU]: {
    apiUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
    model: 'ernie-bot-turbo',
    getHeaders: (apiKey) => ({
      'Content-Type': 'application/json'
      // 注意：百度API需要access_token，这里需要额外处理
    }),
    // 百度文心一言 API 请求格式
    buildRequest: (messages, config) => {
      // 百度API需要access_token，这里简化处理
      // 实际使用时需要先获取access_token
      return {
        messages: messages,
        temperature: config.temperature,
        max_output_tokens: config.maxTokens
      };
    },
    // 百度文心一言 API 响应解析
    parseResponse: (data) => {
      if (data.result) {
        return data.result;
      }
      throw new Error('百度API返回格式异常');
    }
  },
  
  [PROVIDERS.ALIBABA]: {
    apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    model: 'qwen-turbo',
    getHeaders: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    // 阿里通义千问 API 请求格式
    buildRequest: (messages, config) => ({
      model: config.model,
      input: {
        messages: messages
      },
      parameters: {
        temperature: config.temperature,
        max_tokens: config.maxTokens
      }
    }),
    // 阿里通义千问 API 响应解析
    parseResponse: (data) => {
      if (data.output && data.output.choices && data.output.choices.length > 0) {
        return data.output.choices[0].message.content;
      }
      throw new Error('阿里API返回格式异常');
    }
  },
  
  [PROVIDERS.CUSTOM]: {
    apiUrl: defaultConfig.apiUrl || '',
    model: defaultConfig.model || '',
    getHeaders: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    // 自定义API请求格式（兼容OpenAI格式）
    buildRequest: (messages, config) => ({
      model: config.model,
      messages: messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens
    }),
    // 自定义API响应解析（兼容OpenAI格式）
    parseResponse: (data) => {
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      }
      throw new Error('自定义API返回格式异常');
    }
  }
};

/**
 * 获取当前提供商的配置
 */
const getProviderConfig = () => {
  const provider = defaultConfig.provider;
  const baseConfig = providerConfigs[provider];
  
  if (!baseConfig) {
    throw new Error(`不支持的API提供商: ${provider}`);
  }
  
  // 处理API URL：如果用户提供的是基础URL（不包含/chat/completions），自动添加
  let apiUrl = defaultConfig.apiUrl || baseConfig.apiUrl;
  if (apiUrl && !apiUrl.includes('/chat/completions') && provider === PROVIDERS.OPENAI) {
    // 确保URL以/结尾，然后添加chat/completions
    apiUrl = apiUrl.replace(/\/$/, '') + '/chat/completions';
  }
  
  return {
    ...baseConfig,
    apiUrl: apiUrl,
    model: defaultConfig.model || baseConfig.model,
    apiKey: defaultConfig.apiKey,
    temperature: defaultConfig.temperature,
    maxTokens: defaultConfig.maxTokens,
    timeout: defaultConfig.timeout
  };
};

/**
 * 获取配置
 */
const getConfig = () => {
  return {
    ...defaultConfig,
    providerConfig: getProviderConfig()
  };
};

module.exports = {
  PROVIDERS,
  getConfig,
  getProviderConfig,
  defaultConfig
};

