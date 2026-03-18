/**
 * 前端配置文件
 */

const CONFIG = {
    // API 服务器地址
    API_BASE_URL: 'http://localhost:3001/api',
    
    // 应用名称
    APP_NAME: '🌸 个人知识库',
    
    // 学习状态列表
    STATUS_LIST: [
        { value: 'todo', label: '📌 待学习', color: '#F4A261' },
        { value: 'in_progress', label: '🌱 学习中', color: '#7BC67E' },
        { value: 'completed', label: '✅ 已学会', color: '#52B788' },
        { value: 'reviewing', label: '🔄 复习中', color: '#B5A4CF' },
        { value: 'paused', label: '⏸️ 暂停', color: '#A8A8A8' },
    ],
    
    // 默认资源类型
    DEFAULT_RESOURCE_TYPES: [
        { icon: '🎬', name: '视频' },
        { icon: '📄', name: '文章' },
        { icon: '📝', name: '笔记' },
        { icon: '📚', name: '课程' },
        { icon: '🔖', name: '其他' },
    ],
    
    // 默认分类
    DEFAULT_CATEGORIES: [
        { icon: '💻', name: '技术', parentId: null },
        { icon: '📚', name: '学习', parentId: null },
        { icon: '🎨', name: '设计', parentId: null },
    ],
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
