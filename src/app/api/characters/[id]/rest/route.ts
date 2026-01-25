import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { characterService } from '@/lib/services/character.service';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/characters/[id]/rest - Apply rest to character
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const existingCharacter = await characterService.getCharacterById(id);

    if (!existingCharacter) {
      return NextResponse.json(
        { success: false, error: 'Character not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (existingCharacter.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, hitDiceToSpend } = body;

    let character;
    if (type === 'short') {
      if (!Array.isArray(hitDiceToSpend)) {
        return NextResponse.json(
          { success: false, error: 'hitDiceToSpend must be an array for short rest' },
          { status: 400 }
        );
      }
      character = await characterService.shortRest(id, hitDiceToSpend);
    } else if (type === 'long') {
      character = await characterService.longRest(id);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid rest type. Use "short" or "long"' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, character });
  } catch (error) {
    console.error('POST /api/characters/[id]/rest error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
