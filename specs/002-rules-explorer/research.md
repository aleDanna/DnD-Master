# Research: Rules Explorer

**Feature**: 002-rules-explorer | **Date**: 2026-01-29

## Executive Summary

Research completed for implementing the Rules Explorer feature. All technical decisions have been made based on the existing codebase patterns and requirements from the specification.

---

## Research Topics

### 1. PDF Parsing Library Selection

**Question**: Which library should be used for PDF text extraction?

**Decision**: `pdf-parse` (npm package)

**Rationale**:
- Lightweight and purpose-built for text extraction
- Good support for structured content extraction
- Already commonly used in Node.js ecosystem
- Simpler than `pdfjs-dist` for server-side use

**Alternatives Considered**:
| Library | Pros | Cons | Rejected Because |
|---------|------|------|------------------|
| pdfjs-dist | Mozilla-backed, full-featured | Heavier, browser-focused | Overkill for server-side text extraction |
| pdf2json | JSON output | Limited text positioning | Less reliable for structured extraction |
| Apache PDFBox (via Java) | Very powerful | Requires Java runtime | Additional runtime dependency |

---

### 2. Vector Embedding Strategy

**Question**: How should vector embeddings be generated and stored?

**Decision**: OpenAI text-embedding-3-small with pgvector extension

**Rationale**:
- OpenAI already integrated in the codebase for AI DM
- text-embedding-3-small offers good quality at lower cost (1536 dimensions)
- pgvector is native to Supabase PostgreSQL
- Enables cosine similarity search directly in SQL

**Implementation Details**:
- Chunk size: 512-1024 tokens per rule entry
- Embedding dimension: 1536 (OpenAI text-embedding-3-small)
- Index type: IVFFlat for balance of speed and accuracy
- Batch processing: Generate embeddings in batches of 100 during ingestion

**Alternatives Considered**:
| Option | Pros | Cons | Rejected Because |
|--------|------|------|------------------|
| Voyage AI | High quality | New API to integrate | Additional vendor dependency |
| Cohere | Good multilingual | Different API patterns | Not already integrated |
| Local model (Ollama) | No API costs | Slower, needs GPU | Deployment complexity |

---

### 3. Chapter/Section Detection Strategy

**Question**: How should chapter and section boundaries be identified in source documents?

**Decision**: Heading detection via formatting heuristics + keyword patterns

**Rationale**:
- PDF text includes formatting cues (font size, bold, caps)
- D&D rulebooks follow consistent heading patterns (Chapter X:, Part X, etc.)
- Fallback to line-based splitting for plain text files

**Implementation Approach**:
1. Extract text with position/style metadata where available
2. Identify headings by: ALL CAPS, font size > body, Chapter/Part/Section keywords
3. Build hierarchy tree: Document → Chapters → Sections → Entries
4. Preserve page numbers for citations

**Patterns to Detect**:
```
Level 1 (Chapter): "CHAPTER X:", "Part X:", all-caps lines > 20 chars
Level 2 (Section): "## ", bold text, sentence case with colon
Level 3 (Subsection): "### ", italic headers, indented headers
```

---

### 4. Full-Text Search Implementation

**Question**: How should full-text search be implemented?

**Decision**: PostgreSQL full-text search with tsvector/tsquery

**Rationale**:
- Native to Supabase PostgreSQL
- No additional service required
- Supports relevance ranking
- Can be combined with semantic search for hybrid results

**Implementation Details**:
- Create `search_vector` column (tsvector) on rule_entries table
- Use `english` text search configuration
- Index with GIN for fast lookups
- Weight title matches higher than content matches

**SQL Pattern**:
```sql
ALTER TABLE rule_entries ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED;

CREATE INDEX rule_entries_search_idx ON rule_entries USING GIN(search_vector);
```

---

### 5. Hybrid Search Strategy

**Question**: How should full-text and semantic search be combined?

**Decision**: Reciprocal Rank Fusion (RRF) for result merging

**Rationale**:
- Simple to implement
- Proven effective for combining different ranking signals
- No tuning parameters required (uses k=60 constant)

**Implementation Details**:
1. Run full-text search, get top 50 results with ranks
2. Run semantic search, get top 50 results with ranks
3. Compute RRF score: `score = sum(1 / (k + rank))` for each result
4. Sort by RRF score, return top N

**Formula**:
```
RRF(d) = Σ 1/(k + r(d)) for each ranking r where d appears
k = 60 (standard constant)
```

---

### 6. Existing RulesService Integration

**Question**: How should the new database-backed system integrate with existing RulesService?

**Decision**: Extend existing service with database adapter pattern

**Rationale**:
- Existing `RulesService` has well-defined interface
- DMService already consumes RulesService
- Gradual migration path: file-based → database-backed
- Maintains backward compatibility

**Migration Path**:
1. Create `RulesRepository` interface abstracting storage
2. Implement `FileBasedRulesRepository` (current behavior)
3. Implement `SupabaseRulesRepository` (new database-backed)
4. Configure via environment variable: `RULES_STORAGE=supabase|file`
5. Eventually deprecate file-based storage

---

### 7. Admin Authorization

**Question**: How should document ingestion be protected?

**Decision**: Role-based access using Supabase auth claims

**Rationale**:
- Supabase auth already integrated
- RLS policies can enforce admin-only access
- No separate admin system needed

**Implementation**:
- Add `is_admin` boolean to profiles table
- RLS policy: `source_documents` INSERT/UPDATE/DELETE requires `is_admin = true`
- API middleware checks admin status before ingestion endpoints

---

### 8. Citation Integration Pattern

**Question**: How should citations appear in AI DM responses?

**Decision**: Structured citation objects with frontend rendering

**Rationale**:
- Existing `AIResponse` type includes `ruleCitations` array
- Frontend can render clickable links
- Consistent with existing DMService patterns

**Citation Format**:
```typescript
interface RuleCitation {
  ruleId: string;
  title: string;
  excerpt: string;        // Brief quote (50-100 chars)
  source: {
    document: string;     // "Player's Handbook"
    chapter: string;      // "Chapter 9: Combat"
    page: number;         // 189
  };
  relevance: number;      // 0-1 confidence score
}
```

---

## Dependencies Identified

| Dependency | Version | Purpose | Installation |
|------------|---------|---------|--------------|
| pdf-parse | ^3.0.1 | PDF text extraction | `npm install pdf-parse` |
| pgvector (SQL) | 0.5+ | Vector similarity search | Enable in Supabase dashboard |
| OpenAI SDK | (existing) | Embedding generation | Already installed |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| PDF parsing fails for complex layouts | Medium | Medium | Fallback to raw text extraction, manual correction UI |
| Embedding API rate limits | Low | Medium | Batch processing with rate limiting, retry logic |
| pgvector performance at scale | Low | Low | IVFFlat index, query result limits |
| Heading detection accuracy | Medium | Low | Manual section boundary editing in admin UI |

---

## Conclusions

All research questions resolved. Ready to proceed to Phase 1 (Design & Contracts) with:

1. **PDF Parsing**: `pdf-parse` library
2. **Embeddings**: OpenAI text-embedding-3-small with pgvector storage
3. **Search**: PostgreSQL full-text search + pgvector semantic search with RRF fusion
4. **Integration**: Repository pattern extending existing RulesService
5. **Security**: Supabase RLS with admin role check
