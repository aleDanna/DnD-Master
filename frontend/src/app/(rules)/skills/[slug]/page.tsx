/**
 * Skill Detail Page
 * T098: Create skill detail page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchSkill } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';
import Breadcrumb from '@/components/layout/Breadcrumb';
import SkillCard from '@/components/content/SkillCard';

interface SkillDetailPageProps {
  params: { slug: string };
}

export default function SkillDetailPage({ params }: SkillDetailPageProps) {
  const { slug } = params;

  const { data: skill, isLoading, isError } = useQuery({
    queryKey: ['skill', slug],
    queryFn: () => fetchSkill(slug),
  });

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <ContentSkeleton />
      </div>
    );
  }

  if (isError || !skill) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Skill Not Found</h1>
        <p className="text-gray-600 mb-4">
          The skill you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/skills" className="text-blue-600 hover:text-blue-800">
          ← Back to Skills
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Skills', href: '/skills' },
          { label: skill.name },
        ]}
      />

      <SkillCard skill={skill} showFullContent />
    </div>
  );
}
