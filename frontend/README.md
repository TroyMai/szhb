# 前端项目说明

## 启动方式

### 方式一：使用 npm 脚本（推荐）
```bash
cd frontend
npm run dev
```
然后访问：`http://localhost:3000/pages/login.html`

### 方式二：直接访问
如果 live-server 已经启动，直接在浏览器中访问：
- `http://localhost:3000/pages/login.html`
- `http://localhost:3000/index.html`（会显示入口页面）

### 方式三：使用 live-server 手动启动
```bash
cd frontend
npx live-server --port=3000
```
然后手动在浏览器中打开：`http://localhost:3000/pages/login.html`

## 页面列表

- `pages/login.html` - 登录页面
- `pages/home.html` - 首页
- `pages/query.html` - 数据查询
- `pages/prediction.html` - 数据预测
- `pages/analysis.html` - 问题分析
- `pages/profile.html` - 个人中心
- `pages/admin-data.html` - 数据管理（管理员）
- `pages/admin-users.html` - 用户管理（管理员）
- `pages/admin-system.html` - 系统管理（管理员）

## 注意事项

1. **确保在 `frontend` 目录下运行 `npm run dev`**
2. 如果遇到路径问题，直接访问 `http://localhost:3000/pages/login.html`
3. 所有页面使用相对路径，确保在正确的目录结构下访问

