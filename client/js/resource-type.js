/**
 * 资源类型管理模块
 */

class ResourceTypeManager {
    constructor() {
        this.resourceTypes = [];
        this.modal = document.getElementById('resourceTypeModal');
        this.typeList = document.getElementById('typeList');
        this.addTypeBtn = document.getElementById('addTypeBtn');
        this.resourceTypeModalDoneBtn = document.getElementById('resourceTypeModalDoneBtn');
        this.newTypeIcon = document.getElementById('newTypeIcon');
        this.newTypeName = document.getElementById('newTypeName');
        this.customizeTypeBtn = document.getElementById('customizeTypeBtn');
    }

    async init() {
        this.bindEvents();
        await this.loadResourceTypes();
    }

    bindEvents() {
        this.customizeTypeBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal();
        });

        this.resourceTypeModalDoneBtn?.addEventListener('click', () => this.closeModal());
        this.addTypeBtn?.addEventListener('click', () => this.addResourceType());
        this.newTypeName?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addResourceType();
        });

        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal || e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });
        document.querySelector('#resourceTypeModal .modal-close')?.addEventListener('click', () => this.closeModal());
    }

    async loadResourceTypes() {
        try {
            const response = await api.getResourceTypes();
            this.resourceTypes = response.data || response || [];
        } catch (error) {
            console.error('Failed to load resource types:', error);
            this.resourceTypes = [];
        }
    }

    async addResourceType() {
        const name = this.newTypeName.value.trim();
        const icon = this.newTypeIcon.value.trim() || '📌';

        if (!name) { showToast('请输入类型名称'); return; }

        try {
            await api.createResourceType({ name, icon });
            this.newTypeName.value = '';
            this.newTypeIcon.value = '';

            await this.loadResourceTypes();
            this.renderTypes();
            this.updateResourceTypeSelect();
            this.updateFilterChips();
            showToast('资源类型添加成功 🌸');
        } catch (error) {
            showToast('添加资源类型失败');
        }
    }

    async deleteResourceType(id) {
        if (this.resourceTypes.length <= 1) { showToast('至少保留一个类型'); return; }
        if (!confirm('删除此资源类型？')) return;
        try {
            await api.deleteResourceType(id);
            await this.loadResourceTypes();
            this.renderTypes();
            this.updateResourceTypeSelect();
            this.updateFilterChips();
            showToast('资源类型已删除');
        } catch (error) {
            showToast('删除失败');
        }
    }

    async updateResourceType(id, data) {
        try {
            await api.updateResourceType(id, data);
            await this.loadResourceTypes();
            this.renderTypes();
            this.updateResourceTypeSelect();
            this.updateFilterChips();
        } catch (error) {
            showToast('更新失败');
        }
    }

    renderTypes() {
        if (!this.typeList) return;
        this.typeList.innerHTML = this.resourceTypes
            .map(type => this.renderTypeItem(type))
            .join('');

        this.typeList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteResourceType(btn.dataset.id);
            });
        });

        this.typeList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = btn.closest('.type-item-manage');
                this.editTypeInline(btn.dataset.id, item);
            });
        });
    }

    renderTypeItem(type) {
        return `
            <div class="type-item-manage">
                <div class="type-item-info">
                    <span>${type.icon || '📌'}</span>
                    <span class="category-name">${type.name}</span>
                </div>
                <div class="type-item-actions">
                    <button class="edit-btn" data-id="${type.id}" title="编辑">✏️</button>
                    <button class="delete-btn" data-id="${type.id}" title="删除">🗑️</button>
                </div>
            </div>
        `;
    }

    editTypeInline(id, element) {
        const type = this.resourceTypes.find(t => t.id === id);
        if (!type) return;

        const nameSpan = element.querySelector('.category-name');
        const originalName = nameSpan.textContent;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'type-name-input';
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
                await this.updateResourceType(id, { name: newName });
            } else {
                this.renderTypes();
            }
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); save(); }
            if (e.key === 'Escape') { saved = true; this.renderTypes(); }
        });
    }

    updateResourceTypeSelect() {
        const select = document.getElementById('resourceTypeSelect');
        if (!select) return;
        const current = select.value;
        select.innerHTML = [
            '<option value="">选择类型...</option>',
            ...this.resourceTypes.map(t => `<option value="${t.id}">${t.icon} ${t.name}</option>`),
        ].join('');
        select.value = current;
    }

    // 更新筛选 Chips，同时维护 appManager.selectedTypes
    updateFilterChips() {
        const container = document.getElementById('filterChips');
        if (!container) return;

        // 保留当前选中状态
        const currentSelected = appManager ? new Set(appManager.selectedTypes) : new Set();

        container.innerHTML = [
            `<button class="filter-chip ${currentSelected.size === 0 ? 'active' : ''}" data-type-id="all">全部</button>`,
            ...this.resourceTypes.map(t =>
                `<button class="filter-chip ${currentSelected.has(t.id) ? 'active' : ''}" data-type-id="${t.id}">${t.icon} ${t.name}</button>`
            ),
        ].join('');

        // 绑定点击事件
        container.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const typeId = chip.dataset.typeId;

                if (typeId === 'all') {
                    // 点"全部"：清空选中
                    appManager.selectedTypes.clear();
                    container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                } else {
                    // 点具体类型：切换选中
                    container.querySelector('[data-type-id="all"]')?.classList.remove('active');

                    if (appManager.selectedTypes.has(typeId)) {
                        appManager.selectedTypes.delete(typeId);
                        chip.classList.remove('active');
                    } else {
                        appManager.selectedTypes.add(typeId);
                        chip.classList.add('active');
                    }

                    // 如果没有任何类型被选中，激活"全部"
                    if (appManager.selectedTypes.size === 0) {
                        container.querySelector('[data-type-id="all"]')?.classList.add('active');
                    }
                }

                appManager.filterArticles();
            });
        });
    }

    openModal() {
        this.renderTypes();
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
    }
}

const resourceTypeManager = new ResourceTypeManager();
