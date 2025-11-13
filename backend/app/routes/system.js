const express = require('express');
const router = express.Router();

// TODO: 实现系统控制器
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: '系统状态接口待实现',
    data: {}
  });
});

module.exports = router;

