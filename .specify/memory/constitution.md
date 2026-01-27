<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version change: 1.0.0 → 1.1.0
Modified principles:
  - I. Rules-Grounded DM: Added "only use in-app rulebook/handbook dataset"
  - II. Stateful Game Engine First: Added explicit randomness logging requirement
  - III. Multiplayer and Persistence → Moved to IV
  - IV. Transparent Gameplay → Moved to V
  - V. MVP Scope Discipline → REMOVED (content moved to MVP Defaults section)
Added sections:
  - III. Configurable Gameplay Systems (NEW principle)
  - MVP Defaults (replaces MVP Scope Discipline as a section, not principle)
Removed sections:
  - V. MVP Scope Discipline (as principle - content preserved in MVP Defaults)
Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ compatible (Constitution Check section exists)
  - .specify/templates/spec-template.md: ✅ compatible (requirements align with principles)
  - .specify/templates/tasks-template.md: ✅ compatible (logging/test tasks align)
Follow-up TODOs: None
================================================================================
-->

# AI Dungeon Master Constitution

## Core Principles

### I. Rules-Grounded DM

The AI Dungeon Master MUST NOT invent rules or game mechanics. All mechanical rulings MUST use only the in-app rulebook/handbook dataset.

- The AI MUST only reference rules content available within the application's dataset.
- If a rule is unknown or ambiguous given the available dataset, the AI MUST either ask for clarification OR present constrained options with explicit references to relevant rule sections.
- The AI MUST clearly separate rules/mechanics resolution from narrative flavor.
- Creative narrative is encouraged ONLY when it does not contradict or override established rules.

**Rationale**: Players trust the DM to adjudicate fairly using official rules. An AI that invents rules undermines game integrity and player agency. Rules-grounding ensures consistency and allows players to learn the actual game system.

### II. Stateful Game Engine First

The canonical truth of the game is structured session state stored in the database—not AI memory or conversation context.

- Game state includes: campaigns, sessions, characters, combat encounters, locations, inventory, quests, and active effects.
- The AI proposes state changes as structured commands; the server MUST validate and persist them.
- All randomness MUST be explicit, logged, and reproducible via roll logs.
- All game-relevant data MUST be recoverable from the database without requiring AI inference.

**Rationale**: AI context windows are limited and non-persistent. A structured game engine ensures data integrity, enables multiplayer synchronization, and allows sessions to resume reliably. Explicit randomness logging enables auditing and replay.

### III. Configurable Gameplay Systems

Dice handling and maps MUST be configurable per campaign via settings. Sensible defaults MUST exist to allow zero-configuration play.

- Campaign settings MUST allow customization of dice handling mode (built-in RNG, player-entered rolls, etc.).
- Campaign settings MUST allow customization of map display mode.
- Default settings MUST provide a complete playable experience without manual configuration.
- Configuration changes MUST NOT corrupt existing campaign state.

**Rationale**: Different play groups have different preferences. Configurability supports varied playstyles while sensible defaults reduce friction for new users. This enables both quick-start solo play and customized multiplayer sessions.

### IV. Multiplayer and Persistence

Campaigns and sessions MUST be resumable with automatic recap generation. The system MUST support both solo and multiplayer campaigns.

- Campaign state MUST persist across sessions with no data loss.
- Session resumption MUST include context recap so players and the AI can continue seamlessly.
- Player actions MUST be attributable to specific player identities within shared sessions.
- Solo campaigns MUST be first-class citizens with the same persistence guarantees.

**Rationale**: D&D is fundamentally a multi-session experience, whether solo or with a group. The product fails its core purpose if campaigns cannot persist or support the user's preferred play mode.

### V. Transparent Gameplay

Every AI-driven state change MUST be explainable and logged.

- State change logs MUST include: what changed, why, and which rule reference was used (when applicable).
- Players MUST be able to inspect rolls, combat order, active effects, and session recaps.
- The system MUST surface AI reasoning when players request explanation of rulings.

**Rationale**: Transparency builds trust. Players need visibility into DM decisions to learn, strategize, and verify fairness. Logging enables debugging, dispute resolution, and iterative improvement.

## MVP Defaults

The following defaults apply to new campaigns unless configured otherwise:

**Dice**
- Built-in RNG with public roll log (all rolls visible and auditable).

**Maps**
- Basic 2D grid canvas with token positioning.

These defaults can be changed in campaign settings per Principle III (Configurable Gameplay Systems).

## Engineering Quality Bars

These standards apply to all implementation work:

**Security**
- Campaign-level isolation MUST be enforced.
- Standard authentication best practices MUST be followed.
- One user's campaign data MUST NOT be accessible to another user without explicit sharing.

**Reliability**
- State updates MUST be versioned for conflict detection.
- The system MUST handle conflict resolution for concurrent player actions.
- Database transactions MUST maintain consistency.

**Testing**
- Deterministic tests MUST cover rules resolution logic and state transition functions.
- Integration tests MUST cover core user flows: campaign creation, session start, combat rounds, session resume.
- Test coverage expectations will be defined per feature in implementation plans.

**Observability**
- AI decisions MUST be logged with sufficient context for debugging.
- State changes MUST be logged with timestamps and actor attribution.
- Error conditions MUST produce actionable log entries.

## Out of Scope (MVP)

The following features are explicitly excluded from MVP unless added by later amendment:

- Voice input/output
- Advanced VTT features (fog of war, 3D maps, animated tokens)
- Homebrew rules authoring UI
- Custom rule content beyond included official materials

## Governance

This constitution supersedes all other development practices and guidelines for this project.

**Amendment Procedure**
1. Proposed amendments MUST be documented with rationale.
2. Amendments MUST be reviewed for impact on existing features and plans.
3. Version number MUST be updated according to semantic versioning:
   - MAJOR: Backward-incompatible principle changes or removals
   - MINOR: New principles or materially expanded guidance
   - PATCH: Clarifications, wording fixes, non-semantic refinements

**Compliance**
- All PRs and code reviews MUST verify compliance with these principles.
- Implementation plans MUST include a Constitution Check gate.
- Deviations from principles MUST be documented and justified in the Complexity Tracking section of implementation plans.

**Guidance**
- Use CLAUDE.md for runtime development guidance and coding conventions.
- Use this constitution for architectural and product-level decisions.

**Version**: 1.1.0 | **Ratified**: 2026-01-24 | **Last Amended**: 2026-01-27
