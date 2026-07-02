# Feature Specification: 多诗人 + 多作品 + AI 多轮对话

**Feature ID**: 002  
**Feature Name**: multi-poet  
**Created**: 2026-07-01  
**Phase**: Phase 2 (Extension)  
**Depends on**: 001-ai-poet-friends (Phase 1)

---

## Executive Summary / 概述

### English

Extend the AI ancient poet social media teaching app from a single poet (Su Shi) to multiple poets (Li Bai, Du Fu, Li Qingzhao, etc.). Introduce a post selector, multiple poems per poet, and multi-turn AI conversations. This requires architectural changes: `poets` and `posts` tables, a generic `ai-reply` Edge Function, and an `ai_replies` table for conversation threads.

### 中文

将 AI 古代诗人朋友圈教学小程序从单一诗人（苏轼）扩展到多位诗人（李白、杜甫、李清照等）。引入诗人/作品选择器、每位诗人多篇作品，以及 AI 多轮对话。这需要进行架构改造：新增 `poets` 和 `posts` 表、通用化的 `ai-reply` Edge Function，以及用于对话线程的 `ai_replies` 表。

---

## User Scenarios / 用户场景

### Scenario 1: Student Selects Different Poet (P1)

**As a** student,  
**I want to** choose which poet to interact with,  
**So that** I can learn from multiple historical figures.

**Acceptance Criteria**:
- Student sees a poet selector (4 poets)
- Selecting a poet loads that poet's post(s)
- AI replies match the selected poet's personality
- Student can switch poets freely

---

### Scenario 2: Student Views Multiple Posts (P2)

**As a** student,  
**I want to** see multiple poems from one poet,  
**So that** I can explore different works.

**Acceptance Criteria**:
- Each poet has 1-2 posts initially
- Student can browse posts within a poet
- Comments are scoped to the current post

---

### Scenario 3: Multi-Turn Conversation (P1)

**As a** student,  
**I want to** ask follow-up questions to the poet,  
**So that** I can have a deeper conversation.

**Acceptance Criteria**:
- After AI reply, student can ask follow-up
- Up to 5 rounds per comment
- Conversation history is preserved
- Each round shows in a threaded view

---

### Scenario 4: Teacher Management (P2)

**As a** teacher,  
**I want to** view all comments across poets/posts,  
**So that** I can moderate comprehensively.

**Acceptance Criteria**:
- Admin panel shows poet + post context for each comment
- Delete/export works across all posts
- Statistics include per-poet breakdown

---

## Functional Requirements / 功能需求

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | Poet selector UI | P1 |
| FR-002 | Posts linked to poets | P1 |
| FR-003 | Generic ai-reply Edge Function | P1 |
| FR-004 | Multi-turn conversation (max 5) | P1 |
| FR-005 | ai_replies table + realtime | P1 |
| FR-006 | Migration from Phase 1 (no data loss) | P1 |
| FR-007 | Per-poet AI system prompt | P1 |
| FR-008 | Teacher admin shows poet/post context | P2 |

---

## Success Criteria / 成功标准

- [ ] 4 poets available, each with distinct AI personality
- [ ] Student can switch poets and posts seamlessly
- [ ] Multi-turn conversation works (1-5 rounds)
- [ ] Phase 1 data fully preserved after migration
- [ ] Realtime works per-post (no cross-post leakage)
- [ ] All Phase 1 tests still pass

---

## Assumptions / 假设

- DeepSeek API supports multi-turn context (it does)
- Supabase free tier sufficient for new tables
- Teacher manages poets via SQL (UI in Phase 3)
- Max 5 rounds prevents token abuse

---

**End of Specification**
