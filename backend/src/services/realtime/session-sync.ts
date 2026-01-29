/**
 * Session Sync Service
 * Handles real-time synchronization for multiplayer sessions
 *
 * NOTE: This is a stub implementation. The original used Supabase Realtime.
 * For production, implement using WebSockets (Socket.io, ws) or similar.
 */

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

/**
 * SessionSyncService provides real-time session synchronization
 *
 * This is a stub implementation that provides the interface but no real-time functionality.
 * For production use, implement with WebSockets or similar technology.
 */
export class SessionSyncService {
  private handlers: SessionSyncHandler = {};
  private isSubscribed: boolean = false;

  constructor(private sessionId: string) {}

  /**
   * Subscribe to real-time updates for a session
   * NOTE: Stub implementation - does not provide real-time updates
   */
  subscribe(handlers: SessionSyncHandler): void {
    this.handlers = handlers;
    this.isSubscribed = true;
    console.log(`SessionSyncService: Subscribed to session ${this.sessionId} (stub)`);
  }

  /**
   * Track presence (mark player as online in session)
   * NOTE: Stub implementation
   */
  async trackPresence(userId: string, playerInfo: { name: string; role: string }): Promise<void> {
    console.log(`SessionSyncService: Tracking presence for ${userId} in session ${this.sessionId} (stub)`, playerInfo);
  }

  /**
   * Broadcast a message to all subscribers
   * NOTE: Stub implementation
   */
  async broadcast(event: string, payload: unknown): Promise<void> {
    console.log(`SessionSyncService: Broadcasting ${event} to session ${this.sessionId} (stub)`, payload);
  }

  /**
   * Broadcast a player action to other players
   */
  async broadcastPlayerAction(
    playerId: string,
    playerName: string,
    action: string
  ): Promise<void> {
    await this.broadcast('player_action', {
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
    await this.broadcast('combat_update', {
      combat_state: combatState,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get current online players
   * NOTE: Stub implementation - returns empty object
   */
  getOnlinePlayers(): Record<string, unknown[]> {
    return {};
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribe(): Promise<void> {
    this.isSubscribed = false;
    this.handlers = {};
    console.log(`SessionSyncService: Unsubscribed from session ${this.sessionId}`);
  }

  /**
   * Check if subscribed
   */
  isConnected(): boolean {
    return this.isSubscribed;
  }
}

/**
 * Factory function to create a session sync service
 */
export function createSessionSyncService(sessionId: string): SessionSyncService {
  return new SessionSyncService(sessionId);
}
