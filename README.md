# 苏轼朋友圈 - AI古代诗人教学小程序

**项目ID**: cais_chinese_p1_sarah  
**版本**: 1.0.0  
**最后更新**: 2026-07-01  

---

## 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [开发指南](#开发指南)
- [部署指南](#部署指南)
- [数据库架构](#数据库架构)
- [AI回复逻辑](#ai回复逻辑)
- [教师管理](#教师管理)
- [测试](#测试)
- [常见问题](#常见问题)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

---

## 项目简介

"苏轼朋友圈"是一个创新的古诗词教学工具，结合AI技术让学生与古代诗人"苏轼"互动。

### 教学目标

- 让学生理解《水调歌头·明月几时有》的创作背景和情感
- 通过AI互动增强学习兴趣和参与感
- 培养学生对古诗词的欣赏能力

### 核心功能

- **学生端**：登录、查看苏轼"朋友圈"、提交评论、接收AI回复
- **教师端**：删除不当评论、导出评论数据、查看统计数据、管理AI回复模板

---

## 功能特性

### 学生功能

- ✅ **登录系统**：输入姓名即可登录（保存在 `localStorage`）
- ✅ **查看帖子**：苏轼的"朋友圈"帖子，包含《水调歌头》全文和创作背景
- ✅ **点赞功能**：为帖子点赞（当前使用 `localStorage`，暂未持久化到数据库）
- ✅ **评论功能**：提交评论（500字符限制），支持不当内容过滤
- ✅ **AI回复**：接收苏轼风格的AI回复（由DeepSeek API生成）
- ✅ **实时更新**：新评论和AI回复实时显示在页面上（Supabase Realtime）
- ✅ **响应式设计**：支持桌面和移动设备

### 教师功能

- ✅ **管理面板**：密码保护的管理界面（`cais2024`）
- ✅ **删除评论**：删除不当或违规评论
- ✅ **导出数据**：导出所有评论为CSV文件（Excel兼容）
- ✅ **统计数据**：查看评论总数、活跃学生数、人均评论数
- ✅ **模板管理**：创建、编辑、删除AI回复模板（通用模板和智能模板）

---

## 技术栈

### 前端

- **HTML5 + CSS3 + Vanilla JavaScript**（无框架，静态站点）
- **Supabase JS Client**（CDN引入，用于数据库操作和Realtime订阅）
- **响应式设计**（CSS媒体查询）

### 后端

- **Supabase**（PostgreSQL数据库、Row Level Security、Realtime）
- **Supabase Edge Functions**（Deno runtime，TypeScript）
- **DeepSeek API**（AI回复生成）

### 部署

- **GitHub Pages**（前端静态站点托管）
- **Supabase**（后端服务托管）
- **GitHub Actions**（CI/CD自动部署）

---

## 项目结构

```
Sarah-AI-Sushi/
├── index.html              # 主前端文件（学生视图 + 管理面板）
├── edge-function.ts        # Supabase Edge Function（AI回复生成）
├── TEACHER_GUIDE.md      # 教师使用指南
├── SUPABASE_SETUP.md      # Supabase设置指南
├── README.md              # 本文件
├── .gitignore             # Git忽略文件
├── supabase/
│   ├── migrations/        # 数据库迁移文件（版本控制）
│   └── sync_v2.sql       # 数据库同步脚本（用于手动同步）
├── .github/
│   └── workflows/         # GitHub Actions CI/CD配置
│       ├── deploy-pages.yml
│       └── deploy-supabase.yml
├── specs/
│   └── 001-ai-poet-friends/
│       ├── spec.md        # 功能规范
│       ├── plan.md        # 实施计划
│       ├── tasks.md       # 任务分解
│       ├── data-model.md  # 数据模型
│       └── quickstart.md  # 快速开始指南
└── .specify/
    ├── memory/
    │   └── constitution.md  # 项目宪法（开发原则）
    └── templates/           # Spec-Driven开发模板
```

---

## 快速开始

### 前置条件

1. **Supabase账户**：注册并创建项目（[Supabase官网](https://supabase.com)）
2. **DeepSeek API密钥**：注册并获取API密钥（[DeepSeek官网](https://www.deepseek.com)）
3. **Git**：用于克隆和提交代码
4. **GitHub账户**：用于部署前端（GitHub Pages）

### 步骤1：克隆项目

```bash
git clone https://github.com/[your-username]/Sarah-AI-sushi.git
cd Sarah-AI-Sushi
```

### 步骤2：设置Supabase

#### 2.1 创建数据库表

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 复制 `supabase/sync_v2.sql` 的内容
5. 粘贴到SQL Editor并点击 **Run**

#### 2.2 配置环境变量

在 Supabase Dashboard中：
1. 进入 **Settings** → **API**
2. 复制 **Project URL** 和 **anon public key**
3. 打开 `index.html`，搜索 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`
4. 替换为你的实际值

#### 2.3 设置Secrets

在 Supabase Dashboard中：
1. 进入 **Settings** → **Edge Functions**
2. 点击 **Add a new secret**
3. 添加以下secrets：
   - `DEEPSEEK_API_KEY`：你的DeepSeek API密钥
   - `SERVICE_ROLE_KEY`：你的Supabase service_role key（在 **Settings** → **API** 中获取）

#### 2.4 部署Edge Function

**方法1：通过Supabase Dashboard（推荐）**
1. 进入 **Edge Functions**
2. 点击 **Create a new function**
3. 函数名：`su-shi-reply`
4. 粘贴 `edge-function.ts` 的内容
5. 点击 **Deploy**

**方法2：通过Supabase CLI**
```bash
supabase functions deploy su-shi-reply --project-ref [your-project-ref]
```

### 步骤3：本地测试

打开 `index.html` 在浏览器中：
- 直接双击 `index.html`（简单方式）
- 或使用本地服务器：
  ```bash
  python3 -m http.server 8000
  # 然后在浏览器中打开 http://localhost:8000
  ```

### 步骤4：部署到生产环境

#### 4.1 前端（GitHub Pages）

1. 推送代码到 `testing` 分支：
   ```bash
   git add .
   git commit -m "feat: initial implementation"
   git push origin testing
   ```
2. GitHub Actions会自动部署到GitHub Pages（staging环境）
3. 测试staging环境
4. 创建PR从 `testing` 到 `main`
5. 合并PR后，GitHub Actions会自动部署到生产环境

#### 4.2 后端（Supabase）

- Edge Function会在推送代码到 `testing` 或 `main` 分支时自动部署（通过GitHub Actions）
- 数据库迁移需要手动应用（通过Supabase Dashboard或CLI）

---

## 开发指南

### 开发工作流

本项目遵循 **Spec-Driven Development**（规范驱动开发）方法：

1. **规范阶段**（`/speckit.spec` 命令）：编写功能规范
2. **计划阶段**（`/speckit.plan` 命令）：创建实施计划
3. **任务分解阶段**（`/speckit.tasks` 命令）：分解任务
4. **实施阶段**：按照 `tasks.md` 实施
5. **验证阶段**：测试并验证
6. **部署阶段**：推送到 `testing` → 验证 → 合并到 `main`

### 分支策略

- `main`：生产环境（受保护，只能通过PR合并）
- `testing`：staging环境（自动部署到GitHub Pages）
- `feat/[feature-name]`：功能分支
- `fix/[issue-description]`：bug修复分支

### 代码质量规则

#### 前端（index.html）

- 使用 `esc()` 函数转义用户输入（防止XSS）
- 所有异步操作使用 `try-catch` 处理错误
- 用户友好的错误消息（使用 `alert()` 或未来使用toast通知）
- 不当内容过滤（前端拦截 + Edge Function验证）

#### 后端（edge-function.ts）

- 使用TypeScript严格模式
- 所有函数有JSDoc注释
- 输入验证（检查 `record` 和 `record.id`）
- 错误处理（适当的HTTP状态码和错误消息）
- CORS配置（允许所有来源，生产环境应限制）

#### 数据库

- 所有表启用RLS（Row Level Security）
- 使用参数化查询（通过Supabase JS Client）
- 敏感数据不存储在数据库中（如学生姓名已存储，但未来应添加认证）

### 本地开发

#### 前端

1. 修改 `index.html`
2. 在浏览器中刷新页面（硬刷新：Cmd+Shift+R）
3. 检查浏览器控制台（F12）是否有错误

#### 后端（Edge Function）

1. 安装Supabase CLI：`npm install -g supabase`
2. 登录：`supabase login`
3. 启动本地Edge Function服务：
   ```bash
   supabase start
   supabase functions serve su-shi-reply --env-file ./supabase/.env
   ```
4. 在另一个终端测试：
   ```bash
   curl -X POST http://localhost:54321/functions/v1/su-shi-reply \
     -H "Content-Type: application/json" \
     -d '{"record": {"id": "test-id", "student_name": "测试学生", "content": "苏轼先生好！"}}'
   ```

#### 数据库

- 使用Supabase Dashboard的 **Table Editor** 或 **SQL Editor**
- 修改后更新 `supabase/migrations/` 中的迁移文件
- 测试更改在staging环境中

---

## 部署指南

### GitHub Actions CI/CD

本项目使用GitHub Actions自动部署：

#### 前端部署（GitHub Pages）

**文件**：`.github/workflows/deploy-pages.yml`

**触发条件**：
- 推送到 `testing` 分支 → 部署到staging
- 推送到 `main` 分支 → 部署到生产环境

**步骤**：
1. 检出代码
2. 替换 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 为实际值（通过GitHub Secrets）
3. 部署到GitHub Pages

#### 后端部署（Supabase Edge Functions）

**文件**：`.github/workflows/deploy-supabase.yml`

**触发条件**：
- 推送到 `testing` 或 `main` 分支
- `edge-function.ts` 有更改

**步骤**：
1. 检出代码
2. 安装Supabase CLI
3. 部署Edge Function：`supabase functions deploy su-shi-reply`

### 手动部署

#### 前端

1. 构建（如果需要）：`npm run build`（当前版本不需要）
2. 部署到GitHub Pages：
   - 进入GitHub仓库设置
   - 点击 **Pages**
   - 选择 `testing` 或 `main` 分支
   - 点击 **Save**

#### 后端

1. 登录Supabase Dashboard
2. 进入 **Edge Functions**
3. 选择 `su-shi-reply` 函数
4. 粘贴 `edge-function.ts` 的内容
5. 点击 **Deploy**

---

## 数据库架构

### 表结构

#### 1. `comments` 表（评论）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 唯一标识符 |
| `student_name` | TEXT | NOT NULL | 学生姓名（Phase 1无认证） |
| `content` | TEXT | NOT NULL | 评论内容（最多500字符） |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 评论时间戳 |
| `ai_reply` | TEXT | NULLABLE | AI生成的回复（直接存储） |
| `replied_at` | TIMESTAMPTZ | NULLABLE | AI回复时间戳 |
| `is_replying` | BOOLEAN | DEFAULT FALSE | 防止重复AI调用 |

**索引**：
- `idx_comments_created_at` (DESC)：用于按时间倒序查询

**RLS策略**：
- 允许所有用户读取（SELECT）
- 允许所有用户插入（INSERT）
- 允许所有用户删除（DELETE）
- 允许所有用户更新（UPDATE）

**注意**：当前RLS策略非常宽松，适合Phase 1（无学生认证）。未来版本应添加更严格的策略。

#### 2. `reply_templates` 表（回复模板）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 唯一标识符 |
| `type` | TEXT | NOT NULL, CHECK IN ('generic', 'smart') | 模板类型 |
| `keyword` | TEXT | NULLABLE | 逗号分隔的关键词（仅smart类型） |
| `reply` | TEXT | NOT NULL | 模板回复内容 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 创建时间戳 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | 最后更新时间戳 |

**索引**：
- `reply_templates_pkey` (unique, on `id`)

**RLS策略**：
- 允许所有用户读取（SELECT）
- 仅允许 `service_role` 角色执行所有操作（INSERT, UPDATE, DELETE）

---

## AI回复逻辑

### 回复生成流程

1. **学生提交评论** → 插入到 `comments` 表（`is_replying = TRUE`）
2. **前端调用Edge Function**（`triggerAI()` 函数）
3. **Edge Function处理**：
   - **步骤1**：检查不当内容（服务器端验证）
   - **步骤2**：从数据库加载回复模板（缓存5分钟）
   - **步骤3**：尝试调用DeepSeek API
     - 如果成功：使用API生成的回复
     - 如果失败：使用数据库模板回复（通用或智能匹配）
   - **步骤4**：将回复写入 `comments` 表（`ai_reply`, `replied_at`, `is_replying = FALSE`）
4. **前端检测回复**（`subscribeRT()` 通过Supabase Realtime）
5. **显示回复**（自动更新UI）

### 智能模板匹配

**智能模板**包含关键词。当学生评论包含任何关键词时，使用匹配的模板回复。

**示例**：
- 关键词：`月亮, 月圆, 月光`
- 回复：`哈哈，诸位也赏月？老夫今日独酌，忽见明月，便想起子由。诸位赏月时，可有人共赏？`

**通用模板**随机使用，不依赖关键词。

### fallback策略

1. **DeepSeek API成功** → 使用API回复
2. **DeepSeek API失败** → 使用数据库智能模板（如果匹配）
3. **无智能模板匹配** → 使用数据库通用模板（随机选择）
4. **数据库查询失败** → 使用内置fallback模板

---

## 教师管理

详细说明请参见 [TEACHER_GUIDE.md](./TEACHER_GUIDE.md)。

### 快速开始

1. 点击页面右下角的 **"教师入口"** 按钮
2. 输入密码：`cais2024`
3. 进入管理面板

### 功能列表

- 查看所有学生评论
- 删除不当评论
- 导出评论数据为CSV文件
- 查看统计数据（评论总数、活跃学生数、人均评论数）
- 管理AI回复模板（创建、编辑、删除）

---

## 测试

### 手动测试

按照 `specs/001-ai-poet-friends/quickstart.md` 中的场景测试：

#### 场景1：学生首次体验

1. 打开 `index.html`
2. 输入姓名登录
3. 查看苏轼帖子
4. 提交评论
5. 验证AI回复在5秒内生成

#### 场景2：教师管理

1. 点击"教师入口"
2. 登录（密码：`cais2024`）
3. 删除一条评论
4. 导出CSV
5. 查看统计数据

#### 场景3：AI回复质量

1. 提交包含关键词"月亮"的评论
2. 验证AI回复提到月亮，使用古文风格
3. 提交不当内容
4. 验证被过滤或回复提示文明用语

### 自动化测试（未来版本）

当前版本使用手动测试。未来版本将添加：
- 单元测试（Jest）
- 集成测试（Cypress）
- 端到端测试（Playwright）

---

## 常见问题

### Q1: AI回复不生成怎么办？

**可能原因**：
1. DeepSeek API密钥未配置
2. Edge Function未部署
3. DeepSeek API超时（>30秒）
4. 网络问题

**解决方法**：
1. 检查Supabase Dashboard → Edge Functions → `su-shi-reply` → Logs
2. 验证 `DEEPSEEK_API_KEY` 是否设置在Supabase Secrets中
3. 检查浏览器控制台是否有错误

---

### Q2: 评论不持久化怎么办？

**可能原因**：
1. Supabase anon key不正确
2. RLS策略阻止INSERT
3. 数据库连接失败

**解决方法**：
1. 检查浏览器控制台错误
2. 验证 `index.html` 中的 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`
3. 检查Supabase Dashboard → Database → Logs

---

### Q3: 如何更改教师登录密码？

**当前版本**：密码硬编码在 `index.html` 中（搜索 `cais2024`）

**更改步骤**：
1. 打开 `index.html`
2. 搜索 `cais2024`
3. 替换为新密码
4. 提交代码到 `testing` 分支

**未来版本**：密码将存储在Supabase Secrets中。

---

### Q4: 如何备份评论数据？

**方法1：导出CSV**
- 在管理面板中点击"下载评论"

**方法2：Supabase备份**
- 登录Supabase Dashboard
- 进入 **Database** → **Backups**
- 创建手动备份或启用自动备份

---

### Q5: 学生可以多次点赞吗？

**当前版本**：点赞使用 `localStorage`，每个学生设备只能点赞一次。

**未来版本**：将创建 `likes` 表，支持跨设备点赞状态同步。

---

## 贡献指南

### 如何贡献

1. Fork本项目
2. 创建功能分支：`git checkout -b feat/your-feature`
3. 提交更改：`git commit -m "feat: your feature description"`
4. 推送分支：`git push origin feat/your-feature`
5. 创建Pull Request到 `testing` 分支

### 代码审查要求

- ✅ 遵循项目宪法（`.specify/memory/constitution.md`）
- ✅ 通过所有测试（当前为手动测试）
- ✅ 更新相关文档
- ✅ 提交信息清晰（使用 `feat:`, `fix:`, `docs:`, `chore:` 等前缀）

### 报告Bug

请在GitHub Issues中报告bug，包含：
- 复现步骤
- 预期行为
- 实际行为
- 截图（如果有）
- 浏览器和环境信息

---

## 路线图

### Phase 1（当前版本）

- ✅ 学生登录和评论
- ✅ AI回复生成（DeepSeek API）
- ✅ 教师管理面板
- ✅ 评论导出（CSV）
- ✅ 基础不当内容过滤

### Phase 2（计划中）

- ⏳ 学生认证（Supabase Auth）
- ⏳ 点赞持久化（创建 `likes` 表）
- ⏳ 多个诗人/帖子支持
- ⏳ 教师密码管理（通过Supabase Secrets）
- ⏳ 更高级的AI回复质量优化
- ⏳ 自动化测试（单元测试、集成测试）

### Phase 3（未来）

- ⏳ 多班级支持
- ⏳ 学生表现分析
- ⏳ 移动应用（React Native或Flutter）
- ⏳ 多语言支持（繁体中文、简体中文、英文）

---

## 许可证

[MIT License](./LICENSE)（待添加）

---

## 联系方式

- **项目负责人**：[Your Name]
- **邮箱**：[your.email@example.com]
- **GitHub**：[https://github.com/your-username/Sarah-AI-sushi](https://github.com/your-username/Sarah-AI-sushi)
- **Issues**：[https://github.com/your-username/Sarah-AI-sushi/issues](https://github.com/your-username/Sarah-AI-sushi/issues)

---

**结束 of README.md**
