# 🚀 开发启动指南

**最后更新**: 2026-02-26 | **PRD 版本**: v1.2

---

## 📋 快速启动清单

- [ ] Supabase 项目配置完毕
- [ ] 环境变量已配置 (.env.local)
- [ ] 数据库已初始化 (执行 init.sql)
- [ ] 后端依赖已安装 (npm install)
- [ ] 后端开发服务已启动 (npm run dev)
- [ ] 前端本地服务已启动 (Live Server)

---

## 1️⃣ Supabase 环境配置

### 步骤 1: 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: knowledge-base-local
   - **Database Password**: 记住这个密码
   - **Region**: 选择离你最近的地区
4. 等待项目初始化完成（约 2-3 分钟）

### 步骤 2: 获取 API Keys

进入项目 → Settings → API

复制以下信息：
- **Project URL** → `SUPABASE_URL`
- **anon public key** → `SUPABASE_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 步骤 3: 初始化数据库

1. 进入 Supabase Dashboard
2. 点击 "SQL Editor" → "New query"
3. 打开本地文件: `server/sql/init.sql`
4. 复制全部内容到 SQL 编辑器
5. 点击 "Run" 执行

✅ **完成** - 所有表、索引、RLS 策略已创建

---

## 2️⃣ 环境变量配置

### 后端环境配置 (server/.env.local)

```dotenv
# Supabase 配置
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 服务器配置
PORT=3001
NODE_ENV=development

# 可选：用于单用户模式（开发调试）
DEBUG_USER_ID=00000000-0000-0000-0000-000000000000
```

### 前端环境配置 (client/.env.local，如需要)

如前端需要独立配置 API 端点：

```dotenv
VITE_API_URL=http://localhost:3001
VITE_ENVIRONMENT=development
```

---

## 3️⃣ 本地开发启动

### 方案 A: 分开启动（推荐开发)

**终端 1 - 启动后端服务**:

```bash
cd server
npm install                    # 如果尚未安装依赖
npm run dev                    # 启动 nodemon 开发服务器
```

预期输出:
```
[nodemon] 3.0.1
[nodemon] to restart at any time, type `rs`
[nodemon] watching path(s): src/**/*
Server running on http://localhost:3001
```

**终端 2 - 启动前端服务**:

```bash
cd client
# 使用 Live Server (VS Code 扩展) 或
npx http-server -p 3000 -o
```

前端访问地址: `http://localhost:3000`

---

### 方案 B: 一键启动脚本（可选）

创建 `start-dev.sh`（Mac/Linux) 或 `start-dev.ps1`（Windows PowerShell):

**start-dev.ps1**:
```powershell
# 同时启动后端和前端
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-NoExit", "cd server ; npm run dev"
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "cd client ; npx http-server -p 3000 -o"

Write-Host "🚀 Development servers started!"
Write-Host "Backend: http://localhost:3001"
Write-Host "Frontend: http://localhost:3000"
```

运行: `.\start-dev.ps1`

---

## 4️⃣ 验证开发环境

### 检查后端 API

打开浏览器，访问：

```
http://localhost:3001/api/init
```

预期响应 (成功):
```json
{
  "success": true,
  "code": 200,
  "data": {
    "articles": [],
    "categories": [
      { "id": "uuid1", "name": "编程技术", "icon": "💻" },
      ...
    ],
    "resourceTypes": [
      { "id": "uuid2", "name": "文章", "icon": "📄" },
      ...
    ],
    "tags": []
  }
}
```

### 检查前端加载

访问 `http://localhost:3000`

预期：
- ✅ 页面正常加载（HTML + CSS）
- ✅ 控制台无红色错误
- ✅ 能看到分类列表和资源卡片

---

## 5️⃣ 常见问题排查

### ❌ 后端无法连接 Supabase

**症状**: 
```
Error: Failed to authenticate request
SUPABASE_KEY or SUPABASE_URL not found
```

**解决方案**:
1. 检查 `.env.local` 中的 `SUPABASE_URL` 和 `SUPABASE_KEY`
2. 确保没有多余的空格或换行符
3. 确认 Supabase 项目处于活跃状态
4. 重启后端服务

### ❌ 跨域 (CORS) 错误

**症状**:
```
Access to XMLHttpRequest blocked by CORS policy
```

**解决方案**:
- 后端已配置 CORS (见 `src/index.js`)
- 检查前端请求的 URL 是否正确
- 检查后端服务是否真的在运行

### ❌ 数据库表不存在

**症状**:
```
"relation \"articles\" does not exist"
```

**解决方案**:
1. 重新执行 `server/sql/init.sql`
2. 检查 Supabase SQL Editor 是否有错误提示
3. 确保使用的是正确的数据库连接

### ❌ 单用户模式调试

对于开发调试，可以临时使用固定 `user_id`：

```javascript
// server/src/config/db.js
const debugUserId = process.env.DEBUG_USER_ID || '00000000-0000-0000-0000-000000000000';
```

然后在路由中使用：

```javascript
const userId = req.headers['x-debug-user-id'] || debugUserId;
```

前端请求时添加 header:

```javascript
headers: {
  'x-debug-user-id': '00000000-0000-0000-0000-000000000000'
}
```

---

## 6️⃣ 开发工作流

### 后端开发流程

```bash
# 1. 修改代码 (src/routes/* 或 src/config/*)
# 2. 保存文件 → nodemon 自动重启

# 3. 测试 API (使用 curl 或 Postman)
curl -H "x-debug-user-id: 00000000-0000-0000-0000-000000000000" \
  http://localhost:3001/api/articles

# 4. 查看日志 (终端输出)
# 5. 迭代开发
```

### 前端开发流程

```bash
# 1. 修改代码 (client/js/* 或 client/css/*)
# 2. 保存文件 → 浏览器自动刷新 (Live Server)

# 3. 在浏览器控制台调试 (F12)
# 4. 验证 API 调用 (Network 标签)
# 5. 迭代开发
```

---

## 7️⃣ 数据库操作常用 SQL

### 重置所有数据（开发清理）

```sql
-- 清空所有数据表（保留表结构）
DELETE FROM article_tags;
DELETE FROM operation_history;
DELETE FROM articles;
DELETE FROM tags;
DELETE FROM categories;
DELETE FROM resource_types;

-- 重新插入默认数据
INSERT INTO resource_types (user_id, name, icon, "order") VALUES
  ('00000000-0000-0000-0000-000000000000', '文章', '📄', 1),
  ('00000000-0000-0000-0000-000000000000', '视频', '🎬', 2);
```

### 查看单用户的所有数据

```sql
SELECT 
  (SELECT COUNT(*) FROM articles WHERE user_id = '00000000-0000-0000-0000-000000000000') as article_count,
  (SELECT COUNT(*) FROM categories WHERE user_id = '00000000-0000-0000-0000-000000000000') as category_count,
  (SELECT COUNT(*) FROM tags WHERE user_id = '00000000-0000-0000-0000-000000000000') as tag_count;
```

---

## 8️⃣ 开发必读文档

| 文档 | 用途 |
|------|------|
| [PRD.md](../PRD.md) | 完整产品需求和技术架构 |
| [docs/API_REFERENCE.md](../docs/API_REFERENCE.md) | API 端点详细规范 |
| [docs/VALIDATION_SPEC.md](../docs/VALIDATION_SPEC.md) | 前后端验证规范 |
| [docs/CONCURRENCY_AND_CONSISTENCY.md](../docs/CONCURRENCY_AND_CONSISTENCY.md) | 并发处理指南 |
| [docs/BOUNDARY_CASES.md](../docs/BOUNDARY_CASES.md) | 边界情况处理 |

---

## ✅ 启动检验

运行以下命令验证完整开发环境：

```bash
# 1. 检查 Node.js 版本
node --version        # 应该 >= 16.0.0

# 2. 检查依赖安装
cd server
npm list              # 应该看到所有依赖

# 3. 启动后端
npm run dev

# 4. 在另一个终端测试 API
curl http://localhost:3001/api/init

# 5. 检查前端
open http://localhost:3000  (Mac) 或
start http://localhost:3000 (Windows) 或
xdg-open http://localhost:3000 (Linux)
```

---

## 🎯 下一步

1. ✅ 确保环境变量和数据库均已配置
2. 📖 阅读各功能模块的 API 规范 (docs/API_REFERENCE.md)
3. 💻 开始编写第一个 API 端点 (建议先完成 GET /api/articles)
4. 🎨 并行开发前端 UI (在 client/js/app.js 中)
5. 🔗 集成前后端，进行端到端测试

---

*祝开发顺利！如有问题，参考对应文档或打开 Issue。*

