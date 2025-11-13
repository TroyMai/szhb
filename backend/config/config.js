require('dotenv').config();

module.exports = {
  // 服务器配置
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  
  // 数据库配置（MySQL）
  database: {
    mysql: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      database: process.env.DB_NAME || 'szhb',
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || (() => {
        console.warn('⚠️  警告: DB_PASSWORD 环境变量未设置，使用默认值（不推荐）');
        console.warn('💡 提示: 请在 .env 文件中设置 DB_PASSWORD');
        return '';
      })(),
      dialect: 'mysql',
      logging: false
    }
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRE || '7d'
  },
  
  // 加密配置
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 10
  },
  
  // 文件上传配置
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },
  
  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info',
    path: process.env.LOG_PATH || './logs'
  },
  
  // 跨域配置
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // 用户角色
  roles: {
    ADMIN: 'admin',
    DECISION_USER: 'decision_user',
    NORMAL_USER: 'normal_user'
  },
  
  // 数据状态
  dataStatus: {
    PENDING: 'pending',
    APPROVED: 'approved',
    DELETED: 'deleted'
  },
  
  // 大模型API配置（通过llmConfig模块管理）
  llm: require('./llmConfig').getConfig()
};

