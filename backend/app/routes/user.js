const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const userService = require('../services/userService');
const { query } = require('../../config/database');
const bcrypt = require('bcryptjs');
const config = require('../../config/config');

/**
 * 获取当前用户信息
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 更新用户信息
 */
router.put('/update', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, phone, real_name, organization } = req.body;
    
    // 构建更新数据（注意：username 不能直接更新，需要单独处理）
    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (real_name !== undefined) updateData.real_name = real_name;
    // organization 字段在数据库中不存在，可以存储到 real_name 或忽略
    
    const updatedUser = await userService.updateUser(userId, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '更新成功',
      data: updatedUser
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
});

/**
 * 修改密码
 */
router.post('/password', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '请提供当前密码和新密码'
      });
    }
    
    // 验证新密码格式
    if (newPassword.length < 8 || newPassword.length > 20) {
      return res.status(400).json({
        success: false,
        message: '密码长度必须在8-20位之间'
      });
    }
    
    // 获取用户信息（包含密码）
    const user = await userService.findByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 验证当前密码
    const isPasswordValid = await userService.verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '当前密码不正确'
      });
    }
    
    // 更新密码
    await userService.updateUser(userId, { password: newPassword });
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败'
    });
  }
});

/**
 * 获取用户操作日志
 */
router.get('/logs', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 获取用户的系统日志（最近50条）
    const logs = await query(
      `SELECT 
        id,
        log_type,
        action,
        description,
        ip_address,
        created_at
      FROM system_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50`,
      [userId]
    );
    
    // 格式化日志数据
    const formattedLogs = logs.map(log => ({
      id: log.id,
      action: log.action || '未知操作',
      details: log.description || `${log.log_type || '系统'}操作`,
      createdAt: log.created_at,
      logType: log.log_type,
      ipAddress: log.ip_address
    }));
    
    res.json({
      success: true,
      data: formattedLogs
    });
  } catch (error) {
    console.error('获取用户日志错误:', error);
    res.status(500).json({
      success: false,
      message: '获取日志失败'
    });
  }
});

module.exports = router;

