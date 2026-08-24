# Tasks: 003-teacher-admin-portal

**Generated**: 2026-08-24  
**Source**: spec.md（4 User Stories）+ plan.md + contracts/teacher-ops-api.md + quickstart.md  
**编号接续**: 002 结束于 T032，本 feature 从 T033 起

---

## Dependencies / 依赖图

```
T033 分支
  └─> T034 ─> T035 ─> T036 ─> T037 ─> T038 ─> T039 (后端契约验证)
                                              ├─> T040 ─> T041 ─> T042 ─> T043 ─> T044 ─> T045 ─> T046 ─> T047 (admin 线)
                                              └─> T048 ─> T049 (学生端瘦身线, 与 admin 线并行)
T051 Auth 手动配置 (任意时刻, 部署前完成)
T047 + T048 + T049 ─> T050 (CI) ─> T052 (staging 全量验证) ─> T053 (PR main + 关闭 O-1/O-2)
```

**User Story 完成顺序**: US4（鉴权后端）→ US1（登录墙）→ US2（管理迁移）→ US3（学生端瘦身，可并行）→ 全量验收

---

## Phase 1: Setup

- [x] T033 创建功能分支 `feat/003-teacher-admin-portal`（宪法 V：本次全程 PR 流程，禁止直推 main）

## Phase 2: Foundational — teacher-ops 后端（阻塞全部 Story）

- [x] T034 [US4] 在 `supabase/functions/teacher-ops/index.ts` 实现 `requireTeacher()`：提取 Authorization token → 转发 `GET ${SUPABASE_URL}/auth/v1/user`（带 apikey 头）→ 200 且 role=authenticated 放行，否则 `401 {"error":"未授權"}`；全部业务 action 前强制调用（契约见 specs/003-teacher-admin-portal/contracts/teacher-ops-api.md）
- [x] T035 [US4] teacher-ops 加限流：内存令牌桶 12 次/分钟/IP（复用 ai-reply 的 rateLimit 模式），超限 `429`
- [x] T036 [US2] teacher-ops 新增 `delete_comment`（校验 UUID，404 不存在；级联删除由 DB ON DELETE CASCADE 承担）与 `delete_all_comments`（强制 `confirm:true` 字段，返回 deleted 行数）
- [x] T037 [US2] teacher-ops 新增 `edit_reply`：校验 reply_id 存在（404）、reply_text 非空且 ≤2000 字符；UPDATE reply_text 并无条件置 `source='teacher-edited'`
- [x] T038 [US2] teacher-ops 新增 `add_template` / `edit_template` / `delete_template`（type ∈ {generic,smart}，smart 必填 keyword，reply ≤1000 字符，404 目标不存在）；同时给既有 `add_word` 补 word ≤100 字符校验（002 审查遗留）
- [x] T039 [P] [US4] 用 curl 验证后端契约（quickstart 场景 0/2）：无 token → 401；anon key 伪造 → 401；合法教师 JWT → 各操作 200；连续 13 次 → 429。**此任务通过前不得开始前端接线**

## Phase 3: US1 — 教师登录墙

- [x] T040 [US1] 创建 `admin/index.html` 骨架：单文件（CDN supabase-js@2 + 内联 CSS/JS）、`%%SUPABASE_URL%%`/`%%SUPABASE_ANON_KEY%%` 注入占位、登录卡片 UI（邮箱+密码+错误提示区）、`onAuthStateChange` 登录墙（SIGNED_IN 渲染管理壳/4 Tab 骨架，SIGNED_OUT 回登录卡片）、首屏 `getSession()` 判定
- [x] T041 [US1] 完成登录流：`signInWithPassword`（错误凭据显示「郵箱或密碼錯誤」）、`signOut`（登出回登录卡片）、session 持久化验证（刷新不掉线）——对照 quickstart 场景 1 逐项过

## Phase 4: US2 — 管理功能迁移（全部在 admin/index.html）

- [x] T042 [US2] 「所有留言」Tab：从旧 index.html 迁移 `loadTComments`/`renderThread`（完整多轮线程 + 追问气泡 + 来源徽章），**修正 `err`→`error` 解构 bug**；顶部「匯出 CSV」「刪除全部」按钮占位
- [x] T043 [US2] 留言写操作接 teacher-ops：`delOne`/`deleteAll`（confirm 双重防护）经 invoke；`editAIReply` 扩展为**任意轮次可编辑**（每轮加編輯按钮）→ `edit_reply`，保存后徽章显示 `✏️ 教師修改`（replySourceBadge 映射 teacher-edited）；CSV 导出迁移（修正引号转义 `"` → `""`）
- [x] T044 [US2] 「統計」Tab 迁移（err→error 修正）：按学生留言计数排序
- [x] T045 [US2] 「內容管理」Tab 迁移：诗人/作品发布开关（toggle_publish）、违禁词 CRUD（add_word/toggle_word/delete_word）全部经 invoke；操作结果 toast 反馈（失败不再静默）
- [x] T046 [US2] 「回覆模板」Tab 迁移：模板列表 + 新增/编辑/删除全部经 teacher-ops（修复 002 模板 CRUD 静默失败）
- [x] T047 [US2] admin Realtime：订阅 `admin-comments`（comments INSERT/DELETE）与 `admin-replies`（ai_replies INSERT）全局频道——新留言线程 prepend、新回复 append 到对应线程（未知 comment 则 REST 补拉单条）、教师删除事件本地移除（幂等）；页面卸载 removeChannel

## Phase 5: US3 — 学生端瘦身（与 Phase 4 并行）

- [x] T048 [US3] `index.html` 移除：`.teacher-fab` 按钮及 openTeacher/closeTeacher、`TEACHER_PASSWORD` 常量、全部管理函数（loadTComments/loadTStats/loadTContent/loadTTemplates/editAIReply/saveAIReply/cancelAIReply/delOne/deleteAll/exportCSV/togglePub/toggleWord/deleteWord/addWord/showAddTemplate/submitAddTemplate/editTemplate/deleteTemplate/replySourceBadge/sourceLabel/switchTab 及 t-modal/t-tabs HTML）；**顺带修复 `showLoginError` 的 `.modal-body` null 引用 bug**（改为挂到 .modal-card）
- [x] T049 [P] [US3] 学生端回归验证（quickstart 场景 3 后半）：留言 → AI 回复 → 追問 → 多轮 → 切诗人/作品 → Realtime 全部正常；`grep -cE "TEACHER_PASSWORD|loadTComments|teacher-ops" index.html` 返回 0

## Phase 6: US4 收尾 — 部署与 Auth 配置

- [x] T050 修改 `.github/workflows/deploy-production.yml` 与 `deploy-staging.yml`：Build 步骤加 `mkdir -p dist/admin && node inject-env.js admin/index.html dist/admin/index.html`；`paths:` 加 `'admin/**'`
- [x] T051 [P] 两环境 Supabase Dashboard 手动配置（quickstart 前置 A）：Authentication 关闭 `Allow new users to sign up` + Add user 创建教师账号（prod `pzatgmavjvrastnumxty` / testing `gjbdqcjyliuxrnmwotvc` 各一次）

## Phase 7: Polish & 验收

- [ ] T052 按 quickstart.md 场景 0–8 全量验证（staging）：登录墙/未授权 401/写操作落库/teacher-edited 标记/后台实时更新/限流/双环境隔离
- [ ] T053 PR `feat/003-...` → `testing`（staging 验证）→ PR → `main`（生产审批部署，生产复跑场景 1–6）；关闭 O-1/O-2：更新 `specs/002-multi-poet/spec.md` Open Issues 状态与 `CODEBUDDY.md` Active Context

---

## Parallel Execution / 并行机会

| 并行组 | 任务 | 条件 |
|--------|------|------|
| A | T039（curl 验证）‖ T040–T041（admin 骨架按契约开发） | 契约已定（contracts/），T039 通过前 admin 不做真实调用 |
| B | T048–T049（index.html）‖ T042–T047（admin/index.html） | 不同文件，互不影响 |
| C | T051（Dashboard 手动配置）‖ 任意代码任务 | 部署前完成即可 |

## Independent Test Criteria / 各 Story 独立验收

| Story | 独立验收（不依赖其他 Story） |
|-------|------------------------------|
| US1 | quickstart 场景 1（登录墙五步） |
| US2 | quickstart 场景 4+5+6（写落库 + 标记 + 实时） |
| US3 | quickstart 场景 3（grep=0 + 学生功能回归） |
| US4 | quickstart 场景 2+7（401 + 429） |

## Implementation Strategy / 实施策略

- **后端先行**（T034–T039）：契约稳定后前端才接线，避免返工
- **本 feature 不可拆 MVP**：安全修复（US3+US4）与管理可用（US1+US2）必须同次发布——旧后台拆除的同时新后台必须就位
- **增量提交**：每个 Phase 至少一次 commit（feat:/fix: 规范），全部经 PR 流（T033 分支）
