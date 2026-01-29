'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export interface RecapPanelProps {
  recap: string;
  onDismiss: () => void;
  onContinue: () => void;
  isLoading?: boolean;
}

/**
 * RecapPanel - Displays a "Previously on..." style recap when resuming a session
 */
export function RecapPanel({ recap, onDismiss, onContinue, isLoading }: RecapPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isExpanded) {
    return (
      <div className="bg-surface/50 border border-border rounded-lg p-3 mb-4">
        <button
          onClick={() => setIsExpanded(true)}
          className="text-sm text-muted hover:text-foreground flex items-center gap-2"
        >
          <span>Show Recap</span>
          <span className="text-xs">▼</span>
        </button>
      </div>
    );
  }

  return (
    <Card className="mb-4 border-primary/30 bg-gradient-to-br from-surface to-background">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl">📜</span>
            Previously on your adventure...
          </CardTitle>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-muted hover:text-foreground text-sm"
          >
            ▲ Hide
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm prose-invert max-w-none">
          <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed italic">
            {recap}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            disabled={isLoading}
          >
            Dismiss
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onContinue}
            loading={isLoading}
          >
            Continue Adventure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default RecapPanel;
