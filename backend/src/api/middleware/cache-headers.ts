/**
 * Cache Headers Middleware
 * T131: Add request caching headers for content endpoints
 */

import { Request, Response, NextFunction } from 'express';

interface CacheOptions {
  maxAge?: number; // seconds
  sMaxAge?: number; // seconds (for CDN)
  staleWhileRevalidate?: number; // seconds
  private?: boolean;
  noStore?: boolean;
}

/**
 * Set cache control headers
 */
export function setCacheHeaders(options: CacheOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const {
      maxAge = 300, // 5 minutes default
      sMaxAge,
      staleWhileRevalidate,
      private: isPrivate = false,
      noStore = false,
    } = options;

    if (noStore) {
      res.setHeader('Cache-Control', 'no-store');
      next();
      return;
    }

    const directives: string[] = [];

    // Public or Private
    directives.push(isPrivate ? 'private' : 'public');

    // Max age for browsers
    directives.push(`max-age=${maxAge}`);

    // CDN caching (s-maxage)
    if (sMaxAge !== undefined) {
      directives.push(`s-maxage=${sMaxAge}`);
    }

    // Stale-while-revalidate for better UX
    if (staleWhileRevalidate !== undefined) {
      directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    }

    res.setHeader('Cache-Control', directives.join(', '));
    next();
  };
}

/**
 * Short cache for frequently changing content
 */
export const shortCache = setCacheHeaders({
  maxAge: 60, // 1 minute
  sMaxAge: 300, // 5 minutes on CDN
  staleWhileRevalidate: 60,
});

/**
 * Standard cache for content that changes occasionally
 */
export const standardCache = setCacheHeaders({
  maxAge: 300, // 5 minutes
  sMaxAge: 3600, // 1 hour on CDN
  staleWhileRevalidate: 300,
});

/**
 * Long cache for static reference content
 */
export const longCache = setCacheHeaders({
  maxAge: 3600, // 1 hour
  sMaxAge: 86400, // 24 hours on CDN
  staleWhileRevalidate: 3600,
});

/**
 * No cache for personalized or real-time content
 */
export const noCache = setCacheHeaders({
  noStore: true,
});

export default {
  setCacheHeaders,
  shortCache,
  standardCache,
  longCache,
  noCache,
};
