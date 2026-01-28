'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/ui/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { campaignApi } from '@/lib/api';

export default function NewCampaignPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [diceMode, setDiceMode] = useState<'rng' | 'player_entered'>('rng');
  const [mapMode, setMapMode] = useState<'grid_2d' | 'narrative_only'>('narrative_only');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { session } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!session?.access_token) {
      setError('You must be logged in to create a campaign');
      setLoading(false);
      return;
    }

    try {
      const result = await campaignApi.create(session.access_token, {
        name,
        description: description || undefined,
        dice_mode: diceMode,
        map_mode: mapMode,
      });

      if (!result.success) {
        setError(result.error?.message || 'Failed to create campaign');
        return;
      }

      router.push(`/dashboard/campaigns/${result.data?.id}`);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Create campaign error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-foreground mt-4">Create Campaign</h1>
        <p className="text-muted mt-2">Set up a new adventure for your party</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger rounded-md p-4">
            {error}
          </div>
        )}

        <Input
          label="Campaign Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          placeholder="The Lost Mines of Phandelver"
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="A brief description of your campaign's setting and premise..."
          helperText="Optional. Helps set the scene for your adventure."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Dice Mode"
            value={diceMode}
            onChange={(e) => setDiceMode(e.target.value as 'rng' | 'player_entered')}
            options={[
              { value: 'rng', label: 'Auto Roll (RNG)' },
              { value: 'player_entered', label: 'Player Entered' },
            ]}
            helperText="How dice rolls are handled during play"
          />

          <Select
            label="Map Mode"
            value={mapMode}
            onChange={(e) => setMapMode(e.target.value as 'grid_2d' | 'narrative_only')}
            options={[
              { value: 'narrative_only', label: 'Narrative Only' },
              { value: 'grid_2d', label: '2D Grid Map' },
            ]}
            helperText="Whether to use a battle map for combat"
          />
        </div>

        <div className="pt-6 flex items-center justify-end gap-4 border-t border-border">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!name.trim()}>
            Create Campaign
          </Button>
        </div>
      </form>
    </div>
  );
}
