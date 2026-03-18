# 🌸 个人知识库网站

一款面向个人学习者的轻量级知识收藏与复习管理工具。

## 🚀 快速开始

### 环境要求
- Node.js 16+
- npm / yarn
- Supabase 账户

### 1. 克隆项目
```bash
git clone <repo-url>
cd knowledge-base
```

### 2. 后端配置
```bash
cd server
npm install
cp .env.example .env.local
# 编辑 .env.local，填入你的 Supabase URL 和 API Key
npm run dev
```

后端将运行在 `http://localhost:3001`

### 3. 前端配置
```bash
cd client
# 直接在浏览器打开 index.html 或用 Live Server
# 更新 js/config.js 中的后端 API 地址
```

## 📁 项目结构
```
knowledge-base/
├── PRD.md                          # 产品需求规格说明
├── README.md                       # 项目说明
├── client/                         # 前端代码
│   ├── index.html                  # 主页
│   ├── css/
│   │   └── style.css               # 样式文件
│   └── js/
│       ├── config.js               # 配置文件
│       ├── api.js                  # API 客户端
│       ├── app.js                  # 主应用逻辑
│       ├── category.js             # 分类管理
│       ├── resource-type.js        # 资源类型管理
│       └── dashboard.js            # 学习看板
└── server/                         # 后端代码
    ├── package.json
    ├── .env.example
    └── src/
        ├── index.js                # 服务器入口
        ├── config/
        │   └── db.js               # 数据库配置
        └── routes/
            ├── articles.js         # 知识条目路由
            ├── categories.js       # 分类路由
            └── resource-types.js   # 资源类型路由
```

## 🏗️ 开发阶段

### P0 - 基础（第 1-2 周）
- [x] 项目结构初始化
- [ ] Supabase 数据库建表
- [ ] 后端 CRUD API
- [ ] 基础卡片列表界面

### P1 - 核心功能（第 3-4 周）
- [ ] 分类管理面板
- [ ] 资源类型管理
- [ ] 状态管理
- [ ] 搜索筛选

### P2 - 体验优化（第 5 周）
- [ ] 学习看板
- [ ] 拖拽排序
- [ ] 动效优化

### P3 - 完善部署（第 6 周）
- [ ] 导入/导出功能
- [ ] 响应式设计
- [ ] 性能优化
- [ ] 线上部署

## 🎨 设计规范

**色彩系统：**
- 主色: #C17B5C（暖棕）
- 辅色: #F4A261（柔橙）
- 背景: #FFF9F5（米白）
- 文字: #4A3728（深棕）

**风格：** 温馨可爱 × 日系 Notion 风

## 📚 详细文档

查看 [PRD.md](./PRD.md) 获取完整的产品需求规格说明。

---

*✨ 愿你的每一次学习，都被温柔记录。*
