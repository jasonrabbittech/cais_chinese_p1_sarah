# Tasks: 多诗人 + 多作品 + AI 多轮对话

**Feature ID**: 002  
**Created**: 2026-07-01  
**Depends on**: 001-ai-poet-friends

---

## Phase 0: Database Schema / 数据库架构

### Task T022 [P1]: Create poets & posts Tables

- **Description**: Migration `002_multi_poet.sql` — create `poets`, `posts` tables; seed 4 poets (苏轼/李白/杜甫/李清照), each with ≥1 post
- **Acceptance**: 4 poets seeded, each with ≥1 post (total ≥4 posts); `poets`/`posts` RLS enabled (SELECT public, ALL service_role only)
- **File**: `supabase/migrations/002_multi_poet.sql`
- **Status**: 🟢 Done

### Task T023 [P1]: Add post_id to comments + Create ai_replies

- **Description**: ALTER comments ADD post_id; CREATE ai_replies table
- **Acceptance**: FK valid, backfill script ready; `ai_replies` RLS enabled (SELECT public, INSERT service_role only) + indexes `idx_ai_replies_comment_id`/`idx_ai_replies_round` + CHECK (round 1..5)
- **File**: `supabase/migrations/002_multi_poet.sql`
- **Status**: 🟢 Done

### Task T024 [P1]: Backfill Migration Script

- **Description**: Migrate Phase 1 data (assign post_id, backfill ai_replies)
- **Acceptance**: Zero data loss, verified in staging
- **File**: `supabase/migrations/002_backfill.sql`
- **Status**: 🟢 Done

---

## Phase 1: Edge Function / 后端函数

### Task T025 [P1]: Generic ai-reply Function

- **Description**: Replace `su-shi-reply` with `ai-reply` (poet-agnostic)
- **Acceptance**: Takes comment_id, fetches poet prompt + history, calls DeepSeek; validates input (comment_id required/valid), 30s timeout, sanitizes user input & filters AI output (reuse Phase 1 content filter)
- **File**: `supabase/functions/ai-reply/index.ts`
- **Status**: 🟢 Done

### Task T026 [P1]: Multi-Turn Logic

- **Description**: Support round tracking, parent_reply_id, max 5 rounds
- **Acceptance**: Each round inserts ai_replies row with correct round; rejects round>5; validates parent_reply_id belongs to comment; applies same input validation/timeout/content filter as T025
- **File**: `supabase/functions/ai-reply/index.ts`
- **Status**: 🟢 Done

---

## Phase 2: Frontend / 前端

### Task T027 [P1]: Poet & Post Selector UI

- **Description**: Add poet tabs + post dropdown to index.html
- **Acceptance**: Switching poet loads correct post
- **File**: `index.html`
- **Status**: 🟢 Done

### Task T028 [P1]: Multi-Turn Comment UI

- **Description**: "继续提问" button, threaded reply display
- **Acceptance**: Up to 5 rounds, history preserved on refresh
- **File**: `index.html`
- **Status**: 🟢 Done

### Task T029 [P1]: Realtime Per-Post

- **Description**: Filter realtime events by post_id
- **Acceptance**: No cross-post leakage; `ai_replies` (and `comments`) added to `supabase_realtime` publication so client receives inserts (SQL: `ALTER PUBLICATION supabase_realtime ADD TABLE ai_replies, comments;` in migration)
- **File**: `index.html` (+ `supabase/migrations/002_multi_poet.sql` for publication)
- **Status**: 🟢 Done

---

## Phase 3: Teacher Admin / 教师管理

### Task T030 [P2]: Admin Poet/Post Context

- **Description**: Show poet + post in admin comment list
- **Acceptance**: Export includes poet_name, post_title
- **File**: `index.html`
- **Status**: 🟢 Done

---

## Phase 4: Testing / 测试

### Task T031 [P1]: Integration Testing

- **Description**: Run quickstart.md scenarios A-D
- **Acceptance**: All pass, no Phase 1 regression
- **File**: `TEST_REPORT_002.md`
- **Status**: 🟢 Done

### Task T032 [P2]: UAT

- **Description**: 5 students + 3 teachers test multi-poet
- **Acceptance**: Satisfaction > 4.0/5
- **File**: `UAT_PLAN_002.md`
- **Status**: 🟢 Done

---

## Summary / 汇总

| Phase | Tasks | Count |
|-------|-------|-------|
| Phase 0 (DB) | T022-T024 | 3 |
| Phase 1 (Edge) | T025-T026 | 2 |
| Phase 2 (Frontend) | T027-T029 | 3 |
| Phase 3 (Admin) | T030 | 1 |
| Phase 4 (Test) | T031-T032 | 2 |
| **Total** | | **11** |

---

**End of Tasks**
