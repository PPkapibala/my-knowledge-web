/**
 * 知识库网站后端服务器
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';
import articlesRouter from './routes/articles.js';
import categoriesRouter from './routes/categories.js';
import resourceTypesRouter from './routes/resource-types.js';
import metadataRouter from './routes/metadata.js';

// 加载环境变量（只在这里加载一次）
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// 中间件
// ============================================

// 处理 CORS — 开发环境允许所有来源（含 file://）
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL
        : true,
    credentials: true,
}));

// 解析 JSON
app.use(express.json());

// 请求日志
app.use((req, _res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// ============================================
// 健康检查
// ============================================

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: '服务器运行中 🚀' });
});

// ============================================
// API 路由
// ============================================

app.use('/api/articles', articlesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/resource-types', resourceTypesRouter);
app.use('/api/metadata', metadataRouter);

// ============================================
// 错误处理
// ============================================

app.use((_req, res) => {
    res.status(404).json({
        code: 404,
        message: '路由不存在'
    });
});

app.use((err, _req, res, _next) => {
    console.error('❌ 服务器错误:', err);
    res.status(500).json({
        code: 500,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// 启动服务器
// ============================================

async function startServer() {
    try {
        console.log('🔌 正在连接数据库...');
        const connected = await testConnection();

        if (!connected) {
            console.warn('⚠️  数据库连接失败，但服务器仍继续运行');
        }

        app.listen(PORT, () => {
            console.log(`\n✅ 服务器启动成功！`);
            console.log(`🌐 地址: http://localhost:${PORT}`);
            console.log(`📚 API: http://localhost:${PORT}/api`);
            console.log(`💚 健康检查: http://localhost:${PORT}/health\n`);
        });
    } catch (error) {
        console.error('❌ 启动失败:', error);
        process.exit(1);
    }
}

startServer();
