/**
 * 分类 API 路由
 */

import express from 'express';
import { supabase } from '../config/db.js';

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('order', { ascending: true });

        if (error) throw error;
        res.json({ code: 0, data, message: 'Success' });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ code: 500, message: error.message });
    }
});

// POST /api/categories
router.post('/', async (req, res) => {
    try {
        const { name, icon, parent_id } = req.body;
        if (!name) return res.status(400).json({ code: 400, message: '分类名称为必填项' });

        const { data, error } = await supabase
            .from('categories')
            .insert([{
                name,
                icon: icon || '📚',
                parent_id: parent_id || null,
                order: 0,
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ code: 0, data: data[0], message: '创建成功' });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ code: 500, message: error.message });
    }
});

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, icon, parent_id } = req.body;
        const updates = {};
        if (name)                    updates.name      = name;
        if (icon)                    updates.icon      = icon;
        if (parent_id !== undefined) updates.parent_id = parent_id;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        res.json({ code: 0, data: data[0], message: '更新成功' });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ code: 500, message: error.message });
    }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;

        // 获取被删分类的父级
        const { data: category, error: fetchError } = await supabase
            .from('categories')
            .select('parent_id')
            .eq('id', categoryId)
            .single();

        if (fetchError) throw fetchError;

        // 子分类上移到被删分类的父级
        await supabase
            .from('categories')
            .update({ parent_id: category.parent_id })
            .eq('parent_id', categoryId);

        // 删除分类
        const { error: deleteError } = await supabase
            .from('categories')
            .delete()
            .eq('id', categoryId);

        if (deleteError) throw deleteError;
        res.json({ code: 0, message: '删除成功' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ code: 500, message: error.message });
    }
});

export default router;
