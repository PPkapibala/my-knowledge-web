# ✔️ 验证分布与错误处理规范

**版本**: v1.2 | **日期**: 2026-02-26

---

## 目录

- [验证分层架构](#验证分层架构)
- [前端验证规范](#前端验证规范)
- [后端验证规范](#后端验证规范)
- [错误消息设计](#错误消息设计)
- [国际化与本地化](#国际化与本地化)

---

## 验证分层架构

### 三层验证模型

```
┌─────────────────────────────────────────┐
│ 层 1: 前端验证（UX 优化）             │
│ - 实时反馈 (< 100ms)                  │
│ - 防止无效提交                         │
│ - 不考虑业务规则                       │
├─────────────────────────────────────────┤
│ 层 2: 后端验证（安全关键）            │
│ - 业务规则检查                         │
│ - 权限验证                             │
│ - 数据一致性检查                       │
├─────────────────────────────────────────┤
│ 层 3: 数据库约束（最后防线）          │
│ - NOT NULL / UNIQUE / FOREIGN KEY       │
│ - CHECK 约束                            │
│ - 触发器                               │
└─────────────────────────────────────────┘
```

### 验证分工矩阵

| 字段/规则 | 前端 | 后端 | 数据库 | 说明 |
|----------|------|------|--------|------|
| 非空验证 | ✅ | ✅ | ✅ | 三层都要，防止意外 |
| 长度限制 | ✅ | ✅ | ❌ | 前端限制输入，后端验证长度 |
| 格式验证 | ✅ | ✅ | ❌ | URL/Email 需双验证 |
| 唯一性检查 | ⚠️ | ✅ | ✅ | 前端提示（可能失效），后端+DB 务必验证 |
| 权限检查 | ❌ | ✅ | ❌ | 仅后端，前端不涉及安全规则 |
| 业务规则 | ❌ | ✅ | ❌ | 仅后端（如分类深度限制） |
| 关系约束 | ❌ | ✅ | ✅ | 后端检查外键有效性 |
| 值范围 | ✅ | ✅ | ❌ | 前端 selectbox/slider，后端验证 |

---

## 前端验证规范

### 1. 文章创建表单

**字段**: `title`, `url`, `description`, `category_id`, `resource_type_id`, `tags`

```javascript
const ARTICLE_RULES = {
  title: {
    required: true,
    minLength: 1,
    maxLength: 255,
    pattern: /^[\s\S]*\S[\s\S]*$/,  // 不允许只有空格
    message: '标题必填，1-255 个字符'
  },
  
  url: {
    required: true,
    pattern: /^https?:\/\/.+\..+/,
    maxLength: 2048,
    message: '请输入有效的 HTTP/HTTPS 链接'
  },
  
  description: {
    required: false,  // 可选字段
    maxLength: 10000,
    message: '描述不超过 10,000 个字符'
  },
  
  category_id: {
    required: false,  // 默认未分类
    validate: (value) => {
      if (value && !getCategoryById(value)) {
        return '选择的分类不存在';
      }
      return true;
    }
  },
  
  resource_type_id: {
    required: true,
    validate: (value) => {
      if (!getResourceTypeById(value)) {
        return '资源类型不存在';
      }
      return true;
    }
  },
  
  tags: {
    required: false,
    maxItems: 50,
    message: '最多 50 个标签',
    validate: (value) => {
      const hasDuplicate = new Set(value).size !== value.length;
      return hasDuplicate ? '不允许重复标签' : true;
    }
  }
};

// 实时验证（表单输入时）
function handleFieldChange(fieldName, value) {
  const rule = ARTICLE_RULES[fieldName];
  if (!rule) return;
  
  const error = validateField(fieldName, value, rule);
  
  if (error === true) {
    // 验证通过
    clearFieldError(fieldName);
  } else {
    // 显示错误
    showFieldError(fieldName, error);
  }
}

// 表单提交前的完整验证
function validateArticleForm(formData) {
  const errors = {};
  
  for (const [fieldName, rule] of Object.entries(ARTICLE_RULES)) {
    const value = formData[fieldName];
    const error = validateField(fieldName, value, rule);
    
    if (error !== true) {
      errors[fieldName] = error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// 通用验证函数
function validateField(fieldName, value, rule) {
  // 1. 检查必填
  if (rule.required && !value) {
    return `${rule.message || fieldName} 必填`;
  }
  
  // 2. 检查长度
  if (rule.minLength && value.length < rule.minLength) {
    return `最少 ${rule.minLength} 个字符`;
  }
  
  if (rule.maxLength && value.length > rule.maxLength) {
    return `最多 ${rule.maxLength} 个字符，当前 ${value.length}`;
  }
  
  // 3. 检查格式
  if (rule.pattern && !rule.pattern.test(value)) {
    return rule.message || '格式不正确';
  }
  
  // 4. 自定义验证
  if (rule.validate) {
    const result = rule.validate(value);
    if (result !== true) {
      return result;
    }
  }
  
  return true;
}

// UI 反馈
function showFieldError(fieldName, message) {
  const input = document.querySelector(`[name="${fieldName}"]`);
  const errorEl = document.querySelector(`[data-error-for="${fieldName}"]`);
  
  input.classList.add('error');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

function clearFieldError(fieldName) {
  const input = document.querySelector(`[name="${fieldName}"]`);
  const errorEl = document.querySelector(`[data-error-for="${fieldName}"]`);
  
  input.classList.remove('error');
  errorEl.textContent = '';
  errorEl.style.display = 'none';
}
```

---

### 2. 分类创建表单

```javascript
const CATEGORY_RULES = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
    message: '分类名 1-100 个字符'
  },
  
  parent_id: {
    required: false,
    validate: (value) => {
      if (value) {
        // 检查父分类是否存在
        if (!getCategoryById(value)) {
          return '选择的父分类不存在';
        }
        
        // 检查深度限制
        if (calculateCategoryDepth(value) >= 3) {
          return '最多只能有 3 级分类';
        }
      }
      return true;
    }
  },
  
  icon: {
    required: false,
    maxLength: 50,  // emoji 字符数限制
    message: '图标过长'
  },
  
  color: {
    required: false,
    pattern: /^#[0-9A-Fa-f]{6}$/,
    message: '请输入有效的十六进制颜色值'
  }
};
```

---

## 后端验证规范

### 1. 数据层验证（Node.js + Express）

```javascript
// middleware/validators.js

function validateCreateArticle(req, res, next) {
  const errors = [];
  const { title, url, description, category_id, resource_type_id, tags } = req.body;
  
  // 1. 非空检查
  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (title.length > 255) {
    errors.push({ field: 'title', message: 'Title exceeds 255 characters' });
  }
  
  if (!url || typeof url !== 'string') {
    errors.push({ field: 'url', message: 'URL is required' });
  } else if (!isValidUrl(url)) {
    errors.push({ field: 'url', message: 'Invalid URL format' });
  } else if (url.length > 2048) {
    errors.push({ field: 'url', message: 'URL exceeds 2048 characters' });
  }
  
  if (description && description.length > 10000) {
    errors.push({ field: 'description', message: 'Description exceeds 10000 characters' });
  }
  
  // 2. 关系验证
  if (!resource_type_id) {
    errors.push({ field: 'resource_type_id', message: 'Resource type is required' });
  } else if (!validateResourceTypeExists(resource_type_id, req.user.id)) {
    errors.push({ field: 'resource_type_id', message: 'Resource type does not exist' });
  }
  
  if (category_id && !validateCategoryExists(category_id, req.user.id)) {
    errors.push({ field: 'category_id', message: 'Category does not exist' });
  }
  
  // 3. 标签验证
  if (Array.isArray(tags)) {
    if (tags.length > 50) {
      errors.push({ field: 'tags', message: 'Too many tags (max 50)' });
    }
    
    const hasDuplicate = new Set(tags).size !== tags.length;
    if (hasDuplicate) {
      errors.push({ field: 'tags', message: 'Duplicate tags' });
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      data: { errors },
      message: 'Validation failed'
    });
  }
  
  next();
}

// 辅助验证函数
function isValidUrl(url) {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

function validateResourceTypeExists(id, userId) {
  // 检查资源类型是否存在且属于当前用户
  const sql = 'SELECT id FROM resource_types WHERE id = $1 AND user_id = $2';
  return db.query(sql, [id, userId]).then(result => result.rows.length > 0);
}

function validateCategoryExists(id, userId) {
  const sql = 'SELECT id FROM categories WHERE id = $1 AND user_id = $2';
  return db.query(sql, [id, userId]).then(result => result.rows.length > 0);
}

// 使用中间件
app.post('/api/articles', validateCreateArticle, createArticleHandler);
```

### 2. 业务逻辑验证

```javascript
// services/articleService.js

async function createArticle(userId, data) {
  const errors = [];
  
  // 1. 权限检查
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  // 2. 资源限制检查
  const articleCount = await getArticleCountForUser(userId);
  if (articleCount >= 10000) {
    throw new ValidationError(
      'RESOURCE_LIMIT_EXCEEDED',
      'Article limit reached (max 10000)'
    );
  }
  
  // 3. 业务规则验证
  if (data.category_id) {
    const depth = await calculateCategoryDepth(data.category_id);
    if (depth > 3) {
      throw new ValidationError(
        'INVALID_CATEGORY',
        'Category depth exceeds maximum'
      );
    }
  }
  
  // 4. 重复检查（URL 唯一性）
  const exists = await articleExists(userId, data.url);
  if (exists) {
    throw new ValidationError(
      'DUPLICATE_ARTICLE',
      'This URL already exists'
    );
  }
  
  // 5. 外部数据验证
  const metadata = await fetchMetadata(data.url);
  if (!metadata) {
    throw new ValidationError(
      'INVALID_URL',
      'Unable to fetch URL metadata'
    );
  }
  
  // 6. 保存
  return saveArticle(userId, {
    ...data,
    title: data.title || metadata.title,
    description: data.description || metadata.description
  });
}

// 自定义错误类
class ValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.statusCode = 400;
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.code = 'UNAUTHORIZED';
    this.statusCode = 401;
  }
}
```

### 3. 数据库约束验证

```sql
-- 1. 非空约束
CREATE TABLE articles (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  user_id UUID NOT NULL,
  resource_type_id UUID NOT NULL REFERENCES resource_types(id),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  ...
);

-- 2. 唯一约束
-- 假设: 同一用户不能有重复的 URL
CREATE UNIQUE INDEX unique_user_url ON articles(user_id, url);

-- 3. 检查约束
ALTER TABLE categories 
ADD CONSTRAINT max_category_depth CHECK (depth <= 3);

ALTER TABLE articles
ADD CONSTRAINT valid_title CHECK (
  title IS NOT NULL 
  AND char_length(title) >= 1 
  AND char_length(title) <= 255
  AND title ~ '^\s*\S.*$'  -- 正则：不能只有空格
);

-- 4. 触发器验证（复杂逻辑）
CREATE FUNCTION validate_article_count() RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM articles WHERE user_id = NEW.user_id) >= 10000 THEN
    RAISE EXCEPTION 'Article limit exceeded';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER article_count_trigger
BEFORE INSERT ON articles
FOR EACH ROW
EXECUTE FUNCTION validate_article_count();

-- 5. 外键约束
ALTER TABLE articles
ADD CONSTRAINT articles_category_fk 
FOREIGN KEY (category_id) 
REFERENCES categories(id) 
ON DELETE SET NULL;
```

---

## 错误消息设计

### 错误响应标准格式

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "用户友好的错误描述",
  "data": {
    "errors": [
      {
        "field": "title",
        "message": "标题必填",
        "code": "FIELD_REQUIRED"
      },
      {
        "field": "url",
        "message": "URL 格式不正确",
        "code": "INVALID_FORMAT"
      }
    ]
  }
}
```

### 错误代码映射表

| 代码 | HTTP | 描述 | 前端处理 |
|------|------|------|--------|
| VALIDATION_ERROR | 400 | 验证失败 | 显示字段级错误 |
| UNAUTHORIZED | 401 | 未授权 | 跳转登录（此应用无登录） |
| FORBIDDEN | 403 | 禁止访问 | 提示权限不足 |
| NOT_FOUND | 404 | 资源不存在 | 提示已删除，需刷新 |
| CONFLICT | 409 | 资源冲突 | 提示被修改，需重新加载 |
| RESOURCE_LIMIT_EXCEEDED | 400 | 资源超限 | 提示需清理 |
| DUPLICATE_ENTRY | 409 | 重复条目 | 提示已存在 |
| CIRCULAR_REFERENCE | 400 | 循环引用 | 提示无法设置为父分类 |
| INVALID_RELATIONSHIP | 400 | 关系无效 | 提示外键不存在 |
| INTERNAL_ERROR | 500 | 服务器错误 | 提示联系管理员+日志 ID |
| TIMEOUT | 504 | 超时 | 建议重试 |

---

### 前端错误处理

```javascript
// errorHandler.js

async function handleApiResponse(response) {
  if (!response.ok) {
    const errorData = await response.json();
    
    switch (errorData.code) {
      case 'VALIDATION_ERROR':
        // 字段级错误显示
        displayFieldErrors(errorData.data.errors);
        break;
        
      case 'NOT_FOUND':
        showToast('资源已删除，请刷新页面', 'error');
        break;
        
      case 'CONFLICT':
        showToast('资源已被修改，正在重新加载...', 'warning');
        reloadData();
        break;
        
      case 'RESOURCE_LIMIT_EXCEEDED':
        showModal({
          title: '已达资源上限',
          message: `您已有 10,000 篇资源，请删除不需要的项`,
          actions: ['去清理', '取消']
        });
        break;
        
      case 'DUPLICATE_ENTRY':
        showToast(`已存在：${errorData.message}`, 'error');
        break;
        
      case 'INTERNAL_ERROR':
        showToast(
          `服务器错误 [${errorData.data?.errorId}]，请稍后重试`,
          'error'
        );
        logError(errorData);
        break;
        
      default:
        showToast(errorData.message || '未知错误', 'error');
    }
    
    throw new ApiError(errorData);
  }
  
  return response.json();
}

function displayFieldErrors(errors) {
  errors.forEach(error => {
    const input = document.querySelector(`[name="${error.field}"]`);
    if (input) {
      input.classList.add('error');
      const errorEl = input.parentElement.querySelector('.error-message');
      if (errorEl) {
        errorEl.textContent = error.message;
      }
    }
  });
}
```

---

## 国际化与本地化

### i18n 错误消息模板

```javascript
// i18n/errors.json
{
  "zh-CN": {
    "VALIDATION_ERROR": "验证失败",
    "REQUIRED": "{field} 必填",
    "MIN_LENGTH": "最少 {min} 个字符",
    "MAX_LENGTH": "最多 {max} 个字符，当前 {current}",
    "INVALID_FORMAT": "格式不正确",
    "INVALID_URL": "请输入有效的 HTTP/HTTPS 链接",
    "DUPLICATE_ENTRY": "已存在",
    "RESOURCE_LIMIT_EXCEEDED": "已达资源上限，请清理不需要的项",
    "CIRCULAR_REFERENCE": "不能选择其子分类作为父分类",
    "NOT_FOUND": "资源已删除或不存在",
    "CONFLICT": "资源已被他人修改，请重新加载",
    "INTERNAL_ERROR": "服务器错误，请稍后重试"
  },
  "en": {
    "VALIDATION_ERROR": "Validation failed",
    "REQUIRED": "{field} is required",
    "MIN_LENGTH": "Minimum {min} characters",
    "MAX_LENGTH": "Maximum {max} characters, current {current}",
    "INVALID_FORMAT": "Invalid format",
    "INVALID_URL": "Please enter a valid HTTP/HTTPS URL",
    "DUPLICATE_ENTRY": "Already exists",
    "RESOURCE_LIMIT_EXCEEDED": "Resource limit reached, please clean up unnecessary items",
    "CIRCULAR_REFERENCE": "Cannot select a subcategory as the parent",
    "NOT_FOUND": "Resource not found or has been deleted",
    "CONFLICT": "Resource has been modified by others, please reload",
    "INTERNAL_ERROR": "Server error, please try again later"
  }
}

// 使用
function getMessage(code, params = {}) {
  const locale = getUserLocale(); // 获取用户语言
  const template = i18n[locale][code];
  
  if (!template) {
    return i18n['en'][code] || code;
  }
  
  // 替换参数
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] ?? match;
  });
}

// 示例
getMessage('MAX_LENGTH', { max: 255, current: 300 })
// 输出: "最多 255 个字符，当前 300"
```

---

## 总结：验证检查清单

### ✅ 前端验证清单

- [ ] 所有表单字段有 label
- [ ] 实时验证错误显示在字段下方
- [ ] 非空字段在 label 上标记 `*`
- [ ] 长度限制通过 `maxlength` 属性强制
- [ ] URL/Email 使用正则或 input type 验证
- [ ] 唯一性检查提示用户（不强制）
- [ ] 下拉框选项验证有效性
- [ ] 日期选择器限制范围

### ✅ 后端验证清单

- [ ] 所有输入都验证（不信任前端）
- [ ] 验证错误返回 400 + 详细字段错误
- [ ] 权限检查在所有操作前
- [ ] 唯一约束使用 DB UNIQUE 索引
- [ ] 外键引用验证有有效性
- [ ] 资源限制检查（文章、分类、标签）
- [ ] 业务规则检查（分类深度等）
- [ ] 错误日志记录（便于调试）

### ✅ 数据库约束清单

- [ ] NOT NULL 约束应用于必填字段
- [ ] VARCHAR 长度约束匹配应用规范
- [ ] UNIQUE 索引防止重复
- [ ] FOREIGN KEY 约束维持关系完整性
- [ ] CHECK 约束实现业务规则（如深度限制）
- [ ] 默认值正确设置

### ✅ 测试用例

- [ ] 提交空表单
- [ ] 输入过长内容
- [ ] 输入无效 URL
- [ ] 选择不存在的分类
- [ ] 创建重复标签
- [ ] 删除分类同时创建新的
- [ ] 批量操作中部分失败
- [ ] 网络失败后重试

