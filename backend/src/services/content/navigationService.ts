/**
 * Navigation Service
 * T032: Implement getNavigationTree service
 *
 * Builds hierarchical navigation tree for Rules Explorer sidebar
 */

import { query } from '../../config/database.js';
import {
  NavigationTree,
  NavigationCategory,
  NavigationNode,
  CATEGORY_LABELS,
} from '../../types/search.types.js';

/**
 * Safely execute a category builder with error handling
 */
async function safeBuildCategory<T>(
  builder: () => Promise<T>,
  fallback: T,
  categoryName: string
): Promise<T> {
  try {
    return await builder();
  } catch (error) {
    console.error(`Error building ${categoryName} category:`, error);
    return fallback;
  }
}

/**
 * Get the complete navigation tree for the Rules Explorer sidebar
 */
export async function getNavigationTree(): Promise<NavigationTree> {
  const emptyCategory = (id: string, label: string, slug: string, icon: string): NavigationCategory => ({
    id,
    label,
    slug,
    icon,
    path: `/${slug}`,
    children: [],
  });

  const categories: NavigationCategory[] = await Promise.all([
    safeBuildCategory(buildRulesCategory, emptyCategory('rules', CATEGORY_LABELS.rules, 'rules', 'book'), 'rules'),
    safeBuildCategory(buildClassesCategory, emptyCategory('classes', CATEGORY_LABELS.classes, 'classes', 'users'), 'classes'),
    safeBuildCategory(buildRacesCategory, emptyCategory('races', CATEGORY_LABELS.races, 'races', 'person'), 'races'),
    safeBuildCategory(buildSpellsCategory, emptyCategory('spells', CATEGORY_LABELS.spells, 'spells', 'sparkles'), 'spells'),
    safeBuildCategory(buildBestiaryCategory, emptyCategory('bestiary', CATEGORY_LABELS.bestiary, 'bestiary', 'skull'), 'bestiary'),
    safeBuildCategory(buildItemsCategory, emptyCategory('items', CATEGORY_LABELS.items, 'items', 'backpack'), 'items'),
    safeBuildCategory(buildBackgroundsCategory, emptyCategory('backgrounds', CATEGORY_LABELS.backgrounds, 'backgrounds', 'scroll'), 'backgrounds'),
    safeBuildCategory(buildFeatsCategory, emptyCategory('feats', CATEGORY_LABELS.feats, 'feats', 'award'), 'feats'),
    safeBuildCategory(buildConditionsCategory, emptyCategory('conditions', CATEGORY_LABELS.conditions, 'conditions', 'alert-circle'), 'conditions'),
    safeBuildCategory(buildSkillsCategory, emptyCategory('skills', CATEGORY_LABELS.skills, 'skills', 'target'), 'skills'),
  ]);

  return {
    categories,
    lastUpdated: new Date(),
  };
}

/**
 * Build Rules category with hierarchical subcategories
 */
async function buildRulesCategory(): Promise<NavigationCategory> {
  const result = await query<{
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    sort_order: number;
  }>(`
    SELECT id, name, slug, parent_id, sort_order
    FROM rule_categories
    ORDER BY parent_id NULLS FIRST, sort_order
  `);

  // Build tree from flat list
  const nodeMap = new Map<string, NavigationNode>();
  const rootNodes: NavigationNode[] = [];

  for (const row of result.rows) {
    const node: NavigationNode = {
      id: row.id,
      label: row.name,
      slug: row.slug,
      type: 'category',
      path: `/rules/${row.slug}`,
      children: [],
    };
    nodeMap.set(row.id, node);

    if (row.parent_id === null) {
      rootNodes.push(node);
    } else {
      const parent = nodeMap.get(row.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    }
  }

  return {
    id: 'rules',
    label: CATEGORY_LABELS.rules,
    slug: 'rules',
    icon: 'book',
    path: '/rules',
    children: rootNodes,
  };
}

/**
 * Build Classes category
 */
async function buildClassesCategory(): Promise<NavigationCategory> {
  const result = await query<{
    id: string;
    name: string;
    slug: string;
  }>(`
    SELECT id, name, slug
    FROM classes
    ORDER BY name
  `);

  const children: NavigationNode[] = [];

  for (const row of result.rows) {
    // Get subclasses for each class
    const subclassResult = await query<{
      id: string;
      name: string;
      slug: string;
    }>(`
      SELECT id, name, slug
      FROM subclasses
      WHERE class_id = $1
      ORDER BY name
    `, [row.id]);

    const subclassNodes: NavigationNode[] = subclassResult.rows.map(sc => ({
      id: sc.id,
      label: sc.name,
      slug: sc.slug,
      type: 'item' as const,
      path: `/classes/${row.slug}/${sc.slug}`,
    }));

    children.push({
      id: row.id,
      label: row.name,
      slug: row.slug,
      type: subclassNodes.length > 0 ? 'category' : 'item',
      path: `/classes/${row.slug}`,
      children: subclassNodes.length > 0 ? subclassNodes : undefined,
    });
  }

  return {
    id: 'classes',
    label: CATEGORY_LABELS.classes,
    slug: 'classes',
    icon: 'users',
    path: '/classes',
    children,
  };
}

/**
 * Build Races category
 */
async function buildRacesCategory(): Promise<NavigationCategory> {
  const result = await query<{
    id: string;
    name: string;
    slug: string;
  }>(`
    SELECT id, name, slug
    FROM races
    ORDER BY name
  `);

  const children: NavigationNode[] = [];

  for (const row of result.rows) {
    // Get subraces for each race
    const subraceResult = await query<{
      id: string;
      name: string;
      slug: string;
    }>(`
      SELECT id, name, slug
      FROM subraces
      WHERE race_id = $1
      ORDER BY name
    `, [row.id]);

    const subraceNodes: NavigationNode[] = subraceResult.rows.map(sr => ({
      id: sr.id,
      label: sr.name,
      slug: sr.slug,
      type: 'item' as const,
      path: `/races/${row.slug}/${sr.slug}`,
    }));

    children.push({
      id: row.id,
      label: row.name,
      slug: row.slug,
      type: subraceNodes.length > 0 ? 'category' : 'item',
      path: `/races/${row.slug}`,
      children: subraceNodes.length > 0 ? subraceNodes : undefined,
    });
  }

  return {
    id: 'races',
    label: CATEGORY_LABELS.races,
    slug: 'races',
    icon: 'person',
    path: '/races',
    children,
  };
}

/**
 * Build Spells category organized by level
 */
async function buildSpellsCategory(): Promise<NavigationCategory> {
  const levelNodes: NavigationNode[] = [];

  // Build level-based navigation
  for (let level = 0; level <= 9; level++) {
    const countResult = await query<{ count: string }>(`
      SELECT COUNT(*) as count FROM spells WHERE level = $1
    `, [level]);

    const count = parseInt(countResult.rows[0]?.count || '0', 10);
    if (count > 0) {
      levelNodes.push({
        id: `spell-level-${level}`,
        label: level === 0 ? 'Cantrips' : `${level}${getOrdinalSuffix(level)} Level`,
        slug: `level-${level}`,
        type: 'category',
        path: `/spells?level=${level}`,
        itemCount: count,
      });
    }
  }

  // Build school-based navigation
  const schoolResult = await query<{ school: string; count: string }>(`
    SELECT school, COUNT(*) as count
    FROM spells
    GROUP BY school
    ORDER BY school
  `);

  const schoolNodes: NavigationNode[] = schoolResult.rows.map(row => ({
    id: `spell-school-${row.school.toLowerCase()}`,
    label: row.school,
    slug: row.school.toLowerCase(),
    type: 'category' as const,
    path: `/spells?school=${row.school}`,
    itemCount: parseInt(row.count, 10),
  }));

  return {
    id: 'spells',
    label: CATEGORY_LABELS.spells,
    slug: 'spells',
    icon: 'sparkles',
    path: '/spells',
    children: [
      {
        id: 'spells-by-level',
        label: 'By Level',
        slug: 'by-level',
        type: 'category',
        path: '/spells',
        children: levelNodes,
      },
      {
        id: 'spells-by-school',
        label: 'By School',
        slug: 'by-school',
        type: 'category',
        path: '/spells',
        children: schoolNodes,
      },
    ],
  };
}

/**
 * Build Bestiary category organized by type and CR
 */
async function buildBestiaryCategory(): Promise<NavigationCategory> {
  // Build type-based navigation
  const typeResult = await query<{ type: string; count: string }>(`
    SELECT type, COUNT(*) as count
    FROM monsters
    GROUP BY type
    ORDER BY type
  `);

  const typeNodes: NavigationNode[] = typeResult.rows.map(row => ({
    id: `monster-type-${row.type.toLowerCase().replace(/\s+/g, '-')}`,
    label: row.type,
    slug: row.type.toLowerCase().replace(/\s+/g, '-'),
    type: 'category' as const,
    path: `/bestiary?type=${encodeURIComponent(row.type)}`,
    itemCount: parseInt(row.count, 10),
  }));

  // Build CR-based navigation using challenge_rating VARCHAR
  // Parse CR strings like '1/4', '1/2', '1', '10' etc.
  const crRanges = [
    { label: 'CR 0-1', crs: ['0', '1/8', '1/4', '1/2', '1'] },
    { label: 'CR 2-4', crs: ['2', '3', '4'] },
    { label: 'CR 5-10', crs: ['5', '6', '7', '8', '9', '10'] },
    { label: 'CR 11-16', crs: ['11', '12', '13', '14', '15', '16'] },
    { label: 'CR 17+', crs: ['17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'] },
  ];

  const crNodes: NavigationNode[] = [];
  for (const range of crRanges) {
    const placeholders = range.crs.map((_, i) => `$${i + 1}`).join(', ');
    const countResult = await query<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM monsters
      WHERE challenge_rating IN (${placeholders})
    `, range.crs);

    const count = parseInt(countResult.rows[0]?.count || '0', 10);
    if (count > 0) {
      crNodes.push({
        id: `monster-cr-${range.label.replace(/\s+/g, '-').toLowerCase()}`,
        label: range.label,
        slug: range.label.replace(/\s+/g, '-').toLowerCase(),
        type: 'category',
        path: `/bestiary?cr=${encodeURIComponent(range.crs.join(','))}`,
        itemCount: count,
      });
    }
  }

  return {
    id: 'bestiary',
    label: CATEGORY_LABELS.bestiary,
    slug: 'bestiary',
    icon: 'skull',
    path: '/bestiary',
    children: [
      {
        id: 'bestiary-by-type',
        label: 'By Type',
        slug: 'by-type',
        type: 'category',
        path: '/bestiary',
        children: typeNodes,
      },
      {
        id: 'bestiary-by-cr',
        label: 'By Challenge Rating',
        slug: 'by-cr',
        type: 'category',
        path: '/bestiary',
        children: crNodes,
      },
    ],
  };
}

/**
 * Build Items category organized by type
 */
async function buildItemsCategory(): Promise<NavigationCategory> {
  const typeResult = await query<{ type: string; count: string }>(`
    SELECT type, COUNT(*) as count
    FROM items
    GROUP BY type
    ORDER BY type
  `);

  const typeNodes: NavigationNode[] = typeResult.rows.map(row => ({
    id: `item-type-${row.type.toLowerCase().replace(/\s+/g, '-')}`,
    label: capitalizeFirst(row.type.replace(/_/g, ' ')),
    slug: row.type.toLowerCase().replace(/\s+/g, '-'),
    type: 'category' as const,
    path: `/items?type=${row.type}`,
    itemCount: parseInt(row.count, 10),
  }));

  return {
    id: 'items',
    label: CATEGORY_LABELS.items,
    slug: 'items',
    icon: 'backpack',
    path: '/items',
    children: typeNodes,
  };
}

/**
 * Build Backgrounds category
 */
async function buildBackgroundsCategory(): Promise<NavigationCategory> {
  const result = await query<{
    id: string;
    name: string;
    slug: string;
  }>(`
    SELECT id, name, slug
    FROM backgrounds
    ORDER BY name
  `);

  const children: NavigationNode[] = result.rows.map(row => ({
    id: row.id,
    label: row.name,
    slug: row.slug,
    type: 'item' as const,
    path: `/backgrounds/${row.slug}`,
  }));

  return {
    id: 'backgrounds',
    label: CATEGORY_LABELS.backgrounds,
    slug: 'backgrounds',
    icon: 'scroll',
    path: '/backgrounds',
    children,
  };
}

/**
 * Build Feats category
 */
async function buildFeatsCategory(): Promise<NavigationCategory> {
  const result = await query<{
    id: string;
    name: string;
    slug: string;
  }>(`
    SELECT id, name, slug
    FROM feats
    ORDER BY name
  `);

  const children: NavigationNode[] = result.rows.map(row => ({
    id: row.id,
    label: row.name,
    slug: row.slug,
    type: 'item' as const,
    path: `/feats/${row.slug}`,
  }));

  return {
    id: 'feats',
    label: CATEGORY_LABELS.feats,
    slug: 'feats',
    icon: 'award',
    path: '/feats',
    children,
  };
}

/**
 * Build Conditions category
 */
async function buildConditionsCategory(): Promise<NavigationCategory> {
  const result = await query<{
    id: string;
    name: string;
    slug: string;
  }>(`
    SELECT id, name, slug
    FROM conditions
    ORDER BY name
  `);

  const children: NavigationNode[] = result.rows.map(row => ({
    id: row.id,
    label: row.name,
    slug: row.slug,
    type: 'item' as const,
    path: `/conditions/${row.slug}`,
  }));

  return {
    id: 'conditions',
    label: CATEGORY_LABELS.conditions,
    slug: 'conditions',
    icon: 'alert-circle',
    path: '/conditions',
    children,
  };
}

/**
 * Build Skills category
 */
async function buildSkillsCategory(): Promise<NavigationCategory> {
  const result = await query<{
    id: string;
    name: string;
    slug: string;
    ability: string;
  }>(`
    SELECT id, name, slug, ability
    FROM skills
    ORDER BY ability, name
  `);

  // Group by ability
  const abilityGroups = new Map<string, NavigationNode[]>();
  for (const row of result.rows) {
    if (!abilityGroups.has(row.ability)) {
      abilityGroups.set(row.ability, []);
    }
    abilityGroups.get(row.ability)!.push({
      id: row.id,
      label: row.name,
      slug: row.slug,
      type: 'item',
      path: `/skills/${row.slug}`,
    });
  }

  const children: NavigationNode[] = [];
  for (const [ability, skills] of abilityGroups) {
    children.push({
      id: `skills-${ability.toLowerCase()}`,
      label: ability,
      slug: ability.toLowerCase(),
      type: 'category',
      path: `/skills?ability=${ability}`,
      children: skills,
    });
  }

  return {
    id: 'skills',
    label: CATEGORY_LABELS.skills,
    slug: 'skills',
    icon: 'target',
    path: '/skills',
    children,
  };
}

// Utility functions
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default {
  getNavigationTree,
};
