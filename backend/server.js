const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/config');
const { connectDB } = require('./config/database');

// 导入路由
const authRoutes = require('./app/routes/auth');
const dataRoutes = require('./app/routes/data');
const userRoutes = require('./app/routes/user');
const visualizationRoutes = require('./app/routes/visualization');
const predictionRoutes = require('./app/routes/prediction');
const analysisRoutes = require('./app/routes/analysis');
const systemRoutes = require('./app/routes/system');
const favoriteRoutes = require('./app/routes/favorite');
const localDataRoutes = require('./app/routes/localData');

// 创建Express应用
const app = express();

// 连接数据库
connectDB();

// 中间件
// 注意：helmet 可能会影响某些请求，开发环境可以放宽限制
if (config.env === 'development') {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
} else {
  app.use(helmet());
}

// CORS 配置 - 需要在所有路由之前
const corsOptions = {
  origin: function (origin, callback) {
    // 允许的源列表
    const allowedOrigins = config.cors.origin;
    
    // 开发环境：允许所有本地地址，或者没有 origin（如 Postman）
    if (config.env === 'development') {
      if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, true); // 开发环境允许所有源
      }
    } else {
      // 生产环境：只允许配置的源
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('不允许的源'));
      }
    }
  },
  credentials: config.cors.credentials,
  methods: config.cors.methods,
  allowedHeaders: [...config.cors.allowedHeaders, 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 24小时
};

app.use(cors(corsOptions)); // 跨域

// 手动处理 OPTIONS 预检请求（确保预检请求被正确处理）
app.options('*', cors(corsOptions));

app.use(morgan('dev')); // 日志
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析

// API路由（需要在静态文件之前）
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/user', userRoutes);
app.use('/api/visualization', visualizationRoutes);
app.use('/api/prediction', predictionRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/favorite', favoriteRoutes);
app.use('/api/local-data', localDataRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.env
  });
});

// 404处理 - 只处理 API 请求
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.path,
    method: req.method
  });
});

// 静态文件服务（前端页面）- 放在最后，作为 fallback
// 确保根路径返回 index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use(express.static(path.join(__dirname, '../frontend')));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(config.env === 'development' && { stack: err.stack })
  });
});

// 启动服务器
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`环境: ${config.env}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM信号 received. 关闭服务器...');
  process.exit(0);
});

module.exports = app;

