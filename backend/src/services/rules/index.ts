/**
 * Rules Services - Index
 * Exports all rules-related services for the Rules Explorer feature
 */

export * from './embeddings.js';
export * from './ingestion.js';
export * from './search.js';
export * from './service.js';
export * from './dm-integration.js';

// Re-export types
export type {
  SourceDocument,
  RuleChapter,
  RuleSection,
  RuleEntry,
  RuleEntryWithContext,
  RuleCategory,
  RuleSearchResult,
  RuleCitation,
  SearchOptions,
  SearchResponse,
  SearchMode,
  MatchType,
  IngestionStatus,
  IngestionProgress,
  DocumentStatus,
  FileType,
} from '../../models/rules.types.js';
