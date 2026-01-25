'use client';

import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from './server';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket | null {
  return socket;
}

export function connectSocket(): TypedSocket {
  if (socket?.connected) {
    return socket;
  }

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

  socket = io(socketUrl, {
    path: '/api/socket',
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
  }) as TypedSocket;

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Session functions
export function joinSession(sessionId: string, userId: string, characterId?: string): void {
  const s = getSocket();
  if (s) {
    s.emit('session:join', { sessionId, userId, characterId });
  }
}

export function leaveSession(sessionId: string): void {
  const s = getSocket();
  if (s) {
    s.emit('session:leave', { sessionId });
  }
}

export function setReady(sessionId: string, ready: boolean): void {
  const s = getSocket();
  if (s) {
    s.emit('session:ready', { sessionId, ready });
  }
}

// Chat functions
export function sendChatMessage(
  sessionId: string,
  content: string,
  type: 'ic' | 'ooc' | 'whisper' = 'ic',
  recipientId?: string
): void {
  const s = getSocket();
  if (s) {
    s.emit('chat:send', { sessionId, content, type, recipientId });
  }
}

// Dice functions
export function rollDice(sessionId: string, expression: string, reason?: string): void {
  const s = getSocket();
  if (s) {
    s.emit('dice:roll', { sessionId, expression, reason });
  }
}

// Combat functions
export function sendCombatAction(sessionId: string, action: unknown): void {
  const s = getSocket();
  if (s) {
    s.emit('combat:action', { sessionId, action });
  }
}

// Action functions
export function submitAction(sessionId: string, action: string, characterId?: string): void {
  const s = getSocket();
  if (s) {
    s.emit('action:submit', { sessionId, action, characterId });
  }
}

// Event listeners
export function onPlayerJoined(
  callback: (data: { playerId: string; playerName: string; characterName?: string }) => void
): () => void {
  const s = getSocket();
  if (s) {
    s.on('session:playerJoined', callback);
    return () => s.off('session:playerJoined', callback);
  }
  return () => {};
}

export function onPlayerLeft(callback: (data: { playerId: string }) => void): () => void {
  const s = getSocket();
  if (s) {
    s.on('session:playerLeft', callback);
    return () => s.off('session:playerLeft', callback);
  }
  return () => {};
}

export function onSessionStatusChanged(callback: (data: { status: string }) => void): () => void {
  const s = getSocket();
  if (s) {
    s.on('session:statusChanged', callback);
    return () => s.off('session:statusChanged', callback);
  }
  return () => {};
}

export function onNarrativeNew(
  callback: (data: { id: string; text: string; type: string; timestamp: string }) => void
): () => void {
  const s = getSocket();
  if (s) {
    s.on('narrative:new', callback);
    return () => s.off('narrative:new', callback);
  }
  return () => {};
}

export function onChatMessage(
  callback: (data: { id: string; sender: string; senderType: string; content: string; type: string; timestamp: string }) => void
): () => void {
  const s = getSocket();
  if (s) {
    s.on('chat:message', callback);
    return () => s.off('chat:message', callback);
  }
  return () => {};
}

export function onDiceRoll(
  callback: (data: { rollerId: string; rollerName: string; expression: string; result: unknown; timestamp: string }) => void
): () => void {
  const s = getSocket();
  if (s) {
    s.on('dice:roll', callback);
    return () => s.off('dice:roll', callback);
  }
  return () => {};
}

export function onCombatStarted(callback: (data: { combatState: unknown }) => void): () => void {
  const s = getSocket();
  if (s) {
    s.on('combat:started', callback);
    return () => s.off('combat:started', callback);
  }
  return () => {};
}

export function onCombatUpdated(callback: (data: { updates: unknown }) => void): () => void {
  const s = getSocket();
  if (s) {
    s.on('combat:updated', callback);
    return () => s.off('combat:updated', callback);
  }
  return () => {};
}

export function onCombatEnded(callback: () => void): () => void {
  const s = getSocket();
  if (s) {
    s.on('combat:ended', callback);
    return () => s.off('combat:ended', callback);
  }
  return () => {};
}

export function onCharacterUpdated(
  callback: (data: { characterId: string; updates: unknown }) => void
): () => void {
  const s = getSocket();
  if (s) {
    s.on('character:updated', callback);
    return () => s.off('character:updated', callback);
  }
  return () => {};
}

export function onError(callback: (data: { message: string; code?: string }) => void): () => void {
  const s = getSocket();
  if (s) {
    s.on('error', callback);
    return () => s.off('error', callback);
  }
  return () => {};
}
