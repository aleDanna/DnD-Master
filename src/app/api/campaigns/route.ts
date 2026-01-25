import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { campaignService } from '@/lib/services/campaign.service';

// GET /api/campaigns - Get all campaigns for authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const campaigns = await campaignService.getCampaignsForUser(session.user.id);

    return NextResponse.json({ success: true, campaigns });
  } catch (error) {
    console.error('GET /api/campaigns error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - Create a new campaign
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

    const campaign = await campaignService.createCampaign(session.user.id, body);

    return NextResponse.json(
      { success: true, campaign },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/campaigns error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
