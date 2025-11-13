/**
 * 收藏按钮组件
 * 提供统一的收藏功能UI和交互
 */

import api from '../utils/api.js';
import common from '../utils/common.js';

/**
 * 创建收藏按钮HTML（图标模式，用于表格等场景）
 * @param {number} dataId - 数据ID
 * @param {boolean} isFavorite - 是否已收藏
 * @param {string} size - 按钮大小 (sm, md, lg)，默认 md
 * @param {Function} onToggle - 切换回调函数（可选）
 * @returns {string} HTML字符串
 */
const createIconButton = (dataId, isFavorite = false, size = 'md', onToggle = null) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSize = sizeClasses[size] || sizeClasses.md;
  const colorClass = isFavorite ? 'text-yellow-500 hover:text-yellow-700' : 'text-gray-400 hover:text-yellow-500';
  const fillClass = isFavorite ? 'fill-current' : '';
  const title = isFavorite ? '已收藏，点击取消' : '点击收藏';
  const buttonId = `favorite-btn-${dataId}`;

  return `
    <button 
      id="${buttonId}"
      class="${colorClass} transition-colors favorite-icon-btn" 
      title="${title}"
      data-favorite-id="${dataId}"
      data-favorite-status="${isFavorite}"
    >
      <svg class="${iconSize} ${fillClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
      </svg>
    </button>
  `;
};

/**
 * 创建收藏按钮HTML（带文字模式，用于详情页等场景）
 * @param {number} dataId - 数据ID
 * @param {boolean} isFavorite - 是否已收藏
 * @param {string} containerId - 容器ID（用于更新按钮状态）
 * @returns {string} HTML字符串
 */
const createTextButton = (dataId, isFavorite = false, containerId = 'favoriteBtn') => {
  const colorClass = isFavorite 
    ? 'border-yellow-500 bg-yellow-50 text-yellow-700' 
    : 'border-gray-300 text-gray-700';
  const iconColor = isFavorite ? 'text-yellow-500' : 'text-gray-400';
  const fillClass = isFavorite ? 'fill-current' : '';
  const text = isFavorite ? '已收藏' : '收藏';

  return `
    <button 
      id="${containerId}" 
      class="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center space-x-2 transition-colors ${colorClass}"
      data-favorite-id="${dataId}"
      data-favorite-status="${isFavorite}"
    >
      <svg id="${containerId}Icon" class="w-5 h-5 ${iconColor} ${fillClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
      </svg>
      <span id="${containerId}Text">${text}</span>
    </button>
  `;
};

/**
 * 更新按钮状态（用于带文字的按钮）
 * @param {string} containerId - 容器ID
 * @param {boolean} isFavorite - 是否已收藏
 */
const updateButtonState = (containerId, isFavorite) => {
  const button = document.getElementById(containerId);
  const icon = document.getElementById(`${containerId}Icon`);
  const text = document.getElementById(`${containerId}Text`);

  if (!button || !icon || !text) return;

  // 更新按钮状态属性
  button.setAttribute('data-favorite-status', isFavorite);

  if (isFavorite) {
    // 已收藏状态
    button.classList.remove('border-gray-300', 'text-gray-700');
    button.classList.add('border-yellow-500', 'bg-yellow-50', 'text-yellow-700');
    icon.classList.remove('text-gray-400');
    icon.classList.add('text-yellow-500', 'fill-current');
    text.textContent = '已收藏';
  } else {
    // 未收藏状态
    button.classList.remove('border-yellow-500', 'bg-yellow-50', 'text-yellow-700');
    button.classList.add('border-gray-300', 'text-gray-700');
    icon.classList.remove('text-yellow-500', 'fill-current');
    icon.classList.add('text-gray-400');
    text.textContent = '收藏';
  }
};

/**
 * 切换收藏状态
 * @param {number} dataId - 数据ID
 * @param {Event} event - 事件对象（可选）
 * @param {Function} onSuccess - 成功回调（可选，参数：newStatus）
 * @param {Function} onError - 错误回调（可选）
 * @param {HTMLElement} buttonElement - 按钮元素（可选，用于文本按钮）
 */
const toggleFavorite = async (dataId, event = null, onSuccess = null, onError = null, buttonElement = null) => {
  if (event) {
    event.stopPropagation(); // 阻止事件冒泡
  }

  // 获取当前状态：优先使用传入的按钮元素，否则从event中获取
  const button = buttonElement || event?.target?.closest('[data-favorite-id]');
  const currentStatus = button?.getAttribute('data-favorite-status') === 'true';
  const isFavorite = currentStatus;

  try {
    if (isFavorite) {
      // 取消收藏
      await api.delete(`/favorite/${dataId}`);
      
      // 更新按钮状态
      if (button) {
        // 判断是图标按钮还是文本按钮
        if (button.classList.contains('favorite-icon-btn')) {
          updateIconButton(button, false);
        } else {
          // 文本按钮需要通过containerId更新，这里只更新属性
          button.setAttribute('data-favorite-status', 'false');
        }
      }
      
      if (onSuccess) onSuccess(false);
    } else {
      // 添加收藏
      await api.post('/favorite', { dataId });
      
      // 更新按钮状态
      if (button) {
        // 判断是图标按钮还是文本按钮
        if (button.classList.contains('favorite-icon-btn')) {
          updateIconButton(button, true);
        } else {
          // 文本按钮需要通过containerId更新，这里只更新属性
          button.setAttribute('data-favorite-status', 'true');
        }
      }
      
      if (onSuccess) onSuccess(true);
    }
  } catch (error) {
    console.error('操作收藏失败:', error);
    // 错误消息也移除，只保留控制台日志
    if (onError) onError(error);
    throw error; // 重新抛出错误，让调用者可以处理
  }
};

/**
 * 更新图标按钮状态
 * @param {HTMLElement} button - 按钮元素
 * @param {boolean} isFavorite - 是否已收藏
 */
const updateIconButton = (button, isFavorite) => {
  if (!button) return;

  const svg = button.querySelector('svg');
  if (!svg) return;

  button.setAttribute('data-favorite-status', isFavorite);
  button.setAttribute('title', isFavorite ? '已收藏，点击取消' : '点击收藏');

  if (isFavorite) {
    button.classList.remove('text-gray-400', 'hover:text-yellow-500');
    button.classList.add('text-yellow-500', 'hover:text-yellow-700');
    svg.classList.add('fill-current');
  } else {
    button.classList.remove('text-yellow-500', 'hover:text-yellow-700');
    button.classList.add('text-gray-400', 'hover:text-yellow-500');
    svg.classList.remove('fill-current');
  }
};

/**
 * 检查收藏状态
 * @param {number} dataId - 数据ID
 * @returns {Promise<boolean>} 是否已收藏
 */
const checkFavoriteStatus = async (dataId) => {
  try {
    const response = await api.get(`/favorite/check/${dataId}`);
    if (response.success && response.data) {
      return response.data.isFavorite || false;
    }
    return false;
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    return false;
  }
};

/**
 * 批量检查收藏状态
 * @param {number[]} dataIds - 数据ID数组
 * @returns {Promise<Object>} 收藏状态映射 {dataId: boolean}
 */
const checkFavoritesBatch = async (dataIds) => {
  if (!dataIds || dataIds.length === 0) return {};
  
  try {
    const response = await api.post('/favorite/check-batch', { dataIds });
    if (response.success && response.data) {
      return response.data;
    }
    return {};
  } catch (error) {
    console.error('批量检查收藏状态失败:', error);
    return {};
  }
};

/**
 * 初始化带文字的收藏按钮（用于详情页）
 * @param {string} containerId - 容器ID
 * @param {number} dataId - 数据ID
 * @param {boolean} needConfirm - 取消收藏时是否需要确认（默认：false）
 */
const initTextButton = async (containerId, dataId, needConfirm = false) => {
  // 检查收藏状态
  const isFavorite = await checkFavoriteStatus(dataId);
  
  // 更新按钮状态
  updateButtonState(containerId, isFavorite);
  
  // 绑定点击事件
  const button = document.getElementById(containerId);
  if (button) {
    // 移除可能存在的旧事件监听（通过克隆节点）
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // 添加新的事件监听
    newButton.addEventListener('click', async (e) => {
      e.stopPropagation(); // 阻止事件冒泡
      
      // 从按钮元素获取当前收藏状态
      const currentIsFavorite = newButton.getAttribute('data-favorite-status') === 'true';
      
      // 如果需要确认且当前是已收藏状态（点击会取消收藏）
      if (needConfirm && currentIsFavorite) {
        if (!confirm('确定要取消收藏吗？')) {
          return;
        }
      }
      
      try {
        await toggleFavorite(dataId, e, (newStatus) => {
          updateButtonState(containerId, newStatus);
        }, null, newButton);
      } catch (error) {
        // 错误已在 toggleFavorite 中处理
        console.error('切换收藏失败:', error);
      }
    });
  }
};

/**
 * 初始化所有图标按钮的事件监听（在渲染表格后调用）
 * @param {Function} onToggle - 切换后的回调函数（可选，参数：dataId, newStatus）
 * @param {boolean} needConfirm - 取消收藏时是否需要确认（默认：false）
 */
const initIconButtons = (onToggle = null, needConfirm = false) => {
  // 使用 setTimeout 确保 DOM 已更新
  setTimeout(() => {
    document.querySelectorAll('.favorite-icon-btn').forEach(btn => {
      const dataId = parseInt(btn.getAttribute('data-favorite-id'));
      if (!dataId || isNaN(dataId)) return; // 跳过无效的按钮
      
      // 移除可能存在的旧事件监听（通过克隆节点）
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // 添加新的事件监听
      newBtn.addEventListener('click', async (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        
        // 获取当前收藏状态（从按钮属性）
        const currentIsFavorite = newBtn.getAttribute('data-favorite-status') === 'true';
        
        // 如果需要确认且当前是已收藏状态（点击会取消收藏）
        if (needConfirm && currentIsFavorite) {
          if (!confirm('确定要取消收藏吗？')) {
            return;
          }
        }
        
        try {
          await toggleFavorite(dataId, e, (newStatus) => {
            if (onToggle) {
              onToggle(dataId, newStatus);
            }
          });
        } catch (error) {
          // 错误已在 toggleFavorite 中处理
          console.error('切换收藏失败:', error);
        }
      });
    });
  }, 0);
};

// 暴露给全局使用（用于内联onclick）
window.favoriteButton = {
  toggleFavorite,
  checkFavoriteStatus,
  checkFavoritesBatch,
  updateButtonState,
  updateIconButton,
  initTextButton,
  initIconButtons,
  createIconButton,
  createTextButton
};

export default {
  createIconButton,
  createTextButton,
  toggleFavorite,
  checkFavoriteStatus,
  checkFavoritesBatch,
  updateButtonState,
  updateIconButton,
  initTextButton,
  initIconButtons
};

