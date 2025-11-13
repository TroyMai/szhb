/**
 * 收藏服务
 */
const { query } = require('../../config/database');

/**
 * 添加收藏
 */
const addFavorite = async (userId, dataId) => {
  try {
    // 检查是否已收藏
    const existing = await query(
      'SELECT id FROM user_favorites WHERE user_id = ? AND data_id = ?',
      [userId, dataId]
    );

    if (existing.length > 0) {
      throw new Error('该数据已收藏');
    }

    // 检查数据是否存在
    const data = await query('SELECT id FROM data WHERE id = ? AND status != ?', [dataId, 'deleted']);
    if (data.length === 0) {
      throw new Error('数据不存在或已删除');
    }

    // 添加收藏
    await query(
      'INSERT INTO user_favorites (user_id, data_id) VALUES (?, ?)',
      [userId, dataId]
    );

    return true;
  } catch (error) {
    console.error('添加收藏错误:', error);
    throw error;
  }
};

/**
 * 取消收藏
 */
const removeFavorite = async (userId, dataId) => {
  try {
    const result = await query(
      'DELETE FROM user_favorites WHERE user_id = ? AND data_id = ?',
      [userId, dataId]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error('取消收藏错误:', error);
    throw error;
  }
};

/**
 * 检查是否已收藏
 */
const isFavorite = async (userId, dataId) => {
  try {
    const results = await query(
      'SELECT id FROM user_favorites WHERE user_id = ? AND data_id = ?',
      [userId, dataId]
    );

    return results.length > 0;
  } catch (error) {
    console.error('检查收藏状态错误:', error);
    throw error;
  }
};

/**
 * 获取用户的收藏列表
 */
const getUserFavorites = async (userId, pagination = {}) => {
  try {
    const { page = 1, pageSize = 20 } = pagination;
    const offset = (page - 1) * pageSize;

    // 获取收藏列表（关联数据表）
    const favorites = await query(
      `SELECT 
        f.id as favorite_id,
        f.created_at as favorite_time,
        d.id,
        d.title,
        d.category,
        d.description,
        d.source,
        d.data_type,
        d.status,
        d.created_at,
        d.uploader_id,
        u.username as uploader_name,
        (SELECT COUNT(*) FROM data_records WHERE data_id = d.id) as record_count
      FROM user_favorites f
      INNER JOIN data d ON f.data_id = d.id
      LEFT JOIN users u ON d.uploader_id = u.id
      WHERE f.user_id = ? AND d.status != 'deleted'
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );

    // 获取总数
    const totalResult = await query(
      `SELECT COUNT(*) as total
      FROM user_favorites f
      INNER JOIN data d ON f.data_id = d.id
      WHERE f.user_id = ? AND d.status != 'deleted'`,
      [userId]
    );

    const total = totalResult[0]?.total || 0;

    return {
      list: favorites,
      total,
      page,
      pageSize
    };
  } catch (error) {
    console.error('获取收藏列表错误:', error);
    throw error;
  }
};

/**
 * 批量检查收藏状态（用于查询页面）
 */
const checkFavoritesStatus = async (userId, dataIds) => {
  try {
    if (!dataIds || dataIds.length === 0) {
      return {};
    }

    const placeholders = dataIds.map(() => '?').join(',');
    const results = await query(
      `SELECT data_id FROM user_favorites WHERE user_id = ? AND data_id IN (${placeholders})`,
      [userId, ...dataIds]
    );

    // 转换为对象，方便查找
    const favoriteMap = {};
    results.forEach(row => {
      favoriteMap[row.data_id] = true;
    });

    return favoriteMap;
  } catch (error) {
    console.error('批量检查收藏状态错误:', error);
    throw error;
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  isFavorite,
  getUserFavorites,
  checkFavoritesStatus
};

