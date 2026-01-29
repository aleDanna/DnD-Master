'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/ui/AuthProvider';
import { useRulesDocuments } from '@/hooks/useRulesDocuments';
import { Card } from '@/components/ui/Card';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

/**
 * Rule Detail Page
 * Task: T049
 * Displays full rule with context and related rules
 */

export default function RuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session } = useAuth();
  const token = session?.access_token || null;

  const entryId = params.id as string;

  const { entry, loading, error, fetchEntry } = useRulesDocuments(token);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    if (entryId && token) {
      fetchEntry(entryId);
    }
  }, [entryId, token, fetchEntry]);

  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted">Please sign in to view rules</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <RuleDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6">
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
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6">
          <div className="text-center py-8">
            <p className="text-muted mb-4">Rule not found</p>
            <Link
              href="/rules"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Back to Rules Explorer
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back
        </button>
        <span className="text-muted">/</span>
        <Link
          href="/rules"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          Rules Explorer
        </Link>
      </div>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          <li>
            <Link
              href="/rules"
              className="text-muted hover:text-primary transition-colors"
            >
              {entry.document.name}
            </Link>
          </li>
          <li className="text-muted/50">/</li>
          <li>
            <span className="text-muted">{entry.chapter.title}</span>
          </li>
          <li className="text-muted/50">/</li>
          <li>
            <span className="text-muted">{entry.section.title}</span>
          </li>
          {entry.title && (
            <>
              <li className="text-muted/50">/</li>
              <li>
                <span className="text-foreground font-medium">{entry.title}</span>
              </li>
            </>
          )}
        </ol>
      </nav>

      {/* Main content card */}
      <Card className="p-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground mb-4">
          {entry.title || entry.section.title}
        </h1>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-muted">
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            {entry.document.name}
          </span>
          {entry.pageReference && (
            <span className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Page {entry.pageReference}
            </span>
          )}
        </div>

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

        {/* Divider */}
        <hr className="border-border mb-6" />

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-foreground leading-relaxed text-lg">
            {entry.content}
          </div>
        </div>
      </Card>

      {/* Context information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Source Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted mb-1">Document</h3>
            <p className="text-foreground">{entry.document.name}</p>
            {entry.document.totalPages && (
              <p className="text-xs text-muted mt-1">
                {entry.document.totalPages} pages total
              </p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted mb-1">Chapter</h3>
            <p className="text-foreground">{entry.chapter.title}</p>
            {(entry.chapter.pageStart || entry.chapter.pageEnd) && (
              <p className="text-xs text-muted mt-1">
                Pages {entry.chapter.pageStart || '?'} - {entry.chapter.pageEnd || '?'}
              </p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted mb-1">Section</h3>
            <p className="text-foreground">{entry.section.title}</p>
            {(entry.section.pageStart || entry.section.pageEnd) && (
              <p className="text-xs text-muted mt-1">
                Pages {entry.section.pageStart || '?'} - {entry.section.pageEnd || '?'}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/rules"
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Search for more rules
        </Link>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
          }}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
          Copy Link
        </button>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for rule detail page
 */
function RuleDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back nav */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Breadcrumb */}
      <div className="flex gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Main card */}
      <Card className="p-8">
        <Skeleton className="h-9 w-3/4 mb-4" />
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <hr className="border-border mb-6" />
        <SkeletonText lines={12} />
      </Card>

      {/* Context card */}
      <Card className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
