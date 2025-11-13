/**
 * 路由管理器
 * 统一管理页面跳转、路由守卫、参数处理
 */

import routes from '../config/routes.js';
import auth from './auth.js';

/**
 * 获取路由配置
 */
const getRoute = (routeName) => {
  const route = routes[routeName];
  if (!route) {
    console.warn(`路由 ${routeName} 不存在`);
    return null;
  }
  return route;
};

/**
 * 构建查询字符串
 */
const buildQuery = (params) => {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }
  
  const queryParts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  
  return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
};

/**
 * 解析查询字符串
 */
const parseQuery = (queryString) => {
  const params = {};
  if (!queryString) {
    return params;
  }
  
  const query = queryString.startsWith('?') ? queryString.slice(1) : queryString;
  const pairs = query.split('&');
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
    }
  }
  
  return params;
};

/**
 * 获取当前路由参数
 */
const getParams = () => {
  const queryString = window.location.search;
  return parseQuery(queryString);
};

/**
 * 获取路由路径
 */
const getPath = (routeName, params = null) => {
  const route = getRoute(routeName);
  if (!route) {
    return null;
  }
  
  const path = route.path;
  if (params) {
    const query = buildQuery(params);
    return `${path}${query}`;
  }
  
  return path;
};

/**
 * 跳转到指定路由
 */
const navigate = (routeName, params = null) => {
  const path = getPath(routeName, params);
  if (!path) {
    console.error(`无法跳转到路由 ${routeName}`);
    return;
  }
  
  // 执行路由守卫
  if (!beforeEach(routeName)) {
    return;
  }
  
  // 设置页面标题
  const route = getRoute(routeName);
  if (route && route.meta && route.meta.title) {
    document.title = route.meta.title;
  }
  
  // 执行跳转
  window.location.href = path;
};

/**
 * 路由守卫（全局）
 */
const beforeEach = (routeName) => {
  const route = getRoute(routeName);
  if (!route) {
    return false;
  }
  
  // 检查登录状态
  if (route.requiresAuth && !auth.checkAuth()) {
    window.location.href = routes.login.path;
    return false;
  }
  
  // 检查角色权限
  if (route.requiresRole && auth.checkAuth()) {
    const user = auth.getUserInfo();
    if (!user || !route.requiresRole.includes(user.role)) {
      window.location.href = routes.home.path;
      return false;
    }
  }
  
  return true;
};

/**
 * 页面级路由守卫
 * 在页面加载时调用，检查权限
 */
const beforeEnter = (routeName, callback) => {
  const route = getRoute(routeName);
  if (!route) {
    return;
  }
  
  // 检查登录状态
  if (route.requiresAuth && !auth.checkAuth()) {
    navigate('login');
    return;
  }
  
  // 检查角色权限
  if (route.requiresRole && auth.checkAuth()) {
    const user = auth.getUserInfo();
    if (!user || !route.requiresRole.includes(user.role)) {
      navigate('home');
      return;
    }
  }
  
  // 执行回调
  if (callback) {
    callback();
  }
};

/**
 * 获取当前路由名称（根据路径）
 */
const getCurrentRoute = () => {
  const path = window.location.pathname;
  const fileName = path.split('/').pop() || '';
  
  // 匹配路由
  for (const [name, route] of Object.entries(routes)) {
    const routeFileName = route.path.split('/').pop() || '';
    if (fileName === routeFileName || path.includes(routeFileName)) {
      return name;
    }
  }
  
  return null;
};

/**
 * 兼容方法（保留以兼容旧代码）
 * 注意：path.js 已被移除，这些方法现在基于 router
 */
const getLoginPath = () => getPath('login');
const getHomePath = () => getPath('home');
const getPagePath = (pageName) => {
  // 将 pageName 转换为路由名称（如 'query' -> 'query'）
  const routeName = pageName.toLowerCase();
  return getPath(routeName) || `./${pageName}.html`;
};

const redirectToLogin = () => navigate('login');
const redirectToHome = () => navigate('home');

export default {
  // 核心方法
  navigate,
  getPath,
  getParams,
  getCurrentRoute,
  buildQuery,
  parseQuery,
  
  // 路由守卫
  beforeEach,
  beforeEnter,
  
  // 兼容 path.js 的方法
  getLoginPath,
  getHomePath,
  getPagePath,
  redirectToLogin,
  redirectToHome,
  
  // 路由配置（只读）
  routes: Object.freeze(routes)
};

