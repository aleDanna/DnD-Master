'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/ui/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/Modal';
import { campaignApi, sessionApi } from '@/lib/api';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  dice_mode: 'rng' | 'player_entered';
  map_mode: 'grid_2d' | 'narrative_only';
  created_at: string;
  updated_at: string;
  isOwner: boolean;
  players: Array<{
    id: string;
    user_id: string;
    role: 'player' | 'dm';
    joined_at: string;
  }>;
}

interface Session {
  id: string;
  name: string | null;
  status: 'active' | 'paused' | 'ended';
  started_at: string;
  ended_at: string | null;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session: authSession } = useAuth();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const campaignId = params.id as string;

  useEffect(() => {
    const loadCampaign = async () => {
      if (!authSession?.access_token) return;

      try {
        const [campaignResult, sessionsResult] = await Promise.all([
          campaignApi.get(authSession.access_token, campaignId),
          sessionApi.listByCampaign(authSession.access_token, campaignId),
        ]);

        if (!campaignResult.success) {
          setError(campaignResult.error?.message || 'Failed to load campaign');
          return;
        }

        setCampaign(campaignResult.data!);
        setSessions(sessionsResult.data || []);
      } catch (err) {
        setError('Failed to load campaign');
        console.error('Load campaign error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [authSession, campaignId]);

  const handleStartSession = async () => {
    if (!authSession?.access_token) return;

    setCreatingSession(true);
    try {
      const result = await sessionApi.create(authSession.access_token, campaignId);

      if (!result.success) {
        // Check if there's an active session
        if (result.error?.code === 'ACTIVE_SESSION_EXISTS') {
          const data = result.error.details as { sessionId: string };
          router.push(`/session/${data.sessionId}`);
          return;
        }
        setError(result.error?.message || 'Failed to create session');
        return;
      }

      router.push(`/session/${result.data?.id}`);
    } catch (err) {
      setError('Failed to create session');
      console.error('Create session error:', err);
    } finally {
      setCreatingSession(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!authSession?.access_token) return;

    setDeleting(true);
    try {
      const result = await campaignApi.delete(authSession.access_token, campaignId);

      if (!result.success) {
        setError(result.error?.message || 'Failed to delete campaign');
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('Failed to delete campaign');
      console.error('Delete campaign error:', err);
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'Campaign not found'}</p>
        <Link href="/dashboard" className="text-primary hover:text-primary/80">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const activeSession = sessions.find((s) => s.status === 'active');
  const diceModeLabel = campaign.dice_mode === 'rng' ? 'Auto Roll' : 'Manual Roll';
  const mapModeLabel = campaign.map_mode === 'grid_2d' ? '2D Grid' : 'Narrative Only';

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          ← Back to Dashboard
        </Link>

        <div className="flex items-start justify-between mt-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{campaign.name}</h1>
            {campaign.description && (
              <p className="text-muted mt-2 max-w-2xl">{campaign.description}</p>
            )}
          </div>

          <div className="flex gap-3">
            {activeSession ? (
              <Button onClick={() => router.push(`/session/${activeSession.id}`)}>
                Resume Session
              </Button>
            ) : (
              <Button onClick={handleStartSession} loading={creatingSession}>
                Start Session
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Info */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted">Dice Mode</span>
              <span className="text-foreground">{diceModeLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Map Mode</span>
              <span className="text-foreground">{mapModeLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Players</span>
              <span className="text-foreground">{campaign.players.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Created</span>
              <span className="text-foreground">
                {new Date(campaign.created_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Session History</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-muted text-sm">No sessions yet. Start your first session!</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {sess.name || `Session ${sessions.indexOf(sess) + 1}`}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(sess.started_at).toLocaleDateString()}
                        {sess.ended_at && ` - ${new Date(sess.ended_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          sess.status === 'active'
                            ? 'bg-success/20 text-success'
                            : sess.status === 'paused'
                            ? 'bg-warning/20 text-warning'
                            : 'bg-muted/20 text-muted'
                        }`}
                      >
                        {sess.status}
                      </span>
                      {sess.status !== 'ended' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/session/${sess.id}`)}
                        >
                          {sess.status === 'active' ? 'Join' : 'Resume'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Owner Actions */}
      {campaign.isOwner && (
        <div className="mt-8 pt-8 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Campaign Management</h2>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={() => router.push(`/dashboard/campaigns/${campaignId}/edit`)}
            >
              Edit Campaign
            </Button>
            <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
              Delete Campaign
            </Button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteCampaign}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign? This action cannot be undone and will delete all sessions and history."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
