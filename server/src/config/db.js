/**
 * 数据库配置 - Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
// 用 service_role key 绕过 RLS，后端自行控制数据隔离
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL 和 Key 未配置，请检查 .env 文件');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function testConnection() {
    try {
        const { error } = await supabase
            .from('articles')
            .select('id')
            .limit(1);

        if (error) throw error;
        console.log('✅ 数据库连接成功！');
        return true;
    } catch (error) {
        console.error('❌ 数据库连接失败:', error);
        return false;
    }
}
