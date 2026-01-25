import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { sessionService } from '@/lib/services/session.service';
import { campaignService } from '@/lib/services/campaign.service';

// GET /api/sessions - Get sessions (requires campaignId query param)
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

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'campaignId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify access to campaign
    const campaign = await campaignService.getCampaignById(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const isOwner = campaign.ownerId === session.user.id;
    const isPlayer = campaign.players.some(p => p.userId === session.user.id);

    if (!isOwner && !isPlayer) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const sessions = await sessionService.getSessionsByCampaignId(campaignId);

    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error('GET /api/sessions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create a new session
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
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'campaignId is required' },
        { status: 400 }
      );
    }

    // Verify ownership of campaign
    const campaign = await campaignService.getCampaignById(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Only campaign owner can create sessions' },
        { status: 403 }
      );
    }

    const gameSession = await sessionService.createSession(campaignId);

    return NextResponse.json(
      { success: true, session: gameSession },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/sessions error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
