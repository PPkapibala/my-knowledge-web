/**
 * 集成测试脚本
 */

const BASE = 'http://localhost:3001/api';
let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
    if (condition) {
        console.log(`  ✅ ${label}`);
        passed++;
    } else {
        console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
        failed++;
    }
}

async function req(method, path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
}

// ——————————————————————————
console.log('\n【1】分类管理 API');
// ——————————————————————————
let catId, subCatId;
{
    const list = await req('GET', '/categories');
    assert('GET /categories 返回 code:0', list.code === 0);
    assert('返回数组', Array.isArray(list.data));

    const created = await req('POST', '/categories', { name: '测试分类', icon: '🧪', color: '#FF0000' });
    assert('POST /categories 创建成功', created.code === 0 && created.data?.id, JSON.stringify(created));
    catId = created.data?.id;

    const sub = await req('POST', '/categories', { name: '子分类', icon: '📌', parent_id: catId });
    assert('创建子分类（带 parent_id）', sub.code === 0 && sub.data?.parent_id === catId);
    subCatId = sub.data?.id;

    const updated = await req('PUT', `/categories/${catId}`, { name: '测试分类（已更新）' });
    assert('PUT /categories/:id 更新名称', updated.code === 0 && updated.data?.name === '测试分类（已更新）');

    const del = await req('DELETE', `/categories/${catId}`);
    assert('DELETE /categories/:id 删除成功', del.code === 0);
}

// ——————————————————————————
console.log('\n【2】资源类型 API');
// ——————————————————————————
let typeId;
{
    const list = await req('GET', '/resource-types');
    assert('GET /resource-types 返回 code:0', list.code === 0);
    assert('返回数组', Array.isArray(list.data));

    const created = await req('POST', '/resource-types', { name: '测试类型', icon: '🔬' });
    assert('POST /resource-types 创建成功', created.code === 0 && created.data?.id);
    typeId = created.data?.id;

    const updated = await req('PUT', `/resource-types/${typeId}`, { name: '测试类型（已更新）' });
    assert('PUT /resource-types/:id 更新名称', updated.code === 0 && updated.data?.name === '测试类型（已更新）');
}

// ——————————————————————————
console.log('\n【3】知识条目 API + activity_logs');
// ——————————————————————————
let articleId;
{
    // 先准备一个分类
    const cat = await req('POST', '/categories', { name: '测试用分类', icon: '📁' });
    const testCatId = cat.data?.id;

    const created = await req('POST', '/articles', {
        title: '测试文章',
        url: 'https://example.com',
        description: '这是一篇测试文章',
        resource_type_id: typeId,
        category_id: testCatId,
        tags: ['test', 'integration'],
        status: 'todo',
    });
    assert('POST /articles 创建成功', created.code === 0 && created.data?.id);
    articleId = created.data?.id;

    const list = await req('GET', '/articles');
    assert('GET /articles 列表包含新建条目', list.data?.some(a => a.id === articleId));

    const single = await req('GET', `/articles/${articleId}`);
    assert('GET /articles/:id 返回正确数据', single.data?.title === '测试文章');

    const updated = await req('PUT', `/articles/${articleId}`, { status: 'in_progress' });
    assert('PUT /articles/:id 状态更新为 in_progress', updated.data?.status === 'in_progress');

    const updated2 = await req('PUT', `/articles/${articleId}`, { status: 'completed' });
    assert('PUT /articles/:id 状态更新为 completed', updated2.data?.status === 'completed');

    // 验证 activity_logs（通过 Supabase 直接查询）
    const { createClient } = await import('@supabase/supabase-js');
    const { config } = await import('dotenv');
    config({ path: 'c:/Users/pp.song/Downloads/netlify-site/server/.env.local' });
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY);
    const { data: logs } = await sb.from('activity_logs').select('*').eq('article_id', articleId).order('created_at');
    assert('activity_logs: create 记录存在', logs?.some(l => l.action === 'create'));
    assert('activity_logs: status_change todo→in_progress 记录存在', logs?.some(l => l.action === 'status_change' && l.from_status === 'todo' && l.to_status === 'in_progress'));
    assert('activity_logs: status_change in_progress→completed 记录存在', logs?.some(l => l.action === 'status_change' && l.from_status === 'in_progress' && l.to_status === 'completed'));

    const del = await req('DELETE', `/articles/${articleId}`);
    assert('DELETE /articles/:id 删除成功', del.code === 0);

    const { data: delLogs } = await sb.from('activity_logs').select('*').eq("article_title", "测试文章").eq("action", "delete");
    assert('activity_logs: delete 记录存在', delLogs?.length > 0);
    assert('activity_logs: delete 记录保留标题快照', delLogs?.[0]?.article_title === '测试文章');

    // 清理
    await req('DELETE', `/categories/${testCatId}`);
}

// ——————————————————————————
console.log('\n【4】搜索与筛选 API');
// ——————————————————————————
{
    const byStatus = await req('GET', '/articles?status=todo');
    assert('GET /articles?status=todo 过滤生效', byStatus.data?.every(a => a.status === 'todo'));

    const bySearch = await req('GET', '/articles?search=不存在的关键词xyz');
    assert('GET /articles?search=xxx 返回空数组', Array.isArray(bySearch.data) && bySearch.data.length === 0);
}

// ——————————————————————————
console.log('\n【5】URL 元数据抓取 API');
// ——————————————————————————
{
    const meta = await req('POST', '/metadata', { url: 'https://example.com' });
    assert('POST /metadata 返回 code:0', meta.code === 0);
    assert('返回 title 字段', typeof meta.data?.title === 'string');
    assert('返回 description 字段', typeof meta.data?.description === 'string');
}

// 清理测试资源类型
await req('DELETE', `/resource-types/${typeId}`);

// ——————————————————————————
console.log(`\n${'='.repeat(40)}`);
console.log(`测试结果：✅ ${passed} 通过  ❌ ${failed} 失败`);
console.log('='.repeat(40));
process.exit(failed > 0 ? 1 : 0);
