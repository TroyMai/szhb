/**
 * API请求封装
 */

const API_BASE_URL = 'http://localhost:5000/api';

// 动态导入路由工具（避免循环依赖）
let routerUtils = null;
const getRouterUtils = async () => {
  if (!routerUtils) {
    routerUtils = await import('./router.js');
  }
  return routerUtils.default;
};

/**
 * 获取Token
 */
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * 设置Token
 */
const setToken = (token) => {
  localStorage.setItem('token', token);
};

/**
 * 移除Token
 */
const removeToken = () => {
  localStorage.removeItem('token');
};

/**
 * 统一请求方法
 */
const request = async (url, options = {}) => {
  const token = getToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    const data = await response.json();

    // Token过期处理
    if (response.status === 401) {
      removeToken();
      const router = await getRouterUtils();
      router.redirectToLogin();
      throw new Error('登录已过期，请重新登录');
    }

    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }

    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
};

/**
 * GET请求
 */
const get = (url, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;
  return request(fullUrl, { method: 'GET' });
};

/**
 * POST请求
 */
const post = (url, data = {}) => {
  return request(url, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

/**
 * PUT请求
 */
const put = (url, data = {}) => {
  return request(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

/**
 * DELETE请求
 */
const del = (url) => {
  return request(url, { method: 'DELETE' });
};

/**
 * 文件上传
 */
const upload = async (url, file, onProgress) => {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = (e.loaded / e.total) * 100;
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error('上传失败'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('上传失败'));
    });

    xhr.open('POST', `${API_BASE_URL}${url}`);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  });
};

export default {
  request,
  get,
  post,
  put,
  delete: del,
  upload,
  getToken,
  setToken,
  removeToken
};

