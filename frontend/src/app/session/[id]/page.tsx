'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/ui/AuthProvider';
import { Button } from '@/components/ui/Button';
import { ChatFeed, ChatInput, type ChatMessage } from '@/components/chat';
import { DiceLog, DiceRoller, CombatTracker, MapCanvas } from '@/components/game';
import { sessionApi, gameApi, combatApi, type CombatState } from '@/lib/api';
import type { TokenData } from '@/components/game/Token';

interface MapState {
  grid_width: number;
  grid_height: number;
  tokens: TokenData[];
  terrain: Array<{ x: number; y: number; type: 'wall' | 'difficult' | 'water' | 'pit' }>;
}

interface SessionData {
  id: string;
  campaign_id: string;
  name: string | null;
  status: 'active' | 'paused' | 'ended';
  narrative_summary: string | null;
  current_location: string | null;
  combat_state: CombatState | null;
  map_state: MapState | null;
  campaign: {
    id: string;
    name: string;
    dice_mode: string;
    map_mode: string;
  };
}

interface DiceRollEntry {
  id: string;
  rollerName: string;
  dice: string;
  reason: string;
  rolls: number[];
  modifier: number;
  total: number;
  criticalHit?: boolean;
  criticalFail?: boolean;
  timestamp: string;
}

export default function SessionPlayPage() {
  const params = useParams();
  const router = useRouter();
  const { session: authSession, user } = useAuth();

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [diceRolls, setDiceRolls] = useState<DiceRollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingAction, setSendingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  const sessionId = params.id as string;
  const isInCombat = combatState?.active ?? false;
  const showMapPanel = sessionData?.campaign.map_mode === 'grid_2d';

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      if (!authSession?.access_token) return;

      try {
        const result = await sessionApi.get(authSession.access_token, sessionId);

        if (!result.success) {
          setError(result.error?.message || 'Failed to load session');
          return;
        }

        setSessionData(result.data as SessionData);

        // Load combat state if exists
        if (result.data?.combat_state) {
          setCombatState(result.data.combat_state as CombatState);
        }

        // Load events
        const eventsResult = await gameApi.getEvents(authSession.access_token, sessionId, {
          limit: 100,
        });

        if (eventsResult.success && eventsResult.data) {
          const chatMessages = eventsResult.data.events
            .filter((e) => ['player_action', 'ai_response', 'dice_roll'].includes(e.type))
            .map((event) => eventToChatMessage(event));
          setMessages(chatMessages);

          // Extract dice rolls
          const rolls = eventsResult.data.events
            .filter((e) => e.type === 'dice_roll')
            .map((event) => eventToDiceRoll(event));
          setDiceRolls(rolls);
        }
      } catch (err) {
        setError('Failed to load session');
        console.error('Load session error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [authSession, sessionId]);

  const handleSubmitAction = useCallback(
    async (action: string) => {
      if (!authSession?.access_token || !sessionData) return;

      setSendingAction(true);

      // Add player message immediately
      const playerMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        type: 'player',
        content: action,
        sender: user?.user_metadata?.name || 'You',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, playerMessage]);

      try {
        const result = await gameApi.submitAction(authSession.access_token, sessionId, action);

        if (!result.success) {
          setError(result.error?.message || 'Failed to submit action');
          // Remove the temp message
          setMessages((prev) => prev.filter((m) => m.id !== playerMessage.id));
          return;
        }

        // Add DM response
        const dmMessage: ChatMessage = {
          id: `dm-${Date.now()}`,
          type: 'dm',
          content: result.data!.narrative,
          sender: 'Dungeon Master',
          timestamp: new Date().toISOString(),
          mechanics: result.data!.mechanics,
          ruleCitations: result.data!.ruleCitations,
        };
        setMessages((prev) => [...prev, dmMessage]);
      } catch (err) {
        setError('Failed to submit action');
        console.error('Submit action error:', err);
        setMessages((prev) => prev.filter((m) => m.id !== playerMessage.id));
      } finally {
        setSendingAction(false);
      }
    },
    [authSession, sessionData, sessionId, user]
  );

  const handleRollDice = useCallback(
    async (dice: string, reason?: string) => {
      if (!authSession?.access_token) return;

      try {
        const result = await gameApi.rollDice(authSession.access_token, sessionId, dice, reason);

        if (!result.success) {
          setError(result.error?.message || 'Failed to roll dice');
          return;
        }

        const rollEntry: DiceRollEntry = {
          id: `roll-${Date.now()}`,
          rollerName: user?.user_metadata?.name || 'You',
          dice,
          reason: reason || 'Roll',
          rolls: result.data!.individualRolls,
          modifier: result.data!.modifier,
          total: result.data!.total,
          criticalHit: result.data!.criticalHit,
          criticalFail: result.data!.criticalFail,
          timestamp: new Date().toISOString(),
        };

        setDiceRolls((prev) => [...prev, rollEntry]);

        // Add system message
        const systemMessage: ChatMessage = {
          id: `sys-${Date.now()}`,
          type: 'system',
          content: `${rollEntry.rollerName} rolled ${dice} for ${reason || 'a check'}`,
          timestamp: new Date().toISOString(),
          diceRoll: {
            dice,
            total: result.data!.total,
            rolls: result.data!.individualRolls,
            criticalHit: result.data!.criticalHit,
            criticalFail: result.data!.criticalFail,
          },
        };
        setMessages((prev) => [...prev, systemMessage]);
      } catch (err) {
        setError('Failed to roll dice');
        console.error('Roll dice error:', err);
      }
    },
    [authSession, sessionId, user]
  );

  const handleEndSession = async () => {
    if (!authSession?.access_token) return;

    try {
      await sessionApi.end(authSession.access_token, sessionId);
      router.push(`/dashboard/campaigns/${sessionData?.campaign_id}`);
    } catch (err) {
      setError('Failed to end session');
      console.error('End session error:', err);
    }
  };

  // Combat handlers
  const handleNextTurn = useCallback(async () => {
    if (!authSession?.access_token) return;

    try {
      const result = await combatApi.nextTurn(authSession.access_token, sessionId);

      if (!result.success) {
        setError(result.error?.message || 'Failed to advance turn');
        return;
      }

      setCombatState(result.data!.combat_state);

      // Add narrative if monster took a turn
      if (result.data!.narrative) {
        const dmMessage: ChatMessage = {
          id: `dm-combat-${Date.now()}`,
          type: 'dm',
          content: result.data!.narrative,
          sender: 'Dungeon Master',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, dmMessage]);
      }

      // Check if combat should end
      if (result.data!.should_end) {
        const systemMessage: ChatMessage = {
          id: `sys-${Date.now()}`,
          type: 'system',
          content: `Combat is ending: ${result.data!.outcome}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, systemMessage]);
      }
    } catch (err) {
      setError('Failed to advance turn');
      console.error('Next turn error:', err);
    }
  }, [authSession, sessionId]);

  const handleEndCombat = useCallback(
    async (outcome: 'victory' | 'defeat' | 'retreat' | 'truce') => {
      if (!authSession?.access_token) return;

      try {
        const result = await combatApi.endCombat(authSession.access_token, sessionId, outcome);

        if (!result.success) {
          setError(result.error?.message || 'Failed to end combat');
          return;
        }

        setCombatState(null);

        // Add combat end narrative
        const dmMessage: ChatMessage = {
          id: `dm-combat-end-${Date.now()}`,
          type: 'dm',
          content: result.data!.narrative,
          sender: 'Dungeon Master',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, dmMessage]);
      } catch (err) {
        setError('Failed to end combat');
        console.error('End combat error:', err);
      }
    },
    [authSession, sessionId]
  );

  const handleTokenSelect = useCallback((token: TokenData | null) => {
    setSelectedTokenId(token?.id ?? null);
  }, []);

  const handleTokenMove = useCallback(
    async (tokenId: string, newX: number, newY: number) => {
      // TODO: Implement token move API call
      console.log('Move token:', tokenId, 'to', newX, newY);
    },
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-danger mb-4">{error || 'Session not found'}</p>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            ←
          </Button>
          <div>
            <h1 className="font-semibold text-foreground">{sessionData.campaign.name}</h1>
            {sessionData.current_location && (
              <p className="text-xs text-muted">📍 {sessionData.current_location}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs px-2 py-1 rounded ${
              sessionData.status === 'active'
                ? 'bg-success/20 text-success'
                : 'bg-warning/20 text-warning'
            }`}
          >
            {sessionData.status}
          </span>
          <Button variant="secondary" size="sm" onClick={handleEndSession}>
            End Session
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map panel (conditional) */}
        {showMapPanel && showMap && sessionData.map_state && (
          <div className="w-96 border-r border-border bg-surface flex flex-col">
            <div className="p-2 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium">Battle Map</span>
              <Button variant="ghost" size="sm" onClick={() => setShowMap(false)}>
                ×
              </Button>
            </div>
            <MapCanvas
              mapState={sessionData.map_state}
              currentTurnTokenId={
                combatState?.initiative_order[combatState.turn_index]?.id
              }
              selectedTokenId={selectedTokenId ?? undefined}
              onTokenSelect={handleTokenSelect}
              onTokenMove={handleTokenMove}
              className="flex-1"
            />
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Combat banner */}
          {isInCombat && (
            <div className="bg-danger/20 border-b border-danger/30 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚔️</span>
                <span className="font-bold text-danger">COMBAT</span>
                <span className="text-sm text-muted">Round {combatState?.round}</span>
              </div>
              {showMapPanel && !showMap && (
                <Button variant="ghost" size="sm" onClick={() => setShowMap(true)}>
                  Show Map
                </Button>
              )}
            </div>
          )}

          <ChatFeed
            messages={messages}
            loading={sendingAction}
            emptyMessage={
              <div className="text-center">
                <p className="text-lg text-foreground mb-2">Your adventure begins...</p>
                <p className="text-sm text-muted">
                  Describe your action to the Dungeon Master
                </p>
              </div>
            }
          />
          <ChatInput
            onSubmit={handleSubmitAction}
            disabled={sessionData.status !== 'active'}
            loading={sendingAction}
            placeholder={isInCombat ? 'Describe your combat action...' : 'What do you do?'}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-border bg-surface overflow-y-auto hidden lg:block">
          <div className="p-4 space-y-4">
            {/* Combat Tracker */}
            {isInCombat && combatState && (
              <CombatTracker
                combatState={combatState}
                isLoading={sendingAction}
                onNextTurn={handleNextTurn}
                onEndCombat={handleEndCombat}
              />
            )}

            {/* Dice tools */}
            <div className="space-y-4">
              <DiceRoller
                onRoll={handleRollDice}
                disabled={sessionData.status !== 'active'}
              />
              <DiceLog entries={diceRolls} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function eventToChatMessage(event: {
  id: string;
  type: string;
  actor_name: string | null;
  content: unknown;
  rule_citations: unknown[];
  created_at: string;
}): ChatMessage {
  const content = event.content as Record<string, unknown>;

  if (event.type === 'player_action') {
    return {
      id: event.id,
      type: 'player',
      content: (content.text as string) || '',
      sender: event.actor_name || undefined,
      timestamp: event.created_at,
    };
  }

  if (event.type === 'ai_response') {
    return {
      id: event.id,
      type: 'dm',
      content: (content.narrative as string) || '',
      sender: 'Dungeon Master',
      timestamp: event.created_at,
      mechanics: content.mechanics as string | undefined,
      ruleCitations: event.rule_citations as ChatMessage['ruleCitations'],
    };
  }

  if (event.type === 'dice_roll') {
    const rollContent = content as {
      dice: string;
      total: number;
      individual_rolls: number[];
      reason: string;
    };
    return {
      id: event.id,
      type: 'system',
      content: `${event.actor_name || 'Someone'} rolled ${rollContent.dice} for ${rollContent.reason}`,
      timestamp: event.created_at,
      diceRoll: {
        dice: rollContent.dice,
        total: rollContent.total,
        rolls: rollContent.individual_rolls,
      },
    };
  }

  return {
    id: event.id,
    type: 'system',
    content: `[${event.type}]`,
    timestamp: event.created_at,
  };
}

function eventToDiceRoll(event: {
  id: string;
  actor_name: string | null;
  content: unknown;
  created_at: string;
}): DiceRollEntry {
  const content = event.content as {
    dice: string;
    reason: string;
    individual_rolls: number[];
    modifier: number;
    total: number;
  };

  return {
    id: event.id,
    rollerName: event.actor_name || 'Unknown',
    dice: content.dice,
    reason: content.reason,
    rolls: content.individual_rolls,
    modifier: content.modifier,
    total: content.total,
    timestamp: event.created_at,
  };
}
