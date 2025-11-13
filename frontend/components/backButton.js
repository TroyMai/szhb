/**
 * 返回首页按钮组件
 */

const createBackButton = async (routeName = 'home', text = '返回首页') => {
  const router = await import('../utils/router.js');
  const href = router.default.getPath(routeName);
  return `
    <a href="${href}" class="back-button">
      <span class="back-button-icon">&lt;</span>
      ${text}
    </a>
  `;
};

/**
 * 初始化返回按钮
 */
const initBackButton = async (containerId = 'backButtonContainer', routeName = 'home', text = '返回首页') => {
  const container = document.getElementById(containerId);
  if (container) {
    const buttonHtml = await createBackButton(routeName, text);
    container.innerHTML = buttonHtml;
  }
};

export default {
  createBackButton,
  initBackButton
};

