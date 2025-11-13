/**
 * ARIMA模型（简化版）
 * 实现自回归（AR）、移动平均（MA）和差分（I）的基本功能
 */

/**
 * 计算自相关系数（ACF）
 * @param {Array} data - 数据数组
 * @param {number} lag - 滞后期
 * @returns {number} 自相关系数
 */
const autocorrelation = (data, lag) => {
    const n = data.length;
    if (lag >= n) return 0;
    
    const mean = data.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n - lag; i++) {
        numerator += (data[i] - mean) * (data[i + lag] - mean);
    }
    
    for (let i = 0; i < n; i++) {
        denominator += Math.pow(data[i] - mean, 2);
    }
    
    return denominator === 0 ? 0 : numerator / denominator;
};

/**
 * 差分处理（I部分）
 * @param {Array} data - 原始数据
 * @param {number} order - 差分阶数（1或2）
 * @returns {Array} 差分后的数据
 */
const difference = (data, order = 1) => {
    if (order === 0) return [...data];
    
    const diffed = [];
    for (let i = order; i < data.length; i++) {
        diffed.push(data[i] - data[i - order]);
    }
    
    if (order > 1) {
        return difference(diffed, order - 1);
    }
    
    return diffed;
};

/**
 * 逆差分（将差分后的数据还原）
 * @param {Array} originalData - 原始数据的前几个值
 * @param {Array} diffedData - 差分后的数据
 * @param {number} order - 差分阶数
 * @returns {Array} 还原后的数据
 */
const inverseDifference = (originalData, diffedData, order = 1) => {
    const result = [...originalData];
    
    for (let i = 0; i < diffedData.length; i++) {
        const value = result[result.length - order] + diffedData[i];
        result.push(value);
    }
    
    return result.slice(originalData.length);
};

/**
 * 自回归模型（AR）
 * @param {Array} data - 历史数据
 * @param {number} order - AR阶数（p）
 * @returns {Array} 系数数组
 */
const autoregressive = (data, order) => {
    const n = data.length;
    if (n < order + 1) {
        throw new Error(`AR(${order})模型至少需要 ${order + 1} 个数据点`);
    }
    
    // 使用Yule-Walker方程求解AR系数
    const acf = [];
    for (let i = 0; i <= order; i++) {
        acf.push(autocorrelation(data, i));
    }
    
    // 构建Toeplitz矩阵
    const R = [];
    for (let i = 0; i < order; i++) {
        const row = [];
        for (let j = 0; j < order; j++) {
            row.push(acf[Math.abs(i - j)]);
        }
        R.push(row);
    }
    
    // 构建右端向量
    const r = acf.slice(1, order + 1);
    
    // 求解线性方程组 R * phi = r
    const phi = solveLinearSystem(R, r);
    
    return phi;
};

/**
 * 使用AR模型进行预测
 * @param {Array} data - 历史数据
 * @param {Array} phi - AR系数
 * @param {number} periods - 预测周期数
 * @returns {Array} 预测值
 */
const arForecast = (data, phi, periods) => {
    const order = phi.length;
    const predictions = [];
    const history = [...data];
    
    for (let i = 0; i < periods; i++) {
        let forecast = 0;
        for (let j = 0; j < order; j++) {
            forecast += phi[j] * history[history.length - order + j];
        }
        predictions.push(forecast);
        history.push(forecast);
    }
    
    return predictions;
};

/**
 * 移动平均模型（MA）- 简化实现
 * 使用AR模型近似MA模型
 * @param {Array} data - 历史数据
 * @param {number} order - MA阶数（q）
 * @param {number} periods - 预测周期数
 * @returns {Array} 预测值
 */
const movingAverageModel = (data, order, periods) => {
    // MA模型实现较复杂，这里使用AR模型近似
    // 实际应用中，MA模型需要更复杂的算法（如最大似然估计）
    const arOrder = Math.min(order, Math.floor(data.length / 3));
    const phi = autoregressive(data, arOrder);
    return arForecast(data, phi, periods);
};

/**
 * ARIMA模型（简化版）
 * @param {Array} data - 历史数据 [{time, value}, ...]
 * @param {number} periods - 预测周期数
 * @param {Object} params - ARIMA参数 {p, d, q}
 * @returns {Array} 预测值数组
 */
const arima = (data, periods, params = {}) => {
    if (!data || data.length < 20) {
        throw new Error('ARIMA模型至少需要20个数据点');
    }
    
    const values = data.map(d => d.value);
    const n = values.length;
    
    // 默认参数
    const p = params.p || 2; // AR阶数
    const d = params.d || 1; // 差分阶数
    const q = params.q || 1; // MA阶数
    
    // 检查参数合理性
    if (n < p + d + q + 5) {
        throw new Error(`数据点不足，ARIMA(${p},${d},${q})需要至少 ${p + d + q + 5} 个数据点`);
    }
    
    // 1. 差分处理（I部分）
    let diffedValues = difference(values, d);
    const originalStart = values.slice(0, d); // 保存原始数据的前d个值，用于逆差分
    
    // 2. 对差分后的数据使用AR模型
    const phi = autoregressive(diffedValues, p);
    
    // 3. 预测差分后的值
    const diffedPredictions = arForecast(diffedValues, phi, periods);
    
    // 4. 逆差分，还原为原始尺度
    const predictions = inverseDifference(originalStart, diffedPredictions, d);
    
    // 允许负值（如增长率等数据）
    return predictions;
};

/**
 * 自动选择ARIMA参数
 * @param {Array} data - 历史数据
 * @returns {Object} {p, d, q} 参数
 */
const autoArima = (data) => {
    const values = data.map(d => d.value);
    const n = values.length;
    
    // 自动选择差分阶数d（检测数据是否平稳）
    let d = 0;
    let isStationary = false;
    
    // 简单检测：计算一阶差分的方差
    const firstDiff = difference(values, 1);
    const originalVar = variance(values);
    const diffVar = variance(firstDiff);
    
    // 如果差分后方差显著减小，说明需要差分
    if (diffVar < originalVar * 0.8 && n >= 15) {
        d = 1;
        isStationary = true;
    }
    
    // 自动选择AR和MA阶数（简化版：使用固定值）
    const p = Math.min(2, Math.floor(n / 10));
    const q = Math.min(1, Math.floor(n / 15));
    
    return { p, d, q };
};

/**
 * 计算方差
 * @param {Array} data - 数据数组
 * @returns {number} 方差
 */
const variance = (data) => {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return variance;
};

/**
 * 求解线性方程组（高斯消元法）
 * @param {Array} A - 系数矩阵
 * @param {Array} b - 常数向量
 * @returns {Array} 解向量
 */
const solveLinearSystem = (A, b) => {
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);
    
    // 前向消元
    for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                maxRow = k;
            }
        }
        
        [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
        
        if (Math.abs(augmented[i][i]) < 1e-10) {
            throw new Error('矩阵奇异，无法求解');
        }
        
        for (let k = i + 1; k < n; k++) {
            const factor = augmented[k][i] / augmented[i][i];
            for (let j = i; j <= n; j++) {
                augmented[k][j] -= factor * augmented[i][j];
            }
        }
    }
    
    // 回代
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
        x[i] = augmented[i][n];
        for (let j = i + 1; j < n; j++) {
            x[i] -= augmented[i][j] * x[j];
        }
        x[i] /= augmented[i][i];
    }
    
    return x;
};

module.exports = {
    arima,
    autoArima,
    autoregressive,
    difference
};

