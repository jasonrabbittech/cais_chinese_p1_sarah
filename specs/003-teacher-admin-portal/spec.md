# Feature Specification: 教师后台独立门户

**Feature ID**: 003  
**Feature Name**: teacher-admin-portal  
**Created**: 2026-08-24  
**Phase**: Phase 3 (Hardening)  
**Depends on**: 002-multi-poet (Phase 2, 已部署生产 + staging)

---

## Executive Summary / 概述

### English

Extract the teacher dashboard from the student-facing page into a dedicated admin portal at `/admin/` (same repo, subdirectory on GitHub Pages — both production and staging). Replace the hardcoded teacher password with Supabase Auth (email + password). All admin write operations route through the `teacher-ops` Edge Function with JWT validation. The student page is stripped of all management code, resolving constitution violations O-1 (hardcoded password) and O-2 (unauthenticated teacher-ops).

### 中文

将教师后台从学生端页面拆分为独立管理门户 `/admin/`（同仓库子目录部署到 GitHub Pages，生产 + staging 两环境均启用）。用 Supabase Auth（邮箱 + 密码）取代硬编码教师密码。所有管理写操作经 `teacher-ops` Edge Function 并验证 JWT。学生端页面移除全部管理代码，解决宪法冲突 O-1（密码硬编码）和 O-2（teacher-ops 无鉴权）。

### 背景：本功能同时修复的已知问题

| 问题 | 现状 | 根因 |
|------|------|------|
| O-1 宪法 IV 冲突 | `TEACHER_PASSWORD = 'cais2024'` 硬编码在 index.html | 查看源码即可获取 |
| O-2 宪法 IV 冲突 | `teacher-ops` 用 service_role 写库但无任何鉴权 | 任何人可直接调用 |
| 隐藏 Bug | 教师后台「刪除留言」「編輯 AI 回覆保存」「模板 CRUD」静默失败 | 前端用 anon key 直写，被 RLS 拒绝但 error 被忽略 |

---

## Clarifications

### Session 2026-08-24

- Q: 教师编辑 AI 回复的能力应覆盖哪些轮次，且编辑后是否保留可追溯标记？ → A: 任意轮次均可编辑，编辑后 source 标记为 `teacher-edited`（保留 AI 原始 vs 人工修改的审计透明度）。
- Q: 教师后台的留言列表如何获取新内容？ → A: 实时自动更新——新留言/新 AI 回复即时出现在后台列表（复用已有的 Realtime 频道），课堂投屏监控友好。
- Q: 教师忘记密码时如何恢复登录？ → A: Supabase Dashboard 手动重置（账号仅 1–5 个且由管理员手动创建，重置后线下告知教师；不配置邮件自助找回）。

---

## User Scenarios / 用户场景

### Scenario 1: Teacher Logs In (P1)

**As a** teacher,  
**I want to** log in to the admin portal with my email and password,  
**So that** only authorized staff can access management features.

**Acceptance Criteria**:
- 访问 `/admin/` 未登录时仅显示登录界面，无任何管理功能可见
- 邮箱 + 密码登录（Supabase Auth），登录态持久化（刷新不丢失）
- 错误凭据显示明确错误提示
- 可登出，登出后回到登录界面

### Scenario 2: Teacher Manages Content (P1)

**As a** teacher,  
**I want to** use all management features in the admin portal,  
**So that** I can moderate without touching the student experience.

**Acceptance Criteria**:
- 全部现有功能迁移：留言线程（含多轮追问）、统计、内容管理（诗人/作品发布开关）、违禁词管理、回复模板管理、AI 回复内联编辑、CSV 导出
- AI 回复编辑覆盖**任意轮次**（不限于最新轮）；编辑保存后该条回复标记为 `teacher-edited`（可区分 AI 原文与人工修改）
- **写操作实际生效**（修复静默失败 bug）：删除留言、删除全部、编辑 AI 回复保存、模板增删改均经 teacher-ops 落库
- 留言列表**实时自动更新**：学生新留言、AI 新回复在教师不刷新页面的情况下即时出现（适合课堂投屏监控）
- 操作成功/失败有明确反馈（toast），失败不再静默

### Scenario 3: Student Page Zero Exposure (P1)

**As a** student (or anyone viewing source),  
**I want to** find no management capabilities in the student page,  
**So that** the attack surface is minimal.

**Acceptance Criteria**:
- 学生端无「教師後台」入口按钮
- 学生端源码零密码、零管理函数（约 400 行管理代码移除）
- 学生端全部学生功能不受影响（留言/追问/切诗人/切作品/实时更新）

### Scenario 4: Unauthorized Access Rejected (P1)

**As a** an attacker,  
**I want to** call teacher-ops directly,  
**So that** I can tamper with data — **and I must fail**.

**Acceptance Criteria**:
- 无有效 JWT 调用 teacher-ops → 401
- 过期/伪造 JWT → 401
- teacher-ops 有限流（防止暴力探测）
- 无法通过 Supabase Auth 公开注册自建账号（注册关闭）

---

## Functional Requirements / 功能需求

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | 独立管理页面 `admin/index.html`：登录墙 + 全部管理界面 | P1 |
| FR-002 | Supabase Auth 邮箱+密码登录、session 持久化、登出 | P1 |
| FR-003 | Auth 禁止公开注册；teacher 账号仅 Dashboard 手动创建 | P1 |
| FR-004 | teacher-ops 验证 Authorization JWT（调 /auth/v1/user 校验），无效返回 401 | P1 |
| FR-005 | teacher-ops 新增操作：delete_comment、delete_all_comments、edit_reply、模板 CRUD | P1 |
| FR-006 | teacher-ops 限流（同 ai-reply 模式） | P1 |
| FR-007 | 学生端 index.html 移除教师入口、TEACHER_PASSWORD、全部管理函数 | P1 |
| FR-008 | 管理端所有写操作改调 teacher-ops（携带 JWT），修复 RLS 静默拒绝 bug | P1 |
| FR-009 | admin 页面环境变量构建时注入（与学生端同机制 %%SUPABASE_URL%%/%%ANON_KEY%%） | P1 |
| FR-010 | CI：production + staging workflow 部署 `/admin/` 子目录到各自 Pages | P1 |
| FR-011 | 后台留言列表实时自动更新：新留言/新 AI 回复即时出现（复用 Realtime 频道） | P1 |

---

## Success Criteria / 成功标准

- [ ] 未登录访问 `/admin/` 仅见登录界面，无管理数据泄露
- [ ] 正确凭据登录后，全部管理 Tab 功能可用
- [ ] 错误凭据被拒并提示
- [ ] 无 JWT / 伪造 JWT 调 teacher-ops 均返回 401
- [ ] 学生端源码中 grep 不到任何密码或管理函数
- [ ] 删除留言、编辑 AI 回复（任意轮次）、模板增删改实际生效（写后读验证）
- [ ] 教师编辑过的 AI 回复显示 teacher-edited 来源标记，与 AI 原始回复可区分
- [ ] 学生端原有功能回归通过（留言→AI 回复→追问→多轮）
- [ ] 教师后台打开状态下，学生提交新留言/收到新 AI 回复，后台列表无需刷新即出现
- [ ] `https://jasonrabbittech.github.io/cais_chinese_p1_sarah/admin/` 可访问
- [ ] `https://jasonrabbittech.github.io/cais_chinese_p1_sarah-staging/admin/` 可访问
- [ ] 宪法合规：O-1、O-2 关闭

---

## Key Entities / 关键实体

无新业务表。身份由 Supabase Auth 托管（`auth.users`）：

| 实体 | 说明 |
|------|------|
| teacher (auth.users) | Dashboard 手动创建；因注册关闭，凡能登录者即教师 |
| JWT (access_token) | teacher-ops 唯一接受的身份凭据 |

**teacher-ops 扩展后的操作集**：

| action | 说明 | 新增 |
|--------|------|------|
| toggle_publish | 诗人/作品发布开关 | 已有 |
| add_word / toggle_word / delete_word | 违禁词 CRUD | 已有 |
| delete_comment | 删除单条留言（级联删 ai_replies） | 🆕 |
| delete_all_comments | 清空全部留言 | 🆕 |
| edit_reply | 编辑任意轮次的 AI 回复文本，source 置为 teacher-edited | 🆕 |
| add_template / edit_template / delete_template | 模板 CRUD | 🆕 |

---

## Assumptions / 假设

- 教师账号数量少（1–5 个），Supabase Dashboard 手动创建即可，无需自助注册流程
- 教师忘记密码 → 管理员在 Supabase Dashboard 手动重置后线下告知（不配置邮件找回）
- 因公开注册关闭，无需额外教师白名单——能通过 Auth 登录者即为教师
- admin 与学生端共用同一 anon key（全部读取表均为 public read）
- CORS 无需变更：`/admin/` 与学生端同域（ALLOWED_ORIGINS 已覆盖）
- 学生端 Realtime 依赖的 comments/ai_replies 读权限不变
- CSV 导出在 admin 端执行（登录后）

---

**End of Specification**
