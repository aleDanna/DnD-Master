// RuleHierarchy Component - T028
// Collapsible tree view for rule categories

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { getRuleCategoryChildren, getRules } from '@/lib/handbook/api';
import type { RuleCategory, RuleSummary } from '@/lib/handbook/types';

interface RuleHierarchyProps {
  categories: RuleCategory[];
  selectedCategoryId?: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function RuleHierarchy({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: RuleHierarchyProps) {
  return (
    <div className="space-y-1">
      <button
        onClick={() => onSelectCategory(null)}
        className={`
          w-full text-left px-3 py-2 rounded-lg text-sm font-medium
          transition-colors duration-200
          ${
            !selectedCategoryId
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }
        `}
      >
        All Rules
      </button>
      {categories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={onSelectCategory}
          depth={0}
        />
      ))}
    </div>
  );
}

interface CategoryNodeProps {
  category: RuleCategory;
  selectedCategoryId?: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  depth: number;
}

function CategoryNode({
  category,
  selectedCategoryId,
  onSelectCategory,
  depth,
}: CategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<RuleCategory[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hasChildren = (category.childCount ?? 0) > 0;
  const isSelected = selectedCategoryId === category.id;

  const handleExpand = useCallback(async () => {
    if (!hasChildren) return;

    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    if (!children) {
      setIsLoading(true);
      try {
        const fetchedChildren = await getRuleCategoryChildren(category.id);
        setChildren(fetchedChildren);
      } catch (error) {
        console.error('Failed to load children:', error);
      } finally {
        setIsLoading(false);
      }
    }
    setIsExpanded(true);
  }, [hasChildren, isExpanded, children, category.id]);

  return (
    <div className="relative">
      <div
        className="flex items-center"
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        {/* Expand/Collapse button */}
        <button
          onClick={handleExpand}
          className={`
            w-6 h-6 flex items-center justify-center text-gray-400
            ${hasChildren ? 'hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer' : 'invisible'}
          `}
          disabled={!hasChildren}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isLoading ? (
            <LoadingSpinner size={14} />
          ) : hasChildren ? (
            <ChevronIcon expanded={isExpanded} />
          ) : null}
        </button>

        {/* Category button */}
        <button
          onClick={() => onSelectCategory(category.id)}
          className={`
            flex-1 text-left px-2 py-1.5 rounded-lg text-sm
            transition-colors duration-200
            ${
              isSelected
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          <span className="font-medium">{category.name}</span>
          {(category.ruleCount ?? 0) > 0 && (
            <span className="ml-2 text-xs text-gray-500">
              ({category.ruleCount})
            </span>
          )}
        </button>
      </div>

      {/* Children */}
      {isExpanded && children && (
        <div className="mt-1">
          {children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function LoadingSpinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// Rule list for selected category
interface RuleListProps {
  categoryId: string | null;
}

export function RuleList({ categoryId }: RuleListProps) {
  const [rules, setRules] = useState<RuleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useState(() => {
    async function fetchRules() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getRules({
          categoryId: categoryId || undefined,
          limit: 50,
        });
        setRules(response.data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load rules'));
      } finally {
        setIsLoading(false);
      }
    }
    fetchRules();
  });

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading rules: {error.message}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No rules found in this category.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <RuleCard key={rule.id} rule={rule} />
      ))}
    </div>
  );
}

interface RuleCardProps {
  rule: RuleSummary;
}

function RuleCard({ rule }: RuleCardProps) {
  return (
    <Link
      href={`/handbook/rules/${rule.slug}`}
      className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
    >
      <h3 className="font-medium text-gray-900 dark:text-white">
        {rule.title}
      </h3>
      {rule.categoryPath && rule.categoryPath.length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          {rule.categoryPath.join(' > ')}
        </div>
      )}
      {rule.summary && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {rule.summary}
        </p>
      )}
    </Link>
  );
}
