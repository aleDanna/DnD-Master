/**
 * RulesService - Provides access to D&D rules for AI context and citations
 */

import { loadAllRules, rulesFilesExist } from './loader.js';
import type {
  RulesIndex,
  RuleSection,
  SpellDefinition,
  MonsterStats,
  RuleCitation,
  SearchResult,
} from './types.js';

class RulesService {
  private index: RulesIndex | null = null;
  private loading: Promise<void> | null = null;

  /**
   * Initialize the rules service by loading all rules
   */
  async initialize(): Promise<void> {
    if (this.index) return;

    if (!this.loading) {
      this.loading = this.loadRules();
    }

    await this.loading;
  }

  private async loadRules(): Promise<void> {
    const exists = await rulesFilesExist();

    if (!exists.basicRules && !exists.playerHandbook) {
      console.warn('No rules files found in docs folder');
      this.index = {
        sections: new Map(),
        spells: new Map(),
        monsters: new Map(),
        races: new Map(),
        classes: new Map(),
        keywordIndex: new Map(),
      };
      return;
    }

    this.index = await loadAllRules();
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.index !== null;
  }

  /**
   * Get a section by ID
   */
  getSection(id: string): RuleSection | undefined {
    return this.index?.sections.get(id);
  }

  /**
   * Get a spell by name
   */
  getSpell(name: string): SpellDefinition | undefined {
    const key = name.toLowerCase().replace(/\s+/g, '-');
    return this.index?.spells.get(key);
  }

  /**
   * Get a monster by name
   */
  getMonster(name: string): MonsterStats | undefined {
    const key = name.toLowerCase().replace(/\s+/g, '-');
    return this.index?.monsters.get(key);
  }

  /**
   * Search rules by keyword(s)
   */
  search(query: string, limit: number = 10): SearchResult[] {
    if (!this.index) return [];

    const results: SearchResult[] = [];
    const queryTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 2);

    if (queryTerms.length === 0) return [];

    // Search sections
    for (const [id, section] of this.index.sections) {
      const matchScore = this.calculateMatchScore(section.keywords, queryTerms);
      if (matchScore > 0) {
        const sourceLabel =
          section.source === 'basic_rules' ? 'Basic Rules' : "Player's Handbook";
        results.push({
          type: 'section',
          id,
          title: section.title,
          source: `${sourceLabel}, Ch. ${section.chapterNumber}`,
          excerpt: section.content.slice(0, 200) + '...',
          relevanceScore: matchScore,
        });
      }
    }

    // Search spells
    for (const [id, spell] of this.index.spells) {
      const spellText = `${spell.name} ${spell.school} ${spell.description}`.toLowerCase();
      const matchScore = queryTerms.reduce((score, term) => {
        return score + (spellText.includes(term) ? 1 : 0);
      }, 0);

      if (matchScore > 0) {
        const sourceLabel =
          spell.source === 'basic_rules' ? 'Basic Rules' : "Player's Handbook";
        results.push({
          type: 'spell',
          id,
          title: spell.name,
          source: `${sourceLabel}, Spell Descriptions`,
          excerpt: spell.description.slice(0, 200) + '...',
          relevanceScore: matchScore,
        });
      }
    }

    // Search monsters
    for (const [id, monster] of this.index.monsters) {
      const monsterText = `${monster.name} ${monster.type}`.toLowerCase();
      const matchScore = queryTerms.reduce((score, term) => {
        return score + (monsterText.includes(term) ? 1 : 0);
      }, 0);

      if (matchScore > 0) {
        const sourceLabel =
          monster.source === 'basic_rules' ? 'Basic Rules' : "Player's Handbook";
        results.push({
          type: 'monster',
          id,
          title: monster.name,
          source: `${sourceLabel}, Monsters`,
          excerpt: `${monster.size} ${monster.type}, CR ${monster.challengeRating}`,
          relevanceScore: matchScore,
        });
      }
    }

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Get rules context for AI prompt
   * Returns relevant rules sections for a given game situation
   */
  getRulesContext(
    situation: string,
    maxTokens: number = 2000
  ): { context: string; citations: RuleCitation[] } {
    const searchResults = this.search(situation, 5);
    const citations: RuleCitation[] = [];
    let context = '';
    let tokenEstimate = 0;

    for (const result of searchResults) {
      if (result.type === 'section') {
        const section = this.getSection(result.id);
        if (section) {
          const sectionText = `## ${section.title}\n${section.content}\n\n`;
          const textTokens = Math.ceil(sectionText.length / 4);

          if (tokenEstimate + textTokens > maxTokens) break;

          context += sectionText;
          tokenEstimate += textTokens;

          citations.push({
            ruleId: section.id,
            title: section.title,
            source: result.source,
            excerpt: section.content.slice(0, 100) + '...',
          });
        }
      } else if (result.type === 'spell') {
        const spell = this.getSpell(result.title);
        if (spell) {
          const spellText = this.formatSpell(spell);
          const textTokens = Math.ceil(spellText.length / 4);

          if (tokenEstimate + textTokens > maxTokens) break;

          context += spellText + '\n\n';
          tokenEstimate += textTokens;

          citations.push({
            ruleId: result.id,
            title: spell.name,
            source: result.source,
            excerpt: spell.description.slice(0, 100) + '...',
          });
        }
      } else if (result.type === 'monster') {
        const monster = this.getMonster(result.title);
        if (monster) {
          const monsterText = this.formatMonster(monster);
          const textTokens = Math.ceil(monsterText.length / 4);

          if (tokenEstimate + textTokens > maxTokens) break;

          context += monsterText + '\n\n';
          tokenEstimate += textTokens;

          citations.push({
            ruleId: result.id,
            title: monster.name,
            source: result.source,
            excerpt: `${monster.size} ${monster.type}, CR ${monster.challengeRating}`,
          });
        }
      }
    }

    return { context, citations };
  }

  /**
   * Get combat rules specifically
   */
  getCombatRules(): RuleSection | undefined {
    // Look for Chapter 9: Combat
    for (const [id, section] of this.index?.sections || []) {
      if (section.chapterNumber === 9 && section.source === 'basic_rules') {
        return section;
      }
    }
    return undefined;
  }

  /**
   * Get spellcasting rules
   */
  getSpellcastingRules(): RuleSection | undefined {
    // Look for Chapter 10: Spellcasting
    for (const [id, section] of this.index?.sections || []) {
      if (section.chapterNumber === 10 && section.source === 'basic_rules') {
        return section;
      }
    }
    return undefined;
  }

  /**
   * Calculate match score based on keyword overlap
   */
  private calculateMatchScore(keywords: string[], queryTerms: string[]): number {
    let score = 0;
    for (const term of queryTerms) {
      for (const keyword of keywords) {
        if (keyword.includes(term) || term.includes(keyword)) {
          score += 1;
        }
      }
    }
    return score;
  }

  /**
   * Format a spell for AI context
   */
  private formatSpell(spell: SpellDefinition): string {
    const levelText = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;
    return `## ${spell.name}
${levelText} ${spell.school}
Casting Time: ${spell.castingTime}
Range: ${spell.range}
Components: ${spell.components}
Duration: ${spell.duration}

${spell.description}${spell.higherLevels ? '\n\n' + spell.higherLevels : ''}`;
  }

  /**
   * Format a monster for AI context
   */
  private formatMonster(monster: MonsterStats): string {
    const { abilityScores } = monster;
    return `## ${monster.name}
${monster.size} ${monster.type}, ${monster.alignment}
AC ${monster.armorClass} | HP ${monster.hitPoints} | Speed ${monster.speed}
STR ${abilityScores.str} DEX ${abilityScores.dex} CON ${abilityScores.con} INT ${abilityScores.int} WIS ${abilityScores.wis} CHA ${abilityScores.cha}
CR ${monster.challengeRating}`;
  }

  /**
   * Get all spell names for autocomplete
   */
  getAllSpellNames(): string[] {
    if (!this.index) return [];
    return Array.from(this.index.spells.values()).map(s => s.name);
  }

  /**
   * Get all monster names for autocomplete
   */
  getAllMonsterNames(): string[] {
    if (!this.index) return [];
    return Array.from(this.index.monsters.values()).map(m => m.name);
  }

  /**
   * Get stats summary
   */
  getStats(): {
    sections: number;
    spells: number;
    monsters: number;
    races: number;
    classes: number;
  } {
    return {
      sections: this.index?.sections.size || 0,
      spells: this.index?.spells.size || 0,
      monsters: this.index?.monsters.size || 0,
      races: this.index?.races.size || 0,
      classes: this.index?.classes.size || 0,
    };
  }
}

// Export singleton instance
export const rulesService = new RulesService();
