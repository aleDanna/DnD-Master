/**
 * Empty State Component
 * T100: Create empty state component for when no content is available
 */

import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  action?: {
    label: string;
    href: string;
  };
}

export default function EmptyState({
  title,
  description,
  icon = '📭',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 max-w-md mb-6">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function NoResultsEmpty() {
  return (
    <EmptyState
      title="No Results Found"
      description="We couldn't find any content matching your search. Try adjusting your filters or search terms."
      icon="🔍"
    />
  );
}

export function NoContentEmpty({ contentType }: { contentType: string }) {
  return (
    <EmptyState
      title={`No ${contentType} Available`}
      description={`${contentType} will appear here once the database is seeded with content.`}
      icon="📚"
    />
  );
}

export function LoadingErrorEmpty({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Something Went Wrong</h2>
      <p className="text-gray-600 max-w-md mb-6">
        We had trouble loading this content. Please try again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
