/**
 * Full Text Search Service
 * T101: Implement FullTextSearchService using PostgreSQL full-text search
 */

import { query as dbQuery } from '../../config/database.js';
import {
  SearchResultItem,
  ContentType,
  ContentCategory,
  SearchResponse,
  CATEGORY_LABELS,
} from '../../types/search.types.js';

interface SearchOptions {
  query: string;
  categories?: ContentCategory[];
  limit?: number;
}

interface SearchGroup {
  category: ContentCategory;
  categoryLabel: string;
  items: SearchResultItem[];
  totalCount: number;
}

/**
 * Perform full-text search across all content tables
 */
export async function fullTextSearch(options: SearchOptions): Promise<SearchResponse> {
  const { query, categories, limit = 50 } = options;

  if (!query.trim()) {
    return {
      query,
      mode: 'full-text',
      totalResults: 0,
      groups: [],
    };
  }

  // Convert query to tsquery format (add :* for prefix matching)
  const tsQuery = query
    .trim()
    .split(/\s+/)
    .filter(term => term.length > 0)
    .map(term => `${term}:*`)
    .join(' & ');

  const searchTables = getSearchTables(categories);
  const allResults: SearchResultItem[] = [];

  // Search each table in parallel
  const searchPromises = searchTables.map(table =>
    searchTable(table, tsQuery, limit)
  );

  const tableResults = await Promise.all(searchPromises);

  // Combine all results
  for (const results of tableResults) {
    allResults.push(...results);
  }

  // Sort by rank (highest first)
  allResults.sort((a, b) => b.rank - a.rank);

  // Group results by category
  const groups = groupResultsByCategory(allResults.slice(0, limit));

  return {
    query,
    mode: 'full-text',
    totalResults: allResults.length,
    groups,
    suggestions: allResults.length === 0 ? generateSuggestions(query) : undefined,
  };
}

interface TableConfig {
  name: string;
  type: ContentType;
  category: ContentCategory;
  titleColumn: string;
  snippetColumn: string;
  sourceDocColumn: string;
  sourcePageColumn: string;
}

const TABLE_CONFIGS: TableConfig[] = [
  {
    name: 'rules',
    type: 'rule',
    category: 'rules',
    titleColumn: 'title',
    snippetColumn: 'summary',
    sourceDocColumn: 'source_document',
    sourcePageColumn: 'source_page',
  },
  {
    name: 'classes',
    type: 'class',
    category: 'classes',
    titleColumn: 'name',
    snippetColumn: 'description',
    sourceDocColumn: 'source_document',
    sourcePageColumn: 'source_page',
  },
  {
    name: 'races',
    type: 'race',
    category: 'races',
    titleColumn: 'name',
    snippetColumn: 'description',
    sourceDocColumn: 'source_document',
    sourcePageColumn: 'source_page',
  },
  {
    name: 'spells',
    type: 'spell',
    category: 'spells',
    titleColumn: 'name',
    snippetColumn: 'description',
    sourceDocColumn: 'source_document',
    sourcePageColumn: 'source_page',
  },
  {
    name: 'monsters',
    type: 'monster',
    category: 'bestiary',
    titleColumn: 'name',
    snippetColumn: 'description',
    sourceDocColumn: 'source_document',
    sourcePageColumn: 'source_page',
  },
  {
    name: 'items',
    type: 'item',
    category: 'items',
    titleColumn: 'name',
    snippetColumn: 'description',
    sourceDocColumn: 'source_document',
    sourcePageColumn: 'source_page',
  },
  {
    name: 'backgrounds',
    type: 'background',
    category: 'backgrounds',
    titleColumn: 'name',
    snippetColumn: 'description',
    sourceDocColumn: 'source_document',
    sourcePageColumn: 'source_page',
  },
  {
    name: 'feats',
    type: 'feat',
    category: 'feats',
    titleColumn: 'name',
    snippetColumn: 'description',
    sourceDocColumn: 'source_document',
    sourcePageColumn: 'source_page',
  },
  {
    name: 'conditions',
    type: 'condition',
    category: 'conditions',
    titleColumn: 'name',
    snippetColumn: 'description',
    sourceDocColumn: 'source_document',
    sourcePageColumn: 'source_page',
  },
  {
    name: 'skills',
    type: 'skill',
    category: 'skills',
    titleColumn: 'name',
    snippetColumn: 'description',
    sourceDocColumn: 'source_document',
    sourcePageColumn: 'source_page',
  },
];

function getSearchTables(categories?: ContentCategory[]): TableConfig[] {
  if (!categories || categories.length === 0) {
    return TABLE_CONFIGS;
  }
  return TABLE_CONFIGS.filter(config => categories.includes(config.category));
}

async function searchTable(
  config: TableConfig,
  tsQuery: string,
  limit: number
): Promise<SearchResultItem[]> {
  const sqlQuery = `
    SELECT
      id,
      ${config.titleColumn} as title,
      slug,
      COALESCE(${config.snippetColumn}, '') as snippet,
      ${config.sourceDocColumn} as source_document,
      ${config.sourcePageColumn} as source_page,
      ts_rank(search_vector, to_tsquery('english', $1)) as rank
    FROM ${config.name}
    WHERE search_vector @@ to_tsquery('english', $1)
    ORDER BY rank DESC
    LIMIT $2
  `;

  try {
    const result = await dbQuery(sqlQuery, [tsQuery, limit]);

    return result.rows.map(row => ({
      id: row.id,
      type: config.type,
      title: row.title,
      slug: row.slug,
      category: config.category,
      snippet: truncateSnippet(row.snippet, 150),
      rank: parseFloat(row.rank) || 0,
      source: {
        document: row.source_document,
        page: row.source_page,
      },
    }));
  } catch (error) {
    console.error(`Error searching ${config.name}:`, error);
    return [];
  }
}

function truncateSnippet(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

function groupResultsByCategory(results: SearchResultItem[]): SearchGroup[] {
  const groupMap = new Map<ContentCategory, SearchResultItem[]>();

  for (const result of results) {
    const existing = groupMap.get(result.category) || [];
    existing.push(result);
    groupMap.set(result.category, existing);
  }

  const groups: SearchGroup[] = [];

  for (const [category, items] of groupMap.entries()) {
    groups.push({
      category,
      categoryLabel: CATEGORY_LABELS[category],
      items,
      totalCount: items.length,
    });
  }

  // Sort groups by total count (most results first)
  groups.sort((a, b) => b.totalCount - a.totalCount);

  return groups;
}

function generateSuggestions(query: string): string[] {
  const suggestions: string[] = [];
  const trimmed = query.trim().toLowerCase();

  // Common D&D search terms
  const commonTerms = [
    'spell', 'magic', 'attack', 'damage', 'armor', 'weapon',
    'skill', 'check', 'saving throw', 'ability', 'feat',
    'race', 'class', 'monster', 'creature', 'combat',
  ];

  for (const term of commonTerms) {
    if (term.includes(trimmed) || trimmed.includes(term)) {
      suggestions.push(`Try searching for "${term}"`);
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('Try using different keywords');
    suggestions.push('Check your spelling');
    suggestions.push('Use more general terms');
  }

  return suggestions.slice(0, 3);
}

export default {
  fullTextSearch,
};
