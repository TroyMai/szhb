/**
 * 指数平滑法
 * 包括单指数平滑、双指数平滑、三指数平滑
 */

/**
 * 单指数平滑（Simple Exponential Smoothing）
 * 适合无明显趋势的数据
 * @param {Array} data - 历史数据 [{time, value}, ...]
 * @param {number} periods - 预测周期数
 * @param {number} alpha - 平滑参数（0-1），默认自动计算
 * @returns {Array} 预测值数组
 */
const singleExponentialSmoothing = (data, periods, alpha = null) => {
    if (!data || data.length < 3) {
        throw new Error('单指数平滑至少需要3个数据点');
    }
    
    const values = data.map(d => d.value);
    const n = values.length;
    
    // 如果没有指定alpha，使用优化方法计算
    if (alpha === null || alpha <= 0 || alpha >= 1) {
        alpha = optimizeAlpha(values);
    }
    
    // 初始化：使用第一个值作为初始平滑值
    let smoothed = [values[0]];
    
    // 计算平滑值
    for (let i = 1; i < n; i++) {
        const newSmoothed = alpha * values[i] + (1 - alpha) * smoothed[i - 1];
        smoothed.push(newSmoothed);
    }
    
    // 生成预测值（使用最后一个平滑值）
    const lastSmoothed = smoothed[n - 1];
    // 确保lastSmoothed是有效数字
    if (lastSmoothed === null || lastSmoothed === undefined || isNaN(lastSmoothed)) {
        // 如果最后一个平滑值无效，使用最后一个原始值
        const fallbackValue = values[n - 1] || (n > 1 ? values[n - 2] : 0);
        const predictions = [];
        for (let i = 0; i < periods; i++) {
            predictions.push(isNaN(fallbackValue) ? 0 : fallbackValue);
        }
        return predictions;
    }
    
    const predictions = [];
    for (let i = 0; i < periods; i++) {
        const predValue = lastSmoothed;
        predictions.push(isNaN(predValue) ? 0 : predValue);
    }
    
    return predictions;
};

/**
 * 双指数平滑（Double Exponential Smoothing / Holt's Method）
 * 适合有趋势但无季节性的数据
 * @param {Array} data - 历史数据 [{time, value}, ...]
 * @param {number} periods - 预测周期数
 * @param {number} alpha - 水平平滑参数（0-1）
 * @param {number} beta - 趋势平滑参数（0-1）
 * @returns {Array} 预测值数组
 */
const doubleExponentialSmoothing = (data, periods, alpha = null, beta = null) => {
    if (!data || data.length < 3) {
        throw new Error('双指数平滑至少需要3个数据点');
    }
    
    const values = data.map(d => d.value);
    const n = values.length;
    
    // 如果没有指定参数，使用优化方法计算
    if (alpha === null || alpha <= 0 || alpha >= 1) {
        alpha = optimizeAlpha(values);
    }
    if (beta === null || beta <= 0 || beta >= 1) {
        beta = optimizeBeta(values, alpha);
    }
    
    // 初始化水平和趋势
    let level = [values[0]];
    let trend = [values[1] - values[0]]; // 初始趋势
    
    // 计算水平和趋势
    for (let i = 1; i < n; i++) {
        const prevLevel = level[i - 1];
        const prevTrend = trend[i - 1];
        
        // 更新水平
        const newLevel = alpha * values[i] + (1 - alpha) * (prevLevel + prevTrend);
        level.push(newLevel);
        
        // 更新趋势
        const newTrend = beta * (newLevel - prevLevel) + (1 - beta) * prevTrend;
        trend.push(newTrend);
    }
    
    // 生成预测值
    const lastLevel = level[n - 1];
    const lastTrend = trend[n - 1];
    
    // 确保lastLevel和lastTrend是有效数字
    if (lastLevel === null || lastLevel === undefined || isNaN(lastLevel) ||
        lastTrend === null || lastTrend === undefined || isNaN(lastTrend)) {
        // 如果无效，使用最后一个原始值
        const fallbackValue = values[n - 1] || (n > 1 ? values[n - 2] : 0);
        const predictions = [];
        for (let i = 0; i < periods; i++) {
            predictions.push(isNaN(fallbackValue) ? 0 : fallbackValue);
        }
        return predictions;
    }
    
    const predictions = [];
    for (let i = 0; i < periods; i++) {
        const forecast = lastLevel + (i + 1) * lastTrend;
        const predValue = forecast;
        predictions.push(isNaN(predValue) ? 0 : predValue);
    }
    
    return predictions;
};

/**
 * 三指数平滑（Triple Exponential Smoothing / Holt-Winters Method）
 * 适合有趋势和季节性的数据
 * @param {Array} data - 历史数据 [{time, value}, ...]
 * @param {number} periods - 预测周期数
 * @param {number} seasonLength - 季节长度（如12表示月度数据的年度周期）
 * @param {number} alpha - 水平平滑参数
 * @param {number} beta - 趋势平滑参数
 * @param {number} gamma - 季节性平滑参数
 * @returns {Array} 预测值数组
 */
const tripleExponentialSmoothing = (data, periods, seasonLength = 12, alpha = null, beta = null, gamma = null) => {
    if (!data || data.length < seasonLength * 2) {
        throw new Error(`三指数平滑至少需要 ${seasonLength * 2} 个数据点（至少2个完整周期）`);
    }
    
    const values = data.map(d => d.value);
    const n = values.length;
    
    // 如果没有指定参数，使用默认值
    if (alpha === null || alpha <= 0 || alpha >= 1) {
        alpha = 0.3;
    }
    if (beta === null || beta <= 0 || beta >= 1) {
        beta = 0.1;
    }
    if (gamma === null || gamma <= 0 || gamma >= 1) {
        gamma = 0.3;
    }
    
    // 初始化季节性因子（使用前seasonLength个周期的平均值）
    const seasonal = [];
    for (let i = 0; i < seasonLength; i++) {
        let sum = 0;
        let count = 0;
        for (let j = i; j < n; j += seasonLength) {
            sum += values[j];
            count++;
        }
        seasonal.push(count > 0 ? sum / count : 1);
    }
    
    // 归一化季节性因子
    const avgSeasonal = seasonal.reduce((a, b) => a + b, 0) / seasonLength;
    for (let i = 0; i < seasonLength; i++) {
        seasonal[i] /= avgSeasonal;
    }
    
    // 初始化水平和趋势
    let level = [values[0] / seasonal[0]];
    let trend = [(values[seasonLength] / seasonal[seasonLength] - values[0] / seasonal[0]) / seasonLength];
    
    // 计算水平、趋势和季节性
    for (let i = 1; i < n; i++) {
        const prevLevel = level[i - 1];
        const prevTrend = trend[i - 1];
        const seasonIndex = i % seasonLength;
        const prevSeasonal = seasonal[seasonIndex];
        
        // 更新水平
        const newLevel = alpha * (values[i] / prevSeasonal) + (1 - alpha) * (prevLevel + prevTrend);
        level.push(newLevel);
        
        // 更新趋势
        const newTrend = beta * (newLevel - prevLevel) + (1 - beta) * prevTrend;
        trend.push(newTrend);
        
        // 更新季节性
        seasonal[seasonIndex] = gamma * (values[i] / newLevel) + (1 - gamma) * prevSeasonal;
    }
    
    // 生成预测值
    const lastLevel = level[n - 1];
    const lastTrend = trend[n - 1];
    
    // 确保lastLevel和lastTrend是有效数字
    if (lastLevel === null || lastLevel === undefined || isNaN(lastLevel) ||
        lastTrend === null || lastTrend === undefined || isNaN(lastTrend)) {
        // 如果无效，使用最后一个原始值
        const fallbackValue = values[n - 1] || (n > 1 ? values[n - 2] : 0);
        const predictions = [];
        for (let i = 0; i < periods; i++) {
            predictions.push(isNaN(fallbackValue) ? 0 : fallbackValue);
        }
        return predictions;
    }
    
    const predictions = [];
    for (let i = 0; i < periods; i++) {
        const seasonIndex = (n + i) % seasonLength;
        const seasonalFactor = seasonal[seasonIndex] || 1;
        const forecast = (lastLevel + (i + 1) * lastTrend) * seasonalFactor;
        const predValue = forecast;
        predictions.push(isNaN(predValue) ? 0 : predValue);
    }
    
    return predictions;
};

/**
 * 优化alpha参数（最小化均方误差）
 * @param {Array} values - 数据值数组
 * @returns {number} 最优alpha值
 */
const optimizeAlpha = (values) => {
    let bestAlpha = 0.3;
    let bestMSE = Infinity;
    
    // 尝试不同的alpha值
    for (let alpha = 0.1; alpha <= 0.9; alpha += 0.1) {
        try {
            const smoothed = [values[0]];
            for (let i = 1; i < values.length; i++) {
                smoothed.push(alpha * values[i] + (1 - alpha) * smoothed[i - 1]);
            }
            
            // 计算均方误差（使用最后一部分数据）
            let mse = 0;
            const testStart = Math.floor(values.length * 0.7);
            for (let i = testStart; i < values.length; i++) {
                const error = values[i] - smoothed[i - 1];
                mse += error * error;
            }
            mse /= (values.length - testStart);
            
            if (mse < bestMSE) {
                bestMSE = mse;
                bestAlpha = alpha;
            }
        } catch (e) {
            // 忽略错误，继续尝试
        }
    }
    
    // 确保返回有效的alpha值
    if (bestAlpha === null || bestAlpha === undefined || isNaN(bestAlpha) || bestAlpha <= 0 || bestAlpha >= 1) {
        return 0.3; // 默认值
    }
    return bestAlpha;
};

/**
 * 优化beta参数
 * @param {Array} values - 数据值数组
 * @param {number} alpha - alpha参数
 * @returns {number} 最优beta值
 */
const optimizeBeta = (values, alpha) => {
    let bestBeta = 0.1;
    let bestMSE = Infinity;
    
    for (let beta = 0.05; beta <= 0.5; beta += 0.05) {
        try {
            let level = [values[0]];
            let trend = [values[1] - values[0]];
            
            for (let i = 1; i < values.length; i++) {
                const prevLevel = level[i - 1];
                const prevTrend = trend[i - 1];
                const newLevel = alpha * values[i] + (1 - alpha) * (prevLevel + prevTrend);
                level.push(newLevel);
                trend.push(beta * (newLevel - prevLevel) + (1 - beta) * prevTrend);
            }
            
            let mse = 0;
            const testStart = Math.floor(values.length * 0.7);
            for (let i = testStart; i < values.length; i++) {
                const forecast = level[i - 1] + trend[i - 1];
                const error = values[i] - forecast;
                mse += error * error;
            }
            mse /= (values.length - testStart);
            
            if (mse < bestMSE) {
                bestMSE = mse;
                bestBeta = beta;
            }
        } catch (e) {
            // 忽略错误
        }
    }
    
    // 确保返回有效的beta值
    if (bestBeta === null || bestBeta === undefined || isNaN(bestBeta) || bestBeta <= 0 || bestBeta >= 1) {
        return 0.1; // 默认值
    }
    return bestBeta;
};

/**
 * 主函数：根据数据特征自动选择指数平滑方法
 * @param {Array} data - 历史数据 [{time, value}, ...]
 * @param {number} periods - 预测周期数
 * @param {string} type - 平滑类型 ('single', 'double', 'triple', 'auto')
 * @param {number} seasonLength - 季节长度（仅用于triple）
 * @returns {Array} 预测值数组
 */
const exponentialSmoothing = (data, periods, type = 'auto', seasonLength = 12) => {
    if (!data || data.length < 3) {
        throw new Error('指数平滑至少需要3个数据点');
    }
    
    // 自动选择类型
    if (type === 'auto') {
        // 检测是否有季节性
        if (data.length >= seasonLength * 2) {
            // 简单检测：计算自相关性
            const hasSeasonality = detectSeasonality(data, seasonLength);
            if (hasSeasonality) {
                type = 'triple';
            } else {
                // 检测是否有趋势
                const hasTrend = detectTrend(data);
                type = hasTrend ? 'double' : 'single';
            }
        } else {
            // 数据不足，检测趋势
            const hasTrend = detectTrend(data);
            type = hasTrend ? 'double' : 'single';
        }
    }
    
    switch (type) {
        case 'single':
            return singleExponentialSmoothing(data, periods);
        case 'double':
            return doubleExponentialSmoothing(data, periods);
        case 'triple':
            return tripleExponentialSmoothing(data, periods, seasonLength);
        default:
            return singleExponentialSmoothing(data, periods);
    }
};

/**
 * 检测数据是否有趋势
 * @param {Array} data - 历史数据
 * @returns {boolean} 是否有趋势
 */
const detectTrend = (data) => {
    const values = data.map(d => d.value);
    const n = values.length;
    
    // 使用线性回归检测趋势
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // 如果斜率显著不为0，则认为有趋势
    const threshold = (Math.max(...values) - Math.min(...values)) / n;
    return Math.abs(slope) > threshold * 0.1;
};

/**
 * 检测数据是否有季节性
 * @param {Array} data - 历史数据
 * @param {number} seasonLength - 季节长度
 * @returns {boolean} 是否有季节性
 */
const detectSeasonality = (data, seasonLength) => {
    const values = data.map(d => d.value);
    const n = values.length;
    
    // 计算不同季节位置的平均值
    const seasonalMeans = [];
    for (let i = 0; i < seasonLength; i++) {
        let sum = 0, count = 0;
        for (let j = i; j < n; j += seasonLength) {
            sum += values[j];
            count++;
        }
        seasonalMeans.push(count > 0 ? sum / count : 0);
    }
    
    // 计算变异系数
    const overallMean = seasonalMeans.reduce((a, b) => a + b, 0) / seasonLength;
    const variance = seasonalMeans.reduce((sum, val) => sum + Math.pow(val - overallMean, 2), 0) / seasonLength;
    const cv = Math.sqrt(variance) / overallMean;
    
    // 如果变异系数大于阈值，则认为有季节性
    return cv > 0.1;
};

module.exports = {
    singleExponentialSmoothing,
    doubleExponentialSmoothing,
    tripleExponentialSmoothing,
    exponentialSmoothing
};

