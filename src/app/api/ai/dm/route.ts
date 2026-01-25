import { NextRequest, NextResponse } from 'next/server';

// Simple DM Response structure
interface DMResponse {
  narrative: string;
  type: 'narration' | 'dialogue' | 'action' | 'combat' | 'roll';
  diceRoll?: {
    expression: string;
    result: number;
    rolls: number[];
    success?: boolean;
  };
  combat?: {
    active: boolean;
    round: number;
    currentTurn: string;
    enemies: Array<{ name: string; hp: number; maxHp: number }>;
  };
  suggestedActions?: string[];
}

const SYSTEM_PROMPT = `You are an expert Dungeon Master for a Dungeons & Dragons 5th Edition game. Your role is to:

1. Create immersive, engaging narrative descriptions
2. Voice NPCs with distinct personalities
3. Manage game pacing and dramatic tension
4. Apply D&D 5e rules fairly and consistently
5. Respond to player actions with appropriate consequences

Guidelines:
- Be descriptive but concise - aim for 2-4 sentences for most narration
- Use sensory details to bring scenes to life
- Give players agency while maintaining narrative momentum
- When a dice roll is needed, clearly state what to roll (e.g., "Roll a Perception check")
- Keep the adventure engaging and fun

IMPORTANT: Respond with a JSON object in this exact format:
{
  "narrative": "Your narrative response here",
  "type": "narration",
  "requiresRoll": false,
  "rollType": null,
  "rollDC": null,
  "suggestedActions": ["action1", "action2", "action3"]
}

Types can be: narration, dialogue, action, combat, roll
If requiresRoll is true, include rollType (e.g., "Perception check", "Attack roll") and rollDC if applicable.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, context } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // If no API key, use fallback responses
    if (!apiKey || apiKey === 'mock_anthropic_api_key_for_development') {
      const fallbackResponse = generateFallbackResponse(action, context);
      return NextResponse.json(fallbackResponse);
    }

    // Build the prompt with context
    const characterContext = context?.character
      ? `\nPlayer Character: ${context.character.name}, Level ${context.character.level} ${context.character.race?.name || ''} ${context.character.classes?.[0]?.name || ''}`
      : '';

    const recentContext = context?.recentMessages
      ? `\nRecent events:\n${context.recentMessages
          .slice(-5)
          .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
          .join('\n')}`
      : '';

    const userPrompt = `${characterContext}${recentContext}

Player action: ${action}

Respond as the Dungeon Master. Remember to respond with valid JSON.`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        temperature: 0.8,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      const fallbackResponse = generateFallbackResponse(action, context);
      return NextResponse.json(fallbackResponse);
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';

    // Try to parse as JSON
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr);
      return NextResponse.json({
        narrative: parsed.narrative,
        type: parsed.type || 'narration',
        diceRoll: parsed.requiresRoll
          ? {
              expression: parsed.rollType,
              required: true,
              dc: parsed.rollDC,
            }
          : undefined,
        suggestedActions: parsed.suggestedActions,
      });
    } catch {
      // If JSON parsing fails, return the raw text as narrative
      return NextResponse.json({
        narrative: content,
        type: 'narration',
      });
    }
  } catch (error) {
    console.error('AI DM error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response', narrative: 'The DM pauses to consider your action...' },
      { status: 500 }
    );
  }
}

// Fallback response generator for when API is unavailable
function generateFallbackResponse(action: string, context?: { character?: { name: string } }): DMResponse {
  const actionLower = action.toLowerCase();
  const charName = context?.character?.name || 'adventurer';

  // Combat-related actions
  if (actionLower.includes('attack') || actionLower.includes('fight') || actionLower.includes('strike')) {
    return {
      narrative: `${charName} readies their weapon, eyes locked on the target. The air grows tense as combat begins!\n\nRoll for initiative!`,
      type: 'combat',
      suggestedActions: ['Roll initiative', 'Take defensive stance', 'Look for cover'],
    };
  }

  // Exploration actions
  if (actionLower.includes('look') || actionLower.includes('examine') || actionLower.includes('inspect')) {
    return {
      narrative:
        'You carefully examine your surroundings. Ancient stone walls are covered in moss and strange markings. Torchlight flickers, casting dancing shadows. In the corner, something glints - perhaps treasure, perhaps danger.',
      type: 'narration',
      suggestedActions: ['Investigate the glinting object', 'Read the markings', 'Listen for sounds'],
    };
  }

  // Search actions
  if (actionLower.includes('search') || actionLower.includes('look for')) {
    return {
      narrative:
        'You begin searching the area methodically. Roll a Perception check to see what you discover.',
      type: 'roll',
      diceRoll: { expression: 'Perception check (DC 12)', result: 0, rolls: [] },
      suggestedActions: ['Roll Perception', 'Search more carefully', 'Move on'],
    };
  }

  // Movement actions
  if (
    actionLower.includes('move') ||
    actionLower.includes('go') ||
    actionLower.includes('walk') ||
    actionLower.includes('proceed')
  ) {
    return {
      narrative:
        'You move forward cautiously, each footstep echoing in the vast chamber. The passage narrows ahead, and you notice two paths diverging - one leading into darkness, the other showing a faint light.',
      type: 'narration',
      suggestedActions: ['Take the dark path', 'Follow the light', 'Check for traps first'],
    };
  }

  // Talk/social actions
  if (
    actionLower.includes('talk') ||
    actionLower.includes('speak') ||
    actionLower.includes('ask') ||
    actionLower.includes('say')
  ) {
    return {
      narrative:
        '"Halt! Who goes there?" a gruff voice calls out from the shadows. A dwarf guard steps forward, hand on his axe, eyeing you suspiciously. "State your business, stranger."',
      type: 'dialogue',
      suggestedActions: ['Introduce yourself peacefully', 'Ask about the dungeon', 'Offer gold for information'],
    };
  }

  // Stealth actions
  if (actionLower.includes('sneak') || actionLower.includes('hide') || actionLower.includes('stealth')) {
    return {
      narrative:
        'You press yourself against the cold stone wall, slowing your breathing. Roll a Stealth check to see if you remain undetected.',
      type: 'roll',
      diceRoll: { expression: 'Stealth check (DC 14)', result: 0, rolls: [] },
      suggestedActions: ['Roll Stealth', 'Find better cover', 'Create a distraction'],
    };
  }

  // Rest actions
  if (actionLower.includes('rest') || actionLower.includes('sleep') || actionLower.includes('camp')) {
    return {
      narrative:
        'You find a relatively safe alcove to rest. The ancient stones provide some shelter, and you manage to catch your breath. (Short rest: recover hit dice, some abilities refresh)',
      type: 'narration',
      suggestedActions: ['Take a short rest', 'Set up watch', 'Continue exploring'],
    };
  }

  // Magic/spell actions
  if (actionLower.includes('cast') || actionLower.includes('spell') || actionLower.includes('magic')) {
    return {
      narrative:
        'Arcane energy crackles at your fingertips as you begin weaving the spell. The air shimmers with magical potential. What spell do you cast?',
      type: 'action',
      suggestedActions: ['Cast Light', 'Cast Detect Magic', 'Hold the spell'],
    };
  }

  // Roll dice
  if (actionLower.includes('roll')) {
    const diceMatch = action.match(/(\d*)d(\d+)/i);
    if (diceMatch) {
      const count = parseInt(diceMatch[1]) || 1;
      const sides = parseInt(diceMatch[2]);
      const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
      const total = rolls.reduce((a, b) => a + b, 0);
      return {
        narrative: `Rolling ${count}d${sides}... The dice tumble across the table... [${rolls.join(', ')}] = ${total}!`,
        type: 'roll',
        diceRoll: { expression: `${count}d${sides}`, result: total, rolls },
      };
    }
  }

  // Default response
  return {
    narrative: `You ${action.toLowerCase()}. The dungeon responds to your presence - somewhere in the darkness, something stirs. The adventure continues!\n\nWhat do you do next?`,
    type: 'narration',
    suggestedActions: ['Look around', 'Move forward carefully', 'Listen for danger'],
  };
}
