'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: () => void;
  description?: string;
}

/**
 * useKeyboardShortcuts - Hook for handling keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input/textarea
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatch = shortcut.meta ? event.metaKey : true;

        // Allow Escape even when typing
        const isEscape = shortcut.key.toLowerCase() === 'escape';
        const shouldTrigger = isEscape || !isTyping;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch && shouldTrigger) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Common shortcut configurations
 */
export const commonShortcuts = {
  escape: (handler: () => void): KeyboardShortcut => ({
    key: 'Escape',
    handler,
    description: 'Close modal/Cancel action',
  }),

  enter: (handler: () => void): KeyboardShortcut => ({
    key: 'Enter',
    ctrl: true,
    handler,
    description: 'Submit form',
  }),

  save: (handler: () => void): KeyboardShortcut => ({
    key: 's',
    ctrl: true,
    handler,
    description: 'Save',
  }),

  newItem: (handler: () => void): KeyboardShortcut => ({
    key: 'n',
    ctrl: true,
    handler,
    description: 'New item',
  }),

  search: (handler: () => void): KeyboardShortcut => ({
    key: 'k',
    ctrl: true,
    handler,
    description: 'Search',
  }),
};

export default useKeyboardShortcuts;
