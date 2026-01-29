// Handbook API Client - T005
// Type-safe API client for handbook endpoints

import type {
  Rule,
  RuleCategory,
  RuleSummary,
  Spell,
  SpellSummary,
  SpellFilters,
  Monster,
  MonsterSummary,
  MonsterFilters,
  Item,
  ItemSummary,
  ItemFilters,
  Class,
  ClassSummary,
  ClassFilters,
  Race,
  RaceSummary,
  Background,
  BackgroundSummary,
  Feat,
  FeatSummary,
  Condition,
  Skill,
  Ability,
  SearchResponse,
  Citation,
  PaginatedResponse,
  PaginationParams,
} from './types';

// API base URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `HTTP error ${response.status}`,
      response.status,
      errorData.code
    );
  }

  return response.json();
}

/**
 * Build query string from params object
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, String(v)));
    } else {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// ============================================================================
// Rules API
// ============================================================================

export async function getRuleCategories(): Promise<RuleCategory[]> {
  return fetchApi<RuleCategory[]>('/api/handbook/rules/categories');
}

export async function getRuleCategoryChildren(categoryId: string): Promise<RuleCategory[]> {
  return fetchApi<RuleCategory[]>(`/api/handbook/rules/categories/${categoryId}/children`);
}

export async function getRules(
  params?: PaginationParams & { categoryId?: string }
): Promise<PaginatedResponse<RuleSummary>> {
  const query = buildQueryString(params || {});
  return fetchApi<PaginatedResponse<RuleSummary>>(`/api/handbook/rules${query}`);
}

export async function getRule(slug: string): Promise<Rule> {
  return fetchApi<Rule>(`/api/handbook/rules/${slug}`);
}

// ============================================================================
// Spells API
// ============================================================================

export async function getSpells(
  filters?: SpellFilters & PaginationParams
): Promise<PaginatedResponse<SpellSummary>> {
  const query = buildQueryString(filters || {});
  return fetchApi<PaginatedResponse<SpellSummary>>(`/api/handbook/spells${query}`);
}

export async function getSpell(slug: string): Promise<Spell> {
  return fetchApi<Spell>(`/api/handbook/spells/${slug}`);
}

// ============================================================================
// Monsters API
// ============================================================================

export async function getMonsters(
  filters?: MonsterFilters & PaginationParams
): Promise<PaginatedResponse<MonsterSummary>> {
  const query = buildQueryString(filters || {});
  return fetchApi<PaginatedResponse<MonsterSummary>>(`/api/handbook/monsters${query}`);
}

export async function getMonster(slug: string): Promise<Monster> {
  return fetchApi<Monster>(`/api/handbook/monsters/${slug}`);
}

// ============================================================================
// Items API
// ============================================================================

export async function getItems(
  filters?: ItemFilters & PaginationParams
): Promise<PaginatedResponse<ItemSummary>> {
  const query = buildQueryString(filters || {});
  return fetchApi<PaginatedResponse<ItemSummary>>(`/api/handbook/items${query}`);
}

export async function getItem(slug: string): Promise<Item> {
  return fetchApi<Item>(`/api/handbook/items/${slug}`);
}

// ============================================================================
// Classes API
// ============================================================================

export async function getClasses(
  filters?: ClassFilters & PaginationParams
): Promise<PaginatedResponse<ClassSummary>> {
  const query = buildQueryString(filters || {});
  return fetchApi<PaginatedResponse<ClassSummary>>(`/api/handbook/classes${query}`);
}

export async function getClass(slug: string): Promise<Class> {
  return fetchApi<Class>(`/api/handbook/classes/${slug}`);
}

// ============================================================================
// Races API
// ============================================================================

export async function getRaces(
  params?: PaginationParams
): Promise<PaginatedResponse<RaceSummary>> {
  const query = buildQueryString(params || {});
  return fetchApi<PaginatedResponse<RaceSummary>>(`/api/handbook/races${query}`);
}

export async function getRace(slug: string): Promise<Race> {
  return fetchApi<Race>(`/api/handbook/races/${slug}`);
}

// ============================================================================
// Backgrounds API
// ============================================================================

export async function getBackgrounds(
  params?: PaginationParams
): Promise<PaginatedResponse<BackgroundSummary>> {
  const query = buildQueryString(params || {});
  return fetchApi<PaginatedResponse<BackgroundSummary>>(`/api/handbook/backgrounds${query}`);
}

export async function getBackground(slug: string): Promise<Background> {
  return fetchApi<Background>(`/api/handbook/backgrounds/${slug}`);
}

// ============================================================================
// Feats API
// ============================================================================

export async function getFeats(
  params?: PaginationParams
): Promise<PaginatedResponse<FeatSummary>> {
  const query = buildQueryString(params || {});
  return fetchApi<PaginatedResponse<FeatSummary>>(`/api/handbook/feats${query}`);
}

export async function getFeat(slug: string): Promise<Feat> {
  return fetchApi<Feat>(`/api/handbook/feats/${slug}`);
}

// ============================================================================
// Reference API
// ============================================================================

export async function getConditions(): Promise<Condition[]> {
  return fetchApi<Condition[]>('/api/handbook/conditions');
}

export async function getCondition(slug: string): Promise<Condition> {
  return fetchApi<Condition>(`/api/handbook/conditions/${slug}`);
}

export async function getSkills(): Promise<Skill[]> {
  return fetchApi<Skill[]>('/api/handbook/skills');
}

export async function getAbilities(): Promise<Ability[]> {
  return fetchApi<Ability[]>('/api/handbook/abilities');
}

// ============================================================================
// Search API
// ============================================================================

export interface SearchOptions {
  type?: string;
  limit?: number;
}

export async function searchHandbook(
  query: string,
  options?: SearchOptions
): Promise<SearchResponse> {
  const params = { q: query, ...options };
  const queryString = buildQueryString(params);
  return fetchApi<SearchResponse>(`/api/handbook/search${queryString}`);
}

export async function getHandbookContext(query: string): Promise<Citation[]> {
  const queryString = buildQueryString({ q: query });
  return fetchApi<Citation[]>(`/api/handbook/context${queryString}`);
}
