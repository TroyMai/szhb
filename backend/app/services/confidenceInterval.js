/**
 * 置信区间计算
 * 为预测值计算置信区间（不确定性范围）
 */

/**
 * 计算线性回归的置信区间
 * @param {Array} historicalData - 历史数据 [{time, value}, ...]
 * @param {Array} predictions - 预测值数组
 * @param {number} confidenceLevel - 置信水平（0-1），默认0.95（95%）
 * @returns {Array} 置信区间数组 [{lower, upper}, ...]
 */
const calculateLinearRegressionCI = (historicalData, predictions, confidenceLevel = 0.95) => {
    const n = historicalData.length;
    const values = historicalData.map(d => d.value);
    
    // 计算线性回归的残差
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        const x = i;
        const y = values[i];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // 计算残差
    const residuals = [];
    for (let i = 0; i < n; i++) {
        const predicted = slope * i + intercept;
        residuals.push(values[i] - predicted);
    }
    
    // 计算残差的标准误差
    const meanResidual = residuals.reduce((sum, r) => sum + r, 0) / n;
    const residualVariance = residuals.reduce((sum, r) => sum + Math.pow(r - meanResidual, 2), 0) / (n - 2);
    const standardError = Math.sqrt(residualVariance);
    
    // 计算x的平均值
    const meanX = sumX / n;
    
    // 计算Sxx（x的离差平方和）
    const sxx = sumX2 - n * meanX * meanX;
    
    // t值（使用近似值，对于大样本使用1.96，对于小样本需要查表）
    const tValue = n > 30 ? 1.96 : 2.0; // 简化处理
    
    // 计算每个预测点的置信区间
    const intervals = [];
    for (let i = 0; i < predictions.length; i++) {
        const xNew = n + i;
        const se = standardError * Math.sqrt(1 + 1/n + Math.pow(xNew - meanX, 2) / sxx);
        const margin = tValue * se;
        
        intervals.push({
            lower: Math.max(0, predictions[i] - margin),
            upper: predictions[i] + margin
        });
    }
    
    return intervals;
};

/**
 * 计算简单置信区间（基于历史数据的标准差）
 * @param {Array} historicalData - 历史数据
 * @param {Array} predictions - 预测值数组
 * @param {number} confidenceLevel - 置信水平
 * @returns {Array} 置信区间数组
 */
const calculateSimpleCI = (historicalData, predictions, confidenceLevel = 0.95) => {
    const values = historicalData.map(d => d.value);
    const n = values.length;
    
    // 计算历史数据的均值和标准差
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    // z值（95%置信水平对应1.96）
    const zValue = confidenceLevel === 0.95 ? 1.96 : 2.576; // 99%对应2.576
    
    // 计算置信区间
    const intervals = [];
    for (let i = 0; i < predictions.length; i++) {
        const margin = zValue * stdDev;
        intervals.push({
            lower: Math.max(0, predictions[i] - margin),
            upper: predictions[i] + margin
        });
    }
    
    return intervals;
};

/**
 * 计算预测值的置信区间
 * @param {Array} historicalData - 历史数据 [{time, value}, ...]
 * @param {Array} predictions - 预测值数组
 * @param {string} model - 预测模型类型
 * @param {number} confidenceLevel - 置信水平（0-1），默认0.95
 * @returns {Array} 置信区间数组 [{lower, upper}, ...]
 */
const calculateConfidenceInterval = (historicalData, predictions, model = 'linear', confidenceLevel = 0.95) => {
    if (!historicalData || historicalData.length < 2) {
        throw new Error('计算置信区间至少需要2个历史数据点');
    }
    
    if (!predictions || predictions.length === 0) {
        return [];
    }
    
    // 根据模型类型选择计算方法
    switch (model) {
        case 'linear':
            return calculateLinearRegressionCI(historicalData, predictions, confidenceLevel);
        case 'polynomial':
            // 多项式回归使用简化的置信区间
            return calculateSimpleCI(historicalData, predictions, confidenceLevel);
        case 'exponential':
        case 'movingAverage':
        case 'arima':
        default:
            // 其他模型使用基于标准差的简单方法
            return calculateSimpleCI(historicalData, predictions, confidenceLevel);
    }
};

module.exports = {
    calculateConfidenceInterval,
    calculateLinearRegressionCI,
    calculateSimpleCI
};

