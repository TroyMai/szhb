/**
 * 可视化服务
 */
const { query } = require('../../config/database');

/**
 * 获取地图可视化数据
 * @param {string} dataTitle - 数据标题（如"2024年年降水量统计"）
 * @returns {Promise<Array>} 地图数据数组 [{name: '城市名', value: 数值}, ...]
 */
const getMapData = async (dataTitle) => {
  try {
    // 1. 根据标题查找数据ID
    let dataSql = `SELECT id, status FROM data WHERE title = ? LIMIT 1`;
    let dataResult = await query(dataSql, [dataTitle]);
    
    if (!dataResult || dataResult.length === 0) {
      throw new Error(`未找到数据: ${dataTitle}。请先运行数据导入脚本。`);
    }
    
    const dataId = dataResult[0].id;
    
    // 2. 获取该数据的所有记录，按城市分组统计，同时获取单位信息
    const recordsSql = `
      SELECT 
        JSON_EXTRACT(metadata, "$.city") as city,
        JSON_EXTRACT(metadata, "$.region") as region,
        JSON_EXTRACT(metadata, "$.unit") as unit,
        AVG(value) as avg_value,
        MAX(value) as max_value,
        MIN(value) as min_value,
        COUNT(*) as count
      FROM data_records
      WHERE data_id = ?
        AND JSON_EXTRACT(metadata, "$.city") IS NOT NULL
      GROUP BY city, region, unit
      ORDER BY avg_value DESC
    `;
    
    const records = await query(recordsSql, [dataId]);
    
    if (records.length === 0) {
      throw new Error(`数据ID ${dataId} 没有记录数据。请先运行数据导入脚本插入降水量数据。`);
    }
    
    // 3. 处理数据，转换为地图需要的格式
    let dataUnit = ''; // 存储单位（从第一条记录获取）
    const mapData = records.map((record, index) => {
      // 处理城市名称，确保格式正确
      let cityName = record.city;
      if (typeof cityName === 'string' && cityName.startsWith('"') && cityName.endsWith('"')) {
        cityName = cityName.slice(1, -1);
      }
      
      // 处理单位
      let unit = record.unit;
      if (typeof unit === 'string' && unit.startsWith('"') && unit.endsWith('"')) {
        unit = unit.slice(1, -1);
      }
      if (index === 0 && unit) {
        dataUnit = unit; // 保存第一条记录的单位
      }
      
      // 数据库存储的是完整名称，地图GeoJSON也使用完整名称，直接使用
      let mapName = cityName;
      
      return {
        name: mapName || cityName || record.region || '未知', // 使用完整名称匹配地图
        value: parseFloat(record.avg_value) || 0,
        max: parseFloat(record.max_value) || 0,
        min: parseFloat(record.min_value) || 0,
        count: parseInt(record.count) || 0,
        originalName: cityName, // 保留原始名称用于显示
        unit: unit || '' // 添加单位字段
      };
    });
    
    // 为所有数据项添加单位（如果第一条有单位）
    if (dataUnit) {
      mapData.forEach(item => {
        if (!item.unit) {
          item.unit = dataUnit;
        }
      });
    }
    
    return mapData;
  } catch (error) {
    console.error('[可视化服务] 获取地图数据失败:', error);
    throw error;
  }
};

module.exports = {
  getMapData
};

