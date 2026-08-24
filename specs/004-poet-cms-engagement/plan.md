# Implementation Plan: 诗人 CMS 与课堂互动增强

**Feature ID**: 004  
**Feature Name**: poet-cms-engagement  
**Plan Version**: 1.1  
**Created**: 2026-08-25  
**Status**: Ready for Implementation (Phase 0/1 Complete；v1.1 整合 clarify 三项决议)  
**Depends on**: 003-teacher-admin-portal ✅（已部署 staging；004 开发基于其代码）

---

## Technical Context / 技术上下文

### Technology Stack（继承 + 少量新增）

| Component | Technology | 变更 | Justification |
|-----------|------------|------|---------------|
| Admin 前端 | `admin/index.html` 单文件 | ⚠️ 扩展 | 003 Tab 架构直接复用 |
| 学生端 | `index.html` 单文件 | ⚠️ 小改 | 仅设置按钮 + QR + 图片渲染 |
| Edge Functions | Deno + TS | ⚠️ 修改×1 🆕×1 | teacher-ops 加 6 action；新 `ai-summary` |
| AI | DeepSeek API | ⚠️ 扩展 | ai-reply 拼风格指令；ai-summary 总结+评估 |
| 存储 | Supabase Storage | 🆕 | `poet-assets` bucket（头像/背景/配图） |
| DB | PostgreSQL | 🆕 迁移 008 | poets/posts 新字段 + bucket + 策略 |
| QR 生成 | 前端 CDN 库（`qrcode-generator`） | 🆕 | 零构建链，与学生端 CDN 模式一致 |

### New Dependencies

| Item | Purpose |
|------|---------|
| 迁移 `008_poet_cms.sql` | poets/posts 字段扩展、storage bucket、RLS 策略、language_style 种子 |
| `supabase/functions/ai-summary/index.ts` | 班级总结 + 问题质量评估（宪法 II：AI 走 Edge Function） |
| QR CDN 库 | 学生端二维码生成（无后端依赖） |

### Storage Estimates

| Data Type | Est. Size |
|-----------|-----------|
| 图片（头像/背景/配图，≤2MB/张） | < 50 MB（教学规模） |
| poets/posts 新字段 | < 100 KB |
| ai_replies 无变化（风格拼接不改存储） | — |

---

## Constitution Check / 宪法检查

### Pre-Implementation Compliance

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Supabase-First | Storage 用 Supabase Storage；schema 走迁移 | ✅ PASS | 迁移 008 管理 bucket + 策略 |
| II. Edge Functions for AI | AI 总结/评估走 Edge Function；TS；输入验证 | ✅ PASS | ai-summary 与 ai-reply 同规范 |
| III. Static Site | 学生端/admin 静态；QR 前端生成 | ✅ PASS | CDN 库符合既有模式 |
| IV. Security by Default | ai-summary 复用 003 JWT 鉴权；图片上传限 authenticated | ✅ PASS | bucket 策略：public 读、authenticated 写 |
| V. GitHub Flow | feat/004 → PR testing → PR main | ✅ PASS | 沿用 003 恢复的完整流程 |
| VI. AI Content Safety | ai-summary 超时 30s + 失败降级；输出过滤 | ✅ PASS | 总结失败提示重试，不静默 |
| VII. Code Quality | 新代码 JSDoc；迁移带注释 | ✅ PASS | — |
| VIII. Spec-Driven | spec →（clarify）→ plan → tasks → implement | ✅ PASS | 本 plan |

**Result**: ✅ **PASS** — 全部原则合规。

---

## Phase 0: Research & Design Decisions / 研究决策

> 详细论证见 [research.md](research.md)

| # | 决策 | 一句话 |
|---|------|--------|
| D1 | 图片上传 = Storage 直传（admin 登录态），不经 teacher-ops 中转 | 2MB 图走 Edge Function base64 不现实 |
| D2 | 语言风格/人设 = ai-reply **拼接指令**到既有 system_prompt，不改存储 | 保护 002 精调的种子 prompt，切换即时生效 |
| D3 | ai-summary 独立 Edge Function，requireTeacher 逻辑复制（~40 行） | 单文件自包含是项目既定模式 |
| D4 | 龙虎榜 = admin 前端聚合（comments + ai_replies round>1），无新后端 | 数据量小（班级），前端即时计算 |
| D5 | 敏感词命中返回**掩码词**（每字→＊），前后端一致 | 教育场景不反向展示违禁词 |
| D6 | QR = CDN `qrcode-generator` 前端生成，内容为当前环境学生端 URL | 零后端 |
| D7 | 删除保护 = 有留言引用的诗人/作品拒绝删除（409） | ON DELETE CASCADE 链会连带删学生数据 |
| D8 | 迁移 008 含 bucket 创建 + storage.objects 策略 + 现有诗人 language_style 种子 'modern' | 与 002 prompt 风格（偏白话）一致 |
| D9 | 学生端图片回退链：avatar_url > emoji；post.bg_url > poet.bg_url > 默认图 | 兼容无图诗人（emoji 模式不破坏） |
| D10 | add_poet 基底 prompt = 模板自动生成（结构化字段拼装）+ `system_prompt` 可选覆写；**edit_poet 改人设字段不重写已有 prompt** | Clarification Q1：保护 002 种子与教师已覆写值 |
| D11 | 总结缓存 = 前端 localStorage（上次总结+时间戳），「重新生成」才调 AI | Clarification Q3：免新表，API 契约不变 |

---

## Phase 1: Design Artifacts / 设计产物

| File | Purpose |
|------|---------|
| [research.md](research.md) | 9 项决策论证 |
| [data-model.md](data-model.md) | 字段扩展、Storage 模型、活跃度口径 |
| [contracts/teacher-ops-api.md](contracts/teacher-ops-api.md) | teacher-ops 004 增量契约（6 个新 action） |
| [contracts/ai-summary-api.md](contracts/ai-summary-api.md) | ai-summary 全新契约 |
| [quickstart.md](quickstart.md) | 端到端验证场景 |

---

## Project Structure / 项目结构（目标）

```
Sarah-AI-sushi/
├── index.html                        # ⚠️ 设置按钮+QR 弹窗+图片渲染回退链
├── admin/
│   └── index.html                    # ⚠️ 內容管理 Tab 加诗人/作品 CRUD+图片上传；統計 Tab 加龙虎榜+Top问题+AI总结
├── supabase/
│   ├── functions/
│   │   ├── ai-reply/index.ts         # ⚠️ 风格指令拼接 + 敏感词命中返回（掩码）
│   │   ├── teacher-ops/index.ts      # ⚠️ +6 action（poet/post CRUD + 删除保护）
│   │   └── ai-summary/index.ts       # 🆕 班级总结 + 问题质量评估
│   └── migrations/
│       └── 008_poet_cms.sql          # 🆕
└── .github/workflows/                # ⚠️ 两 workflow 加 ai-summary 部署
```

---

## Implementation Order / 实施顺序

1. **迁移 008**：字段 + bucket + 策略 + 种子（一切的地基）
2. **teacher-ops**：poet/post CRUD（含删除保护；add_poet 按模板生成基底 prompt，`system_prompt` 可选覆写——D10）
3. **ai-reply**：风格指令拼接 + 敏感词命中掩码返回
4. **ai-summary**：新函数（总结 + 质量评估），部署加 CI
5. **admin 內容管理 Tab**：诗人/作品 CRUD UI + 表单 modal（含「高級」折叠区编辑完整 prompt）+ 图片上传
6. **admin 統計 Tab**：龙虎榜 + Top 3 优质问题 + 总结展示（localStorage 缓存 + 重新生成——D11）
7. **学生端**：设置按钮 + QR 弹窗（仅 QR，Clarification Q2）+ 图片回退链渲染
8. **验证**：quickstart 全场景 → PR testing → staging 验证 →（用户确认）→ PR main

---

## Risks / 风险

| Risk | Impact | Mitigation |
|------|--------|------------|
| Storage bucket 策略配置错误 → 上传 403 | High | 迁移 008 策略经 quickstart 场景 2 首验；错误信息明确指向权限 |
| 风格拼接稀释 002 精调 prompt | Medium | 指令段追加在 prompt 末尾且限定"风格覆盖"语义；quickstart 场景 4 对比验证 |
| DeepSeek 总结 token 超限（数据多） | Medium | 输入截断（近 200 条互动）；max_tokens 限制；失败明确提示重试 |
| 图片 URL 硬编码环境（staging/生产 Storage 域名不同） | Low | 存相对路径（`poets/{id}/avatar.jpg`），渲染时经当前 SUPABASE_URL 拼 public URL |
| QR CDN 不可用 | Low | 备选库（qrcodejs）同 CDN 模式；加载失败 toast 提示手动复制链接 |

---

**End of Plan** — 详见 research.md / data-model.md / contracts/ / quickstart.md
