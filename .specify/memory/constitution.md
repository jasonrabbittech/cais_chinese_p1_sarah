<!--
SYNC IMPACT REPORT
Version change: 1.0.0 → 1.1.0 (MINOR: added Spec-Driven Development principle and workflow)
Modified principles: Added Principle VIII (Spec-Driven Development)
Added sections: Spec-Driven Workflow in Development Workflow section
Removed sections: None
Templates requiring updates:
  - ✅ .specify/templates/ (already created)
TODOs: Ratification date is unknown, marked as TODO.
-->

# Sarah-AI-Sushi Constitution / Sarah-AI-Sushi 项目宪法

## Core Principles / 核心原则

### I. Supabase-First (NON-NEGOTIABLE) / I. Supabase 优先（不可协商）

**EN**: All backend services MUST use Supabase (Database, Auth, Storage, Realtime). No external backend services are permitted unless explicitly approved. Database schema MUST be managed via Supabase migrations (`supabase/migrations/`). All database queries MUST use Supabase JS Client or RPC functions. Row Level Security (RLS) MUST be enabled on all tables containing user data.

**中文**: 所有后端服务必须使用该平台的 Supabase（数据库、认证、存储、实时功能）。不允许使用外部后端服务，除非明确批准。数据库架构必须通过 Supabase 迁移管理（`supabase/migrations/`）。所有数据库查询必须使用 Supabase JS Client 或 RPC 函数。包含所有用户数据的表必须启用行级安全 (RLS)。

---

### II. Edge Functions for AI Integration / II. 使用 Edge Functions 进行 AI 集成

**EN**: All AI API calls (DeepSeek, etc.) MUST be routed through Supabase Edge Functions. No API keys or secrets MUST be exposed in frontend code. Edge Functions MUST be written in TypeScript (Deno runtime). All Edge Functions MUST validate input parameters before processing. Error handling MUST be implemented with proper error messages and status codes.

**中文**: 所有 AI API 调用（DeepSeek 等）必须通过 Supabase Edge Functions 进行。前端代码中不得暴露任何 API 密钥或秘密。Edge Functions 必须用 TypeScript（Deno 运行时）编写。所有 Edge Functions 在处理前必须验证输入参数。必须实现错误处理，包含适当的错误消息和状态码。

---

### III. Static Site Deployment / III. 静态站点部署

**EN**: The frontend MUST be a static site (HTML/CSS/JS). No server-side rendering is allowed. The site MUST be deployable to GitHub Pages. All API calls MUST go through Supabase client or Edge Function endpoints. Environment variables for frontend MUST be injected at build time via `inject-env.js` or similar mechanism. No `.env` files MUST be committed to the repository.

**中文**: 前端必须是静态站点（HTML/CSS/JS）。不允许服务器端渲染。站点必须可部署到 GitHub Pages。所有 API 调用必须通过 Supabase 客户端或 Edge Function 端点。前端的环境变量必须在构建时通过 `inject-env.js` 或类似机制注入。不得提交 `.env` 文件到仓库。

---

### IV. Security by Default / IV. 默认安全

**EN**: All API endpoints (Edge Functions) MUST validate authentication tokens. No anonymous access to protected resources is permitted. Input validation MUST be applied to all user inputs. API keys (DeepSeek, Supabase Service Role Key) MUST be stored in GitHub Secrets or Supabase Secrets, never in code. CORS MUST be explicitly configured for allowed origins only. All user inputs MUST be sanitized before sending to AI APIs to prevent prompt injection.

**中文**: 所有 API 端点（Edge Functions）必须验证身份验证令牌。不允许匿名访问受保护的资源。必须对所有用户输入进行输入验证。API 密钥（DeepSeek、Supabase Service Role Key）必须存储在 GitHub Secrets 或 Supabase Secrets 中，绝不能在代码中。CORS 必须仅为允许的源显式配置。所有用户输入在发送到 AI API 之前必须进行清理，以防止提示注入攻击。

---

### V. GitHub Flow (Testing → Main) / V. GitHub Flow（Testing → Main）

**EN**: All development MUST happen on `testing` branch. No direct commits to `main` branch are allowed. All changes MUST be submitted via Pull Request (PR) from `testing` to `main`. PRs MUST be reviewed and approved before merging. `main` branch MUST always contain production-ready code. GitHub Actions MUST automatically deploy `testing` branch to staging and `main` branch to production.

**中文**: 所有开发必须在 `testing` 分支上进行。不允许直接提交到 `main` 分支。所有更改必须通过从 `testing` 到 `main` 的拉取请求 (PR) 提交。PR 必须在合并前进行审查和批准。`main` 分支必须始终包含生产就绪的代码。GitHub Actions 必须自动将 `testing` 分支部署到暂存环境，将 `main` 分支部署到生产环境。

---

### VI. AI Content Safety / VI. AI 内容安全

**EN**: All AI-generated content MUST be filtered for inappropriate content before display. User inputs MUST be validated to prevent prompt injection attacks. AI API calls MUST have timeout limits (max 30 seconds). Rate limiting MUST be applied to AI API calls to prevent abuse. AI interaction logs MUST be stored for debugging and audit purposes (excluding sensitive user data).

**中文**: 所有 AI 生成的内容在显示前必须进行不当内容过滤。必须验证用户输入以防止提示注入攻击。AI API 调用必须设置超时限制（最多 30 秒）。必须对 AI API 调用应用速率限制以防止滥用。必须存储 AI 交互日志以进行调试和审计（不包括敏感用户数据）。

---

### VII. Code Quality and Documentation / VII. 代码质量和文档

**EN**: All code MUST follow consistent formatting (use Prettier for Edge Functions). All functions MUST have JSDoc comments. All Edge Function changes MUST include error handling. All database schema changes MUST be documented in migration files with clear descriptions. README.md MUST be kept up-to-date with setup instructions. All configuration changes MUST be documented in `SUPABASE_SETUP.md` or `CICD_SETUP_GUIDE.md`. All new features MUST have a corresponding specification (`specs/[feature-name]/spec.md`). All implementations MUST pass constitution compliance check before merge. Feature branch naming MUST follow: `feat/[feature-name]` or `fix/[issue-description]`.

**中文**: 所有代码必须遵循一致的格式（Edge Functions 使用 Prettier）。所有函数必须有 JSDoc 注释。所有 Edge Function 更改必须包含错误处理。所有数据库架构更改必须在迁移文件中记录并包含清晰的描述。README.md 必须保持最新的设置说明。所有配置更改必须记录在 `SUPABASE_SETUP.md` 或 `CICD_SETUP_GUIDE.md` 中。所有新功能必须有相应的规范（`specs/[feature-name]/spec.md`）。所有实现在合并前必须通过宪法合规性检查。功能分支命名必须遵循：`feat/[feature-name]` 或 `fix/[issue-description]`。

---

### VIII. Spec-Driven Development (MANDATORY) / VIII. 规范驱动开发（强制）

**EN**: All new features MUST follow the spec-driven development approach:
1. **Specification Phase**: Write feature specification (`spec.md`) BEFORE implementation. Specification MUST include: User scenarios, Functional requirements, Success criteria, Assumptions.
2. **Planning Phase**: Create implementation plan (`plan.md`) based on specification. Plan MUST include: Technical context, Project structure, Task breakdown, Complexity tracking.
3. **Implementation Phase**: Develop based on plan, update task status in `tasks.md`. Implementation MUST satisfy all spec requirements.
4. **Verification Phase**: Test against spec requirements, ensure all success criteria are met. Update documentation if needed.
5. **Deployment Phase**: Merge to `testing`, verify in staging environment, then merge to `main` after approval.
6. All specs MUST be stored in `specs/[feature-name]/` directory. Constitution compliance MUST be verified before every PR merge.

**中文**: 所有新功能必须遵循规范驱动开发方法：
1. **规范阶段**：在实现**之前**编写功能规范（`spec.md`）。规范必须包含：用户场景、功能需求、成功标准、假设。
2. **计划阶段**：基于规范创建实施计划（`plan.md`）。计划必须包含：技术上下文、项目结构、任务分解、复杂性跟踪。
3. **实施阶段**：基于计划开发，在 `tasks.md` 中更新任务状态。实现必须满足所有规范要求。
4. **验证阶段**：根据规范要求测试，确保所有成功标准都已满足。如需要则更新文档。
5. **部署阶段**：合并到 `testing`，在暂存环境中验证，审批后合并到 `main`。
6. 所有规范必须存储在 `specs/[feature-name]/` 目录。每次 PR 合并前必须验证宪法合规性。

---

## Technical Standards / 技术标准

### Technology Stack / 技术栈

| Item / 项目 | Description / 描述 |
|-------------|-------------------|
| **Frontend** | HTML5 + CSS3 + Vanilla JavaScript, deployed to GitHub Pages |
| **前端** | HTML5 + CSS3 + 原生 JavaScript，部署到 GitHub Pages |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| **后端** | Supabase (PostgreSQL、认证、实时功能、存储) |
| **Serverless Functions** | Supabase Edge Functions (Deno runtime, TypeScript) |
| **无服务器函数** | Supabase Edge Functions (Deno 运行时，TypeScript) |
| **AI Services** | DeepSeek API (accessed via Edge Functions) |
| **AI 服务** | DeepSeek API（通过 Edge Functions 访问） |
| **CI/CD** | GitHub Actions (auto-deploy to GitHub Pages + Supabase) |
| **CI/CD** | GitHub Actions（自动部署到 GitHub Pages + Supabase） |
| **Database Migrations** | Supabase CLI (`supabase db push`) |
| **数据库迁移** | Supabase CLI (`supabase db push`) |
| **Environment Variables** | GitHub Secrets (for CI/CD), Supabase Secrets (for Edge Functions) |
| **环境变量** | GitHub Secrets（用于 CI/CD），Supabase Secrets（用于 Edge Functions） |

---

### Code Quality Rules / 代码质量规则

**EN**:
- All Edge Functions MUST export a default handler function with proper type annotations.
- All database queries MUST use parameterized queries via Supabase JS Client.
- Frontend MUST use ES Modules (`type: "module"`) for JavaScript code.
- All user input MUST be sanitized before rendering (no XSS).
- All AI API responses MUST be validated before display.
- All environment variables MUST be validated on application startup.
- No hardcoded secrets or API keys in code.
- All async functions MUST have proper error handling with try-catch blocks.

**中文**:
- 所有 Edge Functions 必须导出带有适当类型注释的默认处理函数。
- 所有数据库查询必须使用通过 Supabase JS Client 的参数化查询。
- 前端必须对 JavaScript 代码使用 ES 模块（`type: "module"`）。
- 所有用户输入必须在渲染前进行清理（防止 XSS）。
- 所有 AI API 响应在显示前必须经过验证。
- 所有环境变量必须在应用程序启动时进行验证。
- 代码中不得有硬编码的密钥或 API 密钥。
- 所有异步函数必须有适当的错误处理，包含 try-catch 块。

---

### Performance Constraints / 性能约束

**EN**:
- Edge Function response time MUST be under 5 seconds (including AI API call).
- AI API call timeout MUST be set to 30 seconds maximum.
- Frontend page load time MUST be under 3 seconds on 3G network.
- GitHub Pages deployment MUST complete within 5 minutes.
- Supabase Edge Function deployment MUST complete within 3 minutes.
- Database query response time MUST be under 500ms (p95).

**中文**:
- Edge Function 响应时间必须在 5 秒内（包括 AI API 调用）。
- AI API 调用超时必须设置为最多 30 秒。
- 前端页面加载时间在 3G 网络下必须在 3 秒内。
- GitHub Pages 部署必须在 5 分钟内完成。
- Supabase Edge Function 部署必须在 3 分钟内完成。
- 数据库查询响应时间必须在 500ms 以内（p95）。

---

## Development Workflow / 开发工作流

### Branch Strategy / 分支策略

**EN**:
- `main`: Production-ready code only, protected branch, auto-deploy to production (GitHub Pages on `cais_chinese_p1_sarah` repo).
- `testing`: Staging environment, auto-deploy to separate staging repo (`cais_chinese_p1_sarah-staging`) with independent GitHub Pages URL.
- `feat/[feature-name]`: Feature branches, merged to `testing` via PR. MUST include `specs/[feature-name]/` directory.
- `fix/[issue-description]`: Bugfix branches, merged to `testing` via PR.

**Important / 重要**: Staging and production are **completely isolated**:
- Staging: `testing` branch → `cais_chinese_p1_sarah-staging` repo → Testing Supabase (`gjbdqcjyliuxrnmwotvc`)
- Production: `main` branch → `cais_chinese_p1_sarah` repo → Production Supabase (`pzatgmavjvrastnumxty`)

**中文**:
- `main`：仅包含生产就绪代码，受保护分支，自动部署到生产环境（`cais_chinese_p1_sarah` repo 的 GitHub Pages）。
- `testing`：暂存环境，自动部署到独立的暂存 repo（`cais_chinese_p1_sarah-staging`），拥有独立的 GitHub Pages URL。
- `feat/[feature-name]`：功能分支，通过 PR 合并到 `testing`。必须包含 `specs/[feature-name]/` 目录。
- `fix/[issue-description]`：Bug 修复分支，通过 PR 合并到 `testing`。

**重要**：暂存环境和生产环境**完全隔离**：
- 暂存环境：`testing` 分支 → `cais_chinese_p1_sarah-staging` repo → Testing Supabase (`gjbdqcjyliuxrnmwotvc`)
- 生产环境：`main` 分支 → `cais_chinese_p1_sarah` repo → Production Supabase (`pzatgmavjvrastnumxty`)

---

### Spec-Driven Workflow / 规范驱动工作流

**EN**:
All development MUST follow this workflow:

1. **Specification Phase** (`/speckit.spec` command):
   - Create `specs/[###-feature-name]/spec.md`
   - Define user scenarios with priorities (P1, P2, P3...)
   - Define functional requirements (FR-001, FR-002...)
   - Define success criteria (SC-001, SC-002...)
   - Define assumptions and edge cases

2. **Planning Phase** (`/speckit.plan` command):
   - Create `specs/[###-feature-name]/plan.md`
   - Define technical context (language, dependencies, storage, testing)
   - Perform constitution check (MUST pass before implementation)
   - Define project structure and file organization
   - Identify complexity and justify design decisions

3. **Task Breakdown Phase** (`/speckit.tasks` command):
   - Create `specs/[###-feature-name]/tasks.md`
   - Break down plan into actionable tasks
   - Categorize tasks (frontend, backend, database, testing, docs)
   - Estimate effort and define dependencies

4. **Implementation Phase**:
   - Implement tasks in order defined in `tasks.md`
   - Update task status after completing each task
   - Follow all principles defined in this constitution
   - Commit with clear messages (feat:, fix:, docs:, etc.)

5. **Verification Phase**:
   - Test implementation against success criteria defined in `spec.md`
   - Ensure all functional requirements are met
   - Run constitution compliance check
   - Update documentation if needed

6. **Deployment Phase**:
   - Push to `testing` branch → Auto-deploy to staging
   - Verify in staging environment (GitHub Pages + Testing Supabase)
   - Create PR to `main` branch → Trigger production deployment approval
   - After approval → Auto-deploy to production

**中文**:
所有开发必须遵循此工作流：

1. **规范阶段**（`/speckit.spec` 命令）：
   - 创建 `specs/[###-feature-name]/spec.md`
   - 定义用户场景并设置优先级（P1, P2, P3...）
   - 定义功能需求（FR-001, FR-002...）
   - 定义成功标准（SC-001, SC-002...）
   - 定义假设和边界情况

2. **计划阶段**（`/speckit.plan` 命令）：
   - 创建 `specs/[###-feature-name]/plan.md`
   - 定义技术上下文（语言、依赖、存储、测试）
   - 执行宪法检查（实现前必须通过）
   - 定义项目结构和文件组织
   - 识别复杂性并为设计决策提供理由

3. **任务分解阶段**（`/speckit.tasks` 命令）：
   - 创建 `specs/[###-feature-name]/tasks.md`
   - 将计划分解为可执行的任务
   - 分类任务（前端、后端、数据库、测试、文档）
   - 估算工作量并定义依赖关系

4. **实施阶段**：
   - 按 `tasks.md` 中定义的顺序实现任务
   - 完成每个任务后更新任务状态
   - 遵循本宪法中定义的所有原则
   - 使用清晰的提交消息（feat:, fix:, docs: 等）

5. **验证阶段**：
   - 根据 `spec.md` 中定义的成功标准测试实现
   - 确保所有功能需求都已满足
   - 运行宪法合规性检查
   - 如需要则更新文档

6. **部署阶段**：
   - 推送到 `testing` 分支 → 自动部署到暂存环境
   - 在暂存环境中验证（GitHub Pages + Testing Supabase）
   - 创建到 `main` 分支的 PR → 触发生产部署审批
   - 审批后 → 自动部署到生产环境

---

### Local Development / 本地开发

**EN**:
1. Frontend: Open `index.html` directly in browser or use local server (e.g., `python -m http.server`).
2. Backend: Use Supabase CLI to test Edge Functions locally: `supabase functions serve`.
3. Database: Use Supabase Dashboard or Supabase CLI for schema changes.
4. Environment: Copy `inject-env.example.js` to `inject-env.js` and configure local environment variables.

**中文**:
1. 前端：直接在浏览器中打开 `index.html` 或使用本地服务器（如 `python -m http.server`）。
2. 后端：使用 Supabase CLI 在本地测试 Edge Functions：`supabase functions serve`。
3. 数据库：使用 Supabase Dashboard 或 Supabase CLI 进行架构更改。
4. 环境：将 `inject-env.example.js` 复制到 `inject-env.js` 并配置本地环境变量。

---

### Deployment / 部署

**EN**:
1. **Staging**: Push to `testing` branch → GitHub Actions deploys to `cais_chinese_p1_sarah-staging` repo (GitHub Pages) + Testing Supabase (`gjbdqcjyliuxrnmwotvc`).
2. **Production**: Push to `main` branch → GitHub Actions deploys to `cais_chinese_p1_sarah` repo (GitHub Pages) + Production Supabase (`pzatgmavjvrastnumxty`).
3. **Frontend build**: `inject-env.js` injects environment-specific Supabase credentials at build time.
4. **Edge Functions**: Deployed via Supabase CLI (`supabase functions deploy`).
5. **Database**: Use `supabase db push` or let GitHub Actions auto-deploy migrations.
6. **Secrets**: Configure via GitHub Repository Secrets (`STAGING_REPO_TOKEN`, `SUPABASE_ACCESS_TOKEN`, etc.) and Supabase Dashboard (Edge Function secrets).

**Important**: Staging and production are **completely isolated** (separate repos, separate Supabase projects).

**中文**:
1. **暂存环境**：推送到 `testing` 分支 → GitHub Actions 部署到 `cais_chinese_p1_sarah-staging` repo (GitHub Pages) + Testing Supabase (`gjbdqcjyliuxrnmwotvc`)。
2. **生产环境**：推送到 `main` 分支 → GitHub Actions 部署到 `cais_chinese_p1_sarah` repo (GitHub Pages) + Production Supabase (`pzatgmavjvrastnumxty`)。
3. **前端构建**：`inject-env.js` 在构建时注入特定环境的中 Supabase 凭据。
4. **Edge Functions**：通过 Supabase CLI (`supabase functions deploy`) 部署。
5. **数据库**：使用 `supabase db push` 或让 GitHub Actions 自动部署迁移。
6. **密钥**：通过 GitHub Repository Secrets（`STAGING_REPO_TOKEN`、`SUPABASE_ACCESS_TOKEN` 等）和 Supabase Dashboard（Edge Function 密钥）配置。

**重要**：暂存环境和生产环境**完全隔离**（不同的 repo，不同的 Supabase 项目）。

---

## Governance / 治理

**EN**: This constitution supersedes all ad-hoc development practices. Any PR that violates these principles MUST be rejected. Exceptions require a written amendment proposal with justification. AI integration features are subject to additional security review. All team members MUST read and understand this constitution before contributing.

**中文**: 本宪法取代所有临时开发实践。任何违反这些原则的 PR 必须被拒绝。例外情况需要书面修改提案并附上理由。AI 集成功能需要额外的安全审查。所有团队成员在贡献之前必须阅读并理解本宪法。

---

**Version / 版本**: 1.1.1 | **Ratified / 批准日期**: TODO(RATIFICATION_DATE): Set this date when the constitution is formally approved by the team. / 团队正式批准宪法时设置此日期。 | **Last Amended / 最后修改**: 2026-07-01 (Updated CI/CD section for separate staging/production repos)
