# Data Model: AI Dungeon Master MVP

**Feature**: 001-ai-dungeon-master
**Date**: 2026-01-28
**Database**: PostgreSQL via Supabase

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│    users    │───────│    campaigns    │───────│  sessions   │
│  (Supabase) │ 1   n │                 │ 1   n │             │
└─────────────┘       └─────────────────┘       └─────────────┘
                              │                        │
                              │ 1                      │ 1
                              │ n                      │ n
                      ┌───────┴───────┐         ┌──────┴──────┐
                      │               │         │             │
               ┌──────┴──────┐ ┌──────┴──────┐  │   events    │
               │ characters  │ │campaign_    │  │             │
               │             │ │players      │  └─────────────┘
               └─────────────┘ └─────────────┘
```

---

## Tables

### users (Supabase Auth)

Managed by Supabase Auth. We extend with a `profiles` table.

```sql
-- Supabase manages auth.users
-- We create a public profile for app-specific data

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, FK→auth.users | User's auth ID |
| display_name | TEXT | NOT NULL | Display name for UI |
| avatar_url | TEXT | NULLABLE | Profile image URL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

---

### campaigns

```sql
CREATE TYPE dice_mode AS ENUM ('rng', 'player_entered');
CREATE TYPE map_mode AS ENUM ('grid_2d', 'narrative_only');

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  dice_mode dice_mode NOT NULL DEFAULT 'rng',
  map_mode map_mode NOT NULL DEFAULT 'grid_2d',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_owner ON campaigns(owner_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Campaign ID |
| owner_id | UUID | NOT NULL, FK→auth.users | Campaign creator |
| name | TEXT | NOT NULL | Campaign name |
| description | TEXT | NULLABLE | Campaign description |
| dice_mode | ENUM | NOT NULL, DEFAULT 'rng' | 'rng' or 'player_entered' |
| map_mode | ENUM | NOT NULL, DEFAULT 'grid_2d' | 'grid_2d' or 'narrative_only' |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

---

### campaign_players

Junction table for multiplayer campaign membership.

```sql
CREATE TYPE player_role AS ENUM ('owner', 'player');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE campaign_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role player_role NOT NULL DEFAULT 'player',
  invite_status invite_status NOT NULL DEFAULT 'pending',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(campaign_id, user_id)
);

CREATE INDEX idx_campaign_players_campaign ON campaign_players(campaign_id);
CREATE INDEX idx_campaign_players_user ON campaign_players(user_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Membership ID |
| campaign_id | UUID | NOT NULL, FK→campaigns | Campaign reference |
| user_id | UUID | NOT NULL, FK→auth.users | Player reference |
| role | ENUM | NOT NULL, DEFAULT 'player' | 'owner' or 'player' |
| invite_status | ENUM | NOT NULL, DEFAULT 'pending' | Invite state |
| invited_at | TIMESTAMPTZ | DEFAULT NOW() | When invited |
| joined_at | TIMESTAMPTZ | NULLABLE | When accepted |

---

### characters

```sql
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  race TEXT NOT NULL,
  class TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 20),

  -- Core stats
  max_hp INTEGER NOT NULL,
  current_hp INTEGER NOT NULL,
  armor_class INTEGER NOT NULL,
  speed INTEGER NOT NULL DEFAULT 30,

  -- Ability scores
  strength INTEGER NOT NULL CHECK (strength >= 1 AND strength <= 30),
  dexterity INTEGER NOT NULL CHECK (dexterity >= 1 AND dexterity <= 30),
  constitution INTEGER NOT NULL CHECK (constitution >= 1 AND constitution <= 30),
  intelligence INTEGER NOT NULL CHECK (intelligence >= 1 AND intelligence <= 30),
  wisdom INTEGER NOT NULL CHECK (wisdom >= 1 AND wisdom <= 30),
  charisma INTEGER NOT NULL CHECK (charisma >= 1 AND charisma <= 30),

  -- Additional data (JSON for flexibility)
  skills JSONB DEFAULT '{}',
  proficiencies JSONB DEFAULT '[]',
  equipment JSONB DEFAULT '[]',
  spells JSONB DEFAULT '[]',
  features JSONB DEFAULT '[]',
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_characters_campaign ON characters(campaign_id);
CREATE INDEX idx_characters_user ON characters(user_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Character ID |
| campaign_id | UUID | NOT NULL, FK→campaigns | Parent campaign |
| user_id | UUID | NOT NULL, FK→auth.users | Player who owns character |
| name | TEXT | NOT NULL | Character name |
| race | TEXT | NOT NULL | D&D race |
| class | TEXT | NOT NULL | D&D class |
| level | INTEGER | 1-20 | Character level |
| max_hp | INTEGER | NOT NULL | Maximum hit points |
| current_hp | INTEGER | NOT NULL | Current hit points |
| armor_class | INTEGER | NOT NULL | AC |
| speed | INTEGER | DEFAULT 30 | Movement speed |
| strength-charisma | INTEGER | 1-30 | Ability scores |
| skills | JSONB | DEFAULT '{}' | Skill proficiencies and bonuses |
| proficiencies | JSONB | DEFAULT '[]' | Other proficiencies |
| equipment | JSONB | DEFAULT '[]' | Inventory items |
| spells | JSONB | DEFAULT '[]' | Known/prepared spells |
| features | JSONB | DEFAULT '[]' | Class/race features |
| notes | TEXT | NULLABLE | Player notes |

---

### sessions

```sql
CREATE TYPE session_status AS ENUM ('active', 'paused', 'ended');

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT,
  status session_status NOT NULL DEFAULT 'active',
  version INTEGER NOT NULL DEFAULT 1,  -- For optimistic locking

  -- Narrative state
  narrative_summary TEXT,
  current_location TEXT,
  active_npcs JSONB DEFAULT '[]',

  -- Combat state (null if not in combat)
  combat_state JSONB,

  -- Map state (null if narrative_only mode)
  map_state JSONB,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_campaign ON sessions(campaign_id);
CREATE INDEX idx_sessions_status ON sessions(status);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Session ID |
| campaign_id | UUID | NOT NULL, FK→campaigns | Parent campaign |
| name | TEXT | NULLABLE | Optional session name |
| status | ENUM | NOT NULL, DEFAULT 'active' | Session state |
| version | INTEGER | NOT NULL, DEFAULT 1 | Optimistic lock version |
| narrative_summary | TEXT | NULLABLE | AI-maintained summary |
| current_location | TEXT | NULLABLE | Current party location |
| active_npcs | JSONB | DEFAULT '[]' | NPCs in current scene |
| combat_state | JSONB | NULLABLE | Combat tracker data |
| map_state | JSONB | NULLABLE | Grid and token positions |
| started_at | TIMESTAMPTZ | DEFAULT NOW() | Session start |
| ended_at | TIMESTAMPTZ | NULLABLE | Session end |
| last_activity | TIMESTAMPTZ | DEFAULT NOW() | Last action time |

**combat_state JSON structure:**
```json
{
  "active": true,
  "round": 2,
  "turn_index": 1,
  "initiative_order": [
    {"id": "char-uuid", "type": "player", "name": "Aragorn", "initiative": 18},
    {"id": "monster-goblin-1", "type": "monster", "name": "Goblin", "initiative": 15}
  ],
  "combatants": [
    {
      "id": "char-uuid",
      "type": "player",
      "current_hp": 25,
      "max_hp": 30,
      "conditions": ["poisoned"],
      "effects": []
    }
  ]
}
```

**map_state JSON structure:**
```json
{
  "grid_width": 20,
  "grid_height": 15,
  "tokens": [
    {"id": "char-uuid", "type": "player", "x": 5, "y": 7, "label": "A"},
    {"id": "monster-goblin-1", "type": "monster", "x": 8, "y": 7, "label": "G1"}
  ],
  "terrain": [
    {"x": 6, "y": 6, "type": "wall"},
    {"x": 6, "y": 7, "type": "wall"}
  ]
}
```

---

### events

Immutable event log for all session actions.

```sql
CREATE TYPE event_type AS ENUM (
  'session_start',
  'session_end',
  'player_action',
  'ai_response',
  'dice_roll',
  'state_change',
  'combat_start',
  'combat_end',
  'turn_start',
  'turn_end'
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type event_type NOT NULL,
  actor_id UUID REFERENCES auth.users(id),  -- null for system/AI events
  actor_name TEXT,  -- "Aragorn", "DM", "System"

  -- Event payload
  content JSONB NOT NULL,

  -- Rule citations (for AI responses with mechanics)
  rule_citations JSONB DEFAULT '[]',

  -- Timestamp (sequential ordering)
  sequence INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_session_sequence ON events(session_id, sequence);
CREATE INDEX idx_events_type ON events(type);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Event ID |
| session_id | UUID | NOT NULL, FK→sessions | Parent session |
| type | ENUM | NOT NULL | Event type |
| actor_id | UUID | FK→auth.users | User who triggered (null for system) |
| actor_name | TEXT | NULLABLE | Display name for actor |
| content | JSONB | NOT NULL | Event payload |
| rule_citations | JSONB | DEFAULT '[]' | Referenced rule IDs |
| sequence | INTEGER | NOT NULL | Ordering within session |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Event timestamp |

**Event content examples:**

```json
// player_action
{
  "text": "I attack the goblin with my sword",
  "character_id": "char-uuid"
}

// ai_response
{
  "narrative": "You swing your longsword in a wide arc...",
  "mechanics": "Attack roll: 18 + 5 = 23 (hits). Damage: 8 slashing.",
  "state_changes": [
    {"type": "damage", "target": "monster-goblin-1", "amount": 8}
  ]
}

// dice_roll
{
  "dice": "1d20+5",
  "reason": "Attack roll (longsword)",
  "individual_rolls": [18],
  "modifier": 5,
  "total": 23,
  "mode": "rng"
}
```

---

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read any profile, update only their own
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Campaigns: visible to owner and accepted players
CREATE POLICY "Campaigns visible to participants"
  ON campaigns FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (SELECT campaign_id FROM campaign_players
           WHERE user_id = auth.uid() AND invite_status = 'accepted')
  );

CREATE POLICY "Campaigns editable by owner"
  ON campaigns FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Campaigns deletable by owner"
  ON campaigns FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Users can create campaigns"
  ON campaigns FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Campaign players: visible to campaign participants
CREATE POLICY "Campaign players visible to participants"
  ON campaign_players FOR SELECT USING (
    campaign_id IN (SELECT id FROM campaigns WHERE owner_id = auth.uid()) OR
    user_id = auth.uid()
  );

-- Characters: visible to campaign participants
CREATE POLICY "Characters visible to campaign participants"
  ON characters FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE owner_id = auth.uid()
      UNION
      SELECT campaign_id FROM campaign_players
      WHERE user_id = auth.uid() AND invite_status = 'accepted'
    )
  );

CREATE POLICY "Characters editable by owner"
  ON characters FOR UPDATE USING (user_id = auth.uid());

-- Sessions and events follow campaign access patterns
-- (Similar policies for sessions and events)
```

---

## Indexes Summary

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| campaigns | idx_campaigns_owner | owner_id | Find user's campaigns |
| campaign_players | idx_campaign_players_campaign | campaign_id | Find campaign members |
| campaign_players | idx_campaign_players_user | user_id | Find user's memberships |
| characters | idx_characters_campaign | campaign_id | Find campaign characters |
| characters | idx_characters_user | user_id | Find user's characters |
| sessions | idx_sessions_campaign | campaign_id | Find campaign sessions |
| sessions | idx_sessions_status | status | Find active sessions |
| events | idx_events_session | session_id | Find session events |
| events | idx_events_session_sequence | session_id, sequence | Ordered event retrieval |
| events | idx_events_type | type | Filter by event type |

---

## Migration Strategy

1. **Initial setup**: Run Supabase migrations in order
2. **Seed data**: Load sample campaign data
3. **Rules parsing**: Verify `docs/rules.txt` and `docs/handbook.txt` are parsed correctly at backend startup
4. **RLS verification**: Test all policies with different user contexts
5. **Index verification**: Analyze query plans for common access patterns
