const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const { authenticate } = require('../middleware/auth');

// 执行预测（需要认证）
router.post('/predict', authenticate, predictionController.predict);

module.exports = router;

