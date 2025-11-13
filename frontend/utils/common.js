/**
 * 通用工具函数
 */

/**
 * 日期格式化
 */
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * 数字格式化
 */
const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * 文件大小格式化
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * 表单验证
 */
const validate = {
  // 验证邮箱
  email: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  
  // 验证手机号
  phone: (phone) => {
    const re = /^1[3-9]\d{9}$/;
    return re.test(phone);
  },
  
  // 验证密码强度
  password: (password) => {
    // 至少8位，包含字母和数字
    const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return re.test(password);
  },
  
  // 验证必填
  required: (value) => {
    return value !== null && value !== undefined && value !== '';
  }
};

/**
 * 数据导出（本地数据）
 */
const exportData = (data, filename, type = 'csv') => {
  let content = '';
  let mimeType = '';
  
  if (type === 'csv') {
    // CSV格式
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      content = headers.join(',') + '\n';
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        });
        content += values.join(',') + '\n';
      });
    }
    mimeType = 'text/csv;charset=utf-8;';
  } else if (type === 'json') {
    content = JSON.stringify(data, null, 2);
    mimeType = 'application/json;charset=utf-8;';
  }
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${type}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 从API导出数据（下载CSV文件）
 * @param {number} dataId - 数据ID
 * @param {string} defaultFilename - 默认文件名（可选）
 * @param {Function} onSuccess - 成功回调（可选）
 * @param {Function} onError - 错误回调（可选）
 */
const exportDataFromAPI = async (dataId, defaultFilename = null, onSuccess = null, onError = null) => {
  if (!dataId) {
    const error = new Error('数据ID不能为空');
    if (onError) onError(error);
    throw error;
  }

  try {
    // 获取token
    const token = localStorage.getItem('token');
    if (!token) {
      const error = new Error('未登录');
      if (onError) onError(error);
      throw error;
    }

    // 使用fetch直接下载文件
    const API_BASE_URL = 'http://localhost:5000/api';
    const response = await fetch(`${API_BASE_URL}/data/${dataId}/export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = '导出失败';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // 忽略JSON解析错误
      }
      const error = new Error(errorMessage);
      if (onError) onError(error);
      throw error;
    }

    // 获取文件名（从响应头或使用默认名称）
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = defaultFilename || `数据导出_${new Date().toISOString().split('T')[0]}.csv`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
      }
    }

    // 获取文件内容
    const blob = await response.blob();
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    if (onSuccess) onSuccess(filename);
    return filename;
  } catch (error) {
    console.error('导出失败:', error);
    if (onError) onError(error);
    throw error;
  }
};

/**
 * 防抖函数
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 节流函数
 */
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * 深拷贝
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * 显示消息提示
 */
const showMessage = (message, type = 'info') => {
  // 简单的消息提示实现
  const messageEl = document.createElement('div');
  messageEl.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    type === 'warning' ? 'bg-yellow-500' :
    'bg-blue-500'
  } text-white text-center min-w-[200px] max-w-[500px]`;
  messageEl.textContent = message;
  document.body.appendChild(messageEl);
  
  setTimeout(() => {
    messageEl.remove();
  }, 3000);
};

export default {
  formatDate,
  formatNumber,
  formatFileSize,
  validate,
  exportData,
  exportDataFromAPI,
  debounce,
  throttle,
  deepClone,
  showMessage
};

