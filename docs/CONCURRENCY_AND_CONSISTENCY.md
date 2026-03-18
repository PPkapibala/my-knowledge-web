# 🔄 数据一致性与并发处理指南

**版本**: v1.2 | **日期**: 2026-02-26

---

## 目录

- [并发场景分析](#并发场景分析)
- [多标签页数据同步](#多标签页数据同步)
- [乐观更新机制](#乐观更新机制)
- [网络中断恢复](#网络中断恢复)
- [操作冲突处理](#操作冲突处理)
- [事务和原子性](#事务和原子性)

---

## 并发场景分析

### 场景 1: 多标签页编辑同一资源

**用户操作**:
- Tab A: 打开资源详情，编辑标题
- Tab B: 同一浏览器，打开同一资源详情，编辑描述

**问题**:
```
时间线：
T1: Tab A 发送 PUT /articles/1 { title: "新标题" }
T2: Tab B 发送 PUT /articles/1 { description: "新描述" }
T3: Tab A 响应成功，articles[0].title = "新标题"
T4: Tab B 响应成功，articles[0].description = "新描述"

如果两个标签页都在本地维护同一份数据：
- Tab A 的状态会包含 Tab B 的更新吗？
- 刷新后数据是最新的吗？
```

**解决方案**:

```javascript
// 方案1: 共享状态 (推荐)
// 两个标签页共享同一个 sessionStorage，利用 storage 事件通知

window.addEventListener('storage', (event) => {
  if (event.key === 'app_state') {
    // 重新在 Tab B 加载最新状态
    const newState = JSON.parse(event.newValue);
    updateLocalState(newState);
  }
});

// 方案2: 每个标签页独立
// 分别维护各自的状态，更新前远程获取最新版本检查冲突


// 推荐实现:
function updateArticleOptimistic(id, updates) {
  // 1. 获取当前状态备份
  const oldState = getArticleById(id);
  
  // 2. 立即更新本地 UI
  updateUI(id, updates);
  broadcastUpdate({ id, updates }); // 通知其他标签页
  
  // 3. 发送到后端
  api.put(`/articles/${id}`, updates)
    .then(response => {
      // 成功：UI 保持不变，但用完整响应数据覆盖（保证一致）
      updateUI(id, response.data);
    })
    .catch(error => {
      // 失败：回滚 UI
      updateUI(id, oldState);
      broadcastUpdate({ id, data: oldState, undo: true });
    });
}

// 广播更新到其他标签页
function broadcastUpdate(update) {
  localStorage.setItem('pending_update', JSON.stringify({
    timestamp: Date.now(),
    update
  }));
}
```

---

### 场景 2: 添加分类弹窗中新建分类，然后立即使用

**用户操作**:
1. 点击"+添加资源"，打开弹窗
2. 在分类下拉中点击"⚙️ 管理分类"
3. 新建分类"新领域"
4. 关闭管理面板
5. 立即在弹窗中选择"新领域"

**问题**:

```
时间线：
T1: 用户创建分类，POST /api/categories { name: "新领域" }，响应成功
T2: 后端保存到数据库
T3: 前端立即更新分类下拉列表
T4: 用户在下拉中选择"新领域"
T5: 用户提交资源，POST /api/articles { category_id: "new-uuid" }

如果 T3 和 T5 之间的时间很短，会发生什么？
- 资源是否成功关联到新分类？
- 新分类是否真的已保存到数据库？
```

**解决方案**:

```javascript
// 方案: 等待确认 + 同步刷新

async function createCategoryInModal(name, parentId) {
  try {
    // 1. 创建分类
    const response = await api.post('/categories', { name, parentId });
    const newCategory = response.data;
    
    // 2. 添加到本地分类列表（乐观更新）
    const categories = getCategories();
    addToCategories(categories, newCategory);
    updateCategoryDropdown(categories);
    
    // 3. 立即可用
    showToast('分类已创建', 'success');
    
    // 4. 返回新分类，通知上层组件
    return newCategory;
    
  } catch (error) {
    // 创建失败，从列表中移除
    removeFromCategories(newCategory.id);
    updateCategoryDropdown(getCategories());
    showToast('创建失败', 'error');
    throw error;
  }
}

// 在添加资源弹窗中
async function submitArticle(formData) {
  const { category_id } = formData;
  
  // 检查分类是否存在于当前列表
  if (!getCategoryById(category_id)) {
    // 远程验证分类是否真的存在
    const exists = await verifyCategory(category_id);
    if (!exists) {
      showToast('选择的分类不存在', 'error');
      return;
    }
  }
  
  // 提交资源
  await api.post('/articles', formData);
}
```

---

### 场景 3: 拖拽排序中途网络中断

**用户操作**:
1. 拖拽资源从位置 1 到位置 3
2. 网络中断
3. UI 已经显示新顺序
4. 网络恢复

**问题**:

```
问题1: 拖拽完成触发 API 调用，但网络中断
      → UI 显示新顺序
      → 数据库仍是旧顺序
      → 刷新后数据变回旧顺序

问题2: 拖拽中网络中断
      → UI 停在中间状态
      → 用户感到困惑
```

**解决方案**:

```javascript
// 拖拽完成的处理

async function handleDragEnd(draggedItem, newPosition) {
  const oldOrder = draggedItem.order;
  const newOrder = calculateNewOrder(newPosition);
  
  // 1. 立即更新 UI（乐观更新）
  draggedItem.order = newOrder;
  updateUI();
  showLoadingIndicator('排序中...');
  
  try {
    // 2. 发送排序请求，内置重试逻辑
    await apiWithRetry('PUT', '/api/articles/batch-order', {
      items: [{ id: draggedItem.id, order: newOrder }]
    });
    
    showToast('排序已保存', 'success');
    
  } catch (error) {
    // 3. 失败：回滚 UI
    draggedItem.order = oldOrder;
    updateUI();
    
    if (error.isNetworkError) {
      // 网络错误：提示用户可以重试
      showToast('网络连接失败，请重试', 'error');
      // 保留数据，允许用户点击"重试"
    } else {
      showToast('排序失败，已回滚', 'error');
    }
  }
}

// 带重试的 API 调用
async function apiWithRetry(method, url, data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (method === 'PUT') {
        return await api.put(url, data);
      } else if (method === 'POST') {
        return await api.post(url, data);
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        // 最后一次重试仍失败
        throw error;
      }
      
      // 等待后重试
      const delay = Math.pow(2, i) * 1000; // 指数退避: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## 多标签页数据同步

### 跨标签页通信机制

**方案**: 使用 `storage` 事件 + Redux/Zustand store

```javascript
// 初始化跨标签页通信
function setupCrossTabCommunication() {
  window.addEventListener('storage', (event) => {
    if (event.key === 'cross_tab_update') {
      const { type, payload } = JSON.parse(event.newValue);
      
      switch (type) {
        case 'ARTICLE_UPDATED':
          updateArticleInStore(payload);
          break;
        case 'CATEGORY_CREATED':
          addCategoryToStore(payload);
          break;
        case 'ARTICLE_DELETED':
          removeArticleFromStore(payload.id);
          break;
        // ... 其他消息类型
      }
      
      updateUI();
    }
  });
}

// 发送跨标签页消息
function broadcastToTabs(type, payload) {
  localStorage.setItem('cross_tab_update', JSON.stringify({
    timestamp: Date.now(),
    type,
    payload
  }));
}

// 使用示例
async function updateArticle(id, updates) {
  const oldData = getArticleById(id);
  
  // 乐观更新本标签页
  updateArticleInStore({ id, ...updates });
  
  // 通知其他标签页
  broadcastToTabs('ARTICLE_UPDATED', { id, ...updates });
  
  try {
    await api.put(`/articles/${id}`, updates);
  } catch (error) {
    // 回滚
    updateArticleInStore({ id, ...oldData });
    broadcastToTabs('ARTICLE_UPDATED', oldData);
  }
}
```

---

## 乐观更新机制

### 实现框架

```javascript
class OptimisticUpdateManager {
  constructor() {
    this.updateQueue = [];      // 待同步的更新
    this.optimisticState = {}; // 本地乐观状态
    this.serverState = {};     // 服务器状态
  }
  
  async update(resourceId, updates) {
    // 1. 保存旧值
    const oldValue = this.serverState[resourceId];
    
    // 2. 乐观更新本地状态
    this.optimisticState[resourceId] = {
      ...oldValue,
      ...updates
    };
    
    // 3. 触发 UI 更新
    notifyListeners('optim isticUpdate', resourceId);
    
    // 4. 发送到服务器
    try {
      const response = await api.put(`/articles/${resourceId}`, updates);
      
      // 5. 更新服务器状态
      this.serverState[resourceId] = response.data;
      
      // 6. 清除乐观状态（已同步）
      delete this.optimisticState[resourceId];
      
      return response.data;
      
    } catch (error) {
      // 5. 失败：恢复为服务器状态
      delete this.optimisticState[resourceId];
      notifyListeners('optimisticRollback', resourceId);
      throw error;
    }
  }
  
  getState(resourceId) {
    // 返回乐观状态，如果没有则返回服务器状态
    return this.optimisticState[resourceId] || this.serverState[resourceId];
  }
}

const updateManager = new OptimisticUpdateManager();

// 使用
function handleArticleUpdate(id, updates) {
  updateManager.update(id, updates)
    .then(() => showToast('已保存', 'success'))
    .catch(() => showToast('保存失败', 'error'));
}
```

---

## 网络中断恢复

### 离线队列机制

```javascript
class OfflineQueue {
  constructor() {
    this.queue = [];
    this.isOnline = navigator.onLine;
    this.setupListeners();
  }
  
  setupListeners() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }
  
  handleOnline() {
    this.isOnline = true;
    this.flushQueue();
  }
  
  handleOffline() {
    this.isOnline = false;
    showToast('网络已断开，本地保存更改', 'warning');
  }
  
  async enqueue(operation) {
    const queueItem = {
      id: generateId(),
      operation,
      timestamp: Date.now(),
      retries: 0
    };
    
    this.queue.push(queueItem);
    
    // 本地持久化
    localStorage.setItem('offline_queue', JSON.stringify(this.queue));
    
    // 如果在线，立即执行
    if (this.isOnline) {
      await this.execute(queueItem);
    } else {
      showToast('操作已保存，网络恢复后自动同步', 'info');
    }
  }
  
  async execute(queueItem) {
    const { operation } = queueItem;
    
    try {
      const response = await api[operation.method](
        operation.url,
        operation.data
      );
      
      // 移除队列项
      this.queue = this.queue.filter(item => item.id !== queueItem.id);
      localStorage.setItem('offline_queue', JSON.stringify(this.queue));
      
      return response;
      
    } catch (error) {
      if (error.isNetworkError) {
        // 网络问题，保持在队列中
        return;
      } else {
        // 业务错误，丢弃
        this.queue = this.queue.filter(item => item.id !== queueItem.id);
        showToast(`操作失败: ${error.message}`, 'error');
      }
    }
  }
  
  async flushQueue() {
    // 恢复本地队列
    const stored = localStorage.getItem('offline_queue');
    if (stored) {
      this.queue = JSON.parse(stored);
    }
    
    // 逐个执行
    for (const item of this.queue) {
      await this.execute(item);
      await delay(500); // 避免请求太密集
    }
  }
}

const offlineQueue = new OfflineQueue();

// 使用
async function createArticleOfflineAware(data) {
  await offlineQueue.enqueue({
    method: 'post',
    url: '/api/articles',
    data
  });
}
```

---

## 操作冲突处理

### Last-Write-Wins 策略

```javascript
// 资源表需要添加 version 字段
// UPDATE articles SET title = ?, version = version + 1 WHERE id = ? AND version = ?

async function updateArticleWithVersionCheck(id, updates, version) {
  try {
    const response = await api.put(`/articles/${id}`, {
      ...updates,
      version
    });
    
    // 成功：版本号已递增
    return response.data;
    
  } catch (error) {
    if (error.code === 409) {
      // 版本冲突：其他客户端已修改
      showToast('资源已被修改，正在重新加载...', 'warning');
      
      // 重新获取最新版本
      const latest = await api.get(`/articles/${id}`);
      
      // 可选：通知用户冲突，让用户决定
      const userChoice = await showConflictDialog(
        updates,
        latest.data
      );
      
      if (userChoice === 'merge') {
        // 重新尝试更新，使用最新版本号
        return updateArticleWithVersionCheck(id, updates, latest.data.version);
      }
    }
  }
}
```

---

## 事务和原子性

### 批量操作的事务保证

**后端实现**:

```sql
-- 批量更新使用事务
BEGIN TRANSACTION;

UPDATE articles 
SET status = 'completed', updated_at = NOW() 
WHERE id = ANY($1::uuid[])
AND user_id = $2;

-- 同时记录操作历史
INSERT INTO operation_history (resource_type, resource_id, operation_type, ...)
SELECT 'article', id, 'update', ... FROM articles WHERE id = ANY($1::uuid[]);

COMMIT;
```

**前端处理**:

```javascript
// 批量更新失败处理
async function batchUpdateArticles(ids, updates) {
  const oldStates = ids.map(id => getArticleById(id));
  
  // 1. 乐观更新
  ids.forEach(id => {
    updateArticleInStore(id, updates);
  });
  updateUI();
  
  // 2. 后端保存
  try {
    const response = await api.put('/articles/batch-update', {
      ids,
      updates
    });
    
    // 3. 验证后端返回数据
    if (response.data.failed_count > 0) {
      // 部分失败
      showToast(
        `成功更新 ${response.data.updated_count} 项，失败 ${response.data.failed_count} 项`,
        'warning'
      );
      
      // 只保留成功的更新，其他回滚
      const successIds = ids.filter(
        id => !response.data.failed_ids.includes(id)
      );
      
      successIds.forEach(id => {
        // 保持更新
      });
      
      // 失败的回滚
      response.data.failed_ids.forEach(failedId => {
        updateArticleInStore(failedId, oldStates[failedId]);
      });
      
      updateUI();
    }
    
  } catch (error) {
    // 全部失败：回滚所有
    ids.forEach((id, idx) => {
      updateArticleInStore(id, oldStates[idx]);
    });
    updateUI();
    showToast('批量更新失败，已回滚', 'error');
  }
}
```

---

## 总结：最佳实践

### ✅ 前端数据一致性检查清单

- [ ] 实现 `storage` 事件监听多标签页同步
- [ ] 所有 API 更新使用乐观更新策略
- [ ] 比较旧/新状态，失败时完整回滚
- [ ] 实现离线操作队列，网络恢复自动同步
- [ ] 大批量操作使用分页和重试
- [ ] 删除操作提高确认等级（Toast + 确认框）

### ✅ 后端数据一致性检查清单

- [ ] 使用数据库事务保证批量操作原子性
- [ ] 所有更新操作检查资源所有权和权限
- [ ] 分类删除时级联更新或移动子项
- [ ] 记录 operation_history 用于审计和撤销
- [ ] 实现版本号或乐观锁防止冲突
- [ ] 设置合理的超时和重试限制

### ✅ 测试用例

- [ ] 多标签页同时编辑同一资源
- [ ] 拖拽中途网络中断
- [ ] 创建资源后立即删除
- [ ] 删除分类并重新分配子项
- [ ] 批量操作部分失败的情况
- [ ] 操作后立即刷新页面的数据一致性

