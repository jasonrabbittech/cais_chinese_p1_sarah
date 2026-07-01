-- Sarah AI Sushi - Production Database Schema (Actual)
-- Source: Supabase Production Environment (Sarah_Chinese_P1)
-- Generated: 2026-07-01
-- Project Ref: pzatgmavjvrastnumxty

-- ============================================================
-- Table: comments (学生评论)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ai_reply TEXT,
  replied_at TIMESTAMPTZ,
  is_replying BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Public read access" ON public.comments FOR SELECT USING (true);

-- Policy: Allow public insert (students can post comments)
CREATE POLICY "Public insert access" ON public.comments FOR INSERT WITH (true);

-- Policy: Allow service role full access (for Edge Function)
CREATE POLICY "Service role full access" ON public.comments FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Table: reply_templates (AI 回覆模板)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reply_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('generic', 'smart')),
  keyword TEXT,
  reply TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.reply_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (for Edge Function and frontend)
CREATE POLICY "Public read access" ON public.reply_templates FOR SELECT USING (true);

-- Policy: Allow service role full access (for teacher management)
CREATE POLICY "Service role full access" ON public.reply_templates FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_student_name ON public.comments(student_name);
CREATE INDEX IF NOT EXISTS idx_reply_templates_type ON public.reply_templates(type);

-- ============================================================
-- Functions: Updated timestamp trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_reply_templates_updated_at BEFORE UPDATE ON public.reply_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Realtime Publication
-- ============================================================
-- Enable realtime for comments table (already enabled in production)
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- ============================================================
-- Initial Data: Default reply templates (if not exists)
-- ============================================================

-- Generic replies (used when DeepSeek API is unavailable)
INSERT INTO public.reply_templates (type, reply) VALUES
  ('generic', '諸位安好！月色甚美，可願與吾共賞此夜？🌙'),
  ('generic', '哈哈，甚好甚好！諸位以為如何？'),
  ('generic', '月圓之夜，思念故人。諸位可有感觸？'),
  ('generic', '人生如月，有圓有缺。且珍惜當下吧！')
ON CONFLICT DO NOTHING;

-- Smart replies (keyword-triggered)
INSERT INTO public.reply_templates (type, keyword, reply) VALUES
  ('smart', '心情,感覺,最近', '哈哈，老夫近日尚可。諸位近況如何？'),
  ('smart', '做什麼,幹嘛,在做', '方才獨酌至微醺，忽見明月，便想起子由。'),
  ('smart', '中秋,月亮,明月', '明月幾時有？把酒問青天。諸位且盡興！🍶'),
  ('smart', '思念,想家,想,子由', '人有悲歡離合，月有陰晴圓缺。但願人長久，千里共嬋娟。')
ON CONFLICT DO NOTHING;
