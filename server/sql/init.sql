-- 个人知识库 - 数据库初始化脚本
-- 版本: v1.2
-- 最后更新: 2026-02-26

-- ==================== 创建表 ====================

-- 资源类型表
CREATE TABLE IF NOT EXISTS resource_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  icon TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "order" INTEGER DEFAULT 0
);

-- 分类表（支持多级）
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  icon TEXT DEFAULT '',
  color VARCHAR(7) DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "order" INTEGER DEFAULT 0
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 文章|知识条目表
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  description TEXT DEFAULT '',
  status VARCHAR(20) DEFAULT 'todo',
  resource_type_id UUID REFERENCES resource_types(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  tags UUID[] DEFAULT '{}',
  is_favorited BOOLEAN DEFAULT FALSE,
  read_status VARCHAR(20) DEFAULT 'unread',
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 文章-标签关联表（多对多）
CREATE TABLE IF NOT EXISTS article_tags (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (article_id, tag_id)
);

-- 操作历史表（用于撤销功能）
CREATE TABLE IF NOT EXISTS operation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  previous_state JSONB NOT NULL,
  current_state JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '5 minutes'
);

-- ==================== 创建索引 ====================

-- 加速按用户查询
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_types_user_id ON resource_types(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_history_user_id ON operation_history(user_id);

-- 加速按状态查询
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(user_id, status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);

-- 加速搜索和排序
CREATE INDEX IF NOT EXISTS idx_articles_updated_at ON articles(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(user_id, created_at DESC);

-- 加速撤销过期清理
CREATE INDEX IF NOT EXISTS idx_operation_history_expired ON operation_history(expired_at);

-- ==================== 行级安全策略 (RLS) ====================

-- 启用 RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_history ENABLE ROW LEVEL SECURITY;

-- articles 表策略
CREATE POLICY "articles_select_policy" ON articles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "articles_insert_policy" ON articles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "articles_update_policy" ON articles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "articles_delete_policy" ON articles
  FOR DELETE USING (user_id = auth.uid());

-- categories 表策略
CREATE POLICY "categories_select_policy" ON categories
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "categories_insert_policy" ON categories
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "categories_update_policy" ON categories
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "categories_delete_policy" ON categories
  FOR DELETE USING (user_id = auth.uid());

-- resource_types 表策略
CREATE POLICY "resource_types_select_policy" ON resource_types
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "resource_types_insert_policy" ON resource_types
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "resource_types_update_policy" ON resource_types
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "resource_types_delete_policy" ON resource_types
  FOR DELETE USING (user_id = auth.uid());

-- tags 表策略
CREATE POLICY "tags_select_policy" ON tags
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "tags_insert_policy" ON tags
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "tags_delete_policy" ON tags
  FOR DELETE USING (user_id = auth.uid());

-- article_tags 表策略（通过关联的 articles 验证）
CREATE POLICY "article_tags_select_policy" ON article_tags
  FOR SELECT USING (
    article_id IN (
      SELECT id FROM articles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "article_tags_insert_policy" ON article_tags
  FOR INSERT WITH CHECK (
    article_id IN (
      SELECT id FROM articles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "article_tags_delete_policy" ON article_tags
  FOR DELETE USING (
    article_id IN (
      SELECT id FROM articles WHERE user_id = auth.uid()
    )
  );

-- operation_history 表策略
CREATE POLICY "operation_history_select_policy" ON operation_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "operation_history_insert_policy" ON operation_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "operation_history_delete_policy" ON operation_history
  FOR DELETE USING (user_id = auth.uid());

-- ==================== 初始数据（可选）====================

-- 插入默认资源类型
INSERT INTO resource_types (user_id, name, icon, "order") VALUES
  ('00000000-0000-0000-0000-000000000000', '文章', '📄', 1),
  ('00000000-0000-0000-0000-000000000000', '视频', '🎬', 2),
  ('00000000-0000-0000-0000-000000000000', '博客', '✍️', 3),
  ('00000000-0000-0000-0000-000000000000', '播客', '🎙️', 4),
  ('00000000-0000-0000-0000-000000000000', '文档', '📚', 5)
ON CONFLICT DO NOTHING;

-- 插入默认分类
INSERT INTO categories (user_id, name, icon, color, "order") VALUES
  ('00000000-0000-0000-0000-000000000000', '编程技术', '💻', '#3B82F6', 1),
  ('00000000-0000-0000-0000-000000000000', '前端开发', '🎨', '#EC4899', 2),
  ('00000000-0000-0000-0000-000000000000', '后端开发', '⚙️', '#8B5CF6', 3),
  ('00000000-0000-0000-0000-000000000000', '个人成长', '🌱', '#10B981', 4),
  ('00000000-0000-0000-0000-000000000000', '阅读笔记', '📖', '#F59E0B', 5)
ON CONFLICT DO NOTHING;

-- ==================== 函数和触发器 ====================

-- 自动更新 updated_at 时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 articles 表添加触发器
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 categories 表添加触发器
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 清理过期的操作历史
CREATE OR REPLACE FUNCTION cleanup_expired_operations()
RETURNS void AS $$
BEGIN
  DELETE FROM operation_history
  WHERE expired_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ==================== 初始化完成 ====================
-- 所有表、索引、策略和函数已创建
