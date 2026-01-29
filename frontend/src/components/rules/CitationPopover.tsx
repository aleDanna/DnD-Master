'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * CitationPopover - Display a rule citation in a hover/click popover
 * Task: T044
 */

interface Citation {
  ruleId: string;
  title: string;
  excerpt: string;
  source: {
    document: string;
    chapter: string;
    section: string;
    page?: string | null;
  };
  relevance?: number;
}

interface CitationPopoverProps {
  citation: Citation;
  children: React.ReactNode;
  className?: string;
}

export function CitationPopover({ citation, children, className }: CitationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Calculate position
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Prefer bottom, but use top if not enough space below
    setPosition(spaceBelow < 200 && spaceAbove > spaceBelow ? 'top' : 'bottom');
  }, [isOpen]);

  // Build source string
  const sourceString = [
    citation.source.document,
    citation.source.chapter,
    citation.source.section,
    citation.source.page ? `p. ${citation.source.page}` : null,
  ]
    .filter(Boolean)
    .join(' > ');

  return (
    <span className={cn('relative inline-block', className)}>
      {/* Trigger */}
      <span
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="cursor-pointer border-b border-dotted border-primary text-primary hover:border-solid transition-all"
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {children}
      </span>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className={cn(
            'absolute z-50 w-72 p-4 bg-surface border border-border rounded-lg shadow-lg',
            'animate-in fade-in-0 zoom-in-95',
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
            'left-1/2 -translate-x-1/2'
          )}
          role="dialog"
          aria-label="Rule citation"
        >
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-surface border-border rotate-45',
              position === 'top'
                ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-r border-b'
                : 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-t'
            )}
          />

          {/* Content */}
          <div className="relative">
            {/* Title */}
            <h4 className="font-semibold text-foreground mb-2 pr-6">
              {citation.title}
            </h4>

            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-0 right-0 text-muted hover:text-foreground transition-colors"
              aria-label="Close"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Excerpt */}
            <p className="text-sm text-muted mb-3 line-clamp-4">
              {citation.excerpt}
            </p>

            {/* Source */}
            <p className="text-xs text-muted mb-3 truncate" title={sourceString}>
              {sourceString}
            </p>

            {/* Relevance indicator */}
            {citation.relevance !== undefined && (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>Relevance:</span>
                  <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${citation.relevance * 100}%` }}
                    />
                  </div>
                  <span>{Math.round(citation.relevance * 100)}%</span>
                </div>
              </div>
            )}

            {/* Link to full rule */}
            <Link
              href={`/rules/${citation.ruleId}`}
              className="block text-center text-sm text-primary hover:text-primary/80 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              View Full Rule
            </Link>
          </div>
        </div>
      )}
    </span>
  );
}

/**
 * CitationBadge - Simple inline citation badge
 */
interface CitationBadgeProps {
  citation: Citation;
  className?: string;
}

export function CitationBadge({ citation, className }: CitationBadgeProps) {
  return (
    <CitationPopover citation={citation} className={className}>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
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
        {citation.title}
      </span>
    </CitationPopover>
  );
}

export type { Citation };
export default CitationPopover;
