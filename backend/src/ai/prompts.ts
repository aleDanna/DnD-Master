/**
 * Prompt templates for AI Dungeon Master
 */

import type { Session } from '../models/session.js';
import type { Character } from '../models/character.js';
import type { GameEvent } from '../models/event.js';
import type { Campaign } from '../models/campaign.js';

/**
 * System prompt establishing the AI's role as Dungeon Master
 */
export const SYSTEM_PROMPT = `You are an expert Dungeon Master for a Dungeons & Dragons 5th Edition game. Your role is to:

1. NARRATE the story in an engaging, descriptive manner
2. CONTROL NPCs and monsters with distinct personalities
3. APPLY D&D 5e rules accurately, citing specific rules when relevant
4. MANAGE combat encounters fairly and tactically
5. ADAPT to player choices while maintaining narrative coherence

Guidelines:
- Be descriptive but concise - aim for 2-3 paragraphs per response
- Ask for dice rolls when rules require them (attacks, saves, ability checks)
- Track and reference the game state (HP, conditions, positions)
- Never control player characters - only describe outcomes of their actions
- Cite rules when making rulings (e.g., "As per the grappling rules in Ch. 9...")
- Balance challenge with fun - let players feel heroic while maintaining stakes

Response Format:
Always structure your response as JSON with these fields:
{
  "narrative": "The descriptive story text to show players",
  "mechanics": "Optional rules/mechanics explanation",
  "state_changes": [{"type": "damage|heal|condition_add|condition_remove|move|inventory", "target": "id", "value": "...", "description": "..."}],
  "requires_roll": {"dice": "1d20+5", "reason": "Attack roll", "dc": 15},
  "rule_citations": [{"rule_id": "...", "title": "...", "source": "Basic Rules, Ch. X", "excerpt": "..."}]
}`;

/**
 * Build context from game state for AI prompt
 */
export function buildGameContext(
  campaign: Campaign,
  session: Session,
  characters: Character[],
  recentEvents: GameEvent[],
  rulesContext?: string
): string {
  const sections: string[] = [];

  // Campaign context
  sections.push(`## Campaign: ${campaign.name}`);
  if (campaign.description) {
    sections.push(campaign.description);
  }
  sections.push(`Dice Mode: ${campaign.dice_mode}`);
  sections.push(`Map Mode: ${campaign.map_mode}`);
  sections.push('');

  // Session state
  sections.push('## Current Session State');
  if (session.current_location) {
    sections.push(`Location: ${session.current_location}`);
  }
  if (session.narrative_summary) {
    sections.push(`Summary: ${session.narrative_summary}`);
  }
  sections.push('');

  // Characters
  sections.push('## Player Characters');
  for (const char of characters) {
    sections.push(formatCharacterForPrompt(char));
  }
  sections.push('');

  // Active NPCs
  if (session.active_npcs && session.active_npcs.length > 0) {
    sections.push('## Active NPCs');
    for (const npc of session.active_npcs) {
      sections.push(`- ${npc.name}: ${npc.description || 'No description'} (${npc.disposition || 'neutral'})`);
    }
    sections.push('');
  }

  // Combat state
  if (session.combat_state) {
    sections.push('## Combat State');
    sections.push(`Round: ${session.combat_state.round}`);
    sections.push(`Current Turn: ${session.combat_state.current_combatant_index}`);
    sections.push('Initiative Order:');
    for (const combatant of session.combat_state.combatants) {
      const hpStatus = combatant.current_hp <= 0 ? ' [DOWN]' : ` (${combatant.current_hp}/${combatant.max_hp} HP)`;
      const conditions = combatant.conditions.length > 0 ? ` [${combatant.conditions.join(', ')}]` : '';
      sections.push(`  ${combatant.initiative}: ${combatant.name}${hpStatus}${conditions}`);
    }
    sections.push('');
  }

  // Recent events
  if (recentEvents.length > 0) {
    sections.push('## Recent Events');
    for (const event of recentEvents.slice(-5)) {
      sections.push(formatEventForPrompt(event));
    }
    sections.push('');
  }

  // Rules context
  if (rulesContext) {
    sections.push('## Relevant Rules');
    sections.push(rulesContext);
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Format character data for prompt
 */
function formatCharacterForPrompt(char: Character): string {
  const lines: string[] = [];

  lines.push(`### ${char.name} (${char.race} ${char.class}, Level ${char.level})`);
  lines.push(`HP: ${char.hit_points_current}/${char.hit_points_max}`);
  lines.push(`AC: ${char.armor_class}`);

  const abilities = char.ability_scores;
  lines.push(`STR ${abilities.strength} DEX ${abilities.dexterity} CON ${abilities.constitution} INT ${abilities.intelligence} WIS ${abilities.wisdom} CHA ${abilities.charisma}`);

  if (char.conditions && char.conditions.length > 0) {
    lines.push(`Conditions: ${char.conditions.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Format event for prompt context
 */
function formatEventForPrompt(event: GameEvent): string {
  switch (event.type) {
    case 'player_action':
      return `[Player] ${event.actor_name}: ${(event.content as { text: string }).text}`;
    case 'ai_response':
      return `[DM] ${(event.content as { narrative: string }).narrative.slice(0, 100)}...`;
    case 'dice_roll':
      const roll = event.content as { dice: string; total: number; reason: string };
      return `[Roll] ${event.actor_name} rolled ${roll.dice} = ${roll.total} (${roll.reason})`;
    default:
      return `[${event.type}]`;
  }
}

/**
 * Prompt for processing player actions
 */
export function buildPlayerActionPrompt(
  action: string,
  characterName: string,
  gameContext: string
): string {
  return `${gameContext}

## Player Action
${characterName} attempts to: "${action}"

As the Dungeon Master, respond to this action. Consider:
1. Is this action possible given the current situation?
2. Does it require a dice roll? If so, specify what kind.
3. What are the consequences (success and failure)?
4. How do NPCs/environment react?

Respond with narrative and any required mechanics in JSON format.`;
}

/**
 * Prompt for resolving dice rolls
 */
export function buildDiceResolutionPrompt(
  rollResult: { dice: string; total: number; reason: string },
  dc: number | null,
  gameContext: string
): string {
  const dcText = dc !== null ? `against DC ${dc}` : '';

  return `${gameContext}

## Dice Roll Result
Roll: ${rollResult.dice} = ${rollResult.total} ${dcText}
Reason: ${rollResult.reason}

Narrate the outcome of this roll and describe what happens next. Update any relevant state changes.`;
}

/**
 * Prompt for starting combat
 */
export function buildCombatStartPrompt(
  enemies: string[],
  gameContext: string
): string {
  return `${gameContext}

## Combat Initiated
Enemies entering combat: ${enemies.join(', ')}

1. Describe the enemies and how combat begins
2. Request initiative rolls from all participants
3. Set the scene for the first round

Remember to track all combatants and their positions if using grid combat.`;
}

/**
 * Prompt for combat turns
 */
export function buildCombatTurnPrompt(
  combatantName: string,
  isPlayer: boolean,
  gameContext: string
): string {
  if (isPlayer) {
    return `${gameContext}

## Combat Turn
It is ${combatantName}'s turn. Describe the battlefield state and prompt them for their action.
Remind them of their available actions, bonus actions, and movement.`;
  } else {
    return `${gameContext}

## NPC/Monster Turn
It is ${combatantName}'s turn. Decide and narrate their actions:
1. What is their tactical goal?
2. What action do they take?
3. Roll any required dice and resolve the action

Play the monster/NPC according to their intelligence and nature.`;
  }
}

/**
 * Prompt for session start
 */
export function buildSessionStartPrompt(
  campaign: Campaign,
  previousSummary: string | null,
  characters: Character[]
): string {
  const charList = characters.map(c => `${c.name} (${c.race} ${c.class})`).join(', ');

  const recap = previousSummary
    ? `\n\nPrevious Session Recap:\n${previousSummary}`
    : '\n\nThis is the first session of the campaign.';

  return `## Campaign: ${campaign.name}
${campaign.description || 'A new adventure begins...'}

Players: ${charList}${recap}

Begin the session with an engaging opening. Set the scene, introduce the current situation, and prompt the players for their first actions.`;
}

/**
 * Prompt for generating a session summary
 */
export function buildSessionSummaryPrompt(
  events: GameEvent[]
): string {
  const eventSummary = events.map(formatEventForPrompt).join('\n');

  return `Based on the following session events, write a concise summary (2-3 paragraphs) that captures:
1. Major plot developments
2. Key character moments
3. Important decisions made
4. Current situation as the session ends

Events:
${eventSummary}

Write the summary in past tense, third person, as if recapping for players who missed the session.`;
}
