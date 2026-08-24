# Quickstart: 003-teacher-admin-portal 验证指南

**Created**: 2026-08-24  
**用途**: 端到端验证教师后台独立门户。按场景顺序执行，全部通过 = feature 验收。

---

## 前置条件（部署前手动配置，两环境各一次）

### A. Supabase Auth 配置（Dashboard）

1. **禁止公开注册**：Authentication → Sign In / Up → Email → 关闭 `Allow new users to sign up`
2. **创建教师账号**：Authentication → Users → `Add user` → 填邮箱 + 强密码 → `Create user`
3. 确认 User list 仅显示手动创建的教师账号

> 环境对照：Production `pzatgmavjvrastnumxty`、Testing `gjbdqcjyliuxrnmwotvc`（两环境账号可不同密码）

### B. 本地运行

```bash
python3 -m http.server 8000
# 学生端: http://localhost:8000/index.html（env 未注入时功能受限，验证安全项足够）
```

---

## 场景验证

### 场景 0: invoke 自动携带 JWT（契约基石，实施第一项验证）

1. admin 登录后任一写操作（如 toggle_word）成功
2. DevTools Network 查看该请求 → Request Headers 含 `Authorization: Bearer eyJ...`（非 anon key 短 token）
3. teacher-ops 日志确认验证通过

**预期**: invoke 自动附登录用户 token。若不符 → 按 research.md D2 fallback 手动拼 header。

### 场景 1: 登录墙

| 步骤 | 预期 |
|------|------|
| 无痕窗口打开 `/admin/` | 仅登录卡片，无任何管理数据/XHR 业务请求 |
| 输入错误密码 | 明确错误提示（"郵箱或密碼錯誤"），不进入管理界面 |
| 输入正确凭据 | 进入管理界面（4 Tab） |
| 刷新页面 | 仍登录态（session 持久化） |
| 点擊登出 | 回登录卡片；再刷新仍是登录卡片 |

### 场景 2: 未授权访问 teacher-ops

```bash
# 无 token
curl -s -X POST {URL}/functions/v1/teacher-ops -H "Content-Type: application/json" -d '{"action":"list"}'
# anon key 伪造
curl -s -X POST {URL}/functions/v1/teacher-ops -H "Authorization: Bearer <ANON_KEY>" -H "Content-Type: application/json" -d '{"action":"delete_all_comments","confirm":true}'
```

**预期**: 两者均 `401 {"error":"..."}`，数据库零变更。

### 场景 3: 学生端零暴露

```bash
curl -s https://jasonrabbittech.github.io/cais_chinese_p1_sarah/ | grep -cE "TEACHER_PASSWORD|loadTComments|teacher-ops"
```

**预期**: `0`。学生端页面无「教師後台」按钮；学生功能回归：留言 → AI 回复 → 追問 → 多轮 → 切诗人/作品全部正常。

### 场景 4: 写操作实际生效（修复静默失败 bug）

| 操作 | 验证 |
|------|------|
| 删除单条留言 | 留言+其全部 AI 回复消失（级联）；刷新后台仍在删除态 |
| 编辑第 2 轮 AI 回复 | 保存后新文本显示；徽章变 `✏️ 教師修改` |
| 新增/编辑/删除模板 | 模板 Tab 列表实时反映；ai-reply 无 key 时的 fallback 引用新模板 |
| 切换诗人发布开关 | 学生端该诗人消失/出现 |
| 违禁词增删启停 | 学生端提交含该词留言被拦 |

**关键**: 每项写后**刷新页面重读**确认落库（区别于仅 UI 更新）。

### 场景 5: teacher-edited 审计标记

1. 编辑任意一轮 AI 回复 → 保存
2. 该条回复徽章：`✏️ 教師修改`（与其他 AI 回复的来源徽章并存区分）
3. 直接查 DB：`SELECT source FROM ai_replies WHERE id='<编辑的那条>'` → `teacher-edited`

### 场景 6: 后台实时更新

1. 后台开「所有留言」Tab
2. 另一浏览器（学生身份）提交新留言
3. **预期**: 不刷新后台页面，新留言线程即时出现在列表顶部
4. 学生收到 AI 第 1 轮回复 → 后台该线程下即时出现回复节点

### 场景 7: 限流

```bash
# 连续 13+ 次快速调用（带合法 JWT）
for i in $(seq 1 15); do curl -s -o /dev/null -w "%{http_code} " -X POST {URL}/functions/v1/teacher-ops \
  -H "Authorization: Bearer <TEACHER_JWT>" -H "Content-Type: application/json" \
  -d '{"action":"toggle_publish","table":"poets","id":"<某uuid>"}'; done
```

**预期**: 前 12 次 `200`，之后 `429`（注意：toggle 两次回原状，数据无损）。

### 场景 8: 双环境部署

| URL | 预期 |
|-----|------|
| `https://jasonrabbittech.github.io/cais_chinese_p1_sarah/admin/` | 登录页 200 |
| `https://jasonrabbittech.github.io/cais_chinese_p1_sarah-staging/admin/` | 登录页 200 |
| 各自登录后操作写入**各自** Supabase 项目（数据隔离） | ✓ |

---

## 部署流程（宪法 V：本次走完整 PR 流）

```bash
# 1. 功能分支开发
git checkout -b feat/003-teacher-admin-portal

# 2. 实现（顺序见 plan.md Implementation Order）+ 本地场景 0-6 自测

# 3. PR → testing 分支（staging 自动部署）
#    在 staging 环境跑全部场景（含 7、8）

# 4. PR → main（production 审批部署）
#    生产环境复跑场景 1-6（抽查即可）

# 5. 验证后关闭 spec 的 O-1/O-2：CODEBUDDY.md 与 002 spec 的 Open Issues 更新
```

---

## 通过标准

全部 9 个场景（0–8）预期结果达成 = feature 验收通过，可合入 main。
