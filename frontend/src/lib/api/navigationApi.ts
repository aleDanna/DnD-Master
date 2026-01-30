/**
 * Navigation API Client
 * T056: Create navigation API client
 */

import { NavigationTree, ApiResponse } from '@/types/api.types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Fetch the navigation tree for the sidebar
 */
export async function fetchNavigationTree(): Promise<NavigationTree> {
  const response = await fetch(`${API_BASE}/api/content/navigation/tree`);

  if (!response.ok) {
    throw new Error('Failed to fetch navigation tree');
  }

  const data: ApiResponse<NavigationTree> = await response.json();

  if (!data.success) {
    throw new Error('API returned unsuccessful response');
  }

  return data.data;
}

export default {
  fetchNavigationTree,
};
