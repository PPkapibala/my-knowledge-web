# 🔌 API 完整参考文档

**版本**: v1.2 | **日期**: 2026-02-26

---

## 目录

- [通用规范](#通用规范)
- [资源（Article）接口](#资源article接口)
- [分类（Category）接口](#分类category接口)
- [资源类型（ResourceType）接口](#资源类型resourcetype接口)
- [标签（Tag）接口](#标签tag接口)
- [导入导出接口](#导入导出接口)
- [工具接口](#工具接口)

---

## 通用规范

### 基础配置

**Base URL**: `http://localhost:3001/api` (开发) | `https://api.yourdomain.com/api` (生产)

**通用请求头**：
```
Content-Type: application/json
Accept: application/json
```

### 统一响应格式

#### 成功响应 (2xx)

```json
{
  "success": true,
  "code": 200,
  "data": {
    // 实际业务数据
  },
  "message": "Operation successful",
  "timestamp": "2026-02-26T14:35:00Z"
}
```

#### 失败响应 (4xx/5xx)

```json
{
  "success": false,
  "code": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title length must be 1-200 characters"
    }
  ],
  "request_id": "req-uuid-12345",
  "timestamp": "2026-02-26T14:35:00Z"
}
```

### 错误码定义

| 状态码 | 含义 | 前端处理 |
|--------|------|---------|
| 200 | OK | 成功 |
| 201 | Created | 创建成功 |
| 400 | Bad Request | 显示字段错误 |
| 401 | Unauthorized | 重定向登录 |
| 403 | Forbidden | 显示权限提示 |
| 404 | Not Found | 显示不存在，删除本地数据 |
| 409 | Conflict | 显示冲突详情 |
| 429 | Too Many Requests | 显示限流提示 |
| 500 | Server Error | 通用错误提示，记录 request_id |

### 分页规范

```
GET /api/articles?page=1&limit=20
```

响应包含分页信息：

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 125,
      "pages": 7
    }
  }
}
```

### 排序和过滤规范

```
GET /api/articles?sort_by=created_at&sort_order=desc&category_id=uuid&status=completed

sort_by: created_at | updated_at | order
sort_order: asc | desc
category_id: uuid 或多个 ?category_id=uuid1&category_id=uuid2
resource_type_id: uuid 或多个
status: todo | in_progress | completed | reviewing | paused
tags: tag1,tag2,tag3
search: 关键词
is_favorited: true | false
read_status: read | unread | all
```

---

## 资源（Article）接口

### 1. 初始化获取所有数据

**端点**: `GET /api/init`

**描述**: 应用启动时调用，一次性加载所有必要数据

**请求**: 无参数

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "data": {
    "categories": [
      {
        "id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcf8",
        "name": "前端开发",
        "parent_id": null,
        "icon": "💻",
        "color": "#FF6B6B",
        "order": 1,
        "created_at": "2026-02-20T10:00:00Z",
        "children": [
          {
            "id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcf9",
            "name": "React",
            "parent_id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcf8",
            "icon": "⚛️",
            "color": "#61DAFB",
            "order": 1,
            "children": []
          }
        ]
      }
    ],
    "resourceTypes": [
      {
        "id": "607f1f77-bcf8-4d1a-9c1d-607f1f77bcf8",
        "name": "视频",
        "icon": "🎬",
        "order": 1,
        "created_at": "2026-02-20T10:00:00Z"
      }
    ],
    "articles": [
      {
        "id": "707f1f77-bcf8-4d1a-9c1d-707f1f77bcf8",
        "title": "React Hooks 完全指南",
        "url": "https://example.com/react-hooks",
        "description": "深入理解 React Hooks 的原理和最佳实践",
        "category_id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcf9",
        "category_name": "前端开发 > React",
        "resource_type_id": "607f1f77-bcf8-4d1a-9c1d-607f1f77bcf8",
        "resource_type_name": "视频",
        "tags": ["react", "hooks", "javascript"],
        "is_favorited": false,
        "read_status": "unread",
        "status": "todo",
        "order": 1,
        "created_at": "2026-02-20T10:00:00Z",
        "updated_at": "2026-02-20T10:00:00Z"
      }
    ],
    "tags": [
      {
        "id": "807f1f77-bcf8-4d1a-9c1d-807f1f77bcf8",
        "name": "react",
        "count": 8
      }
    ],
    "stats": {
      "total_articles": 125,
      "total_categories": 8,
      "total_tags": 45,
      "last_updated": "2026-02-26T14:35:00Z"
    }
  }
}
```

---

### 2. 获取资源列表

**端点**: `GET /api/articles`

**描述**: 分页获取资源列表，支持多维度过滤和搜索

**查询参数**:

```
page=1 (默认: 1, 最小: 1)
limit=20 (默认: 20, 最大: 100)
category_id=uuid (可选，多个: ?category_id=uuid1&category_id=uuid2)
resource_type_id=uuid (可选，多个)
tags=react,vue (可选，逗号分隔)
status=todo (可选，单个或多个)
search=关键词 (可选)
sort_by=created_at (可选: created_at | updated_at | order)
sort_order=desc (可选: asc | desc)
is_favorited=true (可选: true | false)
read_status=unread (可选: read | unread | all)
```

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "data": {
    "items": [
      {
        "id": "707f1f77-bcf8-4d1a-9c1d-707f1f77bcf8",
        "title": "React Hooks 完全指南",
        "url": "https://example.com/react-hooks",
        "description": "深入理解 React Hooks 的原理和最佳实践",
        "category_id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcf9",
        "category_name": "前端开发 > React",
        "resource_type_id": "607f1f77-bcf8-4d1a-9c1d-607f1f77bcf8",
        "resource_type_name": "视频",
        "tags": ["react", "hooks", "javascript"],
        "is_favorited": false,
        "read_status": "unread",
        "status": "todo",
        "order": 1,
        "created_at": "2026-02-20T10:00:00Z",
        "updated_at": "2026-02-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 125,
      "pages": 7
    }
  }
}
```

**错误响应 (400)**:

```json
{
  "success": false,
  "code": 400,
  "message": "Invalid parameters",
  "errors": [
    {
      "field": "limit",
      "message": "Limit must be between 1 and 100"
    }
  ]
}
```

---

### 3. 获取单个资源

**端点**: `GET /api/articles/{id}`

**路径参数**:

```
id: uuid (资源 ID)
```

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "data": {
    "id": "707f1f77-bcf8-4d1a-9c1d-707f1f77bcf8",
    "title": "React Hooks 完全指南",
    "url": "https://example.com/react-hooks",
    "description": "深入理解 React Hooks 的原理和最佳实践",
    "category_id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcf9",
    "category_name": "前端开发 > React",
    "resource_type_id": "607f1f77-bcf8-4d1a-9c1d-607f1f77bcf8",
    "resource_type_name": "视频",
    "tags": ["react", "hooks", "javascript"],
    "is_favorited": false,
    "read_status": "unread",
    "status": "todo",
    "order": 1,
    "created_at": "2026-02-20T10:00:00Z",
    "updated_at": "2026-02-20T10:00:00Z"
  }
}
```

**错误响应 (404)**:

```json
{
  "success": false,
  "code": 404,
  "message": "Article not found"
}
```

---

### 4. 创建资源

**端点**: `POST /api/articles`

**请求体**:

```json
{
  "title": "React Hooks 完全指南",
  "url": "https://example.com/react-hooks",
  "description": "深入理解 React Hooks 的原理和最佳实践",
  "category_id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcf9",
  "resource_type_id": "607f1f77-bcf8-4d1a-9c1d-607f1f77bcf8",
  "tags": ["react", "hooks", "javascript"],
  "is_favorited": false
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | ✅ | 1-200 字符 |
| url | string | ✅ | 有效的 URL，http/https 开头 |
| description | string | ❌ | 0-1000 字符 |
| category_id | uuid | ✅ | 必须是存在的分类 ID |
| resource_type_id | uuid | ✅ | 必须是存在的资源类型 ID |
| tags | array | ❌ | 字符串数组，0-20 个，每个 1-50 字符 |
| is_favorited | boolean | ❌ | 默认 false |

**成功响应 (201)**:

```json
{
  "success": true,
  "code": 201,
  "message": "Article created successfully",
  "data": {
    "id": "707f1f77-bcf8-4d1a-9c1d-707f1f77bcf8",
    "title": "React Hooks 完全指南",
    "url": "https://example.com/react-hooks",
    "description": "深入理解 React Hooks 的原理和最佳实践",
    "category_id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcf9",
    "resource_type_id": "607f1f77-bcf8-4d1a-9c1d-607f1f77bcf8",
    "tags": ["react", "hooks", "javascript"],
    "is_favorited": false,
    "read_status": "unread",
    "status": "todo",
    "order": 1,
    "created_at": "2026-02-26T14:35:00Z",
    "updated_at": "2026-02-26T14:35:00Z"
  }
}
```

**错误响应 (400)**:

```json
{
  "success": false,
  "code": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required and must be 1-200 characters"
    },
    {
      "field": "category_id",
      "message": "Category does not exist"
    }
  ]
}
```

---

### 5. 更新资源

**端点**: `PUT /api/articles/{id}`

**路径参数**:

```
id: uuid (资源 ID)
```

**请求体** (所有字段可选):

```json
{
  "title": "更新后的标题",
  "description": "更新后的描述",
  "category_id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcf9",
  "resource_type_id": "607f1f77-bcf8-4d1a-9c1d-607f1f77bcf8",
  "tags": ["updated", "tags"],
  "is_favorited": true,
  "read_status": "read",
  "status": "completed"
}
```

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "message": "Article updated successfully",
  "data": {
    "id": "707f1f77-bcf8-4d1a-9c1d-707f1f77bcf8",
    "title": "更新后的标题",
    "url": "https://example.com/react-hooks",
    "description": "更新后的描述",
    "category_id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcf9",
    "resource_type_id": "607f1f77-bcf8-4d1a-9c1d-607f1f77bcf8",
    "tags": ["updated", "tags"],
    "is_favorited": true,
    "read_status": "read",
    "status": "completed",
    "order": 1,
    "created_at": "2026-02-20T10:00:00Z",
    "updated_at": "2026-02-26T14:35:00Z"
  }
}
```

---

### 6. 批量更新资源

**端点**: `PUT /api/articles/batch-update`

**请求体**:

```json
{
  "ids": ["id1", "id2", "id3"],
  "updates": {
    "status": "completed",
    "is_favorited": true,
    "read_status": "read"
  }
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | array | ✅ | UUID 数组，最多 100 个 |
| updates | object | ✅ | 要更新的字段及值 |

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "message": "3 articles updated successfully",
  "data": {
    "updated_count": 3,
    "failed_count": 0,
    "failed_ids": []
  }
}
```

**错误响应 (400)**:

```json
{
  "success": false,
  "code": 400,
  "message": "Too many articles to update",
  "errors": [
    {
      "field": "ids",
      "message": "Cannot update more than 100 articles at once"
    }
  ]
}
```

---

### 7. 批量更新排序

**端点**: `PUT /api/articles/batch-order`

**请求体**:

```json
{
  "items": [
    {
      "id": "id1",
      "order": 3,
      "category_id": "cat-id1"
    },
    {
      "id": "id2",
      "order": 1,
      "category_id": "cat-id1"
    }
  ]
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| items | array | ✅ | 排序项目数组 |
| items[].id | uuid | ✅ | 资源 ID |
| items[].order | integer | ✅ | 新的排序顺序 |
| items[].category_id | uuid | ✅ | 所属分类（支持跨分类移动） |

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "message": "Article order updated successfully"
}
```

---

### 8. 撤销操作

**端点**: `POST /api/articles/{id}/undo`

**路径参数**:

```
id: uuid (资源 ID)
```

**请求体**: 无

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "message": "Last operation undone",
  "data": {
    "id": "707f1f77-bcf8-4d1a-9c1d-707f1f77bcf8",
    "previous_state": {
      "status": "todo",
      "is_favorited": false
    },
    "current_state": {
      "status": "completed",
      "is_favorited": true
    }
  }
}
```

**错误响应 (404)**:

```json
{
  "success": false,
  "code": 404,
  "message": "No operation to undo (expired after 5 minutes)"
}
```

---

### 9. 删除资源

**端点**: `DELETE /api/articles/{id}`

**路径参数**:

```
id: uuid (资源 ID)
```

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "message": "Article deleted successfully"
}
```

---

## 分类（Category）接口

### 1. 获取分类列表

**端点**: `GET /api/categories`

**查询参数**:

```
include_count=true (可选，返回每个分类的资源数)
```

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "data": [
    {
      "id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcf8",
      "name": "前端开发",
      "parent_id": null,
      "icon": "💻",
      "color": "#FF6B6B",
      "order": 1,
      "article_count": 12,
      "created_at": "2026-02-20T10:00:00Z",
      "children": [
        {
          "id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcf9",
          "name": "React",
          "parent_id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcf8",
          "icon": "⚛️",
          "color": "#61DAFB",
          "order": 1,
          "article_count": 5,
          "children": []
        }
      ]
    }
  ]
}
```

---

### 2. 创建分类

**端点**: `POST /api/categories`

**请求体**:

```json
{
  "name": "移动开发",
  "parent_id": null,
  "icon": "📱",
  "color": "#4ECDC4"
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | ✅ | 1-100 字符，同级不重复 |
| parent_id | uuid | ❌ | 父分类 ID，为 null 时为一级 |
| icon | string | ❌ | emoji 图标 |
| color | string | ❌ | 十六进制颜色值 |

**验证规则**:

- 最多 3 级分类（检查 parent 的 parent 的 parent 是否为 null）
- 不允许循环引用（A 是 B 的父分类，B 不能是 A 的父分类）
- parent_id 必须存在

**成功响应 (201)**:

```json
{
  "success": true,
  "code": 201,
  "message": "Category created successfully",
  "data": {
    "id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcd0",
    "name": "移动开发",
    "parent_id": null,
    "icon": "📱",
    "color": "#4ECDC4",
    "order": 3,
    "created_at": "2026-02-26T14:35:00Z"
  }
}
```

**错误响应 (400)**:

```json
{
  "success": false,
  "code": 400,
  "message": "Category validation failed",
  "errors": [
    {
      "field": "parent_id",
      "message": "Parent category does not exist"
    },
    {
      "field": "name",
      "message": "Circular reference detected"
    }
  ]
}
```

---

### 3. 更新分类

**端点**: `PUT /api/categories/{id}`

**请求体**:

```json
{
  "name": "前端 & 移动开发",
  "parent_id": null,
  "icon": "💻",
  "color": "#FF6B6B"
}
```

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "message": "Category updated successfully",
  "data": {
    "id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcf8",
    "name": "前端 & 移动开发",
    "parent_id": null,
    "icon": "💻",
    "color": "#FF6B6B",
    "order": 1,
    "updated_at": "2026-02-26T14:35:00Z"
  }
}
```

---

### 4. 批量更新分类排序

**端点**: `PUT /api/categories/batch-order`

**请求体**:

```json
{
  "items": [
    {
      "id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcf8",
      "order": 2
    },
    {
      "id": "507f1f77-bcf8-4d1a-9c1d-507f1f77bcd0",
      "order": 1
    }
  ]
}
```

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "message": "Category order updated successfully"
}
```

---

### 5. 删除分类

**端点**: `DELETE /api/categories/{id}`

**查询参数**:

```
reassign_category_id=uuid (可选，子分类重新分配到这个分类)
reassign_articles_category_id=uuid (可选，资源重新分配到这个分类)
```

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "message": "Category deleted and resources reassigned",
  "data": {
    "deleted_count": 1,
    "reassigned_categories_count": 2,
    "reassigned_articles_count": 8
  }
}
```

**错误响应 (409)**:

```json
{
  "success": false,
  "code": 409,
  "message": "Cannot delete category with children and articles",
  "details": {
    "reason": "has_children_and_articles",
    "children_count": 2,
    "articles_count": 8,
    "message": "Please specify reassign_category_id or reassign_articles_category_id"
  }
}
```

---

## 资源类型（ResourceType）接口

### 1. 获取所有资源类型

**端点**: `GET /api/resource-types`

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "data": [
    {
      "id": "607f1f77-bcf8-4d1a-9c1d-607f1f77bcf8",
      "name": "视频",
      "icon": "🎬",
      "order": 1,
      "created_at": "2026-02-20T10:00:00Z"
    },
    {
      "id": "607f1f77-bcf8-4d1a-9c1d-607f1f77bcf9",
      "name": "文章",
      "icon": "📄",
      "order": 2,
      "created_at": "2026-02-20T10:00:00Z"
    }
  ]
}
```

---

### 2. 创建资源类型

**端点**: `POST /api/resource-types`

**请求体**:

```json
{
  "name": "播客",
  "icon": "🎙️"
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | ✅ | 1-30 字符，不重复 |
| icon | string | ✅ | 单个 emoji |

**成功响应 (201)**:

```json
{
  "success": true,
  "code": 201,
  "message": "Resource type created successfully",
  "data": {
    "id": "607f1f77-bcf8-4d1a-9c1d-607f1f77bcd0",
    "name": "播客",
    "icon": "🎙️",
    "order": 6,
    "created_at": "2026-02-26T14:35:00Z"
  }
}
```

---

### 3. 更新资源类型

**端点**: `PUT /api/resource-types/{id}`

**请求体**:

```json
{
  "name": "音频播客",
  "icon": "🎙️"
}
```

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "message": "Resource type updated successfully",
  "data": {
    "id": "607f1f77-bcf8-4d1a-9c1d-607f1f77bcd0",
    "name": "音频播客",
    "icon": "🎙️",
    "order": 6,
    "updated_at": "2026-02-26T14:35:00Z"
  }
}
```

---

### 4. 删除资源类型

**端点**: `DELETE /api/resource-types/{id}`

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "message": "Resource type deleted successfully"
}
```

**错误响应 (409)**:

```json
{
  "success": false,
  "code": 409,
  "message": "Cannot delete the last resource type"
}
```

---

## 标签（Tag）接口

### 1. 获取所有标签

**端点**: `GET /api/tags`

**查询参数**:

```
include_count=true (可选)
sort_by=count (可选: name | count)
```

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "data": [
    {
      "id": "807f1f77-bcf8-4d1a-9c1d-807f1f77bcf8",
      "name": "react",
      "count": 8
    },
    {
      "id": "807f1f77-bcf8-4d1a-9c1d-807f1f77bcf9",
      "name": "javascript",
      "count": 15
    }
  ]
}
```

---

### 2. 删除标签

**端点**: `DELETE /api/tags/{id}`

**查询参数**:

```
reassign_tag_id=uuid (可选)
```

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "message": "Tag deleted successfully",
  "data": {
    "deleted_count": 1,
    "reassigned_articles_count": 5
  }
}
```

---

## 导入导出接口

### 1. 导入 JSON

**端点**: `POST /api/import/json`

**请求体**:

```json
{
  "data": [
    {
      "title": "React 学习指南",
      "url": "https://example.com/react",
      "description": "初级到高级",
      "category": "前端开发/React",
      "resource_type": "文章",
      "tags": ["react", "learning"],
      "is_favorited": true
    }
  ],
  "options": {
    "skip_duplicates": true,
    "create_missing_categories": true,
    "merge_tags": true
  }
}
```

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "message": "Import completed",
  "data": {
    "imported_count": 10,
    "skipped_count": 2,
    "failed_count": 0,
    "errors": []
  }
}
```

---

### 2. 导入浏览器书签

**端点**: `POST /api/import/bookmarks`

**请求类型**: `multipart/form-data`

**字段**:

```
file: (HTML 文件)
options: {
  "create_parent_category": true,
  "parent_category_name": "导入的书签"
}
```

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "message": "Bookmarks imported successfully",
  "data": {
    "imported_count": 18,
    "created_categories": 5,
    "errors": []
  }
}
```

---

### 3. 导出 JSON

**端点**: `GET /api/export/json`

**查询参数**:

```
category_id=uuid (可选)
resource_type_id=uuid (可选)
include_favorites_only=false (可选)
```

**成功响应 (200)**:

```json
[
  {
    "title": "React Hooks 完全指南",
    "url": "https://example.com/react-hooks",
    "description": "深入理解 React Hooks",
    "category": "前端开发 > React",
    "resource_type": "文章",
    "tags": ["react", "hooks"],
    "is_favorited": true,
    "read_status": "read",
    "created_at": "2026-02-26T10:30:00Z"
  }
]
```

---

### 4. 导出 CSV

**端点**: `GET /api/export/csv`

**响应**: 浏览器下载 CSV 文件 `articles.csv`

```
Title,URL,Description,Category,Resource Type,Tags,Favorited,Read Status,Created Date
"React Hooks 完全指南","https://example.com/react-hooks","深入理解 React Hooks","前端开发 > React","文章","react,hooks","Yes","Yes","2026-02-26"
```

---

### 5. 导出 HTML 书签

**端点**: `GET /api/export/html-bookmarks`

**响应**: 浏览器下载 HTML 文件 `bookmarks.html`

```html
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<HTML>
<HEAD><TITLE>书签</TITLE></HEAD>
<BODY>
<DL>
  <DT><H3>前端开发</H3>
  <DL>
    <DT><A HREF="https://example.com/react-hooks">React Hooks 完全指南</A>
    <DD>深入理解 React Hooks | Tags: react,hooks
  </DL>
</DL>
</BODY>
</HTML>
```

---

## 工具接口

### 1. 获取 URL 元数据

**端点**: `POST /api/meta-fetch`

**请求体**:

```json
{
  "url": "https://example.com/article"
}
```

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "data": {
    "title": "React Hooks 完全指南",
    "description": "深入理解 React Hooks 的原理和最佳实践",
    "icon": "https://example.com/favicon.ico"
  }
}
```

**错误响应 (失败但不中断)**:

```json
{
  "success": false,
  "code": 500,
  "message": "Failed to fetch metadata",
  "data": {
    "title": "example.com",
    "description": null,
    "icon": null
  }
}
```

---

### 2. 搜索资源

**端点**: `GET /api/search`

**查询参数**:

```
q=关键词 (必填)
limit=20 (可选)
```

**成功响应 (200)**:

```json
{
  "success": true,
  "code": 200,
  "data": [
    {
      "id": "707f1f77-bcf8-4d1a-9c1d-707f1f77bcf8",
      "title": "React Hooks 完全指南",
      "description": "深入理解 React Hooks 的<mark>原理</mark>和最佳实践",
      "score": 150,
      "matched_fields": ["title", "description"]
    }
  ]
}
```

---

## 总结

| 资源 | 接口数 | 统计 |
|------|--------|------|
| Articles | 9 | 初始化、列表、详情、创建、更新、批量更新、排序、撤销、删除 |
| Categories | 5 | 列表、创建、更新、排序、删除 |
| ResourceTypes | 4 | 列表、创建、更新、删除 |
| Tags | 2 | 列表、删除 |
| Import/Export | 5 | JSON 导入、书签导入、JSON 导出、CSV 导出、HTML 导出 |
| Tools | 2 | 元数据抓取、搜索 |
| **总计** | **27 个端点** | |

