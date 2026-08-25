# Feature Specification: 诗人 CMS 与课堂互动增强

**Feature ID**: 004  
**Feature Name**: poet-cms-engagement  
**Created**: 2026-08-24  
**Phase**: Phase 4 (Content & Engagement)  
**Depends on**: 003-teacher-admin-portal（admin 基础设施 + teacher-ops 鉴权，须先实施）

---

## Executive Summary / 概述

### English

Extend the admin portal with a full poet CMS (create/edit/delete poets with avatar & background image upload, personality, tone, and language style configuration — modern / classical / Cantonese), post management per poet, classroom engagement analytics (per-poet reply statistics with one-click AI summary, top-3 active student leaderboard, top-3 quality questions), a student-side QR share button, and enhanced profanity rejection with specific violation reasons.

### 中文

在教师后台新增完整诗人 CMS：增删诗人、上传诗人头像与朋友圈背景图、配置人设（性格特点、语气语调）、语言风格三选一（现代语言/古代语言/香港本地粤语）；按诗人管理作品；课堂互动分析：按诗人维度的学生回复统计、一键 AI 总结、学生龙虎榜（Top 3 活跃）、Top 3 高质量问题；学生端新增设置按钮弹出二维码供扫码加入；敏感词拦截升级——命中时提示具体原因并阻止发布。

---

## User Scenarios / 用户场景

### Scenario 1: 学生扫码加入 (P2)

**As a** student / teacher (投屏),  
**I want to** show a QR code of the app,  
**So that** classmates can scan and join the poet moments instantly.

**Acceptance Criteria**:
- 学生端出现设置按钮（⚙️）
- 点击弹出含当前学生端 URL 的二维码
- 扫码后直接打开学生端首页（无需教师手动发链接）

### Scenario 2: 教师增减诗人 (P1)

**As a** teacher,  
**I want to** create, edit, and delete poets with full profiles,  
**So that** curriculum content stays current without touching SQL.

**Acceptance Criteria**:
- 后台「詩人管理」模块：诗人列表 + 新增 + 编辑 + 删除
- 诗人档案字段：姓名、朝代、简介、性格特点、语气语调
- 可上传诗人头像（图片）与朋友圈背景图（图片）
- 无图片时回退显示 emoji 头像 / 默认背景（现有行为兼容）
- 删除保护：有留言数据的诗人不可直接删除，需提示先处理其留言
- 新增诗人默认未发布（is_published=false），编辑发布后才对学生可见

### Scenario 3: 教师配置语言风格 (P1)

**As a** teacher,  
**I want to** pick each poet's language style: modern, classical, or Cantonese,  
**So that** AI replies match my class's learning context.

**Acceptance Criteria**:
- 每位诗人可独立选择语言风格：現代語言 / 古代語言 / 香港本地粵語
- 切换后，该诗人的后续 AI 回复风格随之变化（同一位诗人可用不同风格重教）
- 性格特点 + 语气语调配置同样影响 AI 回复人格

### Scenario 4: 教师管理作品 (P1)

**As a** teacher,  
**I want to** configure each poet's posts,  
**So that** published poems match the lesson plan.

**Acceptance Criteria**:
- 作品 CRUD：标题、正文、背景故事、所属诗人、可选配图
- 作品可发布/隐藏（复用现有 is_published 开关）
- 学生端作品选择器自动反映变更

### Scenario 5: 教师查看统计与总结 (P1)

**As a** teacher,  
**I want to** see reply statistics per poet/post and generate a summary,  
**So that** I can review class engagement efficiently.

**Acceptance Criteria**:
- 统计模块：按诗人（可下钻作品）显示留言数、追问数、参与学生数
- 「一鍵生成總結」按钮：生成班级互动叙述性总结（哪些学生活跃、讨论主题、亮点）
- 总结在后台展示，可复制

### Scenario 6: 学生龙虎榜 (P2)

**As a** teacher,  
**I want to** see the top-3 most active students and top-3 highest-quality questions,  
**So that** I can recognize and encourage participation.

**Acceptance Criteria**:
- 龙虎榜显示前 3 名最活跃学生（活跃度 = 留言数 + 追问数，并列时按时间先后）
- 显示前 3 条最高质量的学生提问（由 AI 评估），附原文与所属诗人
- 榜单仅教师后台可见（学生端不展示，避免攀比压力）

### Scenario 7: 敏感词明确拦截 (P1)

**As a** a student,  
**I want to** know exactly why my comment was rejected,  
**So that** I can fix it and participate.

**Acceptance Criteria**:
- 学生提交留言/追问命中敏感词 → 阻止发布 + 明确提示命中内容（如：「包含違禁詞：XXX，請修改後再發送」）
- 提示不直接展示完整违禁词原文（显示掩码形式，如「X X」，避免反向教学敏感词）
- 后端拦截同样返回具体命中原因（前端绕过无效）
- AI 生成的回复含敏感词 → 继续替换为安全回复并记录（现有行为），不打扰学生

---

## Functional Requirements / 功能需求

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | 学生端设置按钮 + 二维码弹窗（内容为学生端 URL，前端生成） | P2 |
| FR-002 | 诗人 CRUD 模块（列表/新增/编辑/删除 + 人设字段） | P1 |
| FR-003 | 诗人头像与背景图上传（图片存储），emoji/默认图回退 | P1 |
| FR-004 | 诗人性格特点与语气语调配置（影响 AI 人格） | P1 |
| FR-005 | 语言风格三选一：現代語言 / 古代語言 / 香港本地粵語（影响 AI 回复） | P1 |
| FR-006 | 作品 CRUD + 配图 + 发布开关 | P1 |
| FR-007 | 删除保护：有留言的诗人/作品禁止删除并提示 | P1 |
| FR-008 | 回复统计：按诗人/作品维度（留言数/追问数/参与人数） | P1 |
| FR-009 | 一键 AI 总结班级互动（经 Edge Function，含龙虎榜数据） | P2 |
| FR-010 | 学生龙虎榜：Top 3 活跃学生 | P2 |
| FR-011 | Top 3 高质量问题（AI 评估质量） | P2 |
| FR-012 | 敏感词拦截显示具体命中原因（掩码展示，前后端一致） | P1 |

---

## Success Criteria / 成功标准

- [ ] 扫学生端二维码可直接打开应用
- [ ] 教师新增诗人（含上传头像/背景图/人设/语言风格）并发布后，学生端无需刷新即可见（或轻刷新）
- [ ] 新诗人的 AI 回复体现所配置的性格、语气与语言风格（粤语配置 → 粤语回复）
- [ ] 教师 CRUD 作品后学生端选择器同步
- [ ] 删除有留言的诗人/作品被拒并有明确提示
- [ ] 统计数字与实际留言/追问一致（抽样核对）
- [ ] 一键总结生成流畅中文叙述（含活跃学生与讨论主题）
- [ ] 龙虎榜排名与统计一致，仅后台可见
- [ ] 含敏感词的留言被阻止，提示命中词（掩码）
- [ ] 用 API 直接提交（绕过前端）含敏感词的留言同样被拒且返回原因
- [ ] 两环境（staging + production）全部功能可用

---

## Key Entities / 关键实体

| 实体 | 变更 |
|------|------|
| poets 表 | 🆕 字段：avatar_url、bg_url、language_style（modern/classical/cantonese）、tone（语气）、personality（性格特点） |
| posts 表 | 🆕 字段：bg_url（作品配图） |
| 图片存储 | 🆕 图片存储桶（诗人头像、背景图、作品配图） |
| AI 总结端点 | 🆕 Edge Function 能力：班级互动总结 + 问题质量评估（鉴权同 teacher-ops） |
| 违禁词命中 | 行为变更：拦截响应携带具体命中词（掩码） |

---

## Assumptions / 假设

- **依赖顺序**：003（admin portal + teacher-ops JWT 鉴权）先行实施上线，004 在其上构建
- 图片上传走平台托管存储（宪法 I Supabase-First），限制格式（jpg/png/webp）与大小（≤2MB）
- 语言风格实现为 prompt 组装策略：人设字段 + 语言风格指令拼入该诗人的 system prompt，教师无需手写 prompt
- 活跃度定义：留言数 + 追问数合计（无其他加权）
- 问题质量由 AI 评估（基于相关性/深度/思考性），评估仅覆盖已通过敏感词过滤的正常留言
- 二维码由前端库生成，内容为当前环境的学生端 URL（production/staging 各自对应）
- 龙虎榜与 Top 问题仅教师后台展示，学生端不显示
- 现有 emoji 头像机制保留：无上传图片的诗人继续用 avatar_emoji
- 一键总结单次生成（非流式），超时与降级策略同现有 AI 调用

---

**End of Specification**
