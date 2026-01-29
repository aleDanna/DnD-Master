/**
 * Search Service for Rules Explorer
 * Implements full-text, semantic, and hybrid search with RRF fusion
 *
 * Tasks: T018-T022
 */

import { query } from '../../config/database.js';
import {
  RuleSearchResult,
  RuleEntryWithContext,
  SearchOptions,
  SearchResponse,
  MatchType,
} from '../../models/rules.types.js';
import { generateEmbedding, formatEmbeddingForPgvector, isEmbeddingAvailable } from './embeddings.js';

// RRF constant (standard value)
const RRF_K = 60;

// Default search limits
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const SEARCH_POOL_SIZE = 50; // Number of results to fetch from each search method

/**
 * RulesSearchService handles all search operations
 */
export class RulesSearchService {
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
    searchQuery: string,
    options: { limit?: number; documentId?: string } = {}
  ): Promise<RuleSearchResult[]> {
    const limit = options.limit || SEARCH_POOL_SIZE;

    try {
      // Call the PostgreSQL function for full-text search
      const params: any[] = [searchQuery, limit];
      let sql = 'SELECT * FROM search_rules_fulltext($1, $2';

      if (options.documentId) {
        sql += ', $3)';
        params.push(options.documentId);
      } else {
        sql += ', NULL)';
      }

      const result = await query<{ id: string; rank: number }>(sql, params);

      if (result.rows.length === 0) {
        return [];
      }

      // Fetch full entry data with context
      const entryIds = result.rows.map(r => r.id);
      const fullEntries = await this.fetchEntriesWithContext(entryIds);

      // Map ranks to entries
      const rankMap = new Map<string, number>(
        result.rows.map(r => [r.id, r.rank])
      );

      // Normalize ranks
      const maxRank = Math.max(...result.rows.map(r => r.rank));

      return fullEntries.map(entry => ({
        entry,
        relevance: maxRank > 0 ? (rankMap.get(entry.id) || 0) / maxRank : 0,
        matchType: 'fulltext' as MatchType,
        highlights: this.highlightMatches(entry.content, searchQuery),
      }));
    } catch (error) {
      console.error('Full-text search error:', error);
      return [];
    }
  }

  /**
   * Semantic search using pgvector similarity
   */
  async semanticSearch(
    searchQuery: string,
    options: { limit?: number; documentId?: string } = {}
  ): Promise<RuleSearchResult[]> {
    // Check if embeddings are available
    if (!isEmbeddingAvailable()) {
      console.warn('Semantic search unavailable: OPENAI_API_KEY not set');
      return [];
    }

    const limit = options.limit || SEARCH_POOL_SIZE;

    try {
      // Generate query embedding
      const queryEmbedding = await generateEmbedding(searchQuery);
      const embeddingString = formatEmbeddingForPgvector(queryEmbedding);

      // Call the PostgreSQL function for semantic search
      const params: any[] = [embeddingString, limit];
      let sql = 'SELECT * FROM search_rules_semantic($1, $2';

      if (options.documentId) {
        sql += ', $3)';
        params.push(options.documentId);
      } else {
        sql += ', NULL)';
      }

      const result = await query<{ id: string; similarity: number }>(sql, params);

      if (result.rows.length === 0) {
        return [];
      }

      // Fetch full entry data with context
      const entryIds = result.rows.map(r => r.id);
      const fullEntries = await this.fetchEntriesWithContext(entryIds);

      // Map similarity scores to entries
      const similarityMap = new Map<string, number>(
        result.rows.map(r => [r.id, r.similarity])
      );

      return fullEntries.map(entry => ({
        entry,
        relevance: similarityMap.get(entry.id) || 0,
        matchType: 'semantic' as MatchType,
        highlights: this.highlightMatches(entry.content, searchQuery),
      }));
    } catch (error) {
      console.error('Semantic search error:', error);
      return [];
    }
  }

  /**
   * Hybrid search using Reciprocal Rank Fusion (RRF)
   * Falls back to fulltext-only if embeddings are unavailable
   */
  async hybridSearch(
    searchQuery: string,
    options: { limit?: number; documentId?: string } = {}
  ): Promise<RuleSearchResult[]> {
    const limit = options.limit || SEARCH_POOL_SIZE;

    // Run both searches in parallel (semantic will return empty if unavailable)
    const [fulltextResults, semanticResults] = await Promise.all([
      this.fulltextSearch(searchQuery, { limit: SEARCH_POOL_SIZE, documentId: options.documentId }),
      this.semanticSearch(searchQuery, { limit: SEARCH_POOL_SIZE, documentId: options.documentId }),
    ]);

    // If semantic search returned nothing, just return fulltext results
    if (semanticResults.length === 0) {
      return fulltextResults.slice(0, limit);
    }

    // If fulltext search returned nothing, just return semantic results
    if (fulltextResults.length === 0) {
      return semanticResults.slice(0, limit);
    }

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
        highlights: this.highlightMatches(entry.content, searchQuery),
      };
    });
  }

  /**
   * Generate highlighted snippets for search results
   */
  highlightMatches(content: string, searchQuery: string): string[] {
    const highlights: string[] = [];
    const words = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);

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

    const placeholders = entryIds.map((_, i) => `$${i + 1}`).join(', ');
    const result = await query<any>(
      `SELECT
        re.id, re.section_id, re.title, re.content, re.page_reference, re.order_index, re.created_at,
        rs.id as section_id_ref, rs.chapter_id, rs.title as section_title, rs.order_index as section_order,
        rs.page_start as section_page_start, rs.page_end as section_page_end, rs.created_at as section_created_at,
        rc.id as chapter_id_ref, rc.document_id, rc.title as chapter_title, rc.order_index as chapter_order,
        rc.page_start as chapter_page_start, rc.page_end as chapter_page_end, rc.created_at as chapter_created_at,
        sd.id as doc_id, sd.name as doc_name, sd.file_type, sd.file_hash, sd.total_pages,
        sd.ingested_at, sd.ingested_by, sd.status, sd.error_log, sd.created_at as doc_created_at, sd.updated_at as doc_updated_at
       FROM rule_entries re
       JOIN rule_sections rs ON re.section_id = rs.id
       JOIN rule_chapters rc ON rs.chapter_id = rc.id
       JOIN source_documents sd ON rc.document_id = sd.id
       WHERE re.id IN (${placeholders})`,
      entryIds
    );

    // Preserve original order
    const entryMap = new Map(
      result.rows.map(row => [row.id, this.transformToEntryWithContext(row)])
    );

    return entryIds
      .map(id => entryMap.get(id))
      .filter((e): e is RuleEntryWithContext => e !== undefined);
  }

  /**
   * Transform database row to RuleEntryWithContext
   */
  private transformToEntryWithContext(row: any): RuleEntryWithContext {
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
        id: row.section_id_ref,
        chapterId: row.chapter_id,
        title: row.section_title,
        orderIndex: row.section_order,
        pageStart: row.section_page_start,
        pageEnd: row.section_page_end,
        createdAt: new Date(row.section_created_at),
      },
      chapter: {
        id: row.chapter_id_ref,
        documentId: row.document_id,
        title: row.chapter_title,
        orderIndex: row.chapter_order,
        pageStart: row.chapter_page_start,
        pageEnd: row.chapter_page_end,
        createdAt: new Date(row.chapter_created_at),
      },
      document: {
        id: row.doc_id,
        name: row.doc_name,
        fileType: row.file_type,
        fileHash: row.file_hash,
        totalPages: row.total_pages,
        ingestedAt: new Date(row.ingested_at),
        ingestedBy: row.ingested_by,
        status: row.status,
        errorLog: row.error_log,
        createdAt: new Date(row.doc_created_at),
        updatedAt: new Date(row.doc_updated_at),
      },
    };
  }
}

/**
 * Factory function to create search service
 */
export function createSearchService(): RulesSearchService {
  return new RulesSearchService();
}

export default RulesSearchService;
