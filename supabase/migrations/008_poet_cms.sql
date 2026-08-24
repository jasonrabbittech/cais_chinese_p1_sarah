-- ============================================================
-- 008_poet_cms.sql
-- Feature 004: 诗人 CMS——字段扩展 + 图片存储桶 + 策略
-- 依賴：002_multi_poet.sql（poets/posts 表）
-- 冪等：全部 IF NOT EXISTS / ON CONFLICT DO NOTHING（憲法 VII）
-- ============================================================

-- 1. poets 表人設字段（avatar_url/bg_url 存 Storage 相對路徑）
ALTER TABLE public.poets ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.poets ADD COLUMN IF NOT EXISTS bg_url TEXT;
ALTER TABLE public.poets ADD COLUMN IF NOT EXISTS tone TEXT;
ALTER TABLE public.poets ADD COLUMN IF NOT EXISTS personality TEXT;
ALTER TABLE public.poets ADD COLUMN IF NOT EXISTS language_style TEXT
  NOT NULL DEFAULT 'modern';

-- 語言風格枚舉約束（冪等：先刪後建）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'poets_language_style_check'
  ) THEN
    ALTER TABLE public.poets ADD CONSTRAINT poets_language_style_check
      CHECK (language_style IN ('modern', 'classical', 'cantonese'));
  END IF;
END $$;

-- 2. posts 表作品配圖
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS bg_url TEXT;

-- 3. 圖片存儲桶（public 讀；寫權限由下方策略控制）
INSERT INTO storage.buckets (id, name, public)
VALUES ('poet-assets', 'poet-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 4. storage.objects 策略：公開讀 + 教師（authenticated）寫
--    冪等：先刪同名策略再建
DROP POLICY IF EXISTS "poet assets public read" ON storage.objects;
CREATE POLICY "poet assets public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'poet-assets');

DROP POLICY IF EXISTS "poet assets authenticated write" ON storage.objects;
CREATE POLICY "poet assets authenticated write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'poet-assets' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "poet assets authenticated update" ON storage.objects;
CREATE POLICY "poet assets authenticated update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'poet-assets' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "poet assets authenticated delete" ON storage.objects;
CREATE POLICY "poet assets authenticated delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'poet-assets' AND auth.role() = 'authenticated'
  );

-- 5. 現有詩人語言風格種子（與 002 prompt「偏白話」一致的默認值）
UPDATE public.poets
SET language_style = 'modern'
WHERE language_style IS NULL OR language_style NOT IN ('modern', 'classical', 'cantonese');

COMMENT ON COLUMN public.poets.language_style IS
  'AI 回覆語言風格：modern=現代語言 classical=古代語言 cantonese=香港本地粵語';
COMMENT ON COLUMN public.poets.avatar_url IS '頭像圖 Storage 相對路徑（空則前端回退 emoji）';
COMMENT ON COLUMN public.poets.bg_url IS '詩人級朋友圈背景圖相對路徑';
COMMENT ON COLUMN public.posts.bg_url IS '作品配圖相對路徑（渲染優先於詩人級背景）';
