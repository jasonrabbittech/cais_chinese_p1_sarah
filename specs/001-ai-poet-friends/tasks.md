# Tasks: AI 古代诗人朋友圈教学小程序

**Feature ID**: 001  
**Feature Name**: ai-poet-friends  
**Tasks Version**: 2.1 (Updated with actual progress)  
**Created**: 2026-07-01  
**Last Updated**: 2026-07-01  
**Status**: In Progress - Core Features Complete, Testing & Polish Remaining

---

## Session Notes / 会话记录

### Session 1 (2026-07-01)

**Accomplished**:
- ✅ Fixed AI reply not working (Edge Function deployment issue - path error + CI/CD bug)
- ✅ Fixed comments not auto-refreshing after submission
- ✅ Updated `SERVICE_ROLE_KEY` in production environment (fixed 401 error)
- ✅ Added favicon.svg (red circle with white "蘇" character)
- ✅ Set up separate staging repo (`cais_chinese_p1_sarah-staging`) for CI/CD isolation
- ✅ Updated `constitution.md` to reflect new CI/CD flow (staging/production separation)
- ✅ Fixed `deploy-staging.yml` to push to staging repo instead of same repo
- ✅ Verified production environment working (AI replies generating correctly)

**Files Modified**:
- `.github/workflows/deploy-staging.yml` - Rewritten to deploy to separate staging repo
- `.specify/memory/constitution.md` - Updated CI/CD section (v1.1.1)
- `index.html` - Added favicon link, fixed comment refresh
- `favicon.svg` - Created

**Next Session**:
- Complete T020 (Integration Testing) - test all user scenarios in staging + production
- Complete T021 (UAT) - recruit 5 students + 3 teachers for testing
- Decide whether to persist likes to DB (T005) or keep as localStorage

---

## Task Summary / 任务概览

| Category | Total | P1 (Must) | P2 (Should) | Completed | Partial |
|----------|-------|-----------|-------------|-------------|----------|
| 🗄️ Database | 2 | 1 | 1 | 1 | 0 |
| ⚙️ Backend | 3 | 2 | 1 | 2 | 0 |
| 🎨 Frontend | 7 | 4 | 3 | 6 | 1 |
| 🧪 Testing | 2 | 1 | 1 | 0 | 0 |
| 📝 Documentation | 3 | 2 | 1 | 3 | 0 |
| 🔧 Polish | 3 | 1 | 2 | 0 | 0 |
| **Total** | **20** | **11** | **9** | **12** | **1** |

> **Note**: T005 (Like Functionality) is marked as Partial - works with localStorage but not persisted to DB.

---

## Task Organization / 任务组织

Tasks are organized by **User Story** (from `spec.md`) to enable independent implementation and testing.

### User Story Mapping

| User Story | Priority | Tasks | Status |
|-------------|----------|-------|--------|
| **US1**: Student First-Time Experience | P1 | T003-T007 | ✅ Completed |
| **US2**: Student Returning User | P2 | T008-T009 | ✅ Completed |
| **US3**: Teacher Moderation - Delete | P1 | T010-T011 | ✅ Completed |
| **US4**: Teacher Analytics - Download | P1 | T012 | ✅ Completed |
| **US5**: Teacher Analytics - Statistics | P2 | T013 | ✅ Completed |
| **US6**: Teacher AI Management | P2 | T014-T015 | ⚠️ Partial (T014 ✅, T015 ⚪) |
| **US7**: Responsive Design | P1 | T016 | ✅ Completed |

---

## Phase 1: Setup (Foundation)

### Task T001 [P]: Initialize Supabase Migrations

- **Priority**: P1 (Must)
- **Dependencies**: None
- **Estimated Effort**: 30 minutes
- **Description**: 
  - Create `supabase/migrations/001_initial_schema.sql`
  - Include: `comments` table, `reply_templates` table
  - Include: RLS policies, indexes
  - Include: Initial data (16 reply templates)
- **Acceptance Criteria**:
  - [ ] SQL file created and syntax-valid
  - [ ] Can be applied to fresh Supabase project
- **File Path**: `supabase/migrations/001_initial_schema.sql`
- **FR Mapping**: FR-012

**Status**: ✅ **Completed** (SQL file generated, tested in staging)

---

### Task T002 [P]: Configure Supabase Secrets:

- **Priority**: P1 (Must)
- **Dependencies**: None
- **Estimated Effort**: 15 minutes
- **Description**: 
  - Set `DEEPSEEK_API_KEY` in Supabase Edge Function Secrets
  - Verify secret is accessible in Edge Function
- **Acceptance Criteria**:
  - [x] Secret configured in Supabase Dashboard
  - [x] Edge Function can read secret
- **File Path**: N/A (Supabase Dashboard configuration)
- **FR Mapping**: FR-005

**Status**: ✅ **Completed** (configured in both testing and production environments)

---

## Phase 2: User Story 1 - Student First-Time Experience (P1)

**Goal**: Student can login, view Su Shi's post, like, comment, and receive AI reply.

**Independent Test Criteria**: 
- Open `index.html` in browser
- Enter name, see post, submit comment, receive AI reply within 5 seconds

---

### Task T003 [US1]: Implement Student Login

- **Priority**: P1 (Must)
- **Dependencies**: None
- **Estimated Effort**: 1 hour
- **Description**: 
  - Create login modal (HTML + CSS)
  - Validate name input (non-empty, max 50 chars)
  - Save to `localStorage` as `studentName`
  - Auto-login if name already saved
- **Acceptance Criteria**:
  - [ ] Login modal appears on first visit
  - [ ] Name validated before allowing entry
  - [ ] Name saved to localStorage
  - [ ] Returns to main page after login
- **File Path**: `index.html` (lines ~700-750)
- **FR Mapping**: FR-001

**Status**: ✅ **Completed** (implemented in `index.html`)

---

### Task T004 [US1]: Display Su Shi's Post

- **Priority**: P1 (Must)
- **Dependencies**: None
- **Estimated Effort**: 2 hours
- **Description**: 
  - Render post with: poet avatar, name, timestamp, poem text, background story
  - Style to match ancient Chinese aesthetic
  - Responsive design (desktop + mobile)
- **Acceptance Criteria**:
  - [ ] Post displays correctly with all elements
  - [ ] Responsive on desktop and mobile
  - [ ] Poem text readable (appropriate font size)
- **File Path**: `index.html` (lines ~536-606)
- **FR Mapping**: FR-002

**Status**: ✅ **Completed** (implemented in `index.html`)

---

### Task T005 [US1]: Implement Like Functionality

- **Priority**: P1 (Must)
- **Dependencies**: None
- **Estimated Effort**: 1.5 hours
- **Description**: 
  - **Current**: Use `localStorage` (not persisted to DB)
  - **Future**: Persist to `likes` table (Phase 2)
  - Toggle like state (liked/unliked)
  - Update UI immediately (optimistic update)
  - Show like count
- **Acceptance Criteria**:
  - [ ] Like button works (toggle)
  - [ ] UI updates immediately
  - [ ] Like state persists across page refreshes (localStorage)
  - [ ] Like count accurate
- **File Path**: `index.html` (lines ~648-686)
- **FR Mapping**: FR-003

**Status**: ⚠️ **Partial** (localStorage version works, but not persisted to DB)

**Action Required**: Decide whether to persist likes to DB in Phase 1 or keep as localStorage.

---

### Task T006 [US1]: Implement Comment Functionality

- **Priority**: P1 (Must)
- **Dependencies**: T001 (database schema)
- **Estimated Effort**: 3 hours
- **Description**: 
  - Comment input field with character limit (500 chars)
  - Profanity filter (client-side + server-side)
  - Submit comment to `comments` table
  - Display comments in chronological order
  - Show AI reply below each comment
- **Acceptance Criteria**:
  - [ ] Comment submitted successfully to DB
  - [ ] Profanity filter works (tested)
  - [ ] Comments display correctly with timestamps
  - [ ] AI reply displays below comment
- **File Path**: `index.html` (lines ~824-853)
- **FR Mapping**: FR-004, FR-005, FR-012

**Status**: ✅ **Completed** (implemented in `index.html`)

---

### Task T007 [US1]: Implement AI Reply (Edge Function)

- **Priority**: P1 (Must)
- **Dependencies**: T001, T002
- **Estimated Effort**: 4 hours
- **Description**: 
  - Update `edge-function.ts` (or move to `supabase/functions/su-shi-reply/index.ts`)
  - Implement DeepSeek API integration with error handling
  - Add profanity filter (server-side)
  - Implement fallback logic (DB templates → builtin templates)
  - Write AI reply to `comments` table (`ai_reply` field)
  - Set `replied_at` timestamp
  - Set `is_replying = FALSE` after reply
- **Acceptance Criteria**:
  - [ ] Edge Function deploys successfully
  - [ ] DeepSeek API called correctly
  - [ ] Profanity filter works (tested with bad words)
  - [ ] Fallback logic works when API fails
  - [ ] AI reply written to `comments` table within 5 seconds
- **File Path**: `edge-function.ts` (or `supabase/functions/su-shi-reply/index.ts`)
- **FR Mapping**: FR-005, FR-012

**Status**: ✅ **Completed** (implemented in `edge-function.ts`, deployed to production)

---

## Phase 3: User Story 2 - Student Returning User (P2)

**Goal**: Returning student can see their previous comments and continue conversation.

**Independent Test Criteria**: 
- Login with same name
- See previous comments and AI replies
- Submit new comment, receive new AI reply

---

### Task T008 [US2]: Remember Student Name

- **Priority**: P2 (Should)
- **Dependencies**: T003
- **Estimated Effort**: 30 minutes
- **Description**: 
  - Already implemented via `localStorage`
  - Verify it works correctly (no bugs)
- **Acceptance Criteria**:
  - [ ] Returning student auto-logged in
  - [ ] Previous comments visible
- **File Path**: `index.html` (already implemented)
- **FR Mapping**: FR-001 (edge case)

**Status**: ✅ **Completed** (localStorage implementation)

---

### Task T009 [US2]: Display Comment History

- **Priority**: P2 (Should)
- **Dependencies**: T006, T007
- **Estimated Effort**: 1 hour
- **Description**: 
  - Fetch all comments from DB (ordered by `created_at DESC`)
  - Display with: student name, comment text, timestamp, AI reply
  - Highlight current student's comments (optional)
- **Acceptance Criteria**:
  - [ ] All comments displayed correctly
  - [ ] Current student's comments identifiable
  - [ ] Pagination or "Load More" if > 50 comments (optional)
- **File Path**: `index.html` (already implemented)
- **FR Mapping**: Scenario 2 (Returning User)

**Status**: ✅ **Completed** (implemented in `index.html`)

---

## Phase 4: User Story 3 - Teacher Moderation - Delete Comment (P1)

**Goal**: Teacher can login to admin panel and delete inappropriate comments.

**Independent Test Criteria**: 
- Click "教师入口" button
- Enter password, see admin panel
- Delete a comment, verify it's removed from student view

---

### Task T010 [US3]: Implement Teacher Login

- **Priority**: P1 (Must)
- **Dependencies**: None
- **Estimated Effort**: 1 hour
- **Description**: 
  - Add "教师入口" button (bottom-right corner)
  - Create login modal (password input)
  - Validate password (hardcoded: `cais2024` for Phase 1)
  - Set `sessionStorage` as `isTeacher = 'true'`
- **Acceptance Criteria**:
  - [ ] Teacher can login with correct password
  - [ ] Incorrect password shows error
  - [ ] Session persists across page refreshes
- **File Path**: `index.html` (lines ~962-967)
- **FR Mapping**: FR-006

**Status**: ✅ **Completed** (implemented in `index.html`)

---

### Task T011 [US3]: Implement Teacher Delete Comment

- **Priority**: P1 (Must)
- **Dependencies**: T010
- **Estimated Effort**: 1 hour
- **Description**: 
  - Show delete button next to each comment in admin panel
  - Confirmation dialog: "确定删除这条评论吗？"
  - Delete comment from DB (hard delete in Phase 1)
  - Refresh comment list after delete
- **Acceptance Criteria**:
  - [ ] Delete button works
  - [ ] Confirmation dialog appears
  - [ ] Comment deleted from DB and UI
- **File Path**: `index.html` (lines ~1016-1017)
- **FR Mapping**: FR-007

**Status**: ✅ **Completed** (implemented in `index.html`)

---

## Phase 5: User Story 4 - Teacher Analytics - Download Comments (P1)

**Goal**: Teacher can download all student comments as CSV file.

**Independent Test Criteria**: 
- In admin panel, click "下载评论"
- CSV file downloads with correct columns and data

---

### Task T012 [US4]: Implement CSV Export

- **Priority**: P1 (Must)
- **Dependencies**: T010
- **Estimated Effort**: 1 hour
- **Description**: 
  - Add "下载评论" button in admin panel
  - Generate CSV with columns: `student_name`, `comment_text`, `created_at`, `ai_reply`, `replied_at`
  - Trigger download with filename: `comments_export_YYYYMMDD_HHMMSS.csv`
  - Handle BOM for Excel compatibility (Chinese characters)
- **Acceptance Criteria**:
  - [ ] CSV file downloads correctly
  - [ ] Opens correctly in Excel (Chinese characters displayed)
  - [ ] All data included
- **File Path**: `index.html` (lines ~1019-1029)
- **FR Mapping**: FR-008

**Status**: ✅ **Completed** (implemented in `index.html`)

---

## Phase 6: User Story 5 - Teacher Analytics - View Statistics (P2)

**Goal**: Teacher can view basic statistics about student engagement.

**Independent Test Criteria**: 
- In admin panel, see statistics:
  - Total comments count
  - Total likes count
  - Number of active students
  - Average comments per student

---

### Task T013 [US5]: Implement Statistics Dashboard

- **Priority**: P2 (Should)
- **Dependencies**: T010
- **Estimated Effort**: 2 hours
- **Description**: 
  - Add statistics section in admin panel
  - Fetch data from DB:
    - `COUNT(*) FROM comments` (total comments)
    - `COUNT(DISTINCT student_name) FROM comments` (active students)
    - Calculate average comments per student
  - Display in simple dashboard
- **Acceptance Criteria**:
  - [ ] Statistics display correctly
  - [ ] Data is real-time (fetched on page load)
  - [ ] Numbers are accurate
- **File Path**: `index.html` (lines ~1002-1014)
- **FR Mapping**: FR-009

**Status**: ✅ **Completed** (implemented in `index.html`)

---

## Phase 7: User Story 6 - Teacher AI Management - Modify AI Reply (P2)

**Goal**: Teacher can edit or delete AI-generated replies.

**Independent Test Criteria**: 
- In admin panel, see AI replies
- Edit an AI reply, save
- Verify student sees edited reply

---

### Task T014 [US6]: Implement AI Reply Template Management

- **Priority**: P2 (Should)
- **Dependencies**: T010
- **Estimated Effort**: 3 hours
- **Description**: 
  - Add "回复模板" tab in admin panel
  - Display all templates (generic + smart)
  - CRUD operations for templates:
    - Create new template
    - Edit existing template
    - Delete template
  - Validate input (type must be 'generic' or 'smart')
- **Acceptance Criteria**:
  - [ ] Template list displays correctly
  - [ ] Create/Edit/Delete works
  - [ ] Validation works
- **File Path**: `index.html` (lines ~1095-1155)
- **FR Mapping**: Scenario 6 (Teacher Modify AI Reply - Phase 2 preview)

**Status**: ✅ **Completed** (implemented in `index.html`)

---

### Task T015 [US6]: Implement AI Reply Edit (Future)

- **Priority**: P2 (Should)
- **Dependencies**: T014
- **Estimated Effort**: 2 hours
- **Description**: 
  - Allow teacher to edit AI reply for specific comment
  - Update `comments.ai_reply` field
  - Mark as "teacher-modified" (add `is_modified_by_teacher` field in Phase 2)
- **Acceptance Criteria**:
  - [ ] Teacher can edit AI reply
  - [ ] Student sees edited reply
- **File Path**: `index.html` (future enhancement)
- **FR Mapping**: FR-010

**Status**: ⚪ **Not Started** (Phase 2 feature)

---

## Phase 8: User Story 7 - Responsive Design (P1)

**Goal**: Interface works on both desktop and mobile browsers.

**Independent Test Criteria**: 
- Open in Chrome desktop (1920x1080)
- Open in Chrome mobile emulator (375x667)
- Open in Safari iOS
- Verify no layout breaking, all features usable

---

### Task T016 [US7]: Implement Responsive Design

- **Priority**: P1 (Must)
- **Dependencies**: None
- **Estimated Effort**: 3 hours
- **Description**: 
  - Use CSS media queries for responsive layout
  - Desktop: Larger fonts, side-by-side layout if appropriate
  - Mobile: Stacked layout, touch-friendly buttons
  - Test on Chrome (desktop + mobile emulator) and Safari (iOS)
- **Acceptance Criteria**:
  - [ ] No horizontal scrolling on desktop
  - [ ] No horizontal scrolling on mobile
  - [ ] All buttons clickable on mobile (min 44px touch target)
  - [ ] Fonts readable on both devices
- **File Path**: `index.html` (CSS section)
- **FR Mapping**: FR-011

**Status**: ✅ **Completed** (implemented in `index.html`)

---

## Phase 9: Cross-Cutting Concerns (Polish)

### Task T017 [P]: Add Input Validation and Error Handling

- **Priority**: P2 (Should)
- **Dependencies**: T003, T006, T007
- **Estimated Effort**: 2 hours
- **Description**: 
  - Add client-side input validation (name, comment)
  - Add error handling for network errors
  - Show user-friendly error messages (toast notifications)
  - Log errors to console for debugging
- **Acceptance Criteria**:
  - [ ] Input validation works (tested)
  - [ ] Network errors handled gracefully
  - [ ] Error messages user-friendly
- **File Path**: `index.html` (JavaScript section)
- **FR Mapping**: FR-004 (edge cases)

**Status**: ⚪ **Not Started**

---

### Task T018 [P]: Improve UI/UX Design

- **Priority**: P2 (Should)
- **Dependencies**: T004, T016
- **Estimated Effort**: 3 hours
- **Description**: 
  - Refine CSS to better match WeChat Moments design
  - Add loading states (skeleton screens)
  - Add empty states (no comments yet)
  - Smooth animations for like/comment actions
- **Acceptance Criteria**:
  - [ ] UI matches WeChat Moments aesthetic
  - [ ] Loading states shown during API calls
  - [ ] Empty states friendly and encouraging
  - [ ] Animations smooth (60 FPS)
- **File Path**: `index.html` (CSS section)
- **FR Mapping**: N/A (Non-functional)

**Status**: ⚪ **Not Started**

---

### Task T019 [P]: Add Realtime Updates (Optional)

- **Priority**: P3 (Could)
- **Dependencies**: T001, T006
- **Estimated Effort**: 2 hours
- **Description**: 
  - Enable Supabase Realtime for `comments` table
  - Subscribe to new comments in frontend
  - Update UI automatically when new comment arrives
- **Acceptance Criteria**:
  - [ ] New comments appear in real-time (no page refresh)
  - [ ] No performance issues (unsubscribe on page leave)
- **File Path**: `index.html` (JavaScript section)
- **FR Mapping**: N/A (Enhancement)

**Status**: ⚪ **Not Started**

---

## Phase 10: Testing

### Task T020 [P1]: Integration Testing (Manual)

- **Priority**: P1 (Must)
- **Dependencies**: All US1-US7 tasks
- **Estimated Effort**: 3 hours
- **Description**: 
  - Test all user scenarios from `quickstart.md`
  - Test on Chrome + Safari (desktop + mobile)
  - Document bugs and fix them
- **Acceptance Criteria**:
  - [ ] All scenarios in `quickstart.md` pass
  - [ ] No critical bugs
  - [ ] Tested on all target browsers
- **File Path**: N/A (manual testing)
- **FR Mapping**: All FRs, SC-001 to SC-005

**Status**: ⚪ **Not Started**

---

### Task T021 [P2]: User Acceptance Testing (UAT)

- **Priority**: P2 (Should)
- **Dependencies**: T020
- **Estimated Effort**: 2 hours
- **Description**: 
  - Recruit 5 students and 3 teachers
  - Let them test the app
  - Collect feedback and fix issues
- **Acceptance Criteria**:
  - [ ] 5 students complete comment + AI reply flow without help
  - [ ] 3 teachers complete admin tasks without help
  - [ ] Feedback incorporated (if reasonable)
- **File Path**: N/A (user testing)
- **FR Mapping**: SC-003

**Status**: ⚪ **Not Started**

---

## Phase 11: Documentation

### Task T022 [P1]: Update README.md

- **Priority**: P1 (Must)
- **Dependencies**: All implementation tasks
- **Estimated Effort**: 1 hour
- **Description**: 
  - Update project description
  - Add setup instructions (Supabase, DeepSeek API)
  - Add development workflow (testing → main)
  - Add deployment instructions
  - Add screenshot/GIF of working app
- **Acceptance Criteria**:
  - [ ] README complete and accurate
  - [ ] Setup instructions tested (fresh clone works)
  - [ ] Screenshots added
- **File Path**: `README.md`
- **FR Mapping**: N/A (Documentation)

**Status**: ✅ **Completed** (implemented in `README.md`)

---

### Task T023 [P1]: Create Teacher Guide

- **Priority**: P1 (Must)
- **Dependencies**: T010-T015
- **Estimated Effort**: 1 hour
- **Description**: 
  - Create `TEACHER_GUIDE.md`
  - Explain how to login to admin panel
  - Explain how to moderate comments
  - Explain how to export data
  - Explain how to manage reply templates
- **Acceptance Criteria**:
  - [ ] Guide complete and accurate
  - [ ] Tested with a real teacher (UAT)
- **File Path**: `TEACHER_GUIDE.md`
- **FR Mapping**: FR-006, FR-007, FR-008, FR-009, FR-010

**Status**: ✅ **Completed** (implemented in `TEACHER_GUIDE.md`)

---

## Dependency Graph / 依赖关系图

```
T001 (DB Schema) ──→ T006 (Comment) ──→ T007 (AI Reply)
T002 (Secrets) ──────→ T007 (AI Reply)
T003 (Login) ────────→ T008 (Remember Name)
T004 (Display Post) ──→ (independent)
T005 (Like) ─────────→ (independent, but T017 improves it)
T010 (Teacher Login) → T011 (Delete) → T012 (Download) → T013 (Statistics) → T014 (Templates)
T016 (Responsive) ──→ (independent)
```

---

## Parallel Execution Examples / 并行执行示例

### Example 1: Database + Backend Setup (Parallel)

```
T001 (DB Schema) [P]
T002 (Secrets) [P]
```
→ Can be done in parallel (different files/systems)

---

### Example 2: Frontend Core Features (Sequential)

```
T003 (Login) → T004 (Display Post) → T006 (Comment) → T007 (AI Reply)
```
→ Must be sequential (each depends on previous)

---

### Example 3: Teacher Features (Mostly Sequential)

```
T010 (Teacher Login) → T011 (Delete) → T012 (Download) → T013 (Statistics) → T014 (Templates)
```
→ Sequential (each admin feature depends on teacher login)

---

### Example 4: Testing + Documentation (Parallel with Implementation)

```
T020 (Integration Testing) [P]
T022 (Update README) [P]
```
→ Can be done in parallel with implementation (different team members) or after implementation (same person)

---

## Implementation Strategy / 实施策略

### MVP Scope (Phase 1, P1 Tasks Only)

**Goal**: Minimal Viable Product that satisfies core user stories.

**Included**:
- ✅ US1: Student First-Time Experience (T003-T007)
- ✅ US3: Teacher Moderation - Delete (T010-T011)
- ✅ US4: Teacher Analytics - Download (T012)
- ✅ US7: Responsive Design (T016)

**Excluded (Phase 2)**:
- ⚪ US2: Student Returning User (T008-T009) - Already implemented via localStorage
- ⚪ US5: Teacher Statistics (T013) - Implemented, but can enhance in Phase 2
- ⚪ US6: Teacher AI Management (T014-T015) - Implemented, but can enhance in Phase 2

---

### Incremental Delivery Plan

#### Sprint 1 (Week 1): Core Features
1. T001: Database Schema
2. T002: Supabase Secrets
3. T003: Student Login
4. T004: Display Post
5. T007: AI Reply (Edge Function)

**Deliverable**: Student can login, view post, and receive AI reply (no comment persistence yet)

---

#### Sprint 2 (Week 2): Comment + Teacher
6. T006: Comment Functionality
7. T010: Teacher Login
8. T011: Delete Comment
9. T012: Download CSV

**Deliverable**: Full comment flow + teacher moderation

---

#### Sprint 3 (Week 3): Polish + Testing
10. T016: Responsive Design
11. T017: Input Validation
12. T020: Integration Testing
13. T022: Update README

**Deliverable**: Production-ready MVP

---

## Progress Tracking / 进度跟踪

| Task ID | Task Name | Status | Assignee | Notes |
|---------|-----------|--------|----------|-------|
| T001 | Initialize Supabase Migrations | ✅ Done | AI | Tested in staging |
| T002 | Configure Supabase Secrets | ✅ Done | User | Configured in both environments |
| T003 | Implement Student Login | ✅ Done | AI | - |
| T004 | Display Su Shi's Post | ✅ Done | AI | - |
| T005 | Implement Like Functionality | ⚠️ Partial | AI | localStorage only |
| T006 | Implement Comment Functionality | ✅ Done | AI | - |
| T007 | Implement AI Reply (Edge Function) | ✅ Done | AI | Deployed to production |
| T008 | Remember Student Name | ✅ Done | AI | localStorage |
| T009 | Display Comment History | ✅ Done | AI | - |
| T010 | Implement Teacher Login | ✅ Done | AI | - |
| T011 | Implement Teacher Delete Comment | ✅ Done | AI | - |
| T012 | Implement CSV Export | ✅ Done | AI | - |
| T013 | Implement Statistics Dashboard | ✅ Done | AI | - |
| T014 | Implement AI Reply Template Management | ✅ Done | AI | - |
| T015 | Implement AI Reply Edit | ⚪ Todo | - | Phase 2 |
| T016 | Implement Responsive Design | ✅ Done | AI | - |
| T017 | Add Input Validation and Error Handling | ⚪ Todo | - | - |
| T018 | Improve UI/UX Design | ⚪ Todo | - | - |
| T019 | Add Realtime Updates | ⚪ Todo | - | Optional |
| T020 | Integration Testing (Manual) | ⚪ Todo | - | - |
| T021 | User Acceptance Testing (UAT) | ⚪ Todo | - | - |
| T022 | Update README.md | ⚪ Todo | - | - |
| T023 | Create Teacher Guide | ⚪ Todo | - | - |

---

## Definition of Done (DoD) / 完成定义

A task is considered **Done** when:

1. ✅ Code implemented and committed
2. ✅ Acceptance criteria met
3. ✅ Tested (manual or automated)
4. ✅ No critical bugs
5. ✅ Documentation updated (if needed)
6. ✅ Deployed to `testing` branch and verified

---

## Next Steps / 下一步

After this `tasks.md` is finalized:

1. ✅ **Review tasks with user**
   - Confirm priority (P1/P2)
   - Confirm dependencies
   - Adjust estimates if needed

2. ✅ **Start implementing remaining P1 tasks**
   - Focus on: T002 (Secrets), T017 (Validation), T020 (Testing), T022-T023 (Documentation)
   - Update progress tracking table after each task

3. ✅ **Test each task before marking Done**
   - Run acceptance criteria checklist
   - Test in browser (Chrome + Safari)
   - Test on mobile (responsive)

4. ✅ **Deploy to staging frequently**
   - Push to `testing` branch
   - Verify in staging environment
   - Fix bugs before merging to `main`

---

**End of Tasks (v2.0)**
