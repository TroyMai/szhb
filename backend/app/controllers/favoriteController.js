/**
 * 收藏控制器
 */
const favoriteService = require('../services/favoriteService');

/**
 * 添加收藏
 */
const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dataId } = req.body;

    if (!dataId) {
      return res.status(400).json({
        success: false,
        message: '数据ID不能为空'
      });
    }

    await favoriteService.addFavorite(userId, dataId);

    res.json({
      success: true,
      message: '收藏成功'
    });
  } catch (error) {
    console.error('添加收藏错误:', error);
    res.status(400).json({
      success: false,
      message: error.message || '收藏失败'
    });
  }
};

/**
 * 取消收藏
 */
const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dataId } = req.params;

    if (!dataId) {
      return res.status(400).json({
        success: false,
        message: '数据ID不能为空'
      });
    }

    const result = await favoriteService.removeFavorite(userId, dataId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: '收藏不存在'
      });
    }

    res.json({
      success: true,
      message: '取消收藏成功'
    });
  } catch (error) {
    console.error('取消收藏错误:', error);
    res.status(400).json({
      success: false,
      message: error.message || '取消收藏失败'
    });
  }
};

/**
 * 检查收藏状态
 */
const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dataId } = req.params;

    if (!dataId) {
      return res.status(400).json({
        success: false,
        message: '数据ID不能为空'
      });
    }

    const isFav = await favoriteService.isFavorite(userId, dataId);

    res.json({
      success: true,
      data: {
        isFavorite: isFav
      }
    });
  } catch (error) {
    console.error('检查收藏状态错误:', error);
    res.status(400).json({
      success: false,
      message: error.message || '检查收藏状态失败'
    });
  }
};

/**
 * 批量检查收藏状态
 */
const checkFavoritesBatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dataIds } = req.body;

    if (!dataIds || !Array.isArray(dataIds) || dataIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '数据ID列表不能为空'
      });
    }

    const favoriteMap = await favoriteService.checkFavoritesStatus(userId, dataIds);

    res.json({
      success: true,
      data: favoriteMap
    });
  } catch (error) {
    console.error('批量检查收藏状态错误:', error);
    res.status(400).json({
      success: false,
      message: error.message || '批量检查收藏状态失败'
    });
  }
};

/**
 * 获取用户收藏列表
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;

    const result = await favoriteService.getUserFavorites(userId, {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取收藏列表错误:', error);
    res.status(400).json({
      success: false,
      message: error.message || '获取收藏列表失败'
    });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  checkFavorite,
  checkFavoritesBatch,
  getFavorites
};

