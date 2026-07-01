-- =====================================================
-- Sarah AI Sushi - 数据库同步脚本 v2（简化版）
-- =====================================================

BEGIN;

-- 第1步：强制删除表（CASCADE 会自动删除所有依赖对象）
DROP TABLE IF EXISTS public.reply_templates CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;

-- 第2步：创建 comments 表
CREATE TABLE public.comments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_name text NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    ai_reply text,
    replied_at timestamptz,
    is_replying boolean DEFAULT false,
    PRIMARY KEY (id)
);

-- 第3步：创建 reply_templates 表
CREATE TABLE public.reply_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('generic', 'smart')),
    keyword text,
    reply text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

-- 第4步：创建索引
CREATE INDEX idx_comments_created_at ON public.comments (created_at DESC);

-- 第5步：启用 RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reply_templates ENABLE ROW LEVEL SECURITY;

-- 第6步：RLS 策略 - comments（完全开放）
CREATE POLICY "Allow all" ON public.comments FOR ALL USING (true) WITH CHECK (true);

-- 第7步：RLS 策略 - reply_templates（公开读取，service_role 可写）
CREATE POLICY "Allow select" ON public.reply_templates FOR SELECT USING (true);
CREATE POLICY "Allow service_role" ON public.reply_templates FOR ALL USING (auth.role() = 'service_role');

-- 第8步：插入通用模板数据
INSERT INTO public.reply_templates (id, type, reply) VALUES
('eb37969a-fbcd-4e20-8d16-495df795585a', 'generic', '諸位安好！月色甚美，諸位可願與吾共賞這輪明月？'),
('d06fbd49-dc59-48f3-8a1d-f5197895b4a5', 'generic', '哈哈，甚好甚好！諸位以為此月如何？'),
('2fd68217-9c41-44af-ab66-b30c5c533ab9', 'generic', '月圓之夜，頗念子由。諸位可有思念之人？'),
('07c8878f-397d-4645-b25e-1cbccb22198a', 'generic', '人生如月，有圓有缺。諸位且珍惜當下，莫負良宵。'),
('662daf7a-86dd-4bdc-99ba-011df271f087', 'generic', '美酒配明月，人生一大樂事也！諸位以為然否？'),
('15d7896d-304b-42a0-aa4c-946b9a45a4fa', 'generic', '子由若在，定當共飲此夜。諸位家中可有兄弟姊妹？'),
('5723b447-4c7f-4d1e-bc64-02bfacca3e2e', 'generic', '但願人長久，千里共嬋娟——這句話，諸位讀來有何感觸？'),
('eabcad57-4fc3-4291-ab95-bf7adc86f668', 'generic', '密州雖好，終非故里。諸位可有思鄉之時？');

-- 第9步：插入智能模板数据
INSERT INTO public.reply_templates (id, type, keyword, reply) VALUES
('5dfacd8a-a748-436c-81b2-483f693782d9', 'smart', '心情,感覺,最近,好嗎', '哈哈，老夫近日尚可。密州雖遠，月色甚美，倒也自在。諸位近況如何？'),
('174d1bd2-e849-4e23-8db3-0347fca7422c', 'smart', '做什麼,幹嘛,在嗎,在不在', '方才獨酌至微醺，忽見明月，便想起子由。這會兒正倚窗賞月呢。哈哈。'),
('5f36b446-39a3-463b-b735-087baa5aa0ca', 'smart', '兄弟,姊妹,家人,親人,子由', '諸位有兄弟姊妹否？吾與子由（蘇轍）手足情深，七年未見，甚是思念。'),
('6a449225-4115-45b3-a642-5d2e2a18de45', 'smart', '月亮,月,明月,月色', '這輪明月，吾已看了千遍。丙辰中秋那夜，飲酒達旦，寫下那闋《水調歌頭》——諸位讀過否？'),
('a98c96f0-4b80-49e3-88df-9ef271a12264', 'smart', '為什麼,原因,怎麼,如何,為何', '哈哈，諸位有所不知。吾與王安石新政不合，自請外放已五年。丙辰中秋，歡飲達旦，大醉，作此篇，兼懷子由。'),
('b693ea5c-a363-487e-83af-c438c34aca6e', 'smart', '詩,詞,水調歌頭,作品,寫,創作', '《水調歌頭》乃丙辰中秋所作。那夜月色絕美，吾獨飲至天明，想念子由，便提筆寫下。諸位最愛其中哪一句？'),
('69157c5d-edd6-44d7-9b88-b2790ba1eb13', 'smart', '好棒,厲害,讚,喜歡,欣賞', '諸位過獎了！哈哈。不過那闋詞確是吾得意之作——「但願人長久，千里共嬋娟」，諸位以為然否？'),
('23bfd3d7-b09e-4a1c-bb20-1e4e921d38a2', 'smart', '思鄉,想家,回家,故鄉', '思鄉之情，吾深有體會。密州雖好，終非故里。諸位遠離家鄉之時，如何排遣？');

COMMIT;

-- 验证
SELECT 'comments' as tbl, count(*) FROM public.comments
UNION ALL SELECT 'reply_templates', count(*) FROM public.reply_templates;
