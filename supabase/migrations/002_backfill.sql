-- ============================================================
-- Sarah AI Sushi — Feature 002: Backfill Migration
-- Migration: 002_backfill.sql
-- Depends on: 002_multi_poet.sql
-- Created: 2026-07-01
--
-- 目的（T024）：將 Phase 1 既有資料遷移到多詩人架構，零資料遺失
--   1. 既有 comments 的 post_id 回填為蘇軾預設作品
--   2. 將 comments.ai_reply 回填至 ai_replies（round = 1）
--   3. 回填完成後將 comments.post_id 設為 NOT NULL
-- 說明：comments.ai_reply / replied_at 暫保留（Phase 3 才廢除）
-- ============================================================

-- 1. 取得蘇軾的預設作品（用於回填既有留言）
DO $$
DECLARE
  v_sushi_post UUID;
BEGIN
  SELECT p.id INTO v_sushi_post
  FROM public.posts p
  JOIN public.poets po ON po.id = p.poet_id
  WHERE po.name = '苏轼'
  ORDER BY p.created_at
  LIMIT 1;

  -- 2. 回填既有 comments 的 post_id（僅處理 NULL）
  IF v_sushi_post IS NOT NULL THEN
    UPDATE public.comments
    SET post_id = v_sushi_post
    WHERE post_id IS NULL;
  END IF;

  -- 3. 將既有 comments.ai_reply 回填至 ai_replies（round = 1）
  INSERT INTO public.ai_replies (comment_id, user_message, reply_text, round, parent_reply_id, created_at)
  SELECT
    c.id,
    c.content,
    c.ai_reply,
    1,
    NULL,
    COALESCE(c.replied_at, c.created_at)
  FROM public.comments c
  WHERE c.ai_reply IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.ai_replies ar WHERE ar.comment_id = c.id
    );
END $$;

-- 4. 回填完成後，將 post_id 設為 NOT NULL（確保新留言必帶 post_id）
ALTER TABLE public.comments ALTER COLUMN post_id SET NOT NULL;
