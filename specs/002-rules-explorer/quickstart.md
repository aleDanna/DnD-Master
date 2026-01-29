# Quickstart: Rules Explorer

**Feature**: 002-rules-explorer | **Date**: 2026-01-29

## Prerequisites

Before implementing the Rules Explorer feature, ensure:

1. **PostgreSQL database** is configured with:
   - PostgreSQL 14+ with pgvector extension enabled
   - Database created and accessible

2. **Environment variables** set:
   ```bash
   # Backend (.env)
   DATABASE_URL=postgresql://user:password@localhost:5432/dnd_master
   JWT_SECRET=your-jwt-secret-key
   OPENAI_API_KEY=your-openai-key  # For embeddings

   # Frontend (.env.local)
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

3. **Dependencies** installed:
   ```bash
   cd backend && npm install pdf-parse pg
   ```

---

## Implementation Order

### Phase 1: Database Setup

1. **Enable pgvector extension** in PostgreSQL:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

2. **Run initialization script** from `backend/sql/init.sql`:
   - Create all tables (users, campaigns, source_documents, rule_chapters, etc.)
   - Create indexes
   - Create search functions

3. **Create admin user**:
   ```sql
   -- Register via API or insert directly
   INSERT INTO users (email, password_hash, display_name, is_admin)
   VALUES ('admin@example.com', '<bcrypt_hash>', 'Admin', true);
   ```

### Phase 2: Backend Services

**Implementation order** (each builds on previous):

1. **`backend/src/services/rules/embeddings.ts`**
   - OpenAI embedding generation
   - Batch processing with rate limiting

2. **`backend/src/services/rules/ingestion.ts`**
   - PDF/TXT text extraction
   - Chapter/section detection
   - Database population
   - Embedding generation trigger

3. **`backend/src/services/rules/search.ts`**
   - Full-text search implementation
   - Semantic search implementation
   - Hybrid RRF fusion

4. **Extend `backend/src/services/rules/service.ts`**
   - Add database-backed methods
   - Maintain interface compatibility

### Phase 3: API Routes

Create `backend/src/api/routes/rules.ts`:

1. **Browsing endpoints** (GET):
   - `/rules/documents`
   - `/rules/documents/:id/chapters`
   - `/rules/chapters/:id/sections`
   - `/rules/sections/:id/entries`
   - `/rules/entries/:id`

2. **Search endpoint** (GET):
   - `/rules/search?q=&mode=&limit=&offset=`

3. **Admin endpoints** (POST/DELETE):
   - `/admin/rules/ingest` (multipart upload)
   - `/admin/rules/ingest/:id/status`
   - `/admin/rules/ingest/:id` (DELETE)

### Phase 4: Frontend Components

**Order of implementation**:

1. **Hooks first**:
   - `useRulesSearch.ts` - Search state and API calls

2. **Display components**:
   - `RuleCard.tsx` - Single rule display
   - `RuleDetail.tsx` - Full rule content
   - `CitationPopover.tsx` - Inline citation

3. **Navigation components**:
   - `RulesBrowser.tsx` - Hierarchical sidebar
   - `RulesSearch.tsx` - Search bar with mode toggle

4. **Pages**:
   - `/rules/page.tsx` - Main explorer page
   - `/rules/[id]/page.tsx` - Rule detail page

### Phase 5: Integration

1. **Update navigation** to include Rules Explorer link
2. **Update session view** to render AI DM citations with `CitationPopover`
3. **Update `DMService`** to use new database-backed `RulesService`

---

## Testing Strategy

### Unit Tests

```typescript
// backend/tests/unit/rules/search.test.ts
describe('RulesSearchService', () => {
  it('returns full-text matches with relevance scores');
  it('returns semantic matches ranked by similarity');
  it('combines results using RRF for hybrid mode');
  it('filters by document when specified');
});

// backend/tests/unit/rules/ingestion.test.ts
describe('RulesIngestionService', () => {
  it('extracts text from PDF files');
  it('detects chapter boundaries');
  it('detects section boundaries');
  it('generates embeddings in batches');
  it('detects duplicate documents by hash');
});
```

### Integration Tests

```typescript
// backend/tests/integration/rules/api.test.ts
describe('Rules API', () => {
  it('lists all documents');
  it('returns chapters for a document');
  it('searches with full-text mode');
  it('searches with semantic mode');
  it('requires admin for ingestion');
});
```

### Frontend Tests

```typescript
// frontend/tests/components/rules/RulesBrowser.test.tsx
describe('RulesBrowser', () => {
  it('expands chapters on click');
  it('displays sections when chapter expanded');
  it('selects entry and shows in main area');
});

// frontend/tests/components/rules/RulesSearch.test.tsx
describe('RulesSearch', () => {
  it('toggles between search modes');
  it('displays results with highlights');
  it('shows loading state during search');
});
```

---

## Key Code Patterns

### Embedding Generation

```typescript
// backend/src/services/rules/embeddings.ts
import OpenAI from 'openai';

const openai = new OpenAI();
const BATCH_SIZE = 100;

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });
    results.push(...response.data.map(d => d.embedding));

    // Rate limiting
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
```

### Hybrid Search Query

```typescript
// backend/src/services/rules/search.ts
export async function hybridSearch(query: string, limit = 20) {
  // Run both searches in parallel
  const [fulltextResults, semanticResults] = await Promise.all([
    fulltextSearch(query, 50),
    semanticSearch(query, 50),
  ]);

  // Build rank maps
  const rrfScores = new Map<string, number>();
  const K = 60;

  fulltextResults.forEach((r, idx) => {
    const score = 1 / (K + idx + 1);
    rrfScores.set(r.id, (rrfScores.get(r.id) || 0) + score);
  });

  semanticResults.forEach((r, idx) => {
    const score = 1 / (K + idx + 1);
    rrfScores.set(r.id, (rrfScores.get(r.id) || 0) + score);
  });

  // Sort by RRF score
  const sortedIds = [...rrfScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  return fetchEntriesByIds(sortedIds);
}
```

### Semantic Search SQL

```sql
-- Get top N similar entries
SELECT
  id, title, content, page_reference,
  1 - (content_embedding <=> $1::vector) as similarity
FROM rule_entries
WHERE content_embedding IS NOT NULL
ORDER BY content_embedding <=> $1::vector
LIMIT $2;
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| pgvector not found | Run `CREATE EXTENSION vector;` in PostgreSQL |
| Embedding API rate limit | Increase delay between batches, implement exponential backoff |
| PDF parsing fails | Check file encoding, try alternative extraction method |
| Search too slow | Ensure indexes exist, reduce embedding dimension if needed |
| Admin check fails | Verify `is_admin` column exists and user is flagged |
| Connection refused | Check DATABASE_URL and ensure PostgreSQL is running |

---

## Verification Checklist

After implementation, verify:

- [ ] Documents can be ingested (admin only)
- [ ] Chapters/sections/entries display in hierarchy
- [ ] Full-text search returns highlighted results
- [ ] Semantic search finds conceptually related rules
- [ ] Hybrid search combines both result sets
- [ ] Citations appear in AI DM responses
- [ ] Citation links open rule detail view
- [ ] Non-admins cannot access ingestion endpoints
- [ ] Performance meets targets (<500ms full-text, <1s semantic)
