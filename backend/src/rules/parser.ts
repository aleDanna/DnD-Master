/**
 * Parser for D&D rules text files
 * Extracts structured data from docs/rules.txt and docs/handbook.txt
 */

import type {
  RuleSection,
  RuleSubsection,
  SpellDefinition,
  MonsterStats,
} from './types.js';

// Regex patterns for parsing
const CHAPTER_PATTERN = /^Ch\.\s*(\d+):\s*(.+?)(?:\s*\.{2,}|\s*$)/m;
const PART_PATTERN = /^Part\s+(\d+):\s*(.+)$/m;
const SECTION_HEADER_PATTERN = /^([A-Z][A-Za-z\s]+)$/m;
const SPELL_HEADER_PATTERN = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/;

/**
 * Generate a slug ID from a title
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Extract keywords from text for search indexing
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'this', 'that', 'these',
    'those', 'it', 'its', 'you', 'your', 'they', 'their', 'we', 'our', 'he',
    'she', 'him', 'her', 'his', 'if', 'when', 'where', 'which', 'who', 'what',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Count word frequency and return unique words
  const wordFreq = new Map<string, number>();
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  }

  // Sort by frequency and return top keywords
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

/**
 * Parse a rules text file into structured sections
 */
export function parseRulesText(
  content: string,
  source: 'basic_rules' | 'players_handbook'
): RuleSection[] {
  const lines = content.split('\n');
  const sections: RuleSection[] = [];

  let currentPart = '';
  let currentChapter = '';
  let currentChapterNumber = 0;
  let currentSection: RuleSection | null = null;
  let currentSubsection: RuleSubsection | null = null;
  let contentBuffer: string[] = [];

  const flushContent = () => {
    if (contentBuffer.length > 0) {
      const text = contentBuffer.join('\n').trim();
      if (currentSubsection) {
        currentSubsection.content += (currentSubsection.content ? '\n' : '') + text;
      } else if (currentSection) {
        currentSection.content += (currentSection.content ? '\n' : '') + text;
      }
      contentBuffer = [];
    }
  };

  const finalizeSection = () => {
    flushContent();
    if (currentSection) {
      currentSection.keywords = extractKeywords(
        currentSection.title + ' ' + currentSection.content +
        currentSection.subsections.map(s => s.title + ' ' + s.content).join(' ')
      );
      for (const sub of currentSection.subsections) {
        sub.keywords = extractKeywords(sub.title + ' ' + sub.content);
      }
      sections.push(currentSection);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines but preserve paragraph breaks
    if (!trimmedLine) {
      if (contentBuffer.length > 0) {
        contentBuffer.push('');
      }
      continue;
    }

    // Check for Part headers
    const partMatch = trimmedLine.match(PART_PATTERN);
    if (partMatch) {
      finalizeSection();
      currentPart = partMatch[2].trim();
      currentSection = null;
      currentSubsection = null;
      continue;
    }

    // Check for Chapter headers
    const chapterMatch = trimmedLine.match(CHAPTER_PATTERN);
    if (chapterMatch) {
      finalizeSection();
      currentChapterNumber = parseInt(chapterMatch[1], 10);
      currentChapter = chapterMatch[2].trim();

      currentSection = {
        id: slugify(`${source}-ch${currentChapterNumber}-${currentChapter}`),
        title: currentChapter,
        source,
        chapter: currentChapter,
        chapterNumber: currentChapterNumber,
        part: currentPart || undefined,
        content: '',
        subsections: [],
        keywords: [],
      };
      currentSubsection = null;
      continue;
    }

    // Check for section headers (ALL CAPS or Title Case on its own line)
    if (
      currentSection &&
      trimmedLine.length > 2 &&
      trimmedLine.length < 60 &&
      /^[A-Z][A-Za-z\s',-]+$/.test(trimmedLine) &&
      !trimmedLine.includes('.')
    ) {
      // This might be a subsection header
      flushContent();

      // If it looks like a major header, create a new subsection
      if (/^[A-Z][a-z]/.test(trimmedLine)) {
        currentSubsection = {
          id: slugify(`${currentSection.id}-${trimmedLine}`),
          title: trimmedLine,
          content: '',
          keywords: [],
        };
        currentSection.subsections.push(currentSubsection);
        continue;
      }
    }

    // Regular content line
    contentBuffer.push(trimmedLine);
  }

  // Finalize last section
  finalizeSection();

  return sections;
}

/**
 * Parse spell definitions from rules text
 */
export function parseSpells(
  content: string,
  source: 'basic_rules' | 'players_handbook'
): SpellDefinition[] {
  const spells: SpellDefinition[] = [];
  const lines = content.split('\n');

  let inSpellSection = false;
  let currentSpell: Partial<SpellDefinition> | null = null;
  let descriptionBuffer: string[] = [];

  const SPELL_LEVEL_PATTERN = /^(\d+)(?:st|nd|rd|th)-level\s+(\w+)(?:\s*\(ritual\))?$/i;
  const CANTRIP_PATTERN = /^(\w+)\s+cantrip$/i;
  const PROPERTY_PATTERNS = {
    castingTime: /^Casting Time:\s*(.+)$/i,
    range: /^Range:\s*(.+)$/i,
    components: /^Components:\s*(.+)$/i,
    duration: /^Duration:\s*(.+)$/i,
  };

  const finalizeSpell = () => {
    if (currentSpell && currentSpell.name) {
      currentSpell.description = descriptionBuffer.join('\n').trim();

      // Extract higher levels info if present
      const higherIdx = currentSpell.description.indexOf('At Higher Levels');
      if (higherIdx !== -1) {
        currentSpell.higherLevels = currentSpell.description.slice(higherIdx).trim();
        currentSpell.description = currentSpell.description.slice(0, higherIdx).trim();
      }

      spells.push(currentSpell as SpellDefinition);
    }
    currentSpell = null;
    descriptionBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect spell section start
    if (line === 'Spell Descriptions') {
      inSpellSection = true;
      continue;
    }

    if (!inSpellSection) continue;

    // Check for new spell header (title case, short line)
    if (
      line.length > 0 &&
      line.length < 40 &&
      /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(line) &&
      !line.startsWith('At Higher')
    ) {
      finalizeSpell();

      // Look ahead for level/school info
      const nextLine = lines[i + 1]?.trim() || '';
      const levelMatch = nextLine.match(SPELL_LEVEL_PATTERN);
      const cantripMatch = nextLine.match(CANTRIP_PATTERN);

      if (levelMatch || cantripMatch) {
        currentSpell = {
          name: line,
          level: levelMatch ? parseInt(levelMatch[1], 10) : 0,
          school: levelMatch ? levelMatch[2] : (cantripMatch ? cantripMatch[1] : 'unknown'),
          castingTime: '',
          range: '',
          components: '',
          duration: '',
          description: '',
          classes: [],
          source,
        };
        i++; // Skip the level line
        continue;
      }
    }

    // Parse spell properties
    if (currentSpell) {
      for (const [prop, pattern] of Object.entries(PROPERTY_PATTERNS)) {
        const match = line.match(pattern);
        if (match) {
          (currentSpell as Record<string, unknown>)[prop] = match[1].trim();
          continue;
        }
      }

      // Add to description if not a property
      if (line && !Object.values(PROPERTY_PATTERNS).some(p => p.test(line))) {
        descriptionBuffer.push(line);
      }
    }
  }

  finalizeSpell();
  return spells;
}

/**
 * Parse monster stat blocks from rules text
 */
export function parseMonsters(
  content: string,
  source: 'basic_rules' | 'players_handbook'
): MonsterStats[] {
  const monsters: MonsterStats[] = [];

  // Monster stat block pattern indicators
  const SIZE_TYPE_PATTERN = /^(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+(\w+)(?:\s*\(([^)]+)\))?,\s*(\w+(?:\s+\w+)?)\s*$/i;
  const AC_PATTERN = /^Armor Class\s+(\d+)/i;
  const HP_PATTERN = /^Hit Points\s+(\d+)\s*\(([^)]+)\)/i;
  const SPEED_PATTERN = /^Speed\s+(.+)$/i;
  const CR_PATTERN = /^Challenge\s+([^\s]+)\s*\(/i;

  const lines = content.split('\n');
  let currentMonster: Partial<MonsterStats> | null = null;
  let inStatBlock = false;

  const finalizeMonster = () => {
    if (currentMonster && currentMonster.name && currentMonster.armorClass) {
      monsters.push(currentMonster as MonsterStats);
    }
    currentMonster = null;
    inStatBlock = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check for monster header (all caps followed by size/type line)
    if (/^[A-Z][A-Z\s]+$/.test(line) && line.length < 40) {
      const nextLine = lines[i + 1]?.trim() || '';
      const sizeMatch = nextLine.match(SIZE_TYPE_PATTERN);

      if (sizeMatch) {
        finalizeMonster();
        currentMonster = {
          name: line
            .split(' ')
            .map(w => w.charAt(0) + w.slice(1).toLowerCase())
            .join(' '),
          size: sizeMatch[1],
          type: sizeMatch[2],
          alignment: sizeMatch[4] || 'unaligned',
          armorClass: 10,
          hitPoints: '1',
          speed: '30 ft.',
          abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
          senses: '',
          languages: '',
          challengeRating: '0',
          source,
        };
        inStatBlock = true;
        i++; // Skip size/type line
        continue;
      }
    }

    if (inStatBlock && currentMonster) {
      // Parse AC
      const acMatch = line.match(AC_PATTERN);
      if (acMatch) {
        currentMonster.armorClass = parseInt(acMatch[1], 10);
        continue;
      }

      // Parse HP
      const hpMatch = line.match(HP_PATTERN);
      if (hpMatch) {
        currentMonster.hitPoints = `${hpMatch[1]} (${hpMatch[2]})`;
        continue;
      }

      // Parse Speed
      const speedMatch = line.match(SPEED_PATTERN);
      if (speedMatch) {
        currentMonster.speed = speedMatch[1];
        continue;
      }

      // Parse CR
      const crMatch = line.match(CR_PATTERN);
      if (crMatch) {
        currentMonster.challengeRating = crMatch[1];
        continue;
      }

      // Parse ability scores line (STR DEX CON INT WIS CHA)
      if (/^\d+\s+\([+-]?\d+\)\s+\d+/.test(line)) {
        const scores = line.match(/(\d+)\s+\([+-]?\d+\)/g);
        if (scores && scores.length === 6) {
          const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
          scores.forEach((score, idx) => {
            const num = parseInt(score.match(/(\d+)/)?.[1] || '10', 10);
            currentMonster!.abilityScores![abilities[idx]] = num;
          });
        }
        continue;
      }

      // Parse senses
      if (line.toLowerCase().startsWith('senses')) {
        currentMonster.senses = line.replace(/^senses\s*/i, '');
        continue;
      }

      // Parse languages
      if (line.toLowerCase().startsWith('languages')) {
        currentMonster.languages = line.replace(/^languages\s*/i, '');
        continue;
      }
    }
  }

  finalizeMonster();
  return monsters;
}
