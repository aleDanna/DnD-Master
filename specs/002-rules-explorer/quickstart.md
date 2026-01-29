# Quickstart: Rules & Handbook

**Feature**: 002-rules-explorer | **Date**: 2026-01-29 (Updated)

## Prerequisites

Before implementing the Rules & Handbook feature, ensure:

1. **PostgreSQL database** with content populated:
   - PostgreSQL 14+ with pgvector extension enabled
   - Migration `/migrations/001-dnd-content.sql` has been run
   - Content data is present in tables

2. **Environment variables** set:
   ```bash
   # Backend (.env)
   DATABASE_URL=postgresql://user:password@localhost:5432/dnd_master
   JWT_SECRET=your-jwt-secret-key
   OPENAI_API_KEY=your-openai-key  # For query embedding generation

   # Frontend (.env.local)
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. **Existing infrastructure**:
   - Backend server running (`backend/`)
   - Frontend dev server running (`frontend/`)
   - Database connection configured

---

## Implementation Order

### Phase 1: Backend API (2 days)

#### 1.1 Service Layer

Create `backend/src/services/handbook/`:

1. **`contentService.ts`** - Content retrieval
   ```typescript
   // Key methods:
   getSpells(filters): Promise<SpellSummary[]>
   getSpellBySlug(slug): Promise<Spell>
   getMonsters(filters): Promise<MonsterSummary[]>
   getMonsterBySlug(slug): Promise<Monster>
   // ... similar for all entity types
   ```

2. **`searchService.ts`** - Search orchestration
   ```typescript
   // Key methods:
   search(query, options): Promise<SearchResponse>
   getContext(query): Promise<Citation[]>  // For AI DM
   ```

3. **`filterService.ts`** - Filter logic
   ```typescript
   // Key methods:
   buildSpellFilters(params): WhereClause
   buildMonsterFilters(params): WhereClause
   buildItemFilters(params): WhereClause
   ```

#### 1.2 API Routes

Create `backend/src/api/handbook/`:

1. **`index.ts`** - Route registration
2. **`search.ts`** - `/api/handbook/search`, `/api/handbook/context`
3. **`spells.ts`** - `/api/handbook/spells`, `/api/handbook/spells/:slug`
4. **`bestiary.ts`** - `/api/handbook/monsters`, `/api/handbook/monsters/:slug`
5. **`equipment.ts`** - `/api/handbook/items`, `/api/handbook/items/:slug`
6. **`characters.ts`** - Classes, races, backgrounds, feats endpoints
7. **`rules.ts`** - Rule categories and rules endpoints
8. **`reference.ts`** - Conditions, skills, abilities

#### 1.3 Test Coverage

Create tests in `backend/tests/`:

- `unit/handbook/searchService.test.ts`
- `unit/handbook/filterService.test.ts`
- `integration/handbook/spells.test.ts`
- `integration/handbook/search.test.ts`

---

### Phase 2: Frontend Foundation (2 days)

#### 2.1 Types and API Client

Create `frontend/src/lib/handbook/`:

1. **`types.ts`** - TypeScript interfaces matching API schemas
2. **`api.ts`** - API client functions

```typescript
// api.ts
export async function searchHandbook(query: string): Promise<SearchResponse>;
export async function getSpells(filters?: SpellFilters): Promise<SpellSummary[]>;
export async function getSpell(slug: string): Promise<Spell>;
// ... similar for all endpoints
```

#### 2.2 Hooks

Create `frontend/src/hooks/handbook/`:

1. **`useSearch.ts`** - Search state management
   ```typescript
   export function useSearch() {
     const [query, setQuery] = useState('');
     const [results, setResults] = useState<SearchResponse | null>(null);
     const [isSearching, setIsSearching] = useState(false);
     // ...
   }
   ```

2. **`useFilters.ts`** - Filter state (synced with URL params)
   ```typescript
   export function useFilters<T>(defaults: T) {
     // Parse from URL, update URL on change
   }
   ```

3. **`useContent.ts`** - Content fetching with caching
   ```typescript
   export function useContent<T>(fetchFn: () => Promise<T>) {
     // SWR or React Query pattern
   }
   ```

---

### Phase 3: Frontend Pages (3 days)

#### 3.1 Layout and Navigation

Create `frontend/src/app/handbook/`:

1. **`layout.tsx`** - Handbook layout with tabs
   ```tsx
   export default function HandbookLayout({ children }) {
     return (
       <div>
         <SearchBar />
         <TabNavigation />
         <main>{children}</main>
       </div>
     );
   }
   ```

2. **`page.tsx`** - Root redirect to default tab

#### 3.2 Category Pages

Create dynamic routes:

```
handbook/
├── page.tsx              # Redirect to /handbook/rules
├── layout.tsx            # Tabs + search
├── rules/
│   ├── page.tsx          # Rule categories list
│   └── [slug]/
│       └── page.tsx      # Rule detail
├── characters/
│   ├── page.tsx          # Classes, Races, Backgrounds, Feats
│   └── [type]/[slug]/
│       └── page.tsx      # Character option detail
├── spells/
│   ├── page.tsx          # Spell list with filters
│   └── [slug]/
│       └── page.tsx      # Spell detail
├── bestiary/
│   ├── page.tsx          # Monster list with filters
│   └── [slug]/
│       └── page.tsx      # Monster stat block
└── equipment/
    ├── page.tsx          # Item list with filters
    └── [slug]/
        └── page.tsx      # Item detail
```

---

### Phase 4: Components (2 days)

#### 4.1 Core Components

Create `frontend/src/components/handbook/`:

1. **`TabNavigation.tsx`** - Horizontal tab bar
2. **`SearchBar.tsx`** - Search input with debounce
3. **`FilterPanel.tsx`** - Dynamic filters by category
4. **`ContentCard.tsx`** - Generic summary card
5. **`DetailView.tsx`** - Generic detail wrapper

#### 4.2 Entity-Specific Components

1. **`SpellCard.tsx`** - Spell summary card
2. **`SpellDetail.tsx`** - Full spell display
3. **`MonsterStatBlock.tsx`** - D&D stat block format
4. **`MonsterCard.tsx`** - Monster summary card
5. **`ItemCard.tsx`** - Item summary card
6. **`ClassDetail.tsx`** - Class with features
7. **`RaceDetail.tsx`** - Race with traits
8. **`RuleHierarchy.tsx`** - Collapsible rule tree

---

### Phase 5: Integration (1 day)

#### 5.1 AI DM Citation Integration

Modify AI DM service to:

1. Call `/api/handbook/context` during prompt construction
2. Include citations in response format
3. Render citation links in chat UI

#### 5.2 Citation Popover

Create `frontend/src/components/CitationPopover.tsx`:
- Fetch content on hover/click
- Display summary in popover
- "Open in Handbook" link

---

## Quick Verification Steps

After each phase, verify:

### Phase 1 Verification
```bash
# Test search endpoint
curl "http://localhost:3001/api/handbook/search?q=fireball"

# Test content endpoints
curl "http://localhost:3001/api/handbook/spells/fireball"
curl "http://localhost:3001/api/handbook/monsters/goblin"
```

### Phase 2-4 Verification
1. Navigate to `/handbook` - tabs visible
2. Click each tab - content loads
3. Enter search query - results appear
4. Click result - detail view opens
5. Apply filters - list updates

### Phase 5 Verification
1. Ask AI DM a rules question
2. Verify citation links in response
3. Click citation - popover shows content

---

## File Checklist

### Backend Files
- [ ] `backend/src/services/handbook/contentService.ts`
- [ ] `backend/src/services/handbook/searchService.ts`
- [ ] `backend/src/services/handbook/filterService.ts`
- [ ] `backend/src/api/handbook/index.ts`
- [ ] `backend/src/api/handbook/search.ts`
- [ ] `backend/src/api/handbook/spells.ts`
- [ ] `backend/src/api/handbook/bestiary.ts`
- [ ] `backend/src/api/handbook/equipment.ts`
- [ ] `backend/src/api/handbook/characters.ts`
- [ ] `backend/src/api/handbook/rules.ts`
- [ ] `backend/src/api/handbook/reference.ts`

### Frontend Files
- [ ] `frontend/src/lib/handbook/types.ts`
- [ ] `frontend/src/lib/handbook/api.ts`
- [ ] `frontend/src/hooks/handbook/useSearch.ts`
- [ ] `frontend/src/hooks/handbook/useFilters.ts`
- [ ] `frontend/src/hooks/handbook/useContent.ts`
- [ ] `frontend/src/app/handbook/layout.tsx`
- [ ] `frontend/src/app/handbook/page.tsx`
- [ ] `frontend/src/app/handbook/[category]/page.tsx`
- [ ] `frontend/src/app/handbook/[category]/[slug]/page.tsx`
- [ ] `frontend/src/components/handbook/TabNavigation.tsx`
- [ ] `frontend/src/components/handbook/SearchBar.tsx`
- [ ] `frontend/src/components/handbook/FilterPanel.tsx`
- [ ] `frontend/src/components/handbook/ContentCard.tsx`
- [ ] `frontend/src/components/handbook/SpellCard.tsx`
- [ ] `frontend/src/components/handbook/MonsterStatBlock.tsx`
- [ ] `frontend/src/components/handbook/ItemCard.tsx`
- [ ] `frontend/src/components/CitationPopover.tsx`
