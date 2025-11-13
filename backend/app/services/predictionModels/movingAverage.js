/**
 * 移动平均法
 * 包括简单移动平均、加权移动平均、指数移动平均
 */

/**
 * 简单移动平均（Simple Moving Average, SMA）
 * @param {Array} data - 历史数据 [{time, value}, ...]
 * @param {number} periods - 预测周期数
 * @param {number} windowSize - 移动窗口大小，默认使用数据长度的1/3
 * @returns {Array} 预测值数组
 */
const simpleMovingAverage = (data, periods, windowSize = null) => {
    if (!data || data.length < 2) {
        throw new Error('简单移动平均至少需要2个数据点');
    }
    
    const values = data.map(d => d.value);
    const n = values.length;
    
    // 如果没有指定窗口大小，使用数据长度的1/3（至少为2）
    if (windowSize === null || windowSize < 2) {
        windowSize = Math.max(2, Math.floor(n / 3));
    }
    
    if (windowSize >= n) {
        windowSize = n - 1;
    }
    
    // 计算最后一个窗口的平均值
    const lastWindow = values.slice(n - windowSize);
    const avg = lastWindow.reduce((sum, val) => sum + val, 0) / windowSize;
    
    // 计算趋势（最近几个窗口的平均值变化）
    let trend = 0;
    if (n >= windowSize * 2) {
        const prevWindow = values.slice(n - windowSize * 2, n - windowSize);
        const prevAvg = prevWindow.reduce((sum, val) => sum + val, 0) / windowSize;
        trend = (avg - prevAvg) / windowSize;
    }
    
    // 生成预测值
    const predictions = [];
    for (let i = 0; i < periods; i++) {
        const forecast = avg + trend * (i + 1);
        predictions.push(forecast);
    }
    
    return predictions;
};

/**
 * 加权移动平均（Weighted Moving Average, WMA）
 * 越近的数据权重越大
 * @param {Array} data - 历史数据 [{time, value}, ...]
 * @param {number} periods - 预测周期数
 * @param {number} windowSize - 移动窗口大小
 * @returns {Array} 预测值数组
 */
const weightedMovingAverage = (data, periods, windowSize = null) => {
    if (!data || data.length < 2) {
        throw new Error('加权移动平均至少需要2个数据点');
    }
    
    const values = data.map(d => d.value);
    const n = values.length;
    
    // 如果没有指定窗口大小，使用数据长度的1/3
    if (windowSize === null || windowSize < 2) {
        windowSize = Math.max(2, Math.floor(n / 3));
    }
    
    if (windowSize >= n) {
        windowSize = n - 1;
    }
    
    // 计算权重：线性权重，越近权重越大
    const weights = [];
    const weightSum = (windowSize * (windowSize + 1)) / 2; // 1+2+...+n
    for (let i = 1; i <= windowSize; i++) {
        weights.push(i / weightSum);
    }
    
    // 计算加权平均值
    const lastWindow = values.slice(n - windowSize);
    let weightedSum = 0;
    for (let i = 0; i < windowSize; i++) {
        weightedSum += lastWindow[i] * weights[i];
    }
    
    // 计算趋势
    let trend = 0;
    if (n >= windowSize * 2) {
        const prevWindow = values.slice(n - windowSize * 2, n - windowSize);
        let prevWeightedSum = 0;
        for (let i = 0; i < windowSize; i++) {
            prevWeightedSum += prevWindow[i] * weights[i];
        }
        trend = (weightedSum - prevWeightedSum) / windowSize;
    }
    
    // 生成预测值
    const predictions = [];
    for (let i = 0; i < periods; i++) {
        const forecast = weightedSum + trend * (i + 1);
        predictions.push(forecast);
    }
    
    return predictions;
};

/**
 * 指数移动平均（Exponential Moving Average, EMA）
 * 使用指数衰减权重
 * @param {Array} data - 历史数据 [{time, value}, ...]
 * @param {number} periods - 预测周期数
 * @param {number} alpha - 平滑参数（0-1），默认0.3
 * @returns {Array} 预测值数组
 */
const exponentialMovingAverage = (data, periods, alpha = 0.3) => {
    if (!data || data.length < 2) {
        throw new Error('指数移动平均至少需要2个数据点');
    }
    
    if (alpha <= 0 || alpha >= 1) {
        alpha = 0.3;
    }
    
    const values = data.map(d => d.value);
    const n = values.length;
    
    // 计算EMA
    let ema = [values[0]]; // 初始值使用第一个数据点
    
    for (let i = 1; i < n; i++) {
        const newEma = alpha * values[i] + (1 - alpha) * ema[i - 1];
        ema.push(newEma);
    }
    
    // 计算趋势（EMA的变化率）
    let trend = 0;
    if (n >= 3) {
        const recentEma = ema.slice(-3);
        trend = (recentEma[2] - recentEma[0]) / 2;
    }
    
    // 生成预测值
    const lastEma = ema[n - 1];
    const predictions = [];
    for (let i = 0; i < periods; i++) {
        const forecast = lastEma + trend * (i + 1);
        predictions.push(forecast);
    }
    
    return predictions;
};

/**
 * 主函数：根据数据特征自动选择移动平均方法
 * @param {Array} data - 历史数据 [{time, value}, ...]
 * @param {number} periods - 预测周期数
 * @param {string} type - 移动平均类型 ('simple', 'weighted', 'exponential', 'auto')
 * @param {Object} options - 额外参数
 * @returns {Array} 预测值数组
 */
const movingAverage = (data, periods, type = 'auto', options = {}) => {
    if (!data || data.length < 2) {
        throw new Error('移动平均至少需要2个数据点');
    }
    
    // 自动选择类型：默认使用简单移动平均
    if (type === 'auto') {
        type = 'simple';
    }
    
    switch (type) {
        case 'simple':
            return simpleMovingAverage(data, periods, options.windowSize);
        case 'weighted':
            return weightedMovingAverage(data, periods, options.windowSize);
        case 'exponential':
            return exponentialMovingAverage(data, periods, options.alpha);
        default:
            return simpleMovingAverage(data, periods, options.windowSize);
    }
};

module.exports = {
    simpleMovingAverage,
    weightedMovingAverage,
    exponentialMovingAverage,
    movingAverage
};

