'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/ui/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/Modal';
import { campaignApi, sessionApi, characterApi, type Character } from '@/lib/api';
import { SessionCard } from '@/components/campaign/SessionCard';
import { PlayerList } from '@/components/campaign/PlayerList';
import { InviteDialog } from '@/components/campaign/InviteDialog';
import { SettingsForm, type CampaignSettings } from '@/components/campaign/SettingsForm';
import { CharacterCard } from '@/components/campaign/CharacterCard';

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

interface PendingInvite {
  id: string;
  email: string;
  role: 'player' | 'dm';
  created_at: string;
  expires_at: string;
}

type TabType = 'overview' | 'characters' | 'settings';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, session: authSession } = useAuth();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);

  const campaignId = params.id as string;

  const loadCampaignData = async () => {
    if (!authSession?.access_token) return;

    try {
      const [campaignResult, sessionsResult, charactersResult] = await Promise.all([
        campaignApi.get(authSession.access_token, campaignId),
        sessionApi.listByCampaign(authSession.access_token, campaignId),
        characterApi.listByCampaign(authSession.access_token, campaignId),
      ]);

      if (!campaignResult.success) {
        setError(campaignResult.error?.message || 'Failed to load campaign');
        return;
      }

      setCampaign(campaignResult.data!);
      setSessions(sessionsResult.data || []);
      setCharacters(charactersResult.data || []);

      // Load invites if owner
      if (campaignResult.data?.isOwner) {
        const invitesResult = await campaignApi.getInvites(authSession.access_token, campaignId);
        if (invitesResult.success) {
          setPendingInvites(invitesResult.data || []);
        }
      }
    } catch (err) {
      setError('Failed to load campaign');
      console.error('Load campaign error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaignData();
  }, [authSession, campaignId]);

  const handleStartSession = async () => {
    if (!authSession?.access_token) return;

    setCreatingSession(true);
    try {
      const result = await sessionApi.create(authSession.access_token, campaignId);

      if (!result.success) {
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

  const handleSaveSettings = async (settings: CampaignSettings) => {
    if (!authSession?.access_token) return;

    const result = await campaignApi.update(authSession.access_token, campaignId, settings);

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to save settings');
    }

    setCampaign((prev) => (prev ? { ...prev, ...settings } : prev));
  };

  const handleInvite = async (email: string, role: 'player' | 'dm') => {
    if (!authSession?.access_token) return null;

    const result = await campaignApi.invite(authSession.access_token, campaignId, email, role);

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to send invitation');
    }

    // Refresh invites
    const invitesResult = await campaignApi.getInvites(authSession.access_token, campaignId);
    if (invitesResult.success) {
      setPendingInvites(invitesResult.data || []);
    }

    return { inviteUrl: result.data!.invite_url };
  };

  const handleRemovePlayer = async (userId: string) => {
    if (!authSession?.access_token) return;

    await campaignApi.removePlayer(authSession.access_token, campaignId, userId);
    await loadCampaignData();
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!authSession?.access_token) return;

    await campaignApi.revokeInvite(authSession.access_token, campaignId, inviteId);
    setPendingInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
  };

  const handleDeleteCharacter = async () => {
    if (!authSession?.access_token || !characterToDelete) return;

    try {
      await characterApi.delete(authSession.access_token, characterToDelete.id);
      setCharacters((prev) => prev.filter((c) => c.id !== characterToDelete.id));
    } catch (err) {
      setError('Failed to delete character');
      console.error('Delete character error:', err);
    } finally {
      setCharacterToDelete(null);
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
  const myCharacter = characters.find((c) => c.user_id === user?.id);

  return (
    <div>
      {/* Header */}
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

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {(['overview', 'characters', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors relative ${
              activeTab === tab
                ? 'text-primary'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  {sessions.map((sess, index) => (
                    <SessionCard
                      key={sess.id}
                      session={{
                        ...sess,
                        name: sess.name || `Session ${sessions.length - index}`,
                      }}
                      onResume={() => router.push(`/session/${sess.id}`)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Players */}
          <PlayerList
            players={campaign.players.map((p) => ({
              ...p,
              user: { id: p.user_id },
            }))}
            pendingInvites={campaign.isOwner ? pendingInvites : []}
            currentUserId={user?.id || ''}
            isOwner={campaign.isOwner}
            onRemovePlayer={handleRemovePlayer}
            onRevokeInvite={handleRevokeInvite}
            onInviteClick={() => setInviteDialogOpen(true)}
          />
        </div>
      )}

      {activeTab === 'characters' && (
        <div className="space-y-6">
          {/* My Character */}
          {!myCharacter && !campaign.isOwner && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <p className="text-muted mb-4">You don't have a character in this campaign yet.</p>
                  <Link href={`/campaigns/${campaignId}/characters/new`}>
                    <Button variant="primary">Create Character</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Character List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Characters ({characters.length})
              </h2>
              {!myCharacter && (
                <Link href={`/campaigns/${campaignId}/characters/new`}>
                  <Button variant="secondary" size="sm">
                    + New Character
                  </Button>
                </Link>
              )}
            </div>

            {characters.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted">
                  No characters in this campaign yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {characters.map((character) => (
                  <CharacterCard
                    key={character.id}
                    character={character}
                    isOwner={character.user_id === user?.id}
                    onEdit={() => router.push(`/characters/${character.id}`)}
                    onDelete={() => setCharacterToDelete(character)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsForm
                initialValues={{
                  name: campaign.name,
                  description: campaign.description,
                  dice_mode: campaign.dice_mode,
                  map_mode: campaign.map_mode,
                }}
                onSave={handleSaveSettings}
                isOwner={campaign.isOwner}
              />
            </CardContent>
          </Card>

          {/* Danger Zone */}
          {campaign.isOwner && (
            <Card className="mt-6 border-danger/30">
              <CardHeader>
                <CardTitle className="text-danger">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted mb-4">
                  Deleting a campaign is permanent and cannot be undone. All sessions, characters,
                  and history will be lost.
                </p>
                <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
                  Delete Campaign
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Modals */}
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

      <ConfirmModal
        isOpen={!!characterToDelete}
        onClose={() => setCharacterToDelete(null)}
        onConfirm={handleDeleteCharacter}
        title="Delete Character"
        message={`Are you sure you want to delete ${characterToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      <InviteDialog
        isOpen={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onInvite={handleInvite}
        campaignName={campaign.name}
      />
    </div>
  );
}
