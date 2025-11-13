/**
 * 本地数据控制器
 */
const localDataService = require('../services/localDataService');

/**
 * 获取可用的数据文件列表
 */
const getAvailableFiles = async (req, res) => {
  try {
    const files = await localDataService.getAvailableDataFiles();
    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('获取数据文件列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取数据文件列表失败',
      error: error.message
    });
  }
};

/**
 * 获取数据统计信息
 */
const getStatistics = async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: '文件名不能为空'
      });
    }
    
    const stats = await localDataService.getDataStatistics(filename);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取数据统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取数据统计失败',
      error: error.message
    });
  }
};

/**
 * 查询数据
 */
const queryData = async (req, res) => {
  try {
    const { filename } = req.params;
    const {
      area,
      indicator,
      year,
      dataType,
      startYear,
      endYear,
      sort = 'year_desc',
      page = 1,
      pageSize = 20
    } = req.query;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: '文件名不能为空'
      });
    }
    
    const filters = {
      area,
      indicator,
      year,
      dataType,
      startYear,
      endYear,
      sort
    };
    
    const pagination = {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
    
    const result = await localDataService.queryData(filename, filters, pagination);
    
    res.json({
      success: true,
      data: result.list,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('查询数据失败:', error);
    res.status(500).json({
      success: false,
      message: '查询数据失败',
      error: error.message
    });
  }
};

/**
 * 获取时间序列数据（用于预测）
 */
const getTimeSeries = async (req, res) => {
  try {
    const { filename } = req.params;
    const {
      area = null,
      indicator = null,
      startTime = null,
      endTime = null
    } = req.query;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: '文件名不能为空'
      });
    }
    
    const timeSeries = await localDataService.getTimeSeriesData(filename, {
      area,
      indicator,
      startTime: startTime ? parseInt(startTime) : null,
      endTime: endTime ? parseInt(endTime) : null
    });
    
    res.json({
      success: true,
      data: timeSeries,
      total: timeSeries.length
    });
  } catch (error) {
    console.error('获取时间序列数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取时间序列数据失败',
      error: error.message
    });
  }
};

module.exports = {
  getAvailableFiles,
  getStatistics,
  queryData,
  getTimeSeries
};

