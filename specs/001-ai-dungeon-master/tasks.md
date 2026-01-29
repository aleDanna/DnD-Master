# Tasks: AI Dungeon Master MVP

**Input**: Design documents from `/specs/001-ai-dungeon-master/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for frontend and backend

- [x] T001 Create backend project structure with directories: `backend/src/{api,services,models,rules,config}` and `backend/tests/{unit,integration}`
- [x] T002 Initialize backend Node.js/TypeScript project with package.json in `backend/`
- [x] T003 [P] Install backend dependencies (express, @supabase/supabase-js, openai, cors, dotenv) in `backend/`
- [x] T004 [P] Configure TypeScript with tsconfig.json in `backend/`
- [x] T005 [P] Configure ESLint and Prettier for backend in `backend/.eslintrc.js`
- [x] T006 Create frontend project structure with Next.js App Router in `frontend/`
- [x] T007 Initialize Next.js 14 project with TypeScript in `frontend/`
- [x] T008 [P] Install frontend dependencies (tailwindcss, @supabase/auth-helpers-nextjs) in `frontend/`
- [x] T009 [P] Configure Tailwind CSS with dark theme tokens in `frontend/tailwind.config.js`
- [x] T010 [P] Create theme CSS variables (Discord-inspired dark theme) in `frontend/src/styles/globals.css`
- [x] T011 [P] Configure ESLint for frontend in `frontend/.eslintrc.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Supabase Setup

- [x] T012 Create Supabase project configuration in `backend/src/config/supabase.ts`
- [x] T013 Create database migration for profiles table in `backend/supabase/migrations/001_profiles.sql`
- [x] T014 [P] Create database migration for campaigns table in `backend/supabase/migrations/002_campaigns.sql`
- [x] T015 [P] Create database migration for campaign_players table in `backend/supabase/migrations/003_campaign_players.sql`
- [x] T016 [P] Create database migration for characters table in `backend/supabase/migrations/004_characters.sql`
- [x] T017 [P] Create database migration for sessions table in `backend/supabase/migrations/005_sessions.sql`
- [x] T018 [P] Create database migration for events table in `backend/supabase/migrations/006_events.sql`
- [x] T019 Create RLS policies migration in `backend/supabase/migrations/007_rls_policies.sql`

### TypeScript Models (Shared Types)

- [x] T020 [P] Create Campaign type definitions in `backend/src/models/campaign.ts`
- [x] T021 [P] Create Character type definitions in `backend/src/models/character.ts`
- [x] T022 [P] Create Session type definitions in `backend/src/models/session.ts`
- [x] T023 [P] Create Event type definitions in `backend/src/models/event.ts`
- [x] T024 [P] Create Combat type definitions in `backend/src/models/combat.ts`
- [x] T025 Create shared types index in `backend/src/models/index.ts`

### Backend API Framework

- [x] T026 Create Express app entry point in `backend/src/index.ts`
- [x] T027 [P] Create auth middleware for JWT validation in `backend/src/api/middleware/auth.ts`
- [x] T028 [P] Create validation middleware in `backend/src/api/middleware/validation.ts`
- [x] T029 [P] Create error handling middleware in `backend/src/api/middleware/error-handler.ts`
- [x] T030 Configure CORS and JSON body parsing in `backend/src/index.ts`
- [x] T031 Create health check endpoint in `backend/src/api/routes/health.ts`

### Frontend Auth & Layout

- [x] T032 Create Supabase client for frontend in `frontend/src/lib/supabase.ts`
- [x] T033 Create auth context provider in `frontend/src/components/ui/AuthProvider.tsx`
- [x] T034 Create root layout with ThemeProvider in `frontend/src/app/layout.tsx`
- [x] T035 [P] Create Login page in `frontend/src/app/auth/login/page.tsx`
- [x] T036 [P] Create Signup page in `frontend/src/app/auth/signup/page.tsx`
- [x] T037 Create protected route wrapper in `frontend/src/components/ui/ProtectedRoute.tsx`
- [x] T038 Create API client for backend calls in `frontend/src/lib/api.ts`

### Rules Dataset (parses docs/rules.txt and docs/handbook.txt)

- [x] T039 Create RuleSection types in `backend/src/rules/types.ts`
- [x] T040 Create rules parser for docs/*.txt in `backend/src/rules/parser.ts`
- [x] T041 Create rules dataset loader (loads and indexes parsed sections) in `backend/src/rules/index.ts`
- [x] T042 Create rules service for lookups and citations in `backend/src/services/game/rules-service.ts`
- [x] T043 Write unit tests for rules parser in `backend/src/rules/__tests__/parser.test.ts`

### LLM Configuration (OpenAI / Gemini / Claude)

- [x] T045 Create configurable LLM provider abstraction in `backend/src/config/llm/`
- [x] T046 Create base prompt templates in `backend/src/ai/prompts.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Solo Campaign with AI DM (Priority: P1) 🎯 MVP [COMPLETED]

**Goal**: A player creates a campaign, starts a session, and has a natural conversation with the AI DM

**Independent Test**: One user can create a campaign, start a session, submit actions, and receive AI narrative responses with dice rolls and rule citations

### Backend - Data Repositories

- [x] T047 [US1] Implement CampaignRepository in `backend/src/services/data/campaign-repo.ts`
- [x] T048 [US1] Implement SessionRepository in `backend/src/services/data/session-repo.ts`
- [x] T049 [US1] Implement EventRepository in `backend/src/services/data/event-repo.ts`

### Backend - Game Services

- [x] T050 [US1] Implement DiceService with RNG and logging in `backend/src/services/game/dice-service.ts`
- [x] T051 [US1] Implement StateService for session state management in `backend/src/services/game/state-service.ts`

### Backend - AI Services

- [x] T052 [US1] Create AI response parser in `backend/src/services/ai/response-parser.ts`
- [x] T053 [US1] Implement DMService for AI orchestration in `backend/src/services/ai/dm-service.ts`
- [x] T054 [US1] Create DM system prompt with rules grounding in `backend/src/ai/prompts.ts`

### Backend - API Routes

- [x] T055 [US1] Create campaigns routes (create, get, list) in `backend/src/api/routes/campaigns.ts`
- [x] T056 [US1] Create sessions routes (create, get) in `backend/src/api/routes/sessions.ts`
- [x] T057 [US1] Create game action endpoint (POST /sessions/:id/action) in `backend/src/api/routes/game.ts`
- [x] T058 [US1] Implement streaming response for AI output in `backend/src/api/routes/game.ts`
- [x] T059 [US1] Create dice roll endpoint in `backend/src/api/routes/game.ts`
- [x] T060 [US1] Create events list endpoint in `backend/src/api/routes/game.ts`

### Frontend - Shared UI Components

- [x] T061 [P] [US1] Create Button component in `frontend/src/components/ui/Button.tsx`
- [x] T062 [P] [US1] Create Modal component in `frontend/src/components/ui/Modal.tsx`
- [x] T063 [P] [US1] Create Input component in `frontend/src/components/ui/Input.tsx`
- [x] T064 [P] [US1] Create Card component in `frontend/src/components/ui/Card.tsx`

### Frontend - Chat Components

- [x] T065 [US1] Create ChatFeed component in `frontend/src/components/chat/ChatFeed.tsx`
- [x] T066 [US1] Create ChatInput component in `frontend/src/components/chat/ChatInput.tsx`
- [x] T067 [US1] Create MessageBubble component (player/AI variants) in `frontend/src/components/chat/MessageBubble.tsx`
- [x] T068 [US1] Create SystemMessage component for mechanics in `frontend/src/components/chat/SystemMessage.tsx`

### Frontend - Game Components

- [x] T069 [US1] Create DiceLog panel component in `frontend/src/components/game/DiceLog.tsx`

### Frontend - Campaign Components

- [x] T070 [US1] Create CampaignCard component in `frontend/src/components/campaign/CampaignCard.tsx`

### Frontend - Pages

- [x] T071 [US1] Create dashboard page (campaign list) in `frontend/src/app/dashboard/page.tsx`
- [x] T072 [US1] Create new campaign page in `frontend/src/app/dashboard/campaigns/new/page.tsx`
- [x] T073 [US1] Create campaign detail page in `frontend/src/app/dashboard/campaigns/[id]/page.tsx`
- [x] T074 [US1] Create session play page with chat layout in `frontend/src/app/session/[id]/page.tsx`

### Integration

- [x] T075 [US1] Connect frontend session page to backend game action endpoint
- [x] T076 [US1] Implement streaming message display in ChatFeed component
- [x] T077 [US1] Wire up dice log updates from events endpoint

**Checkpoint**: User Story 1 (Solo Campaign with AI DM) is fully functional and testable independently

---

## Phase 4: User Story 2 - Combat Encounter (Priority: P2) [COMPLETED]

**Goal**: Player engages in combat with initiative, turn order, HP tracking, and dice integration

**Independent Test**: Trigger combat, complete initiative rolls, take turns, deal damage, and end combat through victory

### Backend - Combat Service

- [x] T078 [US2] Implement CombatService with initiative and turn management in `backend/src/services/game/combat-service.ts`
- [x] T079 [US2] Add combat state handling to StateService in `backend/src/services/game/state-service.ts`
- [x] T080 [US2] Update DMService to handle combat scenarios in `backend/src/services/ai/dm-service.ts`
- [x] T081 [US2] Add combat-specific prompts in `backend/src/services/ai/prompts.ts`

### Backend - Combat API

- [x] T082 [US2] Create combat state endpoint (GET /sessions/:id/combat) in `backend/src/api/routes/game.ts`
- [x] T083 [US2] Handle combat start/end in game action endpoint in `backend/src/api/routes/game.ts`

### Frontend - Combat Components

- [x] T084 [US2] Create CombatTracker component in `frontend/src/components/game/CombatTracker.tsx`
- [x] T085 [US2] Create InitiativeList component in `frontend/src/components/game/InitiativeList.tsx`
- [x] T086 [US2] Create CombatantCard component (HP, conditions) in `frontend/src/components/game/CombatantCard.tsx`

### Frontend - Map Components

- [x] T087 [US2] Create MapCanvas component (2D grid) in `frontend/src/components/game/MapCanvas.tsx`
- [x] T088 [US2] Create Token component for map in `frontend/src/components/game/Token.tsx`
- [x] T089 [US2] Implement drag-and-drop token movement in MapCanvas

### Frontend - Integration

- [x] T090 [US2] Add CombatTracker to session page layout in `frontend/src/app/session/[id]/page.tsx`
- [x] T091 [US2] Add MapCanvas to session page (conditional on map_mode) in `frontend/src/app/session/[id]/page.tsx`
- [x] T092 [US2] Connect combat state updates to CombatTracker

**Checkpoint**: User Story 2 (Combat Encounter) is fully functional and testable independently

---

## Phase 5: User Story 3 - Session Save and Resume with Recap (Priority: P2)

**Goal**: Player can save session, leave, return, and resume with AI-generated recap

**Independent Test**: Play session, save, close browser, return, resume, verify recap displays and gameplay continues

### Backend - Session Persistence

- [ ] T093 [US3] Implement session save logic in SessionRepository in `backend/src/services/data/session-repo.ts`
- [ ] T094 [US3] Create recap generation in DMService in `backend/src/services/ai/dm-service.ts`
- [ ] T095 [US3] Add recap prompt template in `backend/src/services/ai/prompts.ts`

### Backend - Session API

- [ ] T096 [US3] Create save session endpoint (POST /sessions/:id/save) in `backend/src/api/routes/sessions.ts`
- [ ] T097 [US3] Create resume session endpoint (POST /sessions/:id/resume) in `backend/src/api/routes/sessions.ts`
- [ ] T098 [US3] Create end session endpoint (POST /sessions/:id/end) in `backend/src/api/routes/sessions.ts`

### Frontend - Recap Components

- [ ] T099 [US3] Create RecapPanel component in `frontend/src/components/game/RecapPanel.tsx`
- [ ] T100 [US3] Create SessionControls component (save, end buttons) in `frontend/src/components/game/SessionControls.tsx`

### Frontend - Session List

- [ ] T101 [US3] Add session list to campaign detail page in `frontend/src/app/campaigns/[id]/page.tsx`
- [ ] T102 [US3] Create SessionCard component (status, resume button) in `frontend/src/components/campaign/SessionCard.tsx`

### Frontend - Integration

- [ ] T103 [US3] Add RecapPanel to session page (shows on resume) in `frontend/src/app/session/[id]/page.tsx`
- [ ] T104 [US3] Implement save/resume flow with confirmation modal
- [ ] T105 [US3] Add SessionControls to session page header

**Checkpoint**: User Story 3 (Session Save/Resume) is fully functional and testable independently

---

## Phase 6: User Story 4 - Multiplayer Campaign (Priority: P3)

**Goal**: Campaign owner invites players, multiple players join and participate together

**Independent Test**: Owner invites player by email, player accepts, both join session, both take actions

### Backend - Multiplayer

- [ ] T106 [US4] Implement CampaignPlayerRepository in `backend/src/services/data/campaign-player-repo.ts`
- [ ] T107 [US4] Add multiplayer support to StateService (versioned updates) in `backend/src/services/game/state-service.ts`
- [ ] T108 [US4] Implement conflict detection for concurrent actions in `backend/src/services/game/state-service.ts`

### Backend - Invite API

- [ ] T109 [US4] Create invite endpoint (POST /campaigns/:id/invite) in `backend/src/api/routes/campaigns.ts`
- [ ] T110 [US4] Create join endpoint (POST /campaigns/:id/join) in `backend/src/api/routes/campaigns.ts`
- [ ] T111 [US4] Create campaign players list endpoint in `backend/src/api/routes/campaigns.ts`

### Backend - Realtime

- [ ] T112 [US4] Setup Supabase Realtime subscriptions for sessions in `backend/src/services/realtime/session-sync.ts`

### Frontend - Invite Components

- [ ] T113 [US4] Create InviteDialog component in `frontend/src/components/campaign/InviteDialog.tsx`
- [ ] T114 [US4] Create PlayerList component in `frontend/src/components/campaign/PlayerList.tsx`

### Frontend - Integration

- [ ] T115 [US4] Add invite button and PlayerList to campaign detail page
- [ ] T116 [US4] Create invitation acceptance page in `frontend/src/app/campaigns/join/[token]/page.tsx`
- [ ] T117 [US4] Implement Supabase Realtime subscription in session page for live updates

**Checkpoint**: User Story 4 (Multiplayer) is fully functional and testable independently

---

## Phase 7: User Story 5 - Campaign and Character Management (Priority: P3)

**Goal**: Full CRUD for campaigns and characters with settings configuration

**Independent Test**: Create campaign, configure settings, create character, edit both, verify persistence

### Backend - Character Management

- [ ] T118 [US5] Implement CharacterRepository in `backend/src/services/data/character-repo.ts`

### Backend - API

- [ ] T119 [US5] Add campaign update/delete endpoints in `backend/src/api/routes/campaigns.ts`
- [ ] T120 [US5] Create characters CRUD routes in `backend/src/api/routes/characters.ts`

### Frontend - Campaign Settings

- [ ] T121 [US5] Create SettingsForm component (dice_mode, map_mode) in `frontend/src/components/campaign/SettingsForm.tsx`
- [ ] T122 [US5] Add settings section to campaign detail page

### Frontend - Character Management

- [ ] T123 [US5] Create character editor page in `frontend/src/app/characters/[id]/page.tsx`
- [ ] T124 [US5] Create CharacterCard component in `frontend/src/components/campaign/CharacterCard.tsx`
- [ ] T125 [US5] Create CharacterForm component in `frontend/src/components/campaign/CharacterForm.tsx`
- [ ] T126 [US5] Add character list to campaign detail page
- [ ] T127 [US5] Create new character page in `frontend/src/app/campaigns/[id]/characters/new/page.tsx`

**Checkpoint**: User Story 5 (Campaign/Character Management) is fully functional and testable independently

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T128 [P] Add loading states to all async operations in frontend components
- [ ] T129 [P] Add error boundary component in `frontend/src/components/ui/ErrorBoundary.tsx`
- [ ] T130 [P] Implement toast notifications for success/error feedback
- [ ] T131 Add responsive mobile layout to session page
- [ ] T132 [P] Add keyboard shortcuts (Enter to send message, Escape to close modals)
- [ ] T133 Implement player-entered dice mode UI in DiceLog component
- [ ] T134 [P] Add structured logging to all backend services
- [ ] T135 [P] Create environment validation on startup in `backend/src/config/env.ts`
- [ ] T136 Run quickstart.md validation - verify all setup steps work
- [ ] T137 [P] Code cleanup - remove console.logs, unused imports

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ─────────────────────────────────────────────────────────────┐
                                                                              │
Phase 2 (Foundational) ──────────────────────────────────────────────────────┤
    ↓                                                                         │
    ├─────────────────────────────────────────────────────────────────────────┤
    │                                                                         │
    ▼                                                                         │
Phase 3 (US1: Solo Campaign) ◀── 🎯 MVP COMPLETE HERE                        │
    │                                                                         │
    ├──────────┬──────────┐                                                   │
    ▼          ▼          ▼                                                   │
Phase 4    Phase 5    Phase 6                                                 │
(US2)      (US3)      (US4)   ◀── Can run in parallel after US1             │
    │          │          │                                                   │
    └──────────┼──────────┘                                                   │
               │                                                              │
               ▼                                                              │
         Phase 7 (US5)                                                        │
               │                                                              │
               ▼                                                              │
         Phase 8 (Polish)                                                     │
```

### User Story Dependencies

| Story | Priority | Depends On | Can Start After |
|-------|----------|------------|-----------------|
| US1 | P1 | Foundational (Phase 2) | Phase 2 complete |
| US2 | P2 | US1 (combat builds on DM loop) | US1 complete |
| US3 | P2 | US1 (save/resume needs session flow) | US1 complete |
| US4 | P3 | US1 (multiplayer extends solo) | US1 complete |
| US5 | P3 | Foundational only | Phase 2 complete |

### Within Each User Story

1. Backend repositories first (data access)
2. Backend services (business logic)
3. Backend API routes (expose functionality)
4. Frontend components (UI building blocks)
5. Frontend pages (compose components)
6. Integration (wire frontend to backend)

### Parallel Opportunities

**Phase 1 (Setup)**: T003-T005 and T008-T011 can run in parallel
**Phase 2 (Foundational)**: T014-T018, T020-T024, T035-T036 can run in parallel (rules tasks T039-T043 are sequential)
**Phase 3 (US1)**: T061-T064 (UI components) can run in parallel
**After US1**: US2, US3, US4 can be worked on in parallel by different developers

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch all database migrations in parallel:
- [ ] T014 [P] Create database migration for campaigns table
- [ ] T015 [P] Create database migration for campaign_players table
- [ ] T016 [P] Create database migration for characters table
- [ ] T017 [P] Create database migration for sessions table
- [ ] T018 [P] Create database migration for events table

# Launch all TypeScript models in parallel:
- [ ] T020 [P] Create Campaign type definitions
- [ ] T021 [P] Create Character type definitions
- [ ] T022 [P] Create Session type definitions
- [ ] T023 [P] Create Event type definitions
- [ ] T024 [P] Create Combat type definitions

# Rules tasks (sequential - parser depends on types, service depends on loader):
- [ ] T039 Create RuleSection types
- [ ] T040 Create rules parser (parses docs/*.txt)
- [ ] T041 Create rules dataset loader
- [ ] T042 Create rules service
- [ ] T043 Write rules parser tests
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Solo Campaign with AI DM)
4. **STOP and VALIDATE**: Test the complete solo DM experience
5. Deploy/demo if ready - this IS the MVP

### Incremental Delivery

1. **MVP (Phase 1-3)**: Solo player can play D&D with AI DM
2. **+ Combat (Phase 4)**: Full combat encounters with tracking
3. **+ Persistence (Phase 5)**: Save/resume with recaps
4. **+ Multiplayer (Phase 6)**: Group play support
5. **+ Management (Phase 7)**: Full CRUD and settings
6. **+ Polish (Phase 8)**: Production-ready refinements

### Suggested Team Allocation

| Developer | Phases | Focus |
|-----------|--------|-------|
| Dev A | 1-3 | Core backend + AI integration |
| Dev B | 1-2, then 4-5 | Frontend + Combat + Persistence |
| Dev C | 1-2, then 6-7 | Multiplayer + Management |

---

## Summary

| Phase | Story | Tasks | Parallel Tasks |
|-------|-------|-------|----------------|
| 1 | Setup | 11 | 8 |
| 2 | Foundational | 34 | 16 |
| 3 | US1: Solo Campaign | 31 | 4 |
| 4 | US2: Combat | 15 | 0 |
| 5 | US3: Save/Resume | 13 | 0 |
| 6 | US4: Multiplayer | 12 | 0 |
| 7 | US5: Campaign/Character | 10 | 0 |
| 8 | Polish | 10 | 7 |
| **Total** | | **136** | **35** |

---

## Notes

- [P] tasks = different files, no dependencies within that phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- MVP = Phase 1 + Phase 2 + Phase 3 (User Story 1)
