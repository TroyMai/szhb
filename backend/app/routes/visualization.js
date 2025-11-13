const express = require('express');
const router = express.Router();
const visualizationController = require('../controllers/visualizationController');
const { authenticate } = require('../middleware/auth');

// 所有可视化路由都需要认证
router.use(authenticate);

// 获取地图可视化数据（用于 data-detail.html）
router.get('/map', visualizationController.getMapData);

module.exports = router;

