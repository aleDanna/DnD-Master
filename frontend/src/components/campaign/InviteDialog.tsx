'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

export interface InviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: 'player' | 'dm') => Promise<{ inviteUrl: string } | null>;
  campaignName: string;
}

/**
 * InviteDialog - Modal for inviting players to a campaign
 */
export function InviteDialog({
  isOpen,
  onClose,
  onInvite,
  campaignName,
}: InviteDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'player' | 'dm'>('player');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await onInvite(email, role);
      if (result) {
        setInviteUrl(result.inviteUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('player');
    setError(null);
    setInviteUrl(null);
    onClose();
  };

  const copyInviteUrl = () => {
    if (inviteUrl) {
      const fullUrl = `${window.location.origin}${inviteUrl}`;
      navigator.clipboard.writeText(fullUrl);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Invite to ${campaignName}`}>
      {inviteUrl ? (
        <div className="space-y-4">
          <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
            <p className="text-success text-sm font-medium mb-2">Invitation created!</p>
            <p className="text-foreground/80 text-sm">
              Share this link with {email}:
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              value={`${window.location.origin}${inviteUrl}`}
              readOnly
              className="flex-1 text-sm"
            />
            <Button variant="secondary" onClick={copyInviteUrl}>
              Copy
            </Button>
          </div>

          <p className="text-xs text-muted">
            This invitation link will expire in 7 days.
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleClose}>
              Done
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setInviteUrl(null);
                setEmail('');
              }}
            >
              Invite Another
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Role
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="player"
                  checked={role === 'player'}
                  onChange={() => setRole('player')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Player</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="dm"
                  checked={role === 'dm'}
                  onChange={() => setRole('dm')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Co-DM</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Send Invitation
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default InviteDialog;
