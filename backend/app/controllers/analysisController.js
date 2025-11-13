/**
 * 分析控制器
 */
const analysisService = require('../services/analysisService');

/**
 * 执行决策分析
 * POST /api/analysis/analyze
 */
const analyze = async (req, res) => {
  try {
    const {
      filename,
      indicator,
      question,
      presetType
    } = req.body;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: '数据文件名不能为空'
      });
    }
    
    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: '问题不能为空'
      });
    }
    
    // 处理指标参数：空字符串转换为 null
    const processedIndicator = (indicator && indicator.trim()) ? indicator.trim() : null;
    
    const result = await analysisService.analyze({
      filename,
      indicator: processedIndicator,
      question: question.trim(),
      presetType: presetType || null
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('分析失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '分析失败'
    });
  }
};

module.exports = {
  analyze
};

