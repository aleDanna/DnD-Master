# Quickstart: Rules Explorer

**Feature**: 001-rules-explorer
**Date**: 2026-01-30

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ with pgvector extension
- pnpm or npm

## Database Setup

### 1. Install pgvector Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Run Migrations

The data model requires these tables. Migrations will be generated as part of implementation tasks.

Key tables to be created:
- `rule_categories` - Hierarchical rule organization
- `rules` - Individual rule entries
- `classes` / `subclasses` - Character classes
- `races` / `subraces` - Character races
- `spells` / `spell_classes` - Magic spells and class associations
- `monsters` - Bestiary entries
- `items` - Equipment and magic items
- `backgrounds` - Character backgrounds
- `feats` - Character feats
- `conditions` - Status conditions
- `skills` - Character skills

### 3. Seed Content Data

SRD (System Reference Document) content must be imported. This is a prerequisite for the feature and handled separately from the Rules Explorer implementation.

## Backend Development

### Directory Structure

```
backend/src/
├── api/
│   ├── search/
│   │   └── route.ts          # GET /api/search
│   └── content/
│       ├── rules/
│       │   └── route.ts      # GET /api/rules/*
│       ├── classes/
│       │   └── route.ts      # GET /api/classes/*
│       └── [other-categories]/
├── services/
│   ├── search/
│   │   ├── fullTextSearch.ts
│   │   └── semanticSearch.ts
│   └── content/
│       └── contentService.ts
└── models/
    └── content/
        └── index.ts          # Entity types
```

### Key Endpoints to Implement

1. **Search** - `GET /api/search`
   - Query params: `q`, `type` (full-text|semantic), `categories`
   - Returns: Grouped results with snippets

2. **Navigation Tree** - `GET /api/rules/tree`
   - Returns: Hierarchical navigation structure

3. **Content Endpoints** - `GET /api/{category}/{slug}`
   - Each category has list and detail endpoints
   - See `contracts/openapi.yaml` for full specification

### Search Implementation

```typescript
// Full-text search query pattern
const fullTextSearch = async (query: string, categories?: string[]) => {
  const searchQuery = `
    SELECT
      'rule' as type, id, title, slug,
      ts_headline('english', content, plainto_tsquery($1)) as snippet,
      ts_rank(search_vector, plainto_tsquery($1)) as rank
    FROM rules
    WHERE search_vector @@ plainto_tsquery($1)
    ${categories?.includes('rules') === false ? 'AND false' : ''}
    UNION ALL
    -- ... repeat for other tables
    ORDER BY rank DESC
    LIMIT 20
  `;
  return db.query(searchQuery, [query]);
};

// Semantic search query pattern
const semanticSearch = async (embedding: number[]) => {
  const vectorQuery = `
    SELECT id, title, slug, summary,
      1 - (embedding <=> $1::vector) as similarity
    FROM rules
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT 10
  `;
  return db.query(vectorQuery, [`[${embedding.join(',')}]`]);
};
```

## Frontend Development

### Directory Structure

```
frontend/src/
├── app/
│   ├── rules/
│   │   ├── page.tsx              # /rules landing
│   │   ├── [category]/
│   │   │   ├── page.tsx          # Category listing
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Rule detail
│   ├── classes/
│   │   └── ...
│   └── layout.tsx                # Shared rules layout
├── components/
│   ├── layout/
│   │   ├── RulesLayout.tsx       # Main layout wrapper
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   ├── SidebarItem.tsx       # Expandable tree item
│   │   ├── MobileDrawer.tsx      # Mobile sidebar drawer
│   │   └── Breadcrumb.tsx        # Location breadcrumb
│   ├── search/
│   │   ├── SearchBar.tsx         # Search input
│   │   ├── SearchResults.tsx     # Results display
│   │   └── RecentSearches.tsx    # Recent search list
│   └── content/
│       ├── RuleCard.tsx
│       ├── SpellCard.tsx
│       ├── MonsterStatBlock.tsx
│       └── [other-cards]/
└── lib/
    ├── api/
    │   └── rulesApi.ts           # API client functions
    └── hooks/
        ├── useSearch.ts          # Search with debounce
        └── useSidebar.ts         # Sidebar state
```

### Key Components

#### Sidebar with Expansion State

```typescript
// lib/hooks/useSidebar.ts
export function useSidebar() {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const saved = localStorage.getItem('sidebar-expanded');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('sidebar-expanded', JSON.stringify([...next]));
      return next;
    });
  };

  return { expanded, toggle };
}
```

#### Search with Debounce

```typescript
// lib/hooks/useSearch.ts
export function useSearch() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'full-text' | 'semantic'>('full-text');
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, type],
    queryFn: () => searchApi(debouncedQuery, type),
    enabled: debouncedQuery.length > 0
  });

  return { query, setQuery, type, setType, results: data, isLoading };
}
```

### Mobile Responsive Pattern

```typescript
// components/layout/MobileDrawer.tsx
export function MobileDrawer({ children, isOpen, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden
          ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div className={`fixed inset-y-0 left-0 w-80 bg-white z-50
        transform transition-transform duration-200 md:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {children}
      </div>
    </>
  );
}
```

## Testing Strategy

### Unit Tests (Backend)

- Search query building
- Result ranking/sorting
- Slug validation

### Unit Tests (Frontend)

- Sidebar expansion logic
- Search debounce behavior
- Recent searches storage

### Integration Tests

- Full search flow (query → API → results)
- Navigation flow (sidebar → route → content)
- Deep link loading
- Mobile drawer behavior

### E2E Tests (Recommended)

- Complete user flows from spec acceptance scenarios
- Cross-browser mobile testing

## Environment Variables

### Backend

```env
# Existing vars apply
DATABASE_URL=postgresql://user:pass@localhost:5432/dnd_master

# Optional: For semantic search embedding generation
OPENAI_API_KEY=sk-...  # Only needed for embedding generation
```

### Frontend

```env
# Existing vars apply
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Development Workflow

1. **Start databases**: Ensure PostgreSQL is running with pgvector
2. **Run migrations**: Apply schema changes
3. **Seed content**: Import SRD data (prerequisite)
4. **Start backend**: `cd backend && npm run dev`
5. **Start frontend**: `cd frontend && npm run dev`
6. **Test search**: Navigate to `/rules` and test navigation/search

## API Reference

See `contracts/openapi.yaml` for complete API specification.

Key endpoints:
- `GET /api/search?q=...&type=full-text|semantic`
- `GET /api/rules/tree`
- `GET /api/{category}` - List
- `GET /api/{category}/{slug}` - Detail

## Notes

- Semantic search requires embeddings to be pre-generated for content
- Full-text search works immediately once content is in database
- Mobile breakpoint is 768px (md in Tailwind)
- Recent searches stored in localStorage (10 max)
