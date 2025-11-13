/**
 * 预测控制器
 */
const predictionService = require('../services/predictionService');
const localDataService = require('../services/localDataService');

/**
 * 执行预测
 * POST /api/prediction/predict
 */
const predict = async (req, res) => {
    try {
        const {
            filename,
            area,
            indicator,
            startTime,
            endTime,
            period,
            model = 'linear',
            modelParams = {}  // 模型特定参数
        } = req.body;
        
        // 参数验证
        if (!filename) {
            return res.status(400).json({
                success: false,
                message: '缺少参数: filename'
            });
        }
        
        if (!area) {
            return res.status(400).json({
                success: false,
                message: '缺少参数: area'
            });
        }
        
        if (!indicator) {
            return res.status(400).json({
                success: false,
                message: '缺少参数: indicator'
            });
        }
        
        if (!startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: '缺少参数: startTime 或 endTime'
            });
        }
        
        if (!period || period <= 0) {
            return res.status(400).json({
                success: false,
                message: '预测周期数必须大于0'
            });
        }
        
        // 获取时间序列数据
        const timeSeriesData = await localDataService.getTimeSeriesData(filename, {
            area: area,
            indicator: indicator,
            startTime: startTime,
            endTime: endTime
        });
        
        if (!timeSeriesData || timeSeriesData.length < 2) {
            return res.status(400).json({
                success: false,
                message: '历史数据不足，至少需要2个数据点'
            });
        }
        
        // 检测时间格式
        const firstTime = timeSeriesData[0].time;
        const timeFormat = String(firstTime).length === 6 && parseInt(firstTime) >= 100000 && parseInt(firstTime) <= 999999
            ? 'yearmonth'
            : 'year';
        
        // 验证模型数据要求
        if (!predictionService.validateModelDataRequirements(model, timeSeriesData.length)) {
            const requirements = {
                'linear': 2,
                'exponential': 3,
                'movingAverage': 2,
                'polynomial': 3,
                'arima': 20
            };
            const minRequired = requirements[model] || 2;
            return res.status(400).json({
                success: false,
                message: `${model} 模型至少需要 ${minRequired} 个数据点，当前只有 ${timeSeriesData.length} 个`
            });
        }
        
        // 检测时间间隔
        const timeInterval = predictionService.detectTimeInterval(timeSeriesData);
        
        // 生成预测
        const predictionResult = predictionService.generatePrediction(
            timeSeriesData,
            period,
            model,
            timeInterval,
            timeFormat,
            {
                modelParams: modelParams
            }
        );
        
        res.json({
            success: true,
            data: predictionResult
        });
        
    } catch (error) {
        console.error('预测失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '预测失败'
        });
    }
};

module.exports = {
    predict
};

