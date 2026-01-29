'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/ui/AuthProvider';
import { Card, CardContent } from '@/components/ui/Card';
import { characterApi, type CreateCharacterInput } from '@/lib/api';
import { CharacterForm } from '@/components/campaign/CharacterForm';

export default function NewCharacterPage() {
  const params = useParams();
  const router = useRouter();
  const { session: authSession } = useAuth();

  const [error, setError] = useState<string | null>(null);

  const campaignId = params.id as string;

  const handleCreate = async (data: CreateCharacterInput) => {
    if (!authSession?.access_token) return;

    setError(null);

    const result = await characterApi.create(authSession.access_token, data);

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create character');
    }

    // Redirect to the new character's page
    router.push(`/characters/${result.data!.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/dashboard/campaigns/${campaignId}`}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          ← Back to Campaign
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">Create New Character</h1>
        <p className="text-muted mt-1">
          Build your adventurer for this campaign.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-lg text-danger">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <CharacterForm
            campaignId={campaignId}
            onSubmit={handleCreate}
            onCancel={() => router.push(`/dashboard/campaigns/${campaignId}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
