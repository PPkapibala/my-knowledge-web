/**
 * 学习看板模块（Dashboard）
 * 后续实现统计图表和可视化
 */

class DashboardManager {
    constructor() {
        this.dashboardBtn = document.getElementById('switchViewBtn');
    }

    init() {
        if (this.dashboardBtn) {
            this.dashboardBtn.addEventListener('click', () => this.toggleDashboard());
        }
    }

    toggleDashboard() {
        // TODO: 实现看板切换功能
        console.log('切换到看板视图');
        showToast('看板功能开发中...', 'info');
    }

    /**
     * 计算统计数据
     */
    calculateStats() {
        const articles = appManager.articles;

        return {
            total: articles.length,
            todo: articles.filter(a => a.status === 'todo').length,
            inProgress: articles.filter(a => a.status === 'in_progress').length,
            completed: articles.filter(a => a.status === 'completed').length,
            reviewing: articles.filter(a => a.status === 'reviewing').length,
            paused: articles.filter(a => a.status === 'paused').length,
            completionRate: articles.length > 0 
                ? Math.round((articles.filter(a => a.status === 'completed').length / articles.length) * 100)
                : 0,
        };
    }

    /**
     * 获取各分类内容分布
     */
    getCategoryDistribution() {
        const articles = appManager.articles;
        const distribution = {};

        articles.forEach(article => {
            if (!distribution[article.category_id]) {
                distribution[article.category_id] = 0;
            }
            distribution[article.category_id]++;
        });

        return distribution;
    }

    /**
     * 获取资源类型分布
     */
    getResourceTypeDistribution() {
        const articles = appManager.articles;
        const distribution = {};

        articles.forEach(article => {
            const typeId = article.resource_type_id;
            if (!distribution[typeId]) {
                distribution[typeId] = 0;
            }
            distribution[typeId]++;
        });

        return distribution;
    }

    /**
     * 获取本周统计
     */
    getWeekStats() {
        const articles = appManager.articles;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const thisWeekArticles = articles.filter(a => {
            const createdAt = new Date(a.created_at);
            return createdAt >= oneWeekAgo;
        });

        return {
            newCount: thisWeekArticles.length,
            completedCount: thisWeekArticles.filter(a => a.status === 'completed').length,
        };
    }
}

const dashboardManager = new DashboardManager();

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    dashboardManager.init();
});
