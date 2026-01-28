/**
 * AI Response Parser
 * Parses and validates AI DM responses
 */

import type { StateChangeContent, RuleCitation } from '../../models/event.js';

/**
 * Structured response from AI DM
 */
export interface AIResponse {
  narrative: string;
  mechanics?: string;
  stateChanges?: StateChangeContent[];
  requiresRoll?: {
    dice: string;
    reason: string;
    dc?: number;
  };
  ruleCitations?: RuleCitation[];
  combatAction?: {
    type: 'attack' | 'spell' | 'ability' | 'movement' | 'end_turn';
    target?: string;
    damage?: string;
  };
  newLocation?: string;
  newNPCs?: Array<{
    id: string;
    name: string;
    description?: string;
    disposition?: 'friendly' | 'neutral' | 'hostile';
  }>;
}

/**
 * Raw JSON structure expected from AI
 */
interface RawAIResponse {
  narrative: string;
  mechanics?: string;
  state_changes?: Array<{
    type: string;
    target?: string;
    value?: number | string;
    description: string;
  }>;
  requires_roll?: {
    dice: string;
    reason: string;
    dc?: number;
  };
  rule_citations?: Array<{
    rule_id: string;
    title: string;
    source: string;
    excerpt?: string;
  }>;
  combat_action?: {
    type: string;
    target?: string;
    damage?: string;
  };
  new_location?: string;
  new_npcs?: Array<{
    id: string;
    name: string;
    description?: string;
    disposition?: string;
  }>;
}

/**
 * Parse AI response from JSON string
 */
export function parseAIResponse(content: string): AIResponse {
  // Try to extract JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    // If no JSON found, treat the entire response as narrative
    return {
      narrative: content.trim(),
    };
  }

  try {
    const raw: RawAIResponse = JSON.parse(jsonMatch[0]);
    return validateAndTransform(raw);
  } catch {
    // If JSON parsing fails, treat as narrative
    console.warn('Failed to parse AI response as JSON, treating as narrative');
    return {
      narrative: content.trim(),
    };
  }
}

/**
 * Validate and transform raw response to typed structure
 */
function validateAndTransform(raw: RawAIResponse): AIResponse {
  const response: AIResponse = {
    narrative: raw.narrative || '',
  };

  // Validate narrative exists
  if (!response.narrative) {
    throw new Error('AI response must include narrative text');
  }

  // Transform optional fields
  if (raw.mechanics) {
    response.mechanics = raw.mechanics;
  }

  if (raw.state_changes && Array.isArray(raw.state_changes)) {
    response.stateChanges = raw.state_changes.map(sc => ({
      type: validateStateChangeType(sc.type),
      target: sc.target,
      value: sc.value,
      description: sc.description || '',
    }));
  }

  if (raw.requires_roll) {
    response.requiresRoll = {
      dice: validateDiceNotation(raw.requires_roll.dice),
      reason: raw.requires_roll.reason || 'Roll',
      dc: typeof raw.requires_roll.dc === 'number' ? raw.requires_roll.dc : undefined,
    };
  }

  if (raw.rule_citations && Array.isArray(raw.rule_citations)) {
    response.ruleCitations = raw.rule_citations.map(rc => ({
      rule_id: rc.rule_id || '',
      title: rc.title || '',
      source: rc.source || '',
      excerpt: rc.excerpt,
    }));
  }

  if (raw.combat_action) {
    const validTypes = ['attack', 'spell', 'ability', 'movement', 'end_turn'] as const;
    const type = raw.combat_action.type as typeof validTypes[number];
    if (validTypes.includes(type)) {
      response.combatAction = {
        type,
        target: raw.combat_action.target,
        damage: raw.combat_action.damage,
      };
    }
  }

  if (raw.new_location) {
    response.newLocation = raw.new_location;
  }

  if (raw.new_npcs && Array.isArray(raw.new_npcs)) {
    response.newNPCs = raw.new_npcs.map(npc => ({
      id: npc.id || crypto.randomUUID(),
      name: npc.name || 'Unknown NPC',
      description: npc.description,
      disposition: validateDisposition(npc.disposition),
    }));
  }

  return response;
}

/**
 * Validate state change type
 */
function validateStateChangeType(type: string): StateChangeContent['type'] {
  const validTypes = ['damage', 'heal', 'condition_add', 'condition_remove', 'move', 'inventory', 'custom'];
  return validTypes.includes(type) ? (type as StateChangeContent['type']) : 'custom';
}

/**
 * Validate dice notation
 */
function validateDiceNotation(dice: string): string {
  const pattern = /^\d+d\d+([+-]\d+)?$/i;
  if (!pattern.test(dice)) {
    throw new Error(`Invalid dice notation: ${dice}`);
  }
  return dice;
}

/**
 * Validate NPC disposition
 */
function validateDisposition(disposition?: string): 'friendly' | 'neutral' | 'hostile' | undefined {
  if (!disposition) return undefined;
  const valid = ['friendly', 'neutral', 'hostile'];
  return valid.includes(disposition) ? (disposition as 'friendly' | 'neutral' | 'hostile') : 'neutral';
}

/**
 * Extract just the narrative from an AI response
 */
export function extractNarrative(content: string): string {
  const response = parseAIResponse(content);
  return response.narrative;
}

/**
 * Check if response requires a dice roll
 */
export function requiresRoll(response: AIResponse): boolean {
  return response.requiresRoll !== undefined;
}

/**
 * Check if response has state changes
 */
export function hasStateChanges(response: AIResponse): boolean {
  return (response.stateChanges?.length ?? 0) > 0;
}

/**
 * Format response for display (narrative + mechanics)
 */
export function formatForDisplay(response: AIResponse): string {
  let display = response.narrative;

  if (response.mechanics) {
    display += `\n\n---\n*${response.mechanics}*`;
  }

  if (response.ruleCitations && response.ruleCitations.length > 0) {
    display += '\n\n**Rule References:**';
    for (const citation of response.ruleCitations) {
      display += `\n- ${citation.title} (${citation.source})`;
    }
  }

  return display;
}
