import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { campaignService } from '@/lib/services/campaign.service';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/campaigns/[id]/quests - Get all quests for a campaign
export async function GET(
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
    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check access
    const isOwner = campaign.ownerId === session.user.id;
    const isPlayer = campaign.players.some(p => p.userId === session.user.id);

    if (!isOwner && !isPlayer) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const quests = await campaignService.getQuestsByCampaign(id);

    return NextResponse.json({ success: true, quests });
  } catch (error) {
    console.error('GET /api/campaigns/[id]/quests error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns/[id]/quests - Create a new quest
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
    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Only owner can create quests
    if (campaign.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const quest = await campaignService.createQuest(id, body);

    return NextResponse.json(
      { success: true, quest },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/campaigns/[id]/quests error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
