// API response types for Rules Explorer
// T031: Create API response types

import { ContentCategory, ContentType, SourceCitation } from './content.types';

// ============================================
// Generic API Response Types
// ============================================

/**
 * Standard API success response wrapper
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Combined API response type
 */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

/**
 * List response wrapper for paginated content
 */
export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

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
export interface SearchParams {
  q: string;
  type?: SearchMode;
  categories?: ContentCategory[];
  limit?: number;
}

// ============================================
// Navigation Types
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
  lastUpdated: string;
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
// Filter Types
// ============================================

/**
 * Generic list filter options
 */
export interface ListFilter {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Spell filter options
 */
export interface SpellFilter extends ListFilter {
  level?: number;
  school?: string;
  classSlug?: string;
  concentration?: boolean;
  ritual?: boolean;
}

/**
 * Monster filter options
 */
export interface MonsterFilter extends ListFilter {
  type?: string;
  minCr?: number;
  maxCr?: number;
  size?: string;
}

/**
 * Item filter options
 */
export interface ItemFilter extends ListFilter {
  type?: string;
  subtype?: string;
  rarity?: string;
  minCost?: number;
  maxCost?: number;
}

// ============================================
// Category Labels and Mappings
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

// ============================================
// Recent Searches (localStorage)
// ============================================

/**
 * Recent search entry for localStorage
 */
export interface RecentSearch {
  query: string;
  mode: SearchMode;
  timestamp: number;
}

/**
 * Maximum number of recent searches to store
 */
export const MAX_RECENT_SEARCHES = 10;

/**
 * LocalStorage key for recent searches
 */
export const RECENT_SEARCHES_KEY = 'rules-explorer-recent-searches';
