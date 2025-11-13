/**
 * 数据控制器
 */
const dataService = require('../services/dataService');

/**
 * 获取数据列表
 */
const getDataList = async (req, res) => {
  try {
    const {
      category,
      status,
      keyword,
      startDate,
      endDate,
      source,
      page = 1,
      pageSize = 20,
      sort = 'time_desc'
    } = req.query;
    
    const filters = {
      category,
      status,
      keyword,
      startDate,
      endDate,
      source
    };
    
    const pagination = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      sort
    };
    
    const result = await dataService.getDataList(filters, pagination);
    
    res.json({
      success: true,
      data: result.list,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('获取数据列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据列表失败',
      error: error.message
    });
  }
};

/**
 * 查询数据（支持复杂查询）
 */
const queryData = async (req, res) => {
  try {
    const {
      category,
      status,
      keyword,
      startDate,
      endDate,
      source,
      page = 1,
      pageSize = 20,
      sort = 'time_desc'
    } = req.body;
    
    // 处理筛选条件，确保空字符串不被传递
    const filters = {
      category: (category && category.trim()) ? category.trim() : undefined,
      status: (status && status.trim()) ? status.trim() : 'approved', // 普通用户只能查询已审核的数据
      keyword: (keyword && keyword.trim()) ? keyword.trim() : undefined,
      startDate: (startDate && startDate.trim()) ? startDate.trim() : undefined,
      endDate: (endDate && endDate.trim()) ? endDate.trim() : undefined,
      source: (source && source.trim()) ? source.trim() : undefined
    };
    
    const pagination = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      sort
    };
    
    const result = await dataService.getDataList(filters, pagination);
    
    res.json({
      success: true,
      data: {
        list: result.list,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('查询数据错误:', error);
    res.status(500).json({
      success: false,
      message: '查询数据失败',
      error: error.message
    });
  }
};

/**
 * 获取数据详情
 */
const getDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await dataService.getDataById(id);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: '数据不存在'
      });
    }
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('获取数据详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据详情失败',
      error: error.message
    });
  }
};

/**
 * 根据标题获取数据详情
 */
const getDataByTitle = async (req, res) => {
  try {
    const { title } = req.params;
    const data = await dataService.getDataByTitle(decodeURIComponent(title));
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: '数据不存在'
      });
    }
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('获取数据详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据详情失败',
      error: error.message
    });
  }
};

/**
 * 创建数据（需要认证）
 */
const createData = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // 只有管理员可以创建数据
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限创建数据'
      });
    }
    
    const dataId = await dataService.createData(req.body, userId);
    
    const data = await dataService.getDataById(dataId);
    
    res.status(201).json({
      success: true,
      message: '数据创建成功',
      data
    });
  } catch (error) {
    console.error('创建数据错误:', error);
    res.status(500).json({
      success: false,
      message: '创建数据失败',
      error: error.message
    });
  }
};

/**
 * 更新数据（需要认证）
 */
const updateData = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const data = await dataService.updateData(id, req.body, userId, userRole);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: '数据不存在'
      });
    }
    
    res.json({
      success: true,
      message: '数据更新成功',
      data
    });
  } catch (error) {
    console.error('更新数据错误:', error);
    
    if (error.message === '无权限修改此数据') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '更新数据失败',
      error: error.message
    });
  }
};

/**
 * 删除数据（需要认证）
 */
const deleteData = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    await dataService.deleteData(id, userId, userRole);
    
    res.json({
      success: true,
      message: '数据删除成功'
    });
  } catch (error) {
    console.error('删除数据错误:', error);
    
    if (error.message === '无权限删除此数据') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '删除数据失败',
      error: error.message
    });
  }
};

/**
 * 审核数据（管理员）
 */
const approveData = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' 或 'reject'
    const reviewerId = req.user.id;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限审核数据'
      });
    }
    
    const data = await dataService.approveData(id, reviewerId, action);
    
    res.json({
      success: true,
      message: action === 'approve' ? '数据审核通过' : '数据审核已撤销',
      data
    });
  } catch (error) {
    console.error('审核数据错误:', error);
    res.status(500).json({
      success: false,
      message: '审核数据失败',
      error: error.message
    });
  }
};

/**
 * 获取数据类别统计
 */
const getCategoryStats = async (req, res) => {
  try {
    const stats = await dataService.getCategoryStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取类别统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取类别统计失败',
      error: error.message
    });
  }
};

/**
 * 获取数据统计信息
 */
const getDataStats = async (req, res) => {
  try {
    const stats = await dataService.getDataStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取数据统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据统计失败',
      error: error.message
    });
  }
};

/**
 * 获取数据趋势统计
 */
const getTrendStats = async (req, res) => {
  try {
    const stats = await dataService.getTrendStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取趋势统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取趋势统计失败',
      error: error.message
    });
  }
};

/**
 * 获取数据来源统计
 */
const getSourceStats = async (req, res) => {
  try {
    const stats = await dataService.getSourceStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取来源统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取来源统计失败',
      error: error.message
    });
  }
};

/**
 * 批量操作
 */
const batchOperation = async (req, res) => {
  try {
    const { ids, operation } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限执行批量操作'
      });
    }
    
    await dataService.batchOperation(ids, operation, userId, userRole);
    
    res.json({
      success: true,
      message: '批量操作成功'
    });
  } catch (error) {
    console.error('批量操作错误:', error);
    res.status(500).json({
      success: false,
      message: error.message || '批量操作失败',
      error: error.message
    });
  }
};

/**
 * 获取筛选选项
 */
const getFilterOptions = async (req, res) => {
  try {
    const options = await dataService.getFilterOptions();
    
    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('获取筛选选项错误:', error);
    res.status(500).json({
      success: false,
      message: '获取筛选选项失败',
      error: error.message
    });
  }
};

/**
 * 获取数据记录
 */
const getDataRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20, city, startDate, endDate } = req.query;
    
    const result = await dataService.getDataRecords(id, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      city,
      startDate,
      endDate
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取数据记录错误:', error);
    res.status(500).json({
      success: false,
      message: '获取数据记录失败',
      error: error.message
    });
  }
};

/**
 * 获取数据记录统计（按月）
 */
const getDataRecordsByMonth = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await dataService.getDataRecordsByMonth(id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取月度统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取月度统计失败',
      error: error.message
    });
  }
};

/**
 * 导出数据（CSV格式）
 */
const exportData = async (req, res) => {
  try {
    const { id } = req.params;
    const exportResult = await dataService.exportDataToCSV(id);
    
    // 设置响应头
    res.setHeader('Content-Type', exportResult.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(exportResult.filename)}"`);
    
    // 发送CSV内容
    res.send(exportResult.content);
  } catch (error) {
    console.error('导出数据错误:', error);
    res.status(500).json({
      success: false,
      message: '导出数据失败',
      error: error.message
    });
  }
};

module.exports = {
  getDataList,
  queryData,
  getDataById,
  getDataByTitle,
  createData,
  updateData,
  deleteData,
  approveData,
  getCategoryStats,
  getDataStats,
  getTrendStats,
  getSourceStats,
  getFilterOptions,
  batchOperation,
  getDataRecords,
  getDataRecordsByMonth,
  exportData
};

