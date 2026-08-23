# 部署与分支策略（Deployment & Branching Strategy）

> 适用项目：Sarah-AI-Sushi（苏轼朋友圈 / 多诗人 AI 中文教学小程序）
> 创建日期：2026-08-24
> 状态：待 Review（本文档描述目标架构，落地步骤见文末 Checklist）

---

## 1. 核心原则

| 原则 | 说明 |
|------|------|
| **Supabase-First** | 所有数据存储、Auth、Edge Function、Realtime 走 Supabase（宪法 I） |
| **迁移即真相源** | `supabase/migrations/**` 是唯一 schema 来源，staging 与生产用同一套 |
| **数据库与应用分离部署** | 应用（前端 Pages + Edge Function）频繁自动；数据库迁移保守、按 schema 变更触发 |
| **环境隔离** | 测试（Testing）与生产（Production）使用**独立的 Supabase 项目 + 独立 GitHub Pages 仓库** |
| **GitHub Flow** | `testing`（staging）← `main`（production），feature 从 `testing` 切出 |

---

## 2. 环境矩阵

| 环境 | 分支 | 前端 Pages 仓库 | Supabase 项目 | 触发 |
|------|------|----------------|---------------|------|
| **Staging（预览/测试）** | `testing` | `cais_chinese_p1_sarah-staging` | `gjbdqcjyliuxrnmwotvc`（Testing） | push `testing` |
| **Production（生产）** | `main` | `cais_chinese_p1_sarah`（Pages 在 main 仓库） | `pzatgmavjvrastnumxty`（Prod） | push `main`（需审批门控） |

**关键隔离点**：
- 两个 Supabase 项目数据库完全独立（诗人/作品/留言/AI 回复/违禁词互不可见）
- 两个 Pages 仓库域名独立：
  - 生产：`https://jasonrabbittech.github.io/cais_chinese_p1_sarah/`
  - 预览：`https://jasonrabbittech.github.io/cais_chinese_p1_sarah-staging/`

---

## 3. 部署组件拆分

一次完整部署包含三个组件，风险不同，策略不同：

| 组件 | 风险 | 频率 | 策略 |
|------|------|------|------|
| **前端**（GitHub Pages） | 低，可逆 | 高（每次改 UI/JS） | 自动部署 |
| **Edge Function**（ai-reply / teacher-ops） | 低，可逆 | 中（改函数时） | 自动部署 |
| **数据库迁移**（supabase db push） | **高，部分不可逆**（删列/改类型） | 低（仅 schema 变） | **保守触发** |

### 3.1 当前问题（待修复）

| Workflow | 问题 | 影响 |
|----------|------|------|
| `deploy-staging.yml` | 只部署 `ai-reply`，**漏了 `teacher-ops`** | staging 环境教师后台写操作 404 |
| `deploy-staging.yml` | `db push` 每次 push testing 都跑 | 低风险（独立库），但可从数据库变更时单独触发 |
| `deploy-production.yml` | `db push` 每次 push main 都跑（path 含 `supabase/migrations/**`） | 日常应用改动也会动生产库 |

### 3.2 推荐的 db push 触发分离

**生产环境（保守）**：
```yaml
# deploy-production.yml
on:
  push:
    branches: [main]
    paths:
      - 'index.html'
      - 'inject-env.js'
      - 'supabase/functions/**'
      - '*.jpg'
      - 'favicon.svg'
      # 注意：'supabase/migrations/**' 从通用触发中移除

  # 迁移单独 workflow_dispatch 或单独 paths 触发
```
新增独立 workflow `deploy-production-db.yml`：
```yaml
on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'   # 仅迁移文件变更才跑
  workflow_dispatch:
```

**staging 环境（宽松）**：
- 保持应用 + db push 一起跑（独立 Testing 库，坏了 `db push` 幂等重建）
- 但**补上 `teacher-ops` 部署**（见 §5 Checklist）

---

## 4. 开发工作流

```
feature/xxx  (从 testing 切出)
   │
   │  开发 + 本地验证
   ▼
testing  ──push──►  deploy-staging.yml
   │                  ├─ 前端 → staging 仓库
   │                  ├─ Edge Functions (ai-reply + teacher-ops) → Testing Supabase
   │                  └─ db push → Testing Supabase
   │
   │  预览验证：https://jasonrabbittech.github.io/cais_chinese_p1_sarah-staging/
   ▼
main  ──PR/merge──►  deploy-production.yml (+ deploy-production-db.yml)
                       ├─ 前端 → 生产 Pages
                       ├─ Edge Functions → Prod Supabase
                       └─ db push（仅迁移变更时）→ Prod Supabase
```

**约定**：
- 日常优化/bug 修复 → 在 `testing` 改 → 验证 OK → 合 `main`
- 新功能 → 开 `feat/xxx` 分支（从 `testing` 切）→ 合 `testing` 验证 → 合 `main`
- 数据库迁移**先在 staging 验证**（独立库试错成本低），再合 main 上生产

---

## 5. 落地 Checklist

### 必须（阻塞 preview）
- [ ] `deploy-staging.yml` 的 `deploy-edge-function` 增加 `teacher-ops` 部署
- [ ] 将 `main` 同步到 `testing` 分支（当前落后 12 个提交）
- [ ] 触发 staging 部署，验证 `https://jasonrabbittech.github.io/cais_chinese_p1_sarah-staging/` 可用

### 建议（生产安全）
- [ ] 拆分生产 `db push` 为独立 workflow，按 `supabase/migrations/**` 单独触发
- [ ] 确认 Testing Supabase 项目的 `DEEPSEEK_API_KEY` / `ALLOWED_ORIGINS` 已设置（首次 db push 后）

### 文档
- [ ] 本文档 review 通过后移入 `docs/` 并 commit
- [ ] 在 `CODEBUDDY.md` 链接本策略

---

## 6. 当前状态快照（2026-08-24）

| 项目 | 状态 |
|------|------|
| 生产 Supabase `pzatgmavjvrastnumxty` | ✅ 已建表 + 4 诗人/4 作品/8 模板 + 违禁词 + ai-reply/teacher-ops 已部署 |
| 生产前端 Pages | ✅ 已上线（main 最新修复已部署） |
| Testing Supabase `gjbdqcjyliuxrnmwotvc` | ⏳ 待首次 db push（空库） |
| Staging 前端 Pages | ⏳ 待首次部署 |
| `testing` 分支 | ⚠️ 落后 main 12 个提交 |
| `deploy-staging.yml` | ⚠️ 漏 teacher-ops 部署 |
