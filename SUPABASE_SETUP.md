# 🌸 Supabase 数据库配置指南

本指南将帮助你快速配置 Supabase PostgreSQL 数据库。

## 📋 目录
1. [创建 Supabase 项目](#创建-supabase-项目)
2. [初始化数据库](#初始化数据库)
3. [获取 API 密钥](#获取-api-密钥)
4. [配置环境变量](#配置环境变量)
5. [验证连接](#验证连接)

---

## 创建 Supabase 项目

### 步骤 1：访问 Supabase

1. 打开 [Supabase 官网](https://supabase.com)
2. 点击「Sign In」或「Start Your Project」
3. 如果没有账户，使用 GitHub/Google 快速注册

### 步骤 2：创建新项目

1. 进入 Dashboard
2. 点击「New Project」
3. 填写项目信息：
   - **Project Name**: 例如 `knowledge-base`
   - **Database Password**: 设置强密码（如：`MySecure@Pass123`）
   - **Region**: 选择离你最近的地区（如：`Singapore`）
4. 点击「Create new project」
5. 等待 2-3 分钟项目初始化完成

---

## 初始化数据库

### 步骤 1：进入 SQL Editor

1. 项目初始化完成后，点击左侧 **SQL Editor**
2. 确保你在正确的数据库和 public schema 下

### 步骤 2：执行初始化脚本

1. 点击「New Query」（或 ⌘+Shift+P）
2. 打开 [server/sql/init.sql](./sql/init.sql)
3. 将 SQL 代码复制到编辑器
4. 点击 **Run** 或 Ctrl+Enter 执行

### 步骤 3：验证表创建

执行查询验证：
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

你应该看到三个表：
- `articles` - 知识条目
- `categories` - 分类
- `resource_types` - 资源类型

---

## 获取 API 密钥

### 步骤 1：进入 Project Settings

1. 点击左下角 **Settings** ⚙️
2. 选择 **API**

### 步骤 2：复制必要信息

找到以下信息：

**Project URL**（Supabase URL）
- 看起来像：`https://xxxxxxxxxxxx.supabase.co`
- 复制这个链接

**API Keys**
- 找到 **anon public** 的 **KEY** 字段，复制它
- 找到 **service_role secret** 的 **KEY** 字段，复制它（用于服务端）

你需要的三个值：
```
SUPABASE_URL = https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6I... (anon public key)
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6I... (service_role)
```

---

## 配置环境变量

### 步骤 1：创建 `.env.local` 文件

在 `server/` 目录下：

```bash
cp .env.example server/.env.local
```

### 步骤 2：编辑环境变量

打开 `server/.env.local`，填入刚才复制的信息：

```env
# Supabase 配置
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6I...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6I...

# 服务器配置
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 步骤 3：前端配置

编辑 `client/js/config.js`，确保 API 地址正确：

```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost:3001/api',
    // ... 其他配置
};
```

---

## 验证连接

### 步骤 1：安装后端依赖

```bash
cd server
npm install
```

### 步骤 2：启动后端服务

```bash
npm run dev
```

你应该看到：
```
✅ 数据库连接成功！
✅ 服务器启动成功！
🌐 地址: http://localhost:3001
📚 API: http://localhost:3001/api
💚 健康检查: http://localhost:3001/health
```

### 步骤 3：测试 API

打开浏览器访问：
```
http://localhost:3001/health
```

应该返回：
```json
{
  "status": "ok",
  "message": "服务器运行中 🚀"
}
```

尝试获取分类：
```
http://localhost:3001/api/categories
```

应该返回分类列表。

---

## 常见问题

### Q: 密钥有什么区别？

**anon public key（SUPABASE_KEY）**
- 用于前端和客户端
- 权限受限（RLS 控制）
- 安全暴露

**service_role key（SUPABASE_SERVICE_ROLE_KEY）**
- 用于后端服务器
- 绕过 RLS 限制
- 不要暴露到前端

### Q: URL 什么样？

Supabase URL 包含项目 ref：
```
https://[PROJECT_REF].supabase.co
```

你的项目 ref 在 Dashboard URL 中也能看到：
```
https://app.supabase.com/project/[PROJECT_REF]/...
```

### Q: 如何重置数据库？

1. 进入 Settings → Database
2. 找到「Danger Zone」
3. 点击「Reset Database」
4. 再次执行 SQL 初始化脚本

### Q: 我在哪里可以看到实时数据？

1. 进入 **Table Editor**
2. 从左侧选择表（articles/categories/resource_types）
3. 可以看到所有数据和实时更新

---

## 下一步

✅ 数据库配置完成后，可以：
1. [启动前后端服务](#启动服务)
2. 打开前端页面开始使用
3. 测试添加、编辑、删除功能

---

*有问题？查看 [Supabase 官方文档](https://supabase.com/docs)*
