<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version change: (new) → 1.0.0
Modified principles: N/A (initial constitution)
Added sections:
  - I. Rules-Grounded DM
  - II. Stateful Game Engine First
  - III. Multiplayer and Persistence
  - IV. Transparent Gameplay
  - V. MVP Scope Discipline
  - Engineering Quality Bars
  - Out of Scope (MVP)
  - Governance
Removed sections: N/A (initial constitution)
Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ compatible (Constitution Check section exists)
  - .specify/templates/spec-template.md: ✅ compatible (requirements align with principles)
  - .specify/templates/tasks-template.md: ✅ compatible (test/logging tasks align with principles)
Follow-up TODOs: None
================================================================================
-->

# AI Dungeon Master Constitution

## Core Principles

### I. Rules-Grounded DM

The AI Dungeon Master MUST NOT invent rules or game mechanics. All mechanical rulings MUST reference official rules content available in the application.

- If a rule is unknown or ambiguous given available in-app rulebook content, the AI MUST either ask for clarification OR provide options with explicit references to relevant rule sections.
- The AI MUST clearly separate: (a) rules citations and mechanical logic from (b) narrative flavor and storytelling.
- Creative narrative is encouraged ONLY when it does not contradict or override established rules.

**Rationale**: Players trust the DM to adjudicate fairly. An AI that invents rules undermines game integrity and player agency. Rules-grounding ensures consistency and allows players to learn the actual game system.

### II. Stateful Game Engine First

The canonical truth of the game is structured session state stored in the database—not AI memory or conversation context.

- Game state includes: campaigns, sessions, characters, combat encounters, locations, inventory, quests, and active effects.
- The AI proposes state updates, but the system MUST validate and persist them as structured events and state transitions.
- All game-relevant data MUST be recoverable from the database without requiring AI inference.

**Rationale**: AI context windows are limited and non-persistent. A structured game engine ensures data integrity, enables multiplayer synchronization, and allows sessions to resume reliably across time and devices.

### III. Multiplayer and Persistence

Campaigns and sessions MUST be resumable with automatic recap generation. Multiple players MUST be able to join and participate in the same campaign.

- Campaign state MUST persist across sessions with no data loss.
- Session resumption MUST include context recap so players and the AI can continue seamlessly.
- Player actions MUST be attributable to specific player identities within shared sessions.

**Rationale**: D&D is fundamentally a social, multi-session experience. The product fails its core purpose if campaigns cannot persist or support multiple participants.

### IV. Transparent Gameplay

Every AI action that changes game state MUST be explainable and logged.

- State change logs MUST include: what changed, why, and which rule reference was used (when applicable).
- Players MUST be able to view recaps and key state: location, party status, combat order, active effects, and recent events.
- The system SHOULD surface AI reasoning when players request explanation of rulings.

**Rationale**: Transparency builds trust. Players need visibility into DM decisions to learn, strategize, and verify fairness. Logging enables debugging, dispute resolution, and iterative improvement.

### V. MVP Scope Discipline

The MVP MUST prioritize core functionality over feature breadth.

- Text-first interface: no voice chat in MVP.
- Dice rolling handled in-app: either player-entered rolls or built-in RNG with full logging.
- Maps are lightweight: simple grid/room nodes or generated text descriptions. No complex rendering unless explicitly required.
- Use only included official rule content—no homebrew rules authoring UI in MVP.

**Rationale**: Scope discipline prevents feature creep and ensures a shippable product. Text interfaces are simpler to build, test, and iterate on. Complex features can be added once the core loop is proven.

## Engineering Quality Bars

These standards apply to all implementation work:

**Security**
- Standard authentication best practices MUST be followed.
- Campaign state MUST NOT leak to unauthorized users.
- One user's campaign data MUST NOT be accessible to another user without explicit sharing.

**Reliability**
- State updates MUST be idempotent where applicable.
- The system MUST handle conflict resolution for simultaneous player actions.
- Database transactions MUST maintain consistency.

**Testing**
- Unit tests MUST cover rules resolution logic and state transition functions.
- Integration tests MUST cover core user flows: campaign creation, session start, combat rounds, session resume.
- Test coverage expectations will be defined per feature in implementation plans.

**Observability**
- AI decisions MUST be logged with sufficient context for debugging.
- State changes MUST be logged with timestamps and actor attribution.
- Error conditions MUST produce actionable log entries.

## Out of Scope (MVP)

The following features are explicitly excluded from MVP unless added by later amendment:

- Real-time voice chat
- Advanced map editors or 3D maps
- Full virtual tabletop (VTT) feature set
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

**Version**: 1.0.0 | **Ratified**: 2026-01-24 | **Last Amended**: 2026-01-27
