/**
 * 导航栏组件
 */

const createHeader = (currentPage = '') => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRoleMap = {
    'admin': '管理员',
    'decision_user': '决策用户',
    'normal_user': '普通用户'
  };
  
  return `
    <nav class="bg-white shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <a href="{{ROUTER_HOME_PATH}}" class="flex items-center space-x-2 group">
                        <div class="relative">
                            <div class="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-30 transition"></div>
                            <div class="relative bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg shadow-md group-hover:shadow-lg transition">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                        </div>
                        <span class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:from-indigo-700 group-hover:to-purple-700 transition">
                            数智湖北
                        </span>
                    </a>
                </div>
          <div class="flex items-center space-x-4">
            <div class="relative">
              <input type="text" id="searchInput" placeholder="搜索数据..." 
                class="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <button id="searchBtn" class="absolute right-2 top-2 text-gray-400 hover:text-gray-600">🔍</button>
            </div>
            <div class="flex items-center space-x-3">
              <span class="text-base font-medium text-gray-700">${userRoleMap[user.role] || '用户'}</span>
              <div class="relative group">
                <a href="{{ROUTER_PROFILE_PATH}}" class="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-indigo-700 transition-colors select-none" id="userAvatarBtn" style="user-select: none; -webkit-user-select: none;">
                  ${user.username ? user.username.charAt(0).toUpperCase() : '用'}
                </a>
                <div id="userMenu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                    <a href="javascript:void(0)" id="profileLink" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md">个人中心</a>
                    <button id="logoutBtn" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md">退出登录</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `;
};

/**
 * 初始化导航栏
 */
const initHeader = async () => {
  const headerContainer = document.getElementById('header');
  if (headerContainer) {
    // 动态导入 router
    const router = await import('../utils/router.js');
    let html = createHeader();
    // 替换路由占位符
    html = html.replace('{{ROUTER_HOME_PATH}}', router.default.getPath('home'));
    html = html.replace('{{ROUTER_PROFILE_PATH}}', router.default.getPath('profile'));
    headerContainer.innerHTML = html;
    
    // 搜索功能
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    if (searchBtn && searchInput) {
        const handleSearch = () => {
            const keyword = searchInput.value.trim();
            if (keyword) {
                router.default.navigate('query', { keyword });
            }
        };
      searchBtn.addEventListener('click', handleSearch);
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleSearch();
        }
      });
    }
    
    // 用户菜单（头像悬浮显示）
    const userAvatarBtn = document.getElementById('userAvatarBtn');
    const userMenu = document.getElementById('userMenu');
    if (userAvatarBtn && userMenu) {
      // 悬浮显示菜单
      userAvatarBtn.addEventListener('mouseenter', () => {
        userMenu.classList.remove('hidden');
      });
      
      // 鼠标离开头像和菜单区域时隐藏菜单
      const hideMenu = () => {
        userMenu.classList.add('hidden');
      };
      
      userAvatarBtn.addEventListener('mouseleave', (e) => {
        // 检查鼠标是否移动到菜单上
        setTimeout(() => {
          if (!userMenu.matches(':hover') && !userAvatarBtn.matches(':hover')) {
            hideMenu();
          }
        }, 100);
      });
      
      userMenu.addEventListener('mouseleave', () => {
        hideMenu();
      });
      
      // 点击头像进入个人中心（通过链接，不需要额外处理）
      // 点击其他地方时隐藏菜单
      document.addEventListener('click', (e) => {
        if (!userAvatarBtn.contains(e.target) && !userMenu.contains(e.target)) {
          hideMenu();
        }
      });
      
      // 下拉菜单中的"个人中心"链接点击事件
      const profileLink = document.getElementById('profileLink');
      if (profileLink) {
        profileLink.addEventListener('click', (e) => {
          e.preventDefault();
          hideMenu(); // 隐藏菜单
          router.default.navigate('profile'); // 使用路由跳转
        });
      }
    }
    
        // 退出登录
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const auth = await import('../utils/auth.js');
                auth.default.logout();
            });
        }
  }
};

export default {
  createHeader,
  initHeader
};

