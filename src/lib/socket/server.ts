import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';

// Types for Socket events
export interface ServerToClientEvents {
  // Session events
  'session:playerJoined': (data: { playerId: string; playerName: string; characterName?: string }) => void;
  'session:playerLeft': (data: { playerId: string }) => void;
  'session:statusChanged': (data: { status: string }) => void;
  'session:sceneChanged': (data: { scene: unknown }) => void;

  // Narrative events
  'narrative:new': (data: { id: string; text: string; type: string; timestamp: string }) => void;
  'narrative:update': (data: { id: string; text: string }) => void;

  // Combat events
  'combat:started': (data: { combatState: unknown }) => void;
  'combat:updated': (data: { updates: unknown }) => void;
  'combat:turnChanged': (data: { currentTurnIndex: number; combatantId: string }) => void;
  'combat:ended': () => void;

  // Chat events
  'chat:message': (data: { id: string; sender: string; senderType: string; content: string; type: string; timestamp: string }) => void;

  // Dice events
  'dice:roll': (data: { rollerId: string; rollerName: string; expression: string; result: unknown; timestamp: string }) => void;

  // Character events
  'character:updated': (data: { characterId: string; updates: unknown }) => void;

  // Voice events
  'voice:started': (data: { participantId: string }) => void;
  'voice:stopped': (data: { participantId: string }) => void;

  // Error events
  'error': (data: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  // Session events
  'session:join': (data: { sessionId: string; userId: string; characterId?: string }) => void;
  'session:leave': (data: { sessionId: string }) => void;
  'session:ready': (data: { sessionId: string; ready: boolean }) => void;

  // Action events
  'action:submit': (data: { sessionId: string; action: string; characterId?: string }) => void;

  // Chat events
  'chat:send': (data: { sessionId: string; content: string; type: 'ic' | 'ooc' | 'whisper'; recipientId?: string }) => void;

  // Dice events
  'dice:roll': (data: { sessionId: string; expression: string; reason?: string }) => void;

  // Combat events
  'combat:action': (data: { sessionId: string; action: unknown }) => void;

  // Voice events
  'voice:toggle': (data: { sessionId: string; muted: boolean }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  sessionId?: string;
  characterId?: string;
}

// Session rooms management
const sessionRooms = new Map<string, Set<string>>(); // sessionId -> Set of socket IDs
const socketToSession = new Map<string, string>(); // socket ID -> session ID

export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle session join
    socket.on('session:join', async (data) => {
      const { sessionId, userId, characterId } = data;

      // Store socket data
      socket.data.userId = userId;
      socket.data.sessionId = sessionId;
      socket.data.characterId = characterId;

      // Join the session room
      socket.join(`session:${sessionId}`);

      // Track the socket
      if (!sessionRooms.has(sessionId)) {
        sessionRooms.set(sessionId, new Set());
      }
      sessionRooms.get(sessionId)?.add(socket.id);
      socketToSession.set(socket.id, sessionId);

      // Notify others in the session
      socket.to(`session:${sessionId}`).emit('session:playerJoined', {
        playerId: userId,
        playerName: `Player ${userId.slice(0, 6)}`, // In real app, fetch from DB
        characterName: characterId ? `Character ${characterId.slice(0, 6)}` : undefined,
      });

      console.log(`User ${userId} joined session ${sessionId}`);
    });

    // Handle session leave
    socket.on('session:leave', (data) => {
      const { sessionId } = data;
      leaveSession(socket, sessionId);
    });

    // Handle chat messages
    socket.on('chat:send', (data) => {
      const { sessionId, content, type, recipientId } = data;
      const userId = socket.data.userId;

      if (!userId) return;

      const message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sender: `Player ${userId.slice(0, 6)}`,
        senderType: 'player',
        content,
        type,
        timestamp: new Date().toISOString(),
      };

      if (type === 'whisper' && recipientId) {
        // Send only to specific user
        const recipientSockets = Array.from(sessionRooms.get(sessionId) || [])
          .filter(sid => {
            const s = io.sockets.sockets.get(sid);
            return s?.data.userId === recipientId;
          });
        recipientSockets.forEach(sid => {
          io.to(sid).emit('chat:message', message);
        });
        // Also send to sender
        socket.emit('chat:message', message);
      } else {
        // Broadcast to all in session
        io.to(`session:${sessionId}`).emit('chat:message', message);
      }
    });

    // Handle dice rolls
    socket.on('dice:roll', (data) => {
      const { sessionId, expression, reason } = data;
      const userId = socket.data.userId;

      if (!userId) return;

      // Simple dice roll logic (in real app, use dice service)
      const match = expression.match(/^(\d+)?d(\d+)([+-]\d+)?$/i);
      if (!match) {
        socket.emit('error', { message: 'Invalid dice expression' });
        return;
      }

      const count = parseInt(match[1]) || 1;
      const sides = parseInt(match[2]);
      const modifier = parseInt(match[3]) || 0;

      const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
      const total = rolls.reduce((a, b) => a + b, 0) + modifier;

      const rollData = {
        rollerId: userId,
        rollerName: `Player ${userId.slice(0, 6)}`,
        expression,
        result: {
          rolls,
          modifier,
          total,
          reason,
        },
        timestamp: new Date().toISOString(),
      };

      io.to(`session:${sessionId}`).emit('dice:roll', rollData);
    });

    // Handle combat actions
    socket.on('combat:action', (data) => {
      const { sessionId, action } = data;

      // Broadcast combat action to all in session
      // In real app, validate and process the action
      io.to(`session:${sessionId}`).emit('combat:updated', { updates: action });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const sessionId = socketToSession.get(socket.id);
      if (sessionId) {
        leaveSession(socket, sessionId);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  function leaveSession(socket: Socket, sessionId: string) {
    const userId = socket.data.userId;

    socket.leave(`session:${sessionId}`);
    sessionRooms.get(sessionId)?.delete(socket.id);
    socketToSession.delete(socket.id);

    if (sessionRooms.get(sessionId)?.size === 0) {
      sessionRooms.delete(sessionId);
    }

    // Notify others
    if (userId) {
      socket.to(`session:${sessionId}`).emit('session:playerLeft', {
        playerId: userId,
      });
    }

    // Clear socket data
    socket.data.sessionId = undefined;
    socket.data.characterId = undefined;

    console.log(`User ${userId} left session ${sessionId}`);
  }

  return io;
}

// Helper functions for emitting events from API routes
export function emitToSession(io: SocketIOServer, sessionId: string, event: keyof ServerToClientEvents, data: unknown): void {
  io.to(`session:${sessionId}`).emit(event, data as never);
}

export function emitNarrative(io: SocketIOServer, sessionId: string, narrative: { id: string; text: string; type: string }): void {
  io.to(`session:${sessionId}`).emit('narrative:new', {
    ...narrative,
    timestamp: new Date().toISOString(),
  });
}

export function emitCombatUpdate(io: SocketIOServer, sessionId: string, updates: unknown): void {
  io.to(`session:${sessionId}`).emit('combat:updated', { updates });
}

export function emitCharacterUpdate(io: SocketIOServer, sessionId: string, characterId: string, updates: unknown): void {
  io.to(`session:${sessionId}`).emit('character:updated', { characterId, updates });
}
