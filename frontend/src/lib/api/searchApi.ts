/**
 * Search API Client
 * T107: Create search API client
 * T127: Update search API client for semantic type
 */

import {
  ApiResponse,
  SearchResponse,
  SearchMode,
  ContentCategory,
} from '@/types/api.types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SearchParams {
  query: string;
  type?: SearchMode;
  categories?: ContentCategory[];
  limit?: number;
}

export interface SearchSuggestion {
  title: string;
  type: string;
  category: ContentCategory;
  slug: string;
}

/**
 * Perform a search query
 */
export async function search(params: SearchParams): Promise<SearchResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('q', params.query);

  if (params.type) {
    searchParams.append('type', params.type);
  }

  if (params.categories && params.categories.length > 0) {
    searchParams.append('categories', params.categories.join(','));
  }

  if (params.limit) {
    searchParams.append('limit', String(params.limit));
  }

  const response = await fetch(`${API_BASE}/api/search?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  const data: ApiResponse<SearchResponse> = await response.json();

  if (!data.success) {
    throw new Error('Search returned unsuccessful response');
  }

  return data.data;
}

/**
 * Get search suggestions for autocomplete
 */
export async function getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  if (query.length < 2) {
    return [];
  }

  const response = await fetch(
    `${API_BASE}/api/search/suggestions?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  if (!data.success) {
    return [];
  }

  return data.data.suggestions || [];
}

export default {
  search,
  getSearchSuggestions,
};
