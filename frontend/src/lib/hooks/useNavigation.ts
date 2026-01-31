/**
 * Navigation Hook
 * T059: Create useNavigation hook (fetch tree, loading states)
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchNavigationTree } from '@/lib/api/navigationApi';
import { NavigationTree } from '@/types/api.types';

/**
 * Hook to fetch and cache the navigation tree
 */
export function useNavigation() {
  const {
    data: tree,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<NavigationTree>({
    queryKey: ['navigation-tree'],
    queryFn: fetchNavigationTree,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    retry: 2,
  });

  return {
    tree,
    categories: tree?.categories || [],
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}

export default useNavigation;
