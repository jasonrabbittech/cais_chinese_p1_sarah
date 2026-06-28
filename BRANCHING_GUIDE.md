# Git 分支管理指南

## 分支策略

```
main (生产环境)
  ↑
  | 合并 (经过测试)
  |
testing (测试环境)
  ↑
  | 合并
  |
feature/功能名称 (开发分支)
```

## 分支说明

| 分支 | 用途 | 部署环境 | URL |
|------|------|---------|-----|
| `main` | 生产环境 | GitHub Pages (Production) | https://jasonrabbittech.github.io/cais_chinese_p1_sarah/ |
| `testing` | 测试环境 | GitHub Pages (Staging) | https://jasonrabbittech.github.io/cais_chinese_p1_sarah/ (同一 URL，从 testing 分支部署) |
| `feature/*` | 新功能开发 | 本地测试 | 本地浏览器 |

## 工作流程

### 1. 开发新功能

```bash
# 从 testing 分支创建新功能分支
git checkout testing
git pull origin testing
git checkout -b feature/ai-reply-improvement

# 开发和提交
# ... 修改代码 ...
git add .
git commit -m "feat: 改进 AI 回复功能"

# 推送到远程
git push origin feature/ai-reply-improvement

# 在 GitHub 上创建 Pull Request
# 目标: testing ← 源: feature/ai-reply-improvement
```

### 2. 测试功能

```bash
# 方式1: 合并到 testing 分支（自动部署）
git checkout testing
git merge feature/ai-reply-improvement
git push origin testing

# → GitHub Actions 自动部署到测试环境
# → 在浏览器中测试

# 方式2: 直接在本地测试（推荐）
# 直接在浏览器打开 index.html
# 修改代码后刷新浏览器测试
```

### 3. 发布到生产环境

```bash
# 方式1: 合并 testing 到 main
git checkout main
git pull origin main
git merge testing
git push origin main

# → GitHub Actions 自动部署到生产环境

# 方式2: 通过 PR（更正式）
# 在 GitHub 上创建 PR: main ← testing
# 添加描述、截图
# 审查通过后合并
```

## 常用命令

### 创建和切换分支

```bash
# 创建新分支
git checkout -b feature/新功能

# 切换分支
git checkout testing
git checkout main

# 查看所有分支
git branch -a
```

### 提交代码

```bash
# 查看修改
git status
git diff

# 添加文件
git add index.html
git add .  # 添加所有修改

# 提交
git commit -m "feat: 添加新功能"

# 推送到远程
git push origin 分支名称
```

### 合并分支

```bash
# 合并 feature 到 testing
git checkout testing
git merge feature/新功能
git push origin testing

# 合并 testing 到 main
git checkout main
git merge testing
git push origin main
```

### 处理冲突

```bash
# 如果合并时出现冲突
# 1. 打开冲突文件
# 2. 手动解决冲突（删除 <<<<<<< ======= >>>>>>> 标记）
# 3. 提交
git add .
git commit -m "resolve merge conflict"
git push origin 分支名称
```

## Commit 消息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加 AI 回复编辑功能` |
| `fix` | 修复 bug | `fix: 修复删除留言不刷新问题` |
| `docs` | 文档更新 | `docs: 更新 README` |
| `style` | 代码格式（不影响功能） | `style: 格式化代码` |
| `refactor` | 重构 | `refactor: 优化 AI 回复逻辑` |
| `test` | 测试相关 | `test: 添加单元测试` |
| `chore` | 构建/工具相关 | `chore: 更新依赖` |
| `db` | 数据库相关 | `db: 添加回复模板表` |

## 发布流程检查清单

### 发布前

- [ ] 在 testing 分支测试通过
- [ ] 代码已审查（如果是团队开发）
- [ ] 没有未提交的修改
- [ ] 数据库迁移已测试

### 发布后

- [ ] 检查生产环境是否正常工作
- [ ] 检查 AI 回复是否正常
- [ ] 检查数据库写入是否正常
- [ ] 通知相关人员

## 回滚

如果生产环境出现问题：

```bash
# 方式1: 回滚到上一个 commit
git checkout main
git revert HEAD
git push origin main

# 方式2: 重置到指定 commit
git checkout main
git log --oneline  # 找到要回滚到的 commit
git reset --hard commit-hash
git push origin main --force
```

## 小贴士

1. **频繁提交**: 小步快跑，避免一次性提交大量修改
2. **写清楚的 commit 消息**: 方便以后查找和回滚
3. **先在 testing 测试**: 确保所有功能正常再合并到 main
4. **保护 main 分支**: 在 GitHub 设置中启用分支保护规则
5. **使用 PR**: 即使是单人开发，使用 PR 可以帮助整理思路

## GitHub 分支保护设置（推荐）

1. 进入 `Settings` → `Branches`
2. 点击 `Add branch protection rule`
3. 分支名: `main`
4. 勾选:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
5. 保存

这样可以强制所有修改都通过 PR 合并到 main，避免直接推送导致问题。
