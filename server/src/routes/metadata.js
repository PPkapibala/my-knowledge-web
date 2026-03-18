/**
 * 网页元数据抓取路由
 */

import express from 'express';

const router = express.Router();

// POST /api/metadata
router.post('/', async (req, res) => {
    const { url } = req.body;
    if (!url || !url.startsWith('http')) {
        return res.status(400).json({ code: 400, message: '请提供有效的 URL' });
    }

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KnowledgeBot/1.0)' },
        });
        clearTimeout(timer);

        const html = await response.text();

        // 提取 title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';

        // 提取 description
        const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
        const description = descMatch ? descMatch[1].trim() : '';

        res.json({ code: 0, data: { title, description }, message: 'Success' });
    } catch (error) {
        // 抓取失败不算服务器错误，返回空数据
        res.json({ code: 0, data: { title: '', description: '' }, message: 'Fetch failed' });
    }
});

export default router;
