/**
 * TypeScript type definitions for Rules Explorer feature
 * Database-backed rules storage with search and categorization
 */

// ============== Database Entity Types ==============

export type DocumentStatus = 'processing' | 'completed' | 'failed';
export type FileType = 'pdf' | 'txt';
export type SearchMode = 'fulltext' | 'semantic' | 'hybrid';
export type MatchType = 'fulltext' | 'semantic' | 'hybrid';

/**
 * Represents an ingested rulebook document
 */
export interface SourceDocument {
  id: string;
  name: string;
  fileType: FileType;
  fileHash: string;
  totalPages: number | null;
  ingestedAt: Date;
  ingestedBy: string | null;
  status: DocumentStatus;
  errorLog: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Computed field for API responses
  chapterCount?: number;
}

/**
 * Top-level organizational unit within a document
 */
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
  // Computed field for API responses
  sectionCount?: number;
}

/**
 * Sub-section within a chapter
 */
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
  // Computed field for API responses
  entryCount?: number;
}

/**
 * Individual rule content chunk with searchable text and embeddings
 */
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

/**
 * Rule entry with full hierarchy context
 */
export interface RuleEntryWithContext extends RuleEntry {
  section: RuleSection;
  chapter: RuleChapter;
  document: SourceDocument;
}

/**
 * Optional cross-cutting tags for rule organization
 */
export interface RuleCategory {
  id: string;
  name: string;
  description: string | null;
  createdBy: string | null;
  createdAt: Date;
}

// ============== Search Types ==============

/**
 * Search result with relevance information
 */
export interface RuleSearchResult {
  entry: RuleEntryWithContext;
  relevance: number;
  matchType: MatchType;
  highlights?: string[];
}

/**
 * Search options
 */
export interface SearchOptions {
  query: string;
  mode?: SearchMode;
  limit?: number;
  offset?: number;
  documentId?: string;
}

/**
 * Search response
 */
export interface SearchResponse {
  results: RuleSearchResult[];
  total: number;
  query: string;
  mode: SearchMode;
}

// ============== Citation Types ==============

/**
 * Citation for AI DM responses
 */
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

// ============== Ingestion Types ==============

/**
 * Progress tracking for document ingestion
 */
export interface IngestionProgress {
  chaptersProcessed: number;
  sectionsProcessed: number;
  entriesProcessed: number;
  embeddingsGenerated: number;
}

/**
 * Status of document ingestion
 */
export interface IngestionStatus {
  documentId: string;
  status: DocumentStatus;
  progress: IngestionProgress;
  errorLog: string | null;
}

/**
 * Input for document ingestion
 */
export interface IngestDocumentInput {
  file: Buffer;
  name: string;
  fileType: FileType;
}

/**
 * Extracted text from a document
 */
export interface ExtractedText {
  text: string;
  pages?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Detected chapter from document parsing
 */
export interface DetectedChapter {
  title: string;
  content: string;
  pageStart?: number;
  pageEnd?: number;
  orderIndex: number;
}

/**
 * Detected section from chapter parsing
 */
export interface DetectedSection {
  title: string;
  content: string;
  pageStart?: number;
  pageEnd?: number;
  orderIndex: number;
}

/**
 * Detected entry from section parsing
 */
export interface DetectedEntry {
  title?: string;
  content: string;
  pageReference?: string;
  orderIndex: number;
}

// ============== Database Row Types (for Supabase) ==============

export interface SourceDocumentRow {
  id: string;
  name: string;
  file_type: FileType;
  file_hash: string;
  total_pages: number | null;
  ingested_at: string;
  ingested_by: string | null;
  status: DocumentStatus;
  error_log: string | null;
  created_at: string;
  updated_at: string;
}

export interface RuleChapterRow {
  id: string;
  document_id: string;
  title: string;
  order_index: number;
  page_start: number | null;
  page_end: number | null;
  created_at: string;
}

export interface RuleSectionRow {
  id: string;
  chapter_id: string;
  title: string;
  order_index: number;
  page_start: number | null;
  page_end: number | null;
  created_at: string;
}

export interface RuleEntryRow {
  id: string;
  section_id: string;
  title: string | null;
  content: string;
  content_embedding: number[] | null;
  page_reference: string | null;
  order_index: number;
  created_at: string;
}

export interface RuleCategoryRow {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface RuleEntryCategoryRow {
  entry_id: string;
  category_id: string;
}

// ============== Conversion Utilities ==============

export function toSourceDocument(row: SourceDocumentRow): SourceDocument {
  return {
    id: row.id,
    name: row.name,
    fileType: row.file_type,
    fileHash: row.file_hash,
    totalPages: row.total_pages,
    ingestedAt: new Date(row.ingested_at),
    ingestedBy: row.ingested_by,
    status: row.status,
    errorLog: row.error_log,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function toRuleChapter(row: RuleChapterRow): RuleChapter {
  return {
    id: row.id,
    documentId: row.document_id,
    title: row.title,
    orderIndex: row.order_index,
    pageStart: row.page_start,
    pageEnd: row.page_end,
    createdAt: new Date(row.created_at),
  };
}

export function toRuleSection(row: RuleSectionRow): RuleSection {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    title: row.title,
    orderIndex: row.order_index,
    pageStart: row.page_start,
    pageEnd: row.page_end,
    createdAt: new Date(row.created_at),
  };
}

export function toRuleEntry(row: RuleEntryRow): RuleEntry {
  return {
    id: row.id,
    sectionId: row.section_id,
    title: row.title,
    content: row.content,
    contentEmbedding: row.content_embedding,
    pageReference: row.page_reference,
    orderIndex: row.order_index,
    createdAt: new Date(row.created_at),
  };
}

export function toRuleCategory(row: RuleCategoryRow): RuleCategory {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
  };
}
