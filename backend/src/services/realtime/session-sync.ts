/**
 * Session Sync Service
 * Handles Supabase Realtime subscriptions for multiplayer sessions
 */

import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../models/database.types.js';

type DbClient = SupabaseClient<Database>;

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

export class SessionSyncService {
  private channel: RealtimeChannel | null = null;
  private handlers: SessionSyncHandler = {};

  constructor(
    private client: DbClient,
    private sessionId: string
  ) {}

  /**
   * Subscribe to real-time updates for a session
   */
  subscribe(handlers: SessionSyncHandler): void {
    this.handlers = handlers;

    // Create channel for this session
    this.channel = this.client.channel(`session:${this.sessionId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: this.sessionId },
      },
    });

    // Subscribe to session table changes
    this.channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${this.sessionId}`,
      },
      (payload) => {
        this.handleSessionChange(payload);
      }
    );

    // Subscribe to new events
    this.channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
        filter: `session_id=eq.${this.sessionId}`,
      },
      (payload) => {
        this.handleNewEvent(payload);
      }
    );

    // Subscribe to broadcast messages for custom updates
    this.channel.on('broadcast', { event: 'player_action' }, (payload) => {
      this.handleBroadcast('player_action', payload);
    });

    this.channel.on('broadcast', { event: 'combat_update' }, (payload) => {
      this.handleBroadcast('combat_update', payload);
    });

    this.channel.on('broadcast', { event: 'player_joined' }, (payload) => {
      this.handleBroadcast('player_joined', payload);
    });

    this.channel.on('broadcast', { event: 'player_left' }, (payload) => {
      this.handleBroadcast('player_left', payload);
    });

    // Handle presence (who's online)
    this.channel.on('presence', { event: 'sync' }, () => {
      const state = this.channel?.presenceState();
      console.log('Presence sync:', state);
    });

    this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('Player joined:', key, newPresences);
      if (handlers.onPlayerJoin) {
        handlers.onPlayerJoin(newPresences);
      }
    });

    this.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('Player left:', key, leftPresences);
      if (handlers.onPlayerLeave) {
        handlers.onPlayerLeave(key);
      }
    });

    // Subscribe to channel
    this.channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to session ${this.sessionId}`);
      } else if (status === 'CHANNEL_ERROR') {
        handlers.onError?.(new Error('Channel subscription error'));
      }
    });
  }

  /**
   * Track presence (mark player as online in session)
   */
  async trackPresence(userId: string, playerInfo: { name: string; role: string }): Promise<void> {
    if (!this.channel) {
      throw new Error('Not subscribed to session');
    }

    await this.channel.track({
      user_id: userId,
      online_at: new Date().toISOString(),
      ...playerInfo,
    });
  }

  /**
   * Broadcast a message to all subscribers
   */
  async broadcast(event: string, payload: unknown): Promise<void> {
    if (!this.channel) {
      throw new Error('Not subscribed to session');
    }

    await this.channel.send({
      type: 'broadcast',
      event,
      payload,
    });
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
   */
  getOnlinePlayers(): Record<string, unknown[]> {
    return this.channel?.presenceState() || {};
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribe(): Promise<void> {
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }
    this.handlers = {};
  }

  private handleSessionChange(payload: { new: unknown; old: unknown }): void {
    const update: SessionUpdate = {
      type: 'session',
      sessionId: this.sessionId,
      payload: payload.new,
      timestamp: new Date().toISOString(),
    };

    this.handlers.onSessionUpdate?.(update);

    // Check for combat state change
    const newSession = payload.new as { combat_state?: unknown };
    const oldSession = payload.old as { combat_state?: unknown };
    if (JSON.stringify(newSession.combat_state) !== JSON.stringify(oldSession.combat_state)) {
      this.handlers.onCombatStateChange?.(newSession.combat_state);
    }
  }

  private handleNewEvent(payload: { new: unknown }): void {
    this.handlers.onEventCreated?.(payload.new);

    const update: SessionUpdate = {
      type: 'event',
      sessionId: this.sessionId,
      payload: payload.new,
      timestamp: new Date().toISOString(),
    };

    this.handlers.onSessionUpdate?.(update);
  }

  private handleBroadcast(event: string, payload: { payload: unknown }): void {
    switch (event) {
      case 'player_joined':
        this.handlers.onPlayerJoin?.(payload.payload);
        break;
      case 'player_left':
        this.handlers.onPlayerLeave?.(payload.payload as string);
        break;
      case 'combat_update':
        const combatPayload = payload.payload as { combat_state: unknown };
        this.handlers.onCombatStateChange?.(combatPayload.combat_state);
        break;
    }
  }
}

/**
 * Factory function to create a session sync service
 */
export function createSessionSyncService(
  client: DbClient,
  sessionId: string
): SessionSyncService {
  return new SessionSyncService(client, sessionId);
}
