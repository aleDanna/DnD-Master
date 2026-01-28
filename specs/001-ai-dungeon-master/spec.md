# Feature Specification: AI Dungeon Master MVP

**Feature Branch**: `001-ai-dungeon-master`
**Created**: 2026-01-28
**Status**: Draft
**Input**: AI-powered web app that acts as a Dungeon Master for D&D campaigns

## Overview

Build a web application that replaces the need for a human Dungeon Master by providing AI-driven storytelling, rules-accurate adjudication, combat management, and persistent campaign state. The product enables D&D players without a human DM to create, run, and resume solo or multiplayer sessions.

### Primary Users

- D&D players who do not have a human DM available

### Core Value Proposition

Players can immediately start playing D&D with an AI that:
- Tells compelling stories while respecting official rules
- Manages combat, dice, and game state automatically
- Persists campaigns across sessions with intelligent recaps
- Supports both solo and multiplayer experiences

## User Scenarios & Testing

### User Story 1 - Solo Campaign with AI DM (Priority: P1)

A player creates a new campaign, starts a session, and has a natural conversation with the AI Dungeon Master. The player describes actions in plain language, and the AI responds with narrative storytelling and mechanics resolution.

**Why this priority**: This is the core product loop. Without a functional AI DM conversation, there is no product. A single player must be able to play D&D with the AI before any other feature matters.

**Independent Test**: Can be fully tested by one user creating a campaign, starting a session, and having a multi-turn conversation with the AI DM. Delivers the complete "play D&D without a human DM" value.

**Acceptance Scenarios**:

1. **Given** a logged-in user with no campaigns, **When** they create a new campaign with default settings and start a session, **Then** the AI introduces the campaign setting and prompts for player action.

2. **Given** an active session, **When** the player types a free-form action like "I walk into the tavern and look around", **Then** the AI responds with narrative description and any relevant mechanics (perception checks, NPC introductions).

3. **Given** an active session, **When** the player's action requires a dice roll, **Then** the system rolls dice using the configured dice mode, logs the roll, and the AI incorporates the result into the narrative.

4. **Given** an active session, **When** the AI needs to apply a game rule, **Then** the AI references the in-app rulebook and cites the relevant rule in its response.

5. **Given** an ambiguous rules situation, **When** the AI cannot determine the correct ruling from the dataset, **Then** the AI asks for clarification or presents constrained options with rule references.

---

### User Story 2 - Combat Encounter (Priority: P2)

A player engages in combat with enemies. The system manages initiative, turn order, hit points, conditions, and integrates with the dice system for attack rolls, damage, and saving throws.

**Why this priority**: Combat is a core D&D experience. Once basic conversation works, combat encounters demonstrate the full value of the AI DM managing complex game mechanics.

**Independent Test**: Can be tested by triggering a combat encounter and completing it through victory or retreat. Validates dice integration, turn management, and state tracking.

**Acceptance Scenarios**:

1. **Given** a narrative situation leading to combat, **When** the AI determines combat begins, **Then** the system initiates initiative rolls for all participants and displays turn order.

2. **Given** active combat, **When** it is the player's turn, **Then** the player can describe their action and the system resolves it with appropriate dice rolls.

3. **Given** active combat with 2D grid map mode enabled, **When** tokens need to move, **Then** the map displays current positions and allows token movement.

4. **Given** active combat, **When** a combatant takes damage, **Then** their HP is updated in the combat tracker and persisted to session state.

5. **Given** active combat, **When** all enemies are defeated or combat ends, **Then** the AI narrates the outcome and the system exits combat mode.

---

### User Story 3 - Session Save and Resume with Recap (Priority: P2)

A player saves their session, leaves the application, and returns later to resume. The AI generates a recap from the event log so the player remembers where they left off.

**Why this priority**: Persistence is essential for meaningful campaigns. D&D sessions span hours and days; without save/resume, the product cannot support real campaigns.

**Independent Test**: Can be tested by playing a session, saving it, closing the browser, returning, and resuming with a coherent recap. Validates state persistence and recap generation.

**Acceptance Scenarios**:

1. **Given** an active session with gameplay history, **When** the player clicks save, **Then** the complete session state is persisted (narrative context, mechanical state, combat state if active, map state).

2. **Given** a saved session, **When** the player selects "Resume" from their campaign, **Then** the system loads the session state and prompts for confirmation.

3. **Given** a resumed session pending confirmation, **When** the player confirms, **Then** the AI generates a narrative recap summarizing recent events from the event log.

4. **Given** a resumed session after recap, **When** the player submits their first action, **Then** gameplay continues seamlessly from the saved state.

---

### User Story 4 - Multiplayer Campaign (Priority: P3)

A campaign owner invites other players to join their campaign. Multiple players can participate in sessions together with their own characters.

**Why this priority**: Multiplayer is the full D&D experience, but solo play delivers value first. This extends the product to groups once core functionality is proven.

**Independent Test**: Can be tested by one user inviting another, both joining a session, and both taking turns with the AI DM. Validates invitation flow and multi-player state handling.

**Acceptance Scenarios**:

1. **Given** a campaign owner, **When** they invite a player by email, **Then** the invited player receives a notification and can accept to join the campaign.

2. **Given** a multiplayer campaign, **When** multiple players are in a session, **Then** the AI addresses players by their character names and manages turn-taking fairly.

3. **Given** a multiplayer session, **When** two players submit actions simultaneously, **Then** the system handles the conflict gracefully using versioned state updates.

4. **Given** a multiplayer campaign, **When** a player joins mid-session, **Then** they see the current state and can participate immediately.

---

### User Story 5 - Campaign and Character Management (Priority: P3)

A player creates, edits, and manages their campaigns and characters through dedicated management screens.

**Why this priority**: Management features support the core loop but aren't the core experience. Basic CRUD is needed but doesn't deliver value without the AI DM.

**Independent Test**: Can be tested by creating a campaign, configuring settings, creating a character, and verifying all data persists correctly. Validates data model and CRUD operations.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they create a new campaign, **Then** they can set a name, description, and configure dice mode and map mode.

2. **Given** a campaign, **When** the owner edits settings, **Then** changes apply to future sessions (existing sessions retain their settings).

3. **Given** a campaign, **When** a player creates a character, **Then** the character is associated with that campaign and available for sessions.

4. **Given** a character, **When** the player edits character details, **Then** changes are persisted and reflected in future sessions.

---

### User Story 6 - Account Creation and Authentication (Priority: P4)

A new user creates an account and logs in to access the application. Returning users can log in with their credentials.

**Why this priority**: Authentication is foundational infrastructure. It must exist but delivers no user value on its own.

**Independent Test**: Can be tested by registering a new account, logging out, and logging back in. Validates auth flow and session management.

**Acceptance Scenarios**:

1. **Given** a new visitor, **When** they sign up with email and password, **Then** an account is created and they are logged in.

2. **Given** a new visitor, **When** they sign up with Google OAuth, **Then** an account is created linked to their Google identity.

3. **Given** a registered user, **When** they log in with valid credentials, **Then** they access their dashboard with their campaigns.

4. **Given** a logged-in user, **When** they log out, **Then** their session ends and they cannot access protected pages.

---

### Edge Cases

- What happens when the AI cannot find a rule in the dataset? The AI MUST ask for clarification or present constrained options; it MUST NOT invent rules.
- What happens when a player submits an action during another player's turn in combat? The system queues the action or prompts them to wait for their turn.
- What happens when session state becomes corrupted? The system provides a fallback to the last known good state with a warning.
- What happens when a player loses connection mid-session? Their session state is preserved; they can resume when reconnected.
- What happens when dice mode is changed mid-session? The change applies from the next roll forward; existing rolls are not affected.

## Requirements

### Functional Requirements

**Authentication & Accounts**
- **FR-001**: System MUST allow users to create accounts with email/password.
- **FR-002**: System MUST allow users to authenticate via Google OAuth.
- **FR-003**: System MUST maintain user sessions securely across browser sessions.

**Campaign Management**
- **FR-004**: System MUST allow users to create, read, update, and delete campaigns.
- **FR-005**: Each campaign MUST have configurable settings for dice mode (built-in RNG or player-entered) and map mode (2D grid or narrative-only).
- **FR-006**: Campaign defaults MUST allow immediate play with no configuration required.

**Character Management**
- **FR-007**: System MUST allow users to create, read, update, and delete characters within campaigns.
- **FR-008**: Characters MUST be associated with exactly one campaign.

**Session Management**
- **FR-009**: System MUST allow users to create, save, and resume sessions within campaigns.
- **FR-010**: Session state MUST include narrative context, mechanical state, combat state (if active), and map state (if enabled).
- **FR-011**: Resume flow MUST include player confirmation and AI-generated recap from event log.

**Core DM Loop**
- **FR-012**: Players MUST be able to submit actions as free-form natural language text.
- **FR-013**: System MUST record all player actions as structured events in a timeline log.
- **FR-014**: AI MUST respond with narrative output, mechanics resolution, structured state update proposals, and rule citations.
- **FR-015**: AI responses MUST stream to maintain conversational flow.
- **FR-016**: AI MUST clearly separate narrative storytelling from mechanics resolution in responses.

**Rules Grounding**
- **FR-017**: AI MUST NOT invent rules or mechanics; all rulings MUST reference the in-app rulebook dataset.
- **FR-018**: When rules are unclear or missing from the dataset, AI MUST ask for clarification or present constrained options with references.
- **FR-019**: All AI state change proposals MUST be validated by the server before persisting.

**Dice System**
- **FR-020**: Built-in RNG MUST support standard D&D dice (d4, d6, d8, d10, d12, d20, d100).
- **FR-021**: Every dice roll MUST be logged with timestamp, roller identity, reason, and result.
- **FR-022**: Player-entered mode MUST validate roll format and log all entered values.
- **FR-023**: AI MUST NOT roll dice implicitly; all randomness MUST go through the dice system.

**Maps & Positioning**
- **FR-024**: 2D grid canvas MUST display a square grid with token placement and movement.
- **FR-025**: Narrative-only mode MUST track locations and relative positioning in session state without visual canvas.
- **FR-026**: Map state MUST be part of canonical session state and persist across saves.

**Combat Management**
- **FR-027**: System MUST manage initiative rolls and turn order.
- **FR-028**: System MUST track hit points, conditions, spells, and active effects for all combatants.
- **FR-029**: Combat MUST integrate with the configured dice mode and map mode.

**Multiplayer**
- **FR-030**: Campaign owners MUST be able to invite players to campaigns.
- **FR-031**: Multiple players MUST be able to participate in the same session.
- **FR-032**: System MUST handle concurrent player actions with versioned state updates.

**Visual Design**
- **FR-033**: Application MUST use a dark theme with high readability optimized for extended play sessions.
- **FR-034**: Chat interface MUST visually distinguish between player messages, AI narration, and system/mechanics messages.
- **FR-035**: Desktop layout MUST provide navigation, chat feed, and contextual panels (combat tracker, dice log, map) visible simultaneously.
- **FR-036**: Mobile layout MUST prioritize chat with side panels accessible via navigation.

### Key Entities

- **User**: A person with an account; owns campaigns, controls characters
- **Campaign**: A D&D campaign with settings (dice_mode, map_mode); contains characters and sessions; has one owner and zero or more invited players
- **Character**: A player character within a campaign; has name, class, level, stats, inventory, and other D&D attributes
- **Session**: A play session within a campaign; has state (narrative, mechanical, combat, map) and an event log
- **Event**: A timestamped entry in the session log; types include player_action, ai_response, dice_roll, state_change
- **RuleReference**: A citation linking AI responses to specific entries in the rulebook dataset

## Assumptions

- The D&D rulebook dataset is pre-loaded from the following source files:
  - `docs/rules.txt` - D&D Basic Rules (Version 1.0, November 2018)
  - `docs/handbook.txt` - Player's Handbook
- These files serve as the authoritative rule source the AI must reference for all mechanical rulings.
- Users have basic familiarity with D&D concepts (classes, dice, combat).
- Sessions are expected to last 1-4 hours; the system must handle saves at any point.
- A "campaign" may have one player (solo) or multiple players.
- Default dice mode is built-in RNG; default map mode is 2D grid canvas.
- The AI will use streaming responses for conversational flow.
- Character creation follows standard D&D 5e rules available in the dataset.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can create a campaign and start their first session within 3 minutes of signing up.
- **SC-002**: 90% of player actions receive an AI response within 5 seconds (streaming start).
- **SC-003**: Sessions can be saved and resumed with 100% state fidelity (no data loss).
- **SC-004**: AI correctly cites rulebook references for 95% of mechanics resolutions.
- **SC-005**: Users can complete a full combat encounter (3+ rounds) without manual intervention for turn/HP tracking.
- **SC-006**: System supports 100 concurrent active sessions without degradation.
- **SC-007**: Players rate the conversational experience as "natural" or better in 80% of feedback.
- **SC-008**: Multiplayer sessions with 4 players maintain state consistency with zero conflicts during normal play.

## Scope Boundaries

### In Scope (MVP)

- Email/password and Google OAuth authentication
- Campaign and character CRUD
- Solo and multiplayer campaigns
- Session create, save, resume with recap
- Conversational AI DM with streaming responses
- Dice rolling (built-in RNG and player-entered modes)
- 2D grid map and narrative-only map modes
- Combat management (initiative, turns, HP, conditions)
- Rules grounding with citations from in-app dataset
- Dark theme UI optimized for chat

### Out of Scope (MVP)

- Voice input/output
- Advanced VTT features (fog of war, lighting, animated tokens)
- 3D maps or advanced map editors
- Homebrew rules authoring UI
- Payment/subscription features (free only for MVP)
- Mobile native apps (web responsive only)
- Real-time voice/video chat between players
- Character sheet auto-generation from dataset
