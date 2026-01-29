/**
 * DM Integration for Rules Explorer
 * Provides rules context and citations for the AI DM Service
 *
 * Task: T051, T052
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../models/database.types.js';
import { RulesSearchService, createSearchService } from './search.js';
import { RulesService, createRulesService } from './service.js';
import { RuleCitation } from '../../models/rules.types.js';

/**
 * Citation format compatible with DMService
 */
export interface DMRuleCitation {
  ruleId: string;
  title: string;
  source: string;
  excerpt: string;
  relevance?: number;
}

/**
 * Rules context for AI prompts
 */
export interface RulesContext {
  context: string;
  citations: DMRuleCitation[];
}

/**
 * DMRulesService provides rules lookup for AI DM
 * Uses the database-backed Rules Explorer search
 */
export class DMRulesService {
  private searchService: RulesSearchService;
  private rulesService: RulesService;
  private initialized: boolean = false;

  constructor(client: SupabaseClient<Database>) {
    this.searchService = createSearchService(client);
    this.rulesService = createRulesService(client);
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    // Check if we have any documents in the database
    try {
      const documents = await this.rulesService.getDocuments();
      this.initialized = documents.length > 0;
    } catch (error) {
      console.warn('DMRulesService: Failed to check documents:', error);
      this.initialized = false;
    }
  }

  /**
   * Check if the service has rules available
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get rules context for an AI prompt
   * Uses hybrid search to find relevant rules
   *
   * @param situation - Description of the game situation
   * @param maxTokens - Approximate maximum tokens for context (default 2000)
   * @returns Rules context and citations
   */
  async getRulesContext(
    situation: string,
    maxTokens: number = 2000
  ): Promise<RulesContext> {
    if (!this.initialized) {
      return { context: '', citations: [] };
    }

    try {
      // Search for relevant rules using hybrid search
      const searchResponse = await this.searchService.search({
        query: situation,
        mode: 'hybrid',
        limit: 5,
      });

      const citations: DMRuleCitation[] = [];
      let context = '';
      let tokenEstimate = 0;

      for (const result of searchResponse.results) {
        const entry = result.entry;

        // Build source string
        const source = [
          entry.document.name,
          entry.chapter.title,
          entry.section.title,
          entry.pageReference ? `p. ${entry.pageReference}` : null,
        ]
          .filter(Boolean)
          .join(' > ');

        // Format the rule for AI context
        const ruleText = `## ${entry.title || entry.section.title}\n${entry.content}\n\n`;
        const textTokens = Math.ceil(ruleText.length / 4);

        // Check if we have room for this rule
        if (tokenEstimate + textTokens > maxTokens) break;

        context += ruleText;
        tokenEstimate += textTokens;

        // Create citation
        const excerpt =
          entry.content.length > 100
            ? entry.content.slice(0, 100) + '...'
            : entry.content;

        citations.push({
          ruleId: entry.id,
          title: entry.title || entry.section.title,
          source,
          excerpt,
          relevance: result.relevance,
        });
      }

      return { context, citations };
    } catch (error) {
      console.error('DMRulesService: Search error:', error);
      return { context: '', citations: [] };
    }
  }

  /**
   * Get combat-specific rules context
   */
  async getCombatRulesContext(
    action: string,
    maxTokens: number = 2000
  ): Promise<RulesContext> {
    return this.getRulesContext(`combat ${action}`, maxTokens);
  }

  /**
   * Get spellcasting-specific rules context
   */
  async getSpellcastingRulesContext(
    spellOrAction: string,
    maxTokens: number = 2000
  ): Promise<RulesContext> {
    return this.getRulesContext(`spell casting ${spellOrAction}`, maxTokens);
  }

  /**
   * Generate a citation object for a specific rule entry
   */
  async generateCitation(entryId: string): Promise<RuleCitation | null> {
    return this.rulesService.generateCitation(entryId);
  }

  /**
   * Generate citations for multiple entries
   */
  async generateCitations(entryIds: string[]): Promise<RuleCitation[]> {
    return this.rulesService.generateCitations(entryIds);
  }

  /**
   * Search for a specific rule by query
   */
  async searchRules(
    query: string,
    limit: number = 10
  ): Promise<DMRuleCitation[]> {
    if (!this.initialized) {
      return [];
    }

    try {
      const searchResponse = await this.searchService.search({
        query,
        mode: 'hybrid',
        limit,
      });

      return searchResponse.results.map((result) => {
        const entry = result.entry;
        const source = [
          entry.document.name,
          entry.chapter.title,
          entry.section.title,
          entry.pageReference ? `p. ${entry.pageReference}` : null,
        ]
          .filter(Boolean)
          .join(' > ');

        const excerpt =
          entry.content.length > 100
            ? entry.content.slice(0, 100) + '...'
            : entry.content;

        return {
          ruleId: entry.id,
          title: entry.title || entry.section.title,
          source,
          excerpt,
          relevance: result.relevance,
        };
      });
    } catch (error) {
      console.error('DMRulesService: Search error:', error);
      return [];
    }
  }
}

/**
 * Factory function to create DM rules service
 */
export function createDMRulesService(
  client: SupabaseClient<Database>
): DMRulesService {
  return new DMRulesService(client);
}

export default DMRulesService;
