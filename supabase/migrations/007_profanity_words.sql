-- Migration: 005_profanity_words.sql
-- 功能：教師可管理的違禁詞表（取代硬編碼清單）
-- 用途：前後端統一讀取，教師後台 CRUD
-- Depends on: 002_multi_poet.sql

CREATE TABLE IF NOT EXISTS public.profanity_words (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  word text NOT NULL UNIQUE,
  is_regex boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by text DEFAULT 'teacher'
);

-- RLS：公開讀（前端需要預載做本地過濾），僅 service_role 可寫
ALTER TABLE public.profanity_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read profanity words" ON public.profanity_words
  FOR SELECT USING (true);

CREATE POLICY "Service role full access profanity" ON public.profanity_words
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 插入默認違禁詞（從 ai-reply 的硬編碼清單遷移）
INSERT INTO public.profanity_words (word, is_regex, is_active) VALUES
  ('他媽的', false, true), ('他妈的', false, true), ('tmd', false, true),
  ('去你媽的', false, true), ('去你妈的', false, true), ('去你的', false, true),
  ('滾', false, true), ('滾蛋', false, true), ('滾開', false, true),
  ('白癡', false, true), ('白痴', false, true), ('笨蛋', false, true),
  ('蠢貨', false, true), ('傻逼', false, true), ('煞筆', false, true),
  ('沙雕', false, true), ('靠北', false, true), ('幹', false, true),
  ('幹你娘', false, true), ('操你', false, true), ('草你', false, true),
  ('操', false, true), ('媽逼', false, true), ('妈逼', false, true),
  ('媽的', false, true), ('妈的', false, true), ('你媽', false, true),
  ('你妈', false, true), ('死人', false, true), ('去死', false, true),
  ('殺你', false, true), ('人渣', false, true), ('賤人', false, true),
  ('贱人', false, true), ('廢物', false, true), ('废物', false, true),
  ('垃圾', false, true), ('混蛋', false, true), ('王八蛋', false, true),
  ('狗日的', false, true), ('畜生', false, true), ('豬頭', false, true),
  ('腦殘', false, true), ('脑残', false, true), ('智障', false, true),
  ('變態', false, true), ('变态', false, true), ('冚家鏟', false, true),
  ('冚家铲', false, true), ('丟你老母', false, true), ('撚', false, true),
  ('靠', false, true), ('頂你個肺', false, true),
  ('fuck', false, true), ('shit', false, true), ('bitch', false, true),
  ('asshole', false, true), ('bastard', false, true), ('damn', false, true),
  ('idiot', false, true), ('stupid', false, true), ('hate', false, true),
  ('kill', false, true), ('die', false, true), ('retard', false, true),
  ('nigger', false, true), ('faggot', false, true), ('slut', false, true),
  ('whore', false, true), ('rape', false, true), ('色情', false, true),
  ('賭博', false, true), ('毒品', false, true), ('自殺', false, true),
  ('自杀', false, true)
ON CONFLICT (word) DO NOTHING;

COMMENT ON TABLE public.profanity_words IS '教師可管理的違禁詞列表（前後端統一讀取）';
