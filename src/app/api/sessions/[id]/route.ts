import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { sessionService } from '@/lib/services/session.service';
import { campaignService } from '@/lib/services/campaign.service';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/sessions/[id] - Get a specific session
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authSession = await getServerSession(authOptions);

    if (!authSession?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const gameSession = await sessionService.getSessionById(id);

    if (!gameSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify access to campaign
    const campaign = await campaignService.getCampaignById(gameSession.campaignId);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const isOwner = campaign.ownerId === authSession.user.id;
    const isPlayer = campaign.players.some(p => p.userId === authSession.user.id);

    if (!isOwner && !isPlayer) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, session: gameSession });
  } catch (error) {
    console.error('GET /api/sessions/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions/[id] - Update a session
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authSession = await getServerSession(authOptions);

    if (!authSession?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const existingSession = await sessionService.getSessionById(id);

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify ownership of campaign
    const campaign = await campaignService.getCampaignById(existingSession.campaignId);
    if (!campaign || campaign.ownerId !== authSession.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ...data } = body;

    let gameSession;

    switch (action) {
      case 'start':
        gameSession = await sessionService.startSession(id);
        break;
      case 'pause':
        gameSession = await sessionService.pauseSession(id);
        break;
      case 'resume':
        gameSession = await sessionService.resumeSession(id);
        break;
      case 'end':
        gameSession = await sessionService.endSession(id);
        break;
      case 'updateNarrative':
        gameSession = await sessionService.updateNarrativeContext(id, data);
        break;
      case 'setScene':
        gameSession = await sessionService.setCurrentScene(id, data.scene);
        break;
      case 'addEvent':
        gameSession = await sessionService.addRecentEvent(id, data.event);
        break;
      case 'setVoice':
        gameSession = await sessionService.setVoiceEnabled(id, data.enabled);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, session: gameSession });
  } catch (error) {
    console.error('PATCH /api/sessions/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

// DELETE /api/sessions/[id] - Delete a session
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authSession = await getServerSession(authOptions);

    if (!authSession?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const existingSession = await sessionService.getSessionById(id);

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify ownership of campaign
    const campaign = await campaignService.getCampaignById(existingSession.campaignId);
    if (!campaign || campaign.ownerId !== authSession.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    await sessionService.deleteSession(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/sessions/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
