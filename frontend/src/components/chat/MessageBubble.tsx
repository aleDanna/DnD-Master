'use client';

import { CitationPopover, type Citation } from '../rules/CitationPopover';

export type MessageType = 'player' | 'dm';

interface RuleCitation {
  ruleId?: string;
  title: string;
  source: string;
  excerpt?: string;
  relevance?: number;
}

interface MessageBubbleProps {
  type: MessageType;
  content: string;
  sender?: string;
  timestamp: string;
  mechanics?: string;
  ruleCitations?: RuleCitation[];
}

export function MessageBubble({
  type,
  content,
  sender,
  timestamp,
  mechanics,
  ruleCitations,
}: MessageBubbleProps) {
  const isPlayer = type === 'player';

  const bubbleStyles = isPlayer
    ? 'bg-primary/20 border-primary/30 ml-auto'
    : 'bg-surface border-border';

  const senderName = sender || (isPlayer ? 'You' : 'Dungeon Master');

  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`max-w-[85%] ${isPlayer ? 'ml-auto' : 'mr-auto'}`}>
      {/* Header */}
      <div className={`flex items-center gap-2 mb-1 ${isPlayer ? 'justify-end' : ''}`}>
        <span className="text-sm font-medium text-foreground">{senderName}</span>
        <span className="text-xs text-muted">{formattedTime}</span>
      </div>

      {/* Message bubble */}
      <div className={`rounded-lg border p-4 ${bubbleStyles}`}>
        {/* Main content */}
        <div className="prose prose-invert prose-sm max-w-none">
          {content.split('\n').map((paragraph, i) => (
            <p key={i} className="mb-2 last:mb-0 text-foreground">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Mechanics section */}
        {mechanics && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-sm text-muted italic">{mechanics}</p>
          </div>
        )}

        {/* Rule citations */}
        {ruleCitations && ruleCitations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs font-medium text-muted mb-2">Rule References:</p>
            <ul className="text-xs text-muted space-y-1">
              {ruleCitations.map((citation, i) => {
                // Parse source string into components for CitationPopover
                const sourceParts = citation.source.split(' > ');
                const citationData: Citation = {
                  ruleId: citation.ruleId || `temp-${i}`,
                  title: citation.title,
                  excerpt: citation.excerpt || '',
                  source: {
                    document: sourceParts[0] || citation.source,
                    chapter: sourceParts[1] || '',
                    section: sourceParts[2] || '',
                    page: sourceParts[3]?.replace('p. ', '') || null,
                  },
                  relevance: citation.relevance,
                };

                // Use CitationPopover if we have a ruleId, otherwise simple display
                if (citation.ruleId) {
                  return (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <CitationPopover citation={citationData}>
                        <span className="cursor-pointer hover:text-primary transition-colors">
                          <strong>{citation.title}</strong>
                          <span className="text-muted"> ({citation.source})</span>
                        </span>
                      </CitationPopover>
                    </li>
                  );
                }

                // Fallback for citations without ruleId
                return (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      <strong>{citation.title}</strong>
                      <span className="text-muted"> ({citation.source})</span>
                      {citation.excerpt && (
                        <span className="block text-muted/80 mt-0.5">
                          &quot;{citation.excerpt}&quot;
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
