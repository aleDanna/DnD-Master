# Data Model: Rules Explorer

**Feature**: 002-rules-explorer | **Date**: 2026-01-29

## Entity Relationship Diagram

```
┌─────────────────────┐
│   source_documents  │
├─────────────────────┤
│ id (uuid) PK        │
│ name                │
│ file_type           │
│ file_hash           │
│ total_pages         │
│ ingested_at         │
│ ingested_by         │───────────────┐
│ status              │               │
└─────────┬───────────┘               │
          │ 1                         │
          │                           │
          │ *                         │
┌─────────┴───────────┐               │
│   rule_chapters     │               │
├─────────────────────┤               │
│ id (uuid) PK        │               │
│ document_id FK      │               │
│ title               │               │
│ order_index         │               │
│ page_start          │               │
│ page_end            │               │
└─────────┬───────────┘               │
          │ 1                         │
          │                           │
          │ *                         │
┌─────────┴───────────┐               │
│   rule_sections     │               │
├─────────────────────┤               │
│ id (uuid) PK        │               │
│ chapter_id FK       │               │
│ title               │               │
│ order_index         │               │
│ page_start          │               │
│ page_end            │               │
└─────────┬───────────┘               │
          │ 1                         │
          │                           │
          │ *                         │
┌─────────┴───────────┐               │
│   rule_entries      │               │
├─────────────────────┤               │
│ id (uuid) PK        │               │
│ section_id FK       │               │
│ title               │               │
│ content             │               │
│ content_embedding   │ (vector 1536) │
│ search_vector       │ (tsvector)    │
│ page_reference      │               │
│ order_index         │               │
└─────────┬───────────┘               │
          │ *                         │
          │                           │
          │                           │
┌─────────┴───────────┐               │
│ rule_entry_categories│              │
├─────────────────────┤               │
│ entry_id FK         │               │
│ category_id FK      │               │
└─────────┬───────────┘               │
          │ *                         │
          │                           │
          │ 1                         │
┌─────────┴───────────┐               │
│   rule_categories   │               │
├─────────────────────┤               │
│ id (uuid) PK        │               │
│ name                │               │
│ description         │               │
│ created_by FK       │───────────────┘
└─────────────────────┘

                    ┌─────────────────────┐
                    │      profiles       │
                    │    (existing)       │
                    └─────────────────────┘
```

---

## Table Definitions

### source_documents

Represents an ingested rulebook document.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Unique identifier |
| name | varchar(255) | NOT NULL | Display name (e.g., "Player's Handbook") |
| file_type | varchar(10) | NOT NULL, CHECK (file_type IN ('pdf', 'txt')) | Source file format |
| file_hash | varchar(64) | NOT NULL, UNIQUE | SHA-256 hash for duplicate detection |
| total_pages | integer | NULL | Page count (NULL for TXT files) |
| ingested_at | timestamptz | NOT NULL, DEFAULT now() | When document was processed |
| ingested_by | uuid | FK → profiles.id | Admin who uploaded |
| status | varchar(20) | NOT NULL, DEFAULT 'processing' | 'processing', 'completed', 'failed' |
| error_log | text | NULL | Error details if status='failed' |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Record creation |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Last modification |

**Indexes**:
- `source_documents_file_hash_idx` UNIQUE on (file_hash)
- `source_documents_status_idx` on (status)

**RLS Policies**:
- SELECT: All authenticated users
- INSERT/UPDATE/DELETE: Only users where profiles.is_admin = true

---

### rule_chapters

Top-level organizational unit within a document.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Unique identifier |
| document_id | uuid | FK → source_documents.id, ON DELETE CASCADE | Parent document |
| title | varchar(255) | NOT NULL | Chapter title |
| order_index | integer | NOT NULL | Display order within document |
| page_start | integer | NULL | Starting page number |
| page_end | integer | NULL | Ending page number |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Record creation |

**Indexes**:
- `rule_chapters_document_order_idx` on (document_id, order_index)

**RLS Policies**:
- SELECT: All authenticated users
- INSERT/UPDATE/DELETE: Only admins (via source_documents cascade)

---

### rule_sections

Sub-section within a chapter.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Unique identifier |
| chapter_id | uuid | FK → rule_chapters.id, ON DELETE CASCADE | Parent chapter |
| title | varchar(255) | NOT NULL | Section title |
| order_index | integer | NOT NULL | Display order within chapter |
| page_start | integer | NULL | Starting page number |
| page_end | integer | NULL | Ending page number |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Record creation |

**Indexes**:
- `rule_sections_chapter_order_idx` on (chapter_id, order_index)

**RLS Policies**:
- SELECT: All authenticated users
- INSERT/UPDATE/DELETE: Only admins (via cascade)

---

### rule_entries

Individual rule content chunk with searchable text and embeddings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Unique identifier |
| section_id | uuid | FK → rule_sections.id, ON DELETE CASCADE | Parent section |
| title | varchar(255) | NULL | Entry title (if applicable) |
| content | text | NOT NULL | Full rule text content |
| content_embedding | vector(1536) | NULL | OpenAI embedding for semantic search |
| search_vector | tsvector | GENERATED | PostgreSQL full-text search vector |
| page_reference | varchar(50) | NULL | Page citation (e.g., "p. 189" or "pp. 189-190") |
| order_index | integer | NOT NULL | Display order within section |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Record creation |

**Generated Column**:
```sql
search_vector tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B')
) STORED
```

**Indexes**:
- `rule_entries_section_order_idx` on (section_id, order_index)
- `rule_entries_search_idx` GIN on (search_vector)
- `rule_entries_embedding_idx` IVFFlat on (content_embedding) using vector_cosine_ops

**RLS Policies**:
- SELECT: All authenticated users
- INSERT/UPDATE/DELETE: Only admins (via cascade)

---

### rule_categories

Optional cross-cutting tags for rule organization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Unique identifier |
| name | varchar(100) | NOT NULL, UNIQUE | Category name (e.g., "Combat", "Spellcasting") |
| description | text | NULL | Category description |
| created_by | uuid | FK → profiles.id | Admin who created |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Record creation |

**RLS Policies**:
- SELECT: All authenticated users
- INSERT/UPDATE/DELETE: Only admins

---

### rule_entry_categories

Many-to-many join table for rule entries and categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| entry_id | uuid | FK → rule_entries.id, ON DELETE CASCADE | Rule entry |
| category_id | uuid | FK → rule_categories.id, ON DELETE CASCADE | Category |

**Primary Key**: (entry_id, category_id)

**RLS Policies**:
- SELECT: All authenticated users
- INSERT/UPDATE/DELETE: Only admins

---

## Profile Table Extension

Add admin flag to existing profiles table:

```sql
ALTER TABLE profiles ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
```

---

## Migration SQL

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Source Documents
CREATE TABLE source_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  file_type varchar(10) NOT NULL CHECK (file_type IN ('pdf', 'txt')),
  file_hash varchar(64) NOT NULL UNIQUE,
  total_pages integer,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  ingested_by uuid REFERENCES profiles(id),
  status varchar(20) NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'completed', 'failed')),
  error_log text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Rule Chapters
CREATE TABLE rule_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  order_index integer NOT NULL,
  page_start integer,
  page_end integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rule_chapters_document_order_idx ON rule_chapters(document_id, order_index);

-- Rule Sections
CREATE TABLE rule_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES rule_chapters(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  order_index integer NOT NULL,
  page_start integer,
  page_end integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rule_sections_chapter_order_idx ON rule_sections(chapter_id, order_index);

-- Rule Entries
CREATE TABLE rule_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES rule_sections(id) ON DELETE CASCADE,
  title varchar(255),
  content text NOT NULL,
  content_embedding vector(1536),
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED,
  page_reference varchar(50),
  order_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rule_entries_section_order_idx ON rule_entries(section_id, order_index);
CREATE INDEX rule_entries_search_idx ON rule_entries USING GIN(search_vector);
CREATE INDEX rule_entries_embedding_idx ON rule_entries
  USING ivfflat(content_embedding vector_cosine_ops) WITH (lists = 100);

-- Rule Categories
CREATE TABLE rule_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL UNIQUE,
  description text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Join Table
CREATE TABLE rule_entry_categories (
  entry_id uuid NOT NULL REFERENCES rule_entries(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES rule_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, category_id)
);

-- Add admin flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- RLS Policies
ALTER TABLE source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_entry_categories ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated users
CREATE POLICY "Authenticated users can read documents" ON source_documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read chapters" ON rule_chapters
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read sections" ON rule_sections
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read entries" ON rule_entries
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read categories" ON rule_categories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read entry categories" ON rule_entry_categories
  FOR SELECT TO authenticated USING (true);

-- Write access for admins only (using service role key in backend)
-- Admin operations will use the service role key which bypasses RLS
```

---

## TypeScript Types

```typescript
// Extend existing types in backend/src/models/rules.types.ts

export interface SourceDocument {
  id: string;
  name: string;
  fileType: 'pdf' | 'txt';
  fileHash: string;
  totalPages: number | null;
  ingestedAt: Date;
  ingestedBy: string;
  status: 'processing' | 'completed' | 'failed';
  errorLog: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleChapter {
  id: string;
  documentId: string;
  title: string;
  orderIndex: number;
  pageStart: number | null;
  pageEnd: number | null;
  createdAt: Date;
  // Populated relations
  document?: SourceDocument;
  sections?: RuleSection[];
}

export interface RuleSection {
  id: string;
  chapterId: string;
  title: string;
  orderIndex: number;
  pageStart: number | null;
  pageEnd: number | null;
  createdAt: Date;
  // Populated relations
  chapter?: RuleChapter;
  entries?: RuleEntry[];
}

export interface RuleEntry {
  id: string;
  sectionId: string;
  title: string | null;
  content: string;
  contentEmbedding: number[] | null;
  pageReference: string | null;
  orderIndex: number;
  createdAt: Date;
  // Populated relations
  section?: RuleSection;
  categories?: RuleCategory[];
}

export interface RuleCategory {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: Date;
}

// Search result types
export interface RuleSearchResult {
  entry: RuleEntry;
  relevance: number;
  matchType: 'fulltext' | 'semantic' | 'hybrid';
  highlights?: string[];
}

export interface RuleCitation {
  ruleId: string;
  title: string;
  excerpt: string;
  source: {
    document: string;
    chapter: string;
    section: string;
    page: string | null;
  };
  relevance: number;
}
```

---

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| SourceDocument | name | 1-255 characters, not empty |
| SourceDocument | file_hash | 64 character hex string (SHA-256) |
| RuleChapter | title | 1-255 characters, not empty |
| RuleChapter | order_index | >= 0 |
| RuleSection | title | 1-255 characters, not empty |
| RuleEntry | content | Not empty, max 50,000 characters |
| RuleCategory | name | 1-100 characters, unique, alphanumeric with spaces |
