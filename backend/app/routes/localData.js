const express = require('express');
const router = express.Router();
const localDataController = require('../controllers/localDataController');
const { authenticate } = require('../middleware/auth');

// 所有本地数据路由都需要认证
router.use(authenticate);

// 获取可用的数据文件列表
router.get('/files', localDataController.getAvailableFiles);

// 获取数据统计信息
router.get('/:filename/statistics', localDataController.getStatistics);

// 获取时间序列数据（用于预测）
router.get('/:filename/timeseries', localDataController.getTimeSeries);

// 查询数据（支持筛选和分页）
router.get('/:filename/query', localDataController.queryData);

module.exports = router;

