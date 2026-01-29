// useFilters Hook - T042
// Parse and manage filters from URL query params

'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export interface FilterConfig<T extends Record<string, unknown>> {
  defaults?: Partial<T>;
  debounceMs?: number;
}

export function useFilters<T extends Record<string, unknown>>(
  config: FilterConfig<T> = {}
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse current filters from URL
  const filters = useMemo(() => {
    const result: Record<string, unknown> = { ...config.defaults };

    searchParams.forEach((value, key) => {
      // Handle array params (same key multiple times)
      const existing = result[key];
      if (existing !== undefined) {
        if (Array.isArray(existing)) {
          (existing as unknown[]).push(parseValue(value));
        } else {
          result[key] = [existing, parseValue(value)];
        }
      } else {
        result[key] = parseValue(value);
      }
    });

    return result as T;
  }, [searchParams, config.defaults]);

  // Update URL with new filters
  const setFilters = useCallback(
    (newFilters: Partial<T>) => {
      const params = new URLSearchParams();

      // Merge with existing filters
      const merged = { ...filters, ...newFilters };

      // Build query string
      for (const [key, value] of Object.entries(merged)) {
        if (value === undefined || value === null || value === '') continue;

        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (v !== undefined && v !== null && v !== '') {
              params.append(key, String(v));
            }
          });
        } else if (typeof value === 'boolean') {
          if (value) {
            params.set(key, 'true');
          }
        } else {
          params.set(key, String(value));
        }
      }

      const queryString = params.toString();
      const newPath = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newPath, { scroll: false });
    },
    [filters, pathname, router]
  );

  // Set a single filter value
  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setFilters({ [key]: value } as Partial<T>);
    },
    [setFilters]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  // Toggle array filter value
  const toggleArrayFilter = useCallback(
    <K extends keyof T>(key: K, value: string) => {
      const current = filters[key];
      let newValue: string[];

      if (Array.isArray(current)) {
        if (current.includes(value)) {
          newValue = current.filter((v) => v !== value);
        } else {
          newValue = [...current, value];
        }
      } else if (current === value) {
        newValue = [];
      } else if (current) {
        newValue = [String(current), value];
      } else {
        newValue = [value];
      }

      setFilters({ [key]: newValue } as Partial<T>);
    },
    [filters, setFilters]
  );

  // Check if a value is active in an array filter
  const isFilterActive = useCallback(
    <K extends keyof T>(key: K, value: string): boolean => {
      const current = filters[key];
      if (Array.isArray(current)) {
        return current.includes(value);
      }
      return current === value;
    },
    [filters]
  );

  return {
    filters,
    setFilters,
    setFilter,
    clearFilters,
    toggleArrayFilter,
    isFilterActive,
  };
}

// Parse string value to appropriate type
function parseValue(value: string): unknown {
  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Number
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') return num;

  // String
  return value;
}

// Spell-specific filter types
export interface SpellFilterState {
  level?: number[];
  school?: string[];
  concentration?: boolean;
  ritual?: boolean;
  class?: string[];
}

// Monster-specific filter types
export interface MonsterFilterState {
  crMin?: number;
  crMax?: number;
  size?: string[];
  type?: string[];
}

// Item-specific filter types
export interface ItemFilterState {
  type?: string[];
  rarity?: string[];
  attunement?: boolean;
}
