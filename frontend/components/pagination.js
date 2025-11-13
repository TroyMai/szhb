/**
 * 分页组件
 * 提供统一的分页UI和功能
 */

/**
 * 创建分页HTML结构
 * @param {string} containerId - 容器ID
 * @param {boolean} showPageSize - 是否显示每页数量选择器（默认：true）
 * @returns {string} HTML字符串
 */
const createPaginationHTML = (containerId = 'pagination', showPageSize = true) => {
    const pageSizeSelect = showPageSize ? `
        <select id="${containerId}PageSize" class="px-3 py-1 border border-gray-300 rounded text-sm">
            <option value="20">每页20条</option>
            <option value="50">每页50条</option>
            <option value="100">每页100条</option>
        </select>
    ` : '';
    
    return `
        <div id="${containerId}" class="mt-6 flex items-center justify-between hidden">
            <div class="flex items-center space-x-4">
                <div class="text-sm text-gray-700">
                    显示第 <span id="${containerId}PageStart" class="font-medium">1</span> 到 <span id="${containerId}PageEnd" class="font-medium">20</span> 条，共 <span id="${containerId}Total" class="font-medium">0</span> 条
                </div>
                ${pageSizeSelect}
            </div>
            <div class="flex space-x-2" id="${containerId}Btns"></div>
        </div>
    `;
};

/**
 * 渲染分页
 * @param {Object} options - 配置选项
 * @param {number} options.page - 当前页码
 * @param {number} options.totalPages - 总页数
 * @param {number} options.total - 总数据量
 * @param {number} options.pageSize - 每页数量
 * @param {string} options.containerId - 容器ID（默认：'pagination'）
 * @param {Function} options.onPageChange - 页码变化回调函数 (page) => void
 * @param {Function} options.onPageSizeChange - 每页数量变化回调函数 (pageSize) => void
 * @param {number} options.maxButtons - 最多显示的页码按钮数（默认：5）
 * @param {boolean} options.showPageSize - 是否显示每页数量选择器（默认：true）
 */
const renderPagination = (options) => {
    const {
        page = 1,
        totalPages = 1,
        total = 0,
        pageSize = 20,
        containerId = 'pagination',
        onPageChange = null,
        onPageSizeChange = null,
        maxButtons = 5,
        showPageSize = true
    } = options;

    // 查找分页容器
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`分页容器不存在: ${containerId}`);
        return;
    }
    
    // 如果容器内已经有分页div（通过createPaginationHTML创建的），使用它
    // 否则使用容器本身
    let paginationDiv = container.querySelector(`#${containerId}`);
    if (!paginationDiv) {
        // 如果容器内没有分页div，说明容器本身就是分页div
        paginationDiv = container;
    }

    // 如果总数为0，隐藏分页组件
    if (total === 0) {
        paginationDiv.classList.add('hidden');
        return;
    }
    
    // 即使只有一页，也显示总数信息（但不显示分页按钮）
    paginationDiv.classList.remove('hidden');
    
    // 更新每页数量选择器（需要在所有情况下都更新）
    const pageSizeSelect = document.getElementById(`${containerId}PageSize`);
    if (pageSizeSelect && showPageSize) {
        pageSizeSelect.value = pageSize;
        // 绑定每页数量变化事件
        pageSizeSelect.onchange = (e) => {
            const newPageSize = parseInt(e.target.value);
            if (onPageSizeChange) {
                onPageSizeChange(newPageSize);
            }
        };
    }

    // 如果只有一页，只显示总数信息，不显示分页按钮
    if (totalPages <= 1) {
        const paginationBtns = document.getElementById(`${containerId}Btns`);
        if (paginationBtns) {
            paginationBtns.innerHTML = '';
        }
        // 仍然更新总数信息
        const pageStart = document.getElementById(`${containerId}PageStart`);
        const pageEnd = document.getElementById(`${containerId}PageEnd`);
        const totalEl = document.getElementById(`${containerId}Total`);
        if (pageStart) pageStart.textContent = 1;
        if (pageEnd) pageEnd.textContent = total;
        if (totalEl) totalEl.textContent = total;
        return;
    }

    // 更新左侧信息
    const pageStart = document.getElementById(`${containerId}PageStart`);
    const pageEnd = document.getElementById(`${containerId}PageEnd`);
    const totalEl = document.getElementById(`${containerId}Total`);

    if (pageStart) pageStart.textContent = (page - 1) * pageSize + 1;
    if (pageEnd) pageEnd.textContent = Math.min(page * pageSize, total);
    if (totalEl) totalEl.textContent = total;

    // 生成分页按钮
    const paginationBtns = document.getElementById(`${containerId}Btns`);
    if (!paginationBtns) {
        console.error(`分页按钮容器不存在: ${containerId}Btns`);
        return;
    }

    let html = '';
    
    // 上一页按钮
    html += `<button class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${page === 1 ? 'disabled:opacity-50' : ''}" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">上一页</button>`;
    
    // 计算显示的页码范围
    let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    // 页码按钮
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="px-3 py-2 ${i === page ? 'bg-indigo-600 text-white' : 'border border-gray-300 hover:bg-gray-50'} rounded-lg" data-page="${i}">${i}</button>`;
    }
    
    // 下一页按钮
    html += `<button class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${page === totalPages ? 'disabled:opacity-50' : ''}" ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">下一页</button>`;
    
    paginationBtns.innerHTML = html;

    // 绑定事件监听器
    paginationBtns.querySelectorAll('button[data-page]').forEach(btn => {
        const targetPage = parseInt(btn.getAttribute('data-page'));
        if (targetPage >= 1 && targetPage <= totalPages && !btn.disabled) {
            btn.addEventListener('click', () => {
                if (onPageChange) {
                    onPageChange(targetPage);
                }
            });
        }
    });
};

export default {
    createPaginationHTML,
    renderPagination
};

