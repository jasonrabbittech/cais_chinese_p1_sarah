# Data Model: AI 古代诗人朋友圈教学小程序

**Feature ID**: 001  
**Created**: 2026-07-01  
**Source**: Actual database schema from production environment

---

## Entities / 实体

### 1. Comment (评论)

**Table**: `comments`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `student_name` | TEXT | NOT NULL | Student's name (no auth in Phase1) |
| `content` | TEXT | NOT NULL | Comment text (max 500 chars) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Comment timestamp |
| `ai_reply` | TEXT | NULLABLE | AI-generated reply (stored directly) |
| `replied_at` | TIMESTAMPTZ | NULLABLE | AI reply timestamp |
| `is_replying` | BOOLEAN | DEFAULT FALSE | Prevents duplicate AI calls |

**Indexes**:
- `comments_pkey` (unique, on `id`)
- `idx_comments_created_at` (desc, on `created_at`)

**RLS Policies**:
- Allow read: `USING (true)`
- Allow insert: `WITH CHECK (true)`
- Allow delete: `USING (true)`
- Allow update: `USING (true)`

**Validation Rules**:
- `student_name`: Non-empty, max 50 chars
- `content`: Non-empty, max 500 chars, profanity filter

---

### 2. Reply Template (回复模板)

**Table**: `reply_templates`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `type` | TEXT | NOT NULL, CHECK IN ('generic', 'smart') | Template type |
| `keyword` | TEXT | NULLABLE | Comma-separated keywords (smart only) |
| `reply` | TEXT | NOT NULL | Template reply text |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `reply_templates_pkey` (unique, on `id`)

**RLS Policies**:
- Allow select: `USING (true)`
- Allow all (service_role): `USING (auth.role() = 'service_role')`

**Validation Rules**:
- `type`: Must be 'generic' or 'smart'
- `keyword`: Required for 'smart' type, comma-separated
- `reply`: Non-empty, max 500 chars

---

## Relationships / 关系

### Current Schema (Phase 1)

```
comments (1) ---- (0..1) comments.ai_reply
  - AI reply stored directly in comments table
  - No foreign key relationship needed
```

### Future Schema (Phase 2)

```
posts (1) ---- (*) comments
comments (1) ---- (1) ai_replies
students (1) ---- (*) comments
```

---

## State Transitions / 状态转换

### Comment Lifecycle

```
[Created] → [Pending AI Reply] → [AI Replied] → [Deleted]
    │                                      │
    │                                      ├─→ [Edited by Teacher]
    │                                      │
    └─→ [AI Failed] → [Fallback Message]
```

**States**:
1. **Created**: Comment inserted, `is_replying = FALSE`
2. **Pending AI Reply**: Frontend triggered Edge Function, `is_replying = TRUE`
3. **AI Replied**: `ai_reply` filled, `replied_at` set, `is_replying = FALSE`
4. **AI Failed**: Edge Function error, `ai_reply = "诗人正在思考中，请稍后再来..."`
5. **Deleted**: Comment deleted from DB (hard delete in Phase1)
6. **Edited by Teacher**: `ai_reply` updated by teacher (Phase2)

---

## Data Flow / 数据流

### Create Comment + Generate AI Reply

```
Student submits comment
    ↓
INSERT INTO comments (student_name, content, is_replying = TRUE)
    ↓
Frontend calls Edge Function (su-shi-reply) with comment_id
    ↓
Edge Function:
  1. Fetch comment from DB
  2. Call DeepSeek API with system prompt + comment
  3. Receive AI reply text
  4. UPDATE comments SET ai_reply = ..., replied_at = ..., is_replying = FALSE
    ↓
Frontend polls OR uses Realtime to detect reply
    ↓
Display reply to student
```

---

## Query Patterns / 查询模式

### Frequent Queries

| Query | Frequency | Use Case |
|--------|-----------|----------|
| SELECT * FROM comments ORDER BY created_at DESC | High | Load all comments on page load |
| INSERT INTO comments (...) | Medium | Student submits comment |
| UPDATE comments SET ai_reply = ... | Medium | Edge Function adds AI reply |
| DELETE FROM comments WHERE id = ... | Low | Teacher deletes comment |
| SELECT * FROM reply_templates | Low | Edge Function fetches templates |
| SELECT COUNT(*) FROM comments | Low | Teacher views statistics |

---

## Indexing Strategy / 索引策略

| Table | Index | Reason |
|-------|--------|--------|
| `comments` | `idx_comments_created_at` (DESC) | Frequent ORDER BY created_at DESC |
| `reply_templates` | `reply_templates_pkey` | Primary key lookup |

**Future Indexes** (Phase 2):
- `comments(student_name)` - For filtering by student
- `comments(post_id)` - For multiple posts support

---

## Data Volume Estimates / 数据量估算

### Phase 1 (Single Class, Single Post)

| Table | Records | Size |
|-------|---------|------|
| `comments` | 200 (50 students × 4 comments) | ~ 200 KB |
| `reply_templates` | 16 (8 generic + 8 smart) | ~ 16 KB |
| **Total** | **216** | **< 1 MB** |

### Phase 2 (Multiple Classes, Multiple Poets)

| Table | Records | Size |
|-------|---------|------|
| `comments` | 2,000 (10 classes × 50 students × 4 comments) | ~ 2 MB |
| `reply_templates` | 100 (10 poets × 10 templates) | ~ 100 KB |
| **Total** | **2,100** | **< 5 MB** |

**Conclusion**: Well within Supabase free tier (500 MB database).

---

## Data Integrity / 数据完整性

### Constraints

| Constraint | Table | Field | Rule |
|------------|-------|-------|------|
| PRIMARY KEY | `comments` | `id` | Unique UUID |
| PRIMARY KEY | `reply_templates` | `id` | Unique UUID |
| CHECK | `reply_templates` | `type` | IN ('generic', 'smart') |
| NOT NULL | `comments` | `student_name`, `content` | Required fields |
| NOT NULL | `reply_templates` | `type`, `reply` | Required fields |

### Future Constraints (Phase 2)

| Constraint | Table | Fields | Rule |
|------------|-------|--------|------|
| FOREIGN KEY | `comments` | `post_id` | REFERENCES posts(id) |
| UNIQUE | `likes` | `post_id`, `student_name` | One like per student per post |
| CHECK | `comments` | `content` | length(content) <= 500 |

---

**End of Data Model**
