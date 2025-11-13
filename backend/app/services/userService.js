/**
 * 用户服务
 */
const { getPool, query } = require('../../config/database');
const bcrypt = require('bcryptjs');
const config = require('../../config/config');

/**
 * 根据用户名查找用户
 */
const findByUsername = async (username) => {
  try {
    const results = await query(
      'SELECT * FROM users WHERE username = ? AND status = ?',
      [username, 'active']
    );
    return results[0] || null;
  } catch (error) {
    console.error('查找用户错误:', error);
    throw error;
  }
};

/**
 * 根据ID查找用户
 */
const findById = async (id) => {
  try {
    const results = await query(
      'SELECT id, username, email, phone, real_name, role, status, avatar, created_at FROM users WHERE id = ?',
      [id]
    );
    return results[0] || null;
  } catch (error) {
    console.error('查找用户错误:', error);
    throw error;
  }
};

/**
 * 验证密码
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * 创建用户
 */
const createUser = async (userData) => {
  try {
    const { username, password, email, phone, real_name, role } = userData;
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.rounds);
    
    const result = await query(
      `INSERT INTO users (username, password, email, phone, real_name, role, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [username, hashedPassword, email || null, phone || null, real_name || null, role || 'normal_user']
    );
    
    return result.insertId;
  } catch (error) {
    console.error('创建用户错误:', error);
    throw error;
  }
};

/**
 * 更新用户信息
 */
const updateUser = async (id, userData) => {
  try {
    const fields = [];
    const values = [];
    
    if (userData.email !== undefined) {
      fields.push('email = ?');
      values.push(userData.email);
    }
    if (userData.phone !== undefined) {
      fields.push('phone = ?');
      values.push(userData.phone);
    }
    if (userData.real_name !== undefined) {
      fields.push('real_name = ?');
      values.push(userData.real_name);
    }
    if (userData.avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(userData.avatar);
    }
    if (userData.password) {
      const hashedPassword = await bcrypt.hash(userData.password, config.bcrypt.rounds);
      fields.push('password = ?');
      values.push(hashedPassword);
    }
    
    if (fields.length === 0) {
      return null;
    }
    
    values.push(id);
    
    await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return await findById(id);
  } catch (error) {
    console.error('更新用户错误:', error);
    throw error;
  }
};

/**
 * 获取用户统计信息
 */
const getUserStats = async () => {
  try {
    const stats = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN role = 'decision_user' THEN 1 ELSE 0 END) as decision_user_count,
        SUM(CASE WHEN role = 'normal_user' THEN 1 ELSE 0 END) as normal_user_count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_count
      FROM users`
    );
    
    return stats[0] || {
      total: 0,
      admin_count: 0,
      decision_user_count: 0,
      normal_user_count: 0,
      active_count: 0,
      today_count: 0
    };
  } catch (error) {
    console.error('获取用户统计错误:', error);
    throw error;
  }
};

/**
 * 获取用户角色统计
 */
const getUserRoleStats = async () => {
  try {
    const results = await query(
      `SELECT 
        role,
        COUNT(*) as count
      FROM users
      WHERE status = 'active'
      GROUP BY role
      ORDER BY count DESC`
    );
    
    return results;
  } catch (error) {
    console.error('获取用户角色统计错误:', error);
    throw error;
  }
};

module.exports = {
  findByUsername,
  findById,
  verifyPassword,
  createUser,
  updateUser,
  getUserStats,
  getUserRoleStats
};

