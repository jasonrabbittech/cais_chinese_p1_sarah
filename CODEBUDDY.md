# CODEBUDDY.md - Project Context for AI Agent

<!-- SPECKIT START -->
**Current Feature**: 001-ai-poet-friends (AI 古代诗人朋友圈教学小程序)
**Current Plan**: `specs/001-ai-poet-friends/plan.md` (v2.0, updated 2026-07-01)
**Status**: Planning complete, ready for implementation

## Active Context
- Database schema: 2 tables (`comments`, `reply_templates`)
- Production Supabase: `Sarah_Chinese_P1` (pzatgmavjvrastnumxty)
- Testing Supabase: `cais-chinese-p1-sarah-testing` (synced 2026-07-01)
- Edge Function: `su-shi-reply` (Deployed to production)
- Phase 1 Scope: Single poet (苏轼), single post, student + teacher roles

## Next Steps
1. Review plan.md and confirm alignment with spec.md
2. Execute tasks.md (start with P1 tasks)
3. Validate implementation against quickstart.md scenarios
4. Deploy to testing branch, verify, then merge to main

## Key Files
- Spec: `specs/001-ai-poet-friends/spec.md`
- Plan: `specs/001-ai-poet-friends/plan.md`
- Tasks: `specs/001-ai-poet-friends/tasks.md`
- Data Model: `specs/001-ai-poet-friends/data-model.md`
- Quickstart: `specs/001-ai-poet-friends/quickstart.md`
- Frontend: `index.html`
- Edge Function: `edge-function.ts` (to be moved to `supabase/functions/su-shi-reply/index.ts`)
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
