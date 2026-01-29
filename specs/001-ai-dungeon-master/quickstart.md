# Quickstart: AI Dungeon Master MVP

**Feature**: 001-ai-dungeon-master
**Date**: 2026-01-28

This guide helps developers get the AI Dungeon Master running locally for development.

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- Git
- PostgreSQL 14+ with pgvector extension
- OpenAI API key (for embeddings and AI)

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

## 2. PostgreSQL Setup

### Install PostgreSQL and pgvector

```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo apt install postgresql-14-pgvector  # or your version

# macOS with Homebrew
brew install postgresql@14
brew install pgvector

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql@14  # macOS
```

### Create Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE dnd_master;
CREATE USER dnd_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE dnd_master TO dnd_user;
\q
```

### Run Initialization Script

```bash
# Run the initialization SQL
psql -U dnd_user -d dnd_master -f backend/sql/init.sql
```

This creates all tables, indexes, functions, and triggers needed for the application.

## 3. Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql://dnd_user:your_password@localhost:5432/dnd_master

# Authentication
JWT_SECRET=your-secret-key-at-least-32-characters
JWT_EXPIRES_IN=7d

# LLM Provider (choose one: openai, claude)
LLM_PROVIDER=openai

# OpenAI (if LLM_PROVIDER=openai)
OPENAI_API_KEY=sk-your-openai-key

# Claude (if LLM_PROVIDER=claude)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Server
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
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
# Should return: {"status":"healthy","services":{"api":"up","database":"up"}}
```

### Auth Test

1. Open http://localhost:3000
2. Click "Sign Up"
3. Create account with email/password
4. Verify you see the dashboard

### Create Test Campaign

1. Click "New Campaign"
2. Enter name: "Test Campaign"
3. Leave default settings (RNG dice, narrative map)
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

### "Database connection refused"

- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check `DATABASE_URL` in backend .env is correct
- Ensure database and user exist

### "pgvector extension not found"

```bash
# Connect to database and enable extension
psql -U dnd_user -d dnd_master
CREATE EXTENSION IF NOT EXISTS vector;
```

### "LLM API rate limit"

- **OpenAI**: Check usage at platform.openai.com; use `gpt-3.5-turbo` for development
- **Claude**: Check usage at console.anthropic.com; use `claude-3-haiku` for development
- Switch providers by changing `LLM_PROVIDER` env variable

### "CORS error"

- Verify `FRONTEND_URL` in backend .env matches your frontend URL
- Restart backend after .env changes

### "Rules not found"

- Run `npm run seed:rules` in backend directory
- Check `backend/src/rules/` directory has JSON files

### "JWT token invalid"

- Verify `JWT_SECRET` is set in backend .env
- Ensure token hasn't expired (default: 7 days)
- Check that Authorization header is being sent correctly

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
│   │   ├── config/           # Database and auth config
│   │   └── rules/            # D&D rulebook JSON
│   ├── sql/
│   │   └── init.sql          # Database initialization
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
