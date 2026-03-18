/**
 * 分类管理模块
 */

class CategoryManager {
    constructor() {
        this.categories = [];
        this.modal = document.getElementById('categoryModal');
        // 弹窗内的管理列表（新 HTML 中 id 是 categoryManageList）
        this.manageList = document.getElementById('categoryManageList');
        this.addCategoryBtn = document.getElementById('addCategoryBtn');
        this.categoryModalDoneBtn = document.getElementById('categoryModalDoneBtn');
        this.newCategoryIcon = document.getElementById('newCategoryIcon');
        this.newCategoryName = document.getElementById('newCategoryName');
        this.newCategoryParent = document.getElementById('newCategoryParent');
        this.manageCategoryBtn = document.getElementById('manageCategoryBtn');
        this.manageCategoryModalBtn = document.getElementById('manageCategoryModalBtn');
    }

    async init() {
        this.bindEvents();
        await this.loadCategories();
    }

    bindEvents() {
        this.manageCategoryBtn?.addEventListener('click', () => this.openModal());
        this.manageCategoryModalBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal();
        });

        this.categoryModalDoneBtn?.addEventListener('click', () => this.closeModal());
        this.addCategoryBtn?.addEventListener('click', () => this.addCategory());
        this.newCategoryName?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCategory();
        });

        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal || e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });
        document.querySelector('#categoryModal .modal-close')?.addEventListener('click', () => this.closeModal());
    }

    async loadCategories() {
        try {
            const response = await api.getCategories();
            this.categories = response.data || response || [];
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.categories = [];
        }
    }

    async addCategory() {
        const name = this.newCategoryName.value.trim();
        const icon = this.newCategoryIcon.value.trim() || '📚';
        const parentId = this.newCategoryParent.value || null;

        if (!name) { showToast('请输入分类名称'); return; }

        if (parentId) {
            const depth = this.getCategoryDepth(parentId);
            if (depth >= 3) { showToast('最多支持 3 级分类'); return; }
        }

        try {
            await api.createCategory({ name, icon, parent_id: parentId });
            this.newCategoryName.value = '';
            this.newCategoryIcon.value = '';
            this.newCategoryParent.value = '';

            await this.loadCategories();
            this.renderManageList();
            this._syncSidebar();
            showToast('分类添加成功 🌸');
        } catch (error) {
            console.error('Failed to add category:', error);
            showToast('添加分类失败');
        }
    }

    async deleteCategory(id) {
        if (!confirm('删除此分类？其子分类会自动上移到父级。')) return;
        try {
            await api.deleteCategory(id);
            await this.loadCategories();
            this.renderManageList();
            this._syncSidebar();
            showToast('分类已删除');
        } catch (error) {
            showToast('删除失败');
        }
    }

    async updateCategory(id, data) {
        try {
            await api.updateCategory(id, data);
            await this.loadCategories();
            this.renderManageList();
            this._syncSidebar();
        } catch (error) {
            showToast('更新失败');
        }
    }

    // 刷新侧边栏导航 + 下拉选项
    _syncSidebar() {
        appManager.updateCategoryNav();
        this.updateCategorySelect();
    }

    renderManageList() {
        if (!this.manageList) return;
        this.manageList.innerHTML = this.categories
            .map(cat => this.renderCategoryItem(cat))
            .join('');

        this.manageList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCategory(btn.dataset.id);
            });
        });

        this.manageList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = btn.closest('.category-item-manage');
                this.editCategoryInline(btn.dataset.id, item);
            });
        });
    }

    renderCategoryItem(category) {
        const depth = this.getCategoryDepth(category.id);
        const depthLabel = ['一级', '二级', '三级'][depth - 1] || '多级';
        const indent = '　'.repeat(depth - 1);

        return `
            <div class="category-item-manage">
                <div class="category-item-info">
                    <span>${indent}${category.icon || '📚'}</span>
                    <span class="category-name">${category.name}</span>
                    <span class="category-level">${depthLabel}</span>
                </div>
                <div class="category-item-actions">
                    <button class="edit-btn" data-id="${category.id}" title="编辑">✏️</button>
                    <button class="delete-btn" data-id="${category.id}" title="删除">🗑️</button>
                </div>
            </div>
        `;
    }

    editCategoryInline(id, element) {
        const category = this.categories.find(c => c.id === id);
        if (!category) return;

        const nameSpan = element.querySelector('.category-name');
        const originalName = nameSpan.textContent;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'category-name-input';
        input.value = originalName;
        input.style.flex = '1';
        nameSpan.replaceWith(input);
        input.focus();
        input.select();

        let saved = false;
        const save = async () => {
            if (saved) return;
            saved = true;
            const newName = input.value.trim();
            if (newName && newName !== originalName) {
                await this.updateCategory(id, { name: newName });
            } else {
                this.renderManageList();
            }
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); save(); }
            if (e.key === 'Escape') { saved = true; this.renderManageList(); }
        });
    }

    updateCategorySelect() {
        const selects = [
            document.getElementById('categorySelect'),
        ].filter(Boolean);

        const buildOptions = (parentId = null, indent = 0) => {
            return this.categories
                .filter(cat => (cat.parent_id || null) === parentId)
                .flatMap(cat => [
                    `<option value="${cat.id}">${'　'.repeat(indent)}${cat.icon || ''} ${cat.name}</option>`,
                    ...buildOptions(cat.id, indent + 1),
                ]);
        };

        const options = ['<option value="">选择分类...</option>', ...buildOptions()].join('');
        selects.forEach(select => {
            const current = select.value;
            select.innerHTML = options;
            select.value = current;
        });

        // 父级选择下拉（顶级分类选项不同，单独处理）
        if (this.newCategoryParent) {
            const parentOptions = ['<option value="">顶级分类</option>', ...buildOptions()].join('');
            this.newCategoryParent.innerHTML = parentOptions;
        }
    }

    getCategoryDepth(categoryId) {
        let depth = 1;
        let current = this.categories.find(c => c.id === categoryId);
        while (current?.parent_id) {
            depth++;
            current = this.categories.find(c => c.id === current.parent_id);
        }
        return depth;
    }

    openModal() {
        this.renderManageList();
        this.updateCategorySelect();
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this._syncSidebar();
    }

    getFullCategoryPath(categoryId) {
        const path = [];
        let current = this.categories.find(c => c.id === categoryId);
        while (current) {
            path.unshift(current.name);
            current = this.categories.find(c => c.id === current.parent_id);
        }
        return path.join(' › ');
    }
}

const categoryManager = new CategoryManager();
