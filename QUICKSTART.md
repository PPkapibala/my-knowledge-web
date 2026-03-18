# 🚀 快速启动指南

按照下面的步骤快速启动知识库网站。

## 步骤 1️⃣：Supabase 配置（5 分钟）

**如果你是第一次使用，必须完成这步！**

1. 详细指南：看 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
2. 快速版本：
   - 访问 supabase.com，创建新项目
   - 复制项目 URL 和 Anon Key
   - 在 `server/.env.local` 中填入配置

## 步骤 2️⃣：后端启动（2 分钟）

```bash
# 进入后端目录
cd server

# 首次安装依赖
npm install

# 启动开发服务器
npm run dev
```

✅ 看到以下输出说明成功：
```
✅ 数据库连接成功！
✅ 服务器启动成功！
🌐 地址: http://localhost:3001
```

## 步骤 3️⃣：前端启动（1 分钟）

**在新的终端窗口中**

### 方案 A：使用 Live Server（推荐）

```bash
# 方案 1：VS Code 中
# 1. 安装扩展：Live Server
# 2. 右键点击 client/index.html
# 3. 选择 "Open with Live Server"

# 方案 2：命令行启动
cd client
python -m http.server 3000
# 或用 Node.js
npx live-server client --port=3000
```

### 方案 B：直接打开

```bash
# 直接在浏览器中打开文件
client/index.html
```

## 步骤 4️⃣：测试功能 ✨

1. 打开 `http://localhost:3000`（或你的前端地址）
2. 看到「个人知识库」主页面
3. 尝试：
   - ✅ 点击「+ 添加资源」按钮
   - ✅ 填写表单并保存
   - ✅ 查看资源卡片出现
   - ✅ 尝试删除资源

## 问题排查

| 问题 | 解决方案 |
|------|--------|
| **API 连接失败** | 检查后端是否启动在 3001 端口，Supabase 配置是否正确 |
| **页面白屏** | 检查浏览器控制台是否有错误，前端 API 地址是否正确 |
| **数据库连接错误** | 查看 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 检查配置 |
| **端口被占用** | 改变端口或杀死占用的进程 |

## 目录说明

```
netlify-site/
├── client/              # 前端代码
│   ├── index.html       # 主页
│   ├── css/style.css    # 样式
│   └── js/              # 脚本
├── server/              # 后端代码
│   ├── src/index.js     # 服务器入口
│   ├── package.json     # 依赖
│   └── .env.local       # 环境变量（需要创建）
├── PRD.md              # 产品需求文档
├── SUPABASE_SETUP.md   # Supabase 详细配置
└── QUICKSTART.md       # 本文件
```

## 下一步

- 📖 查看 [PRD.md](./PRD.md) 了解完整功能
- 🎨 查看 [设计规范](./PRD.md#4-界面设计规格)
- 📱 使用应用，添加你的第一个资源 🌸

---

**需要帮助？** 查看相关文档或提交 Issue

*快乐学习！✨*
