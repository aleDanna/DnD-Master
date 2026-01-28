/**
 * Shared type definitions - barrel export
 */

export * from './campaign.js';
export * from './character.js';
export * from './session.js';
export * from './event.js';
export * from './combat.js';

// Re-export common utility types
export type UUID = string;
export type Timestamp = string; // ISO 8601 format

// Common response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
