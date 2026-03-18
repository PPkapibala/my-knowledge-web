# 🎯 开发实现清单

**版本**: v1.2 | **更新**: 2026-02-26

---

## 📊 当前项目状态

| 模块 | 状态 | 进度 |
|------|------|------|
| **📋 文档体系** | ✅ 完成 | 100% |
| ├─ PRD 主文档 | ✅ v1.2 完成 | 1657 行 |
| ├─ API 参考文档 | ✅ 27 端点已定义 | 完整规范 |
| ├─ 数据库初始化脚本 | ✅ 已创建 | init.sql |
| ├─ 并发处理指南 | ✅ 已创建 | 8+ 场景 |
| ├─ 边界情况手册 | ✅ 已创建 | 15+ 场景 |
| ├─ 验证规范 | ✅ 已创建 | 三层验证 |
| └─ 开发启动指南 | ✅ 已创建 | 本文件 |
| **🔧 后端框架** | ⏳ 部分完成 | 60% |
| ├─ Express 基础服务 | ✅ 已建立 | index.js |
| ├─ CORS & 中间件 | ✅ 已配置 | - |
| ├─ Supabase 连接 | ⏳ 需配置 | .env 缺失 |
| ├─ GET /api/init 端点 | ⏳ **需实现** | P0 优先级 |
| ├─ Articles 路由 | ⏳ **部分实现** | 需完善 |
| ├─ Categories 路由 | ⏳ **部分实现** | 需完善 |
| ├─ ResourceTypes 路由 | ⏳ **部分实现** | 需完善 |
| └─ 数据库配置 | ⏳ 需实现 | config/db.js |
| **🎨 前端框架** | ⏳ 部分完成 | 50% |
| ├─ HTML 结构 | ✅ 已建立 | index.html |
| ├─ CSS 样式 | ⏳ 基础完成 | 需美化 |
| ├─ API 客户端 | ⏳ 部分实现 | api.js |
| ├─ 应用主逻辑 | ⏳ **框架完成** | app.js |
| ├─ 分类管理 | ⏳ **需完善** | category.js |
| ├─ 资源类型管理 | ⏳ **需完善** | resource-type.js |
| └─ 看板页面 | ⏳ **需实现** | dashboard.js |
| **🚀 部署准备** | ❌ 未开始 | 0% |
| ├─ Railway 配置 | ❌ 未配置 | - |
| ├─ GitHub Pages 配置 | ❌ 未配置 | - |
| └─ 生产环境变量 | ❌ 未配置 | - |

---

## 🚀 P0 - 第一周核心目标（建议 2-3 天完成）

### 1️⃣ 环境配置 (2 小时)

```bash
# ✅ 已完成
✓ package.json 配置
✓ 文件夹结构
✓ SQL 初始化脚本

# ⏳ 需完成
□ server/.env.local 配置（需 Supabase 凭证）
□ 执行 init.sql 初始化数据库
□ npm install 安装依赖
□ 本地验证数据库连接
```

**下一步**: 进入 Supabase.com，创建项目获取凭证

### 2️⃣ 后端实现 (3-4 小时)

#### 核心端点实现顺序:

**2.1 GET /api/init** (必须先做)

```javascript
// server/src/routes/articles.js
// 新增路由处理
router.get('/init', async (req, res) => {
  // 1. 从 supabase 获取 articles
  // 2. 从 supabase 获取 categories
  // 3. 从 supabase 获取 resource_types
  // 4. 从 supabase 获取 tags
  // 返回统一格式 (见 API_REFERENCE.md 第 124 行)
});
```

参考: [docs/API_REFERENCE.md](docs/API_REFERENCE.md#初始化获取所有数据) 第 1 节

**2.2 完善 GET /api/articles** (2 小时)

当前状态: ⏳ 已有基础框架，需要:
- [ ] 添加分页支持
- [ ] 添加排序参数 (sort_by, sort_order)
- [ ] 完善过滤逻辑
- [ ] 统一响应格式

**2.3 实现 POST /api/articles** (1 小时)

当前状态: ⏳ 已有基础框架，需要:
- [ ] 添加字段验证
- [ ] 处理 user_id (开发用: 00000000-0000-0000-0000-000000000000)
- [ ] 返回完整数据对象

**2.4 完善 Categories & ResourceTypes 路由** (1.5 小时)

- [ ] 实现所有 5 个 category 端点
- [ ] 实现所有 4 个 resource_type 端点
- [ ] 统一错误处理

### 3️⃣ 前端基础联调 (2 小时)

```javascript
// client/js/app.js
// 在 init() 方法中:
async init() {
  // 1. 调用 GET /api/init 获取数据
  const data = await api.getInit();
  
  // 2. 加载到页面
  this.articles = data.articles;
  this.categories = data.categories;
  
  // 3. 渲染初始 UI
  this.renderArticles();
}
```

**验收标准**:
- ✅ 打开 http://localhost:3000，看到分类列表
- ✅ 网络标签看到数据请求成功 (200)
- ✅ 分类能正常显示

---

## 🗂️ P1 - 第二周核心功能（3-4 天）

### 功能清单

- [ ] **文章 CRUD 完整实现**
  - [ ] 创建文章 (POST，含元数据抓取)
  - [ ] 编辑文章 (PUT，含验证)
  - [ ] 删除文章 (DELETE，含权限检查)
  - [ ] 批量操作 (关键场景见 [边界情况手册](docs/BOUNDARY_CASES.md))

- [ ] **分类树形管理**
  - [ ] 多级分类显示
  - [ ] 分类增删改查
  - [ ] 删除时级联处理 (见 [边界情况手册](docs/BOUNDARY_CASES.md) 第 1 部分)
  - [ ] 循环引用防护

- [ ] **资源类型自定义**
  - [ ] 列表显示
  - [ ] 创建新类型
  - [ ] 编辑图标
  - [ ] 删除与迁移

- [ ] **标签系统**
  - [ ] 自动补全
  - [ ] 标签管理页面
  - [ ] 防重复 (UNIQUE 约束)

---

## 👀 P2 - 第三周体验优化（3 天）

- [ ] 拖拽排序 (见 [并发处理指南](docs/CONCURRENCY_AND_CONSISTENCY.md) 第 3 场景)
- [ ] 虚拟滚动（>1000 项时）
- [ ] 搜索与过滤增强
- [ ] 学习看板 (Dashboard 页面)
- [ ] 撤销功能 (operation_history 表)
- [ ] 状态同步 (多标签页)

---

## 📦 P3 - 第四周完善与部署（2 天）

- [ ] 导入导出功能
- [ ] 响应式设计
- [ ] 性能优化
- [ ] 错误边界处理
- [ ] 部署到 Railway + GitHub Pages

---

## 🔗 关键资源对应表

| 开发场景 | 参考文档 | 位置 |
|---------|---------|------|
| API 端点定义 | API_REFERENCE.md | 完整 27 端点 |
| 前后端验证规则 | VALIDATION_SPEC.md | 三层验证矩阵 |
| 并发处理 | CONCURRENCY_AND_CONSISTENCY.md | 8+ 场景 + 代码 |
| 边界情况 | BOUNDARY_CASES.md | 分类删除、资源限制等 |
| 技术细节 | PRD.md 第 2 部分 | 2.1-2.6 完整架构 |
| 功能交互 | PRD.md 第 3.ⅡA 部分 | UI 流程 + 场景 |

---

## ✅ 快速启动命令

```bash
# 1️⃣ 配置 Supabase 凭证
cp server/.env.example server/.env.local
# 编辑 .env.local，填入你的 Supabase 凭证

# 2️⃣ 初始化数据库
# 进入 Supabase Dashboard → SQL Editor
# 复制并执行 server/sql/init.sql

# 3️⃣ 安装依赖并启动
cd server
npm install
npm run dev

# 4️⃣ 在另一个终端导航到前端
cd client
# 使用 VS Code Live Server 或
npx http-server -p 3000 -o

# 5️⃣ 验证
# 浏览器访问 http://localhost:3001/health（后端）
# 浏览器访问 http://localhost:3000（前端）
```

---

## 🎓 学习路径建议

1. **先读 PRD.md 第 1-2 部分** (15 分钟)
   - 了解产品目标和技术栈
   - 熟悉数据库表结构

2. **读 API_REFERENCE.md** (30 分钟)
   - 了解所有 27 个端点
   - 理解请求/响应格式
   - 看 GET /api/init 例子

3. **边做边查 VALIDATION_SPEC.md** (开发时参考)
   - 实现时检查前后端验证规则
   - 参考错误处理模式

4. **复杂场景查 CONCURRENCY_AND_CONSISTENCY.md** (遇到问题时)
   - 多标签页同步问题
   - 离线操作
   - 拖拽中断

5. **边界情况参考 BOUNDARY_CASES.md** (测试时)
   - 分类删除如何处理
   - 资源限制检查
   - 撤销过期处理

---

## 🐛 常见坑位提示

⚠️ **记住以下关键点**:

1. **单用户模式** - 开发时使用固定 UUID:
   ```javascript
   const DEBUG_USER_ID = '00000000-0000-0000-0000-000000000000';
   // 所有查询都需要 WHERE user_id = $1
   ```

2. **RLS 策略** - Supabase 行级安全:
   ```sql
   -- 所有表都需要启用 RLS 和相关策略
   -- (已在 init.sql 中配置)
   ```

3. **CORS 问题** - 已配置好，但要确保:
   ```javascript
   // server/src/index.js 中
   origin: ['http://localhost:3000', 'http://localhost:5000']
   ```

4. **时间戳处理** - 数据库自动设置:
   ```javascript
   // 不要手动设置 created_at，数据库会处理
   // 但要在触发器中自动更新 updated_at
   ```

5. **错误响应格式必须统一**:
   ```json
   {
     "success": false,
     "code": 400,
     "message": "用户提示信息",
     "errors": [{ "field": "title", "message": "验证信息" }]
   }
   ```

---

## 💬 需要帮助？

- 📚 查看 [DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md) - 环境配置详解
- 🔍 搜索 [API_REFERENCE.md](docs/API_REFERENCE.md) - 特定端点定义
- 🛡️ 参考 [VALIDATION_SPEC.md](docs/VALIDATION_SPEC.md) - 验证规则
- 🔄 查阅 [CONCURRENCY_AND_CONSISTENCY.md](docs/CONCURRENCY_AND_CONSISTENCY.md) - 复杂场景

---

> 💡 **建议**: 先花 30 分钟完整阅读 API_REFERENCE.md，然后立即实现 GET /api/init，最后联调前端。这样可以快速验证整个链路是否通畅。

**祝开发顺利！** 🚀

