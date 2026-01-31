/**
 * Source Citation Component
 * T065: Create SourceCitation component
 */

import { SourceCitation as SourceCitationType } from '@/types/content.types';
import { BookOpenIcon } from '../layout/Icons';

interface SourceCitationProps {
  source: SourceCitationType;
  className?: string;
  compact?: boolean;
}

export default function SourceCitation({
  source,
  className = '',
  compact = false,
}: SourceCitationProps) {
  if (!source.document && !source.page) {
    return null;
  }

  const citation = formatCitation(source);

  if (compact) {
    return (
      <span className={`text-xs text-gray-400 ${className}`} title="Source">
        {citation}
      </span>
    );
  }

  return (
    <div className={`flex items-center text-sm text-gray-500 ${className}`}>
      <BookOpenIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
      <span>{citation}</span>
    </div>
  );
}

function formatCitation(source: SourceCitationType): string {
  if (source.document && source.page) {
    return `${source.document}, p. ${source.page}`;
  }
  if (source.document) {
    return source.document;
  }
  if (source.page) {
    return `p. ${source.page}`;
  }
  return 'Source unavailable';
}

/**
 * Inline source citation for compact display
 */
export function InlineSourceCitation({ source }: SourceCitationProps) {
  if (!source.document && !source.page) {
    return null;
  }

  const citation = formatCitation(source);

  return (
    <span className="text-xs text-gray-400" title="Source">
      ({citation})
    </span>
  );
}
