# Feature Specification: 多诗人 + 多作品 + AI 多轮对话

**Feature ID**: 002  
**Feature Name**: multi-poet  
**Created**: 2026-07-01  
**Last Updated**: 2026-08-24（post-implementation review：补记实现中新增的功能）  
**Phase**: Phase 2 (Extension) — **已部署生产 + staging**  
**Depends on**: 001-ai-poet-friends (Phase 1)

---

## Executive Summary / 概述

### English

Extend the AI ancient poet social media teaching app from a single poet (Su Shi) to multiple poets (Li Bai, Du Fu, Li Qingzhao). Introduce a post selector, multiple poems per poet, and multi-turn AI conversations. Architecture: `poets` and `posts` tables, a generic `ai-reply` Edge Function, and an `ai_replies` table for conversation threads.

**Post-implementation additions** (2026-08): teacher dashboard now shows full multi-turn conversation threads; content management (publish/unpublish poets & posts); teacher-managed profanity word list (DB-driven, front + backend); a `teacher-ops` Edge Function proxies teacher write operations; AI reply source tracking; AI interaction audit logs; rate limiting; dual-environment deployment (staging + production).

### 中文

将 AI 古代诗人朋友圈教学小程序从单一诗人（苏轼）扩展到多位诗人（李白、杜甫、李清照）。引入诗人/作品选择器、每位诗人多篇作品，以及 AI 多轮对话。架构：`poets`/`posts` 表、通用 `ai-reply` Edge Function、`ai_replies` 对话线程表。

**实现后新增**（2026-08）：教师后台显示完整多轮对话线程；内容管理（诗人/作品发布开关）；教师可管理的违禁词库（数据库驱动、前后端统一）；`teacher-ops` Edge Function 代理教师写操作；AI 回复来源标记；AI 交互审计日志；限流；staging + 生产双环境部署。

---

## User Scenarios / 用户场景

### Scenario 1: Student Selects Different Poet (P1) ✅ 已实现

**As a** student,  
**I want to** choose which poet to interact with,  
**So that** I can learn from multiple historical figures.

**Acceptance Criteria**:
- Student sees a poet selector (4 poets: 苏轼🍶/李白🍷/杜甫🖌️/李清照🌸)
- Selecting a poet loads that poet's post(s)
- AI replies match the selected poet's personality（per-poet system prompt）
- Student can switch poets freely

### Scenario 2: Student Views Multiple Posts (P2) ✅ 已实现

**As a** student,  
**I want to** see multiple poems from one poet,  
**So that** I can explore different works.

**Acceptance Criteria**:
- Each poet has ≥1 post initially（当前各 1 篇）
- Student can browse posts within a poet（dropdown selector）
- Comments are scoped to the current post

### Scenario 3: Multi-Turn Conversation (P1) ✅ 已实现

**As a** student,  
**I want to** ask follow-up questions to the poet,  
**So that** I can have a deeper conversation.

**Acceptance Criteria**:
- After AI reply, student can ask follow-up（「繼續提問」→ 输入框 → 发送）
- Up to 5 rounds per comment（前端 + 后端双重校验）
- Conversation history is preserved（`ai_replies` 表，parent_reply_id 链）
- Each round shows in a threaded view（轮次徽章 + 学生追问气泡）
- 发送追问后立即隐藏输入框、显示「思考中」，避免状态重叠

### Scenario 4: Teacher Management (P2) ✅ 已实现

**As a** teacher,  
**I want to** view all comments across poets/posts,  
**So that** I can moderate comprehensively.

**Acceptance Criteria**:
- Admin panel shows poet + post context for each comment
- Delete/export works across all posts（CSV 含诗人/作品/AI 回复/来源）
- Statistics include per-student breakdown

### Scenario 5: Teacher Views Full Conversation Threads (P1) 🆕 已实现

**As a** teacher,  
**I want to** see each student's complete multi-turn conversation,  
**So that** I can assess engagement and review AI responses.

**Acceptance Criteria**:
- 「所有留言」Tab 展开显示完整线程：原始留言 → AI 回复 → 🙋 学生追问（第N轮）→ AI 回复…
- 每轮标注来源徽章（AI 生成/預置回覆/內容攔截）
- 最后一轮 AI 回复可内联编辑（教师可修正不当回复）

### Scenario 6: Teacher Controls Content Visibility (P1) 🆕 已实现

**As a** teacher,  
**I want to** publish or hide poets and posts,  
**So that** students only see curriculum-appropriate content.

**Acceptance Criteria**:
- 「內容管理」Tab 提供诗人/作品发布开关（✅ 已發布 / ⛔ 已隱藏）
- 隐藏的诗人不出现在学生端诗人标签
- 隐藏的作品不出现在学生端作品选择器
- 切换操作经 `teacher-ops` Edge Function（service_role 权限）落库

### Scenario 7: Teacher Manages Profanity Words (P2) 🆕 已实现

**As a** teacher,  
**I want to** add/remove/enable/disable banned words,  
**So that** content filtering adapts to my classroom needs.

**Acceptance Criteria**:
- 「內容管理」Tab 底部提供违禁词 CRUD（新增/刪除/啟用/停用）
- 支持正则表达式模式（勾选「正則」）
- 前端提交留言/追问时本地拦截（含 DB 自定义词）
- 后端 `ai-reply` 输入+输出双向过滤（DB 词库 1 分钟缓存）
- 预置 60+ 默认词库（迁移 007）

---

## Functional Requirements / 功能需求

### 原始需求（全部已实现）

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-001 | Poet selector UI | P1 | ✅ |
| FR-002 | Posts linked to poets | P1 | ✅ |
| FR-003 | Generic ai-reply Edge Function | P1 | ✅ |
| FR-004 | Multi-turn conversation (max 5) | P1 | ✅ |
| FR-005 | ai_replies table + realtime | P1 | ✅ |
| FR-006 | Migration from Phase 1 | P1 | ✅* |
| FR-007 | Per-poet AI system prompt | P1 | ✅ |
| FR-008 | Teacher admin shows poet/post context | P2 | ✅ |

\* FR-006 说明：生产库为 Phase 1 demo 残留（测试数据），重建而非迁移。真实用户数据无损。

### 实现后补记的需求（2026-08）

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-009 | 教师后台完整多轮对话线程显示（含学生追问） | P1 | ✅ |
| FR-010 | 诗人/作品发布管理（is_published 开关，学生端过滤） | P1 | ✅ |
| FR-011 | 违禁词管理（profanity_words 表 + CRUD + 正则支持） | P2 | ✅ |
| FR-012 | teacher-ops Edge Function（教师写操作代理，service_role） | P1 | ✅ |
| FR-013 | AI 回复来源标记（deepseek/fallback/fallback-nokey/fallback-filtered/content-filter） | P2 | ✅ |
| FR-014 | AI 交互审计日志（ai_interaction_logs，不含敏感数据） | P2 | ✅ |
| FR-015 | ai-reply 限流（12 次/分钟/IP，内存令牌桶） | P1 | ✅ |
| FR-016 | AI 调用 30s 超时 + 三级 fallback（API→DB模板→内建） | P1 | ✅ |
| FR-017 | 教师可内联编辑最后一轮 AI 回复 | P3 | ✅ |
| FR-018 | CSV 导出含诗人/作品/AI回复/来源上下文 | P3 | ✅ |
| FR-019 | staging（cais_chinese_p1_sarah-staging）+ 生产双环境部署 | P1 | ✅ |

---

## Success Criteria / 成功标准

- [x] 4 poets available, each with distinct AI personality（4 个独立 system_prompt）
- [x] Student can switch poets and posts seamlessly
- [x] Multi-turn conversation works (1-5 rounds)，前后端双重轮数校验
- [x] ~~Phase 1 data fully preserved~~ → 修订：Phase 1 为测试数据，生产库干净重建（真实数据无损）
- [x] Realtime works per-post (no cross-post leakage)（comments + ai_replies 双频道，按 post_id 过滤）
- [x] 教师后台功能完整（留言线程/统计/内容管理/回复模板 4 个 Tab）
- [x] 违禁词前后端双向过滤生效
- [x] staging 与生产环境完全隔离且均可访问
- [ ] 所有 Phase 1 测试重新验证（待办：UAT 清单见 UAT_PLAN_002.md）
- [ ] 宪法合规问题清零（见下方 Open Issues）

---

## Open Issues / 未决问题（宪法冲突，待确认）

| # | 问题 | 违反原则 | 严重度 | 状态 |
|---|------|---------|--------|------|
| O-1 | 教师密码硬编码在前端 `index.html`（`TEACHER_PASSWORD`） | IV. Security by Default | 🔴 高 | 🟡 staging 已修复（003），生产待合并 |
| O-2 | `teacher-ops` Edge Function 无任何鉴权（service_role 权限但任何人可调） | IV. Security by Default | 🔴 高 | 🟡 staging 已修复（003），生产待合并 |
| O-3 | 开发期间直接提交 main，未走 testing → PR 流程 | V. GitHub Flow | 🟡 流程 | ✅ 003 起恢复完整 PR 流程 |
| O-4 | FR-009~012 未先写 spec 即实现（本文件为事后补记） | VIII. Spec-Driven | 🟡 流程 | ✅ 已补记（本文件 2026-08-24 更新） |

---

## Assumptions / 假设

- DeepSeek API supports multi-turn context ✅（已验证）
- Supabase free tier sufficient ✅
- ~~Teacher manages poets via SQL (UI in Phase 3)~~ → **已过时**：内容管理 UI 已在 Phase 2 实现（FR-010/011）
- Max 5 rounds prevents token abuse ✅（外加限流 12/min/IP）
- 点赞数为演示数据（localStorage 本地状态，不落库）——教学演示用，by design
- 学生身份仅以姓名标识（无真实鉴权）——课堂场景 by design，O-2 修复时需一并考虑

---

## Deployment / 部署状态

| 环境 | 前端 | Supabase | 状态 |
|------|------|----------|------|
| Production | https://jasonrabbittech.github.io/cais_chinese_p1_sarah/ | `pzatgmavjvrastnumxty` | ✅ 运行中 |
| Staging | https://jasonrabbittech.github.io/cais_chinese_p1_sarah-staging/ | `gjbdqcjyliuxrnmwotvc` | ✅ 运行中 |

Edge Functions（两环境均已部署）：`ai-reply`、`teacher-ops`  
Migrations：001–004、006–007（005 编号被跳过，文件已重命名）

---

**End of Specification**
