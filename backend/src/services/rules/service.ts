/**
 * Rules Service for Rules Explorer
 * Database-backed methods for browsing rules hierarchy
 *
 * Tasks: T023, T024
 */

import { db, query } from '../../config/database.js';
import {
  SourceDocument,
  RuleChapter,
  RuleSection,
  RuleEntry,
  RuleEntryWithContext,
  RuleCategory,
  RuleCitation,
  toSourceDocument,
  toRuleChapter,
  toRuleSection,
  toRuleEntry,
  toRuleCategory,
} from '../../models/rules.types.js';

/**
 * RulesService provides database-backed methods for browsing and retrieving rules
 */
export class RulesService {
  // ============== Document Methods ==============

  /**
   * Get all source documents
   */
  async getDocuments(): Promise<SourceDocument[]> {
    const result = await query<any>(
      `SELECT sd.*,
              (SELECT COUNT(*) FROM rule_chapters rc WHERE rc.document_id = sd.id) as chapter_count
       FROM source_documents sd
       WHERE sd.status = 'completed'
       ORDER BY sd.name`
    );

    return result.rows.map(row => ({
      ...toSourceDocument(row),
      chapterCount: parseInt(row.chapter_count || '0', 10),
    }));
  }

  /**
   * Get a single document by ID
   */
  async getDocument(documentId: string): Promise<SourceDocument | null> {
    const data = await db.findOne<any>('source_documents', { id: documentId });
    if (!data) return null;
    return toSourceDocument(data);
  }

  // ============== Chapter Methods ==============

  /**
   * Get chapters for a document
   */
  async getChapters(documentId: string): Promise<RuleChapter[]> {
    const result = await query<any>(
      `SELECT rc.*,
              (SELECT COUNT(*) FROM rule_sections rs WHERE rs.chapter_id = rc.id) as section_count
       FROM rule_chapters rc
       WHERE rc.document_id = $1
       ORDER BY rc.order_index`,
      [documentId]
    );

    return result.rows.map(row => ({
      ...toRuleChapter(row),
      sectionCount: parseInt(row.section_count || '0', 10),
    }));
  }

  /**
   * Get a single chapter by ID
   */
  async getChapter(chapterId: string): Promise<RuleChapter | null> {
    const data = await db.findOne<any>('rule_chapters', { id: chapterId });
    if (!data) return null;
    return toRuleChapter(data);
  }

  // ============== Section Methods ==============

  /**
   * Get sections for a chapter
   */
  async getSections(chapterId: string): Promise<RuleSection[]> {
    const result = await query<any>(
      `SELECT rs.*,
              (SELECT COUNT(*) FROM rule_entries re WHERE re.section_id = rs.id) as entry_count
       FROM rule_sections rs
       WHERE rs.chapter_id = $1
       ORDER BY rs.order_index`,
      [chapterId]
    );

    return result.rows.map(row => ({
      ...toRuleSection(row),
      entryCount: parseInt(row.entry_count || '0', 10),
    }));
  }

  /**
   * Get a single section by ID
   */
  async getSection(sectionId: string): Promise<RuleSection | null> {
    const data = await db.findOne<any>('rule_sections', { id: sectionId });
    if (!data) return null;
    return toRuleSection(data);
  }

  // ============== Entry Methods ==============

  /**
   * Get entries for a section
   */
  async getEntries(sectionId: string): Promise<RuleEntry[]> {
    const result = await query<any>(
      `SELECT re.id, re.section_id, re.title, re.content, re.page_reference, re.order_index, re.created_at
       FROM rule_entries re
       WHERE re.section_id = $1
       ORDER BY re.order_index`,
      [sectionId]
    );

    // Get categories for all entries
    const entryIds = result.rows.map((r: any) => r.id);
    const categories = await this.getCategoriesForEntries(entryIds);

    return result.rows.map(row => ({
      ...toRuleEntry(row),
      categories: categories.get(row.id) || [],
    }));
  }

  /**
   * Get a single entry by ID with full context
   */
  async getEntry(entryId: string): Promise<RuleEntryWithContext | null> {
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
       WHERE re.id = $1`,
      [entryId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    // Get categories for this entry
    const categories = await this.getCategoriesForEntries([entryId]);

    return {
      id: row.id,
      sectionId: row.section_id,
      title: row.title,
      content: row.content,
      contentEmbedding: null,
      pageReference: row.page_reference,
      orderIndex: row.order_index,
      createdAt: new Date(row.created_at),
      categories: categories.get(entryId) || [],
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

  /**
   * Helper to get categories for multiple entries
   */
  private async getCategoriesForEntries(entryIds: string[]): Promise<Map<string, RuleCategory[]>> {
    if (entryIds.length === 0) return new Map();

    const placeholders = entryIds.map((_, i) => `$${i + 1}`).join(', ');
    const result = await query<any>(
      `SELECT rec.entry_id, rc.id, rc.name, rc.description, rc.created_by, rc.created_at
       FROM rule_entry_categories rec
       JOIN rule_categories rc ON rec.category_id = rc.id
       WHERE rec.entry_id IN (${placeholders})`,
      entryIds
    );

    const map = new Map<string, RuleCategory[]>();
    for (const row of result.rows) {
      const categories = map.get(row.entry_id) || [];
      categories.push(toRuleCategory(row));
      map.set(row.entry_id, categories);
    }
    return map;
  }

  // ============== Category Methods ==============

  /**
   * Get all categories
   */
  async getCategories(): Promise<RuleCategory[]> {
    const result = await query<any>('SELECT * FROM rule_categories ORDER BY name');
    return result.rows.map(toRuleCategory);
  }

  /**
   * Get entries by category with pagination
   */
  async getEntriesByCategory(
    categoryId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ entries: RuleEntry[]; total: number }> {
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Get total count
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM rule_entry_categories WHERE category_id = $1',
      [categoryId]
    );
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    // Get entries
    const result = await query<any>(
      `SELECT re.id, re.section_id, re.title, re.content, re.page_reference, re.order_index, re.created_at
       FROM rule_entry_categories rec
       JOIN rule_entries re ON rec.entry_id = re.id
       WHERE rec.category_id = $1
       LIMIT $2 OFFSET $3`,
      [categoryId, limit, offset]
    );

    const entries = result.rows.map(toRuleEntry);

    return {
      entries,
      total,
    };
  }

  /**
   * Create a new category (admin only)
   */
  async createCategory(
    name: string,
    description: string | null,
    createdBy: string
  ): Promise<RuleCategory> {
    try {
      const data = await db.insert<any>('rule_categories', {
        name,
        description,
        created_by: createdBy,
        created_at: new Date(),
      });

      if (!data) {
        throw new Error('Failed to create category');
      }

      return toRuleCategory(data);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Category name already exists');
      }
      throw error;
    }
  }

  /**
   * Add an entry to a category
   */
  async addEntryToCategory(entryId: string, categoryId: string): Promise<void> {
    try {
      await db.insert('rule_entry_categories', {
        entry_id: entryId,
        category_id: categoryId,
      });
    } catch (error: any) {
      // Ignore duplicate key errors
      if (error.code !== '23505') {
        throw new Error(`Failed to add entry to category: ${error.message}`);
      }
    }
  }

  /**
   * Remove an entry from a category
   */
  async removeEntryFromCategory(
    entryId: string,
    categoryId: string
  ): Promise<void> {
    await query(
      'DELETE FROM rule_entry_categories WHERE entry_id = $1 AND category_id = $2',
      [entryId, categoryId]
    );
  }

  // ============== Citation Methods ==============

  /**
   * Generate citation for a rule entry
   */
  async generateCitation(entryId: string): Promise<RuleCitation | null> {
    const entry = await this.getEntry(entryId);
    if (!entry) return null;

    // Create excerpt (first 100 chars of content)
    const excerpt =
      entry.content.length > 100
        ? entry.content.slice(0, 100) + '...'
        : entry.content;

    return {
      ruleId: entry.id,
      title: entry.title || entry.section.title,
      excerpt,
      source: {
        document: entry.document.name,
        chapter: entry.chapter.title,
        section: entry.section.title,
        page: entry.pageReference,
      },
      relevance: 1.0,
    };
  }

  /**
   * Generate citations for multiple entries
   */
  async generateCitations(entryIds: string[]): Promise<RuleCitation[]> {
    const citations: RuleCitation[] = [];

    for (const entryId of entryIds) {
      const citation = await this.generateCitation(entryId);
      if (citation) {
        citations.push(citation);
      }
    }

    return citations;
  }
}

/**
 * Factory function to create rules service
 */
export function createRulesService(): RulesService {
  return new RulesService();
}

export default RulesService;
