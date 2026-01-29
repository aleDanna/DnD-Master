-- Migration: 002_rules_tables
-- Feature: Rules Explorer
-- Description: Create tables for rules storage, search, and categorization
-- Date: 2026-01-29

-- T001: Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- T002: Create rules tables

-- Source Documents - Represents an ingested rulebook document
CREATE TABLE IF NOT EXISTS source_documents (
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

CREATE INDEX IF NOT EXISTS source_documents_file_hash_idx ON source_documents(file_hash);
CREATE INDEX IF NOT EXISTS source_documents_status_idx ON source_documents(status);

-- Rule Chapters - Top-level organizational unit within a document
CREATE TABLE IF NOT EXISTS rule_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  order_index integer NOT NULL,
  page_start integer,
  page_end integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rule_chapters_document_order_idx ON rule_chapters(document_id, order_index);

-- Rule Sections - Sub-section within a chapter
CREATE TABLE IF NOT EXISTS rule_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES rule_chapters(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  order_index integer NOT NULL,
  page_start integer,
  page_end integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rule_sections_chapter_order_idx ON rule_sections(chapter_id, order_index);

-- Rule Entries - Individual rule content chunk with searchable text and embeddings
CREATE TABLE IF NOT EXISTS rule_entries (
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

CREATE INDEX IF NOT EXISTS rule_entries_section_order_idx ON rule_entries(section_id, order_index);
CREATE INDEX IF NOT EXISTS rule_entries_search_idx ON rule_entries USING GIN(search_vector);
-- Note: IVFFlat index requires data to exist first; create after initial data load
-- CREATE INDEX rule_entries_embedding_idx ON rule_entries
--   USING ivfflat(content_embedding vector_cosine_ops) WITH (lists = 100);

-- Rule Categories - Optional cross-cutting tags for rule organization
CREATE TABLE IF NOT EXISTS rule_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL UNIQUE,
  description text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Join Table - Many-to-many for rule entries and categories
CREATE TABLE IF NOT EXISTS rule_entry_categories (
  entry_id uuid NOT NULL REFERENCES rule_entries(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES rule_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, category_id)
);

-- T004: Add admin flag to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- T003: Enable RLS and create policies

ALTER TABLE source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_entry_categories ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated users (all rules tables)
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

-- Admin write access policies
-- Note: Admin operations typically use service role key which bypasses RLS
-- These policies are for cases where admins use regular auth

CREATE POLICY "Admins can insert documents" ON source_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update documents" ON source_documents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete documents" ON source_documents
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert chapters" ON rule_chapters
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update chapters" ON rule_chapters
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete chapters" ON rule_chapters
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert sections" ON rule_sections
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update sections" ON rule_sections
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete sections" ON rule_sections
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert entries" ON rule_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update entries" ON rule_entries
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete entries" ON rule_entries
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert categories" ON rule_categories
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update categories" ON rule_categories
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete categories" ON rule_categories
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert entry categories" ON rule_entry_categories
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete entry categories" ON rule_entry_categories
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to source_documents
DROP TRIGGER IF EXISTS update_source_documents_updated_at ON source_documents;
CREATE TRIGGER update_source_documents_updated_at
  BEFORE UPDATE ON source_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update entry embedding (used by ingestion service)
CREATE OR REPLACE FUNCTION update_entry_embedding(
  entry_id uuid,
  embedding_vector text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE rule_entries
  SET content_embedding = embedding_vector::vector
  WHERE id = entry_id;
END;
$$;

-- Function for semantic search using vector similarity
CREATE OR REPLACE FUNCTION search_rules_semantic(
  query_embedding text,
  match_count int DEFAULT 20,
  filter_document_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    re.id,
    1 - (re.content_embedding <=> query_embedding::vector) AS similarity
  FROM rule_entries re
  JOIN rule_sections rs ON re.section_id = rs.id
  JOIN rule_chapters rc ON rs.chapter_id = rc.id
  WHERE
    re.content_embedding IS NOT NULL
    AND (filter_document_id IS NULL OR rc.document_id = filter_document_id)
  ORDER BY re.content_embedding <=> query_embedding::vector
  LIMIT match_count;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION search_rules_semantic TO authenticated;
GRANT EXECUTE ON FUNCTION update_entry_embedding TO authenticated;
