/**
 * Search Service for Rules Explorer
 * Implements full-text, semantic, and hybrid search with RRF fusion
 *
 * Tasks: T018-T022
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../models/database.types.js';
import {
  RuleSearchResult,
  RuleEntryWithContext,
  SearchOptions,
  SearchResponse,
  MatchType,
} from '../../models/rules.types.js';
import { generateEmbedding, formatEmbeddingForPgvector } from './embeddings.js';

// RRF constant (standard value)
const RRF_K = 60;

// Default search limits
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const SEARCH_POOL_SIZE = 50; // Number of results to fetch from each search method

// Type alias for looser Supabase client typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any>;

/**
 * RulesSearchService handles all search operations
 */
export class RulesSearchService {
  private client: DbClient;

  constructor(client: SupabaseClient<Database>) {
    this.client = client as DbClient;
  }

  /**
   * Main search method - routes to appropriate search type
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    const mode = options.mode || 'hybrid';
    const limit = Math.min(options.limit || DEFAULT_LIMIT, MAX_LIMIT);
    const offset = options.offset || 0;

    let results: RuleSearchResult[];

    switch (mode) {
      case 'fulltext':
        results = await this.fulltextSearch(options.query, {
          limit: limit + offset,
          documentId: options.documentId,
        });
        break;
      case 'semantic':
        results = await this.semanticSearch(options.query, {
          limit: limit + offset,
          documentId: options.documentId,
        });
        break;
      case 'hybrid':
      default:
        results = await this.hybridSearch(options.query, {
          limit: limit + offset,
          documentId: options.documentId,
        });
        break;
    }

    // Apply offset and limit
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      results: paginatedResults,
      total: results.length,
      query: options.query,
      mode,
    };
  }

  /**
   * Full-text search using PostgreSQL tsvector
   */
  async fulltextSearch(
    query: string,
    options: { limit?: number; documentId?: string } = {}
  ): Promise<RuleSearchResult[]> {
    const limit = options.limit || SEARCH_POOL_SIZE;

    // Convert query to tsquery format
    const tsquery = this.toTsQuery(query);

    // Build the query
    let queryBuilder = this.client
      .from('rule_entries')
      .select(
        `
        id, section_id, title, content, page_reference, order_index, created_at,
        rule_sections!inner (
          id, chapter_id, title, order_index, page_start, page_end, created_at,
          rule_chapters!inner (
            id, document_id, title, order_index, page_start, page_end, created_at,
            source_documents!inner (
              id, name, file_type, file_hash, total_pages, ingested_at, ingested_by, status, error_log, created_at, updated_at
            )
          )
        )
      `
      )
      .textSearch('search_vector', tsquery, {
        type: 'websearch',
        config: 'english',
      })
      .limit(limit);

    // Filter by document if specified
    if (options.documentId) {
      queryBuilder = queryBuilder.eq(
        'rule_sections.rule_chapters.document_id',
        options.documentId
      );
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Full-text search error:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform results
    return data.map((row: any, index: number) => {
      const entryWithContext = this.transformToEntryWithContext(row);
      const highlights = this.highlightMatches(row.content, query);

      return {
        entry: entryWithContext,
        relevance: 1 - index / data.length, // Rank-based relevance
        matchType: 'fulltext' as MatchType,
        highlights,
      };
    });
  }

  /**
   * Semantic search using pgvector similarity
   */
  async semanticSearch(
    query: string,
    options: { limit?: number; documentId?: string } = {}
  ): Promise<RuleSearchResult[]> {
    const limit = options.limit || SEARCH_POOL_SIZE;

    try {
      // Generate query embedding
      const queryEmbedding = await generateEmbedding(query);
      const embeddingString = formatEmbeddingForPgvector(queryEmbedding);

      // Use RPC for vector similarity search
      const { data, error } = await this.client.rpc('search_rules_semantic', {
        query_embedding: embeddingString,
        match_count: limit,
        filter_document_id: options.documentId || null,
      });

      if (error) {
        console.error('Semantic search error:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch full entry data with context
      const entryIds = data.map((r: any) => r.id);
      const fullEntries = await this.fetchEntriesWithContext(entryIds);

      // Map similarity scores to entries
      const similarityMap = new Map<string, number>(
        data.map((r: any) => [r.id, r.similarity as number])
      );

      return fullEntries.map(entry => ({
        entry,
        relevance: similarityMap.get(entry.id) || 0,
        matchType: 'semantic' as MatchType,
        highlights: this.highlightMatches(entry.content, query),
      }));
    } catch (error) {
      console.error('Semantic search error:', error);
      return [];
    }
  }

  /**
   * Hybrid search using Reciprocal Rank Fusion (RRF)
   */
  async hybridSearch(
    query: string,
    options: { limit?: number; documentId?: string } = {}
  ): Promise<RuleSearchResult[]> {
    const limit = options.limit || SEARCH_POOL_SIZE;

    // Run both searches in parallel
    const [fulltextResults, semanticResults] = await Promise.all([
      this.fulltextSearch(query, { limit: SEARCH_POOL_SIZE, documentId: options.documentId }),
      this.semanticSearch(query, { limit: SEARCH_POOL_SIZE, documentId: options.documentId }),
    ]);

    // Build RRF score maps
    const rrfScores = new Map<string, number>();
    const entryMap = new Map<string, RuleEntryWithContext>();
    const matchTypes = new Map<string, Set<MatchType>>();

    // Process fulltext results
    fulltextResults.forEach((result, rank) => {
      const score = 1 / (RRF_K + rank + 1);
      rrfScores.set(result.entry.id, (rrfScores.get(result.entry.id) || 0) + score);
      entryMap.set(result.entry.id, result.entry);

      const types = matchTypes.get(result.entry.id) || new Set();
      types.add('fulltext');
      matchTypes.set(result.entry.id, types);
    });

    // Process semantic results
    semanticResults.forEach((result, rank) => {
      const score = 1 / (RRF_K + rank + 1);
      rrfScores.set(result.entry.id, (rrfScores.get(result.entry.id) || 0) + score);
      entryMap.set(result.entry.id, result.entry);

      const types = matchTypes.get(result.entry.id) || new Set();
      types.add('semantic');
      matchTypes.set(result.entry.id, types);
    });

    // Sort by RRF score
    const sortedIds = [...rrfScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    // Build final results
    const maxScore = Math.max(...rrfScores.values());

    return sortedIds.map(id => {
      const entry = entryMap.get(id)!;
      const types = matchTypes.get(id)!;

      // Determine match type
      let matchType: MatchType = 'hybrid';
      if (types.size === 1) {
        matchType = types.has('fulltext') ? 'fulltext' : 'semantic';
      }

      return {
        entry,
        relevance: (rrfScores.get(id) || 0) / maxScore, // Normalize to 0-1
        matchType,
        highlights: this.highlightMatches(entry.content, query),
      };
    });
  }

  /**
   * Generate highlighted snippets for search results
   */
  highlightMatches(content: string, query: string): string[] {
    const highlights: string[] = [];
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    if (words.length === 0) return [];

    // Find sentences containing query words
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const hasMatch = words.some(word => lowerSentence.includes(word));

      if (hasMatch) {
        // Trim and limit length
        let highlight = sentence.trim();
        if (highlight.length > 200) {
          // Find first matching word position and extract around it
          let matchIndex = -1;
          for (const word of words) {
            const idx = lowerSentence.indexOf(word);
            if (idx !== -1) {
              matchIndex = idx;
              break;
            }
          }

          if (matchIndex !== -1) {
            const start = Math.max(0, matchIndex - 50);
            const end = Math.min(highlight.length, matchIndex + 150);
            highlight = (start > 0 ? '...' : '') + highlight.slice(start, end) + (end < highlight.length ? '...' : '');
          } else {
            highlight = highlight.slice(0, 200) + '...';
          }
        }

        // Add highlight markers around matching words
        for (const word of words) {
          const regex = new RegExp(`(${this.escapeRegExp(word)})`, 'gi');
          highlight = highlight.replace(regex, '**$1**');
        }

        highlights.push(highlight);

        // Limit to 3 highlights
        if (highlights.length >= 3) break;
      }
    }

    return highlights;
  }

  /**
   * Convert user query to PostgreSQL tsquery format
   */
  private toTsQuery(query: string): string {
    // Use websearch format which handles natural language queries
    return query
      .replace(/[^\w\s]/g, ' ') // Remove special chars
      .trim();
  }

  /**
   * Escape special regex characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Fetch entries by IDs with full context
   */
  private async fetchEntriesWithContext(
    entryIds: string[]
  ): Promise<RuleEntryWithContext[]> {
    if (entryIds.length === 0) return [];

    const { data, error } = await this.client
      .from('rule_entries')
      .select(
        `
        id, section_id, title, content, page_reference, order_index, created_at,
        rule_sections!inner (
          id, chapter_id, title, order_index, page_start, page_end, created_at,
          rule_chapters!inner (
            id, document_id, title, order_index, page_start, page_end, created_at,
            source_documents!inner (
              id, name, file_type, file_hash, total_pages, ingested_at, ingested_by, status, error_log, created_at, updated_at
            )
          )
        )
      `
      )
      .in('id', entryIds);

    if (error || !data) {
      return [];
    }

    // Preserve original order
    const entryMap = new Map(
      data.map((row: any) => [row.id, this.transformToEntryWithContext(row)])
    );

    return entryIds
      .map(id => entryMap.get(id))
      .filter((e): e is RuleEntryWithContext => e !== undefined);
  }

  /**
   * Transform database row to RuleEntryWithContext
   */
  private transformToEntryWithContext(row: any): RuleEntryWithContext {
    const section = row.rule_sections;
    const chapter = section.rule_chapters;
    const document = chapter.source_documents;

    return {
      id: row.id,
      sectionId: row.section_id,
      title: row.title,
      content: row.content,
      contentEmbedding: null, // Don't include in search results
      pageReference: row.page_reference,
      orderIndex: row.order_index,
      createdAt: new Date(row.created_at),
      section: {
        id: section.id,
        chapterId: section.chapter_id,
        title: section.title,
        orderIndex: section.order_index,
        pageStart: section.page_start,
        pageEnd: section.page_end,
        createdAt: new Date(section.created_at),
      },
      chapter: {
        id: chapter.id,
        documentId: chapter.document_id,
        title: chapter.title,
        orderIndex: chapter.order_index,
        pageStart: chapter.page_start,
        pageEnd: chapter.page_end,
        createdAt: new Date(chapter.created_at),
      },
      document: {
        id: document.id,
        name: document.name,
        fileType: document.file_type,
        fileHash: document.file_hash,
        totalPages: document.total_pages,
        ingestedAt: new Date(document.ingested_at),
        ingestedBy: document.ingested_by,
        status: document.status,
        errorLog: document.error_log,
        createdAt: new Date(document.created_at),
        updatedAt: new Date(document.updated_at),
      },
    };
  }
}

/**
 * Factory function to create search service
 */
export function createSearchService(
  client: SupabaseClient<Database>
): RulesSearchService {
  return new RulesSearchService(client);
}

export default RulesSearchService;
