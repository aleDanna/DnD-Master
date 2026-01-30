// Shared content types for Rules Explorer
// T018: Create shared content types (SourceCitation, BaseEntity)

/**
 * Source citation for tracking content origin
 */
export interface SourceCitation {
  document: string | null;
  page: number | null;
}

/**
 * Base entity interface shared by all content types
 */
export interface BaseEntity {
  id: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  source: SourceCitation;
}

/**
 * Content type identifiers for categorization
 */
export type ContentType =
  | 'rule'
  | 'class'
  | 'subclass'
  | 'race'
  | 'subrace'
  | 'spell'
  | 'monster'
  | 'item'
  | 'background'
  | 'feat'
  | 'condition'
  | 'skill';

/**
 * Content categories for navigation and filtering
 */
export type ContentCategory =
  | 'rules'
  | 'classes'
  | 'races'
  | 'spells'
  | 'bestiary'
  | 'items'
  | 'backgrounds'
  | 'feats'
  | 'conditions'
  | 'skills';

/**
 * Map database row to source citation
 */
export function toSourceCitation(
  sourceDocument: string | null,
  sourcePage: number | null
): SourceCitation {
  return {
    document: sourceDocument,
    page: sourcePage,
  };
}

/**
 * List response wrapper for paginated content
 */
export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Filter options for list queries
 */
export interface ListFilter {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
