const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// 登录（不需要认证）
router.post('/login', authController.login);

// 登出（需要认证）
router.post('/logout', authenticate, authController.logout);

// 获取当前用户信息（需要认证）
router.get('/me', authenticate, authController.getCurrentUser);

// 获取用户统计（需要认证）
router.get('/stats', authenticate, authController.getUserStats);

// 获取用户角色统计（需要认证）
router.get('/stats/roles', authenticate, authController.getUserRoleStats);

module.exports = router;

