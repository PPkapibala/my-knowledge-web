#!/usr/bin/env node

// 快速启动脚本
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uzjadkauvyvhkmabwfhh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6amFka2F1dnl2aGttYWJ3ZmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwODE2NTQsImV4cCI6MjA4NzY1NzY1NH0.a5zZGFRqrMBViPt3NHsduNlQr7fni5ZLW58cCgC-UQg';

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: '服务器运行中 🚀' });
});

// 初始化端点
app.get('/api/articles/init', async (req, res) => {
    try {
        const userId = '00000000-0000-0000-0000-000000000000';

        // 获取所有数据
        const [articlesData, categoriesData, resourceTypesData, tagsData] = await Promise.all([
            supabase.from('articles').select('*').eq('user_id', userId),
            supabase.from('categories').select('*').eq('user_id', userId),
            supabase.from('resource_types').select('*').eq('user_id', userId),
            supabase.from('tags').select('*').eq('user_id', userId)
        ]);

        res.json({
            success: true,
            code: 200,
            data: {
                articles: articlesData.data || [],
                categories: categoriesData.data || [],
                resourceTypes: resourceTypesData.data || [],
                tags: tagsData.data || [],
                stats: {
                    total_articles: articlesData.data?.length || 0,
                    total_categories: categoriesData.data?.length || 0,
                    total_resource_types: resourceTypesData.data?.length || 0,
                    total_tags: tagsData.data?.length || 0,
                    last_updated: new Date().toISOString()
                }
            },
            message: 'Initialization data loaded successfully'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            code: 500,
            message: 'Server error',
            error: error.message
        });
    }
});

// 测试路由 - 获取分类
app.get('/api/categories', async (req, res) => {
    try {
        const userId = '00000000-0000-0000-0000-000000000000';
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        res.json({
            success: true,
            code: 200,
            data: data || []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            code: 500,
            message: error.message
        });
    }
});

// 启动
app.listen(PORT, () => {
    console.log(`\n✅ 快速启动服务器成功！`);
    console.log(`🌐 后端地址: http://localhost:${PORT}`);
    console.log(`💚 健康检查: http://localhost:${PORT}/health`);
    console.log(`📚 初始化: http://localhost:${PORT}/api/articles/init\n`);
});
