'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/ui/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/Modal';
import { characterApi, type Character, type UpdateCharacterInput } from '@/lib/api';
import { CharacterForm } from '@/components/campaign/CharacterForm';

export default function CharacterEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { session: authSession } = useAuth();

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const characterId = params.id as string;

  useEffect(() => {
    const loadCharacter = async () => {
      if (!authSession?.access_token) return;

      try {
        const result = await characterApi.get(authSession.access_token, characterId);

        if (!result.success) {
          setError(result.error?.message || 'Failed to load character');
          return;
        }

        setCharacter(result.data!);
      } catch (err) {
        setError('Failed to load character');
        console.error('Load character error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCharacter();
  }, [authSession, characterId]);

  const handleSave = async (data: UpdateCharacterInput) => {
    if (!authSession?.access_token) return;

    const result = await characterApi.update(authSession.access_token, characterId, data);

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to save character');
    }

    setCharacter(result.data!);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!authSession?.access_token) return;

    setDeleting(true);
    try {
      const result = await characterApi.delete(authSession.access_token, characterId);

      if (!result.success) {
        setError(result.error?.message || 'Failed to delete character');
        return;
      }

      router.push(`/dashboard/campaigns/${character?.campaign_id}`);
    } catch (err) {
      setError('Failed to delete character');
      console.error('Delete character error:', err);
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const getAbilityModifier = (score: number): string => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'Character not found'}</p>
        <Link href="/dashboard" className="text-primary hover:text-primary/80">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const hpPercentage = (character.current_hp / character.max_hp) * 100;
  const hpColor =
    hpPercentage > 50
      ? 'bg-success'
      : hpPercentage > 25
      ? 'bg-warning'
      : 'bg-danger';

  if (isEditing) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setIsEditing(false)}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← Back to Character
          </button>
          <h1 className="text-2xl font-bold text-foreground mt-2">Edit {character.name}</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <CharacterForm
              initialValues={character}
              campaignId={character.campaign_id}
              onSubmit={handleSave}
              onCancel={() => setIsEditing(false)}
              isEdit
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/dashboard/campaigns/${character.campaign_id}`}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          ← Back to Campaign
        </Link>

        <div className="flex items-start justify-between mt-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{character.name}</h1>
              <span className="px-3 py-1 text-sm font-medium bg-primary/20 text-primary rounded">
                Level {character.level}
              </span>
            </div>
            <p className="text-lg text-muted mt-1">
              {character.race} {character.class}
            </p>
          </div>

          {character.isOwner && (
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Stats */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Combat Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {/* HP */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Hit Points</span>
                <span className="text-lg font-bold text-foreground">
                  {character.current_hp} / {character.max_hp}
                </span>
              </div>
              <div className="w-full h-4 bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full ${hpColor} transition-all duration-300`}
                  style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
                />
              </div>
            </div>

            {/* Combat Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="text-sm text-muted">Armor Class</div>
                <div className="text-2xl font-bold text-foreground">{character.armor_class}</div>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="text-sm text-muted">Initiative</div>
                <div className="text-2xl font-bold text-foreground">
                  {getAbilityModifier(character.dexterity)}
                </div>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <div className="text-sm text-muted">Speed</div>
                <div className="text-2xl font-bold text-foreground">{character.speed} ft</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ability Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Ability Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Strength', abbr: 'STR', value: character.strength },
                { label: 'Dexterity', abbr: 'DEX', value: character.dexterity },
                { label: 'Constitution', abbr: 'CON', value: character.constitution },
                { label: 'Intelligence', abbr: 'INT', value: character.intelligence },
                { label: 'Wisdom', abbr: 'WIS', value: character.wisdom },
                { label: 'Charisma', abbr: 'CHA', value: character.charisma },
              ].map((stat) => (
                <div key={stat.abbr} className="text-center p-3 bg-background rounded-lg">
                  <div className="text-xs text-muted uppercase">{stat.abbr}</div>
                  <div className="text-xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-primary">{getAbilityModifier(stat.value)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Proficiencies */}
        {character.proficiencies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Proficiencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {character.proficiencies.map((prof, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-background text-foreground rounded"
                  >
                    {prof}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        {character.features.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Features & Traits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {character.features.map((feature, index) => (
                  <div key={index} className="p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{feature.name}</span>
                      <span className="text-xs text-muted">({feature.source})</span>
                    </div>
                    <p className="text-sm text-muted">{feature.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Equipment */}
        {character.equipment.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Equipment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {character.equipment.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded ${
                      item.equipped ? 'bg-primary/10' : 'bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.equipped && (
                        <span className="w-2 h-2 bg-primary rounded-full" />
                      )}
                      <span className="text-sm text-foreground">{item.name}</span>
                    </div>
                    {item.quantity > 1 && (
                      <span className="text-xs text-muted">x{item.quantity}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {character.notes && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{character.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Character"
        message={`Are you sure you want to delete ${character.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
