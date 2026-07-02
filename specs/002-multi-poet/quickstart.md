# Quickstart: 多诗人 + 多作品 + AI 多轮对话

**Feature ID**: 002  
**Created**: 2026-07-01  
**Prerequisites**: Phase 1 deployed (see `../001-ai-poet-friends/quickstart.md`)

---

## Setup / 环境准备

### 1. Apply Migration

```bash
# Testing Supabase
supabase db push --linked --project-ref gjbdqcjyliuxrnmwotvc

# Or run SQL manually in SQL Editor:
# File: supabase/migrations/002_multi_poet.sql
```

### 2. Deploy Edge Function

```bash
supabase functions deploy ai-reply --project-ref gjbdqcjyliuxrnmwotvc
```

### 3. Verify Tables

In Supabase Dashboard → Table Editor, confirm:
- [ ] `poets` table exists with 4 rows (苏轼/李白/杜甫/李清照)
- [ ] `posts` table exists with Su Shi's post
- [ ] `comments` has `post_id` column
- [ ] `ai_replies` table exists

---

## Validation Scenarios / 验证场景

### Scenario A: Multi-Poet Selection (P1)

| Step | Action | Expected |
|------|--------|----------|
| A1 | Open app | Poet selector visible (苏轼/李白/杜甫/李清照) |
| A2 | Select 李白 | Post changes to Li Bai's poem |
| A3 | Submit comment | AI replies in Li Bai's style |
| A4 | Switch to 杜甫 | Different post + style |

**Pass criteria**: Each poet has distinct personality in AI reply.

---

### Scenario B: Multi-Turn Conversation (P1)

| Step | Action | Expected |
|------|--------|----------|
| B1 | Submit comment | Round 1 reply appears |
| B2 | Click "继续提问" | Input appears for follow-up |
| B3 | Submit follow-up | Round 2 reply appears (threaded) |
| B4 | Repeat up to round 5 | Max 5 rounds enforced |
| B5 | Refresh page | All rounds preserved |

**Pass criteria**: Conversation thread shows round 1→5 in order.

---

### Scenario C: Realtime Multi-Post (P2)

| Step | Action | Expected |
|------|--------|----------|
| C1 | Open 2 windows, different posts | |
| C2 | Comment on Post A (window 1) | Window 2 (Post B) does NOT see it |
| C3 | Comment on Post A (window 2) | Window 2 (Post A) sees it realtime |

**Pass criteria**: Realtime filtered by post_id correctly.

---

### Scenario D: Migration Safety (P1)

| Step | Action | Expected |
|------|--------|----------|
| D1 | After migration, load app | Old comments still visible |
| D2 | Check old comments | AI replies backfilled (round 1) |
| D3 | New comment on Su Shi post | Works normally |

**Pass criteria**: No data loss from Phase 1.

---

## Test Data / 测试数据

### Poets Seed

| Name | Dynasty | Emoji | Style |
|------|---------|-------|-------|
| 苏轼 | 北宋 | 🍶 | 豁达豪放 |
| 李白 | 唐 | 🍷 | 浪漫飘逸 |
| 杜甫 | 唐 | 🖌️ | 沉郁顿挫 |
| 李清照 | 宋 | 🌸 | 婉约清丽 |

### Sample Comments

- 李白 post: "君不见黄河之水天上来" → comment "李学士，您的诗气势磅礴！"
- 杜甫 post: "安得广厦千万间" → comment "杜工部，您心系苍生"

---

## Rollback / 回滚

If issues found:
```bash
supabase db reset --project-ref gjbdqcjyliuxrnmwotvc
# Re-deploy Phase 1 Edge Function
supabase functions deploy su-shi-reply
```

---

**End of Quickstart**
