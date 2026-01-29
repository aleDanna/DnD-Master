'use client';

import { useState, useCallback } from 'react';
import {
  rulesApi,
  SourceDocument,
  RuleChapter,
  RuleSection,
  RuleEntry,
  RuleEntryWithContext,
  RuleCategory,
} from '../lib/api';

/**
 * Hook for fetching and managing rules documents hierarchy
 * Tasks: T040
 */

interface UseRulesDocumentsState {
  documents: SourceDocument[];
  chapters: RuleChapter[];
  sections: RuleSection[];
  entries: RuleEntry[];
  entry: RuleEntryWithContext | null;
  categories: RuleCategory[];
  loading: boolean;
  error: string | null;
}

interface UseRulesDocumentsReturn extends UseRulesDocumentsState {
  fetchDocuments: () => Promise<void>;
  fetchChapters: (documentId: string) => Promise<void>;
  fetchSections: (chapterId: string) => Promise<void>;
  fetchEntries: (sectionId: string) => Promise<void>;
  fetchEntry: (entryId: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchCategoryEntries: (categoryId: string, limit?: number, offset?: number) => Promise<{ entries: RuleEntry[]; total: number } | null>;
  clearSelection: () => void;
}

export function useRulesDocuments(token: string | null): UseRulesDocumentsReturn {
  const [state, setState] = useState<UseRulesDocumentsState>({
    documents: [],
    chapters: [],
    sections: [],
    entries: [],
    entry: null,
    categories: [],
    loading: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading, error: loading ? null : prev.error }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, loading: false, error }));
  }, []);

  /**
   * Fetch all source documents
   */
  const fetchDocuments = useCallback(async () => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    setLoading(true);
    try {
      const response = await rulesApi.getDocuments(token);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          documents: response.data!.documents,
          chapters: [],
          sections: [],
          entries: [],
          entry: null,
          loading: false,
        }));
      } else {
        setError(response.error?.message || 'Failed to fetch documents');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    }
  }, [token, setLoading, setError]);

  /**
   * Fetch chapters for a document
   */
  const fetchChapters = useCallback(async (documentId: string) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    setLoading(true);
    try {
      const response = await rulesApi.getChapters(token, documentId);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          chapters: response.data!.chapters,
          sections: [],
          entries: [],
          entry: null,
          loading: false,
        }));
      } else {
        setError(response.error?.message || 'Failed to fetch chapters');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chapters');
    }
  }, [token, setLoading, setError]);

  /**
   * Fetch sections for a chapter
   */
  const fetchSections = useCallback(async (chapterId: string) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    setLoading(true);
    try {
      const response = await rulesApi.getSections(token, chapterId);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          sections: response.data!.sections,
          entries: [],
          entry: null,
          loading: false,
        }));
      } else {
        setError(response.error?.message || 'Failed to fetch sections');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sections');
    }
  }, [token, setLoading, setError]);

  /**
   * Fetch entries for a section
   */
  const fetchEntries = useCallback(async (sectionId: string) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    setLoading(true);
    try {
      const response = await rulesApi.getEntries(token, sectionId);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          entries: response.data!.entries,
          entry: null,
          loading: false,
        }));
      } else {
        setError(response.error?.message || 'Failed to fetch entries');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch entries');
    }
  }, [token, setLoading, setError]);

  /**
   * Fetch a single entry with full context
   */
  const fetchEntry = useCallback(async (entryId: string) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    setLoading(true);
    try {
      const response = await rulesApi.getEntry(token, entryId);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          entry: response.data!.entry,
          loading: false,
        }));
      } else {
        setError(response.error?.message || 'Failed to fetch entry');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch entry');
    }
  }, [token, setLoading, setError]);

  /**
   * Fetch all categories
   */
  const fetchCategories = useCallback(async () => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    setLoading(true);
    try {
      const response = await rulesApi.getCategories(token);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          categories: response.data!.categories,
          loading: false,
        }));
      } else {
        setError(response.error?.message || 'Failed to fetch categories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    }
  }, [token, setLoading, setError]);

  /**
   * Fetch entries for a category with pagination
   */
  const fetchCategoryEntries = useCallback(async (
    categoryId: string,
    limit = 20,
    offset = 0
  ): Promise<{ entries: RuleEntry[]; total: number } | null> => {
    if (!token) {
      setError('Authentication required');
      return null;
    }

    setLoading(true);
    try {
      const response = await rulesApi.getCategoryEntries(token, categoryId, limit, offset);
      setState(prev => ({ ...prev, loading: false }));

      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to fetch category entries');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch category entries');
      return null;
    }
  }, [token, setLoading, setError]);

  /**
   * Clear current selection (reset to document list)
   */
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      chapters: [],
      sections: [],
      entries: [],
      entry: null,
    }));
  }, []);

  return {
    ...state,
    fetchDocuments,
    fetchChapters,
    fetchSections,
    fetchEntries,
    fetchEntry,
    fetchCategories,
    fetchCategoryEntries,
    clearSelection,
  };
}

export default useRulesDocuments;
