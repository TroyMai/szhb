/**
 * 模型评估指标
 * 计算MAE、RMSE、MAPE、R²等评估指标
 */

/**
 * 计算平均绝对误差（MAE）
 * @param {Array} actual - 实际值数组
 * @param {Array} predicted - 预测值数组
 * @returns {number} MAE值
 */
const calculateMAE = (actual, predicted) => {
    if (actual.length !== predicted.length) {
        throw new Error('实际值和预测值数组长度必须相同');
    }
    
    if (actual.length === 0) {
        return 0;
    }
    
    let sum = 0;
    for (let i = 0; i < actual.length; i++) {
        sum += Math.abs(actual[i] - predicted[i]);
    }
    
    return sum / actual.length;
};

/**
 * 计算均方根误差（RMSE）
 * @param {Array} actual - 实际值数组
 * @param {Array} predicted - 预测值数组
 * @returns {number} RMSE值
 */
const calculateRMSE = (actual, predicted) => {
    if (actual.length !== predicted.length) {
        throw new Error('实际值和预测值数组长度必须相同');
    }
    
    if (actual.length === 0) {
        return 0;
    }
    
    let sum = 0;
    for (let i = 0; i < actual.length; i++) {
        sum += Math.pow(actual[i] - predicted[i], 2);
    }
    
    return Math.sqrt(sum / actual.length);
};

/**
 * 计算平均绝对百分比误差（MAPE）
 * @param {Array} actual - 实际值数组
 * @param {Array} predicted - 预测值数组
 * @returns {number} MAPE值（百分比）
 */
const calculateMAPE = (actual, predicted) => {
    if (actual.length !== predicted.length) {
        throw new Error('实际值和预测值数组长度必须相同');
    }
    
    if (actual.length === 0) {
        return 0;
    }
    
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < actual.length; i++) {
        if (actual[i] !== 0) {
            sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
            count++;
        }
    }
    
    if (count === 0) {
        return 0;
    }
    
    return (sum / count) * 100;
};

/**
 * 计算决定系数（R²）
 * @param {Array} actual - 实际值数组
 * @param {Array} predicted - 预测值数组
 * @returns {number} R²值（0-1之间，越接近1越好）
 */
const calculateR2 = (actual, predicted) => {
    if (actual.length !== predicted.length) {
        throw new Error('实际值和预测值数组长度必须相同');
    }
    
    if (actual.length === 0) {
        return 0;
    }
    
    // 计算实际值的平均值
    const meanActual = actual.reduce((sum, val) => sum + val, 0) / actual.length;
    
    // 计算总平方和（SST）
    let ssTot = 0;
    for (let i = 0; i < actual.length; i++) {
        ssTot += Math.pow(actual[i] - meanActual, 2);
    }
    
    // 计算残差平方和（SSE）
    let ssRes = 0;
    for (let i = 0; i < actual.length; i++) {
        ssRes += Math.pow(actual[i] - predicted[i], 2);
    }
    
    // 计算R²
    if (ssTot === 0) {
        return 0;
    }
    
    return 1 - (ssRes / ssTot);
};

/**
 * 历史数据回测评估
 * 将历史数据分为训练集和测试集，在训练集上训练模型，在测试集上评估
 * @param {Array} historicalData - 完整历史数据 [{time, value}, ...]
 * @param {Function} modelFunction - 模型函数 (data, periods) => predictions
 * @param {number} testSize - 测试集比例（0-1），默认0.2（20%）
 * @returns {Object} 评估指标
 */
const backtest = (historicalData, modelFunction, testSize = 0.2) => {
    if (!historicalData || historicalData.length < 5) {
        throw new Error('回测至少需要5个数据点');
    }
    
    const n = historicalData.length;
    const testStart = Math.floor(n * (1 - testSize));
    
    // 分割数据
    const trainData = historicalData.slice(0, testStart);
    const testData = historicalData.slice(testStart);
    
    if (trainData.length < 2 || testData.length < 1) {
        throw new Error('训练集或测试集数据不足');
    }
    
    // 使用训练集进行预测
    const periods = testData.length;
    const predictions = modelFunction(trainData, periods);
    
    // 提取实际值和预测值
    const actual = testData.map(d => d.value);
    const predicted = predictions;
    
    // 计算评估指标
    return {
        mae: calculateMAE(actual, predicted),
        rmse: calculateRMSE(actual, predicted),
        mape: calculateMAPE(actual, predicted),
        r2: calculateR2(actual, predicted),
        actual: actual,
        predicted: predicted
    };
};

/**
 * 计算所有评估指标
 * @param {Array} actual - 实际值数组
 * @param {Array} predicted - 预测值数组
 * @returns {Object} 包含所有评估指标的对象
 */
const evaluate = (actual, predicted) => {
    return {
        mae: calculateMAE(actual, predicted),
        rmse: calculateRMSE(actual, predicted),
        mape: calculateMAPE(actual, predicted),
        r2: calculateR2(actual, predicted)
    };
};

module.exports = {
    calculateMAE,
    calculateRMSE,
    calculateMAPE,
    calculateR2,
    backtest,
    evaluate
};

