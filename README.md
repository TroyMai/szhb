# 数智湖北 - 数据可视化与决策支持平台

## 项目简介

湖北省数据可视化与决策支持网站，提供数据查询、可视化、预测分析和AI决策支持功能。

## 技术栈

- **前端**: HTML + JavaScript + Tailwind CSS + Chart.js + ECharts
- **后端**: Node.js + Express + MySQL
- **数据库**: MySQL 8.0+

## 快速开始

### 1. 环境要求

- Node.js 18+
- MySQL 8.0+
- npm 或 yarn

### 2. 数据库配置

#### 导入数据库

**方式一：使用 SQL 文件（推荐，会自动创建数据库）**

```bash
# 导入完整数据库（会自动创建 szhb 数据库）
mysql -u root -p < backend/database/init_szhb.sql
```

**方式二：手动创建数据库后导入**

```bash
# 1. 登录 MySQL
mysql -u root -p

# 2. 创建数据库
CREATE DATABASE szhb DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 3. 退出 MySQL
exit

# 4. 导入数据（指定数据库）
mysql -u root -p szhb < backend/database/init_szhb.sql
```

#### 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123456 | 管理员 |
| normal_user | 123456 | 普通用户 |
| decision_user | 123456 | 决策用户 |

### 3. 后端配置

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 复制环境变量模板
cp env.example .env

# 编辑 .env 文件，配置数据库账户密码
# DB_USER=root
# DB_PASSWORD=your_password

# 启动后端服务
npm run dev
```

后端服务运行在：`http://localhost:5000`

### 4. 前端配置

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动前端服务
npm run dev
```

前端服务运行在：`http://localhost:3000`

访问：`http://localhost:3000/pages/login.html`

## 功能说明

详细功能说明请查看：[功能说明文档](FEATURES.md)