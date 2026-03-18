/**
 * 资源类型 API 路由
 */

import express from 'express';
import { supabase } from '../config/db.js';

const router = express.Router();

// GET /api/resource-types
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('resource_types')
            .select('*')
            .order('order', { ascending: true });

        if (error) throw error;
        res.json({ code: 0, data, message: 'Success' });
    } catch (error) {
        console.error('Error fetching resource types:', error);
        res.status(500).json({ code: 500, message: error.message });
    }
});

// POST /api/resource-types
router.post('/', async (req, res) => {
    try {
        const { name, icon } = req.body;
        if (!name) return res.status(400).json({ code: 400, message: '类型名称为必填项' });

        const { data, error } = await supabase
            .from('resource_types')
            .insert([{
                name,
                icon: icon || '📌',
                order: 0,
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ code: 0, data: data[0], message: '创建成功' });
    } catch (error) {
        console.error('Error creating resource type:', error);
        res.status(500).json({ code: 500, message: error.message });
    }
});

// PUT /api/resource-types/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, icon } = req.body;
        const updates = {};
        if (name) updates.name = name;
        if (icon) updates.icon = icon;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('resource_types')
            .update(updates)
            .eq('id', req.params.id)
            .select();

        if (error) throw error;
        res.json({ code: 0, data: data[0], message: '更新成功' });
    } catch (error) {
        console.error('Error updating resource type:', error);
        res.status(500).json({ code: 500, message: error.message });
    }
});

// DELETE /api/resource-types/:id
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('resource_types')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ code: 0, message: '删除成功' });
    } catch (error) {
        console.error('Error deleting resource type:', error);
        res.status(500).json({ code: 500, message: error.message });
    }
});

export default router;
