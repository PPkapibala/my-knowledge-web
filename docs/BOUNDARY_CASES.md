# 🛡️ 边界情况与异常处理手册

**版本**: v1.2 | **日期**: 2026-02-26

---

## 目录

- [分类操作边界](#分类操作边界)
- [资源限制边界](#资源限制边界)
- [撤销机制边界](#撤销机制边界)
- [批量操作边界](#批量操作边界)
- [数据约束边界](#数据约束边界)

---

## 分类操作边界

### 场景 1: 删除含有子分类的分类

**问题**: 用户删除分类"后端技术"，其下包含子分类"Node.js"、"Python"

**解决方案**:

```javascript
// 前端：删除前检查
async function handleDeleteCategory(categoryId) {
  const category = getCategoryById(categoryId);
  
  // 1. 获取子分类数
  const children = getChildCategories(categoryId);
  
  // 2. 获取关联资源数
  const articles = getArticlesByCategory(categoryId);
  
  if (children.length > 0 || articles.length > 0) {
    // 展示选项对话框
    const choice = await showDeleteCategoryDialog({
      childCount: children.length,
      articleCount: articles.length
    });
    
    // choice: 'delete-all' | 'reassign-children' | 'cancel'
    if (choice === 'cancel') return;
    
    if (choice === 'reassign-children') {
      // 需要用户选择新父分类
      const newParentId = await selectNewParent(categoryId);
      if (!newParentId) return;
      
      // 后端删除分类+移动子分类+移动资源
      await api.delete(`/api/categories/${categoryId}`, {
        action: 'reassign',
        newParentId,
        moveArticles: true
      });
    } else if (choice === 'delete-all') {
      // 级联删除所有子分类和资源
      await api.delete(`/api/categories/${categoryId}`, {
        action: 'cascade',
        force: true
      });
    }
  } else {
    // 无关联数据，直接删除
    await api.delete(`/api/categories/${categoryId}`);
  }
}
```

```sql
-- 后端：删除分类处理

-- 方案 A: 级联删除 (DELETE CASCADE)
-- 缺点：永久删除，需谨慎

DELETE FROM categories WHERE id = $1 AND user_id = $2;
-- articles 表中 category_id 会被置为 NULL (如有 ON DELETE SET NULL)

-- 方案 B: 转移子分类
UPDATE categories 
SET parent_id = $1  -- 新父分类
WHERE parent_id = $2  -- 删除的分类
AND user_id = $3;

-- 方案 C: 转移资源后再删除
BEGIN TRANSACTION;

-- 1. 转移资源到新分类
UPDATE articles
SET category_id = $1
WHERE category_id = $2
AND user_id = $3;

-- 2. 转移子分类
UPDATE categories
SET parent_id = $1
WHERE parent_id = $2
AND user_id = $3;

-- 3. 删除分类
DELETE FROM categories
WHERE id = $2
AND user_id = $3;

-- 4. 记录操作
INSERT INTO operation_history 
VALUES (DEFAULT, 'category', $2, 'delete', ...);

COMMIT;
```

---

### 场景 2: 检测和防止循环引用

**问题**: 用户试图将分类"A"转移到分类"B"，但"B"是"A"的子分类

**解决方案**:

```javascript
// 前端验证
function canChangeParent(categoryId, newParentId) {
  if (categoryId === newParentId) {
    showToast('不能选择自己作为父分类', 'error');
    return false;
  }
  
  // 检查新父分类是否是当前分类的子分类
  if (isDescendantOf(newParentId, categoryId)) {
    showToast('不能选择其子分类作为父分类', 'error');
    return false;
  }
  
  return true;
}

function isDescendantOf(targetId, categoryId) {
  let current = getCategoryById(targetId);
  
  while (current) {
    if (current.id === categoryId) {
      return true;  // 找到了循环引用
    }
    current = current.parent_id ? getCategoryById(current.parent_id) : null;
  }
  
  return false;
}

// 后端最终验证（防御性编程）
async function updateCategory(categoryId, updates) {
  const { parent_id: newParentId } = updates;
  
  if (newParentId) {
    // 检查是否导致循环
    const isCircular = await checkCircularReference(categoryId, newParentId);
    if (isCircular) {
      throw new Error('Circular reference detected', { code: 400 });
    }
  }
  
  return updateCategoryInDB(categoryId, updates);
}
```

---

### 场景 3: 分类深度限制

**问题**: 应用设计为最多 3 级分类，用户试图创建第 4 级

**解决方案**:

```javascript
const MAX_CATEGORY_DEPTH = 3;

async function createCategory(name, parentId) {
  if (!parentId) {
    // 这是一级分类，允许
    return api.post('/api/categories', { name, parent_id: null });
  }
  
  // 计算分类深度
  const depth = calculateCategoryDepth(parentId);
  
  if (depth >= MAX_CATEGORY_DEPTH) {
    showToast(`最多只能有 ${MAX_CATEGORY_DEPTH} 级分类`, 'error');
    return;
  }
  
  return api.post('/api/categories', { name, parent_id: parentId });
}

function calculateCategoryDepth(categoryId) {
  let depth = 1;
  let current = getCategoryById(categoryId);
  
  while (current?.parent_id) {
    depth++;
    current = getCategoryById(current.parent_id);
  }
  
  return depth;
}

// 后端强制 SQL 约束
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  depth INT DEFAULT 1,  -- 标准化存储
  user_id UUID NOT NULL,
  
  -- 检查约束
  CONSTRAINT max_depth_check CHECK (depth <= 3),
  
  -- 防止自引用
  CONSTRAINT no_self_reference CHECK (id != parent_id)
);
```

---

## 资源限制边界

### 应用资源上限

| 资源 | 上限 | 处理方式 |
|------|------|---------|
| 文章总数 | 10,000 | 创建新增时检查，提示清理 |
| 分类数 | 500 | 创建新分类时检查 |
| 标签数 | 1,000 | 创建新标签时检查 |
| 单个分类深度 | 3 | SQL CONSTRAINT + 前端验证 |
| 单个资源标签 | 50 | 表单验证 + 后端检查 |
| URL 长度 | 2,048 | 前端警告，后端截断 |
| 描述长度 | 10,000 | 前端限制输入框，后端验证 |

---

### 场景 1: 接近资源上限

**前端实现**:

```javascript
const LIMITS = {
  ARTICLE_MAX: 10000,
  ARTICLE_WARNING: 9500,  // 95% 时警告
  CATEGORY_MAX: 500,
  CATEGORY_WARNING: 475,
  TAG_MAX: 1000,
  TAG_WARNING: 950
};

async function loadDataAndCheckLimits() {
  const stats = await api.get('/api/statistics');
  
  // 检查是否接近限制
  if (stats.article_count >= LIMITS.ARTICLE_WARNING) {
    showWarningBanner(
      `已有 ${stats.article_count} 篇资源（上限 ${LIMITS.ARTICLE_MAX}），` +
      `请及时清理不需要的内容`
    );
  }
  
  if (stats.tag_count >= LIMITS.TAG_WARNING) {
    showWarningBanner(
      `已有 ${stats.tag_count} 个标签（上限 ${LIMITS.TAG_MAX}），` +
      `建议删除重复标签`
    );
  }
}

// 创建新资源时检查
async function createArticle(formData) {
  const stats = await api.get('/api/statistics');
  
  if (stats.article_count >= LIMITS.ARTICLE_MAX) {
    showToast('文章数已达上限，请删除不需要的文章', 'error');
    return;
  }
  
  return api.post('/api/articles', formData);
}
```

**后端实现**:

```sql
-- 添加检查约束
CREATE TABLE articles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  ...
  CONSTRAINT user_article_limit CHECK (
    (SELECT COUNT(*) FROM articles WHERE user_id = NEW.user_id) < 10000
  )
);
```

---

## 撤销机制边界

### 场景 1: 撤销过期失效

**规则**: 操作超过 5 分钟后无法撤销

**实现**:

```javascript
const UNDO_EXPIRY_TIME = 5 * 60 * 1000; // 5 分钟

async function undo(operationId) {
  const operation = await api.get(`/api/operations/${operationId}`);
  
  // 1. 检查是否过期
  const createdAt = new Date(operation.created_at);
  const now = new Date();
  const age = now - createdAt;
  
  if (age > UNDO_EXPIRY_TIME) {
    showToast('该操作已过期（超过5分钟），无法撤销', 'error');
    return;
  }
  
  // 2. 检查资源是否存在
  const resource = await checkResourceExists(
    operation.resource_type,
    operation.resource_id
  );
  
  if (!resource) {
    showToast('资源已删除，无法恢复该操作', 'error');
    return;
  }
  
  // 3. 执行撤销
  return api.post(`/api/articles/${operation.resource_id}/undo`, {
    operation_id: operationId
  });
}

// UI 显示倒计时
function showUndoButton(operationId, createdAt) {
  const button = document.getElementById('undo_button');
  
  const interval = setInterval(() => {
    const age = Date.now() - new Date(createdAt).getTime();
    const remaining = Math.max(0, UNDO_EXPIRY_TIME - age);
    
    if (remaining <= 0) {
      button.disabled = true;
      button.textContent = '撤销（已过期）';
      clearInterval(interval);
    } else {
      const seconds = Math.ceil(remaining / 1000);
      button.textContent = `撤销（${seconds}s）`;
    }
  }, 1000);
}
```

---

### 场景 2: 防止多次撤销同一操作

**问题**: 用户多次点击撤销按钮

**实现**:

```javascript
async function handleUndoClick(operationId) {
  const button = event.target;
  const wasAlreadyClicked = button.dataset.clicked === 'true';
  
  if (wasAlreadyClicked) {
    showToast('请勿重复点击', 'warning');
    return;
  }
  
  // 标记已点击
  button.dataset.clicked = 'true';
  button.disabled = true;
  
  try {
    await undo(operationId);
    showToast('已撤销', 'success');
  } catch (error) {
    showToast('撤销失败', 'error');
    button.dataset.clicked = 'false';
    button.disabled = false;
  }
}
```

---

### 场景 3: 资源删除后尝试撤销

**问题**: 资源被删除，之前的撤销操作涉及该资源

**实现**:

```sql
-- 后端检查：操作历史不依赖被删除的资源

-- 删除文章时级联清理相关操作历史
DELETE FROM operation_history
WHERE resource_type = 'article'
AND resource_id = $1
AND expired_at < NOW();

-- 但保留 5 分钟内的操作（可能需要撤销）
DELETE FROM operation_history
WHERE resource_type = 'article'
AND resource_id = $1
AND expired_at < NOW()
AND created_at < NOW() - INTERVAL '5 minutes';
```

---

## 批量操作边界

### 场景 1: 批量更新中途API超时

**问题**: 批量更新 200 个资源，第 150 个时超时

**解决方案**:

```javascript
// 分页处理大批量操作
async function batchUpdateWithPagination(itemIds, updates, pageSize = 50) {
  const results = {
    successful: [],
    failed: []
  };
  
  for (let i = 0; i < itemIds.length; i += pageSize) {
    const page = itemIds.slice(i, i + pageSize);
    
    try {
      const response = await Promise.race([
        api.put('/api/articles/batch-update', { ids: page, updates }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
      ]);
      
      results.successful.push(...response.data.ids);
      updateUI();
      
    } catch (error) {
      results.failed.push(...page);
      showToast(`第 ${i + 1}-${i + page.length} 项更新失败`, 'warning');
    }
    
    // 避免请求过密集
    await delay(500);
  }
  
  // 显示最终结果
  showToast(
    `成功 ${results.successful.length} 项，失败 ${results.failed.length} 项`,
    results.failed.length === 0 ? 'success' : 'warning'
  );
  
  return results;
}
```

---

### 场景 2: 批量删除中的部分权限错误

**问题**: 批量删除多篇资源，其中一篇因权限不足而失败

**实现**:

```javascript
// 前端
async function batchDeleteArticles(ids) {
  const dialogChoice = await showConfirmDialog(
    `确定删除这 ${ids.length} 篇资源吗？`
  );
  
  if (dialogChoice !== 'confirm') return;
  
  const oldStates = ids.map(id => getArticleById(id));
  
  // 乐观删除
  ids.forEach(id => removeArticleFromStore(id));
  
  try {
    const response = await api.delete('/api/articles/batch-delete', {
      ids
    });
    
    if (response.data.failed_ids?.length > 0) {
      // 部分失败：恢复失败的项
      response.data.failed_ids.forEach(failedId => {
        const idx = ids.indexOf(failedId);
        addArticleToStore(oldStates[idx]);
      });
      
      showToast(
        `成功删除 ${response.data.successful_count} 项，` +
        `${response.data.failed_ids.length} 项删除失败（权限不足或已删除）`,
        'warning'
      );
    }
    
    updateUI();
    
  } catch (error) {
    // 全部失败：完整回滚
    ids.forEach((id, idx) => {
      addArticleToStore(oldStates[idx]);
    });
    showToast('删除失败，已回滚', 'error');
    updateUI();
  }
}

// 后端
async function batchDeleteArticles(userID, ids) {
  const result = {
    successful_count: 0,
    failed_ids: []
  };
  
  for (const id of ids) {
    try {
      // 验证权限
      const article = await getArticle(id);
      if (article.user_id !== userID) {
        result.failed_ids.push(id);
        continue;
      }
      
      await deleteArticle(id);
      result.successful_count++;
      
    } catch (error) {
      result.failed_ids.push(id);
    }
  }
  
  // 即使部分失败也返回 200，告知前端哪些失败了
  return result;
}
```

---

## 数据约束边界

### 场景 1: 标签重复创建

**问题**: 用户试图创建已存在的标签

**实现**:

```javascript
// 前端：搜索预约
async function handleTagInput(input) {
  const existingTag = getTagByName(input);
  
  if (existingTag) {
    showSuggestion(`标签 "${input}" 已存在`, {
      action: 'use',
      onClick: () => selectTag(existingTag)
    });
    return;
  }
  
  // 创建新标签
  const newTag = await api.post('/api/tags', { name: input });
  selectTag(newTag);
}

// 后端：使用 UNIQUE 约束
CREATE TABLE tags (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL,
  
  UNIQUE(name, user_id)  -- 同一用户不能有重名标签
);

-- 创建或获取标签
INSERT INTO tags (id, name, user_id)
VALUES (gen_random_uuid(), $1, $2)
ON CONFLICT (name, user_id) DO UPDATE
SET id = EXCLUDED.id
RETURNING *;
```

---

### 场景 2: 字段长度溢出

**实现**:

```javascript
// 前端验证
const FIELD_LIMITS = {
  title: { min: 1, max: 255 },
  description: { min: 0, max: 10000 },
  url: { min: 1, max: 2048 },
  tagName: { min: 1, max: 50 },
  categoryName: { min: 1, max: 100 }
};

function validateField(fieldName, value) {
  const limit = FIELD_LIMITS[fieldName];
  
  if (!limit) return true;
  
  if (value.length < limit.min) {
    return `至少 ${limit.min} 个字符`;
  }
  
  if (value.length > limit.max) {
    return `最多 ${limit.max} 个字符，当前 ${value.length}`;
  }
  
  return true;
}

// 后端强制约束
CREATE TABLE articles (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description VARCHAR(10000),
  url VARCHAR(2048) NOT NULL,
  ...
);

CREATE TABLE tags (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  ...
);
```

---

### 场景 3: NULL 值处理

**规则定义**:

| 字段 | 允许 NULL | 默认值 | 处理 |
|------|---------|--------|------|
| title | ❌ | - | 必填，前端+后端验证 |
| description | ✅ | NULL | 可为空字符串转 NULL |
| category_id | ✅ | NULL | 未分类时为 NULL |
| tags | ✅ | [] | 空数组转 NULL |
| is_favorited | ❌ | false | 始终有值 |
| read_status | ❌ | 'unread' | 始终有值 |

**实现**:

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,        -- 必填
  description TEXT,                    -- 可为 NULL
  url VARCHAR(2048) NOT NULL,          -- 必填
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,  -- 可为 NULL
  resource_type_id UUID NOT NULL,      -- 必填
  is_favorited BOOLEAN NOT NULL DEFAULT false,  -- 不为 NULL
  read_status VARCHAR(20) NOT NULL DEFAULT 'unread',  -- 不为 NULL
  tags UUID[] DEFAULT '{}',            -- 默认空数组而非 NULL
  user_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 总结：边界情况清单

### ✅ 开发前检查清单

- [ ] 分类删除策略已定义（级联/转移/禁止）
- [ ] 循环引用检测已实现（前端+后端）
- [ ] 资源上限已设定并验证
- [ ] 撤销过期时间已定义（5 分钟）
- [ ] 批量操作分页逻辑已 implemented
- [ ] 部分失败场景的回滚已处理
- [ ] NULL 值处理规则已明确
- [ ] 字段长度约束已定义

### ✅ 测试用例

- [ ] 删除非叶子分类
- [ ] 试图创建循环引用分类
- [ ] 资源数接近 10,000
- [ ] 撤销 6 分钟前的操作
- [ ] 批量删除中部分权限错误
- [ ] 批量更新超时中断
- [ ] 创建重复标签
- [ ] 字段值超长

