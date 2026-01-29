// Search Service - T008
// Search orchestration for handbook content with hybrid search

import { query } from '../../config/database.js';
import { rowsToCamelCase } from './contentService.js';

// Types
export type ContentType =
  | 'spell'
  | 'monster'
  | 'item'
  | 'class'
  | 'race'
  | 'rule'
  | 'feat'
  | 'background'
  | 'condition';

export interface SearchResult {
  type: ContentType;
  id: string;
  name: string;
  slug: string;
  score: number;
  excerpt: string;
  attributes: Record<string, unknown>;
}

export interface SearchResultGroup {
  type: ContentType;
  count: number;
  results: SearchResult[];
}

export interface SearchResponse {
  query: string;
  total: number;
  groups: SearchResultGroup[];
}

export interface Citation {
  type: ContentType;
  id: string;
  slug: string;
  name: string;
  excerpt: string;
}

export interface SearchOptions {
  types?: ContentType[];
  limit?: number;
  useSemanticSearch?: boolean;
}

// Query intent classification patterns
const TYPE_INDICATORS: Record<ContentType, string[]> = {
  spell: ['spell', 'cantrip', 'cast', 'magic', 'evocation', 'conjuration', 'abjuration', 'necromancy', 'divination', 'enchantment', 'illusion', 'transmutation'],
  monster: ['monster', 'creature', 'beast', 'enemy', 'cr', 'challenge rating', 'dragon', 'goblin', 'orc'],
  item: ['weapon', 'armor', 'item', 'equipment', 'magic item', 'sword', 'shield', 'potion'],
  class: ['class', 'fighter', 'wizard', 'rogue', 'cleric', 'paladin', 'ranger', 'barbarian', 'bard', 'druid', 'monk', 'sorcerer', 'warlock'],
  race: ['race', 'elf', 'dwarf', 'human', 'halfling', 'gnome', 'tiefling', 'dragonborn', 'half-orc', 'half-elf'],
  rule: ['rule', 'how do', 'what happens', 'can i', 'when', 'combat', 'saving throw', 'ability check'],
  feat: ['feat', 'ability', 'special ability'],
  background: ['background', 'backstory', 'proficiency'],
  condition: ['condition', 'grappled', 'stunned', 'paralyzed', 'frightened', 'charmed', 'blinded', 'deafened', 'prone', 'restrained', 'incapacitated', 'exhaustion', 'invisible', 'petrified', 'poisoned'],
};

/**
 * Infer content type from query text
 */
export function inferQueryIntent(queryText: string): ContentType[] {
  const lowerQuery = queryText.toLowerCase();
  const matchedTypes: ContentType[] = [];

  for (const [type, indicators] of Object.entries(TYPE_INDICATORS)) {
    for (const indicator of indicators) {
      if (lowerQuery.includes(indicator)) {
        matchedTypes.push(type as ContentType);
        break;
      }
    }
  }

  return matchedTypes.length > 0 ? matchedTypes : ['spell', 'monster', 'item', 'class', 'race', 'rule'];
}

/**
 * Extract numeric filters from query (spell level, CR range)
 */
export function extractNumericFilters(queryText: string): { level?: number; crMin?: number; crMax?: number } {
  const filters: { level?: number; crMin?: number; crMax?: number } = {};

  // Match spell level patterns like "level 3", "3rd level"
  const levelMatch = queryText.match(/level\s*(\d+)|(\d+)(?:st|nd|rd|th)\s*level/i);
  if (levelMatch) {
    filters.level = parseInt(levelMatch[1] || levelMatch[2], 10);
  }

  // Match CR patterns like "CR 5", "challenge rating 1-5"
  const crMatch = queryText.match(/cr\s*(\d+(?:\.\d+)?)\s*(?:-|to)?\s*(\d+(?:\.\d+)?)?/i);
  if (crMatch) {
    filters.crMin = parseFloat(crMatch[1]);
    if (crMatch[2]) {
      filters.crMax = parseFloat(crMatch[2]);
    }
  }

  return filters;
}

/**
 * Generate embedding for a search query using OpenAI
 * Falls back gracefully if OpenAI is not configured
 */
export async function generateQueryEmbedding(queryText: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not configured, skipping semantic search');
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: queryText,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI embedding request failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return null;
  }
}

/**
 * Full-text search across specified tables
 */
export async function fullTextSearch(
  queryText: string,
  types: ContentType[],
  limit: number = 20
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Search rules if included
  if (types.includes('rule')) {
    const rulesQuery = `
      SELECT
        id, title as name, slug,
        ts_rank(search_vector, websearch_to_tsquery('english', $1)) as score,
        substring(content, 1, 200) as excerpt
      FROM rule_entries
      WHERE search_vector @@ websearch_to_tsquery('english', $1)
      ORDER BY score DESC
      LIMIT $2
    `;
    try {
      const rulesResult = await query(rulesQuery, [queryText, limit]);
      results.push(...rulesResult.rows.map((row: Record<string, unknown>) => ({
        type: 'rule' as ContentType,
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        score: parseFloat(row.score as string) || 0,
        excerpt: row.excerpt as string,
        attributes: {},
      })));
    } catch {
      // Table may not exist yet, skip
    }
  }

  // Search spells if included
  if (types.includes('spell')) {
    const spellsQuery = `
      SELECT
        id, name, slug, level, school,
        ts_rank(to_tsvector('english', name || ' ' || coalesce(description, '')),
                websearch_to_tsquery('english', $1)) as score,
        substring(description, 1, 200) as excerpt
      FROM spells
      WHERE to_tsvector('english', name || ' ' || coalesce(description, ''))
            @@ websearch_to_tsquery('english', $1)
      ORDER BY score DESC
      LIMIT $2
    `;
    try {
      const spellsResult = await query(spellsQuery, [queryText, limit]);
      results.push(...spellsResult.rows.map((row: Record<string, unknown>) => ({
        type: 'spell' as ContentType,
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        score: parseFloat(row.score as string) || 0,
        excerpt: row.excerpt as string,
        attributes: { level: row.level, school: row.school },
      })));
    } catch {
      // Table may not exist yet, skip
    }
  }

  // Search monsters if included
  if (types.includes('monster')) {
    const monstersQuery = `
      SELECT
        id, name, slug, size, monster_type, challenge_rating, armor_class, hit_points,
        ts_rank(to_tsvector('english', name || ' ' || coalesce(description, '')),
                websearch_to_tsquery('english', $1)) as score,
        substring(description, 1, 200) as excerpt
      FROM monsters
      WHERE to_tsvector('english', name || ' ' || coalesce(description, ''))
            @@ websearch_to_tsquery('english', $1)
      ORDER BY score DESC
      LIMIT $2
    `;
    try {
      const monstersResult = await query(monstersQuery, [queryText, limit]);
      results.push(...monstersResult.rows.map((row: Record<string, unknown>) => ({
        type: 'monster' as ContentType,
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        score: parseFloat(row.score as string) || 0,
        excerpt: (row.excerpt as string) || '',
        attributes: rowsToCamelCase([row as Record<string, unknown>])[0],
      })));
    } catch {
      // Table may not exist yet, skip
    }
  }

  // Search items if included
  if (types.includes('item')) {
    const itemsQuery = `
      SELECT
        id, name, slug, item_type, rarity,
        ts_rank(to_tsvector('english', name || ' ' || coalesce(description, '')),
                websearch_to_tsquery('english', $1)) as score,
        substring(description, 1, 200) as excerpt
      FROM items
      WHERE to_tsvector('english', name || ' ' || coalesce(description, ''))
            @@ websearch_to_tsquery('english', $1)
      ORDER BY score DESC
      LIMIT $2
    `;
    try {
      const itemsResult = await query(itemsQuery, [queryText, limit]);
      results.push(...itemsResult.rows.map((row: Record<string, unknown>) => ({
        type: 'item' as ContentType,
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        score: parseFloat(row.score as string) || 0,
        excerpt: (row.excerpt as string) || '',
        attributes: { itemType: row.item_type, rarity: row.rarity },
      })));
    } catch {
      // Table may not exist yet, skip
    }
  }

  // Search classes if included
  if (types.includes('class')) {
    const classesQuery = `
      SELECT
        id, name, slug, hit_die, primary_ability,
        ts_rank(to_tsvector('english', name || ' ' || coalesce(description, '')),
                websearch_to_tsquery('english', $1)) as score,
        substring(description, 1, 200) as excerpt
      FROM classes
      WHERE to_tsvector('english', name || ' ' || coalesce(description, ''))
            @@ websearch_to_tsquery('english', $1)
      ORDER BY score DESC
      LIMIT $2
    `;
    try {
      const classesResult = await query(classesQuery, [queryText, limit]);
      results.push(...classesResult.rows.map((row: Record<string, unknown>) => ({
        type: 'class' as ContentType,
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        score: parseFloat(row.score as string) || 0,
        excerpt: (row.excerpt as string) || '',
        attributes: { hitDie: row.hit_die, primaryAbility: row.primary_ability },
      })));
    } catch {
      // Table may not exist yet, skip
    }
  }

  // Search conditions if included
  if (types.includes('condition')) {
    const conditionsQuery = `
      SELECT
        id, name, slug,
        ts_rank(to_tsvector('english', name || ' ' || coalesce(description, '')),
                websearch_to_tsquery('english', $1)) as score,
        substring(description, 1, 200) as excerpt
      FROM conditions
      WHERE to_tsvector('english', name || ' ' || coalesce(description, ''))
            @@ websearch_to_tsquery('english', $1)
      ORDER BY score DESC
      LIMIT $2
    `;
    try {
      const conditionsResult = await query(conditionsQuery, [queryText, limit]);
      results.push(...conditionsResult.rows.map((row: Record<string, unknown>) => ({
        type: 'condition' as ContentType,
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        score: parseFloat(row.score as string) || 0,
        excerpt: (row.excerpt as string) || '',
        attributes: {},
      })));
    } catch {
      // Table may not exist yet, skip
    }
  }

  return results;
}

/**
 * Semantic search using vector similarity
 */
export async function semanticSearch(
  embedding: number[],
  types: ContentType[],
  limit: number = 20
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const embeddingStr = `[${embedding.join(',')}]`;

  // Search rules with semantic similarity
  if (types.includes('rule')) {
    const rulesQuery = `
      SELECT
        id, title as name, slug,
        1 - (content_embedding <=> $1::vector) as score,
        substring(content, 1, 200) as excerpt
      FROM rule_entries
      WHERE content_embedding IS NOT NULL
      ORDER BY content_embedding <=> $1::vector
      LIMIT $2
    `;
    try {
      const rulesResult = await query(rulesQuery, [embeddingStr, limit]);
      results.push(...rulesResult.rows.map((row: Record<string, unknown>) => ({
        type: 'rule' as ContentType,
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        score: parseFloat(row.score as string) || 0,
        excerpt: (row.excerpt as string) || '',
        attributes: {},
      })));
    } catch {
      // Table or column may not exist, skip
    }
  }

  // Similar pattern for other content types with embedding columns...
  // (spells, monsters, items, classes all have embedding columns per data-model.md)

  return results;
}

/**
 * Reciprocal Rank Fusion to combine search results
 */
export function reciprocalRankFusion(
  ...resultSets: SearchResult[][]
): SearchResult[] {
  const k = 60; // RRF constant
  const scoreMap = new Map<string, { result: SearchResult; score: number }>();

  for (const results of resultSets) {
    results.forEach((result, rank) => {
      const key = `${result.type}:${result.id}`;
      const rrfScore = 1 / (k + rank + 1);

      if (scoreMap.has(key)) {
        const existing = scoreMap.get(key)!;
        existing.score += rrfScore;
      } else {
        scoreMap.set(key, { result, score: rrfScore });
      }
    });
  }

  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .map(({ result, score }) => ({ ...result, score }));
}

/**
 * Group search results by content type
 */
export function groupResultsByType(results: SearchResult[]): SearchResultGroup[] {
  const groups = new Map<ContentType, SearchResult[]>();

  for (const result of results) {
    if (!groups.has(result.type)) {
      groups.set(result.type, []);
    }
    groups.get(result.type)!.push(result);
  }

  return Array.from(groups.entries())
    .map(([type, results]) => ({
      type,
      count: results.length,
      results,
    }))
    .sort((a, b) => {
      // Sort by highest scoring result in each group
      const aMaxScore = Math.max(...a.results.map(r => r.score));
      const bMaxScore = Math.max(...b.results.map(r => r.score));
      return bMaxScore - aMaxScore;
    });
}

/**
 * Hybrid search combining full-text and semantic search
 */
export async function hybridSearch(
  queryText: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  const { types, limit = 20, useSemanticSearch = true } = options;

  // Infer types if not provided
  const searchTypes = types || inferQueryIntent(queryText);

  // Run full-text search
  const fullTextResults = await fullTextSearch(queryText, searchTypes, limit);

  // Run semantic search if enabled and configured
  let semanticResults: SearchResult[] = [];
  if (useSemanticSearch) {
    const embedding = await generateQueryEmbedding(queryText);
    if (embedding) {
      semanticResults = await semanticSearch(embedding, searchTypes, limit);
    }
  }

  // Combine with RRF
  const combinedResults = semanticResults.length > 0
    ? reciprocalRankFusion(fullTextResults, semanticResults)
    : fullTextResults;

  // Group by type
  const groups = groupResultsByType(combinedResults.slice(0, limit));

  return {
    query: queryText,
    total: combinedResults.length,
    groups,
  };
}

/**
 * Get relevant content for AI DM context
 */
export async function getContext(queryText: string, limit: number = 5): Promise<Citation[]> {
  const searchResponse = await hybridSearch(queryText, { limit });

  const citations: Citation[] = [];
  for (const group of searchResponse.groups) {
    for (const result of group.results.slice(0, limit - citations.length)) {
      citations.push({
        type: result.type,
        id: result.id,
        slug: result.slug,
        name: result.name,
        excerpt: result.excerpt,
      });

      if (citations.length >= limit) break;
    }
    if (citations.length >= limit) break;
  }

  return citations;
}
