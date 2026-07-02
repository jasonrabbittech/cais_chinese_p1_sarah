# Data Model: 多诗人 + 多作品 + AI 多轮对话

**Feature ID**: 002  
**Created**: 2026-07-01  
**Source**: Design from research.md + Phase 1 schema

---

## New Entities / 新实体

### 1. Poet (诗人)

**Table**: `poets`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | TEXT | NOT NULL, UNIQUE | Poet name (e.g. "苏轼") |
| `dynasty` | TEXT | NOT NULL | Dynasty (e.g. "北宋") |
| `bio` | TEXT | NOT NULL | Short biography |
| `avatar_emoji` | TEXT | DEFAULT '📜' | Emoji avatar |
| `system_prompt` | TEXT | NOT NULL | AI personality prompt |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**RLS**: SELECT true (public), ALL (service_role only)

**Seed Data** (Phase 2):
- 苏轼 (北宋) — existing
- 李白 (唐) — "诗仙"
- 杜甫 (唐) — "诗圣"
- 李清照 (宋) — "千古第一才女"

---

### 2. Post (帖子/作品)

**Table**: `posts`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `poet_id` | UUID | FK → poets.id, NOT NULL | Owning poet |
| `title` | TEXT | NOT NULL | Post title (poem name) |
| `content` | TEXT | NOT NULL | Poem content |
| `background_story` | TEXT | NULLABLE | Context/story |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation time |

**RLS**: SELECT true (public), ALL (service_role only)

**Indexes**: `idx_posts_poet_id` (poet_id)

---

### 3. AI Reply (AI 回复 - Multi-Turn)

**Table**: `ai_replies` (NEW)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `comment_id` | UUID | FK → comments.id, NOT NULL | Parent comment |
| `reply_text` | TEXT | NOT NULL | AI reply content |
| `round` | INT | NOT NULL, DEFAULT 1 | Conversation round (1,2,3...) |
| `parent_reply_id` | UUID | FK → ai_replies.id, NULLABLE | Previous reply (threading) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Reply time |

**RLS**: SELECT true, INSERT (service_role only via Edge Function)

**Indexes**:
- `idx_ai_replies_comment_id` (comment_id)
- `idx_ai_replies_round` (comment_id, round)

**Constraint**: CHECK (round >= 1 AND round <= 5)

---

## Modified Entities / 修改实体

### 4. Comment (评论) — MODIFIED

**Table**: `comments` (ALTER from Phase 1)

| Field | Change | Notes |
|-------|--------|-------|
| `id` | (unchanged) | PK |
| `student_name` | (unchanged) | |
| `content` | (unchanged) | |
| `created_at` | (unchanged) | |
| `post_id` | **ADD** UUID FK → posts.id | Links comment to a post |
| `ai_reply` | **DEPRECATE** | Keep for backfill, will drop in Phase 3 |
| `replied_at` | **DEPRECATE** | Same as above |
| `is_replying` | (unchanged) | |

**Migration**: `ALTER TABLE comments ADD COLUMN post_id UUID REFERENCES posts(id);`

---

### 5. Reply Template (回复模板) — UNCHANGED

**Table**: `reply_templates` (same as Phase 1)

Note: For Phase 2, templates are poet-agnostic fallback. Future: per-poet templates.

---

## Relationships / 关系

```
poets (1) ──── (*) posts
  │
  └── posts (1) ──── (*) comments
                    │
                    └── comments (1) ──── (*) ai_replies
```

---

## State Transitions / 状态转换

### Multi-Turn Comment Lifecycle

```
[Comment Created]
    ↓
[Round 1] AI Reply generated → ai_replies (round=1)
    ↓
[Student reads reply]
    ↓
[Student asks follow-up] → [Round 2] AI Reply (round=2, parent=reply_1)
    ↓
... up to Round 5 ...
    ↓
[Conversation Ended] (max rounds reached OR student stops)
```

---

## Data Flow / 数据流

### Multi-Turn Conversation

```
Student submits comment on Post P
    ↓
INSERT comments (post_id=P, is_replying=TRUE)
    ↓
Edge Function ai-reply(comment_id):
  1. Fetch comment → post → poet (system_prompt)
  2. Fetch existing ai_replies (round history)
  3. Call DeepSeek with: system_prompt + history + new comment
  4. INSERT ai_replies (round=1, reply_text)
  5. UPDATE comments SET is_replying=FALSE
    ↓
Student reads reply, asks follow-up
    ↓
Edge Function ai-reply(comment_id, parent_reply_id):
  1. Fetch full history (round 1..N)
  2. Call DeepSeek with history + follow-up
  3. INSERT ai_replies (round=N+1, parent_reply_id)
    ↓
Realtime pushes new ai_reply → frontend appends to thread
```

---

## Query Patterns / 查询模式

| Query | Frequency | Use Case |
|-------|-----------|----------|
| SELECT * FROM poets | Low | Load poet list |
| SELECT * FROM posts WHERE poet_id=? | Medium | Load posts for poet |
| SELECT * FROM comments WHERE post_id=? ORDER BY created_at | High | Load comments for post |
| SELECT * FROM ai_replies WHERE comment_id=? ORDER BY round | High | Load conversation thread |
| INSERT ai_replies | Medium | Edge Function reply |

---

## Migration / 迁移

### 002_multi_poet.sql

```sql
-- 1. Create poets
CREATE TABLE poets (...);
INSERT INTO poets (name, dynasty, bio, system_prompt) VALUES
  ('苏轼', '北宋', '...', '...'),
  ('李白', '唐', '...', '...'),
  ('杜甫', '唐', '...', '...'),
  ('李清照', '宋', '...', '...');

-- 2. Create posts
CREATE TABLE posts (...);
INSERT INTO posts (poet_id, title, content, background_story)
  SELECT id, '水调歌头·明月几时有', '...', '...' FROM poets WHERE name='苏轼';

-- 3. Add post_id to comments
ALTER TABLE comments ADD COLUMN post_id UUID REFERENCES posts(id);
UPDATE comments SET post_id = (SELECT id FROM posts LIMIT 1);

-- 4. Create ai_replies
CREATE TABLE ai_replies (...);

-- 5. Backfill from comments.ai_reply
INSERT INTO ai_replies (comment_id, reply_text, round)
  SELECT id, ai_reply, 1 FROM comments WHERE ai_reply IS NOT NULL;
```

---

**End of Data Model**
