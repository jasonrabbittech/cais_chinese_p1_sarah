# Implementation Plan: 教师后台独立门户

**Feature ID**: 003  
**Feature Name**: teacher-admin-portal  
**Plan Version**: 1.0  
**Created**: 2026-08-24  
**Status**: Ready for Implementation (Phase 0/1 Complete)  
**Depends on**: 002-multi-poet（已部署）；spec 已完成 clarify（3 项决议）

---

## Technical Context / 技术上下文

### Technology Stack（全部继承，零新增依赖）

| Component | Technology | Version | Justification |
|-----------|------------|---------|---------------|
| **Admin Frontend** | HTML5 + CSS3 + Vanilla JS（单文件 `admin/index.html`） | ES2022 | 与学生端同构，静态站 |
| **Auth** | Supabase Auth（email + password） | v2.x | 宪法 I：身份必须 Supabase 托管 |
| **Edge Function** | Deno + TypeScript（`teacher-ops` 扩展） | Deno 1.46+ | JWT 验证 + 新增 6 个操作 |
| **Database** | PostgreSQL（via Supabase） | 15.x | **无新表、无迁移** |
| **CI/CD** | GitHub Actions | - | 两 workflow 加 admin/ 部署步骤 |

### New Dependencies

**无。** 零 npm 包、零新表、零迁移：
- `ai_replies.source` 为 TEXT 无 CHECK 约束，`teacher-edited` 值直接写入
- 身份由 `auth.users` 托管（Supabase 内置）
- supabase-js v2 的 `functions.invoke` 自动附加登录用户 JWT（免手动拼 header）

### Storage Requirements

| Data Type | Change | Est. Size |
|-----------|--------|-----------|
| auth.users | 教师账号 1–5 个 | < 1 KB |
| 业务表 | 无变化 | — |

---

## Constitution Check / 宪法检查

### Pre-Implementation Compliance

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Supabase-First | 身份/数据全 Supabase | ✅ PASS | Supabase Auth + 既有表 |
| II. Edge Functions | TS/Deno、输入验证、错误处理 | ✅ PASS | teacher-ops 保持 TS + 全操作输入验证 |
| III. Static Site | admin 静态、Pages 部署、构建时注入 env | ✅ PASS | `inject-env.js` 同机制处理 admin/index.html |
| IV. Security by Default | **本 feature 核心** | ✅ PASS | JWT 验证 + 401 + 限流 + 密码移除（关闭 O-1/O-2） |
| V. GitHub Flow | testing → PR → main | ✅ PASS | **本次实施必须走完整 PR 流程**（偿还 002 流程债） |
| VI. AI Content Safety | 不新增 AI 调用 | ✅ PASS | 不涉及 |
| VII. Code Quality | JSDoc、错误处理 | ✅ PASS | admin 页面新代码全部带 JSDoc；toast 反馈全覆盖 |
| VIII. Spec-Driven | spec → clarify → plan → tasks | ✅ PASS | 本 plan 即产物 |

**Result**: ✅ **PASS** — 全部原则合规，且直接修复 002 遗留的 IV 冲突（O-1/O-2）。

---

## Phase 0: Research & Design Decisions / 研究决策

> 详细论证见 [research.md](research.md)

### Decision 1: JWT 验证方式 = GoTrue API 转发验证

teacher-ops 收到请求后，将 Authorization token 转发给 `${SUPABASE_URL}/auth/v1/user`：200 → 有效教师；401/403 → 拒绝。不做本地 JWT 验签（无需管理 JWT secret，过期/吊销自动生效）。

### Decision 2: 前端免手动传 token

supabase-js v2 `functions.invoke()` 在用户登录态下自动附加 `Authorization: Bearer <access_token>`。admin 端登录后调用即天然带 JWT；学生端无登录态 → anon key → teacher-ops 验证失败 → 401（预期行为）。

### Decision 3: admin 单文件架构

`admin/index.html` 单文件（内联 CSS/JS + CDN supabase-js），与学生端同构。登录墙 → onAuthStateChange 切换视图。

### Decision 4: admin Realtime 全局频道

admin 端订阅 `comments` INSERT + `ai_replies` INSERT（**不按 post_id 过滤**，后台看全部），频道名 `admin-*` 前缀与学生端频道隔离。

### Decision 5: 原子部署，无窗口期

teacher-ops（带鉴权）+ 新 index.html（无管理代码）+ admin/ 在**同一次 CI 发布**中更新。旧学生端调新 teacher-ops 的短暂窗口仅导致本就该移除的操作 401，无实际影响。

### Decision 6: 无数据库迁移

`source` 列 TEXT 无约束，`teacher-edited` 直接写入；admin 端 `replySourceBadge` 映射新增该值（徽章：✏️ 教師修改）。

---

## Phase 1: Design Artifacts / 设计产物

| File | Purpose |
|------|---------|
| [research.md](research.md) | 6 项技术决策与论证 |
| [data-model.md](data-model.md) | 身份模型、RLS 现状、source 语义 |
| [contracts/teacher-ops-api.md](contracts/teacher-ops-api.md) | teacher-ops 全操作 API 契约（请求/响应/错误码） |
| [quickstart.md](quickstart.md) | Auth 配置步骤 + 端到端验证场景 |

---

## Project Structure / 项目结构（目标）

```
Sarah-AI-sushi/
├── index.html                    # ⚠️ 修改：移除管理代码（约 -400 行，含 TEACHER_PASSWORD）
├── admin/
│   └── index.html                # 🆕 教师后台独立页面（登录墙 + 4 Tab + Realtime）
├── supabase/
│   ├── functions/
│   │   ├── ai-reply/index.ts     # 不变
│   │   └── teacher-ops/index.ts  # ⚠️ 修改：JWT 验证 + 限流 + 6 个新操作
│   └── migrations/               # 无新迁移
├── .github/workflows/
│   ├── deploy-production.yml     # ⚠️ 修改：构建 dist/admin/ + paths 加 admin/**
│   └── deploy-staging.yml        # ⚠️ 修改：同上
└── specs/003-teacher-admin-portal/
```

---

## Implementation Order / 实施顺序

1. **teacher-ops**：加 `requireTeacher()` JWT 验证 + 限流 + 新操作（delete_comment / delete_all_comments / edit_reply / 模板 CRUD）——先写后端，契约见 contracts/
2. **admin/index.html**：登录墙（signInWithPassword + onAuthStateChange）→ 4 个 Tab 迁移（留言线程含任意轮编辑 + 统计 + 内容管理 + 模板）→ Realtime 订阅 → CSV 导出
3. **index.html**：移除 teacher-fab、TEACHER_PASSWORD、全部管理函数；修复 `showLoginError` 的 `.modal-body` bug（顺带）
4. **CI**：两个 workflow 加 admin 构建步骤 + paths
5. **Auth 配置**（手动，部署前）：两环境 Dashboard 禁止注册 + 创建教师账号
6. **验证**：按 quickstart.md 场景逐项过 → PR testing → staging 验证 → PR main

---

## Risks / 风险

| Risk | Impact | Mitigation |
|------|--------|------------|
| `functions.invoke` 附带 token 行为与预期不符 | High | 实施第一步即用 curl + 登录态页面验证契约（quickstart 场景 0） |
| 旧学生端教师误存书签，升级后操作 401 | Low | 401 提示明确指向新后台地址；课堂上教师重新扫码 |
| Auth 禁止注册开关遗漏（某环境） | Medium | quickstart.md 将其列为部署前检查项；CI 无法自动验证手动配置 |
| admin Realtime 连接数翻倍（师生同开） | Low | 免费层限额充足（课堂 <100 并发）；频道命名隔离避免串扰 |
| 删除全部留言无二次确认误操作 | Medium | UI 保留 confirm 双重确认 + 仅教师登录可达 |

---

**End of Plan** — 详见 research.md / data-model.md / contracts/ / quickstart.md
