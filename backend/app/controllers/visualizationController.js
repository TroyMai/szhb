/**
 * 可视化控制器
 */
const visualizationService = require('../services/visualizationService');
const { authenticate } = require('../middleware/auth');

/**
 * 获取地图可视化数据
 */
const getMapData = async (req, res) => {
  try {
    const { dataTitle } = req.query;
    
    if (!dataTitle) {
      return res.status(400).json({
        success: false,
        message: '数据标题不能为空'
      });
    }
    
    const mapData = await visualizationService.getMapData(dataTitle);
    
    res.json({
      success: true,
      data: mapData
    });
  } catch (error) {
    console.error('获取地图数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取地图数据失败',
      error: error.message
    });
  }
};

module.exports = {
  getMapData
};

