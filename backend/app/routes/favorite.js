/**
 * 收藏路由
 */
const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

// 添加收藏
router.post('/', favoriteController.addFavorite);

// 取消收藏
router.delete('/:dataId', favoriteController.removeFavorite);

// 检查收藏状态
router.get('/check/:dataId', favoriteController.checkFavorite);

// 批量检查收藏状态
router.post('/check-batch', favoriteController.checkFavoritesBatch);

// 获取用户收藏列表
router.get('/list', favoriteController.getFavorites);

module.exports = router;

