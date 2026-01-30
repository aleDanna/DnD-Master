/**
 * Sidebar Hook
 * T058: Create useSidebar hook (expansion state, localStorage)
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'rules-explorer-sidebar-expanded';

/**
 * Hook to manage sidebar expansion state with localStorage persistence
 */
export function useSidebar() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setExpanded(new Set(parsed));
          }
        }
      } catch (e) {
        console.error('Failed to load sidebar state:', e);
      }
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when expanded changes
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...expanded]));
      } catch (e) {
        console.error('Failed to save sidebar state:', e);
      }
    }
  }, [expanded, isLoaded]);

  /**
   * Toggle expansion state for a node
   */
  const toggle = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * Check if a node is expanded
   */
  const isExpanded = useCallback((id: string) => {
    return expanded.has(id);
  }, [expanded]);

  /**
   * Expand a node (without toggle)
   */
  const expand = useCallback((id: string) => {
    setExpanded(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  /**
   * Collapse a node (without toggle)
   */
  const collapse = useCallback((id: string) => {
    setExpanded(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  /**
   * Expand all nodes in a path
   */
  const expandPath = useCallback((ids: string[]) => {
    setExpanded(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  /**
   * Collapse all nodes
   */
  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  /**
   * Expand specific category by slug
   */
  const expandCategory = useCallback((category: string) => {
    expand(category);
  }, [expand]);

  return {
    expanded,
    isExpanded,
    toggle,
    expand,
    collapse,
    expandPath,
    collapseAll,
    expandCategory,
    isLoaded,
  };
}

export default useSidebar;
