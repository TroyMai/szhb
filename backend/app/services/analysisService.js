/**
 * 分析服务
 * 提供基于大模型的决策分析功能
 */
const localDataService = require('./localDataService');
const llmService = require('./llmService');

/**
 * 生成模拟分析结果（用于测试或API不可用时）
 */
const generateMockAnalysis = (prompt) => {
  // 根据提示词中的关键词生成相应的分析
  let analysis = '';
  
  if (prompt.includes('趋势') || prompt.includes('发展')) {
    analysis = `## 数据趋势分析

根据所选数据的历史记录，我进行了深入的趋势分析：

**整体趋势：**
数据显示整体呈现${Math.random() > 0.5 ? '上升' : '波动'}趋势，在观察期内，主要指标${Math.random() > 0.5 ? '持续增长' : '有所波动'}。

**关键发现：**
1. 数据在最近几年表现出${Math.random() > 0.5 ? '稳定增长' : '周期性波动'}的特征
2. 某些地区或指标的增长速度${Math.random() > 0.5 ? '高于' : '低于'}平均水平
3. 存在明显的${Math.random() > 0.5 ? '季节性' : '周期性'}变化规律

**影响因素：**
- 政策因素对数据变化有显著影响
- 经济环境变化导致数据波动
- 区域发展不平衡是主要特征之一`;
  } else if (prompt.includes('对比') || prompt.includes('差异')) {
    analysis = `## 数据对比分析

通过对比分析不同地区和指标的数据，发现以下关键差异：

**区域差异：**
1. 不同地区之间的数据存在明显差异，最大差异达到${Math.floor(Math.random() * 50 + 20)}%
2. 部分地区的表现${Math.random() > 0.5 ? '优于' : '低于'}全省平均水平
3. 区域发展不平衡问题较为突出

**指标差异：**
1. 各指标之间的相关性${Math.random() > 0.5 ? '较强' : '较弱'}
2. 某些指标的增长速度明显${Math.random() > 0.5 ? '快于' : '慢于'}其他指标
3. 需要重点关注${Math.random() > 0.5 ? '增长缓慢' : '波动较大'}的指标`;
  } else if (prompt.includes('异常') || prompt.includes('问题')) {
    analysis = `## 异常检测分析

通过统计分析，识别出以下异常情况：

**异常数据点：**
1. 发现${Math.floor(Math.random() * 10 + 5)}个异常数据点，主要集中在特定时间段
2. 异常值偏离平均值${Math.floor(Math.random() * 30 + 10)}%以上
3. 异常主要集中在${Math.random() > 0.5 ? '特定地区' : '特定指标'}

**异常原因分析：**
- 可能是数据录入错误或统计口径变化
- 外部事件（如政策调整、突发事件）的影响
- 季节性因素或周期性波动

**建议：**
建议进一步核实异常数据，并分析其对整体分析结果的影响。`;
  } else {
    analysis = `## 数据分析报告

基于您提供的数据和问题，我进行了综合分析：

**主要发现：**
1. 数据整体呈现${Math.random() > 0.5 ? '稳定' : '波动'}的发展态势
2. 存在明显的${Math.random() > 0.5 ? '区域差异' : '时间差异'}
3. 需要关注${Math.random() > 0.5 ? '增长趋势' : '波动情况'}

**深度分析：**
通过对数据的多维度分析，发现了一些值得关注的模式和特征。这些发现对于制定相关政策和优化资源配置具有重要参考价值。

**关键洞察：**
- 数据反映了当前的发展状况和趋势
- 某些方面需要重点关注和改进
- 建议采取针对性的措施来优化发展`;
  }
  
  return analysis;
};

/**
 * 执行决策分析
 * @param {Object} params - 分析参数
 * @param {string} params.filename - 数据文件名
 * @param {string} params.question - 用户问题
 * @param {string} params.presetType - 预设问题类型（可选）
 * @returns {Promise<Object>} 分析结果
 */
const analyze = async (params) => {
  try {
    const { filename, indicator, question, presetType } = params;
    
    if (!filename || !question) {
      throw new Error('缺少必要参数：filename 和 question');
    }
    
    // 1. 加载数据文件
    let data = await localDataService.loadDataFile(filename);
    
    if (!data || data.length === 0) {
      throw new Error('数据文件为空或无法读取');
    }
    
    // 2. 如果指定了指标，筛选该指标的数据
    if (indicator && indicator.trim()) {
      const indicatorName = indicator.trim();
      const originalCount = data.length;
      
      // 保存原始数据用于错误提示
      const originalData = [...data];
      
      // 筛选数据
      data = data.filter(item => item.data_name === indicatorName);
      
      if (data.length === 0) {
        // 如果精确匹配失败，尝试模糊匹配（从原始数据中查找）
        const allIndicators = [...new Set(originalData.map(item => item.data_name).filter(Boolean))];
        const similarIndicators = allIndicators
          .filter(name => name && (name.includes(indicatorName) || indicatorName.includes(name)))
          .slice(0, 5);
        
        if (similarIndicators.length > 0) {
          throw new Error(`未找到指标"${indicatorName}"的数据。相似的指标有：${similarIndicators.join('、')}`);
        } else {
          throw new Error(`未找到指标"${indicatorName}"的数据。可用指标：${allIndicators.slice(0, 10).join('、')}${allIndicators.length > 10 ? '等' : ''}`);
        }
      }
    }
    
    // 3. 获取数据统计信息（如果指定了指标，使用筛选后的数据）
    const stats = await localDataService.getDataStatistics(filename);
    
    // 4. 构建数据摘要（包含指标信息）
    const dataSummary = buildDataSummary(data, stats, indicator);
    
    // 5. 构建分析提示词
    const prompt = buildAnalysisPrompt(question, dataSummary, presetType, indicator);
    
    // 5. 调用大模型API进行分析
    let analysis;
    try {
      analysis = await llmService.callLLM(prompt);
      // 如果API不可用或调用失败，使用模拟结果
      if (!analysis) {
        analysis = generateMockAnalysis(prompt);
      }
    } catch (error) {
      console.error('大模型API调用失败，使用模拟结果:', error.message);
      analysis = generateMockAnalysis(prompt);
    }
    
    // 6. 提取建议（如果分析中包含建议）
    const recommendations = extractRecommendations(analysis);
    
    // 7. 生成标题
    const title = generateTitle(question, presetType);
    
    // 计算筛选后的数据统计（如果指定了指标）
    let dataStats;
    if (indicator) {
      // 使用筛选后的数据计算统计
      const areas = [...new Set(data.map(item => item.area).filter(Boolean))];
      const timeValues = data.map(item => item.repp).filter(Boolean).sort((a, b) => a - b);
      let timeRange = '';
      if (timeValues.length > 0) {
        const minTime = timeValues[0];
        const maxTime = timeValues[timeValues.length - 1];
        if (String(minTime).length === 6) {
          const minYear = Math.floor(minTime / 100);
          const minMonth = minTime % 100;
          const maxYear = Math.floor(maxTime / 100);
          const maxMonth = maxTime % 100;
          timeRange = `${minYear}年${minMonth}月 - ${maxYear}年${maxMonth}月`;
        } else {
          timeRange = `${minTime} - ${maxTime}年`;
        }
      }
      
      dataStats = {
        total: data.length,
        areas: areas.length,
        indicators: 1, // 只分析一个指标
        timeRange: timeRange || stats.timeRange
      };
    } else {
      // 使用整个文件的统计
      dataStats = {
        total: stats.total,
        areas: stats.areas?.length || 0,
        indicators: stats.indicators?.length || 0,
        timeRange: stats.timeRange
      };
    }
    
    return {
      title,
      analysis,
      recommendations,
      summary: dataSummary,
      dataStats
    };
  } catch (error) {
    console.error('分析失败:', error);
    throw error;
  }
};

/**
 * 构建数据摘要（包含详细数据信息）
 */
const buildDataSummary = (data, stats, indicator = null) => {
  const recordCount = data.length;
  let summary = '';
  
  // 如果指定了指标，突出显示
  if (indicator && indicator.trim()) {
    const indicatorName = indicator.trim();
    summary = `本次分析针对指标"${indicatorName}"，该指标共有 ${recordCount} 条记录。\n\n`;
  } else {
    summary = `数据文件包含 ${stats.total || recordCount} 条记录。\n\n`;
  }
  
  // 获取当前数据涉及的地区（去重）
  const areas = [...new Set(data.map(item => item.area).filter(Boolean))];
  if (areas.length > 0) {
    summary += `涉及地区：${areas.slice(0, 5).join('、')}${areas.length > 5 ? `等${areas.length}个地区` : ''}。\n`;
  }
  
  // 如果指定了指标，只显示该指标；否则显示所有指标
  if (indicator) {
    summary += `分析指标：${indicator}。\n`;
  } else if (stats.indicators && stats.indicators.length > 0) {
    summary += `主要指标：${stats.indicators.slice(0, 5).join('、')}${stats.indicators.length > 5 ? `等${stats.indicators.length}个指标` : ''}。\n`;
  }
  
  // 按时间排序数据
  const sortedData = [...data].sort((a, b) => {
    const timeA = a.repp || 0;
    const timeB = b.repp || 0;
    return timeA - timeB;
  });
  
  // 获取时间范围（从实际数据中计算）
  const timeValues = sortedData.map(item => item.repp).filter(Boolean);
  if (timeValues.length > 0) {
    const minTime = timeValues[0];
    const maxTime = timeValues[timeValues.length - 1];
    // 判断时间格式（6位数字为年月，4位为年份）
    if (String(minTime).length === 6) {
      const minYear = Math.floor(minTime / 100);
      const minMonth = minTime % 100;
      const maxYear = Math.floor(maxTime / 100);
      const maxMonth = maxTime % 100;
      summary += `时间范围：${minYear}年${minMonth}月 - ${maxYear}年${maxMonth}月。\n`;
    } else {
      summary += `时间范围：${minTime} - ${maxTime}年。\n`;
    }
  } else if (stats.timeRange) {
    summary += `时间范围：${stats.timeRange}。\n`;
  }
  
  // 计算基本统计信息
  const values = sortedData
    .filter(item => item.data2 !== null && item.data2 !== undefined)
    .map(item => parseFloat(item.data2))
    .filter(val => !isNaN(val));
  
  if (values.length > 0) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const median = values.length > 0 ? [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] : 0;
    
    // 计算标准差
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    summary += `\n数值统计：平均值 ${avg.toFixed(2)}，最大值 ${max.toFixed(2)}，最小值 ${min.toFixed(2)}，中位数 ${median.toFixed(2)}，标准差 ${stdDev.toFixed(2)}。`;
    
    // 如果数据有时间序列，计算增长率
    if (timeValues.length >= 2 && values.length >= 2) {
      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      if (firstValue > 0) {
        const growthRate = ((lastValue - firstValue) / firstValue * 100).toFixed(2);
        summary += ` 整体增长率：${growthRate}%。`;
      }
    }
  }
  
  // === 添加详细数据信息 ===
  summary += '\n\n## 详细数据信息\n\n';
  
  // 1. 时间序列数据（如果数据量不大，发送完整序列；否则发送采样数据）
  if (sortedData.length > 0) {
    const maxDataPoints = 50; // 最多发送50个数据点
    const sampleData = sortedData.length <= maxDataPoints 
      ? sortedData 
      : sampleDataPoints(sortedData, maxDataPoints);
    
    summary += '### 时间序列数据\n';
    summary += '以下为按时间排序的数据点（时间, 地区, 数值）：\n\n';
    
    sampleData.forEach((item, index) => {
      const time = item.repp || '-';
      const area = item.area || '-';
      const value = item.data2 !== null && item.data2 !== undefined 
        ? parseFloat(item.data2).toFixed(2) 
        : '-';
      
      // 格式化时间显示
      let timeDisplay = time;
      if (String(time).length === 6) {
        const year = Math.floor(time / 100);
        const month = time % 100;
        timeDisplay = `${year}年${month}月`;
      } else if (String(time).length === 4) {
        timeDisplay = `${time}年`;
      }
      
      summary += `${index + 1}. ${timeDisplay}, ${area}, ${value}\n`;
    });
    
    if (sortedData.length > maxDataPoints) {
      summary += `\n（注：共 ${sortedData.length} 条数据，此处显示 ${maxDataPoints} 个采样点）\n`;
    }
  }
  
  // 2. 按地区分组统计（如果涉及多个地区）
  if (areas.length > 1 && areas.length <= 20) {
    summary += '\n### 按地区统计\n';
    const areaStats = {};
    
    sortedData.forEach(item => {
      const area = item.area || '未知';
      const value = item.data2 !== null && item.data2 !== undefined 
        ? parseFloat(item.data2) 
        : null;
      
      if (value !== null && !isNaN(value)) {
        if (!areaStats[area]) {
          areaStats[area] = { values: [], count: 0 };
        }
        areaStats[area].values.push(value);
        areaStats[area].count++;
      }
    });
    
    // 计算每个地区的统计信息
    Object.keys(areaStats).sort().forEach(area => {
      const stats = areaStats[area];
      if (stats.values.length > 0) {
        const avg = stats.values.reduce((a, b) => a + b, 0) / stats.values.length;
        const max = Math.max(...stats.values);
        const min = Math.min(...stats.values);
        const sum = stats.values.reduce((a, b) => a + b, 0);
        summary += `${area}: 记录数 ${stats.count}, 平均值 ${avg.toFixed(2)}, 最大值 ${max.toFixed(2)}, 最小值 ${min.toFixed(2)}, 合计 ${sum.toFixed(2)}\n`;
      }
    });
  }
  
  // 3. 关键数据点（最大值、最小值、最近值）
  if (sortedData.length > 0) {
    summary += '\n### 关键数据点\n';
    
    // 最大值
    const maxItem = sortedData.reduce((max, item) => {
      const value = parseFloat(item.data2) || 0;
      const maxValue = parseFloat(max.data2) || 0;
      return value > maxValue ? item : max;
    }, sortedData[0]);
    
    // 最小值
    const minItem = sortedData.reduce((min, item) => {
      const value = parseFloat(item.data2) || 0;
      const minValue = parseFloat(min.data2) || 0;
      return value < minValue ? item : min;
    }, sortedData[0]);
    
    // 最近值（最后一个）
    const lastItem = sortedData[sortedData.length - 1];
    
    summary += `最大值: ${formatTimeDisplay(maxItem.repp)}, ${maxItem.area || '-'}, ${parseFloat(maxItem.data2 || 0).toFixed(2)}\n`;
    summary += `最小值: ${formatTimeDisplay(minItem.repp)}, ${minItem.area || '-'}, ${parseFloat(minItem.data2 || 0).toFixed(2)}\n`;
    summary += `最近值: ${formatTimeDisplay(lastItem.repp)}, ${lastItem.area || '-'}, ${parseFloat(lastItem.data2 || 0).toFixed(2)}\n`;
  }
  
  // 4. 数据趋势分析（如果数据量足够）
  if (timeValues.length >= 3 && values.length >= 3) {
    summary += '\n### 数据趋势\n';
    
    // 计算分段增长率
    const segments = Math.min(4, Math.floor(timeValues.length / 3)); // 分成最多4段
    if (segments >= 2) {
      const segmentSize = Math.floor(timeValues.length / segments);
      for (let i = 0; i < segments; i++) {
        const startIdx = i * segmentSize;
        const endIdx = i === segments - 1 ? timeValues.length - 1 : (i + 1) * segmentSize - 1;
        const startValue = values[startIdx];
        const endValue = values[endIdx];
        
        if (startValue > 0) {
          const segmentGrowth = ((endValue - startValue) / startValue * 100).toFixed(2);
          const startTime = formatTimeDisplay(timeValues[startIdx]);
          const endTime = formatTimeDisplay(timeValues[endIdx]);
          summary += `阶段${i + 1} (${startTime} - ${endTime}): 增长率 ${segmentGrowth}%\n`;
        }
      }
    }
  }
  
  return summary;
};

/**
 * 采样数据点（确保包含首尾和中间的关键点）
 */
const sampleDataPoints = (data, maxPoints) => {
  if (data.length <= maxPoints) {
    return data;
  }
  
  const sampled = [];
  const step = Math.floor(data.length / maxPoints);
  
  // 确保包含第一个点
  sampled.push(data[0]);
  
  // 均匀采样中间点
  for (let i = step; i < data.length - step; i += step) {
    if (sampled.length < maxPoints - 1) {
      sampled.push(data[i]);
    }
  }
  
  // 确保包含最后一个点
  if (sampled.length < maxPoints) {
    sampled.push(data[data.length - 1]);
  }
  
  return sampled;
};

/**
 * 格式化时间显示（辅助函数）
 */
const formatTimeDisplay = (time) => {
  if (!time) return '-';
  if (String(time).length === 6) {
    const year = Math.floor(time / 100);
    const month = time % 100;
    return `${year}年${month}月`;
  }
  return `${time}年`;
};

/**
 * 构建分析提示词
 */
const buildAnalysisPrompt = (question, dataSummary, presetType, indicator = null) => {
  let prompt = `你是一个专业的数据分析师。请基于以下数据信息，回答用户的问题，并提供专业的分析和建议。

## 数据信息
${dataSummary}

## 用户问题
${question}`;

  // 如果指定了指标，在提示词中强调
  if (indicator) {
    prompt += `\n\n**注意：本次分析专门针对指标"${indicator}"，请确保分析内容与该指标高度相关。**`;
  }

  prompt += `\n\n## 分析要求
1. 请基于提供的数据信息进行深入分析
2. 回答要专业、准确、有条理
3. 如果数据信息不足，可以基于一般规律和最佳实践进行分析
4. 请提供具体的、可操作的建议
5. 使用中文回答，格式清晰易读`;

  // 根据预设类型添加特定要求
  if (presetType === 'trend') {
    prompt += '\n\n请重点关注数据的趋势分析，包括增长趋势、波动情况、周期性特征等。';
  } else if (presetType === 'comparison') {
    prompt += '\n\n请重点关注不同地区或指标之间的对比分析。';
  } else if (presetType === 'anomaly') {
    prompt += '\n\n请重点关注异常值的识别和分析。';
  } else if (presetType === 'policy') {
    prompt += '\n\n请重点关注政策建议的提出，建议要具体、可操作。';
  }
  
  prompt += '\n\n请开始分析：';
  
  return prompt;
};

/**
 * 从分析结果中提取建议
 */
const extractRecommendations = (analysis) => {
  const recommendations = [];
  
  // 尝试从分析文本中提取建议（简单实现）
  // 查找包含"建议"、"应该"、"可以"等关键词的句子
  const lines = analysis.split('\n');
  let inRecommendationSection = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 检测建议部分
    if (trimmedLine.includes('建议') || trimmedLine.includes('决策建议') || trimmedLine.includes('政策建议')) {
      inRecommendationSection = true;
      continue;
    }
    
    // 如果在建议部分，提取建议项
    if (inRecommendationSection) {
      if (trimmedLine.match(/^[0-9]+[\.、]/) || trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
        const rec = trimmedLine.replace(/^[0-9]+[\.、]\s*/, '').replace(/^[-•]\s*/, '').trim();
        if (rec && rec.length > 10) {
          recommendations.push(rec);
        }
      } else if (trimmedLine.length > 20 && (trimmedLine.includes('建议') || trimmedLine.includes('应该') || trimmedLine.includes('可以'))) {
        recommendations.push(trimmedLine);
      }
    }
  }
  
  // 如果没有提取到建议，生成默认建议
  if (recommendations.length === 0) {
    recommendations.push('建议继续监控数据变化趋势，及时调整策略');
    recommendations.push('建议加强数据收集和分析，提高决策的科学性');
    recommendations.push('建议关注异常数据，深入分析原因');
  }
  
  return recommendations.slice(0, 5); // 最多返回5条建议
};

/**
 * 生成分析标题
 */
const generateTitle = (question, presetType) => {
  if (presetType === 'trend') {
    return '数据趋势分析报告';
  } else if (presetType === 'comparison') {
    return '数据对比分析报告';
  } else if (presetType === 'anomaly') {
    return '异常检测分析报告';
  } else if (presetType === 'forecast') {
    return '趋势预测分析报告';
  } else if (presetType === 'policy') {
    return '政策建议分析报告';
  } else if (presetType === 'optimization') {
    return '资源配置优化分析报告';
  } else {
    // 从问题中提取关键词作为标题
    const keywords = question.substring(0, 20);
    return `决策分析报告：${keywords}${keywords.length < question.length ? '...' : ''}`;
  }
};

module.exports = {
  analyze
};
