'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  joinSession,
  leaveSession,
  sendChatMessage,
  rollDice,
  sendCombatAction,
  submitAction,
  onPlayerJoined,
  onPlayerLeft,
  onSessionStatusChanged,
  onNarrativeNew,
  onChatMessage,
  onDiceRoll,
  onCombatStarted,
  onCombatUpdated,
  onCombatEnded,
  onCharacterUpdated,
  onError,
} from '@/lib/socket/client';

interface UseSocketOptions {
  autoConnect?: boolean;
}

interface UseSocketReturn {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (autoConnect) {
      const socket = connectSocket();

      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      // Check if already connected
      if (socket.connected) {
        setIsConnected(true);
      }

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
  }, [autoConnect]);

  const connect = useCallback(() => {
    connectSocket();
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
    setIsConnected(false);
  }, []);

  return { isConnected, connect, disconnect };
}

interface UseSessionSocketOptions {
  sessionId: string;
  userId: string;
  characterId?: string;
}

interface SessionMessage {
  id: string;
  sender: string;
  senderType: string;
  content: string;
  type: string;
  timestamp: string;
}

interface NarrativeEvent {
  id: string;
  text: string;
  type: string;
  timestamp: string;
}

interface DiceRollEvent {
  rollerId: string;
  rollerName: string;
  expression: string;
  result: unknown;
  timestamp: string;
}

interface Player {
  playerId: string;
  playerName: string;
  characterName?: string;
}

interface UseSessionSocketReturn {
  isConnected: boolean;
  players: Player[];
  messages: SessionMessage[];
  narrativeEvents: NarrativeEvent[];
  diceRolls: DiceRollEvent[];
  combatState: unknown;
  sessionStatus: string;
  sendMessage: (content: string, type?: 'ic' | 'ooc' | 'whisper', recipientId?: string) => void;
  roll: (expression: string, reason?: string) => void;
  submitPlayerAction: (action: string) => void;
  sendCombat: (action: unknown) => void;
}

export function useSessionSocket(options: UseSessionSocketOptions): UseSessionSocketReturn {
  const { sessionId, userId, characterId } = options;
  const { isConnected } = useSocket();

  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [narrativeEvents, setNarrativeEvents] = useState<NarrativeEvent[]>([]);
  const [diceRolls, setDiceRolls] = useState<DiceRollEvent[]>([]);
  const [combatState, setCombatState] = useState<unknown>(null);
  const [sessionStatus, setSessionStatus] = useState<string>('preparing');

  useEffect(() => {
    if (!isConnected || !sessionId || !userId) return;

    // Join the session
    joinSession(sessionId, userId, characterId);

    // Set up event listeners
    const unsubPlayerJoined = onPlayerJoined((data) => {
      setPlayers((prev) => {
        const exists = prev.some((p) => p.playerId === data.playerId);
        if (exists) return prev;
        return [...prev, data];
      });
    });

    const unsubPlayerLeft = onPlayerLeft((data) => {
      setPlayers((prev) => prev.filter((p) => p.playerId !== data.playerId));
    });

    const unsubStatusChanged = onSessionStatusChanged((data) => {
      setSessionStatus(data.status);
    });

    const unsubNarrative = onNarrativeNew((data) => {
      setNarrativeEvents((prev) => [...prev, data]);
    });

    const unsubChat = onChatMessage((data) => {
      setMessages((prev) => [...prev, data]);
    });

    const unsubDice = onDiceRoll((data) => {
      setDiceRolls((prev) => [...prev, data]);
    });

    const unsubCombatStart = onCombatStarted((data) => {
      setCombatState(data.combatState);
    });

    const unsubCombatUpdate = onCombatUpdated((data) => {
      setCombatState((prev: unknown) => {
        const prevObj = prev ? (prev as object) : {};
        const updatesObj = data.updates ? (data.updates as object) : {};
        return { ...prevObj, ...updatesObj };
      });
    });

    const unsubCombatEnd = onCombatEnded(() => {
      setCombatState(null);
    });

    const unsubError = onError((data) => {
      console.error('Socket error:', data.message);
    });

    // Cleanup
    return () => {
      leaveSession(sessionId);
      unsubPlayerJoined();
      unsubPlayerLeft();
      unsubStatusChanged();
      unsubNarrative();
      unsubChat();
      unsubDice();
      unsubCombatStart();
      unsubCombatUpdate();
      unsubCombatEnd();
      unsubError();
    };
  }, [isConnected, sessionId, userId, characterId]);

  const sendMessage = useCallback(
    (content: string, type: 'ic' | 'ooc' | 'whisper' = 'ic', recipientId?: string) => {
      if (sessionId) {
        sendChatMessage(sessionId, content, type, recipientId);
      }
    },
    [sessionId]
  );

  const roll = useCallback(
    (expression: string, reason?: string) => {
      if (sessionId) {
        rollDice(sessionId, expression, reason);
      }
    },
    [sessionId]
  );

  const submitPlayerAction = useCallback(
    (action: string) => {
      if (sessionId) {
        submitAction(sessionId, action, characterId);
      }
    },
    [sessionId, characterId]
  );

  const sendCombat = useCallback(
    (action: unknown) => {
      if (sessionId) {
        sendCombatAction(sessionId, action);
      }
    },
    [sessionId]
  );

  return {
    isConnected,
    players,
    messages,
    narrativeEvents,
    diceRolls,
    combatState,
    sessionStatus,
    sendMessage,
    roll,
    submitPlayerAction,
    sendCombat,
  };
}
