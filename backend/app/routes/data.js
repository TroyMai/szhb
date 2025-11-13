const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const { authenticate, authorize } = require('../middleware/auth');

// 获取数据列表（管理员）
router.get('/list', authenticate, authorize('admin'), dataController.getDataList);

// 查询数据（所有已登录用户）
router.post('/query', authenticate, dataController.queryData);

// 获取筛选选项（必须在 /:id 之前，避免被当作 id 处理）
router.get('/filter-options', authenticate, dataController.getFilterOptions);

// 根据标题获取数据详情（必须在 /:id 之前）
router.get('/by-title/:title', authenticate, dataController.getDataByTitle);

// 获取数据记录（必须在 /:id 之前）
router.get('/:id/records', authenticate, dataController.getDataRecords);

// 获取数据记录统计（按月）
router.get('/:id/records/months', authenticate, dataController.getDataRecordsByMonth);

// 导出数据（必须在 /:id 之前）
router.get('/:id/export', authenticate, dataController.exportData);

// 获取数据详情
router.get('/:id', authenticate, dataController.getDataById);

// 创建数据（管理员）
router.post('/', authenticate, authorize('admin'), dataController.createData);

// 更新数据（管理员或上传者）
router.put('/:id', authenticate, dataController.updateData);

// 删除数据（管理员或上传者）
router.delete('/:id', authenticate, dataController.deleteData);

// 审核数据（管理员）
router.post('/:id/approve', authenticate, authorize('admin'), dataController.approveData);

// 获取类别统计
router.get('/stats/categories', authenticate, dataController.getCategoryStats);

// 获取数据趋势统计
router.get('/stats/trend', authenticate, dataController.getTrendStats);

// 获取数据来源统计
router.get('/stats/sources', authenticate, dataController.getSourceStats);

// 获取数据统计（管理员）
router.get('/stats/summary', authenticate, authorize('admin'), dataController.getDataStats);

// 批量操作（管理员）
router.post('/batch', authenticate, authorize('admin'), dataController.batchOperation);

module.exports = router;

