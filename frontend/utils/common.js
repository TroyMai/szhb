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

/**
 * 转义 HTML 特殊字符
 */
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * 显示确认对话框（美观的自定义对话框）
 * @param {string} message - 确认消息
 * @param {string} title - 对话框标题（可选）
 * @returns {Promise<boolean>} 用户确认返回 true，取消返回 false
 */
const showConfirm = (message, title = '确认操作') => {
  return new Promise((resolve) => {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    overlay.style.animation = 'fadeIn 0.2s ease-in-out';
    
    // 创建对话框
    const dialog = document.createElement('div');
    dialog.className = 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all';
    dialog.style.animation = 'slideUp 0.3s ease-out';
    
    // 转义 HTML 防止 XSS
    const safeTitle = escapeHtml(title);
    const safeMessage = escapeHtml(message);
    
    dialog.innerHTML = `
      <div class="p-6">
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900">${safeTitle}</h3>
        </div>
        <p class="text-gray-600 mb-6 ml-12">${safeMessage}</p>
        <div class="flex justify-end space-x-3">
          <button class="confirm-btn px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
            确定
          </button>
          <button class="cancel-btn px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            取消
          </button>
        </div>
      </div>
    `;
    
    // 添加样式（如果还没有）
    if (!document.getElementById('confirm-dialog-styles')) {
      const style = document.createElement('style');
      style.id = 'confirm-dialog-styles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // 绑定事件
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const confirmBtn = dialog.querySelector('.confirm-btn');
    
    const close = (result) => {
      overlay.style.animation = 'fadeIn 0.2s ease-in-out reverse';
      dialog.style.animation = 'slideUp 0.3s ease-out reverse';
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 200);
    };
    
    cancelBtn.addEventListener('click', () => close(false));
    confirmBtn.addEventListener('click', () => close(true));
    
    // 点击遮罩层关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        close(false);
      }
    });
    
    // ESC 键关闭
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        close(false);
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  });
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
  showMessage,
  showConfirm
};

