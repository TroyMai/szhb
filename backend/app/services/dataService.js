/**
 * 数据服务
 */
const { getPool, query } = require('../../config/database');

/**
 * 获取数据列表（支持分页和筛选）
 */
const getDataList = async (filters = {}, pagination = {}) => {
  try {
    const { category, status, keyword, startDate, endDate, source } = filters;
    const { page = 1, pageSize = 20, sort = 'time_desc' } = pagination;
    
    let whereConditions = ['d.status != ?'];
    let params = ['deleted'];
    
    // 构建 WHERE 条件（确保值不为空字符串）
    if (category && typeof category === 'string' && category.trim()) {
      whereConditions.push('d.category = ?');
      params.push(category.trim());
    }
    
    if (status && typeof status === 'string' && status.trim()) {
      whereConditions.push('d.status = ?');
      params.push(status.trim());
    }
    
    if (keyword && typeof keyword === 'string' && keyword.trim()) {
      whereConditions.push('(d.title LIKE ? OR d.description LIKE ?)');
      params.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`);
    }
    
    if (startDate && typeof startDate === 'string' && startDate.trim()) {
      whereConditions.push('DATE(d.created_at) >= ?');
      params.push(startDate.trim());
    }
    
    if (endDate && typeof endDate === 'string' && endDate.trim()) {
      whereConditions.push('DATE(d.created_at) <= ?');
      params.push(endDate.trim());
    }
    
    if (source && typeof source === 'string' && source.trim()) {
      whereConditions.push('d.source = ?');
      params.push(source.trim());
    }
    
    // 排序
    let orderBy = 'd.created_at DESC';
    switch (sort) {
      case 'time_asc':
        orderBy = 'd.created_at ASC';
        break;
      case 'time_desc':
        orderBy = 'd.created_at DESC';
        break;
      case 'value_asc':
        // 按数据记录数量升序排序（记录数少的在前）
        orderBy = 'record_count ASC, d.created_at DESC';
        break;
      case 'value_desc':
        // 按数据记录数量降序排序（记录数多的在前）
        orderBy = 'record_count DESC, d.created_at DESC';
        break;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM data d ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;
    
    // 获取数据列表
    const offset = (page - 1) * pageSize;
    const dataSql = `
      SELECT 
        d.id,
        d.title,
        d.category,
        d.description,
        d.source,
        d.data_type,
        d.status,
        d.created_at,
        d.updated_at,
        u.username as uploader_name,
        COUNT(dr.id) as record_count
      FROM data d
      LEFT JOIN users u ON d.uploader_id = u.id
      LEFT JOIN data_records dr ON d.id = dr.data_id
      ${whereClause}
      GROUP BY d.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    
    // 确保 pageSize 和 offset 是数字
    const dataParams = [...params, parseInt(pageSize), parseInt(offset)];
    const data = await query(dataSql, dataParams);
    
    return {
      list: data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error('获取数据列表错误:', error);
    throw error;
  }
};

/**
 * 检测数据类型（根据 metadata 特征）
 * @param {number} dataId - 数据ID
 * @returns {Promise<string>} 'monthly' | 'city' | 'unknown'
 */
const detectDataType = async (dataId) => {
  try {
    // 检查是否有月份数据
    const monthCheck = await query(
      `SELECT COUNT(*) as count 
       FROM data_records 
       WHERE data_id = ? 
         AND JSON_EXTRACT(metadata, "$.month") IS NOT NULL
       LIMIT 1`,
      [dataId]
    );
    
    // 检查是否有城市数据
    const cityCheck = await query(
      `SELECT COUNT(*) as count 
       FROM data_records 
       WHERE data_id = ? 
         AND JSON_EXTRACT(metadata, "$.city") IS NOT NULL
       LIMIT 1`,
      [dataId]
    );
    
    const hasMonth = monthCheck[0]?.count > 0;
    const hasCity = cityCheck[0]?.count > 0;
    
    if (hasMonth && !hasCity) {
      return 'monthly'; // 月度数据（全省不分州市）
    } else if (hasCity && !hasMonth) {
      return 'city'; // 城市数据（分州市不分月份）
    } else if (hasMonth && hasCity) {
      // 如果两者都有，优先使用城市数据（地图可视化）
      return 'city';
    }
    
    return 'unknown';
  } catch (error) {
    console.error('检测数据类型错误:', error);
    return 'unknown';
  }
};

/**
 * 根据ID获取数据详情
 */
const getDataById = async (id) => {
  try {
    const results = await query(
      `SELECT 
        d.*,
        u.username as uploader_name,
        r.username as reviewer_name
      FROM data d
      LEFT JOIN users u ON d.uploader_id = u.id
      LEFT JOIN users r ON d.reviewer_id = r.id
      WHERE d.id = ? AND d.status != ?`,
      [id, 'deleted']
    );
    
    if (results.length === 0) {
      return null;
    }
    
    const data = results[0];
    
    // 检测数据类型
    const dataType = await detectDataType(data.id);
    data.visualizationType = dataType; // 'monthly' | 'city' | 'unknown'
    
    // 获取数据记录
    const records = await query(
      'SELECT * FROM data_records WHERE data_id = ? ORDER BY record_date DESC LIMIT 100',
      [id]
    );
    
    data.records = records;
    
    return data;
  } catch (error) {
    console.error('获取数据详情错误:', error);
    throw error;
  }
};

/**
 * 根据标题获取数据详情
 */
const getDataByTitle = async (title) => {
  try {
    const results = await query(
      `SELECT 
        d.*,
        u.username as uploader_name,
        r.username as reviewer_name
      FROM data d
      LEFT JOIN users u ON d.uploader_id = u.id
      LEFT JOIN users r ON d.reviewer_id = r.id
      WHERE d.title = ? AND d.status != ?`,
      [title, 'deleted']
    );
    
    if (results.length === 0) {
      return null;
    }
    
    const data = results[0];
    
    // 检测数据类型
    const dataType = await detectDataType(data.id);
    data.visualizationType = dataType; // 'monthly' | 'city' | 'unknown'
    
    // 获取数据记录
    const records = await query(
      'SELECT * FROM data_records WHERE data_id = ? ORDER BY record_date DESC LIMIT 100',
      [data.id]
    );
    
    data.records = records;
    
    return data;
  } catch (error) {
    console.error('获取数据详情错误:', error);
    throw error;
  }
};

/**
 * 创建数据
 */
const createData = async (dataInfo, uploaderId) => {
  try {
    const {
      title,
      category,
      description,
      source,
      data_type,
      file_path,
      file_size
    } = dataInfo;
    
    const result = await query(
      `INSERT INTO data 
       (title, category, description, source, data_type, file_path, file_size, uploader_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [title, category, description || null, source || null, data_type || null, file_path || null, file_size || 0, uploaderId]
    );
    
    return result.insertId;
  } catch (error) {
    console.error('创建数据错误:', error);
    throw error;
  }
};

/**
 * 更新数据
 */
const updateData = async (id, dataInfo, userId, userRole) => {
  try {
    // 检查权限：只有管理员或上传者可以修改
    const data = await getDataById(id);
    if (!data) {
      throw new Error('数据不存在');
    }
    
    if (userRole !== 'admin' && data.uploader_id !== userId) {
      throw new Error('无权限修改此数据');
    }
    
    const {
      title,
      category,
      description,
      source,
      data_type
    } = dataInfo;
    
    const fields = [];
    const params = [];
    
    if (title !== undefined) {
      fields.push('title = ?');
      params.push(title);
    }
    if (category !== undefined) {
      fields.push('category = ?');
      params.push(category);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      params.push(description);
    }
    if (source !== undefined) {
      fields.push('source = ?');
      params.push(source);
    }
    if (data_type !== undefined) {
      fields.push('data_type = ?');
      params.push(data_type);
    }
    
    if (fields.length === 0) {
      return null;
    }
    
    params.push(id);
    
    await query(
      `UPDATE data SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    
    return await getDataById(id);
  } catch (error) {
    console.error('更新数据错误:', error);
    throw error;
  }
};

/**
 * 删除数据（软删除）
 */
const deleteData = async (id, userId, userRole) => {
  try {
    // 检查权限
    const data = await getDataById(id);
    if (!data) {
      throw new Error('数据不存在');
    }
    
    if (userRole !== 'admin' && data.uploader_id !== userId) {
      throw new Error('无权限删除此数据');
    }
    
    await query(
      'UPDATE data SET status = ? WHERE id = ?',
      ['deleted', id]
    );
    
    return true;
  } catch (error) {
    console.error('删除数据错误:', error);
    throw error;
  }
};

/**
 * 审核数据
 */
const approveData = async (id, reviewerId, action) => {
  try {
    const status = action === 'approve' ? 'approved' : 'pending';
    
    await query(
      `UPDATE data 
       SET status = ?, reviewer_id = ?, reviewed_at = NOW() 
       WHERE id = ?`,
      [status, reviewerId, id]
    );
    
    return await getDataById(id);
  } catch (error) {
    console.error('审核数据错误:', error);
    throw error;
  }
};

/**
 * 获取数据类别统计
 */
/**
 * 获取所有可用的筛选选项
 */
const getFilterOptions = async () => {
  try {
    // 获取所有类别
    const categories = await query(
      `SELECT DISTINCT category 
       FROM data 
       WHERE status != 'deleted' AND category IS NOT NULL AND category != ''
       ORDER BY category ASC`
    );
    
    // 获取所有来源
    const sources = await query(
      `SELECT DISTINCT source 
       FROM data 
       WHERE status != 'deleted' AND source IS NOT NULL AND source != ''
       ORDER BY source ASC`
    );
    
    // 获取所有地区（如果region字段不存在，返回默认值）
    let regions = [];
    try {
      const regionResults = await query(
        `SELECT DISTINCT region 
         FROM data 
         WHERE status != 'deleted' AND region IS NOT NULL AND region != ''
         ORDER BY region ASC`
      );
      regions = regionResults.map(r => r.region);
    } catch (error) {
      // 如果region字段不存在，使用默认值
      regions = ['武汉市', '宜昌市', '襄阳市', '荆州市'];
    }
    
    return {
      categories: categories.map(c => c.category),
      sources: sources.map(s => s.source),
      regions: regions.length > 0 ? regions : ['武汉市', '宜昌市', '襄阳市', '荆州市']
    };
  } catch (error) {
    console.error('获取筛选选项错误:', error);
    throw error;
  }
};

const getCategoryStats = async () => {
  try {
    const results = await query(
      `SELECT 
        category,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count
      FROM data
      WHERE status != 'deleted'
      GROUP BY category
      ORDER BY count DESC`
    );
    
    return results;
  } catch (error) {
    console.error('获取类别统计错误:', error);
    throw error;
  }
};

/**
 * 获取数据统计信息
 */
const getDataStats = async () => {
  try {
    const stats = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today,
        COUNT(DISTINCT category) as categories
      FROM data
      WHERE status != 'deleted'`
    );
    
    return stats[0] || {
      total: 0,
      pending: 0,
      approved: 0,
      today: 0,
      categories: 0
    };
  } catch (error) {
    console.error('获取数据统计错误:', error);
    throw error;
  }
};

/**
 * 获取数据趋势统计（按年份）
 */
const getTrendStats = async () => {
  try {
    const results = await query(
      `SELECT 
        YEAR(created_at) as year,
        COUNT(*) as count
      FROM data
      WHERE status != 'deleted'
      GROUP BY YEAR(created_at)
      ORDER BY year ASC`
    );
    
    return results;
  } catch (error) {
    console.error('获取趋势统计错误:', error);
    throw error;
  }
};

/**
 * 获取数据来源统计
 */
const getSourceStats = async () => {
  try {
    const results = await query(
      `SELECT 
        source,
        COUNT(*) as count
      FROM data
      WHERE status != 'deleted' AND source IS NOT NULL AND source != ''
      GROUP BY source
      ORDER BY count DESC
      LIMIT 10`
    );
    
    return results;
  } catch (error) {
    console.error('获取来源统计错误:', error);
    throw error;
  }
};

/**
 * 批量操作
 */
const batchOperation = async (ids, operation, userId, userRole) => {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('请选择要操作的数据');
    }
    
    const placeholders = ids.map(() => '?').join(',');
    
    switch (operation) {
      case 'approve':
        if (userRole !== 'admin') {
          throw new Error('无权限执行此操作');
        }
        await query(
          `UPDATE data 
           SET status = 'approved', reviewer_id = ?, reviewed_at = NOW() 
           WHERE id IN (${placeholders}) AND status = 'pending'`,
          [userId, ...ids]
        );
        break;
        
      case 'delete':
        if (userRole !== 'admin') {
          throw new Error('无权限执行此操作');
        }
        await query(
          `UPDATE data SET status = 'deleted' WHERE id IN (${placeholders})`,
          ids
        );
        break;
        
      default:
        throw new Error('不支持的操作');
    }
    
    return true;
  } catch (error) {
    console.error('批量操作错误:', error);
    throw error;
  }
};

/**
 * 获取数据记录（支持分页和筛选）
 */
const getDataRecords = async (dataId, options = {}) => {
  try {
    const { page = 1, pageSize = 20, city, startDate, endDate } = options;
    
    let whereConditions = ['data_id = ?'];
    let params = [dataId];
    
    // 筛选条件
    if (city) {
      whereConditions.push('JSON_EXTRACT(metadata, "$.city") = ?');
      params.push(city);
    }
    
    if (startDate) {
      whereConditions.push('record_date >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push('record_date <= ?');
      params.push(endDate);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM data_records ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;
    
    // 获取数据列表
    const offset = (page - 1) * pageSize;
    const dataSql = `
      SELECT 
        id,
        data_id,
        record_date,
        value,
        text_value,
        metadata,
        created_at
      FROM data_records
      ${whereClause}
      ORDER BY record_date DESC, id DESC
      LIMIT ? OFFSET ?
    `;
    
    const dataParams = [...params, parseInt(pageSize), parseInt(offset)];
    const records = await query(dataSql, dataParams);
    
    // 解析 metadata JSON
    const processedRecords = records.map(record => {
      let metadata = null;
      try {
        if (record.metadata) {
          metadata = typeof record.metadata === 'string' 
            ? JSON.parse(record.metadata) 
            : record.metadata;
        }
      } catch (e) {
        console.error('解析 metadata 失败:', e);
      }
      return {
        ...record,
        metadata
      };
    });
    
    return {
      list: processedRecords,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error('获取数据记录错误:', error);
    throw error;
  }
};

/**
 * 获取数据统计（按月分组）
 */
const getDataRecordsByMonth = async (dataId) => {
  try {
    const results = await query(
      `SELECT 
        JSON_EXTRACT(metadata, "$.month") as month,
        JSON_EXTRACT(metadata, "$.monthName") as monthName,
        JSON_EXTRACT(metadata, "$.unit") as unit,
        value,
        record_date
      FROM data_records
      WHERE data_id = ? 
        AND JSON_EXTRACT(metadata, "$.month") IS NOT NULL
      ORDER BY month ASC`,
      [dataId]
    );
    
    return results.map(row => {
      const monthName = row.monthName ? row.monthName.replace(/"/g, '') : '';
      // 兼容不同的字段名：funding, count, value
      const value = parseFloat(row.value) || 0;
      
      // 获取单位（从第一条记录的 metadata 中提取）
      let unit = '';
      if (row.unit) {
        unit = typeof row.unit === 'string' && row.unit.startsWith('"') && row.unit.endsWith('"') 
          ? row.unit.slice(1, -1) 
          : row.unit;
      }
      
      return {
        month: parseInt(row.month) || 0,
        monthName: monthName || `${parseInt(row.month) || 0}月`,
        funding: value, // 保持兼容性
        count: value,   // 企业注册数量使用此字段
        value: value,   // 通用字段
        unit: unit,     // 单位字段
        recordDate: row.record_date
      };
    });
  } catch (error) {
    console.error('获取月度统计错误:', error);
    throw error;
  }
};

/**
 * 导出数据为CSV格式
 */
const exportDataToCSV = async (dataId) => {
  try {
    // 获取数据详情
    const data = await getDataById(dataId);
    if (!data) {
      throw new Error('数据不存在');
    }

    // 获取所有数据记录
    const records = await query(
      `SELECT 
        record_date,
        value,
        text_value,
        metadata
      FROM data_records
      WHERE data_id = ?
      ORDER BY record_date ASC`,
      [dataId]
    );

    if (records.length === 0) {
      throw new Error('没有数据记录可导出');
    }

    // 解析第一条记录的 metadata 以确定数据类型和单位
    let firstMetadata = null;
    try {
      if (records[0].metadata) {
        firstMetadata = typeof records[0].metadata === 'string' 
          ? JSON.parse(records[0].metadata) 
          : records[0].metadata;
      }
    } catch (e) {
      // 忽略解析错误
    }

    // 确定数据类型和单位
    const isMonthly = firstMetadata?.month !== undefined;
    const isCity = firstMetadata?.city !== undefined;
    const unit = firstMetadata?.unit || '';
    
    // 构建数据列标题
    let valueColumnHeader = '数值';
    if (unit) {
      valueColumnHeader = `数值(${unit})`;
    } else {
      // 如果没有单位，根据标题关键词智能识别
      if (data.title.includes('企业注册') || data.title.includes('注册数量')) {
        valueColumnHeader = '数值(家)';
      } else if (data.title.includes('研发经费') || data.title.includes('经费投入')) {
        valueColumnHeader = '数值(亿元)';
      } else if (data.title.includes('降水量')) {
        valueColumnHeader = '数值(mm)';
      } else if (data.title.includes('气温') || data.title.includes('平均气温')) {
        valueColumnHeader = '数值(℃)';
      } else if (data.title.includes('就业率') || data.title.includes('合格率')) {
        valueColumnHeader = '数值(%)';
      }
    }

    // 构建CSV内容
    let csvContent = '\uFEFF'; // BOM for Excel UTF-8 support
    csvContent += `数据标题,${data.title}\n`;
    csvContent += `数据类别,${data.category}\n`;
    csvContent += `数据来源,${data.source}\n`;
    csvContent += `创建时间,${data.created_at}\n`;
    csvContent += `\n`;

    // 根据数据类型生成不同的表头
    if (isMonthly) {
      csvContent += `记录日期,月份,${valueColumnHeader},备注\n`;
    } else if (isCity) {
      csvContent += `记录日期,城市,${valueColumnHeader},备注\n`;
    } else {
      csvContent += `记录日期,文本值,${valueColumnHeader},备注\n`;
    }

    // 格式化数值的函数
    const formatValue = (value, unit) => {
      if (value === null || value === undefined) return '-';
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return '-';
      
      if (!unit) {
        return numValue.toFixed(2);
      }
      
      // 根据单位类型决定精度
      if (unit === '家' || unit === '件' || unit === '所' || unit === '个' || unit === '人' || unit === '天' || unit === '公里' || unit === '万人次') {
        return parseInt(numValue).toString();
      } else if (unit === '%' || unit === '℃') {
        return numValue.toFixed(1);
      } else if (unit === 'mm') {
        return numValue.toFixed(1);
      } else if (unit === '亿元' || unit === '元') {
        return numValue.toFixed(2);
      } else {
        return numValue.toFixed(2);
      }
    };

    records.forEach(record => {
      let metadata = null;
      try {
        if (record.metadata) {
          metadata = typeof record.metadata === 'string' 
            ? JSON.parse(record.metadata) 
            : record.metadata;
        }
      } catch (e) {
        // 忽略解析错误
      }

      const date = record.record_date || '-';
      const recordUnit = metadata?.unit || unit;
      const formattedValue = formatValue(record.value, recordUnit);
      
      let textColumn = '-';
      let remark = '-';
      
      if (isMonthly) {
        textColumn = metadata?.monthName || record.text_value || '-';
        remark = metadata?.description || `${metadata?.month || ''}月数据`;
      } else if (isCity) {
        textColumn = metadata?.city || record.text_value || '-';
        remark = metadata?.description || `${metadata?.city || ''}数据`;
      } else {
        textColumn = record.text_value || '-';
        remark = metadata?.description || '-';
      }
      
      csvContent += `${date},${textColumn},${formattedValue},${remark}\n`;
    });

    return {
      filename: `${data.title}_${new Date().toISOString().split('T')[0]}.csv`,
      content: csvContent,
      mimeType: 'text/csv;charset=utf-8'
    };
  } catch (error) {
    console.error('导出CSV错误:', error);
    throw error;
  }
};

module.exports = {
  getDataList,
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
  exportDataToCSV
};

