# 🚀 CI/CD 快速开始指南

## 第一步：启用 GitHub Pages (GitHub Actions 部署)

**必须做**：当前 GitHub Pages 是从分支直接部署，需要改为 GitHub Actions 部署。

1. 点击这个链接：https://github.com/jasonrabbittech/cais_chinese_p1_sarah/settings/pages
2. 在 `Build and deployment` → `Source` 选择 **`GitHub Actions`**
3. 点击 **Save**

## 第二步：配置 GitHub Secrets

为了自动部署 Edge Function，需要配置 GitHub Secrets。

### 2.1 获取 Supabase Access Token

1. 点击这个链接：https://supabase.com/dashboard/account/tokens
2. 点击 **`Generate new token`**
3. 名称输入：`GitHub Actions`
4. 点击 **`Generate token`**
5. **复制**生成的 token（只显示一次）

### 2.2 添加到 GitHub Secrets

1. 点击这个链接：https://github.com/jasonrabbittech/cais_chinese_p1_sarah/settings/secrets/actions
2. 点击 **`New repository secret`**
3. 添加以下 secrets：

| Name | Value |
|------|-------|
| `SUPABASE_ACCESS_TOKEN` | (步骤 2.1 复制的 token) |
| `SUPABASE_PROJECT_REF` | `pzatgmavjvrastnumxty` |

4. 点击 **`Add secret`**

### 2.3 获取 Supabase Anon Key

1. 点击这个链接：https://supabase.com/dashboard/project/pzatgmavjvrastnumxty/settings/api
2. 复制 `anon` `public` 下方的 key
3. 回到 GitHub Secrets
4. 添加 secret:
   - Name: `SUPABASE_ANON_KEY`
   - Value: (复制的 anon key)

## 第三步：测试 CI/CD

### 测试 1: 推送到 testing 分支

```bash
# 在本地执行
cd /tmp/cais_full
git checkout testing
echo "<!-- CI/CD Test -->" >> index.html
git add index.html
git commit -m "test: CI/CD 测试"
git push origin testing
```

然后查看：
- 进入 https://github.com/jasonrabbittech/cais_chinese_p1_sarah/actions
- 应该看到 `Deploy to Staging` workflow 正在运行

### 测试 2: 推送到 main 分支

```bash
# 在本地执行
cd /tmp/cais_full
git checkout main
git merge testing
git push origin main
```

然后查看：
- 进入 https://github.com/jasonrabbittech/cais_chinese_p1_sarah/actions
- 应该看到 `Deploy to Production` workflow 正在运行

## 第四步：日常使用

### 修改 HTML 并部署

```bash
# 1. 确保在 testing 分支
git checkout testing
git pull origin testing

# 2. 修改 index.html
# ... 用编辑器打开 index.html 修改 ...

# 3. 提交和推送
git add index.html
git commit -m "feat: 修改首页布局"
git push origin testing

# 4. 测试没问题后，合并到 main
git checkout main
git pull origin main
git merge testing
git push origin main
```

### 修改 Edge Function 并部署

```bash
# 1. 修改 edge-function.ts
# ... 用编辑器打开 edge-function.ts 修改 ...

# 2. 提交和推送（自动部署到 Supabase）
git add edge-function.ts
git commit -m "fix: 修复 Edge Function 回复逻辑"
git push origin main
```

## 常见问题

### Q: GitHub Actions 部署失败怎么办？

A: 查看 Actions 日志：
1. 进入 https://github.com/jasonrabbittech/cais_chinese_p1_sarah/actions
2. 点击失败的 workflow run
3. 查看日志定位错误

### Q: Edge Function 部署失败怎么办？

A: 可能原因：
1. Supabase Access Token 配置错误 → 检查 GitHub Secrets
2. Edge Function 代码有语法错误 → 本地测试
3. Supabase CLI 版本问题 → 使用 `latest` 版本

### Q: 如何回滚部署？

A: 
```bash
# 方式1: Revert commit
git revert HEAD
git push origin main

# 方式2: 重置到上一个 commit
git reset --hard HEAD~1
git push origin main --force
```

## 下一步

- 查看 `SUPABASE_SETUP.md` 了解详细的 Supabase 配置
- 查看 `BRANCHING_GUIDE.md` 了解 Git 工作流程
- 查看 `CICD_SETUP_GUIDE.md` 了解完整的设置步骤

---

**需要帮助？**
- GitHub Actions 日志：https://github.com/jasonrabbittech/cais_chinese_p1_sarah/actions
- Supabase Dashboard：https://supabase.com/dashboard/project/pzatgmavjvrastnumxty
- 本项目 GitHub 仓库：https://github.com/jasonrabbittech/cais_chinese_p1_sarah
