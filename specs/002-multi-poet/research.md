# Research: 多诗人 + 多作品 + AI 多轮对话

**Feature ID**: 002  
**Created**: 2026-07-01  
**Status**: Complete (all NEEDS CLARIFICATION resolved)

---

## Research Tasks / 研究任务

### R1: Multi-Poet Data Model

**Question**: How to support multiple poets without hardcoding?

**Decision**: DB-driven `poets` table with `system_prompt` column.

**Rationale**:
- Constitution IV forbids prompts in frontend
- Each poet needs unique AI personality
- DB table allows teacher/admin to manage poets

**Alternatives considered**:
- Config JSON in Edge Function (❌ not editable by teacher)
- Hardcoded switch statement (❌ violates Open/Closed principle)

---

### R2: Multi-Turn Conversation Storage

**Question**: How to store follow-up questions and replies?

**Decision**: Separate `ai_replies` table, 1 comment → N replies.

**Rationale**:
- Phase 1 stored single reply in `comments.ai_reply`
- Multi-turn needs conversation chain for context
- Realtime can target specific reply inserts

**Schema**:
```sql
ai_replies (
  id UUID PK,
  comment_id UUID FK → comments.id,
  reply_text TEXT,
  round INT,              -- 1, 2, 3...
  parent_reply_id UUID,   -- for threading (nullable)
  created_at TIMESTAMPTZ
)
```

---

### R3: Generic Edge Function Design

**Question**: One function per poet, or one generic function?

**Decision**: One generic `ai-reply` function.

**Flow**:
```
comment_id → fetch comment → fetch post → fetch poet → 
fetch conversation history (ai_replies) → call DeepSeek →
insert ai_reply (round = max+1)
```

**Rationale**: Maintainability, Constitution II compliance.

---

### R4: Realtime for Multi-Post

**Question**: How to handle realtime across multiple posts?

**Decision**: Single channel `comments-channel`, filter by post_id in handler.

**Rationale**:
- Supabase Realtime channels are limited (free tier: 200 concurrent)
- Client filters relevant post_id client-side
- Simpler than per-post channels

---

### R5: Migration Safety

**Question**: How to migrate Phase 1 data without loss?

**Decision**: Staged migration with backfill.

**Steps**:
1. Create `poets` (insert Su Shi as default)
2. Create `posts` (insert Su Shi's 水调歌头 post)
3. Add `post_id` to `comments` (nullable)
4. UPDATE all existing comments → post_id = su_shi_post
5. Create `ai_replies`, backfill from `comments.ai_reply`
6. Keep `comments.ai_reply` for 1 release (then drop)

---

## Open Questions Resolved / 已解决问题

| Question | Resolution |
|----------|------------|
| Which poets for Phase 2? | 李白、杜甫、李清照 + 苏轼 (4 total) |
| How many posts per poet? | Start with 1-2 each, extensible |
| Multi-turn limit? | Max 5 rounds per comment (prevent abuse) |
| Teacher can add poets? | Phase 2: admin SQL only; UI in Phase 3 |

---

**End of Research**
