/**
 * Spell Detail Page
 * T086: Create spell detail page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchSpell } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';
import Breadcrumb from '@/components/layout/Breadcrumb';
import SpellCard from '@/components/content/SpellCard';

interface SpellDetailPageProps {
  params: { slug: string };
}

export default function SpellDetailPage({ params }: SpellDetailPageProps) {
  const { slug } = params;

  const { data: spell, isLoading, isError } = useQuery({
    queryKey: ['spell', slug],
    queryFn: () => fetchSpell(slug),
  });

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <ContentSkeleton />
      </div>
    );
  }

  if (isError || !spell) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Spell Not Found</h1>
        <p className="text-gray-600 mb-4">
          The spell you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/spells" className="text-blue-600 hover:text-blue-800">
          ← Back to Spells
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Spells', href: '/spells' },
          { label: spell.name },
        ]}
      />

      <SpellCard spell={spell} showFullContent />
    </div>
  );
}
