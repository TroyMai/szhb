/**
 * 本地数据服务
 * 从本地 JSON 文件读取数据，用于预测功能
 */
const fs = require('fs').promises;
const path = require('path');

// 数据文件目录
const DATA_DIR = path.join(__dirname, '../../data/entries');

/**
 * 获取所有可用的数据文件列表
 * @returns {Promise<Array>} 数据文件信息列表
 */
const getAvailableDataFiles = async () => {
  try {
    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    return jsonFiles.map(file => ({
      filename: file,
      name: file.replace('.json', ''),
      path: path.join(DATA_DIR, file)
    }));
  } catch (error) {
    console.error('读取数据文件目录失败:', error);
    return [];
  }
};

/**
 * 读取 JSON 数据文件
 * @param {string} filename - 文件名（如：市州农林牧渔业增加值信息.json）
 * @returns {Promise<Array>} 数据数组
 */
const loadDataFile = async (filename) => {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // 确保返回的是数组
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error(`读取数据文件失败 [${filename}]:`, error);
    throw new Error(`读取数据文件失败: ${error.message}`);
  }
};

/**
 * 检测时间格式类型
 * @param {Array} timeValues - 时间值数组
 * @returns {string} 'year' 或 'yearmonth'
 */
const detectTimeFormat = (timeValues) => {
  if (!timeValues || timeValues.length === 0) return 'year';
  
  // 检查是否有6位数字（年月格式，如 202401）
  const hasYearMonth = timeValues.some(val => {
    const num = parseInt(val);
    return num >= 100000 && num <= 999999; // 6位数字
  });
  
  return hasYearMonth ? 'yearmonth' : 'year';
};

/**
 * 格式化时间范围显示
 * @param {Array} timeValues - 时间值数组
 * @param {string} format - 时间格式类型
 * @returns {string} 格式化的时间范围字符串
 */
const formatTimeRange = (timeValues, format) => {
  if (!timeValues || timeValues.length === 0) return '-';
  
  const sorted = [...timeValues].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  
  if (format === 'yearmonth') {
    // 年月格式：202401 -> 2024年01月
    const formatYearMonth = (ym) => {
      const str = String(ym);
      if (str.length === 6) {
        const year = str.substring(0, 4);
        const month = str.substring(4, 6);
        return `${year}年${parseInt(month)}月`;
      }
      return str;
    };
    return `${formatYearMonth(min)} - ${formatYearMonth(max)}`;
  } else {
    // 年份格式
    return `${min} - ${max}`;
  }
};

/**
 * 获取数据统计信息
 * @param {string} filename - 文件名
 * @returns {Promise<Object>} 统计信息
 */
const getDataStatistics = async (filename) => {
  try {
    const data = await loadDataFile(filename);
    
    // 提取所有时间值
    const timeValues = data.map(item => item.repp).filter(val => val !== null && val !== undefined);
    
    // 检测时间格式
    const timeFormat = detectTimeFormat(timeValues);
    
    // 统计信息
    const stats = {
      total: data.length,
      areas: [...new Set(data.map(item => item.area).filter(Boolean))],
      indicators: [...new Set(data.map(item => item.data_name).filter(Boolean))],
      timeValues: [...new Set(timeValues)].sort((a, b) => a - b),
      timeFormat: timeFormat, // 'year' 或 'yearmonth'
      timeRange: formatTimeRange(timeValues, timeFormat),
      dataTypes: [...new Set(data.map(item => item.data_type).filter(Boolean))],
      dateRange: {
        min: timeValues.length > 0 ? Math.min(...timeValues) : null,
        max: timeValues.length > 0 ? Math.max(...timeValues) : null
      }
    };
    
    return stats;
  } catch (error) {
    console.error(`获取数据统计失败 [${filename}]:`, error);
    throw error;
  }
};

/**
 * 查询数据（支持筛选和分页）
 * @param {string} filename - 文件名
 * @param {Object} filters - 筛选条件
 * @param {Object} pagination - 分页参数
 * @returns {Promise<Object>} 查询结果
 */
const queryData = async (filename, filters = {}, pagination = {}) => {
  try {
    const data = await loadDataFile(filename);
    
    // 应用筛选条件
    let filteredData = data;
    
    if (filters.area) {
      filteredData = filteredData.filter(item => item.area === filters.area);
    }
    
    if (filters.indicator) {
      filteredData = filteredData.filter(item => item.data_name === filters.indicator);
    }
    
    if (filters.year) {
      filteredData = filteredData.filter(item => item.repp === parseInt(filters.year));
    }
    
    if (filters.dataType) {
      filteredData = filteredData.filter(item => item.data_type === filters.dataType);
    }
    
    if (filters.startYear) {
      filteredData = filteredData.filter(item => item.repp >= parseInt(filters.startYear));
    }
    
    if (filters.endYear) {
      filteredData = filteredData.filter(item => item.repp <= parseInt(filters.endYear));
    }
    
    // 排序（默认按年份降序）
    filteredData.sort((a, b) => {
      if (filters.sort === 'year_asc') {
        return (a.repp || 0) - (b.repp || 0);
      }
      return (b.repp || 0) - (a.repp || 0);
    });
    
    // 分页
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 20;
    const total = filteredData.length;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    const paginatedData = filteredData.slice(offset, offset + pageSize);
    
    return {
      list: paginatedData,
      total,
      page,
      pageSize,
      totalPages
    };
  } catch (error) {
    console.error(`查询数据失败 [${filename}]:`, error);
    throw error;
  }
};

/**
 * 获取用于预测的时间序列数据
 * @param {string} filename - 文件名
 * @param {Object} options - 选项
 * @returns {Promise<Array>} 时间序列数据
 */
const getTimeSeriesData = async (filename, options = {}) => {
  try {
    const {
      area = null,
      indicator = null,
      startTime = null,
      endTime = null
    } = options;
    
    const data = await loadDataFile(filename);
    
    // 筛选数据
    let filteredData = data.filter(item => {
      if (area && item.area !== area) return false;
      if (indicator && item.data_name !== indicator) return false;
      if (startTime) {
        const start = parseInt(startTime);
        if (item.repp < start) return false;
      }
      if (endTime) {
        const end = parseInt(endTime);
        if (item.repp > end) return false;
      }
      return true;
    });
    
    // 按时间排序
    filteredData.sort((a, b) => (a.repp || 0) - (b.repp || 0));
    
    // 转换为时间序列格式
    return filteredData.map(item => ({
      time: item.repp,
      value: parseFloat(item.data2) || 0,
      indicator: item.data_name,
      area: item.area,
      dataType: item.data_type,
      date: item.data_up_time
    }));
  } catch (error) {
    console.error(`获取时间序列数据失败 [${filename}]:`, error);
    throw error;
  }
};

module.exports = {
  getAvailableDataFiles,
  loadDataFile,
  getDataStatistics,
  queryData,
  getTimeSeriesData
};

