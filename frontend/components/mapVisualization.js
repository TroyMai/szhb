/**
 * 通用地图可视化组件
 * 用于显示基于地理区域的数据可视化（如降水量、气温等）
 */

/**
 * 创建地图可视化卡片HTML
 * @param {Object} options - 配置选项
 * @param {string} options.containerId - 容器ID（必需）
 * @param {string} options.title - 标题（默认：'地图可视化'）
 * @param {string} options.subtitle - 副标题（可选）
 * @param {number} options.height - 地图高度（默认：500）
 * @param {boolean} options.showExport - 是否显示导出按钮（默认：true）
 * @param {boolean} options.showStats - 是否显示统计信息（默认：true）
 * @returns {string} HTML字符串
 */
const createMapCardHTML = (options = {}) => {
    const {
        containerId = 'mapVisualization',
        title = '地图可视化',
        subtitle = '',
        height = 500,
        showExport = true,
        showStats = true
    } = options;

    const exportBtn = showExport ? `
        <button id="${containerId}ExportBtn" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
            导出图片
        </button>
    ` : '';

    const statsInfo = showStats ? `
        <div class="text-sm text-gray-600">
            <span id="${containerId}Stats">加载中...</span>
        </div>
    ` : '';

    return `
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-lg font-semibold text-gray-800">${title}</h3>
                    ${subtitle ? `<p class="text-sm text-gray-500 mt-1">${subtitle}</p>` : ''}
                </div>
                ${exportBtn}
            </div>
            <div id="${containerId}Map" style="height: ${height}px; position: relative;"></div>
            ${showStats ? `
                <div class="mt-4 flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center">
                            <div class="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                            <span class="text-sm text-gray-600">高值区域</span>
                        </div>
                        <div class="flex items-center">
                            <div class="w-4 h-4 bg-green-500 rounded mr-2"></div>
                            <span class="text-sm text-gray-600">中值区域</span>
                        </div>
                        <div class="flex items-center">
                            <div class="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                            <span class="text-sm text-gray-600">低值区域</span>
                        </div>
                    </div>
                    ${statsInfo}
                </div>
            ` : ''}
        </div>
    `;
};

/**
 * 初始化地图可视化
 * @param {Object} options - 配置选项
 * @param {string} options.containerId - 容器ID（用于兼容性，可选）
 * @param {string} options.mapContainerId - 地图容器ID（必需，如果未提供则使用 containerId + 'Map'）
 * @param {string} options.statsContainerId - 统计信息容器ID（可选，如果未提供则使用 containerId + 'Stats'）
 * @param {Array} options.data - 地图数据数组 [{name: '地区名', value: 数值}, ...]（必需）
 * @param {string} options.mapName - 地图名称（默认：'hubei'）
 * @param {string} options.mapGeoJSONUrl - 地图GeoJSON URL（可选，默认使用阿里云CDN）
 * @param {string} options.unit - 数据单位（默认：''）
 * @returns {Promise<Object>} 返回地图实例和工具函数
 */
const initMapVisualization = async (options = {}) => {
    const {
        containerId = 'mapVisualization',
        mapContainerId = null,
        statsContainerId = null,
        data = [],
        mapName = 'hubei',
        mapGeoJSONUrl = 'https://geo.datav.aliyun.com/areas_v3/bound/420000_full.json',
        unit = ''
    } = options;

    if (!data || data.length === 0) {
        throw new Error('地图数据不能为空');
    }

    // 确定地图容器ID
    const actualMapContainerId = mapContainerId || `${containerId}Map`;
    const mapContainer = document.getElementById(actualMapContainerId);
    if (!mapContainer) {
        throw new Error(`地图容器不存在: ${actualMapContainerId}`);
    }

    // 创建ECharts实例
    const mapChart = echarts.init(mapContainer);

    // 加载地图GeoJSON
    await loadMapGeoJSON(mapName, mapGeoJSONUrl);

    // 渲染地图（改为异步）
    await renderMap(mapChart, data, mapName, unit);

    // 更新统计信息
    const actualStatsContainerId = statsContainerId || `${containerId}Stats`;
    updateStats(actualStatsContainerId, data, unit);

    // 响应式调整
    const resizeHandler = () => {
        if (mapChart) {
            mapChart.resize();
        }
    };
    window.addEventListener('resize', resizeHandler);

    return {
        chart: mapChart,
        updateData: (newData) => {
            renderMap(mapChart, newData, mapName, unit);
            updateStats(actualStatsContainerId, newData, unit);
        },
        resize: () => {
            mapChart.resize();
        },
        destroy: () => {
            window.removeEventListener('resize', resizeHandler);
            mapChart.dispose();
        }
    };
};

/**
 * 加载地图GeoJSON数据
 */
const loadMapGeoJSON = async (mapName, mapGeoJSONUrl) => {
    let geoJSON = null;
    
    try {
        // 尝试从CDN加载
        const response = await fetch(mapGeoJSONUrl);
        if (response.ok) {
            geoJSON = await response.json();
            echarts.registerMap(mapName, geoJSON);
            return;
        }
    } catch (error) {
        console.warn('从CDN加载地图失败，尝试本地文件:', error);
    }

    // 尝试本地文件
    try {
        const localUrl = '../public/data/hubei-map.json';
        const response = await fetch(localUrl);
        if (response.ok) {
            geoJSON = await response.json();
            echarts.registerMap(mapName, geoJSON);
            return;
        }
    } catch (error) {
        console.warn('本地文件加载失败:', error);
    }

    // 如果都失败，抛出错误
    throw new Error('无法加载地图GeoJSON数据，请检查网络连接或本地文件');
};

/**
 * 渲染地图
 */
const renderMap = async (chart, data, mapName, unit) => {
    if (!chart || !data || data.length === 0) return;

    // 获取已注册的地图，分析城市名称格式
    let mapCityNameKey = 'name';
    let mapCityNames = [];
    let nameMapping = {}; // 数据名称 -> 地图名称的映射
    
    try {
        const registeredMap = echarts.getMap(mapName);
        if (registeredMap && registeredMap.features) {
            // 提取地图中的所有城市名称（优先使用adname，因为阿里云CDN使用此字段）
            registeredMap.features.forEach(f => {
                const props = f.properties || {};
                // 优先使用 adname（阿里云CDN使用此字段存储完整城市名称）
                const mapName = props.adname || props.ADNAME || props.name || props.NAME || '';
                if (mapName) {
                    mapCityNames.push(mapName);
                    // 确定使用的属性名（只设置一次）
                    if (!mapCityNameKey) {
                        if (props.adname) mapCityNameKey = 'adname';
                        else if (props.name) mapCityNameKey = 'name';
                        else if (props.NAME) mapCityNameKey = 'NAME';
                    }
                }
            });
            
            // 创建智能名称映射
            data.forEach(item => {
                const dataName = item.name || item.originalName || '';
                const originalName = item.originalName || item.name || '';
                
                // 尝试多种匹配方式
                let matchedMapName = null;
                
                // 1. 精确匹配
                if (mapCityNames.includes(dataName)) {
                    matchedMapName = dataName;
                }
                // 2. 尝试使用originalName（如果有"市"后缀）
                else if (originalName && mapCityNames.includes(originalName)) {
                    matchedMapName = originalName;
                }
                // 3. 尝试添加"市"后缀
                else if (!dataName.endsWith('市') && !dataName.endsWith('林区') && !dataName.endsWith('自治州')) {
                    const withCity = dataName + '市';
                    if (mapCityNames.includes(withCity)) {
                        matchedMapName = withCity;
                    }
                }
                // 4. 尝试移除"市"后缀
                else if (dataName.endsWith('市')) {
                    const withoutCity = dataName.slice(0, -1);
                    if (mapCityNames.includes(withoutCity)) {
                        matchedMapName = withoutCity;
                    }
                }
                // 5. 模糊匹配（包含关系）
                else {
                    const fuzzyMatch = mapCityNames.find(mapName => {
                        return mapName.includes(dataName) || dataName.includes(mapName) ||
                               mapName.replace('市', '') === dataName ||
                               dataName.replace('市', '') === mapName;
                    });
                    if (fuzzyMatch) {
                        matchedMapName = fuzzyMatch;
                    }
                }
                
                if (matchedMapName) {
                    nameMapping[dataName] = matchedMapName;
                    if (originalName && originalName !== dataName) {
                        nameMapping[originalName] = matchedMapName;
                    }
                } else {
                    nameMapping[dataName] = dataName;
                }
            });
        }
    } catch (error) {
        console.warn('[地图组件] 分析地图名称时出错:', error);
    }

    // 计算数值范围
    const values = data.map(item => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                if (params.data) {
                    const displayName = params.data.originalName || params.name;
                    const valueText = unit ? `${params.data.value.toFixed(1)}${unit}` : params.data.value.toFixed(1);
                    const count = params.data.count || 1;
                    
                    // 只有多条记录时才显示最高/最低值
                    const showStats = count > 1 && params.data.max !== undefined && params.data.min !== undefined;
                    
                    return `
                        <div style="padding: 8px;">
                            <div style="font-weight: bold; margin-bottom: 4px;">${displayName}</div>
                            <div>${unit ? '降水量' : '数值'}: <span style="color: #4F46E5; font-weight: bold;">${valueText}</span></div>
                            ${showStats ? `
                                <div style="margin-top: 4px; font-size: 12px; color: #666;">
                                    ${params.data.max !== params.data.value ? `<div>最高: ${params.data.max.toFixed(1)}${unit || ''}</div>` : ''}
                                    ${params.data.min !== params.data.value ? `<div>最低: ${params.data.min.toFixed(1)}${unit || ''}</div>` : ''}
                                    ${count > 1 ? `<div style="margin-top: 2px; color: #999;">(${count}条记录)</div>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }
                return params.name;
            }
        },
        visualMap: {
            min: minValue,
            max: maxValue,
            left: 'left',
            top: 'bottom',
            text: ['高', '低'],
            calculable: true,
            inRange: {
                color: ['#FFD700', '#32CD32', '#1E90FF'] // 黄色 -> 绿色 -> 蓝色
            },
            textStyle: {
                color: '#333'
            }
        },
        series: [
            {
                name: '数据',
                type: 'map',
                map: mapName,
                roam: false, // 禁用拖拽和缩放
                zoom: 1, // 固定缩放级别
                center: [112.5, 31.0], // 湖北省中心
                label: {
                    show: true,
                    fontSize: 11,
                    color: '#333',
                    fontWeight: 'normal'
                },
                itemStyle: {
                    borderColor: '#fff',
                    borderWidth: 1
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 13,
                        fontWeight: 'bold',
                        color: '#000'
                    },
                    itemStyle: {
                        areaColor: null, // 使用原色变亮效果，更协调
                        borderColor: '#eee',
                        borderWidth: 2
                    }
                },
                data: data.map(item => {
                    const dataName = item.name || item.originalName || '未知';
                    const originalName = item.originalName || item.name || '';
                    
                    // 使用智能映射
                    let matchedName = nameMapping[dataName];
                    
                    // 如果直接匹配失败，尝试使用originalName匹配
                    if (!matchedName && originalName && nameMapping[originalName]) {
                        matchedName = nameMapping[originalName];
                    }
                    
                    // 如果还是找不到，尝试反向查找（通过值匹配）
                    if (!matchedName) {
                        // 尝试所有可能的匹配方式
                        for (const [dataKey, mapKey] of Object.entries(nameMapping)) {
                            if (dataKey === dataName || dataKey === originalName) {
                                matchedName = mapKey;
                                break;
                            }
                        }
                    }
                    
                    // 如果仍然找不到，使用原始名称（让ECharts尝试匹配）
                    if (!matchedName) {
                        matchedName = dataName;
                    }
                    
                    return {
                        name: matchedName,
                        value: item.value || 0,
                        max: item.max,
                        min: item.min,
                        count: item.count || 1,
                        originalName: item.originalName || item.name
                    };
                })
            }
        ]
    };
    
    chart.setOption(option);
};

/**
 * 更新统计信息
 * @param {string} statsContainerId - 统计信息容器ID（完整的元素ID）
 * @param {Array} data - 数据数组
 * @param {string} unit - 单位
 */
const updateStats = (statsContainerId, data, unit) => {
    const statsEl = document.getElementById(statsContainerId);
    if (!statsEl || !data || data.length === 0) return;

    const total = data.length;
    const avg = data.reduce((sum, item) => sum + item.value, 0) / total;
    const max = Math.max(...data.map(item => item.value));
    const min = Math.min(...data.map(item => item.value));

    const unitText = unit || '';
    statsEl.textContent = 
        `共 ${total} 个地区 | 平均: ${avg.toFixed(1)}${unitText} | 最高: ${max.toFixed(1)}${unitText} | 最低: ${min.toFixed(1)}${unitText}`;
};

/**
 * 导出地图图片
 */
const exportMapImage = (chart, containerId, onExport) => {
    if (!chart) {
        console.error('地图未初始化');
        return;
    }

    try {
        const url = chart.getDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#fff'
        });

        const link = document.createElement('a');
        link.download = `${containerId}_map.png`;
        link.href = url;
        link.click();

        if (onExport) {
            onExport(url);
        }
    } catch (error) {
        console.error('导出图片失败:', error);
    }
};

export default {
    createMapCardHTML,
    initMapVisualization
};

