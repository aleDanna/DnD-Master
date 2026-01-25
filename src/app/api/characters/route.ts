import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { characterService } from '@/lib/services/character.service';

// GET /api/characters - Get all characters for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    let characters;
    if (campaignId) {
      characters = await characterService.getCharactersByCampaignId(campaignId);
    } else {
      characters = await characterService.getCharactersByUserId(session.user.id);
    }

    return NextResponse.json({ success: true, characters });
  } catch (error) {
    console.error('GET /api/characters error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/characters - Create a new character
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
    const { campaignId, ...characterData } = body;

    const character = await characterService.createCharacter(
      session.user.id,
      characterData,
      campaignId
    );

    return NextResponse.json(
      { success: true, character },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/characters error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
