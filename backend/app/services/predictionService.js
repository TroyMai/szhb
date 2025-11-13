/**
 * 预测服务
 * 提供各种预测算法
 */

// 导入各种预测模型
const exponentialSmoothing = require('./predictionModels/exponentialSmoothing');
const movingAverage = require('./predictionModels/movingAverage');
const polynomialRegression = require('./predictionModels/polynomialRegression');
const arima = require('./predictionModels/arima');

/**
 * 线性回归算法
 * @param {Array} data - 历史数据 [{time, value}, ...]
 * @returns {Object} {slope, intercept} 回归系数
 */
const linearRegression = (data) => {
    if (!data || data.length < 2) {
        throw new Error('数据点不足，至少需要2个数据点');
    }
    
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    data.forEach((point, index) => {
        const x = index;
        const y = point.value;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
    });
    
    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) {
        throw new Error('无法计算线性回归，数据可能存在问题');
    }
    
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
};

/**
 * 检测时间间隔
 * @param {Array} timeSeriesData - 时间序列数据 [{time, value}, ...]
 * @returns {number} 时间间隔（年份格式为年数，年月格式为月数）
 */
const detectTimeInterval = (timeSeriesData) => {
    if (!timeSeriesData || timeSeriesData.length < 2) {
        return 1; // 默认间隔
    }
    
    // 判断时间格式（通过第一个时间值）
    const firstTime = timeSeriesData[0].time;
    const isYearMonth = String(firstTime).length === 6 && parseInt(firstTime) >= 100000 && parseInt(firstTime) <= 999999;
    
    // 计算相邻数据点的时间差
    const intervals = [];
    for (let i = 1; i < timeSeriesData.length; i++) {
        const time1 = timeSeriesData[i - 1].time;
        const time2 = timeSeriesData[i].time;
        
        if (isYearMonth) {
            // 年月格式（6位数字，如202403）
            const year1 = Math.floor(time1 / 100);
            const month1 = time1 % 100;
            const year2 = Math.floor(time2 / 100);
            const month2 = time2 % 100;
            
            // 计算月份差
            const monthDiff = (year2 - year1) * 12 + (month2 - month1);
            if (monthDiff > 0) {
                intervals.push(monthDiff);
            }
        } else {
            // 年份格式
            const yearDiff = time2 - time1;
            if (yearDiff > 0) {
                intervals.push(yearDiff);
            }
        }
    }
    
    if (intervals.length === 0) {
        return 1;
    }
    
    // 找到最常见的间隔（众数）
    const intervalCounts = {};
    intervals.forEach(interval => {
        intervalCounts[interval] = (intervalCounts[interval] || 0) + 1;
    });
    
    let mostCommonInterval = 1;
    let maxCount = 0;
    Object.keys(intervalCounts).forEach(interval => {
        if (intervalCounts[interval] > maxCount) {
            maxCount = intervalCounts[interval];
            mostCommonInterval = parseInt(interval);
        }
    });
    
    return mostCommonInterval;
};

/**
 * 生成预测数据
 * @param {Array} historicalData - 历史数据 [{time, value}, ...]
 * @param {number} periods - 预测周期数
 * @param {string} model - 预测模型 ('linear', 'arima', 'exponential', 'polynomial', 'movingAverage')
 * @param {number} timeInterval - 时间间隔（年份格式为年数，年月格式为月数）
 * @param {string} timeFormat - 时间格式 ('year' 或 'yearmonth')
 * @param {Object} options - 额外选项 {modelParams: object}
 * @returns {Object} 预测结果
 */
const generatePrediction = (historicalData, periods, model = 'linear', timeInterval = 1, timeFormat = 'year', options = {}) => {
    if (!historicalData || historicalData.length < 2) {
        throw new Error('历史数据不足，至少需要2个数据点');
    }
    
    if (periods <= 0) {
        throw new Error('预测周期数必须大于0');
    }
    
    const { modelParams = {} } = options;
    
    let predictions = [];
    let truncatedCount = 0; // 统计被截断为0的预测值数量
    
    // 根据模型选择预测算法
    try {
        switch (model) {
            case 'linear':
                // 线性回归
                const { slope, intercept } = linearRegression(historicalData);
                for (let i = 0; i < periods; i++) {
                    const x = historicalData.length + i;
                    const y = slope * x + intercept;
                    predictions.push(y); // 允许负值（如增长率等数据）
                }
                break;
                
            case 'exponential':
                // 指数平滑
                const expType = modelParams.type || 'auto';
                const seasonLength = modelParams.seasonLength || 12;
                predictions = exponentialSmoothing.exponentialSmoothing(historicalData, periods, expType, seasonLength);
                // 指数平滑已经在模块内部截断，无法准确统计
                break;
                
            case 'movingAverage':
                // 移动平均
                const maType = modelParams.type || 'auto';
                predictions = movingAverage.movingAverage(historicalData, periods, maType, {
                    windowSize: modelParams.windowSize,
                    alpha: modelParams.alpha
                });
                // 移动平均已经在模块内部截断，无法准确统计
                break;
                
            case 'polynomial':
                // 多项式回归
                const degree = modelParams.degree || 'auto';
                predictions = polynomialRegression.polynomialRegression(historicalData, periods, degree);
                // 多项式回归已经在模块内部截断，无法准确统计
                break;
                
            case 'arima':
                // ARIMA模型
                const arimaParams = modelParams.p || modelParams.d || modelParams.q 
                    ? { p: modelParams.p || 2, d: modelParams.d || 1, q: modelParams.q || 1 }
                    : arima.autoArima(historicalData);
                predictions = arima.arima(historicalData, periods, arimaParams);
                // ARIMA已经在模块内部截断，无法准确统计
                break;
                
            default:
                throw new Error(`不支持的预测模型: ${model}`);
        }
    } catch (error) {
        throw new Error(`模型 ${model} 预测失败: ${error.message}`);
    }
    
    // 模型评估和置信区间功能已移除（根据用户要求）
    
    // 生成预测时间点
    const lastTime = historicalData[historicalData.length - 1].time;
    const predictionTimes = [];
    
    for (let i = 0; i < periods; i++) {
        let nextTime;
        if (timeFormat === 'yearmonth') {
            // 年月格式：根据间隔计算下一个时间点
            const year = Math.floor(lastTime / 100);
            const month = lastTime % 100;
            // 计算间隔后的月份
            const intervalMonths = timeInterval * (i + 1);
            let nextMonth = month + intervalMonths;
            let nextYear = year;
            if (nextMonth > 12) {
                nextYear += Math.floor((nextMonth - 1) / 12);
                nextMonth = ((nextMonth - 1) % 12) + 1;
            }
            nextTime = nextYear * 100 + nextMonth;
        } else {
            // 年份格式：根据间隔计算
            nextTime = lastTime + timeInterval * (i + 1);
        }
        predictionTimes.push(nextTime);
    }
    
    // 计算统计信息
    const avgValue = historicalData.reduce((sum, item) => sum + item.value, 0) / historicalData.length;
    const lastValue = historicalData[historicalData.length - 1].value;
    const predictedValue = predictions.length > 0 ? predictions[predictions.length - 1] : null;
    
    // 计算增长率：即使预测值为0也要计算（可能是-100%）
    // 只有当lastValue为0时才无法计算增长率
    let growthRate = null;
    if (predictedValue !== null && predictedValue !== undefined && lastValue !== 0) {
        growthRate = ((predictedValue - lastValue) / lastValue) * 100;
    }
    
    // 构建预测结果对象
    // 确保所有预测值都是有效数字
    const validPredictions = predictions.map(val => {
        if (val === null || val === undefined || isNaN(val)) {
            return 0;
        }
        return typeof val === 'number' ? val : parseFloat(val) || 0;
    });
    
    // 注意：由于已允许负值，不再需要检测截断情况
    // truncatedCount 保留用于兼容性，但不再使用（设为0）
    truncatedCount = 0;
    
    const result = {
        predictions: validPredictions.map((value, index) => {
            return {
                time: predictionTimes[index],
                value: value,
                isPrediction: true
            };
        }),
        historicalData: historicalData.map(item => ({
            time: item.time,
            value: item.value,
            isPrediction: false
        })),
        statistics: {
            avgValue: avgValue,
            lastValue: lastValue,
            predictedValue: predictedValue,
            growthRate: growthRate,
            truncatedCount: truncatedCount // 被截断为0的预测值数量
        },
        timeInterval: timeInterval,
        timeFormat: timeFormat,
        model: model
    };
    
    return result;
};

/**
 * 验证模型所需的最小数据点
 * @param {string} model - 模型名称
 * @param {number} dataLength - 数据长度
 * @returns {boolean} 是否满足要求
 */
const validateModelDataRequirements = (model, dataLength) => {
    const requirements = {
        'linear': 2,
        'exponential': 3,
        'movingAverage': 2,
        'polynomial': 3,
        'arima': 20
    };
    
    const minRequired = requirements[model] || 2;
    return dataLength >= minRequired;
};

module.exports = {
    linearRegression,
    detectTimeInterval,
    generatePrediction,
    validateModelDataRequirements
};

