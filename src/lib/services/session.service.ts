import { prisma } from '@/lib/db/prisma';
import type {
  GameSession,
  SessionStatus,
  CombatState,
  NarrativeContext,
  ConnectedPlayer,
  Scene,
} from '@/types/session.types';

// ============================================
// Internal Types
// ============================================

type DbGameSession = {
  id: string;
  campaignId: string;
  status: string;
  startedAt: Date | null;
  endedAt: Date | null;
  gameState: unknown;
  combatState: unknown;
  narrativeContext: unknown;
  voiceEnabled: boolean;
  createdAt: Date;
};

// ============================================
// Session Service
// ============================================

export class SessionService {
  /**
   * Create a new game session
   */
  async createSession(campaignId: string): Promise<GameSession> {
    const dbSession = await prisma.gameSession.create({
      data: {
        campaignId,
        status: 'PREPARING',
        gameState: {},
        narrativeContext: {
          recentEvents: [],
          activeNPCs: [],
          mood: 'calm',
        },
        voiceEnabled: false,
      },
    });

    return this.mapDbToSession(dbSession);
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<GameSession | null> {
    const dbSession = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!dbSession) return null;

    return this.mapDbToSession(dbSession);
  }

  /**
   * Get sessions for a campaign
   */
  async getSessionsByCampaignId(campaignId: string): Promise<GameSession[]> {
    const dbSessions = await prisma.gameSession.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });

    return dbSessions.map((s: DbGameSession) => this.mapDbToSession(s));
  }

  /**
   * Start a session
   */
  async startSession(sessionId: string): Promise<GameSession> {
    const dbSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: 'ACTIVE',
        startedAt: new Date(),
      },
    });

    return this.mapDbToSession(dbSession);
  }

  /**
   * Pause a session
   */
  async pauseSession(sessionId: string): Promise<GameSession> {
    const dbSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: 'PAUSED',
      },
    });

    return this.mapDbToSession(dbSession);
  }

  /**
   * Resume a session
   */
  async resumeSession(sessionId: string): Promise<GameSession> {
    const dbSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: 'ACTIVE',
      },
    });

    return this.mapDbToSession(dbSession);
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<GameSession> {
    const dbSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });

    return this.mapDbToSession(dbSession);
  }

  /**
   * Update session game state
   */
  async updateGameState(
    sessionId: string,
    gameState: Record<string, unknown>
  ): Promise<GameSession> {
    const existing = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!existing) {
      throw new Error('Session not found');
    }

    const currentState = (existing.gameState as Record<string, unknown>) || {};
    const newState = { ...currentState, ...gameState };

    const dbSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        gameState: newState,
      },
    });

    return this.mapDbToSession(dbSession);
  }

  /**
   * Update narrative context
   */
  async updateNarrativeContext(
    sessionId: string,
    updates: Partial<NarrativeContext>
  ): Promise<GameSession> {
    const existing = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!existing) {
      throw new Error('Session not found');
    }

    const currentContext = (existing.narrativeContext as NarrativeContext) || {
      recentEvents: [],
      activeNPCs: [],
      mood: 'calm',
    };

    const newContext: NarrativeContext = {
      ...currentContext,
      ...updates,
      recentEvents: updates.recentEvents || currentContext.recentEvents,
      activeNPCs: updates.activeNPCs || currentContext.activeNPCs,
    };

    const dbSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        narrativeContext: newContext as object,
      },
    });

    return this.mapDbToSession(dbSession);
  }

  /**
   * Set current scene
   */
  async setCurrentScene(sessionId: string, scene: Scene): Promise<GameSession> {
    return this.updateNarrativeContext(sessionId, { currentScene: scene });
  }

  /**
   * Add event to recent events
   */
  async addRecentEvent(sessionId: string, event: string): Promise<GameSession> {
    const existing = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!existing) {
      throw new Error('Session not found');
    }

    const currentContext = (existing.narrativeContext as NarrativeContext) || {
      recentEvents: [],
      activeNPCs: [],
      mood: 'calm',
    };

    // Keep last 20 events
    const recentEvents = [event, ...currentContext.recentEvents].slice(0, 20);

    return this.updateNarrativeContext(sessionId, { recentEvents });
  }

  /**
   * Start combat
   */
  async startCombat(sessionId: string, combatState: CombatState): Promise<GameSession> {
    const dbSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        combatState: combatState as object,
      },
    });

    return this.mapDbToSession(dbSession);
  }

  /**
   * Update combat state
   */
  async updateCombatState(
    sessionId: string,
    updates: Partial<CombatState>
  ): Promise<GameSession> {
    const existing = await prisma.gameSession.findUnique({
      where: { id: sessionId },
    });

    if (!existing || !existing.combatState) {
      throw new Error('Session not found or not in combat');
    }

    const currentCombat = existing.combatState as CombatState;
    const newCombat = { ...currentCombat, ...updates };

    const dbSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        combatState: newCombat as object,
      },
    });

    return this.mapDbToSession(dbSession);
  }

  /**
   * End combat
   */
  async endCombat(sessionId: string): Promise<GameSession> {
    const dbSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        combatState: null,
      },
    });

    return this.mapDbToSession(dbSession);
  }

  /**
   * Enable/disable voice
   */
  async setVoiceEnabled(sessionId: string, enabled: boolean): Promise<GameSession> {
    const dbSession = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        voiceEnabled: enabled,
      },
    });

    return this.mapDbToSession(dbSession);
  }

  /**
   * Log session event
   */
  async logEvent(
    sessionId: string,
    eventType: string,
    eventData: unknown,
    actorId?: string
  ): Promise<void> {
    await prisma.sessionEvent.create({
      data: {
        sessionId,
        eventType,
        eventData: eventData as object,
        actorId,
      },
    });
  }

  /**
   * Get session events
   */
  async getSessionEvents(
    sessionId: string,
    limit = 100,
    offset = 0
  ): Promise<{ events: unknown[]; total: number }> {
    const [events, total] = await Promise.all([
      prisma.sessionEvent.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.sessionEvent.count({ where: { sessionId } }),
    ]);

    return { events, total };
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await prisma.gameSession.delete({
      where: { id: sessionId },
    });
  }

  // ============================================
  // Mappers
  // ============================================

  private mapDbToSession(dbSession: DbGameSession): GameSession {
    const gameState = (dbSession.gameState as Record<string, unknown>) || {};

    return {
      id: dbSession.id,
      campaignId: dbSession.campaignId,
      status: dbSession.status.toLowerCase() as SessionStatus,
      startedAt: dbSession.startedAt || undefined,
      endedAt: dbSession.endedAt || undefined,
      connectedPlayers: (gameState.connectedPlayers as ConnectedPlayer[]) || [],
      activeCharacterIds: (gameState.activeCharacterIds as string[]) || [],
      currentScene: (dbSession.narrativeContext as NarrativeContext)?.currentScene,
      combatState: dbSession.combatState as CombatState | undefined,
      narrativeContext: (dbSession.narrativeContext as NarrativeContext) || {
        recentEvents: [],
        activeNPCs: [],
        mood: 'calm',
      },
      voiceEnabled: dbSession.voiceEnabled,
      createdAt: dbSession.createdAt,
    };
  }
}

// Singleton instance
export const sessionService = new SessionService();
