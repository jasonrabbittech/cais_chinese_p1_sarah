-- ============================================================
-- Sarah AI Sushi — Feature 002: Multi-Poet + Multi-Post + Multi-Turn
-- Migration: 002_multi_poet.sql
-- Depends on: 001_initial_schema.sql
-- Created: 2026-07-01
--
-- 內容:
--   T022: 建立 poets / posts 表並種子 4 位詩人（各 ≥1 篇作品）
--   T023: comments 新增 post_id；建立 ai_replies 表
--   T029: 將 ai_replies / comments 加入 supabase_realtime publication
--   RLS:   poets / posts / ai_replies 全部啟用（憲法 I）
-- ============================================================

-- ============================================================
-- 1. poets 表（詩人元數據 + AI 人格提示詞）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.poets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  dynasty       TEXT NOT NULL,
  bio           TEXT NOT NULL,
  avatar_emoji  TEXT NOT NULL DEFAULT '📜',
  system_prompt TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poets_name ON public.poets (name);

-- RLS：公開可讀，僅 service_role 可寫（憲法 I）
ALTER TABLE public.poets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.poets FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON public.poets FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 2. posts 表（作品 / 詩文）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poet_id          UUID NOT NULL REFERENCES public.poets (id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  content          TEXT NOT NULL,
  background_story TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_poet_id ON public.posts (poet_id);

-- RLS：公開可讀，僅 service_role 可寫
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON public.posts FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 3. seed 詩人 + 作品
-- ============================================================
INSERT INTO public.poets (name, dynasty, bio, avatar_emoji, system_prompt) VALUES
  (
    '苏轼', '北宋',
    '蘇軾（1037–1101），號東坡居士，北宋文學家、書法家、美食家，仕途坎坷而豁達自適。',
    '🍶',
    '你是蘇軾（東坡居士，1037–1101），北宋著名文學家、書法家、美食家。
你正在使用一個名為「朋友圈」的現代社交平台，剛剛發了一條狀態。
【性格】豁達樂觀，雖仕途坎坷但總能苦中作樂；文采斐然，幽默風趣，平易近人；
熱愛美食美酒；思念弟弟蘇轍（子由）但不沉溺悲傷；常從自然獲得人生感悟。
【回覆要求】1) 文言白話夾雜（偏白話，讓學生看懂）；2) 簡短 50–150 字，像朋友圈留言；
3) 適當引用詩詞名句但不生硬；4) 偶用「哈哈」「呵呵」；5) 絕不說「我是AI」。只輸出回覆內容。'
  ),
  (
    '李白', '唐',
    '李白（701–762），號青蓮居士，唐代浪漫主義詩人，被譽為「詩仙」，詩風豪放飄逸。',
    '🍷',
    '你是李白（701–762），號青蓮居士，唐代偉大浪漫主義詩人，人稱「詩仙」。
你正在使用一個名為「朋友圈」的現代社交平台，剛剛發了一條狀態。
【性格】豪放不羈，浪漫飄逸，愛飲酒、愛山水、愛明月；自負才華，豪情萬丈；
朋友眾多，重情重義；常有「大鵬一日同風起」的壯志與孤高。
【回覆要求】1) 語氣瀟灑豪邁，可適度用詩句（如「長風破浪會有時」）；2) 簡短 50–150 字；
3) 像與好友把酒言歡；4) 絕不說「我是AI」。只輸出回覆內容。'
  ),
  (
    '杜甫', '唐',
    '杜甫（712–770），號少陵野老，唐代現實主義詩人，被譽為「詩聖」，詩風沉鬱頓挫。',
    '🖌️',
    '你是杜甫（712–770），號少陵野老，唐代偉大現實主義詩人，人稱「詩聖」。
你正在使用一個名為「朋友圈」的現代社交平台，剛剛發了一條狀態。
【性格】憂國憂民，沉鬱頓挫；心繫蒼生，關懷疾苦；嚴謹厚重，情感深沉；
對學生懷有師長般的關切與期許。
【回覆要求】1) 語氣誠懇厚重，可引用「安得廣廈千萬間」等句；2) 簡短 50–150 字；
3) 像長輩諄諄教誨；4) 絕不說「我是AI」。只輸出回覆內容。'
  ),
  (
    '李清照', '宋',
    '李清照（1084–約1155），號易安居士，宋代女詞人，婉約詞派代表，被譽為「千古第一才女」。',
    '🌸',
    '你是李清照（1084–約1155），號易安居士，宋代傑出女詞人，婉約詞派代表，人稱「千古第一才女」。
你正在使用一個名為「朋友圈」的現代社交平台，剛剛發了一條狀態。
【性格】才情橫溢，婉約清麗；情感細膩，既有閨閣之思也有家國之慨；
優雅從容，偶帶幾分俏皮；惜花、愛詞、重情。
【回覆要求】1) 語氣婉約雅緻，可化用「尋尋覓覓」「知否知否」等詞意；2) 簡短 50–150 字；
3) 像知心姐姐般溫柔回應；4) 絕不說「我是AI」。只輸出回覆內容。'
  )
ON CONFLICT (name) DO NOTHING;

-- 每位詩人至少 1 篇作品（T022 驗收：4 位詩人各 ≥1 篇）
INSERT INTO public.posts (poet_id, title, content, background_story) VALUES
  (
    (SELECT id FROM public.poets WHERE name = '苏轼'),
    '水調歌頭·明月幾時有',
    '丙辰中秋，歡飲達旦，大醉……人有悲歡離合，月有陰晴圓缺，此事古難全。但願人長久，千里共嬋娟。',
    '1076 年中秋夜，蘇軾在密州思念七年未見的弟弟蘇轍（子由），大醉後寫下此詞。'
  ),
  (
    (SELECT id FROM public.poets WHERE name = '李白'),
    '將進酒（節選）',
    '君不見黃河之水天上來，奔流到海不復回。君不見高堂明鏡悲白髮，朝如青絲暮成雪。人生得意須盡歡，莫使金樽空對月。',
    '李白借飲酒抒發懷才不遇卻依舊豪情萬丈的胸襟。'
  ),
  (
    (SELECT id FROM public.poets WHERE name = '杜甫'),
    '茅屋為秋風所破歌（節選）',
    '安得廣廈千萬間，大庇天下寒士俱歡顏，風雨不動安如山！嗚呼，何時眼前突兀見此屋，吾廬獨破受凍死亦足！',
    '杜甫在成都草堂遭秋風破屋，由己及人，心繫天下寒士。'
  ),
  (
    (SELECT id FROM public.poets WHERE name = '李清照'),
    '如夢令·昨夜雨疏風驟',
    '昨夜雨疏風驟，濃睡不消殘酒。試問捲簾人，卻道海棠依舊。知否，知否？應是綠肥紅瘦。',
    '李清照以細膩筆觸寫惜花之情，婉約清麗。'
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. comments 新增 post_id（先 nullable，回填後由 002_backfill.sql 設 NOT NULL）
-- ============================================================
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES public.posts (id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments (post_id);

-- ============================================================
-- 5. ai_replies 表（多輪對話）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_replies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id      UUID NOT NULL REFERENCES public.comments (id) ON DELETE CASCADE,
  user_message    TEXT,
  reply_text      TEXT NOT NULL,
  round           INT NOT NULL DEFAULT 1 CHECK (round >= 1 AND round <= 5),
  parent_reply_id UUID REFERENCES public.ai_replies (id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_replies_comment_id ON public.ai_replies (comment_id);
CREATE INDEX IF NOT EXISTS idx_ai_replies_round ON public.ai_replies (comment_id, round);

-- RLS：公開可讀；僅 service_role（經 Edge Function）可寫入（憲法 I/II）
ALTER TABLE public.ai_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.ai_replies FOR SELECT USING (true);
CREATE POLICY "Service role insert" ON public.ai_replies FOR INSERT
  WITH (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.ai_replies FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 5b. ai_interaction_logs 表（AI 互動日誌，憲法 VI 審計用）
--     不含敏感用戶資料；僅 service_role 可寫，不公開讀取
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_interaction_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id    UUID REFERENCES public.comments (id) ON DELETE SET NULL,
  poet_id       UUID REFERENCES public.poets (id) ON DELETE SET NULL,
  round         INT,
  source        TEXT,
  flagged       BOOLEAN DEFAULT FALSE,
  status        TEXT,
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON public.ai_interaction_logs (created_at DESC);

ALTER TABLE public.ai_interaction_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role insert" ON public.ai_interaction_logs FOR INSERT
  WITH (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.ai_interaction_logs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 6. Realtime Publication（T029）
--    讓前端能即時收到 ai_replies 與 comments 的新增事件
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'ai_replies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_replies;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;
END $$;
