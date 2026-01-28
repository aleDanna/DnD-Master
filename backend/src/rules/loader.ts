/**
 * Loader for D&D rules text files
 * Reads and parses docs/rules.txt and docs/handbook.txt
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseRulesText, parseSpells, parseMonsters } from './parser.js';
import type {
  RulesIndex,
  RuleSection,
  SpellDefinition,
  MonsterStats,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to docs folder (relative to backend/src/rules)
const DOCS_PATH = join(__dirname, '..', '..', '..', 'docs');

/**
 * Load and parse a rules text file
 */
async function loadRulesFile(
  filename: string,
  source: 'basic_rules' | 'players_handbook'
): Promise<{
  sections: RuleSection[];
  spells: SpellDefinition[];
  monsters: MonsterStats[];
}> {
  try {
    const filepath = join(DOCS_PATH, filename);
    const content = await readFile(filepath, 'utf-8');

    const sections = parseRulesText(content, source);
    const spells = parseSpells(content, source);
    const monsters = parseMonsters(content, source);

    return { sections, spells, monsters };
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return { sections: [], spells: [], monsters: [] };
  }
}

/**
 * Build a keyword index from sections
 */
function buildKeywordIndex(sections: RuleSection[]): Map<string, string[]> {
  const index = new Map<string, string[]>();

  for (const section of sections) {
    for (const keyword of section.keywords) {
      const existing = index.get(keyword) || [];
      existing.push(section.id);
      index.set(keyword, existing);
    }

    for (const subsection of section.subsections) {
      for (const keyword of subsection.keywords) {
        const existing = index.get(keyword) || [];
        existing.push(section.id);
        index.set(keyword, existing);
      }
    }
  }

  return index;
}

/**
 * Load all rules and build the complete index
 */
export async function loadAllRules(): Promise<RulesIndex> {
  console.log('Loading D&D rules from docs folder...');

  // Load both rule files
  const [basicRules, playerHandbook] = await Promise.all([
    loadRulesFile('rules.txt', 'basic_rules'),
    loadRulesFile('handbook.txt', 'players_handbook'),
  ]);

  // Combine all sections
  const allSections = [...basicRules.sections, ...playerHandbook.sections];
  const allSpells = [...basicRules.spells, ...playerHandbook.spells];
  const allMonsters = [...basicRules.monsters, ...playerHandbook.monsters];

  // Build maps
  const sectionMap = new Map<string, RuleSection>();
  for (const section of allSections) {
    sectionMap.set(section.id, section);
  }

  const spellMap = new Map<string, SpellDefinition>();
  for (const spell of allSpells) {
    const key = spell.name.toLowerCase().replace(/\s+/g, '-');
    // Prefer PHB over Basic Rules if duplicate
    if (!spellMap.has(key) || spell.source === 'players_handbook') {
      spellMap.set(key, spell);
    }
  }

  const monsterMap = new Map<string, MonsterStats>();
  for (const monster of allMonsters) {
    const key = monster.name.toLowerCase().replace(/\s+/g, '-');
    if (!monsterMap.has(key) || monster.source === 'players_handbook') {
      monsterMap.set(key, monster);
    }
  }

  // Build keyword index
  const keywordIndex = buildKeywordIndex(allSections);

  console.log(
    `Loaded ${sectionMap.size} sections, ${spellMap.size} spells, ${monsterMap.size} monsters`
  );

  return {
    sections: sectionMap,
    spells: spellMap,
    monsters: monsterMap,
    races: new Map(), // TODO: Parse races
    classes: new Map(), // TODO: Parse classes
    keywordIndex,
  };
}

/**
 * Check if rules files exist
 */
export async function rulesFilesExist(): Promise<{
  basicRules: boolean;
  playerHandbook: boolean;
}> {
  const checkFile = async (filename: string): Promise<boolean> => {
    try {
      await readFile(join(DOCS_PATH, filename));
      return true;
    } catch {
      return false;
    }
  };

  const [basicRules, playerHandbook] = await Promise.all([
    checkFile('rules.txt'),
    checkFile('handbook.txt'),
  ]);

  return { basicRules, playerHandbook };
}
