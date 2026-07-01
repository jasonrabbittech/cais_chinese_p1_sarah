-- =====================================================
-- Sarah AI Sushi - 数据库同步脚本
-- 从生产环境同步到测试环境
-- 生成时间: 2026-07-01
-- =====================================================

-- 注意事项：
-- 1. 此脚本会删除测试环境中已存在的表和数据
-- 2. 执行前请确认测试环境没有重要数据
-- 3. 建议在 Supabase Dashboard 的 SQL Editor 中执行

-- =====================================================
-- 步骤 1: 删除已存在的约束、索引和表（反向顺序）
-- =====================================================

-- 先删除 RLS 策略
DROP POLICY IF EXISTS "Allow read" ON public.comments;
DROP POLICY IF EXISTS "Allow insert" ON public.comments;
DROP POLICY IF EXISTS "Allow delete" ON public.comments;
DROP POLICY IF EXISTS "Allow update" ON public.comments;
DROP POLICY IF EXISTS "Allow select" ON public.reply_templates;
DROP POLICY IF EXISTS "Allow all for service_role" ON public.reply_templates;

-- 删除索引
DROP INDEX IF EXISTS public.idx_comments_created_at;

-- 删除主键（会自动删除关联的索引）
ALTER TABLE IF EXISTS public.comments DROP CONSTRAINT IF EXISTS comments_pkey;
ALTER TABLE IF EXISTS public.reply_templates DROP CONSTRAINT IF EXISTS reply_templates_pkey;

-- 删除 CHECK 约束
ALTER TABLE IF EXISTS public.comments DROP CONSTRAINT IF EXISTS comments_id_not_null;
ALTER TABLE IF EXISTS public.comments DROP CONSTRAINT IF EXISTS comments_student_name_not_null;
ALTER TABLE IF EXISTS public.comments DROP CONSTRAINT IF EXISTS comments_content_not_null;
ALTER TABLE IF EXISTS public.reply_templates DROP CONSTRAINT IF EXISTS reply_templates_id_not_null;
ALTER TABLE IF EXISTS public.reply_templates DROP CONSTRAINT IF EXISTS reply_templates_type_not_null;
ALTER TABLE IF EXISTS public.reply_templates DROP CONSTRAINT IF EXISTS reply_templates_reply_not_null;
ALTER TABLE IF EXISTS public.reply_templates DROP CONSTRAINT IF EXISTS reply_templates_type_check;

-- 最后删除表
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.reply_templates CASCADE;

-- =====================================================
-- 步骤 2: 创建表结构
-- =====================================================

-- 创建 comments 表（学生评论）
CREATE TABLE public.comments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_name text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    ai_reply text,
    replied_at timestamp with time zone,
    is_replying boolean DEFAULT false,
    CONSTRAINT comments_pkey PRIMARY KEY (id),
    CONSTRAINT comments_id_not_null CHECK (id IS NOT NULL),
    CONSTRAINT comments_student_name_not_null CHECK (student_name IS NOT NULL),
    CONSTRAINT comments_content_not_null CHECK (content IS NOT NULL)
);

-- 创建 reply_templates 表（AI 回复模板）
CREATE TABLE public.reply_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    type text NOT NULL,
    keyword text,
    reply text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reply_templates_pkey PRIMARY KEY (id),
    CONSTRAINT reply_templates_type_check CHECK (type = ANY (ARRAY['generic'::text, 'smart'::text])),
    CONSTRAINT reply_templates_id_not_null CHECK (id IS NOT NULL),
    CONSTRAINT reply_templates_type_not_null CHECK (type IS NOT NULL),
    CONSTRAINT reply_templates_reply_not_null CHECK (reply IS NOT NULL)
);

-- =====================================================
-- 步骤 3: 创建索引
-- =====================================================

CREATE UNIQUE INDEX comments_pkey ON public.comments USING btree (id);
CREATE INDEX idx_comments_created_at ON public.comments USING btree (created_at DESC);
CREATE UNIQUE INDEX reply_templates_pkey ON public.reply_templates USING btree (id);

-- =====================================================
-- 步骤 4: 启用行级安全 (RLS)
-- =====================================================

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reply_templates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 步骤 5: 创建 RLS 策略
-- =====================================================

-- comments 表的策略（允许所有操作）
CREATE POLICY "Allow read" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "Allow insert" ON public.comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete" ON public.comments
    FOR DELETE USING (true);

CREATE POLICY "Allow update" ON public.comments
    FOR UPDATE USING (true);

-- reply_templates 表的策略
CREATE POLICY "Allow select" ON public.reply_templates
    FOR SELECT USING (true);

CREATE POLICY "Allow all for service_role" ON public.reply_templates
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 步骤 6: 插入初始数据（reply_templates）
-- =====================================================

-- 通用回复模板（generic）
INSERT INTO public.reply_templates (id, type, keyword, reply, created_at, updated_at) VALUES
    ('eb37969a-fbcd-4e20-8d16-495df795585a', 'generic', null, '諸位安好！月色甚美，諸位可願與吾共賞這輪明月？', '2026-06-28 01:02:24.499253+00', '2026-06-28 01:02:24.499253+00'),
    ('d06fbd49-dc59-48f3-8a1d-f5197895b4a5', 'generic', null, '哈哈，甚好甚好！諸位以為此月如何？', '2026-06-28 01:02:24.499253+00', '2026-06-28 01:02:24.499253+00'),
    ('2fd68217-9c41-44af-ab66-b30c5c533ab9', 'generic', null, '月圓之夜，頗念子由。諸位可有思念之人？', '2026-06-28 01:02:24.499253+00', '2026-06-28 01:02:24.499253+00'),
    ('07c8878f-397d-4645-b25e-1cbccb22198a', 'generic', null, '人生如月，有圓有缺。諸位且珍惜當下，莫負良宵。', '2026-06-28 01:02:24.499253+00', '2026-06-28 01:02:24.499253+00'),
    ('662daf7a-86dd-4bdc-99ba-011df271f087', 'generic', null, '美酒配明月，人生一大樂事也！諸位以為然否？', '2026-06-28 01:02:24.499253+00', '2026-06-28 01:02:24.499253+00'),
    ('15d7896d-304b-42a0-aa4c-946b9a45a4fa', 'generic', null, '子由若在，定當共飲此夜。諸位家中可有兄弟姊妹？', '2026-06-28 01:02:24.499253+00', '2026-06-28 01:02:24.499253+00'),
    ('5723b447-4c7f-4d1e-bc64-02bfacca3e2e', 'generic', null, '但願人長久，千里共嬋娟——這句話，諸位讀來有何感觸？', '2026-06-28 01:02:24.499253+00', '2026-06-28 01:02:24.499253+00'),
    ('eabcad57-4fc3-4291-ab95-bf7adc86f668', 'generic', null, '密州雖好，終非故里。諸位可有思鄉之時？', '2026-06-28 01:02:24.499253+00', '2026-06-28 01:02:24.499253+00');

-- 智能回复模板（smart，根据关键词匹配）
INSERT INTO public.reply_templates (id, type, keyword, reply, created_at, updated_at) VALUES
    ('5dfacd8a-a748-436c-81b2-483f693782d9', 'smart', '心情,感覺,最近,好嗎', '哈哈，老夫近日尚可。密州雖遠，月色甚美，倒也自在。諸位近況如何？', '2026-06-28 01:02:24.499253+00', '2026-06-28 01:02:24.499253+00'),
    ('174d1bd2-e849-4e23-8db3-0347fca7422c', 'smart', '做什麼,幹嘛,在嗎,在不在', '方才獨酌至微醺，忽見明月，便想起子由。這會兒正倚窗賞月呢。哈哈。', '2026-06-28 01:02:24.499253+00', '2026-06-28 01:02:24.499253+00'),
    ('5f36b446-39a3-463b-b735-087baa5aa0ca', 'smart', '兄弟,姊妹,家人,親人,子由', '諸位有兄弟姊妹否？吾與子由（蘇轍）手足情深，七年未見，甚是思念。', '2026-06-28 01:02:24.499253+00', '2026-06-28 01:02:24.499253+00'),
    ('6a449225-4115-45b3-a642-5d2e2a18de45', 'smart', '月亮,月,明月,月色', '這輪明月，吾已看了千遍。丙辰中秋那夜，飲酒達旦，寫下那闋《水調歌頭》——諸位讀過否？', '2026-06-28 01:02:24.499253+00', '2026-06-28 01:02:24.499253+00'),
    ('a98c96f0-4b80-49e3-88df-9ef271a12264', 'smart', '為什麼,原因,怎麼,如何,為何', '哈哈，諸位有所不知。吾與王安石新政不合，自請外放已五年。丙辰中秋，歡飲達旦，大醉，作此篇，兼懷子由。', '2026-06-28 01:02:24.499253+00', '2026-06-28 01:02:24.499253+00'),
    ('b693ea5c-a363-487e-83af-c438c34aca6e', 'smart', '詩,詞,水調歌頭,作品,寫,創作', '《水調歌頭》乃丙辰中秋所作。那夜月色絕美，吾獨飲至天明，想念子由，便提筆寫下。諸位最愛其中哪一句？', '2026-06-28 01:02:24.499253+00', '2026-06-28 01:02:24.499253+00'),
    ('69157c5d-edd6-44d7-9b88-b2790ba1eb13', 'smart', '好棒,厲害,讚,喜歡,欣賞', '諸位過獎了！哈哈。不過那闋詞確是吾得意之作——「但願人長久，千里共嬋娟」，諸位以為然否？', '2026-06-28 01:02:24.499253+00', '2026-06-28 01:02:24.499253+00'),
    ('23bfd3d7-b09e-4a1c-bb20-1e4e921d38a2', 'smart', '思鄉,想家,回家,故鄉', '思鄉之情，吾深有體會。密州雖好，終非故里。諸位遠離家鄉之時，如何排遣？', '2026-06-28 01:02:24.499253+00', '2026-06-28 01:02:24.499253+00');

-- =====================================================
-- 同步完成！
-- =====================================================

-- 验证：检查表是否创建成功
SELECT 'comments' as table_name, count(*) as row_count FROM public.comments
UNION ALL
SELECT 'reply_templates' as table_name, count(*) as row_count FROM public.reply_templates;

-- 预期结果：
-- table_name       | row_count
-- ---------------- | ----------
-- comments         | 0
-- reply_templates  | 16
