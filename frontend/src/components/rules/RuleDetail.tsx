'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card } from '../ui/Card';
import { Skeleton, SkeletonText } from '../ui/Skeleton';
import { useRulesDocuments } from '@/hooks/useRulesDocuments';
import { cn } from '@/lib/utils';

/**
 * RuleDetail - Display a single rule entry with full context
 * Task: T043
 */

interface RuleDetailProps {
  entryId: string;
  token: string | null;
  className?: string;
  onClose?: () => void;
}

export function RuleDetail({ entryId, token, className, onClose }: RuleDetailProps) {
  const { entry, loading, error, fetchEntry } = useRulesDocuments(token);

  useEffect(() => {
    if (entryId) {
      fetchEntry(entryId);
    }
  }, [entryId, fetchEntry]);

  if (loading) {
    return <RuleDetailSkeleton className={className} />;
  }

  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center py-8">
          <p className="text-danger mb-4">{error}</p>
          <button
            onClick={() => fetchEntry(entryId)}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            Try again
          </button>
        </div>
      </Card>
    );
  }

  if (!entry) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center py-8">
          <p className="text-muted">Rule not found</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      {/* Header with close button */}
      {onClose && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors p-1"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Breadcrumb navigation */}
      <nav className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <li>
            <Link
              href="/rules"
              className="hover:text-primary transition-colors"
            >
              {entry.document.name}
            </Link>
          </li>
          <li className="text-muted/50">/</li>
          <li>
            <span className="hover:text-foreground transition-colors cursor-default">
              {entry.chapter.title}
            </span>
          </li>
          <li className="text-muted/50">/</li>
          <li>
            <span className="hover:text-foreground transition-colors cursor-default">
              {entry.section.title}
            </span>
          </li>
        </ol>
      </nav>

      {/* Title */}
      <h2 className="text-2xl font-bold text-foreground mb-4">
        {entry.title || entry.section.title}
      </h2>

      {/* Page reference */}
      {entry.pageReference && (
        <div className="mb-4">
          <span className="text-sm text-muted">
            Page {entry.pageReference}
          </span>
        </div>
      )}

      {/* Categories */}
      {entry.categories && entry.categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {entry.categories.map((category) => (
            <span
              key={category.id}
              className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
              title={category.description || undefined}
            >
              {category.name}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="prose prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-foreground leading-relaxed">
          {entry.content}
        </div>
      </div>

      {/* Footer with metadata */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <span>
            Source: {entry.document.name}
          </span>
          {entry.pageReference && (
            <span>
              Page: {entry.pageReference}
            </span>
          )}
          <span>
            Chapter: {entry.chapter.title}
          </span>
        </div>
      </div>
    </Card>
  );
}

/**
 * RuleDetailSkeleton - Loading placeholder for RuleDetail
 */
export function RuleDetailSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('p-6', className)}>
      <div className="animate-pulse space-y-4">
        {/* Breadcrumb */}
        <div className="flex gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>

        {/* Title */}
        <Skeleton className="h-8 w-3/4" />

        {/* Page ref */}
        <Skeleton className="h-4 w-16" />

        {/* Categories */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Content */}
        <SkeletonText lines={8} />

        {/* Footer */}
        <div className="pt-4 border-t border-border">
          <div className="flex gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default RuleDetail;
