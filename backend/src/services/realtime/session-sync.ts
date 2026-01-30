/**
 * Session Sync Service
 * Handles real-time session synchronization using EventEmitter pattern
 * Uses in-memory event handling for real-time updates
 */

import { EventEmitter } from 'events';

export interface SessionUpdate {
  type: 'session' | 'event' | 'combat' | 'player_joined' | 'player_left';
  sessionId: string;
  payload: unknown;
  timestamp: string;
}

export interface SessionSyncHandler {
  onSessionUpdate?: (update: SessionUpdate) => void;
  onEventCreated?: (event: unknown) => void;
  onCombatStateChange?: (combatState: unknown) => void;
  onPlayerJoin?: (player: unknown) => void;
  onPlayerLeave?: (playerId: string) => void;
  onError?: (error: Error) => void;
}

// Global event emitter for session events
const sessionEmitter = new EventEmitter();
sessionEmitter.setMaxListeners(100); // Allow many concurrent session subscriptions

// Track online players per session
const onlinePlayers: Map<string, Map<string, unknown>> = new Map();

export class SessionSyncService {
  private handlers: SessionSyncHandler = {};
  private boundHandlers: Map<string, (...args: any[]) => void> = new Map();

  constructor(
    private sessionId: string
  ) {}

  /**
   * Subscribe to real-time updates for a session
   */
  subscribe(handlers: SessionSyncHandler): void {
    this.handlers = handlers;

    // Create bound handlers for each event type
    const sessionHandler = (payload: unknown) => {
      const update: SessionUpdate = {
        type: 'session',
        sessionId: this.sessionId,
        payload,
        timestamp: new Date().toISOString(),
      };
      this.handlers.onSessionUpdate?.(update);
    };

    const eventHandler = (payload: unknown) => {
      this.handlers.onEventCreated?.(payload);
      const update: SessionUpdate = {
        type: 'event',
        sessionId: this.sessionId,
        payload,
        timestamp: new Date().toISOString(),
      };
      this.handlers.onSessionUpdate?.(update);
    };

    const combatHandler = (combatState: unknown) => {
      this.handlers.onCombatStateChange?.(combatState);
    };

    const playerJoinHandler = (player: unknown) => {
      this.handlers.onPlayerJoin?.(player);
    };

    const playerLeaveHandler = (playerId: string) => {
      this.handlers.onPlayerLeave?.(playerId);
    };

    // Store bound handlers for cleanup
    this.boundHandlers.set('session', sessionHandler);
    this.boundHandlers.set('event', eventHandler);
    this.boundHandlers.set('combat', combatHandler);
    this.boundHandlers.set('player_join', playerJoinHandler);
    this.boundHandlers.set('player_leave', playerLeaveHandler);

    // Subscribe to events for this session
    sessionEmitter.on(`session:${this.sessionId}:update`, sessionHandler);
    sessionEmitter.on(`session:${this.sessionId}:event`, eventHandler);
    sessionEmitter.on(`session:${this.sessionId}:combat`, combatHandler);
    sessionEmitter.on(`session:${this.sessionId}:player_join`, playerJoinHandler);
    sessionEmitter.on(`session:${this.sessionId}:player_leave`, playerLeaveHandler);

    console.log(`Subscribed to session ${this.sessionId}`);
  }

  /**
   * Track presence (mark player as online in session)
   */
  async trackPresence(userId: string, playerInfo: { name: string; role: string }): Promise<void> {
    if (!onlinePlayers.has(this.sessionId)) {
      onlinePlayers.set(this.sessionId, new Map());
    }

    const sessionPlayers = onlinePlayers.get(this.sessionId)!;
    sessionPlayers.set(userId, {
      user_id: userId,
      online_at: new Date().toISOString(),
      ...playerInfo,
    });

    // Emit player joined event
    sessionEmitter.emit(`session:${this.sessionId}:player_join`, {
      user_id: userId,
      ...playerInfo,
    });
  }

  /**
   * Remove player presence
   */
  async untrackPresence(userId: string): Promise<void> {
    const sessionPlayers = onlinePlayers.get(this.sessionId);
    if (sessionPlayers) {
      sessionPlayers.delete(userId);
      sessionEmitter.emit(`session:${this.sessionId}:player_leave`, userId);
    }
  }

  /**
   * Broadcast a message to all subscribers
   */
  async broadcast(event: string, payload: unknown): Promise<void> {
    sessionEmitter.emit(`session:${this.sessionId}:${event}`, payload);
  }

  /**
   * Broadcast a player action to other players
   */
  async broadcastPlayerAction(
    playerId: string,
    playerName: string,
    action: string
  ): Promise<void> {
    await this.broadcast('event', {
      type: 'player_action',
      player_id: playerId,
      player_name: playerName,
      action,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast combat state update
   */
  async broadcastCombatUpdate(combatState: unknown): Promise<void> {
    await this.broadcast('combat', combatState);
  }

  /**
   * Broadcast session update
   */
  async broadcastSessionUpdate(sessionData: unknown): Promise<void> {
    await this.broadcast('update', sessionData);
  }

  /**
   * Get current online players
   */
  getOnlinePlayers(): Record<string, unknown[]> {
    const sessionPlayers = onlinePlayers.get(this.sessionId);
    if (!sessionPlayers) {
      return {};
    }

    return {
      [this.sessionId]: Array.from(sessionPlayers.values()),
    };
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribe(): Promise<void> {
    // Remove all event listeners for this session
    for (const [eventType, handler] of this.boundHandlers) {
      sessionEmitter.off(`session:${this.sessionId}:${eventType === 'player_join' ? 'player_join' : eventType === 'player_leave' ? 'player_leave' : eventType}`, handler);
    }
    this.boundHandlers.clear();
    this.handlers = {};

    console.log(`Unsubscribed from session ${this.sessionId}`);
  }
}

/**
 * Factory function to create a session sync service
 */
export function createSessionSyncService(
  sessionId: string
): SessionSyncService {
  return new SessionSyncService(sessionId);
}

/**
 * Emit a session update event (for use by other services)
 */
export function emitSessionUpdate(sessionId: string, payload: unknown): void {
  sessionEmitter.emit(`session:${sessionId}:update`, payload);
}

/**
 * Emit a new event notification (for use by other services)
 */
export function emitNewEvent(sessionId: string, event: unknown): void {
  sessionEmitter.emit(`session:${sessionId}:event`, event);
}

/**
 * Emit a combat state change (for use by other services)
 */
export function emitCombatUpdate(sessionId: string, combatState: unknown): void {
  sessionEmitter.emit(`session:${sessionId}:combat`, combatState);
}
