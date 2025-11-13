const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { authenticate } = require('../middleware/auth');

// 所有分析路由都需要认证
router.use(authenticate);

// 执行数据分析
router.post('/analyze', analysisController.analyze);

module.exports = router;

