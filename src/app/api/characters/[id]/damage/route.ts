import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { characterService } from '@/lib/services/character.service';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/characters/[id]/damage - Apply damage to character
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
    const { amount, damageType } = body;

    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid damage amount' },
        { status: 400 }
      );
    }

    const character = await characterService.applyDamage(id, amount, damageType);

    return NextResponse.json({ success: true, character });
  } catch (error) {
    console.error('POST /api/characters/[id]/damage error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
