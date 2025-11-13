/**
 * 认证相关工具函数
 */

import api from './api.js';
import router from './router.js';

/**
 * 登录
 */
const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    if (response.success && response.data.token) {
      api.setToken(response.data.token);
      // 保存用户信息
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    }
    throw new Error(response.message || '登录失败');
  } catch (error) {
    throw error;
  }
};

/**
 * 登出
 */
const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('登出错误:', error);
  } finally {
    api.removeToken();
    localStorage.removeItem('user');
    router.redirectToLogin();
  }
};

/**
 * 检查认证状态
 */
const checkAuth = () => {
  const token = api.getToken();
  const user = localStorage.getItem('user');
  return !!(token && user);
};

/**
 * 获取用户信息
 */
const getUserInfo = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

/**
 * 检查用户角色
 */
const hasRole = (role) => {
  const user = getUserInfo();
  return user && user.role === role;
};

/**
 * 检查是否为管理员
 */
const isAdmin = () => {
  return hasRole('admin');
};

/**
 * 检查是否为决策用户
 */
const isDecisionUser = () => {
  return hasRole('decision_user');
};

/**
 * 检查是否为普通用户
 */
const isNormalUser = () => {
  return hasRole('normal_user');
};

/**
 * 路由守卫
 */
const requireAuth = (redirectUrl = null) => {
  if (!checkAuth()) {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      router.redirectToLogin();
    }
    return false;
  }
  return true;
};

/**
 * 角色守卫
 */
const requireRole = (roles, redirectUrl = null) => {
  if (!checkAuth()) {
    router.redirectToLogin();
    return false;
  }
  
  const user = getUserInfo();
  if (!user || !roles.includes(user.role)) {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      router.redirectToHome();
    }
    return false;
  }
  return true;
};

export default {
  login,
  logout,
  checkAuth,
  getUserInfo,
  hasRole,
  isAdmin,
  isDecisionUser,
  isNormalUser,
  requireAuth,
  requireRole
};

