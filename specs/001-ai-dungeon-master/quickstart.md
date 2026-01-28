# Quickstart: AI Dungeon Master MVP

**Feature**: 001-ai-dungeon-master
**Date**: 2026-01-28

This guide helps developers get the AI Dungeon Master running locally for development.

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- Git
- Supabase account (free tier works)
- OpenAI API key

## 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd DnD-Master

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## 2. Supabase Setup

### Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings > API

### Run Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Run migrations
supabase db push
```

### Enable Realtime

1. Go to Database > Replication in Supabase dashboard
2. Enable replication for: `sessions`, `events`

### Configure Auth Providers

1. Go to Authentication > Providers
2. Enable Email provider
3. Enable Google provider (requires Google Cloud credentials)

## 3. Environment Variables

### Backend (`backend/.env`)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4-turbo-preview

# Server
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
# Supabase (public keys only)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 4. Seed Rulebook Data

The D&D rulebook dataset must be loaded before running:

```bash
cd backend

# Load sample rules (included in repo)
npm run seed:rules

# Verify rules loaded
npm run verify:rules
```

## 5. Start Development Servers

### Terminal 1: Backend

```bash
cd backend
npm run dev

# Server starts on http://localhost:3001
# API available at http://localhost:3001/api
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev

# App starts on http://localhost:3000
```

## 6. Verify Setup

### Health Check

```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok","version":"1.0.0"}
```

### Auth Test

1. Open http://localhost:3000
2. Click "Sign Up"
3. Create account with email/password
4. Verify you see the dashboard

### Create Test Campaign

1. Click "New Campaign"
2. Enter name: "Test Campaign"
3. Leave default settings (RNG dice, 2D grid map)
4. Click "Create"

### Start Session

1. From campaign page, click "Start Session"
2. Wait for AI DM introduction
3. Type an action: "I look around the room"
4. Verify AI responds with narrative

## 7. Run Tests

```bash
# Backend unit tests
cd backend
npm test

# Backend integration tests
npm run test:integration

# Frontend E2E tests
cd frontend
npm run test:e2e
```

## Common Issues

### "Supabase connection refused"

- Verify `SUPABASE_URL` is correct
- Check Supabase project is not paused (free tier pauses after inactivity)

### "OpenAI rate limit"

- Check your OpenAI usage at platform.openai.com
- Use a lower-tier model for development: `OPENAI_MODEL=gpt-3.5-turbo`

### "CORS error"

- Verify `FRONTEND_URL` in backend .env matches your frontend URL
- Restart backend after .env changes

### "Rules not found"

- Run `npm run seed:rules` in backend directory
- Check `backend/src/rules/` directory has JSON files

### "Auth redirect fails"

- Verify Supabase site URL is set to `http://localhost:3000`
- Check redirect URLs include `http://localhost:3000/**`

## Development Workflow

### Adding a New API Endpoint

1. Define route in `backend/src/api/routes/`
2. Add OpenAPI spec in `specs/001-ai-dungeon-master/contracts/api.yaml`
3. Write integration test in `backend/tests/integration/`

### Modifying AI Prompts

1. Edit prompts in `backend/src/services/ai/prompts.ts`
2. Test with `npm run test:ai` (uses mock responses)
3. Test live with `npm run test:ai:live`

### Adding UI Components

1. Create component in `frontend/src/components/`
2. Use theme tokens from `frontend/src/lib/theme.ts`
3. Write Playwright test in `frontend/tests/e2e/`

## Project Structure Reference

```
DnD-Master/
├── backend/
│   ├── src/
│   │   ├── api/routes/       # Express routes
│   │   ├── services/         # Business logic
│   │   ├── models/           # TypeScript types
│   │   └── rules/            # D&D rulebook JSON
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # React components
│   │   └── lib/              # Utilities
│   └── tests/
└── specs/
    └── 001-ai-dungeon-master/
        ├── spec.md           # Requirements
        ├── plan.md           # Implementation plan
        ├── data-model.md     # Database schema
        └── contracts/        # API specs
```

## Next Steps

After setup is complete:

1. Review the [spec.md](./spec.md) for feature requirements
2. Review the [plan.md](./plan.md) for architecture decisions
3. Check [data-model.md](./data-model.md) for database schema
4. Run `/speckit.tasks` to generate implementation tasks
