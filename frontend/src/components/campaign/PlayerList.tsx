'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/Modal';

export interface Player {
  id: string;
  user_id: string;
  role: 'player' | 'dm';
  joined_at: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
}

export interface PendingInvite {
  id: string;
  email: string;
  role: 'player' | 'dm';
  created_at: string;
  expires_at: string;
}

export interface PlayerListProps {
  players: Player[];
  pendingInvites?: PendingInvite[];
  currentUserId: string;
  isOwner: boolean;
  onRemovePlayer?: (userId: string) => Promise<void>;
  onRevokeInvite?: (inviteId: string) => Promise<void>;
  onInviteClick?: () => void;
}

/**
 * PlayerList - Displays campaign members and pending invites
 */
export function PlayerList({
  players,
  pendingInvites = [],
  currentUserId,
  isOwner,
  onRemovePlayer,
  onRevokeInvite,
  onInviteClick,
}: PlayerListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);

  const handleRemoveClick = (player: Player) => {
    setPlayerToRemove(player);
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!playerToRemove || !onRemovePlayer) return;

    setRemovingId(playerToRemove.user_id);
    try {
      await onRemovePlayer(playerToRemove.user_id);
    } finally {
      setRemovingId(null);
      setShowRemoveModal(false);
      setPlayerToRemove(null);
    }
  };

  const getRoleBadge = (role: 'player' | 'dm') => {
    if (role === 'dm') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary">
          DM
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted/20 text-muted">
        Player
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Players ({players.length})
          </CardTitle>
          {isOwner && onInviteClick && (
            <Button variant="secondary" size="sm" onClick={onInviteClick}>
              + Invite
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Active Players */}
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 bg-background rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {(player.user?.name || player.user?.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {player.user?.name || player.user?.email || 'Unknown User'}
                    </span>
                    {player.user_id === currentUserId && (
                      <span className="text-xs text-muted">(you)</span>
                    )}
                    {getRoleBadge(player.role)}
                  </div>
                  <span className="text-xs text-muted">
                    Joined {formatDate(player.joined_at)}
                  </span>
                </div>
              </div>

              {isOwner && player.user_id !== currentUserId && onRemovePlayer && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveClick(player)}
                  disabled={removingId === player.user_id}
                  className="text-danger hover:text-danger hover:bg-danger/10"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Pending Invites */}
        {isOwner && pendingInvites.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-muted mb-2">
              Pending Invitations ({pendingInvites.length})
            </h4>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{invite.email}</span>
                      {getRoleBadge(invite.role)}
                    </div>
                    <span className="text-xs text-muted">
                      Expires {formatDate(invite.expires_at)}
                    </span>
                  </div>

                  {onRevokeInvite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRevokeInvite(invite.id)}
                      className="text-muted hover:text-danger"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {players.length === 0 && (
          <div className="text-center py-4 text-muted text-sm">
            No players yet. {isOwner && 'Invite some friends!'}
          </div>
        )}
      </CardContent>

      {/* Remove Confirmation Modal */}
      <ConfirmModal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false);
          setPlayerToRemove(null);
        }}
        onConfirm={handleConfirmRemove}
        title="Remove Player"
        message={`Are you sure you want to remove ${playerToRemove?.user?.name || playerToRemove?.user?.email || 'this player'} from the campaign?`}
        confirmText="Remove"
        variant="danger"
        loading={!!removingId}
      />
    </Card>
  );
}

export default PlayerList;
