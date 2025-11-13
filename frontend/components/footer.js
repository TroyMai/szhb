/**
 * Footer 组件
 */

const createFooter = () => {
  return `
    <footer class="footer">
        <div class="footer-content">
            <div class="footer-grid">
                <!-- 项目信息 -->
                <div class="footer-section">
                    <h3 class="footer-section-title">项目信息</h3>
                    <div class="footer-section-content">
                        <div class="footer-logo-text">数智湖北</div>
                        <p>湖北省数据可视化与决策支持平台</p>
                        <p style="margin-top: 0.5rem; color: #64748b; font-size: 0.8125rem;">
                            基于湖北公共数据开放网数据，提供数据查询、可视化、预测分析及辅助决策功能
                        </p>
                    </div>
                </div>

                <!-- 小组成员 -->
                <div class="footer-section">
                    <h3 class="footer-section-title">项目组成员（按首字母排序）</h3>
                    <ul class="footer-member-list">
                        <li class="footer-member-item">郭永富</li>
                        <li class="footer-member-item">赖琦炜</li>
                        <li class="footer-member-item">麦超禹</li>
                        <li class="footer-member-item">沈佳辰</li>
                        <li class="footer-member-item">邰宇杰</li>
                        <li class="footer-member-item">韦政治</li>
                    </ul>
                </div>

                <!-- 功能导航 -->
                <div class="footer-section">
                    <h3 class="footer-section-title">功能导航</h3>
                    <div class="footer-section-content">
                        <a href="{{ROUTER_QUERY_PATH}}" class="footer-link">数据查询</a>
                        <a href="{{ROUTER_PREDICTION_PATH}}" class="footer-link">数据预测</a>
                        <a href="{{ROUTER_ANALYSIS_PATH}}" class="footer-link">决策支持</a>
                        <a href="{{ROUTER_PROFILE_PATH}}" class="footer-link">个人中心</a>
                    </div>
                </div>

                <!-- 数据来源 -->
                <div class="footer-section">
                    <h3 class="footer-section-title">数据来源</h3>
                    <div class="footer-section-content">
                        <p>湖北公共数据开放网</p>
                        <a href="https://data.hubei.gov.cn/#/portal/index" target="_blank" class="footer-link" style="display: inline-block; margin-top: 0.5rem;">
                            data.hubei.gov.cn
                        </a>
                        <p style="margin-top: 0.75rem; font-size: 0.8125rem; color: #64748b;">
                            涵盖科技创新、教育文化、社会民生、生态环境等10+类数据
                        </p>
                    </div>
                </div>
            </div>

            <div class="footer-divider"></div>

            <div class="footer-bottom">
                <p class="footer-bottom-text">
                    © 2025 数智湖北 - 湖北省数据可视化与决策支持平台
                </p>
                <p class="footer-bottom-text" style="margin-top: 0.5rem;">
                    提交时间：2025年11月18日
                </p>
                <p class="footer-bottom-text" style="margin-top: 0.5rem; font-size: 0.75rem;">
                    本系统仅供课程项目展示使用
                </p>
            </div>
        </div>
    </footer>
  `;
};

const initFooter = async (containerId = 'footer') => {
  const container = document.getElementById(containerId);
  if (container) {
    // 动态导入 router
    const router = await import('../utils/router.js');
    let html = createFooter();
    // 替换路由占位符
    html = html.replace('{{ROUTER_QUERY_PATH}}', router.default.getPath('query'));
    html = html.replace('{{ROUTER_PREDICTION_PATH}}', router.default.getPath('prediction'));
    html = html.replace('{{ROUTER_ANALYSIS_PATH}}', router.default.getPath('analysis'));
    html = html.replace('{{ROUTER_PROFILE_PATH}}', router.default.getPath('profile'));
    container.innerHTML = html;
  } else {
    console.warn(`Footer container with id "${containerId}" not found`);
  }
};

export default {
  createFooter,
  initFooter
};

