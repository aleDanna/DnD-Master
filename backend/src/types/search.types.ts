// Search and navigation types for Rules Explorer
// T026: Create SearchResult and NavigationTree types

import { ContentCategory, ContentType, SourceCitation } from './content.types';

// ============================================
// Search Types
// ============================================

/**
 * Search mode options
 */
export type SearchMode = 'full-text' | 'semantic' | 'hybrid';

/**
 * Individual search result item
 */
export interface SearchResultItem {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  category: ContentCategory;
  snippet: string;
  rank: number;
  source: SourceCitation;
}

/**
 * Grouped search results by category
 */
export interface SearchResultGroup {
  category: ContentCategory;
  categoryLabel: string;
  items: SearchResultItem[];
  totalCount: number;
}

/**
 * Complete search response
 */
export interface SearchResponse {
  query: string;
  mode: SearchMode;
  totalResults: number;
  groups: SearchResultGroup[];
  suggestions?: string[];
}

/**
 * Search request parameters
 */
export interface SearchRequest {
  q: string;
  type?: SearchMode;
  categories?: ContentCategory[];
  limit?: number;
}

/**
 * Database search result row (from UNION query)
 */
export interface SearchResultRow {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  snippet: string;
  rank: number;
  source_document: string | null;
  source_page: number | null;
}

// ============================================
// Navigation Tree Types
// ============================================

/**
 * Navigation tree node
 */
export interface NavigationNode {
  id: string;
  label: string;
  slug: string;
  type: 'category' | 'item';
  path: string;
  children?: NavigationNode[];
  itemCount?: number;
}

/**
 * Top-level navigation category
 */
export interface NavigationCategory {
  id: string;
  label: string;
  slug: string;
  icon?: string;
  path: string;
  children: NavigationNode[];
}

/**
 * Complete navigation tree
 */
export interface NavigationTree {
  categories: NavigationCategory[];
  lastUpdated: Date;
}

/**
 * Breadcrumb item for location display
 */
export interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
}

// ============================================
// Category Labels
// ============================================

/**
 * Human-readable labels for content categories
 */
export const CATEGORY_LABELS: Record<ContentCategory, string> = {
  rules: 'Rules',
  classes: 'Classes',
  races: 'Races',
  spells: 'Spells',
  bestiary: 'Bestiary',
  items: 'Items',
  backgrounds: 'Backgrounds',
  feats: 'Feats',
  conditions: 'Conditions',
  skills: 'Skills',
};

/**
 * Map content type to category
 */
export const TYPE_TO_CATEGORY: Record<ContentType, ContentCategory> = {
  rule: 'rules',
  class: 'classes',
  subclass: 'classes',
  race: 'races',
  subrace: 'races',
  spell: 'spells',
  monster: 'bestiary',
  item: 'items',
  background: 'backgrounds',
  feat: 'feats',
  condition: 'conditions',
  skill: 'skills',
};

/**
 * Get category label for a content type
 */
export function getCategoryLabel(type: ContentType): string {
  const category = TYPE_TO_CATEGORY[type];
  return CATEGORY_LABELS[category];
}

/**
 * Get category path for a content type
 */
export function getCategoryPath(type: ContentType): string {
  const category = TYPE_TO_CATEGORY[type];
  return `/${category}`;
}

/**
 * Build item path from type and slug
 */
export function buildItemPath(type: ContentType, slug: string): string {
  const category = TYPE_TO_CATEGORY[type];
  return `/${category}/${slug}`;
}
