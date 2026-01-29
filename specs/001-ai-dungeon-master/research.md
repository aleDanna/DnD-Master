# Research: AI Dungeon Master MVP

**Feature**: 001-ai-dungeon-master
**Date**: 2026-01-28
**Status**: Complete

## Overview

This document captures technical research and decisions made during the planning phase for the AI Dungeon Master MVP.

---

## 1. AI Architecture: Streaming Responses with State Validation

### Decision
Use a two-step AI flow where the configurable LLM (OpenAI, Gemini, or Claude) generates structured output (narrative + state changes), then the server validates before persisting.

### Rationale
- **Constitution Compliance**: Principle II requires server validation of all state changes; AI cannot directly modify the database
- **Rules Grounding**: Principle I requires AI to cite rulebook dataset IDs; server must validate citations exist
- **Streaming UX**: Users expect conversational flow; streaming must work alongside validation

### Implementation Approach
```
1. Player submits action → Backend receives
2. Backend constructs prompt with:
   - Current session state
   - Campaign settings (dice_mode, map_mode)
   - Relevant rulebook context
   - Player action
3. LLM streams response with structured JSON blocks:
   - Narrative text (streamed immediately to client)
   - State change proposals (parsed and validated)
   - Rule citations (validated against dataset)
4. Server validates state changes:
   - Check rule citations exist in dataset
   - Validate dice rolls went through dice service
   - Verify state transition is legal
5. If valid: Persist changes, send confirmation
   If invalid: Log error, send warning to player, rollback narrative if needed
```

### Alternatives Considered
- **Direct database access by AI**: Rejected (violates constitution)
- **Client-side validation**: Rejected (cannot trust client for game state)
- **Post-hoc validation only**: Rejected (could show invalid narrative before rollback)

---

## 2. Rulebook Dataset Format

### Decision
Use the pre-existing D&D rulebook text files in the `docs/` folder as the authoritative source, parsed at startup into a searchable in-memory structure.

### Source Files
- **`docs/rules.txt`** - D&D Basic Rules (Version 1.0, November 2018) - ~25,000 lines
- **`docs/handbook.txt`** - Player's Handbook - ~47,000 lines

### Rationale
- **Constitution Compliance**: Principle I requires AI use only the in-app dataset
- **Authoritative Source**: Official D&D content already available in repository
- **Citation Support**: Section headers and page references enable rule citations
- **Version Control**: Rules changes are tracked in git
- **Performance**: Parsed at startup; in-memory search for rule lookups

### Implementation Approach
```typescript
// backend/src/rules/parser.ts
interface RuleSection {
  id: string;           // Generated: "rules-ch9-combat" or "phb-ch5-equipment"
  source: 'rules' | 'handbook';
  chapter: string;      // "Ch. 9: Combat"
  section: string;      // "Making an Attack"
  page?: string;        // "PHB p.194" if extractable
  content: string;      // Full text of the section
  keywords: string[];   // Extracted for search
}

// Parser extracts sections based on heading patterns:
// - "Ch. X: Title" marks chapter boundaries
// - ALL CAPS lines often indicate section headers
// - Indentation patterns indicate subsections

class RulesService {
  private sections: Map<string, RuleSection>;

  constructor() {
    this.sections = new Map();
    this.loadAndParse('docs/rules.txt', 'rules');
    this.loadAndParse('docs/handbook.txt', 'handbook');
  }

  search(query: string): RuleSection[] {
    // Full-text search across sections
  }

  getSection(id: string): RuleSection | null {
    return this.sections.get(id);
  }

  getCitation(id: string): string {
    // Returns formatted citation: "Basic Rules, Ch. 9: Combat - Making an Attack"
  }
}
```

### Alternatives Considered
- **Structured JSON**: Rejected (would require manual conversion; text files are authoritative)
- **Database storage**: Rejected (adds latency, complexity; rules rarely change)
- **External API**: Rejected (violates "in-app dataset" requirement)

---

## 3. Dice System Implementation

### Decision
Implement a centralized dice service with seeded RNG for testing and comprehensive logging.

### Rationale
- **Constitution Compliance**: Principle II requires all randomness be explicit and logged
- **Deterministic Testing**: Seeded RNG enables reproducible test scenarios
- **Audit Trail**: Every roll must be traceable for player trust

### Implementation
```typescript
interface DiceRoll {
  id: string;
  timestamp: Date;
  session_id: string;
  roller_id: string;        // user or "system"
  roller_name: string;      // character name or "DM"
  reason: string;           // "Attack roll", "Saving throw", etc.
  dice: string;             // "1d20+5", "2d6", etc.
  individual_rolls: number[]; // [14], [3, 5]
  modifier: number;
  total: number;
  mode: 'rng' | 'player_entered';
}

class DiceService {
  constructor(private rng: RandomNumberGenerator) {}

  roll(dice: string, context: RollContext): DiceRoll {
    // Parse dice notation
    // Generate rolls using RNG
    // Log to event store
    // Return result
  }

  enterRoll(value: number, context: RollContext): DiceRoll {
    // Validate format
    // Log as player_entered
    // Return result
  }
}
```

### Alternatives Considered
- **Client-side rolling**: Rejected (cannot trust client, violates server-first principle)
- **Third-party dice service**: Rejected (adds external dependency, latency)

---

## 4. Session State Management

### Decision
Store session state as a combination of:
- Structured database tables (campaign, characters, combat state)
- Event log (immutable timeline of all actions)
- Derived state (computed from events for recap generation)

### Rationale
- **Constitution Compliance**: Principle IV requires 100% state fidelity on resume
- **Recap Generation**: Event log enables AI to generate accurate recaps
- **Conflict Resolution**: Versioned updates enable multiplayer concurrency

### State Structure
```typescript
interface SessionState {
  id: string;
  campaign_id: string;
  version: number;          // For optimistic locking
  status: 'active' | 'paused' | 'ended';

  // Narrative context (for AI)
  narrative_summary: string;
  current_location: string;
  active_npcs: string[];

  // Mechanical state
  party_characters: CharacterState[];
  party_inventory: InventoryState;

  // Combat state (null if not in combat)
  combat: CombatState | null;

  // Map state (null if narrative-only mode)
  map: MapState | null;

  // Timestamps
  created_at: Date;
  updated_at: Date;
  last_activity: Date;
}
```

### Alternatives Considered
- **AI context as state**: Rejected (violates Principle II - AI memory is not persistent)
- **Single JSON blob**: Rejected (harder to query, validate, and version)

---

## 5. Real-time Multiplayer Architecture

### Decision
Use Supabase Realtime for session synchronization with optimistic locking for conflict resolution.

### Rationale
- **Supabase Integration**: Already using Supabase for auth/database; Realtime is built-in
- **Conflict Handling**: Version numbers on state enable detection and resolution
- **Simplicity**: No additional infrastructure needed for MVP

### Implementation
```typescript
// Client subscribes to session changes
const channel = supabase
  .channel(`session:${sessionId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'events',
    filter: `session_id=eq.${sessionId}`
  }, handleEvent)
  .subscribe();

// Server uses optimistic locking
async function updateSessionState(sessionId: string, changes: StateChanges) {
  const { data, error } = await supabase
    .from('sessions')
    .update({ ...changes, version: changes.version + 1 })
    .eq('id', sessionId)
    .eq('version', changes.version);  // Fails if version changed

  if (error?.code === 'PGRST116') {
    // Conflict - reload and retry
    throw new ConflictError('Session was modified by another player');
  }
}
```

### Alternatives Considered
- **WebSocket server**: Rejected (additional infrastructure; Supabase Realtime sufficient)
- **Polling**: Rejected (poor UX, higher load)
- **Last-write-wins**: Rejected (could lose player actions)

---

## 6. Combat Tracker Implementation

### Decision
Implement combat as a state machine with explicit phases and turn management.

### Rationale
- **D&D Rules**: Combat has well-defined structure (initiative, turns, rounds)
- **State Clarity**: Players and AI need clear understanding of current state
- **Dice Integration**: Combat heavily uses dice system; must be tightly integrated

### Combat State Machine
```
EXPLORATION → COMBAT_START → INITIATIVE_ROLL → COMBAT_ACTIVE → COMBAT_END → EXPLORATION
                                                    ↓
                                              TURN_START
                                                    ↓
                                              ACTION_PHASE
                                                    ↓
                                              TURN_END
                                                    ↓
                                              (next turn or round)
```

### Alternatives Considered
- **Free-form combat**: Rejected (too unstructured for rules compliance)
- **Fully AI-managed**: Rejected (violates state-engine-first principle)

---

## 7. Map Canvas Technology

### Decision
Use HTML Canvas with a lightweight 2D library (e.g., Konva.js or raw Canvas API) for the grid map.

### Rationale
- **MVP Simplicity**: Basic grid with tokens doesn't need Three.js or heavy frameworks
- **Performance**: Canvas handles hundreds of objects efficiently
- **Mobile Support**: Canvas works well on touch devices

### Features (MVP)
- Square grid (configurable size)
- Token placement (drag and drop)
- Token types: player, NPC, monster, object
- Grid coordinates for positioning
- No fog of war, lighting, or animation (out of scope)

### Alternatives Considered
- **SVG**: Rejected (performance issues with many objects)
- **Three.js/WebGL**: Rejected (overkill for 2D grid)
- **CSS Grid**: Rejected (harder to implement drag-and-drop)

---

## 8. Authentication Flow

### Decision
Use Supabase Auth with email/password and Google OAuth.

### Rationale
- **Supabase Integration**: Auth is built into Supabase; no additional service needed
- **MVP Simplicity**: Covers the two most common auth methods
- **Session Management**: Supabase handles JWT tokens and refresh automatically

### Implementation
```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password'
});

// Google OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// RLS policies enforce campaign isolation
// CREATE POLICY "Users can only see their campaigns"
// ON campaigns FOR SELECT
// USING (owner_id = auth.uid() OR id IN (
//   SELECT campaign_id FROM campaign_players WHERE user_id = auth.uid()
// ));
```

### Alternatives Considered
- **Custom JWT**: Rejected (reinventing the wheel)
- **Auth0**: Rejected (additional service; Supabase sufficient)

---

## Summary of Key Decisions

| Area | Decision | Key Rationale |
|------|----------|---------------|
| AI Flow | Two-step with validation | Constitution requires server validation |
| Rules Data | `docs/*.txt` parsed at startup | In-app dataset with section-based citations |
| Dice System | Centralized service | Logging, determinism, trust |
| State Management | Tables + Event log | Persistence, replay, recap |
| Multiplayer | Supabase Realtime | Built-in, versioned updates |
| Combat | State machine | Rules compliance, clarity |
| Maps | HTML Canvas | Simple, performant for MVP |
| Auth | Supabase Auth | Integrated, handles OAuth |

All decisions comply with the project constitution (v1.1.0).
