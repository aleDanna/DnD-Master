import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { sessionService } from '@/lib/services/session.service';
import { campaignService } from '@/lib/services/campaign.service';
import type { CombatState } from '@/types/session.types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/sessions/[id]/combat - Start combat
export async function POST(
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
    const combatState: CombatState = {
      id: `combat-${Date.now()}`,
      sessionId: id,
      status: 'initiative',
      round: 1,
      currentTurnIndex: 0,
      initiativeOrder: body.initiativeOrder || [],
      combatants: body.combatants || {},
      environmentalEffects: body.environmentalEffects || [],
      turnHistory: [],
    };

    const gameSession = await sessionService.startCombat(id, combatState);

    // Log the event
    await sessionService.logEvent(id, 'combat:start', { combatState }, authSession.user.id);

    return NextResponse.json({ success: true, session: gameSession }, { status: 201 });
  } catch (error) {
    console.error('POST /api/sessions/[id]/combat error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

// PATCH /api/sessions/[id]/combat - Update combat state
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

    // Verify access to campaign (owner or player)
    const campaign = await campaignService.getCampaignById(existingSession.campaignId);
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

    const body = await request.json();
    const gameSession = await sessionService.updateCombatState(id, body);

    // Log the event
    await sessionService.logEvent(id, 'combat:action', body, authSession.user.id);

    return NextResponse.json({ success: true, session: gameSession });
  } catch (error) {
    console.error('PATCH /api/sessions/[id]/combat error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

// DELETE /api/sessions/[id]/combat - End combat
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

    const gameSession = await sessionService.endCombat(id);

    // Log the event
    await sessionService.logEvent(id, 'combat:end', {}, authSession.user.id);

    return NextResponse.json({ success: true, session: gameSession });
  } catch (error) {
    console.error('DELETE /api/sessions/[id]/combat error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
