# 📋 本地开发与测试指南

这份指南将帮助你在本地完整地运行和测试知识库网站。

## 📊 目录

1. [环境检查](#环境检查)
2. [完整启动流程](#完整启动流程)
3. [功能测试清单](#功能测试清单)
4. [API 测试](#api-测试)
5. [浏览器调试](#浏览器调试)
6. [常见问题](#常见问题)

---

## 环境检查

### 前置要求

在开始前，确保你有：

- ✅ Node.js 16+ （检查：`node -v`）
- ✅ npm（检查：`npm -v`）
- ✅ Git（可选，用于版本管理）
- ✅ 现代浏览器（Chrome / Edge / Firefox / Safari）

### 检查命令

```bash
# 检查 Node.js
node --version   # 需要 v16.0.0 或更高

# 检查 npm
npm --version    # 需要 v7.0.0 或更高

# 检查 Git（可选）
git --version
```

---

## 完整启动流程

### 🔧 第一次设置（初始化）

#### 1️⃣ Supabase 数据库设置

**这一步只需做一次！**

1. 按照 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 完整配置
2. 验证数据库连接成功
3. 记下你的 Supabase 凭证

#### 2️⃣ 后端配置

```bash
# 打开项目根目录
cd /path/to/netlify-site

# 进入后端目录
cd server

# 创建环境配置文件
cp .env.example .env.local

# 编辑 .env.local，填入你的 Supabase 信息
# SUPABASE_URL=https://xxxxx.supabase.co
# SUPABASE_KEY=eyJhbGc...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
# PORT=3001
```

#### 3️⃣ 安装依赖

```bash
# 在 server 目录下
npm install

# 验证安装成功
npm list
```

### 🚀 日常启动

#### 终端 1 - 启动后端

```bash
cd server
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

#### 终端 2 - 启动前端

选择一个方式：

**方式 A：Python 内置服务器**
```bash
cd client
python -m http.server 3000
# 打开浏览器访问：http://localhost:3000
```

**方式 B：Node.js Live Server**
```bash
cd client
npx live-server --port=3000
# 自动打开浏览器
```

**方式 C：VS Code Live Server**
1. 安装 VS Code 扩展「Live Server」
2. 在 `client/index.html` 上右键
3. 选择「Open with Live Server」

#### 验证启动

打开浏览器：
- 前端：http://localhost:3000
- 后端健康检查：http://localhost:3001/health
- API 列表：http://localhost:3001/api/categories

---

## 功能测试清单

按照以下步骤测试所有核心功能。

### ✅ 基础界面测试

- [ ] 页面加载，显示「个人知识库」标题
- [ ] 左侧侧边栏显示分类列表
- [ ] 顶部显示搜索框和添加按钮
- [ ] 主区域显示空状态或资源列表
- [ ] 响应式设计：缩放浏览器窗口，布局自适应

### ➕ 添加资源测试

1. **点击「+ 添加资源」按钮**
   - [ ] 弹窗打开
   - [ ] 表单包含所有字段

2. **填写表单**
   ```
   网址：https://example.com
   标题：我的学习资源
   摘要：这是一个测试资源
   资源类型：选择「文章」
   分类：选择「技术」
   标签：学习,测试
   ```

3. **提交表单**
   - [ ] 关闭弹窗
   - [ ] 显示「添加成功」提示
   - [ ] 新资源显示在列表中
   - [ ] 数据库中可查看记录

### 🏷️ 分类管理测试

1. **打开分类管理**
   - [ ] 点击「⚙️ 管理分类」按钮
   - [ ] 分类管理面板打开

2. **添加新分类**
   - [ ] 输入图标和名称，点击「+ 新增」
   - [ ] 新分类立即出现在列表中
   - [ ] 在添加资源表单中可选择新分类

3. **编辑分类**
   - [ ] 双击分类名称进入编辑
   - [ ] 输入新名称并回车
   - [ ] 分类名称更新

4. **删除分类**
   - [ ] 点击「🗑️」按钮
   - [ ] 分类被删除
   - [ ] 对应资源自动关联到父级分类

### 📚 资源类型管理测试

1. **打开资源类型管理**
   - [ ] 在添加资源弹窗中点击「⚙️ 自定义」
   - [ ] 资源类型管理面板打开

2. **添加新类型**
   - [ ] 输入图标和名称，点击「+ 新增」
   - [ ] 新类型立即出现在列表中
   - [ ] 在添加资源表单中可选择新类型

3. **编辑和删除类型**
   - [ ] 编辑功能正常
   - [ ] 删除功能正常

### 🔍 搜索与过滤测试

1. **关键词搜索**
   - [ ] 在搜索框输入关键词
   - [ ] 资源列表实时过滤
   - [ ] 匹配标题、摘要、标签

2. **状态筛选**
   - [ ] 点击不同状态 Tab（待学习、学习中、已学会等）
   - [ ] 列表显示对应状态的资源

3. **分类导航**
   - [ ] 点击左侧分类
   - [ ] 主区域仅显示该分类的资源

4. **资源类型过滤**
   - [ ] 点击顶部的资源类型 Chip
   - [ ] 列表适对应类型的资源

### 📝 资源编辑测试

1. **点击资源卡片**
   - [ ] 显示资源详情（未完全实现，预留功能）

2. **快速状态切换**
   - [ ] 点击卡片上的「✏️」按钮
   - [ ] 状态循环切换（待学习 → 学习中 → 已学会 → 复习中 → 暂停）

3. **删除资源**
   - [ ] 点击卡片上的「🗑️」按钮
   - [ ] 确认删除
   - [ ] 资源被删除，显示提示

### 📊 数据持久性测试

1. **刷新页面**
   - [ ] 数据仍然存在
   - [ ] 没有丢失任何内容

2. **重启后端服务**
   - [ ] 数据仍然完整
   - [ ] 数据源来自数据库

---

## API 测试

### 使用 curl 或 Postman 测试

#### 获取所有资源
```bash
curl -X GET http://localhost:3001/api/articles
```

#### 创建资源
```bash
curl -X POST http://localhost:3001/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "学习资源",
    "url": "https://example.com",
    "description": "这是一个测试",
    "status": "todo",
    "category_id": "xxxxx",
    "resource_type_id": "xxxxx",
    "tags": ["学习"]
  }'
```

#### 更新资源状态
```bash
curl -X PUT http://localhost:3001/api/articles/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
```

#### 删除资源
```bash
curl -X DELETE http://localhost:3001/api/articles/{id}
```

#### 获取所有分类
```bash
curl -X GET http://localhost:3001/api/categories
```

#### 获取所有资源类型
```bash
curl -X GET http://localhost:3001/api/resource-types
```

---

## 浏览器调试

### 打开开发者工具

**Chrome / Edge / Firefox**
- Windows/Linux：`F12` 或 `Ctrl+Shift+I`
- Mac：`Cmd+Option+I`

### 重点检查项

**Network 标签**
- [ ] API 请求显示状态 200
- [ ] Response 包含正确的数据
- [ ] 没有 CORS 错误

**Console 标签**
- [ ] 没有红色错误（除非是预期的）
- [ ] 日志输出「初始化应用...」
- [ ] 日志输出「应用初始化完成！」

**Storage 标签**
- [ ] 可以查看 IndexedDB（如果使用了）
- [ ] LocalStorage 中的任何缓存

### 常见错误排查

| 错误 | 原因 | 解决 |
|------|------|------|
| CORS error | 后端没启动或地址错误 | 检查 `config.js` 中的 API_BASE_URL |
| 404 /api/articles | 后端路由配置错误 | 检查后端 `index.js` 是否正确注册了路由 |
| White screen | JavaScript 错误或加载不了 | 检查 Console 的错误信息 |
| Supabase error | 凭证错误或表不存在 | 检查 `.env.local` 和数据库初始化 |

---

## 常见问题

### Q: 后端启动失败，说「Supabase 未配置」

**A:** 检查 `.env.local` 文件：
```bash
# 确认文件存在
ls server/.env.local

# 确认包含这些变量
cat server/.env.local | grep SUPABASE
```

如果文件不存在，执行：
```bash
cd server
cp .env.example .env.local
# 编辑 .env.local，填入你的 Supabase 凭证
```

### Q: 前后端都启动了，但页面白屏

**A:** 
1. 打开浏览器调试工具（F12）
2. 查看 Console 标签的错误信息
3. 常见原因：
   - API 地址错误：检查 `client/js/config.js`
   - JavaScript 错误：检查所有脚本是否正确加载

### Q: 添加资源后没有显示

**A:**
1. 检查浏览器 Console 是否有错误
2. 打开浏览器 Network 标签，查看 POST 请求是否成功（200）
3. 直接访问 API：`http://localhost:3001/api/articles`
4. 在 Supabase 数据库中查看数据是否保存

### Q: 分类/资源类型修改不生效

**A:**
1. 检查数据库中是否真的修改了
2. 尝试刷新页面
3. 检查浏览器 Console 是否有错误
4. 确认 PUT 请求返回 200

### Q: 端口 3001 已被占用

**A:**
- 找出占用的进程并结束
- 或改为其他端口，然后更新 `config.js`

**Windows：**
```bash
netstat -ano | findstr :3001
taskkill /PID {PID} /F
```

**Mac/Linux：**
```bash
lsof -i :3001
kill -9 {PID}
```

---

## 下一步

✅ 所有测试通过后：

1. 📖 阅读 [PRD.md](./PRD.md) 了解完整功能规划
2. 🎨 查看设计说明，优化界面
3. 📦 考虑部署到 Netlify 或其他平台
4. 🚀 开始添加更多高级功能

---

**需要进一步帮助？**
- 查看项目文档
- 检查 Supabase 官方文档
- 检查浏览器开发者工具

*祝开发愉快！🌸*
