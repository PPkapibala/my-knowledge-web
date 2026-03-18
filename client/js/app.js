/**
 * 主应用逻辑 v2
 */

class AppManager {
    constructor() {
        this.articles = [];
        this.filteredArticles = [];
        this.currentCategory = 'all';
        this.currentStatus = 'all';
        this.searchQuery = '';
        this.selectedTypes = new Set();   // Set<resource_type_id>

        this.addModal = document.getElementById('addModal');
        this.addForm = document.getElementById('addForm');
        this.addBtn = document.getElementById('addBtn');
        this.articlesContainer = document.getElementById('articlesContainer');
        this.searchInput = document.getElementById('searchInput');
        this.statusTabs = document.querySelectorAll('.tab-btn');
        this.toast = document.getElementById('toast');
    }

    async init() {
        console.log('初始化应用...');

        // 并行加载所有数据
        await Promise.all([
            categoryManager.init(),
            resourceTypeManager.init(),
            this.loadArticles(),
        ]);

        this.bindEvents();
        this.updateCategoryNav();
        resourceTypeManager.updateFilterChips();
        resourceTypeManager.updateResourceTypeSelect();
        categoryManager.updateCategorySelect();
        this.filterArticles();

        console.log('应用初始化完成！');
    }

    bindEvents() {
        // 添加按钮
        this.addBtn?.addEventListener('click', () => this.openAddModal());
        document.getElementById('addBtnSecondary')?.addEventListener('click', () => this.openAddModal());

        // 表单提交
        this.addForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitAddForm();
        });

        // 关闭弹窗
        document.querySelectorAll('#addModal .modal-close, #addModal .btn-cancel').forEach(btn => {
            btn.addEventListener('click', () => this.closeAddModal());
        });
        this.addModal?.addEventListener('click', (e) => {
            if (e.target === this.addModal || e.target.classList.contains('modal-overlay')) {
                this.closeAddModal();
            }
        });

        // URL 粘贴后自动抓取标题
        const urlInput = document.getElementById('urlInput');
        urlInput?.addEventListener('paste', () => {
            // paste 事件时 value 还没更新，用 setTimeout 等一帧
            setTimeout(() => this._autoFetchMetadata(urlInput.value.trim()), 50);
        });
        urlInput?.addEventListener('blur', () => {
            const url = urlInput.value.trim();
            const titleInput = document.getElementById('titleInput');
            if (url && !titleInput?.value) {
                this._autoFetchMetadata(url);
            }
        });

        // 搜索（300ms 防抖）
        let searchTimer;
        this.searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                this.searchQuery = e.target.value;
                this.filterArticles();
            }, 300);
        });

        // 状态 Tab
        this.statusTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.statusTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentStatus = tab.dataset.status;
                this.filterArticles();
            });
        });

        // 全部内容导航
        document.getElementById('allContentNav')?.addEventListener('click', () => {
            this.selectCategory('all');
        });

        // 分类列表（事件委托）
        document.getElementById('categoryList')?.addEventListener('click', (e) => {
            const item = e.target.closest('.category-item');
            if (item) this.selectCategory(item.dataset.id);
        });

        // 视图切换
        document.getElementById('gridViewBtn')?.addEventListener('click', () => {
            document.getElementById('gridViewBtn').classList.add('active');
            document.getElementById('listViewBtn').classList.remove('active');
            this.articlesContainer.classList.remove('list-view');
        });
        document.getElementById('listViewBtn')?.addEventListener('click', () => {
            document.getElementById('listViewBtn').classList.add('active');
            document.getElementById('gridViewBtn').classList.remove('active');
            this.articlesContainer.classList.add('list-view');
        });
    }

    // ——— URL 元数据自动抓取 ———
    async _autoFetchMetadata(url) {
        if (!url || !url.startsWith('http')) return;

        const titleInput = document.getElementById('titleInput');
        const descInput = document.getElementById('descriptionInput');
        const hint = document.getElementById('urlHint');

        if (hint) hint.textContent = '✨ 正在抓取页面信息...';

        try {
            const result = await api.fetchMetadata(url);
            const meta = result.data || result;

            if (meta.title && titleInput && !titleInput.value) {
                titleInput.value = meta.title;
            }
            if (meta.description && descInput && !descInput.value) {
                descInput.value = meta.description;
            }
            if (hint) hint.textContent = meta.title ? '✅ 已自动填充标题' : '粘贴后会自动抓取标题';
        } catch {
            if (hint) hint.textContent = '粘贴后会自动抓取标题';
        }
    }

    // ——— 数据加载 ———
    async loadArticles() {
        try {
            const response = await api.getArticles();
            this.articles = response.data || response || [];
        } catch (error) {
            console.error('Failed to load articles:', error);
            this.articles = [];
        }
    }

    // ——— 过滤 ———
    filterArticles() {
        this.filteredArticles = this.articles.filter(article => {
            if (this.currentStatus !== 'all' && article.status !== this.currentStatus) return false;
            if (this.currentCategory !== 'all' && article.category_id !== this.currentCategory) return false;
            if (this.selectedTypes.size > 0 && !this.selectedTypes.has(article.resource_type_id)) return false;
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                const match =
                    article.title?.toLowerCase().includes(q) ||
                    article.description?.toLowerCase().includes(q) ||
                    article.tags?.some(t => t.toLowerCase().includes(q));
                if (!match) return false;
            }
            return true;
        });

        this.updateStats();
        this.updateTabCounts();
        this.updateContentHeader();
        this.renderArticles();
    }

    // ——— 统计 ———
    updateStats() {
        // 统计数基于"全量文章"（不受状态 tab 过滤）
        const base = this.articles.filter(a => {
            if (this.currentCategory !== 'all' && a.category_id !== this.currentCategory) return false;
            if (this.selectedTypes.size > 0 && !this.selectedTypes.has(a.resource_type_id)) return false;
            return true;
        });

        const count = (status) => base.filter(a => a.status === status).length;

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('statTotal',    base.length);
        set('statTodo',     count('todo'));
        set('statProgress', count('in_progress'));
        set('statDone',     count('completed'));
        set('allCount',     this.articles.length);
    }

    updateTabCounts() {
        const base = this.articles.filter(a => {
            if (this.currentCategory !== 'all' && a.category_id !== this.currentCategory) return false;
            if (this.selectedTypes.size > 0 && !this.selectedTypes.has(a.resource_type_id)) return false;
            return true;
        });

        const search = (list) => {
            if (!this.searchQuery) return list;
            const q = this.searchQuery.toLowerCase();
            return list.filter(a =>
                a.title?.toLowerCase().includes(q) ||
                a.description?.toLowerCase().includes(q) ||
                a.tags?.some(t => t.toLowerCase().includes(q))
            );
        };

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('tabCountAll',      search(base).length);
        set('tabCountTodo',     search(base.filter(a => a.status === 'todo')).length);
        set('tabCountProgress', search(base.filter(a => a.status === 'in_progress')).length);
        set('tabCountDone',     search(base.filter(a => a.status === 'completed')).length);
        set('tabCountReview',   search(base.filter(a => a.status === 'reviewing')).length);
        set('tabCountPaused',   search(base.filter(a => a.status === 'paused')).length);
    }

    updateContentHeader() {
        const total = this.filteredArticles.length;
        const el = document.getElementById('contentCount');
        if (el) el.textContent = total > 0 ? `共 ${total} 条` : '';
    }

    // ——— 渲染卡片 ———
    renderArticles() {
        if (this.filteredArticles.length === 0) {
            this.articlesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>${this.searchQuery ? '没有找到匹配的资源' : '还没有添加任何资源'}</p>
                    ${!this.searchQuery ? '<button class="add-btn-secondary" id="emptyAddBtn">+ 添加资源</button>' : ''}
                </div>
            `;
            document.getElementById('emptyAddBtn')?.addEventListener('click', () => this.openAddModal());
            return;
        }

        this.articlesContainer.innerHTML = this.filteredArticles
            .map(article => this.renderArticleCard(article))
            .join('');

        this.articlesContainer.querySelectorAll('.article-card').forEach(card => {
            const article = this.articles.find(a => a.id === card.dataset.id);
            if (!article) return;

            // 点卡片打开链接
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.action-icon')) {
                    window.open(article.url, '_blank');
                }
            });

            card.querySelector('[data-action="status"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.cycleStatus(article);
            });
            card.querySelector('[data-action="delete"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteArticle(article);
            });
        });
    }

    renderArticleCard(article) {
        const resourceType = resourceTypeManager.resourceTypes.find(t => t.id === article.resource_type_id);
        const statusCfg    = CONFIG.STATUS_LIST.find(s => s.value === article.status) || CONFIG.STATUS_LIST[0];
        const typeIcon     = resourceType?.icon || '🔖';
        const typeName     = resourceType?.name || '其他';
        const categoryPath = this._getCategoryPath(article.category_id);
        const dateStr      = article.created_at ? this._relativeTime(new Date(article.created_at)) : '';

        const tagsHtml = (article.tags?.length > 0)
            ? `<div class="card-tags">${article.tags.slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('')}</div>`
            : '';

        const descHtml = article.description
            ? `<p class="card-description">${this._escapeHtml(article.description)}</p>`
            : '';

        const categoryHtml = categoryPath
            ? `<div class="card-category">${categoryPath}</div>`
            : '';

        return `
            <div class="article-card" data-id="${article.id}">
                <div class="card-badges">
                    <span class="card-type-badge">${typeIcon} ${typeName}</span>
                    <span class="card-status-badge ${article.status}">${statusCfg.label}</span>
                </div>
                <h3 class="card-title">${this._escapeHtml(article.title)}</h3>
                ${descHtml}
                ${categoryHtml}
                ${tagsHtml}
                <div class="card-footer">
                    <span class="card-date">📅 ${dateStr}</span>
                    <div class="card-actions">
                        <span class="action-icon" data-action="status" title="切换状态">✏️</span>
                        <span class="action-icon" data-action="delete" title="删除">🗑️</span>
                    </div>
                </div>
            </div>
        `;
    }

    // ——— 工具方法 ———
    _getCategoryPath(categoryId) {
        if (!categoryId) return '';
        const cat = categoryManager.categories.find(c => c.id === categoryId);
        if (!cat) return '';
        if (cat.parent_id) {
            const parent = categoryManager.categories.find(c => c.id === cat.parent_id);
            if (parent) {
                return `${parent.icon || '📁'} ${this._escapeHtml(parent.name)} <span class="card-category-sep">›</span> ${cat.icon || '📁'} ${this._escapeHtml(cat.name)}`;
            }
        }
        return `${cat.icon || '📁'} ${this._escapeHtml(cat.name)}`;
    }

    _relativeTime(date) {
        const diff   = Date.now() - date.getTime();
        const mins   = Math.floor(diff / 60000);
        const hours  = Math.floor(diff / 3600000);
        const days   = Math.floor(diff / 86400000);
        const weeks  = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        if (mins  < 1)   return '刚刚';
        if (mins  < 60)  return `${mins}分钟前`;
        if (hours < 24)  return `${hours}小时前`;
        if (days  < 7)   return `${days}天前`;
        if (weeks < 5)   return `${weeks}周前`;
        if (months < 12) return `${months}个月前`;
        return `${Math.floor(months / 12)}年前`;
    }

    _escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ——— 状态切换 ———
    async cycleStatus(article) {
        const list = ['todo', 'in_progress', 'completed', 'reviewing', 'paused'];
        const next = list[(list.indexOf(article.status) + 1) % list.length];
        try {
            await api.updateArticle(article.id, { status: next });
            await this.loadArticles();
            this.filterArticles();
            showToast('状态已更新 ✓');
        } catch {
            showToast('更新失败');
        }
    }

    async deleteArticle(article) {
        if (!confirm(`确定要删除"${article.title}"吗？`)) return;
        try {
            await api.deleteArticle(article.id);
            await this.loadArticles();
            this.filterArticles();
            showToast('已删除');
        } catch {
            showToast('删除失败');
        }
    }

    // ——— 弹窗 ———
    openAddModal() {
        ['urlInput', 'titleInput', 'descriptionInput', 'tagsInput'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const hint = document.getElementById('urlHint');
        if (hint) hint.textContent = '粘贴后会自动抓取标题';

        const typeSelect = document.getElementById('resourceTypeSelect');
        if (typeSelect) typeSelect.value = '';
        const catSelect = document.getElementById('categorySelect');
        if (catSelect) catSelect.value = '';

        this.addModal?.classList.remove('hidden');
        document.getElementById('urlInput')?.focus();
    }

    closeAddModal() {
        this.addModal.classList.add('hidden');
    }

    async submitAddForm() {
        const url            = document.getElementById('urlInput').value.trim();
        const title          = document.getElementById('titleInput').value.trim();
        const description    = document.getElementById('descriptionInput').value.trim();
        const resourceTypeId = document.getElementById('resourceTypeSelect').value;
        const categoryId     = document.getElementById('categorySelect').value;
        const tagsRaw        = document.getElementById('tagsInput').value.trim();

        if (!url || !title) { showToast('请填写网址和标题'); return; }
        if (!resourceTypeId || !categoryId) { showToast('请选择资源类型和分类'); return; }

        const submitBtn = this.addForm.querySelector('.btn-submit');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
            await api.createArticle({
                title, url, description,
                resource_type_id: resourceTypeId,
                category_id: categoryId,
                tags,
                status: 'todo',
            });
            this.closeAddModal();
            await this.loadArticles();
            this.filterArticles();
            showToast('资源添加成功 🌸');
        } catch (error) {
            console.error('Failed to create article:', error);
            showToast('添加失败，请重试');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    // ——— 分类导航 ———
    selectCategory(categoryId) {
        this.currentCategory = categoryId;

        // 侧边栏高亮
        document.getElementById('allContentNav')?.classList.toggle('active', categoryId === 'all');
        document.querySelectorAll('#categoryList .category-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === categoryId);
        });

        // 面包屑
        const nameEl = document.getElementById('currentCategoryName');
        if (nameEl) {
            if (categoryId === 'all') {
                nameEl.textContent = '全部内容';
            } else {
                const cat = categoryManager.categories.find(c => c.id === categoryId);
                nameEl.textContent = cat ? cat.name : '全部内容';
            }
        }

        this.filterArticles();
    }

    updateCategoryNav() {
        const list = document.getElementById('categoryList');
        if (!list) return;

        const renderItem = (cat, level = 0) => {
            const count = this.articles.filter(a => a.category_id === cat.id).length;
            const children = categoryManager.categories.filter(c => c.parent_id === cat.id);
            return `
                <li class="category-item" data-id="${cat.id}" data-level="${level}">
                    <span class="category-icon">${cat.icon || '📁'}</span>
                    <span class="category-name">${cat.name}</span>
                    ${count > 0 ? `<span class="category-count">${count}</span>` : ''}
                </li>
                ${children.map(child => renderItem(child, level + 1)).join('')}
            `;
        };

        const roots = categoryManager.categories.filter(c => !c.parent_id);
        list.innerHTML = roots.map(cat => renderItem(cat)).join('');
    }
}

const appManager = new AppManager();

// ——— Toast ———
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

// 启动
document.addEventListener('DOMContentLoaded', () => appManager.init());
