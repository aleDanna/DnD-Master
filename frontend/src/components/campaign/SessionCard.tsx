'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export interface SessionData {
  id: string;
  name: string | null;
  status: 'active' | 'paused' | 'ended';
  started_at: string;
  ended_at: string | null;
  last_activity: string;
  narrative_summary: string | null;
}

export interface SessionCardProps {
  session: SessionData;
  sessionNumber: number;
  onResume?: (sessionId: string) => void;
  onJoin?: (sessionId: string) => void;
  isLoading?: boolean;
}

/**
 * SessionCard - Displays session info with status and action buttons
 */
export function SessionCard({
  session,
  sessionNumber,
  onResume,
  onJoin,
  isLoading,
}: SessionCardProps) {
  const getStatusBadge = () => {
    switch (session.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-success/20 text-success">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Active
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-warning/20 text-warning">
            <span className="w-2 h-2 rounded-full bg-warning" />
            Paused
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-muted/20 text-muted">
            <span className="w-2 h-2 rounded-full bg-muted" />
            Ended
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-medium text-foreground">
                {session.name || `Session ${sessionNumber}`}
              </h3>
              {getStatusBadge()}
            </div>

            <div className="text-xs text-muted space-y-1">
              <div className="flex items-center gap-4">
                <span>Started: {formatDate(session.started_at)} at {formatTime(session.started_at)}</span>
                {session.ended_at && (
                  <span>Ended: {formatDate(session.ended_at)}</span>
                )}
              </div>
              {session.status !== 'ended' && (
                <div>
                  Last activity: {getTimeAgo(session.last_activity)}
                </div>
              )}
            </div>

            {session.narrative_summary && session.status === 'paused' && (
              <div className="mt-3 p-2 bg-background rounded text-xs text-muted italic line-clamp-2">
                {session.narrative_summary}
              </div>
            )}
          </div>

          <div className="ml-4">
            {session.status === 'active' && onJoin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onJoin(session.id)}
                loading={isLoading}
              >
                Join
              </Button>
            )}
            {session.status === 'paused' && onResume && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onResume(session.id)}
                loading={isLoading}
              >
                Resume
              </Button>
            )}
            {session.status === 'ended' && (
              <span className="text-xs text-muted">Completed</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SessionCard;
