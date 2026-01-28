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
  if (session.combat_state && session.combat_state.active) {
    sections.push('## Combat State (ACTIVE)');
    sections.push(`Round: ${session.combat_state.round}`);

    // Find current combatant
    const currentEntry = session.combat_state.initiative_order[session.combat_state.turn_index];
    const currentCombatant = session.combat_state.combatants.find(c => c.id === currentEntry?.id);
    if (currentCombatant) {
      sections.push(`Current Turn: ${currentCombatant.name} (${currentCombatant.type})`);
    }

    sections.push('');
    sections.push('Initiative Order:');
    for (let i = 0; i < session.combat_state.initiative_order.length; i++) {
      const entry = session.combat_state.initiative_order[i];
      const combatant = session.combat_state.combatants.find(c => c.id === entry.id);
      if (!combatant) continue;

      const turnMarker = i === session.combat_state.turn_index ? '>>> ' : '    ';
      const hpStatus = combatant.current_hp <= 0 ? ' [DOWN]' : ` (${combatant.current_hp}/${combatant.max_hp} HP)`;
      const conditionNames = combatant.conditions.map(c => c.name);
      const conditions = conditionNames.length > 0 ? ` [${conditionNames.join(', ')}]` : '';
      const activeStatus = combatant.is_active ? '' : ' [INACTIVE]';
      sections.push(`${turnMarker}${entry.initiative}: ${combatant.name} (${combatant.type})${hpStatus}${conditions}${activeStatus}`);
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
  lines.push(`HP: ${char.current_hp}/${char.max_hp}`);
  lines.push(`AC: ${char.armor_class}`);

  lines.push(`STR ${char.strength} DEX ${char.dexterity} CON ${char.constitution} INT ${char.intelligence} WIS ${char.wisdom} CHA ${char.charisma}`);

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

/**
 * Prompt for resolving a combat action
 */
export function buildCombatActionPrompt(
  action: string,
  combatantName: string,
  isPlayer: boolean,
  gameContext: string
): string {
  return `${gameContext}

## Combat Action
${combatantName} (${isPlayer ? 'player' : 'NPC/monster'}) attempts: "${action}"

Resolve this combat action:
1. Determine if the action is valid for combat (action, bonus action, or reaction)
2. If it's an attack or spell, specify the required rolls
3. Consider opportunity attacks if movement is involved
4. Apply any relevant combat rules (cover, advantage/disadvantage, etc.)

Respond with the resolution and any required dice rolls in JSON format.`;
}

/**
 * Prompt for resolving an attack roll
 */
export function buildAttackResolutionPrompt(
  attackerName: string,
  targetName: string,
  attackRoll: number,
  targetAC: number,
  damageRoll?: { dice: string; total: number; type: string },
  gameContext?: string
): string {
  const hit = attackRoll >= targetAC;
  const critical = attackRoll >= 20; // Assuming natural 20 logic is handled elsewhere

  let prompt = '';
  if (gameContext) {
    prompt = `${gameContext}\n\n`;
  }

  prompt += `## Attack Resolution
Attacker: ${attackerName}
Target: ${targetName}
Attack Roll: ${attackRoll} vs AC ${targetAC}
Result: ${critical ? 'CRITICAL HIT!' : hit ? 'HIT' : 'MISS'}`;

  if (hit && damageRoll) {
    prompt += `
Damage: ${damageRoll.total} ${damageRoll.type} damage (${damageRoll.dice})`;
  }

  prompt += `

Narrate the attack dramatically. If it's a hit, describe the impact. If it's a miss, describe how the attack fails.
Include any relevant state changes in your response.`;

  return prompt;
}

/**
 * Prompt for ending combat
 */
export function buildCombatEndPrompt(
  outcome: 'victory' | 'defeat' | 'retreat' | 'truce',
  survivors: string[],
  fallen: string[],
  gameContext: string
): string {
  return `${gameContext}

## Combat Ended - ${outcome.toUpperCase()}
Survivors: ${survivors.length > 0 ? survivors.join(', ') : 'None'}
Fallen: ${fallen.length > 0 ? fallen.join(', ') : 'None'}

Narrate the end of combat:
1. Describe the final moments of the battle
2. Detail the aftermath (wounded, exhausted, victorious, etc.)
3. Set up the next scene or prompt for what the players want to do next

Remember to update any relevant state changes (looting, healing, etc.).`;
}

/**
 * Prompt for monster/NPC AI decision making
 */
export function buildMonsterTurnPrompt(
  monsterName: string,
  monsterType: string,
  currentHp: number,
  maxHp: number,
  availableTargets: { name: string; type: string; hp: number; distance?: number }[],
  gameContext: string
): string {
  const hpPercent = Math.round((currentHp / maxHp) * 100);
  const condition = hpPercent > 75 ? 'healthy' : hpPercent > 50 ? 'wounded' : hpPercent > 25 ? 'badly hurt' : 'near death';

  const targetList = availableTargets.map(t =>
    `- ${t.name} (${t.type}, ${t.hp} HP${t.distance ? `, ${t.distance}ft away` : ''})`
  ).join('\n');

  return `${gameContext}

## Monster Turn: ${monsterName}
Type: ${monsterType}
Status: ${condition} (${currentHp}/${maxHp} HP)

Available Targets:
${targetList}

Decide and execute this monster's turn:
1. Consider the monster's intelligence and tactics
2. Choose an appropriate action based on the situation
3. Roll any required dice and resolve the action
4. Use movement, action, and bonus action if appropriate

Remember: Play the monster according to its nature - a mindless zombie attacks the nearest target, while a cunning mage might retreat or use tactics.`;
}

/**
 * Combat system prompt supplement
 */
export const COMBAT_SYSTEM_SUPPLEMENT = `
## Combat Rules Reminder
- On your turn: Move (up to speed), Action, Bonus Action (if available), Free Object Interaction
- Actions: Attack, Cast Spell, Dash, Disengage, Dodge, Help, Hide, Ready, Search, Use Object
- Opportunity Attacks: When enemy leaves your reach without Disengaging
- Advantage/Disadvantage: Roll 2d20, take higher/lower
- Critical Hit: Natural 20, double damage dice
- Death Saves: At 0 HP, roll d20 (10+ success, 9- fail, 3 of either = stable/dead)
- Conditions: Blinded, Charmed, Deafened, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious
`;

/**
 * Prompt for handling special combat situations
 */
export function buildSpecialCombatPrompt(
  situation: 'surprise' | 'grapple' | 'shove' | 'opportunity_attack' | 'readied_action' | 'concentration',
  actorName: string,
  targetName: string | null,
  details: string,
  gameContext: string
): string {
  const situationContext: Record<string, string> = {
    surprise: `${actorName} attempts to surprise the enemy. A surprised creature can't move or take an action on the first turn, and can't take reactions until the turn ends.`,
    grapple: `${actorName} attempts to grapple ${targetName}. Requires Athletics check vs target's Athletics or Acrobatics. Target is grappled on success.`,
    shove: `${actorName} attempts to shove ${targetName}. Requires Athletics check vs target's Athletics or Acrobatics. Can push 5ft or knock prone on success.`,
    opportunity_attack: `${targetName} provokes an opportunity attack from ${actorName} by leaving their reach without Disengaging.`,
    readied_action: `${actorName} readied an action with trigger: "${details}". The trigger has now occurred.`,
    concentration: `${actorName} must make a Concentration check (Constitution save) after taking damage. DC = 10 or half the damage taken, whichever is higher.`,
  };

  return `${gameContext}

## Special Combat Situation: ${situation.replace('_', ' ').toUpperCase()}
${situationContext[situation]}

Additional Details: ${details}

Resolve this situation according to the D&D 5e rules. Include any required rolls and their outcomes.`;
}
