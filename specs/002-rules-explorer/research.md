# Research: Rules & Handbook

**Feature**: 002-rules-explorer | **Date**: 2026-01-29 (Updated)

## Executive Summary

Research completed for implementing the Rules & Handbook feature. The database schema already exists (`/migrations/001-dnd-content.sql`) with 14+ content tables and pgvector support. This research focuses on the frontend browsing experience, search implementation, and AI DM integration.

---

## Research Topics

### 1. Smart Search Intent Inference

**Question**: How should the system infer user intent from natural language search queries?

**Decision**: Hybrid approach combining semantic search with query classification

**Rationale**:
- Vector embeddings capture semantic meaning for natural language queries
- Query classification can route specific patterns to targeted searches
- Combining both provides best coverage for diverse query types

**Implementation Approach**:
1. **Query Analysis Phase**:
   - Check for explicit type indicators (e.g., "spell", "monster", "class")
   - Extract numeric values (spell levels, CR ranges, etc.)
   - Identify attribute keywords (school, rarity, size, etc.)

2. **Search Execution Phase**:
   - If type is identified: search that table with semantic similarity
   - If no type: search all tables in parallel, rank by relevance
   - Combine results using Reciprocal Rank Fusion (RRF)

3. **Result Grouping**:
   - Group results by content type
   - Order groups by relevance to query intent
   - Show most relevant group first

**Query Classification Patterns**:
```typescript
const typeIndicators = {
  spells: ['spell', 'cantrip', 'cast', 'magic'],
  monsters: ['monster', 'creature', 'beast', 'enemy', 'CR', 'challenge rating'],
  classes: ['class', 'fighter', 'wizard', 'rogue', ...],
  items: ['weapon', 'armor', 'item', 'equipment', 'magic item'],
  rules: ['rule', 'how do', 'what happens', 'can I'],
};
```

---

### 2. Vector Embedding Search Strategy

**Question**: How should semantic search queries against pgvector be structured?

**Decision**: Cosine similarity with IVFFlat index, separate queries per table

**Rationale**:
- Each table has its own embedding column
- Cosine similarity matches well with OpenAI embeddings
- IVFFlat provides good speed/accuracy tradeoff
- Parallel queries allow independent optimization per content type

**Implementation Details**:
- Use existing `VECTOR(1536)` columns in all content tables
- Query pattern: `ORDER BY embedding <=> $1 LIMIT 20`
- Indexes already created: `CREATE INDEX ... USING ivfflat (embedding vector_cosine_ops)`

**Query Pattern**:
```sql
-- Semantic search for spells
SELECT id, name, slug, level, school, description,
       1 - (embedding <=> $1) as similarity
FROM spells
WHERE embedding IS NOT NULL
ORDER BY embedding <=> $1
LIMIT 20;
```

---

### 3. Full-Text Search Implementation

**Question**: How should full-text search complement semantic search?

**Decision**: PostgreSQL tsvector with GIN indexes (already configured)

**Rationale**:
- Indexes already exist in the schema for all content tables
- Provides exact keyword matching when semantics fail
- Can be combined with semantic results via RRF

**Existing Indexes** (from schema):
```sql
CREATE INDEX idx_spells_description_fts ON spells USING GIN (to_tsvector('english', description));
CREATE INDEX idx_spells_name_fts ON spells USING GIN (to_tsvector('english', name));
CREATE INDEX idx_monsters_description_fts ON monsters USING GIN (...);
-- ... similar for all content tables
```

**Query Pattern**:
```sql
-- Full-text search for spells
SELECT id, name, slug, level, school,
       ts_rank(to_tsvector('english', name || ' ' || description), query) as rank
FROM spells, plainto_tsquery('english', $1) query
WHERE to_tsvector('english', name || ' ' || description) @@ query
ORDER BY rank DESC
LIMIT 20;
```

---

### 4. Hybrid Search Result Merging

**Question**: How should full-text and semantic search results be combined?

**Decision**: Reciprocal Rank Fusion (RRF) with k=60

**Rationale**:
- Simple, proven effective for combining rankings
- No tuning parameters needed
- Works across different content types

**Implementation**:
```typescript
function fusionScore(ranks: number[]): number {
  const k = 60;
  return ranks.reduce((sum, rank) => sum + 1 / (k + rank), 0);
}

// For each result appearing in any ranking:
// 1. Collect its rank from each search method
// 2. Compute RRF score
// 3. Sort by RRF score descending
```

---

### 5. Tab Navigation State Management

**Question**: How should tab state be managed across navigation?

**Decision**: URL-based state with Next.js App Router

**Rationale**:
- Enables shareable links to specific tabs
- Browser back/forward works naturally
- Server-side rendering possible for SEO

**Implementation**:
- Route structure: `/handbook/[category]` (rules, characters, spells, bestiary, equipment)
- Default redirect: `/handbook` → `/handbook/rules`
- Tab state derived from URL segment
- Filters as query parameters: `/handbook/spells?level=3&school=evocation`

---

### 6. Content Card Summary Attributes

**Question**: Which attributes should be shown on summary cards for each entity type?

**Decision**: Type-specific attribute selection (3-5 key attributes)

**Summary Card Attributes by Type**:

| Entity Type | Attributes | Rationale |
|-------------|------------|-----------|
| **Spells** | Level, School, Casting Time, Concentration | Most common filtering/identification criteria |
| **Monsters** | CR, Size, Type, AC, HP | Essential for encounter building |
| **Items** | Type, Rarity, Attunement | Key shopping/loot decisions |
| **Classes** | Hit Die, Primary Ability, Saving Throws | Core class identity |
| **Races** | Size, Speed, Ability Bonuses | Character creation essentials |
| **Rules** | Category, Summary (truncated) | Quick identification |
| **Feats** | Prerequisites | Availability check |
| **Backgrounds** | Skills, Tools | Proficiency overview |

---

### 7. Filter Implementation Patterns

**Question**: How should category-specific filters be implemented?

**Decision**: Filter state in URL query params, server-side filtering

**Rationale**:
- URL state enables sharing filtered views
- Server-side filtering reduces data transfer
- Database indexes support efficient filtering

**Filter Definitions by Tab**:

| Tab | Filters | Database Column |
|-----|---------|-----------------|
| Spells | Level (0-9), School, Class, Concentration, Ritual | level, school, class_spells.class_id, concentration, ritual |
| Bestiary | CR range, Size, Type | challenge_rating, size, monster_type |
| Equipment | Type, Rarity | item_type, rarity |
| Characters | (Classes) Primary Ability | primary_ability |

---

### 8. AI DM Citation Integration

**Question**: How should the handbook integrate with AI DM responses?

**Decision**: Citation API endpoint for AI context retrieval + citation links in responses

**Rationale**:
- AI DM needs to query content during response generation
- Citations provide transparency and learning
- Popover display keeps user in session context

**Integration Points**:
1. **AI Context API**: `GET /api/handbook/context?query={query}`
   - Returns relevant content for AI prompt injection
   - Limited to top 3-5 most relevant items
   - Includes structured data for citation

2. **Citation Format in Responses**:
```typescript
interface Citation {
  type: 'rule' | 'spell' | 'monster' | 'item' | 'class' | 'race' | 'feat';
  id: string;
  slug: string;
  name: string;
  excerpt: string;  // Brief relevant quote
}
```

3. **Frontend Citation Rendering**:
   - Inline links: `[Fireball](/handbook/spells/fireball)`
   - Popover on hover/click showing full details
   - "Open in Handbook" action to navigate

---

## Dependencies Identified

| Dependency | Status | Purpose |
|------------|--------|---------|
| PostgreSQL + pgvector | ✅ Exists | Vector similarity search |
| OpenAI SDK | ✅ Exists | Embedding generation (for search queries) |
| Next.js 14 | ✅ Exists | Frontend framework |
| Tailwind CSS | ✅ Exists | Styling |

**No new dependencies required** - all functionality can be built with existing stack.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Empty embeddings in DB | Medium | High | Graceful degradation to full-text only; admin notification |
| Search performance at scale | Low | Medium | Database connection pooling; result caching |
| Intent inference errors | Medium | Low | Show all result types; let user switch tabs |
| Complex monster stat blocks | Medium | Low | Responsive design; collapsible sections |

---

## Conclusions

All research questions resolved. Ready to proceed with:

1. **Search**: Hybrid semantic + full-text with RRF fusion
2. **Intent Inference**: Query classification + parallel search + grouped results
3. **Navigation**: URL-based tab state with Next.js App Router
4. **Cards**: Type-specific summary attributes (3-5 per entity)
5. **Filters**: URL query params, server-side filtering
6. **AI Integration**: Context API + inline citations with popovers
