'use client';

import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '../ui/Button';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function ChatInput({
  onSubmit,
  placeholder = 'What do you do?',
  disabled = false,
  loading = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || loading) return;

    onSubmit(trimmedMessage);
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-surface">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || loading}
            rows={1}
            className="
              w-full px-4 py-3 bg-background border border-border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              transition-colors placeholder:text-muted resize-none
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            style={{ minHeight: '48px', maxHeight: '200px' }}
          />
        </div>

        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          loading={loading}
          className="self-end"
        >
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>Press Enter to send, Shift+Enter for new line</span>
        <span>{message.length}/2000</span>
      </div>
    </form>
  );
}
