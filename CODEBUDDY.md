# CODEBUDDY.md - Project Context for AI Agent

<!-- SPECKIT START -->
**Current Feature**: 003-teacher-admin-portal (教师后台独立门户)
**Current Plan**: `specs/003-teacher-admin-portal/plan.md` (v1.0, 2026-08-24)
**Status**: **已部署 staging**（用户要求仅 staging，未合 main / 未上生产）
**Depends on**: 002-multi-poet (Phase 2, 生产运行中)

## Active Context
- 003 已完成 T033-T051（19/21），T052 staging 验证通过，T053 待生产部署时收尾
- 教师后台: https://jasonrabbittech.github.io/cais_chinese_p1_sarah-staging/admin/
- 教师账号（testing）: teacher@sarah-ai.test（密码见交付说明，Dashboard 可改）
- teacher-ops: JWT 鉴权（GoTrue 转发）+ 限流 + 10 个操作（契约: specs/003/contracts/）
- Auth: testing 环境已禁止公开注册；**生产环境 Auth 配置待做**（上生产前）
- 学生端 index.html: 管理代码已移除（-408 行），TEACHER_PASSWORD 已删
- 下一 Feature: 004-poet-cms-engagement（spec 完成，依赖 003 先上生产）

## Next Steps
1. 用户在 staging 试用教师后台（quickstart.md 场景 1-6）
2. 确认后 PR feat/003 → main（生产 Auth 配置 → 部署 → 复验）
3. 关闭 002 Open Issues O-1/O-2 → 启动 004 plan

## Key Files (Phase 3)
- Spec: `specs/003-teacher-admin-portal/`（spec/plan/tasks/contracts/data-model/quickstart/research）
- Admin Portal: `admin/index.html`
- Edge Function: `supabase/functions/teacher-ops/index.ts`（JWT 鉴权版）
<!-- SPECKIT END -->

---

## Project Overview

Sarah-AI-Sushi is a Chinese language teaching mini-program that simulates ancient Chinese poets' social media posts ("moments" / 朋友圈). 

### Technology Stack
- **Frontend**: HTML5 + CSS3 + Vanilla JS (static site, deployed to GitHub Pages)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **AI**: DeepSeek API (accessed via Supabase Edge Functions)
- **CI/CD**: GitHub Actions

### Constitution Principles
See `.specify/memory/constitution.md` for full details:
1. **Supabase-First** (non-negotiable)
2. **Edge Functions for AI Integration**
3. **Static Site Deployment**
4. **Security by Default**
5. **GitHub Flow (testing → main)**
6. **AI Content Safety**
7. **Code Quality and Documentation**
8. **Spec-Driven Development** (mandatory)

---

## Development Workflow

1. **Specification** (`/speckit.spec`) → `specs/[feature]/spec.md`
2. **Planning** (`/speckit.plan`) → `specs/[feature]/plan.md`
3. **Task Breakdown** (`/speckit.tasks`) → `specs/[feature]/tasks.md`
4. **Implementation** → Follow tasks.md, commit with clear messages
5. **Verification** → Test against spec.md success criteria
6. **Deployment** → Push to `testing` → verify → PR to `main`

---

## Current Branch Strategy

- `main`: Production-ready code, protected, auto-deploy to production
- `testing`: Staging environment, auto-deploy to GitHub Pages (staging URL)
- `feat/[feature-name]`: Feature branches, merged to `testing` via PR

---

## Environment Setup

### Frontend
```bash
# Open index.html directly in browser
open index.html

# Or use local server
python3 -m http.server 8000
# Then visit http://localhost:8000
```

### Backend (Edge Functions)
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Start local Edge Functions (if needed)
supabase functions serve
```

### Database
- Use Supabase Dashboard (https://supabase.com/dashboard)
- Or use Supabase CLI: `supabase db push`

---

## Key Reminders

1. **Always follow Constitution** (`.specify/memory/constitution.md`)
2. **No secrets in code** (use Supabase Secrets or GitHub Secrets)
3. **Test on both desktop and mobile** (responsive design is P1)
4. **Run constitution compliance check before PR merge**
5. **Update documentation** when making significant changes

---

**Last Updated**: 2026-07-01
**Updated By**: AI Agent (spec-driven workflow)
