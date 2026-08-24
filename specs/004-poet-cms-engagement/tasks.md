# Tasks: 004-poet-cms-engagement

**Generated**: 2026-08-25  
**Source**: spec.md（6 US，含 Clarification Q1-Q3）+ plan.md v1.1（D1-D11）+ contracts/×2 + quickstart.md  
**编号接续**: 003 结束于 T053，本 feature 从 T054 起

---

## Dependencies / 依赖图

```
T054 分支
  └─> T055 迁移008 ─> T056 部署testing验证
                          ├─> US1 诗人: T057 ─> T058 ─> T059 ─> T060
                          │                └─> US2 作品: T061 ─> T062 (T058后)
                          ├─> US6 敏感词: T063 (独立线, 与 US1/US2 并行)
                          └─> US3/4 统计: T064 ai-summary ─> T067
                                          T065 [P] CI (与 T066 并行)
                                          T066 统计Tab (依赖 T064)
          US5 学生端: T068 ─> T069 [P] (与全部 admin 线并行, 依赖 T056)
T060+T062+T063+T066+T067+T068+T069 ─> T070 staging全量验证 ─> T071 PR收尾
```

**User Story 完成顺序**: US1 诗人 CMS → US2 作品 →（并行 US5 学生端 / US6 敏感词）→ US3 统计总结 + US4 龙虎榜 → 验收

---

## Phase 1: Setup

- [x] T054 创建功能分支 `feat/004-poet-cms-engagement`（基于 origin/testing 最新）

## Phase 2: Foundational — 迁移与地基

- [x] T055 创建 `supabase/migrations/008_poet_cms.sql`：poets 加 avatar_url/bg_url/language_style(CHECK modern|classical|cantonese, 默认 modern)/tone/personality；posts 加 bg_url；INSERT storage.buckets('poet-assets', public)；storage.objects 策略（public SELECT + authenticated INSERT/UPDATE/DELETE，scope bucket_id='poet-assets'）；全部幂等（research D8）
- [x] T056 对 testing Supabase 执行 `supabase db push`，验证：poets 新字段存在、bucket 列表含 poet-assets、匿名 curl 上传 403（quickstart 场景 2 前置）

## Phase 3: US1 — 诗人管理（CRUD + 人设 + 图片）

- [x] T057 [US1] `supabase/functions/teacher-ops/index.ts` 新增 add_poet/edit_poet：字段校验按契约（name≤30 唯一 409、bio≤500、tone/personality≤200、language_style 枚举）；**D10 语义**——add_poet 未传 system_prompt 时按模板生成（name/dynasty/bio/personality/tone 拼装，与 002 种子同构），传了则覆写；edit_poet **永不重写**已有 system_prompt（仅显式传值才覆盖）；新诗人默认 is_published=false
- [x] T058 [US1] teacher-ops 新增 delete_poet/delete_post：引用保护——统计目标下 comments 数，>0 返回 409 附数量与「隱藏」出路提示；=0 级联删除（research D7）
- [x] T059 [US1] `admin/index.html` 內容管理 Tab：诗人表单 modal（新增/编辑共用）——姓名/朝代/简介/emoji/性格/语气/语言风格三选一（現代/古代/粵語）+ **「高級」折叠区**展示可编辑完整 prompt（新增时预填自动生成预览）+ 发布开关入口保留
- [x] T060 [US1] admin 图片上传：`storage.from('poet-assets')` 登录态直传（upsert:true），前端校验 ≤2MB + jpg/png/webp；路径 `poets/{id}/avatar.{ext}` / `poets/{id}/bg.{ext}`；**DB 存相对路径**（research D1/D9）

## Phase 4: US2 — 作品管理

- [x] T061 [US2] teacher-ops 新增 add_post/edit_post：契约校验（title≤100、content≤2000、poet_id 存在 404）；默认未发布
- [x] T062 [US2] admin 作品管理 UI：作品表单 modal（标题/正文/背景故事/配图上传 `posts/{id}/bg.{ext}`）+ 列表编辑/删除（409 提示展示）；学生端作品选择器经既有 loadPoets/selectPost 自动反映

## Phase 5: US6 — 敏感词明确拦截（独立线）

- [x] T063 [US6] `supabase/functions/ai-reply/index.ts` + `index.html`：containsProfanity 返回**首个命中词**（非 boolean）；ai-reply 拦截响应 422 + `hit_word: 掩码`（每字→＊，research D5）；学生端 submitComment/submitFollowUp toast 显示「包含違禁詞「＊＊」」；AI 输出过滤行为不变

## Phase 6: US3+US4 — 统计、总结与龙虎榜

- [x] T064 [US3] 新建 `supabase/functions/ai-summary/index.ts`：requireTeacher 复制（同 teacher-ops 模式）+ 限流 6/min/IP + class_summary（聚合近 200 条互动→DeepSeek 600 tokens→叙述总结+确定性 stats）+ top_questions（评估 Top3+一句话理由，失败降级空数组+warning）+ 30s 超时 + 输出过滤（契约：contracts/ai-summary-api.md）
- [x] T065 [P] CI：`deploy-production.yml` + `deploy-staging.yml` 的 Edge Functions 步骤加 `supabase functions deploy ai-summary`
- [x] T066 [US3] admin 統計 Tab 增强：按诗人下钻作品统计（留言/追问/参与数）+ AI 总结区——**localStorage 缓存**（admin_summary_cache：summary+stats+时间戳）+「重新生成」按钮（D11）；失败保留旧缓存值并提示
- [x] T067 [US4] admin 統計 Tab：龙虎榜 Top3 活跃学生（留言+追问聚合，并列按首言时间，research D4 前端计算）+ Top3 优质问题卡片（学生/原文/诗人/理由，调 ai-summary top_questions）

## Phase 7: US5 — 学生端（与 admin 线并行）

- [x] T068 [US5] `index.html`：header 加 ⚙️ 设置按钮 + QR 弹窗（CDN qrcode-generator，内容=当前环境学生端 URL；含可复制链接；CDN 失败 fallback 纯链接，research D6；**仅 QR**，Clarification Q2）
- [x] T069 [P] [US5] `index.html`：图片回退链渲染——诗人头像 avatar_url>emoji（onerror 回退）；朋友圈背景 post.bg_url>poet.bg_url>默认 post-bg.jpg；URL 拼 `${SUPABASE_URL}/storage/v1/object/public/poet-assets/{相对路径}`（research D9）

## Phase 8: Polish & 验收

- [ ] T070 按 `specs/004-poet-cms-engagement/quickstart.md` 场景 1–10 全量验证（staging）：含覆写保护（场景1.6）、缓存行为（场景6）、双端掩码一致（场景8）、回退链（场景1.7）
- [ ] T071 PR `feat/004-...` → `testing`（staging 验证）→ 用户确认后 PR → `main`（生产部署前核对：db push 含 008、ai-summary secrets 同 ai-reply、Storage bucket 生产就位）；更新 `CODEBUDDY.md` Active Context

---

## Parallel Execution / 并行机会

| 并行组 | 任务 | 条件 |
|--------|------|------|
| A | T063 敏感词线（ai-reply+学生端）‖ T057-T062 诗人/作品线 | 不同文件不同函数 |
| B | T068-T069 学生端 ‖ 全部 admin 线（T057-T067） | index.html vs admin/index.html |
| C | T065 CI ‖ T066 统计 Tab | workflow vs admin 页面 |

## Independent Test Criteria / 各 Story 独立验收

| Story | 独立验收（quickstart） |
|-------|------------------------|
| US1 诗人 | 场景 1（CRUD+图片+覆写保护+回退）+ 场景 2（Storage 公开性） |
| US2 作品 | 场景 1 末段 + 学生端选择器反映 |
| US3 统计总结 | 场景 6（缓存+重新生成） |
| US4 龙虎榜 | 场景 5 + 场景 7（Top 问题） |
| US5 QR | 场景 9 |
| US6 敏感词 | 场景 8（前后端掩码一致） |

## Implementation Strategy / 实施策略

- **MVP = US1+US2（诗人 CMS）**：教师内容自主权的核心；US6（敏感词）低成本高价值紧随
- US3/US4（统计+AI）依赖 ai-summary 新函数，放后半——即使 AI 部分延迟，龙虎榜（纯前端聚合）可先行
- 沿用 003 流程：全程 PR 流（T054 分支），每 Phase 至少一次 commit，staging 验证后等用户确认再上生产
