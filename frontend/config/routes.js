/**
 * 路由配置
 * 定义所有页面的路由信息
 */

const routes = {
  // 登录页
  login: {
    path: './login.html',
    name: '登录',
    requiresAuth: false,
    meta: {
      title: '登录 - 数智湖北',
      description: '数智湖北数据可视化平台登录'
    }
  },

  // 首页
  home: {
    path: './home.html',
    name: '首页',
    requiresAuth: true,
    meta: {
      title: '首页 - 数智湖北',
      description: '数智湖北数据可视化平台首页'
    }
  },

  // 数据查询
  query: {
    path: './query.html',
    name: '数据查询',
    requiresAuth: true,
    meta: {
      title: '数据查询 - 数智湖北',
      description: '多条件组合查询数据'
    }
  },

  // 数据详情
  dataDetail: {
    path: './data-detail.html',
    name: '数据详情',
    requiresAuth: true,
    meta: {
      title: '数据详情 - 数智湖北',
      description: '数据详细信息和可视化'
    }
  },

  // 数据预测
  prediction: {
    path: './prediction.html',
    name: '数据预测',
    requiresAuth: true,
    meta: {
      title: '数据预测 - 数智湖北',
      description: '基于历史数据预测未来趋势'
    }
  },

  // 决策支持
  analysis: {
    path: './analysis.html',
    name: '决策支持',
    requiresAuth: true,
    meta: {
      title: '决策支持 - 数智湖北',
      description: '问题分析与辅助决策'
    }
  },

  // 个人中心
  profile: {
    path: './profile.html',
    name: '个人中心',
    requiresAuth: true,
    meta: {
      title: '个人中心 - 数智湖北',
      description: '个人信息管理'
    }
  },

  // 数据管理（管理员）
  adminData: {
    path: './admin-data.html',
    name: '数据管理',
    requiresAuth: true,
    requiresRole: ['admin'],
    meta: {
      title: '数据管理 - 数智湖北',
      description: '数据管理后台'
    }
  },

  // 用户管理（管理员）
  adminUsers: {
    path: './admin-users.html',
    name: '用户管理',
    requiresAuth: true,
    requiresRole: ['admin'],
    meta: {
      title: '用户管理 - 数智湖北',
      description: '用户管理后台'
    }
  },

  // 系统管理（管理员）
  adminSystem: {
    path: './admin-system.html',
    name: '系统管理',
    requiresAuth: true,
    requiresRole: ['admin'],
    meta: {
      title: '系统管理 - 数智湖北',
      description: '系统管理后台'
    }
  }
};

export default routes;

