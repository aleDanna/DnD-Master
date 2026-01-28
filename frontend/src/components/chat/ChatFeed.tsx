'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { MessageBubble, type MessageType } from './MessageBubble';
import { SystemMessage } from './SystemMessage';

export interface ChatMessage {
  id: string;
  type: MessageType | 'system';
  content: string;
  sender?: string;
  timestamp: string;
  mechanics?: string;
  ruleCitations?: Array<{
    title: string;
    source: string;
    excerpt?: string;
  }>;
  diceRoll?: {
    dice: string;
    total: number;
    rolls: number[];
    criticalHit?: boolean;
    criticalFail?: boolean;
  };
}

interface ChatFeedProps {
  messages: ChatMessage[];
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: ReactNode;
  className?: string;
}

export function ChatFeed({
  messages,
  loading = false,
  loadingMessage = 'The Dungeon Master is thinking...',
  emptyMessage,
  className = '',
}: ChatFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0 && !loading) {
    return (
      <div
        ref={feedRef}
        className={`flex-1 flex items-center justify-center p-4 ${className}`}
      >
        {emptyMessage || (
          <div className="text-center text-muted">
            <p className="text-lg">Your adventure awaits...</p>
            <p className="text-sm mt-2">Type an action to begin</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={feedRef}
      className={`flex-1 overflow-y-auto p-4 space-y-4 ${className}`}
    >
      {messages.map((message) => {
        if (message.type === 'system') {
          return (
            <SystemMessage
              key={message.id}
              content={message.content}
              mechanics={message.mechanics}
              diceRoll={message.diceRoll}
              timestamp={message.timestamp}
            />
          );
        }

        return (
          <MessageBubble
            key={message.id}
            type={message.type}
            content={message.content}
            sender={message.sender}
            timestamp={message.timestamp}
            mechanics={message.mechanics}
            ruleCitations={message.ruleCitations}
          />
        );
      })}

      {loading && (
        <div className="flex items-center gap-3 text-muted animate-pulse">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm">{loadingMessage}</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
