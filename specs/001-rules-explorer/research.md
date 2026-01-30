# Research: Rules Explorer

**Feature**: 001-rules-explorer
**Date**: 2026-01-30
**Purpose**: Resolve technical decisions and document best practices for implementation

## Research Topics

### 1. PostgreSQL Full-Text Search

**Decision**: Use PostgreSQL's built-in full-text search with `tsvector` and `tsquery`

**Rationale**:
- Already using PostgreSQL; no additional infrastructure required
- Supports ranking, highlighting, and phrase matching out of the box
- Performs well for the expected content volume (~1000+ entries)
- Can create GIN indexes for fast search performance

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Elasticsearch | Overkill for content volume; adds operational complexity |
| Meilisearch | Additional service to deploy and maintain |
| Client-side search | Poor performance with large content; no snippet highlighting |

**Implementation Notes**:
- Create `tsvector` columns with GIN indexes on searchable tables
- Use `ts_headline()` for snippet generation with highlighted matches
- Use `ts_rank()` for relevance ordering
- Combine searches across tables using UNION for unified results

### 2. Semantic Search with pgvector

**Decision**: Use pgvector PostgreSQL extension for vector similarity search

**Rationale**:
- Integrates directly with existing PostgreSQL database
- Supports cosine similarity and L2 distance for embedding comparison
- Can store embeddings alongside content in same tables
- Single query can combine vector search with metadata filters

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Pinecone | External service; adds latency and cost |
| Qdrant | Additional service to deploy |
| Redis Vector Search | Adds Redis dependency |

**Implementation Notes**:
- Add `vector(1536)` column to content tables (assuming OpenAI embeddings dimension)
- Create IVFFlat or HNSW index for approximate nearest neighbor search
- Generate embeddings during content ingestion (out of scope for this feature)
- Query: `ORDER BY embedding <=> $query_vector LIMIT 10`
- Graceful fallback to keyword search if embeddings unavailable

### 3. Hierarchical Sidebar Navigation

**Decision**: React component tree with URL-based state and localStorage for expansion persistence

**Rationale**:
- URL params enable deep linking and browser back/forward navigation
- localStorage persists expansion state across sessions
- Component tree structure matches content hierarchy naturally
- No external state management library needed

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Redux/Zustand for sidebar state | Overkill for single-feature state |
| Server-rendered expansion state | Poor UX; requires page reload for expand/collapse |
| Query params for expansion state | URL becomes unwieldy with many expanded nodes |

**Implementation Notes**:
- `Sidebar` component fetches navigation tree from API
- `SidebarItem` handles expand/collapse with local state
- Save expanded node IDs to localStorage on change
- Restore expansion state on mount
- URL path determines which item is selected/highlighted

### 4. Mobile Responsive Sidebar

**Decision**: Tailwind CSS with slide-over drawer pattern using CSS transforms

**Rationale**:
- Tailwind already in project; consistent styling approach
- CSS transforms provide smooth 60fps animations
- No JavaScript animation libraries needed
- Breakpoint at 768px aligns with common tablet/phone divide

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Headless UI Drawer | Additional dependency; project already has Tailwind |
| React Spring animations | Overkill for simple slide transition |
| CSS-only hamburger | Requires JavaScript for accessibility |

**Implementation Notes**:
- `MobileDrawer` component wraps sidebar content
- Use `translate-x-full` / `translate-x-0` for slide animation
- Overlay backdrop with click-to-close
- Focus trap for accessibility when drawer is open
- Touch swipe gesture for natural mobile interaction

### 5. Search Debouncing and Recent Searches

**Decision**: Custom `useDebounce` hook + localStorage for recent searches

**Rationale**:
- Simple hook covers debounce need; no library required
- localStorage provides persistence without user accounts
- React Query or SWR for search results caching

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| lodash.debounce | Adds dependency for one function |
| IndexedDB for recent searches | Overkill for 10 strings |
| Server-stored recent searches | Requires auth; out of scope |

**Implementation Notes**:
- `useDebounce(value, 300)` delays search execution
- Store recent searches as JSON array in localStorage key `rules-explorer-recent-searches`
- Limit to 10 entries; FIFO eviction
- Clear duplicates before adding new search

### 6. Content Display Components

**Decision**: Separate components per content type with shared styling utilities

**Rationale**:
- Each content type has unique fields (spells vs monsters vs items)
- Shared Tailwind utilities ensure visual consistency
- Components can be lazy-loaded for performance

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Single generic ContentCard | Too many conditionals; hard to maintain |
| Dynamic component generation | Type safety issues; harder to debug |

**Implementation Notes**:
- `SpellCard`: level, school, casting time, range, components, duration, description
- `MonsterStatBlock`: AC, HP, speed, abilities, actions, legendary actions
- `RuleCard`: title, summary, content, keywords, source
- `ClassDetail`, `RaceDetail`: structured feature lists by level
- All components receive typed props; share typography/spacing tokens

### 7. API Design Pattern

**Decision**: RESTful endpoints with query parameters for filtering

**Rationale**:
- Simple, well-understood pattern
- Easy to cache at CDN/browser level
- Query params natural for search and filter operations
- Matches existing backend patterns

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| GraphQL | Adds complexity; overkill for read-only content |
| tRPC | Would require significant backend changes |

**Implementation Notes**:
- `GET /api/search?q=term&type=full-text|semantic&categories=spells,rules`
- `GET /api/rules/tree` - hierarchical navigation structure
- `GET /api/[category]?filters...` - filtered content lists
- `GET /api/[category]/[slug]` - individual content detail
- All responses include `source` citation object

## Embedding Generation (Out of Scope)

**Note**: The spec assumes embeddings exist in the database. Embedding generation during content ingestion is a separate concern, likely handled by:
- Background job when SRD content is imported
- OpenAI Embeddings API or similar
- Stored as `vector(1536)` in content tables

This feature only *queries* embeddings; it does not create them.

## Summary of Key Decisions

| Topic | Decision |
|-------|----------|
| Full-text search | PostgreSQL tsvector + GIN indexes |
| Semantic search | pgvector extension |
| Sidebar state | URL + localStorage |
| Mobile drawer | Tailwind CSS slide-over |
| Search debounce | Custom useDebounce hook (300ms) |
| Recent searches | localStorage (10 items) |
| Content display | Typed components per content type |
| API pattern | REST with query params |
