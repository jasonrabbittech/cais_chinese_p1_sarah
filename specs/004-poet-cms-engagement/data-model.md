# Data Model: 004-poet-cms-engagement

**Created**: 2026-08-25  
**迁移**: `supabase/migrations/008_poet_cms.sql`（唯一迁移，幂等）

---

## 1. poets 表扩展

| 新字段 | 类型 | 约束/默认 | 用途 |
|--------|------|-----------|------|
| avatar_url | TEXT | NULL | 头像图**相对路径**（`poets/{id}/avatar.jpg`），NULL 时前端回退 emoji |
| bg_url | TEXT | NULL | 诗人级朋友圈背景相对路径 |
| language_style | TEXT | NOT NULL DEFAULT 'modern'，CHECK ∈ {modern, classical, cantonese} | AI 回复语言风格 |
| tone | TEXT | NULL | 语气语调自由文本（如「幽默親切」），拼接进 AI 指令 |
| personality | TEXT | NULL | 性格特点自由文本，拼接进 AI 指令 |

**组装规则**（ai-reply，research D2）：三个字段任一非空时，在 system_prompt 末尾追加风格指令段；全空时零改动（向后兼容）。

## 2. posts 表扩展

| 新字段 | 类型 | 约束 | 用途 |
|--------|------|------|------|
| bg_url | TEXT | NULL | 作品级配图相对路径（渲染优先于诗人级） |

## 3. Storage 模型

```
bucket: poet-assets (public)
├── poets/{poet_id}/avatar.{jpg|png|webp}
├── poets/{poet_id}/bg.{jpg|png|webp}
└── posts/{post_id}/bg.{jpg|png|webp}
```

| 项 | 规则 |
|----|------|
| 读 | public（学生端无登录直接渲染 public URL） |
| 写（INSERT/UPDATE/DELETE） | authenticated（教师登录态直传，003 登录墙复用） |
| 上传上限 | 前端校验 ≤2MB + jpg/png/webp；服务端 bucket 不另设配额（教学规模） |
| 存储值 | DB 列存**相对路径**（不含域名），渲染时前端拼 `${SUPABASE_URL}/storage/v1/object/public/poet-assets/{path}`——环境无关 |

## 4. teacher-ops 操作集扩展（004）

| action | 要点 | 删除保护 |
|--------|------|---------|
| add_poet | 必填 name/dynasty/bio；可选 emoji/人设/风格/图片路径；新诗人默认 is_published=false | — |
| edit_poet | 任意字段部分更新；language_style 校验枚举 | — |
| delete_poet | — | 有留言引用 → 409（提示先删留言或隐藏） |
| add_post | 必填 poet_id/title/content；可选 background_story/bg_url | — |
| edit_post | 部分更新 | — |
| delete_post | — | 有留言引用 → 409 |

> 鉴权/限流/CORS/错误格式全部复用 003 契约，详见 [contracts/teacher-ops-api.md](contracts/teacher-ops-api.md)。

## 5. ai_replies / comments：零结构变更

- 敏感词拦截响应格式变化（422 + hit_word 掩码）——行为变更非结构变更
- `teacher-edited`（003）语义不变

## 6. 统计口径（龙虎榜，research D4）

```
活跃度(学生) = COUNT(comments WHERE student_name=X) + COUNT(ai_replies r JOIN comments c
              ON r.comment_id=c.id WHERE c.student_name=X AND r.round>1)
Top 3：活跃度降序，并列按首次留言时间升序
Top 3 优质问题：AI 评估（ai-summary top_questions），口径=相关性与思考深度
```

## 7. 实体关系（不变 + 图片引用）

```
poets (1) ──< posts (1) ──< comments (1) ──< ai_replies
  │              │
  └── avatar_url └── bg_url      ┐
      bg_url                     ├─ 相对路径 → storage.public URL
      language_style/tone/personality（AI 指令拼接，非外键）
                                ┘
auth.users(teacher) ──JWT──> teacher-ops / ai-summary ──service_role──> 写操作
                             └─storage.upload（authenticated 直传）
```

## 8. 数据量估算

| 项 | 值 |
|----|-----|
| 诗人 × 图片 3 张 | < 30 MB |
| 总结输入截断上限 | 200 条互动 |
| 新字段存储 | < 100 KB |
