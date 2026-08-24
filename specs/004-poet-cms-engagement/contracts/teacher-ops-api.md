# Contract: teacher-ops 004 增量（poet/post CRUD）

**Feature**: 004-poet-cms-engagement  
**Endpoint**: `POST {SUPABASE_URL}/functions/v1/teacher-ops`（不变）  
**鉴权/限流/CORS/错误格式**: 全部沿用 003 契约（`specs/003-teacher-admin-portal/contracts/teacher-ops-api.md`），本文档仅记录**新增 action**。

---

## 新增 Actions（6 个）

### add_poet —— 新增诗人

```json
// 请求
{
  "action": "add_poet",
  "name": "王維",
  "dynasty": "唐",
  "bio": "詩佛，山水田園派…",
  "avatar_emoji": "🏔️",
  "language_style": "classical",
  "tone": "恬淡閒適",
  "personality": "愛山水…",
  "avatar_url": null,
  "bg_url": null,
  "system_prompt": null             // 可选（高级覆写）：默认由结构化字段按模板生成基底 prompt
}
// 成功 200
{ "success": true, "id": "<新诗人uuid>", "is_published": false }
```

字段规则：`name`（必填 ≤30 字符，唯一，重名 409）；`dynasty`/`bio`（必填，bio ≤500）；`avatar_emoji`（可选默认 📜）；`language_style`（可选默认 `modern`，枚举校验）；`tone`/`personality`（可选各 ≤200）；`avatar_url`/`bg_url`（可选，Storage 相对路径）；`system_prompt`（可选 ≤2000，提供时**覆盖**模板生成值——Clarification Q1「自動+可覆寫」；未提供时由 name/dynasty/bio/tone/personality 拼装）。**新诗人默认未发布**。

### edit_poet —— 编辑诗人

```json
// 请求（任意字段部分更新）
{ "action": "edit_poet", "id": "<uuid>", "language_style": "cantonese", "tone": "俏皮" }
// 成功 200
{ "success": true }
```

校验：id 存在（404）；字段规则同 add_poet；`system_prompt` 同样可选覆写（教师改动人设字段时**不重写**已有 prompt，仅显式传 system_prompt 才覆盖——保护 002 种子与教师已覆写的值）。

### delete_poet —— 删除诗人（带引用保护）

```json
// 拒绝 409（有留言引用）
{ "error": "該詩人名下有 12 條學生留言，請先刪除留言或改用「隱藏」" }
// 成功 200
{ "success": true }
```

行为：统计该诗人全部作品的 comments 总数；>0 → 409（含数量与出路提示）；=0 → 删除（级联删其 posts，此时无学生数据可损失）。

### add_post —— 新增作品

```json
// 请求
{
  "action": "add_post",
  "poet_id": "<uuid>",
  "title": "山居秋暝",
  "content": "空山新雨後…",
  "background_story": "…",
  "bg_url": null,
  "is_published": false
}
// 成功 200
{ "success": true, "id": "<uuid>" }
```

校验：poet_id 存在（404）；title ≤100；content ≤2000；默认未发布。

### edit_post —— 编辑作品

```json
{ "action": "edit_post", "id": "<uuid>", "content": "…", "bg_url": "posts/{id}/bg.jpg" }
// 成功 200
{ "success": true }
```

### delete_post —— 删除作品（带引用保护）

```json
// 拒绝 409
{ "error": "該作品下有 5 條學生留言，請先刪除留言或改用「隱藏」" }
// 成功 200
{ "success": true }
```

---

## 图片上传（不在本契约内，Storage 直传）

admin 登录态经 supabase-js `storage.from('poet-assets').upload(path, file, { upsert: true })` 直传（research D1），成功后将**相对路径**作为 `avatar_url`/`bg_url` 值传给上表 add/edit action 落库：

```
poet-assets/poets/{poet_id}/avatar.{ext}
poet-assets/poets/{poet_id}/bg.{ext}
poet-assets/posts/{post_id}/bg.{ext}
```

前端渲染拼接：`${SUPABASE_URL}/storage/v1/object/public/poet-assets/{相对路径}`。
