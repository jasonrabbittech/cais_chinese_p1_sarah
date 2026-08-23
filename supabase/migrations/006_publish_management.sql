-- Migration: 004_publish_management.sql
-- 功能：詩人/作品的發布控制（教師後台可切換學生端是否可見）
-- Depends on: 002_multi_poet.sql

-- 該人表加 is_published（預設可見）
ALTER TABLE public.poets ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

-- 作品表加 is_published（預設可見）
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

-- RLS：公開可讀（已由 002 的策略覆蓋，無需額外策略）
-- 寫入權限限於 service_role（已由 002 的策略覆蓋）

COMMENT ON COLUMN public.poets.is_published IS '是否對學生端可見（教師後台控制）';
COMMENT ON COLUMN public.posts.is_published IS '是否對學生端可見（教師後台控制）';
