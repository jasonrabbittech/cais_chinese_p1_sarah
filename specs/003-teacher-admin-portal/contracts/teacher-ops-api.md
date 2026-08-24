# Contract: teacher-ops Edge Function API

**Feature**: 003-teacher-admin-portal  
**Endpoint**: `POST {SUPABASE_URL}/functions/v1/teacher-ops`  
**Auth**: **必须**——`Authorization: Bearer <教师 JWT>`（Supabase Auth 登录获得；supabase-js `functions.invoke` 登录态自动附加）

---

## 通用规则

| 项 | 规则 |
|----|------|
| 方法 | `POST`（`OPTIONS` preflight 返回 204 + CORS 头） |
| Content-Type | `application/json` |
| 鉴权 | 每个业务 action 前执行 `requireTeacher()`：转发 token 到 `/auth/v1/user`，非 200 → `401` |
| 限流 | 12 次/分钟/IP（同 ai-reply 令牌桶模式），超限 → `429` |
| CORS | `ALLOWED_ORIGINS` 白名单（学生端与 admin 同域，已覆盖） |
| 错误响应统一格式 | `{ "error": "<原因>" }` |
| 成功响应统一格式 | `{ "success": true, ...附加字段 }` |

## 错误码总表

| HTTP | 场景 |
|------|------|
| 400 | body 缺字段 / action 未知 / 参数非法 |
| 401 | 无 Authorization / token 无效 / 过期 / anon key |
| 404 | 目标记录不存在（edit_reply / toggle 类） |
| 405 | 非 POST 方法 |
| 409 | 唯一约束冲突（add_word / add_template 重名） |
| 429 | 限流触发 |
| 500 | 上游 Supabase REST 失败 / 未捕获异常 |

---

## Actions

### 既有操作（002，加 JWT 后行为不变）

#### toggle_publish
```json
// 请求
{ "action": "toggle_publish", "table": "poets" | "posts", "id": "<uuid>" }
// 成功 200
{ "success": true, "is_published": true }
```
校验：`table ∈ {poets, posts}`，`id` 为合法 UUID，记录须存在（否则 404）。

#### add_word / toggle_word / delete_word
```json
// add_word 请求
{ "action": "add_word", "word": "<string>", "is_regex": false }
// 成功 200
{ "success": true }
```
校验：`word` 非空且 ≤100 字符（🆕 002 审查发现的长度缺失，本次一并加上）；重复词 → 409。

---

### 新增操作（003）

#### delete_comment —— 删除单条留言
```json
// 请求
{ "action": "delete_comment", "id": "<comment_uuid>" }
// 成功 200
{ "success": true }
```
行为：删除 comments 行；关联 ai_replies 由 DB `ON DELETE CASCADE` 级联删除。记录不存在 → 404（幂等语义：不存在视为已删，返回 200 亦可——采用 404 保持显式）。

#### delete_all_comments —— 清空全部留言
```json
// 请求
{ "action": "delete_all_comments", "confirm": true }
// 成功 200
{ "success": true, "deleted": <int> }
```
校验：`confirm` 必须显式为 `true`（防误触；UI 侧另有 confirm 弹窗双重防护）。返回实际删除行数。

#### edit_reply —— 编辑任意轮 AI 回复
```json
// 请求
{ "action": "edit_reply", "id": "<ai_reply_uuid>", "reply_text": "<新文本>" }
// 成功 200
{ "success": true, "reply_text": "<新文本>", "source": "teacher-edited" }
```
校验：`reply_text` 非空且 ≤2000 字符；记录须存在（404）。
行为：更新 `reply_text` 并**无条件置 `source = 'teacher-edited'`**（Clarification Q1：审计标记）。

#### add_template / edit_template / delete_template —— 模板 CRUD
```json
// add_template 请求
{ "action": "add_template", "type": "generic" | "smart", "reply": "<文本>", "keyword": "<可选，smart 必填>" }
// edit_template 请求
{ "action": "edit_template", "id": "<uuid>", "reply": "<新文本>", "keyword": "<可选>" }
// delete_template 请求
{ "action": "delete_template", "id": "<uuid>" }
// 成功 200
{ "success": true }
```
校验：`type ∈ {generic, smart}`；`reply` 非空 ≤1000 字符；smart 类型 `keyword` 非空；edit/delete 目标须存在（404）。

---

## admin 前端读取路径（不经 teacher-ops）

| 数据 | 方式 |
|------|------|
| comments / ai_replies / poets / posts / profanity_words / reply_templates | 登录态 supabase-js 直读（RLS public SELECT），Realtime 订阅同权限 |

> 读取无 JWT 强制需求（RLS 本就 public read）；敏感度集中在写操作，全部收敛于本契约。

---

## 变更摘要（相对 002 版 teacher-ops）

| 项 | 002 现状 | 003 目标 |
|----|---------|---------|
| 鉴权 | 无 | requireTeacher（401） |
| 限流 | 无 | 12/min/IP（429） |
| delete_comment / delete_all_comments / edit_reply / 模板 CRUD | 不存在（前端 anon 直写，被 RLS 静默拒） | 经本函数 service_role 落库 |
| add_word 长度校验 | 缺失 | ≤100 字符 |
