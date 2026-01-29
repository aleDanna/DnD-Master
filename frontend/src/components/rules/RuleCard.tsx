'use client';

import { Card } from '../ui/Card';
import { RuleEntry, RuleEntryWithContext } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * RuleCard - Display a rule entry in a card format
 * Task: T042
 */

interface RuleCardProps {
  entry: RuleEntry | RuleEntryWithContext;
  highlights?: string[];
  onClick?: () => void;
  className?: string;
  showSource?: boolean;
}

function isEntryWithContext(entry: RuleEntry | RuleEntryWithContext): entry is RuleEntryWithContext {
  return 'document' in entry && 'chapter' in entry && 'section' in entry;
}

export function RuleCard({
  entry,
  highlights,
  onClick,
  className,
  showSource = true,
}: RuleCardProps) {
  // Create excerpt from content (first 150 characters)
  const excerpt = entry.content.length > 150
    ? entry.content.slice(0, 150).trim() + '...'
    : entry.content;

  // Build source reference string
  const getSourceReference = (): string | null => {
    if (!showSource) return null;

    if (isEntryWithContext(entry)) {
      const parts = [entry.document.name, entry.chapter.title, entry.section.title];
      if (entry.pageReference) {
        parts.push(`p. ${entry.pageReference}`);
      }
      return parts.join(' > ');
    }

    if (entry.pageReference) {
      return `Page ${entry.pageReference}`;
    }

    return null;
  };

  const sourceReference = getSourceReference();

  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      className={cn('group', className)}
    >
      {/* Title */}
      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
        {entry.title || 'Untitled Entry'}
      </h4>

      {/* Excerpt or highlighted content */}
      {highlights && highlights.length > 0 ? (
        <div className="mt-2 space-y-1">
          {highlights.slice(0, 2).map((highlight, index) => (
            <p
              key={index}
              className="text-sm text-muted"
              dangerouslySetInnerHTML={{
                __html: highlight.replace(/\*\*(.*?)\*\*/g, '<mark class="bg-warning/30 text-foreground px-0.5 rounded">$1</mark>'),
              }}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted mt-2 line-clamp-3">{excerpt}</p>
      )}

      {/* Source reference */}
      {sourceReference && (
        <div className="mt-3 pt-2 border-t border-border">
          <p className="text-xs text-muted truncate" title={sourceReference}>
            {sourceReference}
          </p>
        </div>
      )}

      {/* Categories */}
      {entry.categories && entry.categories.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {entry.categories.slice(0, 3).map((category) => (
            <span
              key={category.id}
              className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded"
            >
              {category.name}
            </span>
          ))}
          {entry.categories.length > 3 && (
            <span className="text-xs text-muted">+{entry.categories.length - 3}</span>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * RuleCardSkeleton - Loading placeholder for RuleCard
 */
export function RuleCardSkeleton() {
  return (
    <Card>
      <div className="animate-pulse space-y-3">
        <div className="h-5 bg-muted/20 rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-4 bg-muted/20 rounded w-full" />
          <div className="h-4 bg-muted/20 rounded w-5/6" />
        </div>
        <div className="pt-2 border-t border-border">
          <div className="h-3 bg-muted/20 rounded w-1/2" />
        </div>
      </div>
    </Card>
  );
}

export default RuleCard;
