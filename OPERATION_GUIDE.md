# 🌸 个人知识库网站 - 操作指南（完整版）

**恭喜！项目已初始化完成！**

本指南将一步步指导你部署和使用这个知识库网站。

---

## 📖 目录

1. [项目状态](#项目状态)
2. [快速开始（5 分钟）](#快速开始5-分钟)
3. [详细配置](#详细配置)
4. [完整操作流程](#完整操作流程)
5. [功能清单](#功能清单)
6. [常见问题](#常见问题)

---

## 项目状态

✅ **已完成的工作：**

| 工作 | 状态 | 文件 |
|------|------|------|
| 项目结构初始化 | ✅ | 完整的前后端目录 |
| 前端基础页面 | ✅ | `client/index.html` |
| 前端样式系统 | ✅ | `client/css/style.css` |
| 前端 JavaScript | ✅ | `client/js/` 下的所有模块 |
| 后端 Express 服务器 | ✅ | `server/src/index.js` |
| API 路由 | ✅ | 知识条目、分类、资源类型 API |
| Supabase 配置脚本 | ✅ | `server/sql/init.sql` |
| 文档完整 | ✅ | PRD、快速开始、测试指南等 |

**下一步需要你完成：**
- 🔧 配置 Supabase 数据库
- 🚀 启动后端服务
- 🌐 启动前端服务
- ✅ 测试功能

---

## 快速开始（5 分钟）

### 前置条件

- Node.js 16+ 已安装
- Supabase 账户（注册：https://supabase.com）

### 三个命令启动

**在项目根目录，打开 3 个终端分别执行：**

**终端 1 - 配置 Supabase（第一次）**
```bash
# 详细步骤见下面的「详细配置」
# 快速版：
# 1. 访问 https://supabase.com，新建项目
# 2. 在 Supabase SQL Editor 中执行 server/sql/init.sql
# 3. 复制项目 URL 和 Anon Key
# 4. 创建 server/.env.local 并填入配置
```

**终端 1 - 启动后端**
```bash
cd server
npm install        # 首次需要
npm run dev
```
✅ 看到 `✅ 服务器启动成功！` 说明成功

**终端 2 - 启动前端**
```bash
cd client
# 选择一个方式启动
python -m http.server 3000
# 或：npx live-server --port=3000
# 或：在 VS Code 中右键 index.html → Open with Live Server
```

**打开浏览器**
```
http://localhost:3000
```

✨ 完成！你现在可以使用知识库了！

---

## 详细配置

### 🔧 第一步：Supabase 配置

详细指南：**[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

快速步骤：
1. 访问 https://supabase.com
2. 注册账户（用 GitHub/Google）
3. 新建项目
4. SQL Editor 中执行 `server/sql/init.sql`
5. Settings → API 中复制 URL 和 Anon Key

### 📝 第二步：创建环境文件

```bash
cd server
cp .env.example .env.local
```

编辑 `server/.env.local`，填入你的 Supabase 信息：

```env
SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6I...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6I...
PORT=3001
NODE_ENV=development
```

### ⚙️ 第三步：安装依赖

```bash
cd server
npm install
```

### ✅ 第四步：验证配置

```bash
# 启动后端
npm run dev

# 新开一个终端，测试 API
curl http://localhost:3001/health
```

看到 `{"status":"ok"}` 说明成功！

---

## 完整操作流程

### 日常工作流程

**每次开发时，在项目根目录打开 2 个终端：**

#### 终端 1 - 后端服务

```bash
cd server
npm run dev
```

输出：
```
✅ 数据库连接成功！
✅ 服务器启动成功！
🌐 地址: http://localhost:3001
📚 API: http://localhost:3001/api
```

#### 终端 2 - 前端服务

```bash
cd client

# 选择一个：
# 方式 A（推荐）
npx live-server --port=3000

# 方式 B
python -m http.server 3000

# 方式 C - VS Code
# 在 index.html 上右键 → Open with Live Server
```

#### 访问应用

打开浏览器：
- **应用地址**：http://localhost:3000
- **API 地址**：http://localhost:3001/api
- **健康检查**：http://localhost:3001/health

---

## 功能清单

### 🎯 核心功能（已实现）

#### 1. 知识条目管理
- ✅ 添加资源（网址、标题、摘要、分类、类型、标签）
- ✅ 编辑资源
- ✅ 删除资源
- ✅ 查看资源详情
- ✅ 多个资源卡片展示

#### 2. 分类系统
- ✅ 创建多级分类（最多 3 级）
- ✅ 编辑分类名称
- ✅ 删除分类（子分类自动上移）
- ✅ 左侧导航显示分类
- ✅ 按分类过滤资源

#### 3. 资源类型管理
- ✅ 创建自定义资源类型
- ✅ 编辑资源类型
- ✅ 删除资源类型
- ✅ 预置 5 种默认类型
- ✅ 按资源类型过滤

#### 4. 学习状态追踪
- ✅ 5 种学习状态（待学习、学习中、已学会、复习中、暂停）
- ✅ 快速切换状态
- ✅ 按状态过滤
- ✅ 状态色彩标识

#### 5. 搜索与过滤
- ✅ 关键词搜索
- ✅ 按分类过滤
- ✅ 按状态过滤
- ✅ 按资源类型过滤
- ✅ 多条件组合过滤

#### 6. 数据持久化
- ✅ 所有数据保存到 Supabase
- ✅ 刷新页面数据不丢失

### 🔄 计划中的功能（P1-P3）

- 📊 学习看板（统计图表、完成进度等）
- 💾 数据导入/导出（JSON、浏览器书签）
- ✅ 拖拽排序
- 📱 响应式设计（部分实现）
- 🎨 动效优化

---

## 常见问题

### 通用问题

**Q: 我是第一次使用，应该从哪开始？**

A: 按照这个顺序：
1. 阅读 [快速开始](#快速开始5-分钟)
2. 按照 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 配置数据库
3. 按照 [详细配置](#详细配置) 配置环境
4. 启动服务
5. 按照 [LOCAL_TESTING.md](./LOCAL_TESTING.md) 测试功能

**Q: 需要安装哪些软件？**

A: 最低需求：
- Node.js 16+
- 浏览器（Chrome/Edge/Firefox/Safari）
- 文本编辑器（VS Code 等）

可选：
- Postman（API 测试）
- Git（版本管理）

**Q: 如何重置所有数据？**

A: 
1. 访问 Supabase Dashboard
2. 进入 Settings → Database
3. 点击「Reset Database」
4. 重新执行 `server/sql/init.sql`

### 技术问题

**Q: API 无法连接**

A: 检查清单：
- [ ] 后端是否在运行（查看终端输出）
- [ ] 后端是否在 3001 端口
- [ ] `client/js/config.js` 中 API_BASE_URL 是否正确
- [ ] 浏览器开发者工具看是否有 CORS 错误
- [ ] Supabase 配置是否正确

**Q: 页面白屏或加载不了**

A: 检查清单：
- [ ] 前端服务是否在运行
- [ ] 浏览器地址是否正确（http://localhost:3000）
- [ ] 打开浏览器开发者工具 (F12)
- [ ] 查看 Console 标签是否有红色错误
- [ ] 查看 Network 标签是否所有文件都加载成功

**Q: 添加资源后没有显示**

A: 检查清单：
- [ ] 浏览器 Console 是否有错误
- [ ] Network 标签中 POST 请求是否返回 200
- [ ] 在 Supabase 数据库表中查看数据是否存在
- [ ] 尝试刷新页面

**Q: 分类/资源类型修改不生效**

A: 
- 检查后端是否收到了请求（后端会打印日志）
- 检查 Supabase 数据库中数据是否真的被修改
- 尝试刷新页面或重启前后端

### 部署问题

**Q: 如何部署到线上？**

A: 参考 [部署指南](./DEPLOYMENT.md)（后续会补充）

基本步骤：
1. 部署后端到 Railway/Heroku/Vercel
2. 部署前端到 Netlify/Vercel/GitHub Pages
3. 配置环境变量
4. 测试线上环境

---

## 文档导航

| 文档 | 说明 |
|------|------|
| [README.md](./README.md) | 项目概述 |
| [PRD.md](./PRD.md) | 完整的产品需求规格 |
| [QUICKSTART.md](./QUICKSTART.md) | 快速启动（5 分钟版） |
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Supabase 详细配置 |
| [LOCAL_TESTING.md](./LOCAL_TESTING.md) | 本地测试与调试 |
| [OPERATION_GUIDE.md](./OPERATION_GUIDE.md) | 本文件 |

---

## 项目结构

```
netlify-site/
├── client/                      # 前端代码
│   ├── index.html              # 主 HTML
│   ├── css/
│   │   └── style.css           # 完整样式系统（CSS 变量 + 响应式）
│   └── js/
│       ├── config.js           # 配置文件
│       ├── api.js              # API 客户端
│       ├── app.js              # 核心应用逻辑
│       ├── category.js         # 分类管理模块
│       ├── resource-type.js    # 资源类型管理模块
│       └── dashboard.js        # 学习看板模块
│
├── server/                      # 后端代码
│   ├── src/
│   │   ├── index.js            # Express 服务器
│   │   ├── config/
│   │   │   └── db.js           # Supabase 配置
│   │   └── routes/
│   │       ├── articles.js     # 知识条目 API
│   │       ├── categories.js   # 分类 API
│   │       └── resource-types.js # 资源类型 API
│   │
│   ├── sql/
│   │   └── init.sql            # 数据库初始化脚本
│   │
│   ├── package.json            # npm 依赖
│   ├── .env.example           # 环境变量示例
│   └── .env.local             # 本地环境变量（需创建）
│
├── PRD.md                      # 产品需求规格说明
├── README.md                   # 项目说明
├── QUICKSTART.md               # 快速开始
├── SUPABASE_SETUP.md          # Supabase 配置
├── LOCAL_TESTING.md            # 本地测试
└── OPERATION_GUIDE.md         # 本指南
```

---

## 下一步

### 🎯 推荐流程

1. ✅ **现在**：按照本指南启动应用
2. 📋 **测试**：按照 [LOCAL_TESTING.md](./LOCAL_TESTING.md) 完整测试
3. 🎨 **开发**：参考 [PRD.md](./PRD.md) 添加更多功能
4. 📦 **部署**：将应用部署到线上
5. 🚀 **上线**：与朋友分享你的知识库！

### 🛠️ 可能的改进

- [ ] 完成学习看板（Dashboard）功能
- [ ] 添加数据导入/导出功能
- [ ] 实现拖拽排序
- [ ] 添加用户认证系统
- [ ] 优化蛙响式设计
- [ ] 添加更多动效
- [ ] 性能优化
- [ ] 部署到线上

---

## 获取帮助

- 📖 查看项目文档
- 🔍 检查浏览器开发者工具
- 💬 查看 Supabase 官方文档
- 🐛 提交 Issue（如果使用 Git）

---

## 快乐学习！ 🌸

你现在拥有一个完整的个人知识库系统。
开始收集、管理和复习你的学习资源吧！

*✨ 愿你的每一次学习，都被温柔记录。*

---

**最后更新**：2025-02-26
**项目版本**：v0.1（MVP - 最小可行产品）
