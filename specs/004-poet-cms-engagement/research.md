# Research: 004-poet-cms-engagement

**Created**: 2026-08-25  
**Status**: Complete

---

## D1: 图片上传走 Storage 直传（不经 teacher-ops 中转）

**Decision**: admin 登录态用 supabase-js `storage.from('poet-assets').upload()` 直传；bucket 策略 = public 读 + authenticated 写。

**Rationale**:
- ≤2MB 图片 base64 走 Edge Function（body 上限与内存）不现实且慢
- supabase-js 登录态自动带用户 JWT → Storage RLS 匹配 authenticated 策略，天然鉴权（复用 003 的登录墙，零新鉴权代码）
- 公开 URL 供学生端 `<img>`/背景直接渲染（学生端无登录）

**路径规范**:
```
poet-assets/poets/{poet_id}/avatar.{ext}
poet-assets/poets/{poet_id}/bg.{ext}
poet-assets/posts/{post_id}/bg.{ext}
```
- **存相对路径**到 `avatar_url`/`bg_url` 列（渲染时前端拼 `${SUPABASE_URL}/storage/v1/object/public/poet-assets/{path}`）——避免 staging/生产 Storage 域名硬编码
- 上传幂等：`upsert: true`

**Alternatives**: ❌ teacher-ops base64 中转（体积/超时不合理）；❌ 外部图床（违反宪法 I）

---

## D10: add_poet 基底 prompt 生成（Clarification Q1）

**Decision**: add_poet 未显式传 `system_prompt` 时，由结构化字段按模板生成基底：`你是{name}（{dynasty}），{bio}。你正在使用「朋友圈」…【性格】{personality}【語氣】{tone}`（与 002 种子 prompt 同构）。表单「高級」折叠区可覆写完整 prompt。**edit_poet 改人设字段不重写已存 prompt**——仅显式传 `system_prompt` 才覆盖。

**Rationale**: 教师全程可不接触 prompt（非技术友好）；覆写能力满足高级需求；不重写保护 002 精调种子与教师已覆写的值（改人设的即时效果由 D2 的运行时拼接承担，两机制互补不冲突）。

## D11: 总结缓存（Clarification Q3）

**Decision**: 前端 localStorage 缓存（`admin_summary_cache`：summary + stats + 时间戳），统计 Tab 展示缓存值，「重新生成」才调 ai-summary。

**Rationale**: 教师点击频率低（一节课一两次），缓存省等待与成本；换设备首次点击重新生成，课堂可接受；API 契约零变化（纯前端策略）。

---

## D2: 语言风格/人设 = ai-reply 拼接指令，不改存储的 system_prompt

**Decision**: `poets.language_style / tone / personality` 三个新字段由 ai-reply 在调用 DeepSeek 前拼接为附加指令段：`{system_prompt}\n\n【風格覆蓋】語言風格：{現代語言/古代語言/粵語}；語氣：{tone}；性格：{personality}`。

**Rationale**:
- **保护 002 精调种子 prompt**（4 位诗人的 prompt 是调优过的，重写即破坏）
- 切换语言风格即时生效（下次 AI 调用即新风格），无需迁移 prompt 数据
- 字段为 NULL/空时零拼接 → 完全向后兼容（未配置人设的诗人行为不变）

**风格指令模板**（三选一的指令文本）:
| language_style | 指令 |
|----------------|------|
| modern | 請用現代白話中文回覆，親切自然，像現代人聊天 |
| classical | 請用文言文回覆，典雅古樸，可夾少量白話註解 |
| cantonese | 請用香港本地粵語口語回覆（例如：你好吖、多謝、唔該、犀利） |

**Alternatives**: ❌ add/edit_poet 重写 system_prompt（破坏种子）；❌ 前端拼 prompt（违反宪法 II：AI 组装属后端职责）

---

## D3: ai-summary 独立 Edge Function（requireTeacher 复制）

**Decision**: 新函数 `ai-summary`，鉴权/限流/CORS 逻辑与 teacher-ops 相同（复制 ~60 行，单文件自包含）。

**总结缓存（Clarification Q3）**: 前端 localStorage 缓存上次总结与时间戳（key: `admin_summary_cache`），点「重新生成」才调 AI。理由：免新表；教师换设备时首次点击重新生成即可，课堂场景可接受。API 契约不变（纯前端缓存策略）。

**Rationale**:
- 总结是 AI 长调用（10-30s），与 teacher-ops 的同步快速管理操作职责不同——独立函数独立超时与部署
- 项目 Edge Functions 均为单文件自包含模式（无 _shared import），复制保持一致性
- 两个 action：`class_summary`（班级总结）、`top_questions`（Top 3 优质问题评估）

**AI 调用规范**（宪法 VI）:
- 超时 30s（AbortController，同 ai-reply）
- 失败降级：`class_summary` 失败返回 502 + 明确错误（前端提示重试）；`top_questions` 失败返回空数组 + warning 字段
- 输出过滤：总结文本经敏感词过滤（复用 ai-reply 的词表逻辑）
- 输入组装上限：最多取近 200 条留言（按时间倒序截断，防 token 超限）

---

## D4: 龙虎榜 = admin 前端聚合，无新后端

**Decision**: 活跃度 = 学生留言数 + 追问数（该学生名下 `ai_replies.round > 1` 的行数），admin 統計 Tab 由既有 REST 读数即时计算。

**Rationale**:
- 班级规模（几十学生、几百条）前端聚合毫秒级，无需 DB 视图/函数
- 与 003 統計 Tab 的既有数据流一致（一次 comments + 一次 ai_replies 查询）
- 并列规则：同活跃度按首次留言时间先后

**Alternatives**: ❌ DB 聚合视图（过度设计）；❌ teacher-ops 统计 action（读操作不需鉴权代理，RLS public read 已够）

---

## D5: 敏感词命中返回掩码词

**Decision**: `containsProfanity` 返回**首个命中词**而非 boolean；前端 toast 与 ai-reply 422 响应均显示掩码（每字→`＊`，保留长度感知）。

**示例**: 命中"笨蛋" → 提示「留言包含違禁詞「＊＊」，請修改後再發送」。

**Rationale**:
- 学生能定位并修改（长度+位置近似提示）而不看到原文——教育场景防反向学习（spec Scenario 7）
- 前后端同一掩码规则（前端先拦、后端兜底，绕过前端时 API 响应同样含掩码原因）
- 实现成本低：命中即返回首个匹配词，掩码为纯字符替换

**边界**: 仅提示**首个**命中词（多词命中逐次修复，避免一次列出全部变相展示词表）。

---

## D6: QR = 前端 CDN 库生成

**Decision**: 学生端引入 `qrcode-generator`（CDN，~7KB 无依赖），设置按钮（⚙️ header 右侧）弹 modal 展示当前环境学生端 URL 的二维码 + 可复制链接。

**Rationale**:
- 零后端、零构建链（与学生端 supabase-js CDN 同模式）
- 内容 = `location.origin + location.pathname`（自动区分 staging/生产环境）
- fallback：库加载失败时 modal 显示纯链接文本 + 复制按钮

**Alternatives**: ❌ 后端生成（无谓的网络往返）；❌ 第三方 QR API（外部依赖 + 隐私）

---

## D7: 删除保护 = 引用检查拒绝（409）

**Decision**: `delete_poet` / `delete_post` 先查 `comments` 是否引用（post 经 post_id；poet 经其 posts 的所有 comments），有则 `409 {"error":"該詩人有 N 條留言，請先刪除留言或改用隱藏"}`。

**Rationale**:
- 002 迁移的删除链是 `poet → posts → comments → ai_replies` 全级联 CASCADE——删诗人 = 连带删光学生数据，不可逆
- 教师的"下架"诉求 90% 由 `is_published=false` 满足（003 已有开关）
- 409 语义（冲突）准确；错误信息给出出路（删留言或隐藏）

**Alternatives**: ❌ 软删除 deleted_at（增加查询复杂度，教学场景收益低）；❌ 直接级联删（数据安全事故）

---

## D8: 迁移 008 设计

**Decision**: 单迁移文件 `008_poet_cms.sql` 包含：
1. `poets` + `avatar_url TEXT`、`bg_url TEXT`、`language_style TEXT NOT NULL DEFAULT 'modern' CHECK (IN modern/classical/cantonese)`、`tone TEXT`、`personality TEXT`
2. `posts` + `bg_url TEXT`
3. Storage bucket：`INSERT INTO storage.buckets (id, name, public) VALUES ('poet-assets','poet-assets',true) ON CONFLICT DO NOTHING`
4. `storage.objects` 策略：public SELECT + authenticated INSERT/UPDATE/DELETE（scope `bucket_id='poet-assets'`）
5. 现有 4 诗人种子 `language_style='modern'`（与其 prompt 的"偏白話"一致）；李白补 `classical`？——不，统一 modern 由教师自行调整

**幂等性**: 全部 `IF NOT EXISTS` / `ON CONFLICT DO NOTHING`（宪法 VII + 002 幂等教训）。

**注意**: `storage.buckets`/`storage.objects` 是 Supabase 内部 schema，迁移操作它们是官方支持做法（db push 以 postgres 角色执行，有权限）。

---

## D9: 学生端图片回退链

**Decision**:
- 头像：`poet.avatar_url` 有值 → `<img src=publicURL>`；否则现有 emoji 渲染（不变）
- 朋友圈背景：`post.bg_url` → `poet.bg_url` → 现有 `post-bg.jpg`（CSS class 切换或 inline style）
- 作品配图（post.bg_url）优先于诗人级背景（作品级更具体）

**Rationale**: 兼容存量（4 诗人无图，emoji 模式照常）；图片缺失/加载失败自然回退（onerror → emoji）。

---

## 汇总验证映射

| # | 决策 | 验证（quickstart） |
|---|------|--------------------|
| D1 | Storage 直传 | 场景 2（上传后公开 URL 可访问） |
| D2 | 风格拼接 | 场景 4（粤语配置 → 粤语回复） |
| D3 | ai-summary | 场景 6/7（总结 + Top 问题） |
| D4 | 龙虎榜前端聚合 | 场景 5（排名与统计一致） |
| D5 | 掩码提示 | 场景 8（前后端一致） |
| D6 | QR | 场景 9 |
| D7 | 删除保护 | 场景 3 |
| D8 | 迁移 008 | db push 幂等 + 场景 1 |
| D9 | 回退链 | 场景 1（无图诗人 emoji 照常） |
