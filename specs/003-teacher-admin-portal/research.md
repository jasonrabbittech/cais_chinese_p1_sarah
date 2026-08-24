# Research: 003-teacher-admin-portal

**Created**: 2026-08-24  
**Status**: Complete（全部 NEEDS CLARIFICATION 已消解）

---

## D1: teacher-ops 的 JWT 验证方式

**Decision**: GoTrue API 转发验证——teacher-ops 将请求的 `Authorization` token 转发给 `${SUPABASE_URL}/auth/v1/user`，HTTP 200 视为有效教师，否则 401。

**Rationale**:
- 过期/吊销/伪造 token 由 Supabase Auth 权威判定，无本地验签逻辑
- 无需在 Edge Function 内管理 JWT secret（本地验签需要 `SUPABASE_JWT_SECRET`，且 Supabase 侧算法/密钥轮换时会被动失效）
- 管理操作低频（每分钟个位数），多一跳网络开销可忽略

**Alternatives considered**:
- ❌ 本地 HS256 验签（`Deno.env.get("SUPABASE_JWT_SECRET")`）：需要处理密钥可用性、算法变更；Edge Functions 环境变量集合随平台演进有漂移风险
- ❌ 仅校验 JWT 格式/有效期（不查用户）：无法感知账号被禁用/删除
- ❌ 自定义教师 token（非 Supabase Auth）：违反宪法 I（身份必须 Supabase 托管）

**关键细节**:
- anon key 充当 Bearer token 调 `/auth/v1/user` 返回 401 → 学生端/未登录调用自动被拒 ✓
- 验证请求需带 `apikey` 头（Edge Function 环境自带 `SUPABASE_ANON_KEY`）
- 同时校验响应中的 `user.role`，仅接受 `authenticated` 角色

---

## D2: 前端如何把 JWT 传给 teacher-ops

**Decision**: 依赖 supabase-js v2 `functions.invoke()` 的自动行为——用户登录态下自动附加 `Authorization: Bearer <access_token>`。

**Rationale**:
- 零手动 header 拼装，token 自动刷新（supabase-js 内建 session 刷新）
- 学生端无登录 → invoke 自动带 anon key → teacher-ops 验证失败 → 401（恰好是需求：学生端不该能调）

**Alternatives considered**:
- ❌ 手动 `getSession()` 取 token 拼 header：多此一举且要处理刷新竞态

**验证要求**: 实施第一项任务即用真实登录态验证 invoke 行为（quickstart 场景 0），若 supabase-js 版本行为不符，fallback 为手动拼 header（成本 <10 行）。

---

## D3: admin 前端架构

**Decision**: `admin/index.html` 单文件（内联 CSS/JS + CDN `@supabase/supabase-js@2`），与学生端同构。

**Rationale**:
- 宪法 III：静态站点；项目无构建工具链（无 webpack/vite），单文件是既有惯例
- 复用学生端已验证的模式：env 注入（`%%SUPABASE_URL%%`）、esc() 转义、toast、Supabase client 初始化
- 管理 UI 逻辑与学生端天然解耦（各自独立文件，互不影响缓存）

**Alternatives considered**:
- ❌ React/Vue SPA：引入构建链，违反项目极简静态站惯例
- ❌ 学生端同文件路由区分（#/admin）：违背"独立门户"需求（源码仍暴露管理逻辑）

**登录墙实现**: 
- 初始仅渲染登录卡片；`onAuthStateChange` 收到 SIGNED_IN → 渲染管理界面；SIGNED_OUT → 回登录卡片
- `getSession()` 决定首屏（刷新不掉登录态，supabase-js localStorage 持久化）

---

## D4: admin 端 Realtime

**Decision**: admin 订阅 `comments` INSERT + `ai_replies` INSERT 全局事件（不按 post_id 过滤），频道命名 `admin-comments` / `admin-replies`。

**Rationale**:
- 后台要看**全部**作品的新留言（教师不开着某个具体作品页面）
- 频道名前缀区分学生端频道（`comments-post-*`），避免 removeChannel 误伤
- INSERT 事件直接 append 到列表顶部；DELETE 事件（教师自己删）本地移除即可

**Alternatives considered**:
- ❌ 每 post 一频道批量订阅：频道数随作品增长，无必要
- ❌ 轮询：延迟高且浪费（Realtime 基础设施已就绪）

**边界处理**:
- 教师自己的删除操作：UI 已本地移除 + Realtime DELETE 事件幂等处理（元素不存在则忽略）
- ai_replies INSERT 到未知 comment（列表未加载该留言）：直接 prepend 该留言线程（调 REST 补拉单条）

---

## D5: 部署原子性与切换窗口

**Decision**: teacher-ops（鉴权版）+ index.html（瘦身版）+ admin/ 在同一次 CI 发布中原子更新。

**Rationale**:
- GitHub Actions 单次 run 部署全部组件，无长时间不一致窗口
- CI job 顺序内（frontend → edge function）的分钟级窗口中，最坏情形 = 旧学生端的教师操作报 401——而这些操作正是要移除的，影响为零

**Alternatives considered**:
- ❌ 先发 teacher-ops 再发前端：人为制造窗口期，无收益

**Auth 配置时序**（部署前手动完成，见 quickstart.md）:
1. 两环境 Dashboard → Authentication → 关闭 Allow new users to sign up
2. 两环境 Dashboard → Authentication → Add user 创建教师账号
   - 若先部署后配置：注册关闭前 admin 登录页可用但无账号可登录（安全无虞，只是不可用）

---

## D6: 无迁移的 source 语义扩展

**Decision**: `teacher-edited` 直接写入现有 TEXT 列；不新增 CHECK 约束、不动表结构。

**Rationale**:
- `ai_replies.source` 建表时无枚举约束（002/004 迁移均为 `TEXT`）
- 加 CHECK 约束需要迁移且约束未来新值（004 可能加更多来源），收益为零
- admin 端 `replySourceBadge` 映射新增：`teacher-edited → ✏️ 教師修改`

**Alternatives considered**:
- ❌ 新增 `edited_at`/`edited_by` 列：超出 spec 范围（spec 只要求可区分 AI 原文 vs 人工修改），004+ 有需要再演进

---

## 汇总

| # | 决策 | 风险等级 | 验证方式 |
|---|------|---------|---------|
| D1 | GoTrue 转发验证 | 低 | quickstart 场景 3（伪造/anon token 401） |
| D2 | invoke 自动带 token | 中（依赖库行为） | quickstart 场景 0（第一时间验证） |
| D3 | 单文件 + onAuthStateChange 登录墙 | 低 | quickstart 场景 1/2 |
| D4 | admin 全局 Realtime 频道 | 低 | quickstart 场景 6 |
| D5 | 原子部署 | 低 | staging 全流程走一遍 |
| D6 | source 免迁移扩展 | 低 | quickstart 场景 5（编辑后徽章） |
