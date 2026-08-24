# Data Model: 003-teacher-admin-portal

**Created**: 2026-08-24  
**结论**: 零新表、零迁移。本 feature 的数据变更全部为**行为语义**变更。

---

## 1. 身份模型（Supabase Auth 托管）

```
auth.users (Supabase 内置)
  └── teacher 账号（1–5 个，Dashboard 手动创建，注册关闭）
        │
        │ signInWithPassword → session (access_token = JWT)
        ▼
teacher-ops Edge Function
  └── requireTeacher(): 转发验证 JWT → 有效则放行（service_role 写库）
```

| 项 | 规则 |
|----|------|
| 身份唯一性 | Supabase Auth email 唯一 |
| 授权语义 | **凡能登录者即教师**（注册关闭 → 只有 Dashboard 创建的账号存在） |
| token 生命周期 | supabase-js 自动刷新；teacher-ops 每次请求实时验证（过期即拒） |
| 密码恢复 | Dashboard 手动重置（spec Clarification Q3） |
| 角色 | JWT 中 `role: authenticated`（anon role 拒绝） |

**RLS 影响**: `auth.users` 由 Supabase 全托管，无自定义策略。业务表 RLS 不变（写仍仅 service_role，经 teacher-ops）。

---

## 2. 业务表变更：无结构变更，仅 source 语义扩展

### ai_replies.source（既有 TEXT 列，无约束）

| 值 | 含义 | 写入方 | 变更 |
|----|------|--------|------|
| deepseek | AI 生成 | ai-reply | 既有 |
| fallback / fallback-nokey / fallback-filtered | 预置回退 | ai-reply | 既有 |
| content-filter | 内容拦截 | ai-reply | 既有 |
| **teacher-edited** | **教师人工修改** | **teacher-ops (edit_reply)** | 🆕 本 feature |

**规则**（FR-005，Clarification Q1）:
- `edit_reply` 操作对**任意轮次**生效（不限于最新轮）
- 保存即置 `source = 'teacher-edited'`（不可逆标记；再次编辑保持该值）
- admin 端徽章显示 `✏️ 教師修改`；学生端不显示来源徽章（现状不变）

### 其余表

| 表 | 变更 |
|----|------|
| comments | 无结构变更；DELETE 经 teacher-ops（级联删 ai_replies，既有 ON DELETE CASCADE） |
| poets / posts | 无变更（toggle_publish 已有） |
| profanity_words | 无变更（CRUD 已有，加 JWT 后自动受保护） |
| reply_templates | 无结构变更；CRUD 新增经 teacher-ops |

---

## 3. RLS 策略现状确认（本 feature 修复的依据）

| 表 | SELECT | INSERT | UPDATE/DELETE | 结论 |
|----|--------|--------|---------------|------|
| comments | public | public（学生留言） | service_role only | 🔴 前端 anon 直删被静默拒 → 本 feature 改走 teacher-ops |
| ai_replies | public | service_role | service_role only | 🔴 前端 anon 直改被静默拒 → 同上 |
| reply_templates | public | service_role | service_role only | 🔴 同上 |
| poets / posts / profanity_words | public | service_role | service_role | ✅ 002 已走 teacher-ops |

> 静默失败根因：旧教师后台解构 `err`（supabase-js v2 实际返回 `error`），RLS 拒绝被吞。admin 端全部写操作改走 teacher-ops 后此路径不复存在；**读操作错误处理同步修正**（`err` → `error`）。

---

## 4. 实体关系（不变，仅标注访问路径）

```
poets (1) ──< posts (1) ──< comments (1) ──< ai_replies
                                  │
auth.users (teacher) ──JWT──> teacher-ops ──service_role──> 全部写操作
students (anon) ───────────────> comments INSERT（唯一学生写路径）
```

---

## 5. 数据量与性能

| 项 | 值 | 说明 |
|----|-----|------|
| auth.users | < 5 行 | 教师账号 |
| /auth/v1/user 验证延迟 | ~50–150ms | 每次管理操作前置开销，可接受 |
| Realtime admin 频道 | 2 个/教师会话 | 免费层连接限额内 |
