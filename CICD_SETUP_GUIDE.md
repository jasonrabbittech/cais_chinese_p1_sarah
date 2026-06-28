# CI/CD Pipeline 设置指南

## ✅ 已完成的工作

1. ✅ 创建 `testing` 分支
2. ✅ 添加 GitHub Actions workflows
3. ✅ 添加分支管理指南
4. ✅ 添加 Supabase 配置指南

## 📋 接下来你需要做的（按优先级）

### 1. 启用 GitHub Pages (GitHub Actions 部署)

**重要**: 当前 GitHub Pages 是从分支直接部署，需要改为 GitHub Actions 部署。

**步骤**:
1. 进入 [GitHub 仓库](https://github.com/jasonrabbittech/cais_chinese_p1_sarah)
2. 点击 `Settings` → `Pages`
3. 在 `Build and deployment` → `Source` 选择 **`GitHub Actions`**
4. 点击 Save

**结果**: 
- 推送到 `main` 分支 → 自动部署到生产环境
- 推送到 `testing` 分支 → 自动部署到测试环境（需要额外配置）

### 2. 配置 GitHub Secrets

为了自动部署 Edge Function 和数据库迁移，需要配置 GitHub Secrets。

**步骤**:
1. 进入 [GitHub 仓库](https://github.com/jasonrabbittech/cais_chinese_p1_sarah)
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret`

**需要添加的 Secrets**:

| Secret 名称 | 值 | 获取方式 |
|------------|-----|---------|
| `SUPABASE_ACCESS_TOKEN` | Supabase 访问令牌 | [Supabase Dashboard → Account → Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_REF` | `pzatgmavjvrastnumxty` | 已提供 |
| `SUPABASE_URL` | `https://pzatgmavjvrastnumxty.supabase.co` | 已提供 |
| `SUPABASE_ANON_KEY` | (从 Supabase Dashboard 获取) | [Supabase Dashboard → Project Settings → API](https://supabase.com/dashboard/project/pzatgmavjvrastnumxty/settings/api) |
| `SUPABASE_SERVICE_ROLE_KEY` | (从 Supabase Dashboard 获取) | 同上 |
| `DEEPSEEK_API_KEY` | `sk-your-key` | 你的 DeepSeek API Key |

**获取 Supabase Access Token**:
1. 访问 [Supabase Account Tokens](https://supabase.com/dashboard/account/tokens)
2. 点击 `Generate new token`
3. 名称: `GitHub Actions`
4. 复制生成的 token
5. 添加到 GitHub Secrets

### 3. 测试 CI/CD Pipeline

**测试测试环境部署**:
```bash
# 1. 修改一些内容
echo "<!-- test -->" >> index.html

# 2. 提交到 testing 分支
git add index.html
git commit -m "test: 测试 CI/CD"
git push origin testing

# 3. 查看 GitHub Actions
# 进入 GitHub 仓库 → Actions 标签
# 应该看到 "Deploy to Staging" workflow 正在运行
```

**测试生产环境部署**:
```bash
# 1. 合并 testing 到 main
git checkout main
git pull origin main
git merge testing
git push origin main

# 2. 查看 GitHub Actions
# 应该看到 "Deploy to Production" workflow 正在运行
```

### 4. (可选) 启用分支保护

为了保护 `main` 分支，避免直接推送：

1. 进入 [GitHub 仓库](https://github.com/jasonrabbittech/cais_chinese_p1_sarah)
2. 点击 `Settings` → `Branches`
3. 点击 `Add branch protection rule`
4. 分支名: `main`
5. 勾选:
   - ✅ `Require a pull request before merging`
   - ✅ `Require status checks to pass before merging`
6. 点击 `Create`

## 🚀 使用流程

### 日常开发流程

```bash
# 1. 从 testing 创建功能分支
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

# 4. 创建 PR 到 testing
# 在 GitHub 上创建 Pull Request
```

### 测试流程

```bash
# 方式1: 直接推送到 testing (简单)
git checkout testing
git pull origin testing
# ... 修改代码 ...
git add .
git commit -m "test: 测试新功能"
git push origin testing

# → GitHub Actions 自动部署
# → 在浏览器测试

# 方式2: 合并功能分支到 testing
git checkout testing
git merge feature/新功能名称
git push origin testing
```

### 发布流程

```bash
# 方式1: 合并 testing 到 main (推荐)
git checkout main
git pull origin main
git merge testing
git push origin main

# → GitHub Actions 自动部署到生产环境

# 方式2: 通过 PR (更正式)
# 在 GitHub 上创建 PR: main ← testing
# 添加描述
# 合并 PR

# → GitHub Actions 自动部署到生产环境
```

## 📊 查看部署状态

### GitHub Actions

1. 进入 [GitHub 仓库](https://github.com/jasonrabbittech/cais_chinese_p1_sarah)
2. 点击 `Actions` 标签
3. 查看所有 workflow runs
4. 点击某个 run 查看详细日志

### GitHub Pages

1. 进入 [GitHub 仓库](https://github.com/jasonrabbittech/cais_chinese_p1_sarah)
2. 点击 `Settings` → `Pages`
3. 查看部署状态和历史

## 🔧 故障排查

### GitHub Actions 部署失败

**可能原因**:
1. GitHub Secrets 未配置或配置错误
2. Supabase 访问令牌过期
3. Edge Function 代码有语法错误
4. 数据库连接失败

**解决方法**:
1. 检查 GitHub Secrets 配置
2. 重新生成 Supabase 访问令牌
3. 查看 Actions 日志定位错误
4. 在本地测试 Edge Function

### 部署成功但页面不更新

**可能原因**:
1. 浏览器缓存
2. GitHub Pages 缓存
3. 部署到了错误的分支

**解决方法**:
1. 清除浏览器缓存 (Cmd+Shift+R)
2. 等待 1-2 分钟让 GitHub Pages 更新
3. 检查 GitHub Pages 设置中的源分支

## 📚 参考资料

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [Supabase CLI 文档](https://supabase.com/docs/guides/cli)
- [Supabase GitHub Actions](https://supabase.com/docs/guides/deployment/github-actions)

## 🎯 下一步

1. ✅ 完成上述配置步骤
2. ✅ 测试整个 CI/CD pipeline
3. ⏳ 添加自动化测试（可选）
4. ⏳ 添加代码质量检查（可选）
5. ⏳ 设置监控和告警（可选）

---

**需要帮助？**
- 查看 `SUPABASE_SETUP.md` 了解 Supabase 配置
- 查看 `BRANCHING_GUIDE.md` 了解 Git 工作流程
- 查看 GitHub Actions 日志定位问题
