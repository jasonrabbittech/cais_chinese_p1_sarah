# Implementation Plan: AI 古代诗人朋友圈教学小程序

**Feature ID**: 001  
**Feature Name**: ai-poet-friends  
**Plan Version**: 2.0 (Updated based on actual codebase)  
**Created**: 2026-07-01  
**Last Updated**: 2026-07-01  
**Status**: Ready for Implementation

---

## Technical Context / 技术上下文

### Technology Stack (Actual Implementation)

| Component | Technology | Version | Justification |
|-----------|--------------|---------|----------------|
| **Frontend** | HTML5 + CSS3 + Vanilla JS | ES2022 | Static site, deployed to GitHub Pages |
| **Backend** | Supabase | v2.x | Database, Auth, Edge Functions |
| **Database** | PostgreSQL (via Supabase) | 15.x | 2 tables: `comments`, `reply_templates` |
| **Edge Functions** | Deno + TypeScript | Deno 1.46+ | `su-shi-reply` function for AI |
| **AI Service** | DeepSeek API | v1 | Cost-effective, good Chinese support |
| **CI/CD** | GitHub Actions | - | Auto-deploy to GitHub Pages + Supabase |

---

### Dependencies / 依赖

#### Frontend Dependencies
- **Supabase JS Client**: `@supabase/supabase-js@2.x` (CDN)
- **No build tools**: Static site (constitution compliant)

#### Backend Dependencies
- **Supabase CLI**: For Edge Function deployment
- **Deno Standard Library**: For Edge Function development

#### External APIs
- **DeepSeek API**: For AI reply generation
  - Endpoint: `https://api.deepseek.com/v1/chat/completions`
  - Authentication: Bearer token (in Supabase Secrets)
  - Rate limit: 50 requests/minute (free tier)

---

### Storage Requirements / 存储需求 (Actual)

| Data Type | Storage Solution | Estimated Size (Phase 1) |
|-----------|-------------------|----------------------------|
| Comments | Supabase PostgreSQL (`comments` table) | < 10 MB (50 students × 200 comments) |
| AI Replies | Stored in `comments.ai_reply` field | Included above |
| Reply Templates | Supabase PostgreSQL (`reply_templates` table) | < 1 MB (16 templates) |
| Likes | localStorage (not persisted) | N/A |
| **Total** | - | **< 20 MB** (within Supabase free tier 500 MB) |

---

### Testing Strategy / 测试策略

#### Manual Testing
- **Frontend + Supabase**: Test in browser (Chrome + Safari)
- **Edge Function + DeepSeek API**: Test via Supabase Dashboard

#### User Acceptance Testing (UAT)
- **Students**: 5 students test comment + AI reply flow
- **Teachers**: 3 teachers test admin panel functionality

---

## Constitution Check / 宪法检查

### Pre-Implementation Compliance Check

| Constitution Principle | Requirement | Compliance Status | Notes |
|---------------------|-----------------|-------------------|-------|
| **I. Supabase-First** | All backend MUST use Supabase | ✅ PASS | DB + Edge Functions via Supabase |
| **II. Edge Functions for AI** | AI API calls via Edge Functions | ✅ PASS | `su-shi-reply` function implemented |
| **III. Static Site Deployment** | Frontend MUST be static | ✅ PASS | HTML/CSS/JS, GitHub Pages |
| **IV. Security by Default** | No API keys in frontend | ✅ PASS | Keys in Supabase Secrets |
| **V. GitHub Flow** | Develop on `testing`, merge via PR | ✅ PASS | Workflow defined |
| **VI. AI Content Safety** | Filter AI content | ⚠️ PARTIAL | Basic filtering, enhance in Phase 2 |
| **VII. Code Quality** | Prettier, JSDoc, error handling | ✅ PASS | Will follow in implementation |
| **VIII. Spec-Driven** | Follow spec → plan → tasks | ✅ IN PROGRESS | At plan phase |

**Result**: ✅ **PASS** - All MUST principles compliant.

---

## Project Structure / 项目结构 (Actual)

### Current Project Structure (As-Is)

```
Sarah-AI-Sushi/
├── index.html              # ✅ Main frontend (student view + admin)
├── edge-function.ts        # ✅ Edge Function code (su-shi-reply)
├── supabase/
│   ├── migrations/        # ❌ Missing (need to create)
│   └── sync_v2.sql        # ✅ Sync script (generated)
├── .github/
│   └── workflows/         # ✅ GitHub Actions (configured)
├── specs/
│   └── 001-ai-poet-friends/
│       ├── spec.md        # ✅ Feature specification
│       ├── plan.md        # ✅ This file
│       └── tasks.md       # ✅ Task breakdown
├── README.md
├── SUPABASE_SETUP.md
└── .specify/
```

### Recommended Project Structure (To-Be)

```
Sarah-AI-Sushi/
├── index.html              # ✏️ Keep: Single-file app (student + admin)
├── css/
│   └── style.css          # 🆕 Extract: Separate CSS for maintainability
├── js/
│   ├── app.js             # 🆕 Extract: Main application logic
│   ├── admin.js           # 🆕 Extract: Admin panel logic
│   └── supabase-client.js # 🆕 Extract: Supabase client init
├── edge-functions/
│   └── su-shi-reply/
│       └── index.ts        # 🆕 Move: From root to here
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # 🆕 Create: DB schema
└── ... (other files)
```

**Decision**: Keep `index.html` as single-file app for Phase 1 (simpler deployment). Extract to separate files in Phase 2.

---

## Data Model / 数据模型 (Actual)

### Entity Relationship Diagram (ERD)

```
┌─────────────────────┐
│    comments         │
├─────────────────────┤
│ id (PK)            │
│ student_name       │
│ content            │
│ created_at         │
│ ai_reply           │  (stores AI reply directly)
│ replied_at         │
│ is_replying        │  (prevents duplicate AI calls)
└─────────────────────┘

┌─────────────────────┐
│  reply_templates    │
├─────────────────────┤
│ id (PK)            │
│ type               │  (generic / smart)
│ keyword            │  (for smart templates)
│ reply              │
│ created_at         │
│ updated_at         │
└─────────────────────┘
```

---

### Table Definitions / 表定义 (Actual)

#### 1. `comments` Table

```sql
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ai_reply TEXT,  -- AI reply stored directly here
  replied_at TIMESTAMPTZ,
  is_replying BOOLEAN DEFAULT FALSE  -- Prevents duplicate AI calls
);

-- Indexes
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
```

**RLS Policies**:
```sql
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read" ON comments FOR SELECT USING (true);
CREATE POLICY "Allow insert" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete" ON comments FOR DELETE USING (true);
CREATE POLICY "Allow update" ON comments FOR UPDATE USING (true);
```

---

#### 2. `reply_templates` Table

```sql
CREATE TABLE reply_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('generic', 'smart')),
  keyword TEXT,  -- Comma-separated keywords for smart templates
  reply TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX reply_templates_pkey ON reply_templates(id);
```

**RLS Policies**:
```sql
ALTER TABLE reply_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select" ON reply_templates FOR SELECT USING (true);
CREATE POLICY "Allow all for service_role" ON reply_templates 
  FOR ALL USING (auth.role() = 'service_role');
```

---

### Key Differences from Original Spec

| Original Spec (spec.md) | Actual Implementation | Reason |
|--------------------------|----------------------|--------|
| Separate `ai_replies` table | `ai_reply` field in `comments` | Simpler, fewer joins |
| `posts` table | Hardcoded in `index.html` | Only 1 post in Phase 1 |
| `likes` table | `localStorage` (not persisted) | Phase 1 MVP, simplify |
| `is_deleted` field | Hard delete (no soft delete) | Phase 1 simplification |

---

## Architecture Design / 架构设计

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Student / Teacher)                │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  index.html (Login → Post → Comment → AI Reply)  │    │
│  │             + Admin Panel (hidden)                  │    │
│  └─────────────────┬───────────────────────────────────┘    │
│                    │                                        │
│                    │ Supabase JS Client                     │
│                    │                                        │
└────────────────────┼────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Supabase (Production / Testing)                  │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────┐   │
│  │  Database   │  │  Realtime  │  │ Edge Functions  │   │
│  │  (comments, │  │  (Optional) │  │  (su-shi-reply)│   │
│  │   reply_    │  │              │  │                 │   │
│  │   templates)│  │              │  │                 │   │
│  └────────────┘  └────────────┘  └────────┬────────┘   │
│                                               │          │
└─────────────────────────────────────────────────┼──────────┘
                                                    │
                                                    ↓
                                         ┌──────────────────┐
                                         │   DeepSeek API    │
                                         │  (AI Reply Gen)  │
                                         └──────────────────┘
```

---

### Data Flow / 数据流 (Actual)

#### Student Comment Flow

```
1. Student enters name → localStorage.setItem('studentName', name)
2. Student views post → Hardcoded in index.html
3. Student submits comment → 
   a. INSERT into comments table (is_replying = TRUE)
   b. Show "诗人正在思考中..." message
4. Edge Function triggered (via frontend fetch, not DB trigger) →
   a. Fetch comment from DB
   b. Call DeepSeek API with system prompt + comment
   c. Receive AI reply text
   d. UPDATE comments SET ai_reply = ..., replied_at = ..., is_replying = FALSE
5. Frontend polls OR uses Realtime to detect reply → Display reply
```

**Note**: Current implementation uses frontend-triggered Edge Function call (not DB trigger).

#### Teacher Admin Flow

```
1. Teacher clicks "教师入口" button → Show login modal
2. Teacher enters password (`cais2024`) → Validate in frontend
3. If correct → Show admin panel (same index.html, different view)
4. Teacher actions:
   a. View comments → SELECT * FROM comments ORDER BY created_at DESC
   b. Delete comment → DELETE FROM comments WHERE id = ...
   c. Download CSV → Generate in browser, trigger download
   d. View statistics → COUNT queries on comments table
   e. Edit reply template → UPDATE reply_templates SET reply = ... WHERE id = ...
```

---

## Complexity Tracking / 复杂性跟踪

### Complexity Assessment by Feature (Actual)

| Feature | Complexity | Justification | Status |
|---------|-------------|----------------|--------|
| Student Login | 🟢 Low | localStorage | ✅ Implemented |
| Display Post | 🟢 Low | Hardcoded HTML | ✅ Implemented |
| Comment Functionality | 🟡 Medium | DB insert, validation | ✅ Implemented |
| AI Reply | 🔴 High | Edge Function + DeepSeek API | ✅ Implemented |
| Teacher Login | 🟢 Low | Hardcoded password | ✅ Implemented |
| Teacher Delete Comment | 🟢 Low | DB delete | ✅ Implemented |
| Teacher Download CSV | 🟢 Low | Client-side generation | ✅ Implemented |
| Teacher View Statistics | 🟡 Medium | COUNT queries | ✅ Implemented |
| Teacher Edit Reply Template | 🟡 Medium | DB update + UI | ✅ Implemented |
| Like Functionality | 🟢 Low | localStorage (not persisted) | ⚠️ Partial |
| Responsive Design | 🟡 Medium | CSS media queries | ✅ Implemented |
| Profanity Filter | 🟡 Medium | Frontend + Edge Function | ✅ Implemented |

**Overall Complexity**: 🟡 **Medium** - Most features implemented, need to enhance.

---

## Research Findings / 研究发现 (Phase 0)

### Decision 1: Database Schema Simplification

**Decision**: Use `ai_reply` field in `comments` table instead of separate `ai_replies` table.

**Rationale**:
- Simpler queries (no JOIN needed)
- Phase 1 only has 1 post, 1 poet
- Can migrate to separate table in Phase 2 if needed

**Alternatives Considered**:
- Separate `ai_replies` table (more normalized, but overkill for Phase 1)

---

### Decision 2: Likes Not Persisted to Database

**Decision**: Use `localStorage` for likes (not persisted).

**Rationale**:
- Phase 1 MVP: Likes are "nice-to-have", not critical
- Simplifies database schema (no `likes` table)
- Can add `likes` table in Phase 2

**Alternatives Considered**:
- Create `likes` table (would require user accounts for uniqueness)

---

### Decision 3: Teacher Password Hardcoded

**Decision**: Store teacher password in frontend code (Phase 1).

**Rationale**:
- Phase 1 MVP: Only 1 teacher, simple authentication
- Security risk is low (only admin actions are delete/edit)
- Phase 2: Move to Supabase Auth or environment variable

**Alternatives Considered**:
- Supabase Auth (overkill for Phase 1)
- Environment variable (requires Edge Function to validate)

---

### Decision 4: AI Reply via Frontend-Triggered Edge Function

**Decision**: Frontend calls Edge Function directly (not DB trigger).

**Rationale**:
- Simpler to implement (no DB trigger setup)
- Edge Function returns reply immediately (can display without polling)
- Phase 2: Can switch to DB trigger + Realtime for better UX

**Alternatives Considered**:
- DB trigger → Edge Function (more complex, requires `supabase/functions` setup)

---

## Remaining Tasks / 剩余任务

Based on actual implementation status, remaining tasks are:

### P1 (Must-Have)

| Task ID | Task | Status | Notes |
|---------|------|--------|-------|
| DB-001 | Create `supabase/migrations/001_initial_schema.sql` | ❌ TODO | For version control |
| DB-002 | Sync testing DB with production | ✅ DONE | Used `sync_v2.sql` |
| FE-001 | Persist likes to database | ❌ TODO | Currently localStorage |
| BE-001 | Add input validation to Edge Function | ❌ TODO | Sanitize user input |
| TEST-001 | Test AI reply generation | ❌ TODO | Verify DeepSeek API works |
| DOC-001 | Update `SUPABASE_SETUP.md` | ❌ TODO | Document actual schema |

### P2 (Should-Have)

| Task ID | Task | Status | Notes |
|---------|------|--------|-------|
| FE-002 | Add loading state for AI reply | ❌ TODO | Show spinner while generating |
| FE-003 | Improve error handling | ❌ TODO | Show user-friendly errors |
| BE-002 | Add rate limiting to Edge Function | ❌ TODO | Prevent abuse |
| BE-003 | Log AI interactions for debugging | ❌ TODO | Store in `audit_logs` table |
| TEST-002 | User acceptance testing | ❌ TODO | 5 students + 3 teachers |
| DOC-002 | Create `QUICKSTART.md` | ❌ TODO | How to run locally |

---

## Risks and Mitigation / 风险和缓解措施

| Risk | Impact | Likelihood | Mitigation | Status |
|------|---------|-------------|-------------|--------|
| DeepSeek API unavailable | 🔴 High | 🟡 Medium | Fallback message, log error | ✅ Implemented |
| Supabase free tier limits | 🟡 Medium | 🟢 Low | Monitor usage, upgrade if needed | ⚠️ Monitor |
| AI reply quality poor | 🟡 Medium | 🟡 Medium | Improve system prompt, teacher can edit | ✅ Implemented |
| Concurrent users | 🟢 Low | 🟢 Low | Edge Functions auto-scale | ✅ OK |
| Student name profanity | 🟡 Medium | 🟡 Medium | Basic profanity filter | ✅ Implemented |
| Teacher password exposed | 🟡 Medium | 🟢 Low | Phase 2: Move to env variable | ⚠️ TODO |

---

## Success Criteria Mapping / 成功标准映射

| Success Criterion | How to Verify | Task IDs | Status |
|------------------|-----------------|----------|--------|
| SC-001: 80% student engagement | Analytics dashboard | FE-003 | ❌ TODO |
| SC-002: AI reply <5s (P95) | Log timestamps | TEST-001 | ❌ TODO |
| SC-003: Teacher task completion | UAT with 3 teachers | TEST-002 | ❌ TODO |
| SC-004: Cross-device usability | Manual testing | TEST-002 | ❌ TODO |
| SC-005: Data accuracy 100% | Automated tests | TEST-001 | ❌ TODO |

---

## Next Steps / 下一步

After this plan is updated:

1. ✅ **Update `tasks.md`** (if needed)
   - Reflect actual implementation status
   - Mark completed tasks
   - Add remaining tasks

2. ✅ **Implement remaining P1 tasks**
   - Focus on: DB migration, input validation, testing

3. ✅ **Test against success criteria**
   - Run verification tests
   - Ensure all functional requirements met

4. ✅ **Deploy to staging (`testing` branch)**
   - Push to `testing` → Auto-deploy via GitHub Actions
   - Verify in staging environment

5. ✅ **Merge to `main` (after approval)**
   - Create PR: `testing` → `main`
   - Wait for approval
   - Auto-deploy to production

---

## Technical Debt / 技术债务

The following items are **intentionally simplified in Phase 1** and must be addressed in Phase 2 before scaling.

| Debt Item | Priority | Effort | Risk if Not Fixed | Phase 2 Task |
|-----------|----------|--------|-------------------|--------------|
| **Likes not persisted** | P1 | 2 hours | Students confused why likes disappear on refresh | Create `likes` table, update T005 |
| **Teacher password hardcoded** | P1 | 3 hours | Password exposed in frontend code (security risk) | Move to Edge Function or Supabase Auth |
| **Hard delete (not soft)** | P2 | 1 hour | Cannot audit deleted comments | Add `is_deleted` field, update T011 |
| **No analytics logging** | P2 | 2 hours | Cannot measure SC-001, SC-002 automatically | Add `analytics_events` table |
| **FR-010 not implemented** | P2 | 2 hours | Teachers cannot edit AI replies | Implement T015 |

**Decision**: These items are **acceptable for Phase 1 MVP** (single class, single teacher, <50 students). **Must be fixed before Phase 2** (multiple classes, multiple teachers, >100 students).

---

**End of Plan (v2.1)**
