/**
 * 认证控制器
 */
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const userService = require('../services/userService');

/**
 * 登录
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 查找用户
    const user = await userService.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await userService.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成 JWT Token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // 返回用户信息（不包含密码）
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      real_name: user.real_name,
      role: user.role,
      avatar: user.avatar,
      created_at: user.created_at
    };

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: userInfo
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      ...(config.env === 'development' && { error: error.message })
    });
  }
};

/**
 * 登出
 */
const logout = async (req, res) => {
  // JWT 是无状态的，登出主要是客户端删除 token
  // 这里可以记录登出日志等
  res.json({
    success: true,
    message: '登出成功'
  });
};

/**
 * 获取当前用户信息
 */
const getCurrentUser = async (req, res) => {
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
};

/**
 * 获取用户统计信息
 */
const getUserStats = async (req, res) => {
  try {
    const userService = require('../services/userService');
    const stats = await userService.getUserStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取用户统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户统计失败',
      error: error.message
    });
  }
};

/**
 * 获取用户角色统计
 */
const getUserRoleStats = async (req, res) => {
  try {
    const userService = require('../services/userService');
    const stats = await userService.getUserRoleStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取用户角色统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户角色统计失败',
      error: error.message
    });
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser,
  getUserStats,
  getUserRoleStats
};

