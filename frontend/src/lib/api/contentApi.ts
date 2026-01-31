/**
 * Content API Client
 * T057: Create content API client (all categories)
 */

import {
  Rule,
  RuleCategory,
  RuleSummary,
  Class,
  ClassSummary,
  Subclass,
  Race,
  RaceSummary,
  Subrace,
  Spell,
  SpellSummary,
  Monster,
  MonsterSummary,
  Item,
  ItemSummary,
  Background,
  BackgroundSummary,
  Feat,
  FeatSummary,
  Condition,
  ConditionSummary,
  Skill,
  SkillSummary,
} from '@/types/content.types';
import {
  ApiResponse,
  ListResponse,
  ListFilter,
  SpellFilter,
  MonsterFilter,
  ItemFilter,
} from '@/types/api.types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Generic fetch helper
async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error('API returned unsuccessful response');
  }

  return data.data;
}

// Build query string from params
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

// ============================================
// Rules API
// ============================================

export async function fetchRules(filter?: ListFilter): Promise<ListResponse<RuleSummary>> {
  const query = filter ? buildQueryString(filter) : '';
  return fetchApi(`/api/content/rules${query}`);
}

export async function fetchRuleCategories(): Promise<RuleCategory[]> {
  return fetchApi('/api/content/rules/categories');
}

export async function fetchRuleCategory(slug: string): Promise<RuleCategory> {
  return fetchApi(`/api/content/rules/categories/${slug}`);
}

export async function fetchRuleCategoryPath(slug: string): Promise<RuleCategory[]> {
  return fetchApi(`/api/content/rules/categories/${slug}/path`);
}

export async function fetchRule(slug: string): Promise<Rule> {
  return fetchApi(`/api/content/rules/${slug}`);
}

// ============================================
// Classes API
// ============================================

export async function fetchClasses(filter?: ListFilter): Promise<ListResponse<ClassSummary>> {
  const query = filter ? buildQueryString(filter) : '';
  return fetchApi(`/api/content/classes${query}`);
}

export async function fetchClass(slug: string): Promise<Class> {
  return fetchApi(`/api/content/classes/${slug}`);
}

export async function fetchSubclass(classSlug: string, subclassSlug: string): Promise<Subclass> {
  return fetchApi(`/api/content/classes/${classSlug}/${subclassSlug}`);
}

// ============================================
// Races API
// ============================================

export async function fetchRaces(filter?: ListFilter): Promise<ListResponse<RaceSummary>> {
  const query = filter ? buildQueryString(filter) : '';
  return fetchApi(`/api/content/races${query}`);
}

export async function fetchRace(slug: string): Promise<Race> {
  return fetchApi(`/api/content/races/${slug}`);
}

export async function fetchSubrace(raceSlug: string, subraceSlug: string): Promise<Subrace> {
  return fetchApi(`/api/content/races/${raceSlug}/${subraceSlug}`);
}

// ============================================
// Spells API
// ============================================

export async function fetchSpells(filter?: SpellFilter): Promise<ListResponse<SpellSummary>> {
  const query = filter ? buildQueryString(filter) : '';
  return fetchApi(`/api/content/spells${query}`);
}

export async function fetchSpell(slug: string): Promise<Spell> {
  return fetchApi(`/api/content/spells/${slug}`);
}

export async function fetchSpellsByLevel(level: number): Promise<SpellSummary[]> {
  return fetchApi(`/api/content/spells/level/${level}`);
}

export async function fetchSpellsBySchool(school: string): Promise<SpellSummary[]> {
  return fetchApi(`/api/content/spells/school/${school}`);
}

export async function fetchSpellsByClass(classSlug: string): Promise<SpellSummary[]> {
  return fetchApi(`/api/content/spells/class/${classSlug}`);
}

// ============================================
// Bestiary API
// ============================================

export async function fetchMonsters(filter?: MonsterFilter): Promise<ListResponse<MonsterSummary>> {
  const query = filter ? buildQueryString(filter) : '';
  return fetchApi(`/api/content/bestiary${query}`);
}

export async function fetchMonster(slug: string): Promise<Monster> {
  return fetchApi(`/api/content/bestiary/${slug}`);
}

export async function fetchMonsterTypes(): Promise<string[]> {
  return fetchApi('/api/content/bestiary/types');
}

export async function fetchMonstersByType(type: string): Promise<MonsterSummary[]> {
  return fetchApi(`/api/content/bestiary/type/${type}`);
}

export async function fetchMonstersByCR(minCr: number, maxCr: number): Promise<MonsterSummary[]> {
  return fetchApi(`/api/content/bestiary/cr/${minCr}/${maxCr}`);
}

// ============================================
// Items API
// ============================================

export async function fetchItems(filter?: ItemFilter): Promise<ListResponse<ItemSummary>> {
  const query = filter ? buildQueryString(filter) : '';
  return fetchApi(`/api/content/items${query}`);
}

export async function fetchItem(slug: string): Promise<Item> {
  return fetchApi(`/api/content/items/${slug}`);
}

export async function fetchItemTypes(): Promise<string[]> {
  return fetchApi('/api/content/items/types');
}

export async function fetchItemsByType(type: string): Promise<ItemSummary[]> {
  return fetchApi(`/api/content/items/type/${type}`);
}

// ============================================
// Backgrounds API
// ============================================

export async function fetchBackgrounds(filter?: ListFilter): Promise<ListResponse<BackgroundSummary>> {
  const query = filter ? buildQueryString(filter) : '';
  return fetchApi(`/api/content/backgrounds${query}`);
}

export async function fetchBackground(slug: string): Promise<Background> {
  return fetchApi(`/api/content/backgrounds/${slug}`);
}

// ============================================
// Feats API
// ============================================

export async function fetchFeats(filter?: ListFilter): Promise<ListResponse<FeatSummary>> {
  const query = filter ? buildQueryString(filter) : '';
  return fetchApi(`/api/content/feats${query}`);
}

export async function fetchFeat(slug: string): Promise<Feat> {
  return fetchApi(`/api/content/feats/${slug}`);
}

// ============================================
// Conditions API
// ============================================

export async function fetchConditions(filter?: ListFilter): Promise<ListResponse<ConditionSummary>> {
  const query = filter ? buildQueryString(filter) : '';
  return fetchApi(`/api/content/conditions${query}`);
}

export async function fetchCondition(slug: string): Promise<Condition> {
  return fetchApi(`/api/content/conditions/${slug}`);
}

export async function fetchAllConditions(): Promise<Condition[]> {
  return fetchApi('/api/content/conditions/all');
}

// ============================================
// Skills API
// ============================================

export async function fetchSkills(filter?: ListFilter): Promise<ListResponse<SkillSummary>> {
  const query = filter ? buildQueryString(filter) : '';
  return fetchApi(`/api/content/skills${query}`);
}

export async function fetchSkill(slug: string): Promise<Skill> {
  return fetchApi(`/api/content/skills/${slug}`);
}

export async function fetchSkillsByAbility(ability: string): Promise<Skill[]> {
  return fetchApi(`/api/content/skills/ability/${ability}`);
}

export async function fetchSkillsGrouped(): Promise<Record<string, Skill[]>> {
  return fetchApi('/api/content/skills/grouped');
}

export default {
  // Rules
  fetchRules,
  fetchRuleCategories,
  fetchRuleCategory,
  fetchRuleCategoryPath,
  fetchRule,
  // Classes
  fetchClasses,
  fetchClass,
  fetchSubclass,
  // Races
  fetchRaces,
  fetchRace,
  fetchSubrace,
  // Spells
  fetchSpells,
  fetchSpell,
  fetchSpellsByLevel,
  fetchSpellsBySchool,
  fetchSpellsByClass,
  // Bestiary
  fetchMonsters,
  fetchMonster,
  fetchMonsterTypes,
  fetchMonstersByType,
  fetchMonstersByCR,
  // Items
  fetchItems,
  fetchItem,
  fetchItemTypes,
  fetchItemsByType,
  // Backgrounds
  fetchBackgrounds,
  fetchBackground,
  // Feats
  fetchFeats,
  fetchFeat,
  // Conditions
  fetchConditions,
  fetchCondition,
  fetchAllConditions,
  // Skills
  fetchSkills,
  fetchSkill,
  fetchSkillsByAbility,
  fetchSkillsGrouped,
};
