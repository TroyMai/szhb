/**
 * 多项式回归
 * 支持2次、3次多项式回归
 */

/**
 * 计算多项式的系数（使用最小二乘法）
 * @param {Array} data - 历史数据 [{time, value}, ...]
 * @param {number} degree - 多项式次数（2或3）
 * @returns {Array} 系数数组 [a0, a1, a2, ...] 对应 y = a0 + a1*x + a2*x² + ...
 */
const calculatePolynomialCoefficients = (data, degree) => {
    if (!data || data.length < degree + 1) {
        throw new Error(`多项式回归至少需要 ${degree + 1} 个数据点`);
    }
    
    const n = data.length;
    const x = data.map((_, index) => index);
    const y = data.map(d => d.value);
    
    // 构建矩阵 A (Vandermonde矩阵)
    const A = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j <= degree; j++) {
            row.push(Math.pow(x[i], j));
        }
        A.push(row);
    }
    
    // 使用最小二乘法求解：A^T * A * coeffs = A^T * y
    // 简化为求解线性方程组
    
    // 计算 A^T * A
    const AtA = [];
    for (let i = 0; i <= degree; i++) {
        const row = [];
        for (let j = 0; j <= degree; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) {
                sum += Math.pow(x[k], i) * Math.pow(x[k], j);
            }
            row.push(sum);
        }
        AtA.push(row);
    }
    
    // 计算 A^T * y
    const Aty = [];
    for (let i = 0; i <= degree; i++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
            sum += Math.pow(x[k], i) * y[k];
        }
        Aty.push(sum);
    }
    
    // 使用高斯消元法求解线性方程组
    const coeffs = solveLinearSystem(AtA, Aty);
    
    return coeffs;
};

/**
 * 使用高斯消元法求解线性方程组
 * @param {Array} A - 系数矩阵
 * @param {Array} b - 常数向量
 * @returns {Array} 解向量
 */
const solveLinearSystem = (A, b) => {
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);
    
    // 前向消元
    for (let i = 0; i < n; i++) {
        // 找到主元
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                maxRow = k;
            }
        }
        
        // 交换行
        [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
        
        // 如果主元为0，矩阵奇异
        if (Math.abs(augmented[i][i]) < 1e-10) {
            throw new Error('矩阵奇异，无法求解');
        }
        
        // 消元
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

/**
 * 使用多项式系数计算预测值
 * @param {Array} coeffs - 多项式系数 [a0, a1, a2, ...]
 * @param {number} x - 自变量值
 * @returns {number} 预测值
 */
const evaluatePolynomial = (coeffs, x) => {
    let result = 0;
    for (let i = 0; i < coeffs.length; i++) {
        result += coeffs[i] * Math.pow(x, i);
    }
    return result;
};

/**
 * 2次多项式回归
 * @param {Array} data - 历史数据 [{time, value}, ...]
 * @param {number} periods - 预测周期数
 * @returns {Array} 预测值数组
 */
const polynomialRegression2 = (data, periods) => {
    const coeffs = calculatePolynomialCoefficients(data, 2);
    const n = data.length;
    const predictions = [];
    
    for (let i = 0; i < periods; i++) {
        const x = n + i;
        const value = evaluatePolynomial(coeffs, x);
        predictions.push(value);
    }
    
    return predictions;
};

/**
 * 3次多项式回归
 * @param {Array} data - 历史数据 [{time, value}, ...]
 * @param {number} periods - 预测周期数
 * @returns {Array} 预测值数组
 */
const polynomialRegression3 = (data, periods) => {
    const coeffs = calculatePolynomialCoefficients(data, 3);
    const n = data.length;
    const predictions = [];
    
    for (let i = 0; i < periods; i++) {
        const x = n + i;
        const value = evaluatePolynomial(coeffs, x);
        predictions.push(value);
    }
    
    return predictions;
};

/**
 * 自动选择最佳多项式次数
 * @param {Array} data - 历史数据 [{time, value}, ...]
 * @param {number} periods - 预测周期数
 * @returns {Array} 预测值数组
 */
const polynomialRegressionAuto = (data, periods) => {
    if (data.length < 4) {
        // 数据不足，使用2次多项式
        return polynomialRegression2(data, periods);
    }
    
    // 尝试2次和3次多项式，选择R²更高的
    let bestDegree = 2;
    let bestR2 = -Infinity;
    
    for (let degree = 2; degree <= 3; degree++) {
        try {
            if (data.length < degree + 1) continue;
            
            const coeffs = calculatePolynomialCoefficients(data, degree);
            const n = data.length;
            
            // 计算R²
            const yMean = data.reduce((sum, d) => sum + d.value, 0) / n;
            let ssRes = 0; // 残差平方和
            let ssTot = 0; // 总平方和
            
            for (let i = 0; i < n; i++) {
                const predicted = evaluatePolynomial(coeffs, i);
                const actual = data[i].value;
                ssRes += Math.pow(actual - predicted, 2);
                ssTot += Math.pow(actual - yMean, 2);
            }
            
            const r2 = 1 - (ssRes / ssTot);
            
            if (r2 > bestR2) {
                bestR2 = r2;
                bestDegree = degree;
            }
        } catch (e) {
            // 如果计算失败，跳过
            continue;
        }
    }
    
    // 使用最佳次数进行预测
    if (bestDegree === 2) {
        return polynomialRegression2(data, periods);
    } else {
        return polynomialRegression3(data, periods);
    }
};

/**
 * 主函数
 * @param {Array} data - 历史数据 [{time, value}, ...]
 * @param {number} periods - 预测周期数
 * @param {number} degree - 多项式次数 (2, 3, 'auto')
 * @returns {Array} 预测值数组
 */
const polynomialRegression = (data, periods, degree = 'auto') => {
    if (!data || data.length < 3) {
        throw new Error('多项式回归至少需要3个数据点');
    }
    
    if (degree === 'auto') {
        return polynomialRegressionAuto(data, periods);
    } else if (degree === 2) {
        return polynomialRegression2(data, periods);
    } else if (degree === 3) {
        return polynomialRegression3(data, periods);
    } else {
        throw new Error('多项式次数必须是2、3或"auto"');
    }
};

module.exports = {
    polynomialRegression2,
    polynomialRegression3,
    polynomialRegressionAuto,
    polynomialRegression
};

