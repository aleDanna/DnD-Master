# Implementation Plan: AI Dungeon Master MVP

**Branch**: `001-ai-dungeon-master` | **Date**: 2026-01-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-dungeon-master/spec.md`

## Summary

Build an AI-powered web application that serves as a Dungeon Master for D&D campaigns. The system enables players without a human DM to create, run, and resume solo or multiplayer sessions through a conversational AI interface backed by a structured game state engine.

**Technical Approach**:
- Next.js frontend with Discord-inspired dark theme for chat-centric gameplay
- Node.js/Express backend handling game state, AI orchestration, and rules validation
- Supabase for PostgreSQL database and authentication
- Configurable LLM provider (OpenAI, Gemini, or Claude) for AI DM responses with server-side validation
- Two-step AI flow: AI proposes narrative + state changes → Server validates → Persist

## Technical Context

**Language/Version**: TypeScript 5.x (frontend and backend)
**Primary Dependencies**:
- Frontend: Next.js 14, React 18, Tailwind CSS
- Backend: Express.js, Supabase JS Client, OpenAI/Gemini/Anthropic SDKs
**Storage**: PostgreSQL via Supabase (campaigns, sessions, characters, events)
**Testing**: Jest (unit), Playwright (E2E), Supertest (API integration)
**Target Platform**: Web (responsive: desktop-first, mobile-friendly)
**Project Type**: Web application (frontend + backend)
**Performance Goals**:
- AI response streaming start within 5 seconds
- 100 concurrent active sessions
- Session save/resume with 100% state fidelity
**Constraints**:
- AI must never invent rules (constitution principle)
- All dice rolls must be logged and auditable
- State changes require server validation before persistence
**Scale/Scope**:
- MVP: Free tier only
- Initial target: 100 concurrent users, campaigns with 1-6 players

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Implementation Approach |
|-----------|--------|------------------------|
| I. Rules-Grounded DM | ✅ PASS | AI prompts include rulebook dataset; server validates all rule citations; AI cannot output mechanics without dataset reference |
| II. Stateful Game Engine First | ✅ PASS | PostgreSQL is source of truth; AI proposes via structured JSON; server validates before persist; all rolls logged |
| III. Configurable Gameplay Systems | ✅ PASS | Campaign settings table with dice_mode and map_mode; defaults allow zero-config play |
| IV. Multiplayer and Persistence | ✅ PASS | Session state fully persisted; recap generated from event log; versioned updates for concurrency |
| V. Transparent Gameplay | ✅ PASS | Event log captures all state changes with timestamps, actor, and rule references; UI surfaces logs |

**Engineering Quality Bars**:
- Security: Supabase RLS for campaign isolation; JWT auth; no cross-campaign data leakage
- Reliability: Versioned state updates; optimistic locking for concurrent actions
- Testing: Unit tests for dice/combat logic; integration tests for session flows
- Observability: Structured logging for AI decisions and state changes

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-dungeon-master/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
│   ├── api.yaml         # REST API specification
│   └── ai-schemas.json  # AI request/response schemas
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
docs/                             # D&D rulebook source files (authoritative)
├── rules.txt                     # D&D Basic Rules (Version 1.0, Nov 2018)
├── rules.pdf                     # PDF version
├── handbook.txt                  # Player's Handbook
└── handbook.pdf                  # PDF version

backend/
├── src/
│   ├── api/
│   │   ├── routes/           # Express route handlers
│   │   │   ├── auth.ts
│   │   │   ├── campaigns.ts
│   │   │   ├── characters.ts
│   │   │   ├── sessions.ts
│   │   │   └── game.ts       # Core DM loop endpoint
│   │   └── middleware/
│   │       ├── auth.ts
│   │       └── validation.ts
│   ├── services/
│   │   ├── ai/
│   │   │   ├── dm-service.ts      # AI orchestration
│   │   │   ├── prompts.ts         # Prompt templates
│   │   │   └── response-parser.ts # Parse AI structured output
│   │   ├── game/
│   │   │   ├── dice-service.ts    # Dice rolling (RNG + logging)
│   │   │   ├── combat-service.ts  # Combat state management
│   │   │   ├── rules-service.ts   # Rules lookup and validation
│   │   │   └── state-service.ts   # Session state management
│   │   └── data/
│   │       ├── campaign-repo.ts
│   │       ├── session-repo.ts
│   │       └── character-repo.ts
│   ├── models/
│   │   ├── campaign.ts
│   │   ├── character.ts
│   │   ├── session.ts
│   │   ├── event.ts
│   │   └── combat.ts
│   ├── rules/                     # D&D rulebook dataset loader
│   │   ├── index.ts               # Dataset loader and search
│   │   ├── parser.ts              # Parses docs/*.txt into structured data
│   │   └── types.ts               # Rule citation types
│   └── config/
│       ├── supabase.ts
│       └── llm/                  # Configurable LLM providers
│           ├── index.ts          # Factory and unified interface
│           ├── types.ts          # Provider interface types
│           ├── openai-provider.ts
│           ├── gemini-provider.ts
│           └── claude-provider.ts
└── tests/
    ├── unit/
    │   ├── dice-service.test.ts
    │   ├── combat-service.test.ts
    │   └── rules-service.test.ts
    └── integration/
        ├── session-flow.test.ts
        └── game-loop.test.ts

frontend/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Landing/dashboard
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── campaigns/
│   │   │   ├── page.tsx           # Campaign list
│   │   │   ├── [id]/page.tsx      # Campaign detail
│   │   │   └── new/page.tsx       # Create campaign
│   │   ├── characters/
│   │   │   └── [id]/page.tsx      # Character editor
│   │   └── session/
│   │       └── [id]/page.tsx      # Session play screen
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatFeed.tsx       # Message history
│   │   │   ├── ChatInput.tsx      # Player input
│   │   │   ├── MessageBubble.tsx  # Individual message
│   │   │   └── SystemMessage.tsx  # Mechanics/system output
│   │   ├── game/
│   │   │   ├── DiceLog.tsx        # Roll history panel
│   │   │   ├── CombatTracker.tsx  # Initiative/HP tracker
│   │   │   ├── MapCanvas.tsx      # 2D grid with tokens
│   │   │   └── RecapPanel.tsx     # Session recap
│   │   ├── campaign/
│   │   │   ├── CampaignCard.tsx
│   │   │   ├── SettingsForm.tsx
│   │   │   └── InviteDialog.tsx
│   │   └── ui/                    # Shared UI components
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── ThemeProvider.tsx
│   ├── lib/
│   │   ├── api-client.ts          # Backend API client
│   │   ├── supabase.ts            # Supabase client
│   │   └── theme.ts               # CSS variable definitions
│   └── styles/
│       └── globals.css            # Tailwind + theme tokens
└── tests/
    └── e2e/
        ├── auth.spec.ts
        ├── campaign.spec.ts
        └── session.spec.ts
```

**Structure Decision**: Web application with separate frontend (Next.js) and backend (Express) projects. This separation enables:
- Independent scaling of API and UI
- Clear boundary for AI orchestration (backend only)
- Supabase handles auth and database, reducing backend complexity

## Complexity Tracking

> No constitution violations requiring justification. All principles are satisfied by the design.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Separate backend | Express.js API | AI orchestration and state validation require server-side control; Next.js API routes insufficient for streaming + complex validation |
| Rulebook source | `docs/rules.txt` + `docs/handbook.txt` | Constitution requires AI use only in-app dataset; parsed at startup into searchable format for rule citations |
| Two-step AI flow | Propose → Validate → Persist | Constitution requires server validation of all state changes; AI cannot directly modify database |
