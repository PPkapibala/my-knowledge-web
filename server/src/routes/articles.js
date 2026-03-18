/**
 * 知识条目 API 路由
 */

import express from 'express';
import { supabase } from '../config/db.js';

const router = express.Router();

// 写入操作日志（失败不阻断主流程）
async function logActivity({ articleId, articleTitle, action, fromStatus = null, toStatus = null }) {
    try {
        await supabase.from('activity_logs').insert([{
            article_id: articleId,
            article_title: articleTitle,
            action,
            from_status: fromStatus,
            to_status: toStatus,
        }]);
    } catch (err) {
        console.warn('activity_logs 写入失败:', err.message);
    }
}

// GET /api/articles
router.get('/', async (req, res) => {
    try {
        const { status, categoryId, resourceTypeId, search } = req.query;

        let query = supabase
            .from('articles')
            .select('*')
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }
        if (resourceTypeId) {
            query = query.eq('resource_type_id', resourceTypeId);
        }

        const { data, error } = await query;
        if (error) throw error;

        let filtered = data || [];
        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(item =>
                item.title?.toLowerCase().includes(q) ||
                item.description?.toLowerCase().includes(q) ||
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(q)))
            );
        }

        res.json({ code: 0, data: filtered, message: 'Success' });
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ code: 500, message: error.message });
    }
});

// GET /api/articles/:id
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.json({ code: 0, data, message: 'Success' });
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).json({ code: 500, message: error.message });
    }
});

// POST /api/articles
router.post('/', async (req, res) => {
    try {
        const { title, url, description, status, resource_type_id, category_id, tags } = req.body;

        if (!title || !url) {
            return res.status(400).json({ code: 400, message: '标题和URL为必填项' });
        }

        const { data, error } = await supabase
            .from('articles')
            .insert([{
                title,
                url,
                description: description || '',
                status: status || 'todo',
                resource_type_id,
                category_id,
                tags: tags || [],
            }])
            .select();

        if (error) throw error;
        const created = data[0];
        await logActivity({ articleId: created.id, articleTitle: created.title, action: 'create', toStatus: created.status });
        res.status(201).json({ code: 0, data: created, message: '创建成功' });
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ code: 500, message: error.message });
    }
});

// PUT /api/articles/batch  ← 必须在 /:id 之前注册
router.put('/batch', async (req, res) => {
    try {
        const { ids, data } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ code: 400, message: 'ids 不能为空' });
        }

        const { error } = await supabase
            .from('articles')
            .update({ ...data, updated_at: new Date().toISOString() })
            .in('id', ids);

        if (error) throw error;
        res.json({ code: 0, message: '批量更新成功' });
    } catch (error) {
        console.error('Error batch updating articles:', error);
        res.status(500).json({ code: 500, message: error.message });
    }
});

// PUT /api/articles/:id
router.put('/:id', async (req, res) => {
    try {
        const { title, url, description, status, resource_type_id, category_id, tags } = req.body;

        // 如果要变更状态，先取当前值用于日志
        let prevStatus = null;
        if (status) {
            const { data: current } = await supabase
                .from('articles')
                .select('status, title')
                .eq('id', req.params.id)
                .single();
            prevStatus = current?.status ?? null;
        }

        const { data, error } = await supabase
            .from('articles')
            .update({
                ...(title && { title }),
                ...(url && { url }),
                ...(description !== undefined && { description }),
                ...(status && { status }),
                ...(resource_type_id !== undefined && { resource_type_id }),
                ...(category_id !== undefined && { category_id }),
                ...(tags !== undefined && { tags }),
                updated_at: new Date().toISOString(),
            })
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        const updated = data[0];
        if (status && prevStatus !== status) {
            await logActivity({ articleId: updated.id, articleTitle: updated.title, action: 'status_change', fromStatus: prevStatus, toStatus: status });
        }
        res.json({ code: 0, data: updated, message: '更新成功' });
    } catch (error) {
        console.error('Error updating article:', error);
        res.status(500).json({ code: 500, message: error.message });
    }
});

// DELETE /api/articles/:id
router.delete('/:id', async (req, res) => {
    try {
        // 先取标题快照
        const { data: current } = await supabase
            .from('articles')
            .select('title, status')
            .eq('id', req.params.id)
            .single();

        // 先写日志（在删除前，避免外键约束报错）
        await logActivity({ articleId: req.params.id, articleTitle: current?.title, action: 'delete', fromStatus: current?.status });

        const { error } = await supabase
            .from('articles')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ code: 0, message: '删除成功' });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ code: 500, message: error.message });
    }
});

export default router;
