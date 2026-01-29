/**
 * State Service
 * Manages session state and coordinates state changes
 */

import { SessionRepository } from '../data/session-repo.js';
import { EventRepository } from '../data/event-repo.js';
import type { Session, UpdateSessionInput, NPC, MapState } from '../../models/session.js';
import type { CombatState, Combatant } from '../../models/combat.js';
import type { StateChangeContent } from '../../models/event.js';

export class StateService {
  constructor(
    private sessionRepo: SessionRepository,
    private eventRepo: EventRepository
  ) {}

  /**
   * Get current session state
   */
  async getState(sessionId: string): Promise<Session | null> {
    return this.sessionRepo.getById(sessionId);
  }

  /**
   * Apply state changes from AI response
   */
  async applyStateChanges(
    sessionId: string,
    changes: StateChangeContent[]
  ): Promise<Session> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const updates: UpdateSessionInput = {};

    for (const change of changes) {
      await this.applyChange(session, change, updates);
    }

    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
      return this.sessionRepo.update(sessionId, updates, session.version);
    }

    return session;
  }

  /**
   * Apply a single state change
   */
  private async applyChange(
    session: Session,
    change: StateChangeContent,
    updates: UpdateSessionInput
  ): Promise<void> {
    switch (change.type) {
      case 'damage':
      case 'heal':
        await this.applyHpChange(session, change, updates);
        break;

      case 'condition_add':
      case 'condition_remove':
        await this.applyConditionChange(session, change, updates);
        break;

      case 'move':
        await this.applyMove(session, change, updates);
        break;

      case 'inventory':
        // Inventory changes are handled by character service
        break;

      case 'custom':
        // Log custom changes but don't modify state
        break;
    }
  }

  /**
   * Apply HP change to a combatant
   */
  private async applyHpChange(
    session: Session,
    change: StateChangeContent,
    updates: UpdateSessionInput
  ): Promise<void> {
    if (!session.combat_state || !change.target || typeof change.value !== 'number') {
      return;
    }

    const combatState = { ...session.combat_state };
    const combatant = combatState.combatants.find(c => c.id === change.target);

    if (!combatant) return;

    if (change.type === 'damage') {
      combatant.current_hp = Math.max(0, combatant.current_hp - change.value);
    } else if (change.type === 'heal') {
      combatant.current_hp = Math.min(combatant.max_hp, combatant.current_hp + change.value);
    }

    updates.combat_state = combatState;
  }

  /**
   * Apply condition change to a combatant
   */
  private async applyConditionChange(
    session: Session,
    change: StateChangeContent,
    updates: UpdateSessionInput
  ): Promise<void> {
    if (!session.combat_state || !change.target || typeof change.value !== 'string') {
      return;
    }

    const combatState = { ...session.combat_state };
    const combatant = combatState.combatants.find(c => c.id === change.target);

    if (!combatant) return;

    if (change.type === 'condition_add') {
      // Check if condition already exists
      if (!combatant.conditions.some(c => c.name === change.value)) {
        combatant.conditions.push({ name: change.value });
      }
    } else if (change.type === 'condition_remove') {
      combatant.conditions = combatant.conditions.filter(c => c.name !== change.value);
    }

    updates.combat_state = combatState;
  }

  /**
   * Apply position change on the map
   */
  private async applyMove(
    session: Session,
    change: StateChangeContent,
    updates: UpdateSessionInput
  ): Promise<void> {
    if (!session.map_state || !change.target) {
      return;
    }

    const mapState = { ...session.map_state };
    const token = mapState.tokens.find(t => t.id === change.target);

    if (!token || typeof change.value !== 'string') return;

    // Parse position from value (format: "x,y")
    const [x, y] = change.value.split(',').map(n => parseInt(n.trim(), 10));
    if (!isNaN(x) && !isNaN(y)) {
      token.x = x;
      token.y = y;
    }

    updates.map_state = mapState;
  }

  /**
   * Update narrative summary
   */
  async updateNarrativeSummary(sessionId: string, summary: string): Promise<Session> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    return this.sessionRepo.update(
      sessionId,
      { narrative_summary: summary },
      session.version
    );
  }

  /**
   * Update current location
   */
  async updateLocation(sessionId: string, location: string): Promise<Session> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    return this.sessionRepo.update(
      sessionId,
      { current_location: location },
      session.version
    );
  }

  /**
   * Add an active NPC
   */
  async addNPC(sessionId: string, npc: NPC): Promise<Session> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const npcs = [...session.active_npcs, npc];

    return this.sessionRepo.update(sessionId, { active_npcs: npcs }, session.version);
  }

  /**
   * Remove an active NPC
   */
  async removeNPC(sessionId: string, npcId: string): Promise<Session> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const npcs = session.active_npcs.filter(n => n.id !== npcId);

    return this.sessionRepo.update(sessionId, { active_npcs: npcs }, session.version);
  }

  /**
   * Start combat
   */
  async startCombat(sessionId: string, combatants: Combatant[]): Promise<Session> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Sort by initiative (descending)
    const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);

    // Build initiative order from sorted combatants
    const initiativeOrder = sorted.map(c => ({
      id: c.id,
      type: c.type,
      name: c.name,
      initiative: c.initiative,
    }));

    const combatState: CombatState = {
      active: true,
      round: 1,
      turn_index: 0,
      initiative_order: initiativeOrder,
      combatants: sorted,
    };

    // Create combat start event
    await this.eventRepo.create({
      session_id: sessionId,
      type: 'combat_start',
      content: {
        participants: sorted.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          initiative: c.initiative,
        })),
      },
    });

    // Create turn start event for first combatant
    await this.eventRepo.create({
      session_id: sessionId,
      type: 'turn_start',
      content: {
        combatant_id: sorted[0].id,
        combatant_name: sorted[0].name,
        round: 1,
      },
    });

    return this.sessionRepo.update(
      sessionId,
      { combat_state: combatState },
      session.version
    );
  }

  /**
   * End the current combatant's turn and start the next
   */
  async nextTurn(sessionId: string): Promise<Session> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session || !session.combat_state) {
      throw new Error('No active combat');
    }

    const combatState = { ...session.combat_state };
    const currentIndex = combatState.turn_index;
    const currentEntry = combatState.initiative_order[currentIndex];
    const currentCombatant = combatState.combatants.find(c => c.id === currentEntry.id);

    // Create turn end event
    if (currentCombatant) {
      await this.eventRepo.create({
        session_id: sessionId,
        type: 'turn_end',
        content: {
          combatant_id: currentCombatant.id,
          combatant_name: currentCombatant.name,
          round: combatState.round,
        },
      });
    }

    // Move to next active combatant
    let nextIndex = currentIndex;
    let attempts = 0;
    do {
      nextIndex = (nextIndex + 1) % combatState.initiative_order.length;
      if (nextIndex === 0) {
        combatState.round += 1;
      }
      attempts++;
      const entry = combatState.initiative_order[nextIndex];
      const combatant = combatState.combatants.find(c => c.id === entry.id);
      if (combatant?.is_active) break;
    } while (attempts < combatState.initiative_order.length);

    combatState.turn_index = nextIndex;
    const nextEntry = combatState.initiative_order[nextIndex];
    const nextCombatant = combatState.combatants.find(c => c.id === nextEntry.id);

    // Create turn start event
    if (nextCombatant) {
      await this.eventRepo.create({
        session_id: sessionId,
        type: 'turn_start',
        content: {
          combatant_id: nextCombatant.id,
          combatant_name: nextCombatant.name,
          round: combatState.round,
        },
      });
    }

    return this.sessionRepo.update(
      sessionId,
      { combat_state: combatState },
      session.version
    );
  }

  /**
   * End combat
   */
  async endCombat(
    sessionId: string,
    outcome: 'victory' | 'defeat' | 'retreat' | 'truce',
    summary?: string
  ): Promise<Session> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Create combat end event
    await this.eventRepo.create({
      session_id: sessionId,
      type: 'combat_end',
      content: { outcome, summary },
    });

    return this.sessionRepo.update(
      sessionId,
      { combat_state: null },
      session.version
    );
  }

  /**
   * Initialize map state
   */
  async initializeMap(
    sessionId: string,
    width: number,
    height: number
  ): Promise<Session> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const mapState: MapState = {
      grid_width: width,
      grid_height: height,
      tokens: [],
      terrain: [],
    };

    return this.sessionRepo.update(
      sessionId,
      { map_state: mapState },
      session.version
    );
  }

  /**
   * Add a token to the map
   */
  async addMapToken(
    sessionId: string,
    token: MapState['tokens'][0]
  ): Promise<Session> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session || !session.map_state) {
      throw new Error('No map initialized');
    }

    const mapState = { ...session.map_state };
    mapState.tokens.push(token);

    return this.sessionRepo.update(
      sessionId,
      { map_state: mapState },
      session.version
    );
  }

  /**
   * Remove a token from the map
   */
  async removeMapToken(sessionId: string, tokenId: string): Promise<Session> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session || !session.map_state) {
      throw new Error('No map initialized');
    }

    const mapState = { ...session.map_state };
    mapState.tokens = mapState.tokens.filter(t => t.id !== tokenId);

    return this.sessionRepo.update(
      sessionId,
      { map_state: mapState },
      session.version
    );
  }

  /**
   * Try to apply state changes with conflict detection (for multiplayer)
   * Returns { success: boolean, session: Session, conflictError?: string }
   */
  async tryApplyStateChanges(
    sessionId: string,
    changes: StateChangeContent[],
    expectedVersion: number
  ): Promise<{ success: boolean; session: Session; conflictError?: string }> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check for version conflict
    if (session.version !== expectedVersion) {
      return {
        success: false,
        session,
        conflictError: `Version conflict: expected ${expectedVersion}, but session is at version ${session.version}. Another player may have made changes.`,
      };
    }

    try {
      const updatedSession = await this.applyStateChanges(sessionId, changes);
      return { success: true, session: updatedSession };
    } catch (error) {
      if (error instanceof Error && error.message.includes('modified by another request')) {
        return {
          success: false,
          session,
          conflictError: 'Session was modified by another player. Please refresh and try again.',
        };
      }
      throw error;
    }
  }

  /**
   * Get current session version (for multiplayer conflict detection)
   */
  async getSessionVersion(sessionId: string): Promise<number | null> {
    const session = await this.sessionRepo.getById(sessionId);
    return session?.version ?? null;
  }

  /**
   * Check if session has been modified since a given version
   */
  async hasBeenModified(sessionId: string, sinceVersion: number): Promise<boolean> {
    const currentVersion = await this.getSessionVersion(sessionId);
    return currentVersion !== null && currentVersion > sinceVersion;
  }

  /**
   * Lock session for exclusive access during complex operations
   * Uses advisory locking via version increment
   */
  async lockSession(sessionId: string): Promise<{ version: number; session: Session }> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Touch the session to claim it
    const updated = await this.sessionRepo.update(sessionId, {}, session.version);
    return { version: updated.version, session: updated };
  }

  /**
   * Get active player count in a session (for multiplayer awareness)
   */
  async getActivePlayerInfo(sessionId: string): Promise<{
    sessionId: string;
    version: number;
    lastActivity: string;
    isActive: boolean;
  }> {
    const session = await this.sessionRepo.getById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    return {
      sessionId: session.id,
      version: session.version,
      lastActivity: session.last_activity,
      isActive: session.status === 'active',
    };
  }
}

/**
 * Factory function to create a state service
 */
export function createStateService(
  sessionRepo: SessionRepository,
  eventRepo?: EventRepository
): StateService {
  // If eventRepo is not provided, create a minimal stub
  const repo = eventRepo || ({
    create: async () => ({ id: '', session_id: '', type: 'state_change', actor_id: null, actor_name: null, content: {}, rule_citations: [], sequence: 0, created_at: '' }),
  } as unknown as EventRepository);
  return new StateService(sessionRepo, repo);
}
