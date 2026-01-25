import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { diceService } from '@/lib/services/dice.service';

// POST /api/dice - Roll dice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { expression, advantage, disadvantage, modifier, type } = body;

    if (!expression) {
      return NextResponse.json(
        { success: false, error: 'expression is required' },
        { status: 400 }
      );
    }

    let result;

    // Handle special roll types
    if (type === 'ability-score') {
      result = diceService.rollAbilityScores();
      return NextResponse.json({
        success: true,
        roll: {
          type: 'ability-score',
          scores: result,
          timestamp: new Date(),
        },
      });
    }

    if (type === 'initiative') {
      const dexMod = typeof modifier === 'number' ? modifier : 0;
      result = diceService.rollInitiative(dexMod);
      return NextResponse.json({
        success: true,
        roll: {
          type: 'initiative',
          ...result,
          timestamp: new Date(),
        },
      });
    }

    if (type === 'attack') {
      const attackMod = typeof modifier === 'number' ? modifier : 0;
      const targetAC = body.targetAC || 10;
      result = diceService.rollAttack(attackMod, targetAC, { advantage, disadvantage });
      return NextResponse.json({
        success: true,
        roll: {
          type: 'attack',
          ...result,
          timestamp: new Date(),
        },
      });
    }

    if (type === 'saving-throw' || type === 'skill-check') {
      const checkMod = typeof modifier === 'number' ? modifier : 0;
      const dc = body.dc || 10;
      result = diceService.rollSavingThrow(checkMod, dc, { advantage, disadvantage });
      return NextResponse.json({
        success: true,
        roll: {
          type,
          ...result,
          timestamp: new Date(),
        },
      });
    }

    // Standard dice roll
    const rollOptions = { advantage, disadvantage };
    const rollResult = diceService.roll(expression, rollOptions);

    // Apply additional modifier if provided
    const additionalModifier = typeof modifier === 'number' ? modifier : 0;
    const total = rollResult.total + additionalModifier;

    return NextResponse.json({
      success: true,
      roll: {
        ...rollResult,
        modifier: rollResult.modifier + additionalModifier,
        total,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('POST /api/dice error:', error);
    const message = error instanceof Error ? error.message : 'Invalid dice expression';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
