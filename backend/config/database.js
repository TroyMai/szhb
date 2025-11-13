const mysql = require('mysql2/promise');
const config = require('./config');

let pool = null;

/**
 * 连接MySQL数据库
 */
const connectDB = async () => {
  try {
    const dbConfig = config.database.mysql;
    
    // 创建连接池
    pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    // 测试连接
    const connection = await pool.getConnection();
    console.log(`✅ MySQL Connected: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    connection.release();
    
    return pool;
  } catch (error) {
    console.error('❌ MySQL connection error:', error.message);
    
    // 在开发环境中，如果 MySQL 未运行，给出提示但不退出
    if (config.env === 'development') {
      console.warn('⚠️  警告: MySQL 未运行，某些功能可能无法使用');
      console.warn('💡 提示: 请启动 MySQL 服务，或使用以下命令:');
      console.warn('   1. 安装 MySQL: https://dev.mysql.com/downloads/mysql/');
      console.warn('   2. 启动服务: net start MySQL (Windows) 或 systemctl start mysql (Linux)');
      console.warn('   3. 创建数据库: CREATE DATABASE szhb;');
      console.warn('   4. 或使用 XAMPP/WAMP 等集成环境');
      // 不退出进程，允许服务器继续运行（用于前端开发）
      return null;
    } else {
      // 生产环境必须连接数据库
      console.error('❌ 生产环境必须连接数据库，服务器退出');
      process.exit(1);
    }
  }
};

/**
 * 获取数据库连接池
 */
const getPool = () => {
  if (!pool) {
    throw new Error('数据库未连接，请先调用 connectDB()');
  }
  return pool;
};

/**
 * 执行查询
 */
const query = async (sql, params = []) => {
  try {
    if (!pool) {
      throw new Error('数据库连接池未初始化，请先调用 connectDB()');
    }
    
    // 确保参数是数组
    const queryParams = Array.isArray(params) ? params : [];
    
    // 处理参数：确保数字参数是整数类型
    const processedParams = queryParams.map((param) => {
      // 如果是数字字符串，转换为整数
      if (typeof param === 'string' && /^\d+$/.test(param)) {
        return parseInt(param, 10);
      }
      // 如果是数字，确保是整数
      if (typeof param === 'number') {
        return Math.floor(param);
      }
      return param;
    });
    
    
    // 使用 query 方法而不是 execute
    // execute 方法对 LIMIT/OFFSET 参数有特殊要求，query 方法更灵活
    const [results] = await pool.query(sql, processedParams);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    // 计算占位符和参数数量
    const placeholderCount = (sql.match(/\?/g) || []).length;
    console.error('Placeholder count:', placeholderCount);
    console.error('Params count:', params.length);
    throw error;
  }
};

/**
 * 断开数据库连接
 */
const disconnectDB = async () => {
  try {
    if (pool) {
      await pool.end();
      console.log('MySQL disconnected');
      pool = null;
    }
  } catch (error) {
    console.error('MySQL disconnection error:', error);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  getPool,
  query
};

