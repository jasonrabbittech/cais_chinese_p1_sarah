# Implementation Plan: 多诗人 + 多作品 + AI 多轮对话

**Feature ID**: 002  
**Feature Name**: multi-poet  
**Plan Version**: 1.0  
**Created**: 2026-07-01  
**Status**: Ready for Implementation (Phase 0/1 Complete)

---

## Technical Context / 技术上下文

### Technology Stack (Inherited from Phase 1)

| Component | Technology | Version | Justification |
|-----------|--------------|---------|----------------|
| **Frontend** | HTML5 + CSS3 + Vanilla JS | ES2022 | Static site, GitHub Pages |
| **Backend** | Supabase | v2.x | DB, Auth, Realtime |
| **Database** | PostgreSQL (via Supabase) | 15.x | `poets`, `posts`, `comments`, `ai_replies`, `reply_templates` |
| **Edge Functions** | Deno + TypeScript | Deno 1.46+ | Generic `ai-reply` function (replaces `su-shi-reply`) |
| **AI Service** | DeepSeek API | v1 | Multi-poet system prompts |
| **CI/CD** | GitHub Actions | - | Auto-deploy to GitHub Pages + Supabase |

### New Dependencies for Phase 2

| Item | Purpose |
|------|---------|
| `poets` table | Store poet metadata + system prompt |
| `posts` table | Store poem/posts, linked to poet |
| `ai_replies` table | Store multi-turn conversation replies |
| Generic Edge Function | `ai-reply` (poet-agnostic) |

### Storage Requirements (Phase 2 Estimates)

| Data Type | Storage | Est. Size |
|-----------|---------|-----------|
| poets | `poets` table | < 100 KB (10 poets) |
| posts | `posts` table | < 500 KB (50 posts) |
| comments | `comments` (with post_id) | ~ 2 MB |
| ai_replies | `ai_replies` (multi-turn) | ~ 5 MB |
| reply_templates | `reply_templates` | < 1 MB |
| **Total** | - | **< 10 MB** (within free tier) |

---

## Constitution Check / 宪法检查

### Pre-Implementation Compliance

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Supabase-First | All backend via Supabase | ✅ PASS | New tables + RLS |
| II. Edge Functions for AI | AI via Edge Functions | ✅ PASS | Generic `ai-reply` function |
| III. Static Site | Frontend static | ✅ PASS | No SSR, GitHub Pages |
| IV. Security by Default | No keys in frontend | ✅ PASS | Keys in Supabase Secrets |
| V. GitHub Flow | testing → main via PR | ✅ PASS | Workflow unchanged |
| VI. AI Content Safety | Filter AI content | ✅ PASS | Reuse Phase 1 filter |
| VII. Code Quality | JSDoc, error handling | ✅ PASS | Will follow |
| VIII. Spec-Driven | spec → plan → tasks | ✅ PASS | This plan |

**Result**: ✅ **PASS** - All MUST principles compliant.

---

## Phase 0: Research & Design Decisions / 研究决策

### Decision 1: Multi-Poet Architecture

**Decision**: Introduce `poets` and `posts` tables; `comments` gets `post_id` FK.

**Rationale**:
- Phase 1 hardcoded Su Shi in `su-shi-reply` Edge Function
- Need poet-agnostic architecture for李白/杜甫/李清照
- Each poet has unique `system_prompt` for AI personality

**Alternatives considered**:
- ❌ Config file in frontend (violates Constitution IV - keys/prompts exposed)
- ❌ Single `poet_name` column in comments (no metadata)
- ✅ DB-driven `poets` table (Constitution I compliant)

### Decision 2: Multi-Turn Conversation

**Decision**: New `ai_replies` table (1 comment → N replies), `conversation_round` column.

**Rationale**:
- Phase 1 stored single `ai_reply` in `comments` (no follow-up)
- Multi-turn needs history for context
- Each reply references previous reply_id (chain)

**Alternatives considered**:
- ❌ Append to `comments.ai_reply` text (no structure)
- ✅ Separate `ai_replies` table (queryable, realtime-friendly)

### Decision 3: Generic Edge Function

**Decision**: Replace `su-shi-reply` with `ai-reply` (takes `comment_id`, looks up poet via post).

**Rationale**:
- Single function serves all poets
- System prompt fetched from `poets` table
- Conversation history fetched from `ai_replies`

**Alternatives considered**:
- ❌ One function per poet (N functions, hard to maintain)
- ✅ One generic function (Constitution II compliant)

---

## Phase 1: Design Artifacts / 设计产物

### Generated Files

| File | Purpose |
|------|---------|
| `data-model.md` | New schema: poets, posts, ai_replies |
| `quickstart.md` | Validation scenarios for Phase 2 |
| `spec.md` | Feature specification |
| `tasks.md` | Task breakdown (T022-T0xx) |

### Data Model Summary (see data-model.md for full)

```
poets (1) ---- (*) posts
posts (1) ---- (*) comments
comments (1) ---- (*) ai_replies
students (implicit via comments.student_name)
```

### Key Schema Changes

1. **NEW `poets`**: id, name, dynasty, bio, avatar_emoji, system_prompt
2. **NEW `posts`**: id, poet_id (FK), title, content, background_story
3. **MODIFY `comments`**: ADD post_id (FK), REMOVE ai_reply (moved to ai_replies)
4. **NEW `ai_replies`**: id, comment_id (FK), reply_text, round, parent_reply_id, created_at

---

## Project Structure / 项目结构 (Target)

```
Sarah-AI-Sushi/
├── index.html              # ⚠️ Modify: multi-poet UI, post selector
├── edge-function.ts        # ⚠️ Rename → ai-reply (generic)
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql   # ✅ (Phase 1)
│   │   └── 002_multi_poet.sql       # 🆕 (Phase 2)
│   └── sync_v2.sql
├── .github/workflows/      # ✅ (unchanged)
└── specs/002-multi-poet/   # 🆕 (this feature)
```

---

## Migration Strategy / 迁移策略

### Backward Compatibility

Phase 1 `comments` table has `ai_reply` column. Phase 2:
1. Create new tables (`poets`, `posts`, `ai_replies`)
2. Add `post_id` to `comments` (nullable initially)
3. Migrate existing comments: assign to Su Shi's default post
4. Backfill `ai_replies` from existing `comments.ai_reply`
5. Later: drop `comments.ai_reply` (after verification)

### Deployment Order

1. Apply migration `002_multi_poet.sql` to Testing Supabase
2. Deploy generic `ai-reply` Edge Function
3. Update `index.html` (multi-poet UI)
4. Verify in staging
5. Merge to main → production

---

## Risks / 风险

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration breaks Phase 1 data | High | Backfill script, staged rollout |
| DeepSeek cost increase (multi-turn) | Medium | Rate limit + cache |
| Realtime complexity (multi-post) | Medium | Channel per post or global |

---

**End of Plan** — See `research.md`, `data-model.md`, `quickstart.md` for details.
