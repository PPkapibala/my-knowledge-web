/**
 * API 客户端
 * 与后端 API 交互的核心模块
 */

class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    /**
     * 通用请求方法
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    // ==================== 知识条目 API ====================

    /**
     * 获取所有知识条目
     */
    async getArticles(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/articles?${params.toString()}`);
    }

    /**
     * 创建知识条目
     */
    async createArticle(data) {
        return this.request('/articles', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * 获取单个知识条目
     */
    async getArticle(id) {
        return this.request(`/articles/${id}`);
    }

    /**
     * 更新知识条目
     */
    async updateArticle(id, data) {
        return this.request(`/articles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * 删除知识条目
     */
    async deleteArticle(id) {
        return this.request(`/articles/${id}`, {
            method: 'DELETE',
        });
    }

    /**
     * 批量更新知识条目
     */
    async batchUpdateArticles(ids, data) {
        return this.request('/articles/batch', {
            method: 'PUT',
            body: JSON.stringify({ ids, data }),
        });
    }

    // ==================== 分类 API ====================

    /**
     * 获取所有分类
     */
    async getCategories() {
        return this.request('/categories');
    }

    /**
     * 创建分类
     */
    async createCategory(data) {
        return this.request('/categories', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * 更新分类
     */
    async updateCategory(id, data) {
        return this.request(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * 删除分类
     */
    async deleteCategory(id) {
        return this.request(`/categories/${id}`, {
            method: 'DELETE',
        });
    }

    // ==================== 资源类型 API ====================

    /**
     * 获取所有资源类型
     */
    async getResourceTypes() {
        return this.request('/resource-types');
    }

    /**
     * 创建资源类型
     */
    async createResourceType(data) {
        return this.request('/resource-types', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * 更新资源类型
     */
    async updateResourceType(id, data) {
        return this.request(`/resource-types/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * 删除资源类型
     */
    async deleteResourceType(id) {
        return this.request(`/resource-types/${id}`, {
            method: 'DELETE',
        });
    }

    // ==================== 工具方法 ====================

    /**
     * 抓取网页元数据
     */
    async fetchMetadata(url) {
        try {
            return await this.request('/metadata', {
                method: 'POST',
                body: JSON.stringify({ url }),
            });
        } catch (error) {
            console.warn('Failed to fetch metadata:', error);
            return { title: '', description: '' };
        }
    }
}

// 创建全局 API 实例
const api = new APIClient(CONFIG.API_BASE_URL);
