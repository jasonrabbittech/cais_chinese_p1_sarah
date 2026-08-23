-- ============================================================
-- 004_ai_reply_source.sql
-- 在 ai_replies 表增加 source 欄位，記錄每筆回覆的來源，
-- 供教師後台日誌區分「真實 AI 回覆」與「預製/兜底回覆」。
-- 依賴：002_multi_poet.sql（ai_replies 表）
-- ============================================================

ALTER TABLE public.ai_replies ADD COLUMN IF NOT EXISTS source TEXT;

COMMENT ON COLUMN public.ai_replies.source IS
  '回覆來源標記：deepseek=真實AI生成；'
  'fallback=DeepSeek 呼叫失敗改用預置；'
  'fallback-nokey=未配置 DEEPSEEK_API_KEY 改用預置；'
  'fallback-filtered=AI 輸出觸發敏感詞過濾改用預置；'
  'content-filter=學生留言不當被攔截；'
  'NULL=本欄位上線前的歷史舊資料';
