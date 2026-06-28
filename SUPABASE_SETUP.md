# Supabase CI/CD 配置指南

## 概述

本项目使用 GitHub Actions 自动化部署：
- **前端 (HTML)**: 自动部署到 GitHub Pages
- **Edge Function**: 自动部署到 Supabase
- **数据库**: 通过 Supabase CLI 管理迁移

## 配置步骤

### 1. 获取 Supabase 访问令牌

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
2. 点击 "Generate new token"
3. 名称: `GitHub Actions`
4. 权限: 选择需要的权限
5. 复制生成的 token

### 2. 配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 secrets：

1. 进入 `Settings` → `Secrets and variables` → `Actions`
2. 点击 `New repository secret`

添加以下 secrets：

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| `SUPABASE_ACCESS_TOKEN` | 步骤1获取的 token | Supabase 访问令牌 |
| `SUPABASE_PROJECT_REF` | `pzatgmavjvrastnumxty` | Supabase 项目 ID |
| `SUPABASE_URL` | `https://pzatgmavjvrastnumxty.supabase.co` | Supabase 项目 URL |
| `SUPABASE_ANON_KEY` | (从 Supabase Dashboard 获取) | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | (从 Supabase Dashboard 获取) | Supabase Service Role Key |
| `DEEPSEEK_API_KEY` | `sk--your-key` | DeepSeek API Key |

### 3. 配置 GitHub Pages

1. 进入 `Settings` → `Pages`
2. Source 选择 `GitHub Actions`
3. 保存

### 4. 配置 Environments（可选）

为了更好的部署控制：

1. 进入 `Settings` → `Environments`
2. 创建 `production` 环境
   - 可选：添加保护规则（如需要审批）
3. 创建 `staging` 环境

## 使用流程

### 开发新功能

```bash
# 1. 从 testing 分支创建新功能分支
git checkout testing
git pull origin testing
git checkout -b feature/新功能名称

# 2. 开发和测试
# ... 修改代码 ...
# 本地测试: 直接在浏览器打开 index.html

# 3. 提交到功能分支
git add .
git commit -m "feat: 添加新功能"
git push origin feature/新功能名称

# 4. 创建 PR 到 testing 分支
# 在 GitHub 上创建 Pull Request
# 目标: testing ← 源: feature/新功能名称
```

### 测试环境

```bash
# 直接推送到 testing 分支（简单方式）
git checkout testing
git pull origin testing
# ... 修改代码 ...
git add .
git commit -m "test: 测试新功能"
git push origin testing

# 自动触发 GitHub Actions
# → 部署到测试环境
# → 可以在 https://jasonrabbittech.github.io/cais_chinese_p1_sarah/ 测试
```

### 生产发布

```bash
# 方式1: 合并 testing 到 main（推荐）
git checkout main
git pull origin main
git merge testing
git push origin main

# 方式2: 通过 PR
# 在 GitHub 上创建 PR: main ← testing
# 审查通过后合并

# 自动触发 GitHub Actions
# → 部署到生产环境
```

## Edge Function 部署

### 本地开发

```bash
# 1. 安装 Supabase CLI
brew install supabase/tap/supabase

# 2. 登录
supabase login

# 3. 链接项目
supabase link --project-ref pzatgmavjvrastnumxty

# 4. 本地测试 Edge Function
supabase functions serve su-shi-reply --env-file ./supabase/.env

# 5. 部署到 Supabase
supabase functions deploy su-shi-reply --project-ref pzatgmavjvrastnumxty
```

### 通过 GitHub Actions 自动部署

只需推送 `edge-function.ts` 到 `main` 或 `testing` 分支，GitHub Actions 会自动部署。

## 数据库管理

### 创建迁移

```bash
# 1. 在本地初始化 Supabase 项目
supabase init

# 2. 创建新迁移
supabase migration new 描述

# 3. 编辑迁移文件（在 supabase/migrations/ 目录）

# 4. 推送到 Supabase
supabase db push --project-ref pzatgmavjvrastnumxty

# 或通过 GitHub Actions 自动推送（推荐）
git add supabase/migrations/
git commit -m "db: 添加新表"
git push origin main
```

## 项目结构

```
.
├── .github/
│   └── workflows/
│       ├── deploy-production.yml    # 生产环境部署
│       ├── deploy-staging.yml       # 测试环境部署
│       └── pr-preview.yml           # PR 预览
├── supabase/
│   ├── migrations/                  # 数据库迁移文件
│   └── config.toml                  # Supabase 配置
├── index.html                       # 前端页面
├── edge-function.ts                 # Edge Function 代码
└── README.md
```

## 故障排查

### GitHub Actions 部署失败

1. 检查 GitHub Secrets 是否正确配置
2. 查看 Actions 日志
3. 确认 Supabase 访问令牌未过期

### Edge Function 部署失败

1. 检查 `edge-function.ts` 语法
2. 确认 Supabase CLI 版本
3. 查看 Supabase Dashboard → Edge Functions → Logs

### 数据库迁移失败

1. 检查迁移文件语法
2. 确认数据库连接
3. 查看 Supabase Dashboard → Database → Logs

## 参考资料

- [Supabase CLI 文档](https://supabase.com/docs/guides/cli)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
