/**
 * Rules Service for Rules Explorer
 * Database-backed methods for browsing rules hierarchy
 *
 * Tasks: T023, T024
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../models/database.types.js';
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

// Type alias for looser Supabase client typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any>;

/**
 * RulesService provides database-backed methods for browsing and retrieving rules
 */
export class RulesService {
  private client: DbClient;

  constructor(client: SupabaseClient<Database>) {
    this.client = client as DbClient;
  }

  // ============== Document Methods ==============

  /**
   * Get all source documents
   */
  async getDocuments(): Promise<SourceDocument[]> {
    const { data, error } = await this.client
      .from('source_documents')
      .select('*, rule_chapters(count)')
      .eq('status', 'completed')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    return (data || []).map(row => ({
      ...toSourceDocument(row as any),
      chapterCount: (row as any).rule_chapters?.[0]?.count || 0,
    }));
  }

  /**
   * Get a single document by ID
   */
  async getDocument(documentId: string): Promise<SourceDocument | null> {
    const { data, error } = await this.client
      .from('source_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !data) {
      return null;
    }

    return toSourceDocument(data as any);
  }

  // ============== Chapter Methods ==============

  /**
   * Get chapters for a document
   */
  async getChapters(documentId: string): Promise<RuleChapter[]> {
    const { data, error } = await this.client
      .from('rule_chapters')
      .select('*, rule_sections(count)')
      .eq('document_id', documentId)
      .order('order_index');

    if (error) {
      throw new Error(`Failed to fetch chapters: ${error.message}`);
    }

    return (data || []).map(row => ({
      ...toRuleChapter(row as any),
      sectionCount: (row as any).rule_sections?.[0]?.count || 0,
    }));
  }

  /**
   * Get a single chapter by ID
   */
  async getChapter(chapterId: string): Promise<RuleChapter | null> {
    const { data, error } = await this.client
      .from('rule_chapters')
      .select('*')
      .eq('id', chapterId)
      .single();

    if (error || !data) {
      return null;
    }

    return toRuleChapter(data as any);
  }

  // ============== Section Methods ==============

  /**
   * Get sections for a chapter
   */
  async getSections(chapterId: string): Promise<RuleSection[]> {
    const { data, error } = await this.client
      .from('rule_sections')
      .select('*, rule_entries(count)')
      .eq('chapter_id', chapterId)
      .order('order_index');

    if (error) {
      throw new Error(`Failed to fetch sections: ${error.message}`);
    }

    return (data || []).map(row => ({
      ...toRuleSection(row as any),
      entryCount: (row as any).rule_entries?.[0]?.count || 0,
    }));
  }

  /**
   * Get a single section by ID
   */
  async getSection(sectionId: string): Promise<RuleSection | null> {
    const { data, error } = await this.client
      .from('rule_sections')
      .select('*')
      .eq('id', sectionId)
      .single();

    if (error || !data) {
      return null;
    }

    return toRuleSection(data as any);
  }

  // ============== Entry Methods ==============

  /**
   * Get entries for a section
   */
  async getEntries(sectionId: string): Promise<RuleEntry[]> {
    const { data, error } = await this.client
      .from('rule_entries')
      .select(
        `
        id, section_id, title, content, page_reference, order_index, created_at,
        rule_entry_categories (
          rule_categories (id, name, description, created_by, created_at)
        )
      `
      )
      .eq('section_id', sectionId)
      .order('order_index');

    if (error) {
      throw new Error(`Failed to fetch entries: ${error.message}`);
    }

    return (data || []).map(row => ({
      ...toRuleEntry(row as any),
      categories: (row as any).rule_entry_categories?.map(
        (rec: any) => toRuleCategory(rec.rule_categories)
      ) || [],
    }));
  }

  /**
   * Get a single entry by ID with full context
   */
  async getEntry(entryId: string): Promise<RuleEntryWithContext | null> {
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
        ),
        rule_entry_categories (
          rule_categories (id, name, description, created_by, created_at)
        )
      `
      )
      .eq('id', entryId)
      .single();

    if (error || !data) {
      return null;
    }

    const row = data as any;
    const section = row.rule_sections;
    const chapter = section.rule_chapters;
    const document = chapter.source_documents;

    return {
      id: row.id,
      sectionId: row.section_id,
      title: row.title,
      content: row.content,
      contentEmbedding: null,
      pageReference: row.page_reference,
      orderIndex: row.order_index,
      createdAt: new Date(row.created_at),
      categories: row.rule_entry_categories?.map(
        (rec: any) => toRuleCategory(rec.rule_categories)
      ) || [],
      section: toRuleSection(section),
      chapter: toRuleChapter(chapter),
      document: toSourceDocument(document),
    };
  }

  // ============== Category Methods ==============

  /**
   * Get all categories
   */
  async getCategories(): Promise<RuleCategory[]> {
    const { data, error } = await this.client
      .from('rule_categories')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return (data || []).map(row => toRuleCategory(row as any));
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
    const { count } = await this.client
      .from('rule_entry_categories')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    // Get entries
    const { data, error } = await this.client
      .from('rule_entry_categories')
      .select(
        `
        rule_entries (
          id, section_id, title, content, page_reference, order_index, created_at
        )
      `
      )
      .eq('category_id', categoryId)
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch entries by category: ${error.message}`);
    }

    const entries = (data || [])
      .map(row => (row as any).rule_entries)
      .filter(Boolean)
      .map(entry => toRuleEntry(entry));

    return {
      entries,
      total: count || 0,
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
    const { data, error } = await this.client
      .from('rule_categories')
      .insert({
        name,
        description,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique violation
        throw new Error('Category name already exists');
      }
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return toRuleCategory(data as any);
  }

  /**
   * Add an entry to a category
   */
  async addEntryToCategory(entryId: string, categoryId: string): Promise<void> {
    const { error } = await this.client
      .from('rule_entry_categories')
      .insert({ entry_id: entryId, category_id: categoryId });

    if (error && error.code !== '23505') {
      // Ignore duplicate key errors
      throw new Error(`Failed to add entry to category: ${error.message}`);
    }
  }

  /**
   * Remove an entry from a category
   */
  async removeEntryFromCategory(
    entryId: string,
    categoryId: string
  ): Promise<void> {
    const { error } = await this.client
      .from('rule_entry_categories')
      .delete()
      .eq('entry_id', entryId)
      .eq('category_id', categoryId);

    if (error) {
      throw new Error(`Failed to remove entry from category: ${error.message}`);
    }
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
export function createRulesService(
  client: SupabaseClient<Database>
): RulesService {
  return new RulesService(client);
}

export default RulesService;
