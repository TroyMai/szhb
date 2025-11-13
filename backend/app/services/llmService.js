/**
 * 大模型API服务
 * 统一管理不同提供商的大模型API调用
 */
const llmConfig = require('../../config/llmConfig');

/**
 * 调用大模型API
 * @param {string} prompt - 提示词
 * @param {Object} options - 可选参数
 * @returns {Promise<string>} 分析结果
 */
const callLLM = async (prompt, options = {}) => {
  try {
    const config = llmConfig.getConfig();
    
    // 检查是否启用大模型API
    if (!config.enabled) {
      return null; // 返回null，让调用方决定如何处理
    }
    
    // 检查API密钥
    if (!config.apiKey) {
      return null;
    }
    
    const providerConfig = config.providerConfig;
    
    // 构建消息
    const systemMessage = options.systemMessage || '你是一个专业的数据分析师，擅长基于数据进行深度分析和提供决策建议。请用中文回答，回答要专业、准确、有条理。';
    const messages = [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: prompt
      }
    ];
    
    // 构建请求体
    const requestBody = providerConfig.buildRequest(messages, {
      model: providerConfig.model,
      temperature: options.temperature || config.temperature,
      maxTokens: options.maxTokens || config.maxTokens
    });
    
    // 构建请求头
    const headers = providerConfig.getHeaders 
      ? providerConfig.getHeaders(config.apiKey)
      : {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        };
    
    // 调用API
    let response;
    let data;
    
    // 尝试使用 Node.js 内置的 fetch（Node.js 18+）
    if (global.fetch) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      try {
        response = await fetch(providerConfig.apiUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `大模型API调用失败 (${response.status}): ${errorText}`;
          
          // 尝试解析错误信息，提供更友好的提示
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error && errorData.error.message) {
              const apiError = errorData.error.message;
              errorMessage = `大模型API调用失败: ${apiError}`;
              
              // 如果是模型不可用的错误，记录错误信息
              if (apiError.includes('no available channels') || 
                  apiError.includes('model') ||
                  apiError.includes('not found')) {
                console.error(`模型不可用: ${providerConfig.model}`);
              }
            }
          } catch (e) {
            // 如果解析失败，使用原始错误信息
          }
          
          throw new Error(errorMessage);
        }
        
        data = await response.json();
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error(`大模型API调用超时（${config.timeout}ms）`);
        }
        throw fetchError;
      }
    } else {
      // 使用 axios（如果已安装）
      try {
        const axios = require('axios');
        response = await axios.post(
          providerConfig.apiUrl,
          requestBody,
          {
            headers: headers,
            timeout: config.timeout
          }
        );
        data = response.data;
      } catch (axiosError) {
        if (axiosError.code === 'ECONNABORTED') {
          throw new Error(`大模型API调用超时（${config.timeout}ms）`);
        }
        throw new Error(`大模型API调用失败: ${axiosError.message}`);
      }
    }
    
    // 解析响应
    const result = providerConfig.parseResponse(data);
    return result;
    
  } catch (error) {
    console.error('调用大模型API失败:', error.message);
    throw error;
  }
};

/**
 * 检查大模型API是否可用
 */
const isAvailable = () => {
  const config = llmConfig.getConfig();
  return config.enabled && !!config.apiKey;
};

module.exports = {
  callLLM,
  isAvailable
};

