/**
 * 常量定义
 */

// 用户角色
const USER_ROLES = {
  ADMIN: 'admin',
  DECISION_USER: 'decision_user',
  NORMAL_USER: 'normal_user'
};

// 数据状态
const DATA_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DELETED: 'deleted'
};

// 数据类别
const DATA_CATEGORIES = {
  TECHNOLOGY: '科技创新',
  EDUCATION: '教育文化',
  SOCIAL: '社会民生',
  WEATHER: '气象服务',
  COMMERCE: '商贸流通',
  SOCIAL_SECURITY: '社保就业',
  ENVIRONMENT: '生态环境',
  MARKET: '市场监督',
  MEDICAL: '医疗卫生',
  TRANSPORT: '交通运输'
};

// 图表类型
const CHART_TYPES = {
  BAR: 'bar',
  LINE: 'line',
  PIE: 'pie',
  SCATTER: 'scatter',
  RADAR: 'radar'
};

// 预测模型类型
const PREDICTION_MODELS = {
  LINEAR_REGRESSION: 'linear_regression',
  ARIMA: 'arima',
  EXPONENTIAL_SMOOTHING: 'exponential_smoothing',
  MACHINE_LEARNING: 'machine_learning'
};

// 日志类型
const LOG_TYPES = {
  LOGIN: 'login',
  OPERATION: 'operation',
  ERROR: 'error',
  SYSTEM: 'system'
};

// HTTP状态码
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// 响应消息
const MESSAGES = {
  SUCCESS: '操作成功',
  FAILED: '操作失败',
  UNAUTHORIZED: '未授权，请先登录',
  FORBIDDEN: '权限不足',
  NOT_FOUND: '资源不存在',
  VALIDATION_ERROR: '数据验证失败',
  SERVER_ERROR: '服务器内部错误'
};

module.exports = {
  USER_ROLES,
  DATA_STATUS,
  DATA_CATEGORIES,
  CHART_TYPES,
  PREDICTION_MODELS,
  LOG_TYPES,
  HTTP_STATUS,
  MESSAGES
};

