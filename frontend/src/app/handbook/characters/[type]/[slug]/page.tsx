// Character Detail Page - T036
// Dynamic route for class/race/background/feat details

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useContent } from '@/hooks/handbook/useContent';
import { getClass, getRace, getBackground, getFeat } from '@/lib/handbook/api';
import { ClassDetail } from '@/components/handbook/ClassDetail';
import { RaceDetail } from '@/components/handbook/RaceDetail';
import type { Class, Race, Background, Feat } from '@/lib/handbook/types';

type CharacterType = 'classes' | 'races' | 'backgrounds' | 'feats';

export default function CharacterDetailPage() {
  const params = useParams();
  const type = params.type as CharacterType;
  const slug = params.slug as string;

  // Render based on type
  switch (type) {
    case 'classes':
      return <ClassDetailWrapper slug={slug} />;
    case 'races':
      return <RaceDetailWrapper slug={slug} />;
    case 'backgrounds':
      return <BackgroundDetailWrapper slug={slug} />;
    case 'feats':
      return <FeatDetailWrapper slug={slug} />;
    default:
      return (
        <div className="text-center py-12">
          <p className="text-red-500">Unknown character type: {type}</p>
          <Link
            href="/handbook/characters"
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Characters
          </Link>
        </div>
      );
  }
}

function ClassDetailWrapper({ slug }: { slug: string }) {
  const { data: cls, isLoading, error } = useContent<Class>(
    `class:${slug}`,
    () => getClass(slug)
  );

  if (error) {
    return <ErrorDisplay error={error} backLink="/handbook/characters?type=classes" />;
  }

  if (isLoading || !cls) {
    return <DetailSkeleton />;
  }

  return <ClassDetail cls={cls} />;
}

function RaceDetailWrapper({ slug }: { slug: string }) {
  const { data: race, isLoading, error } = useContent<Race>(
    `race:${slug}`,
    () => getRace(slug)
  );

  if (error) {
    return <ErrorDisplay error={error} backLink="/handbook/characters?type=races" />;
  }

  if (isLoading || !race) {
    return <DetailSkeleton />;
  }

  return <RaceDetail race={race} />;
}

function BackgroundDetailWrapper({ slug }: { slug: string }) {
  const { data: background, isLoading, error } = useContent<Background>(
    `background:${slug}`,
    () => getBackground(slug)
  );

  if (error) {
    return <ErrorDisplay error={error} backLink="/handbook/characters?type=backgrounds" />;
  }

  if (isLoading || !background) {
    return <DetailSkeleton />;
  }

  return <BackgroundDetail background={background} />;
}

function FeatDetailWrapper({ slug }: { slug: string }) {
  const { data: feat, isLoading, error } = useContent<Feat>(
    `feat:${slug}`,
    () => getFeat(slug)
  );

  if (error) {
    return <ErrorDisplay error={error} backLink="/handbook/characters?type=feats" />;
  }

  if (isLoading || !feat) {
    return <DetailSkeleton />;
  }

  return <FeatDetail feat={feat} />;
}

// Background Detail Component
function BackgroundDetail({ background }: { background: Background }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {background.name}
        </h1>
      </header>

      {/* Skill Proficiencies */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Skill Proficiencies
        </h2>
        <div className="flex flex-wrap gap-2">
          {(background.skillProficiencies || []).map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      {/* Tool Proficiencies */}
      {background.toolProficiencies && background.toolProficiencies.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Tool Proficiencies
          </h2>
          <div className="flex flex-wrap gap-2">
            {background.toolProficiencies.map((tool, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm"
              >
                {tool}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Equipment */}
      {background.equipment && (
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Equipment
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            {Array.isArray(background.equipment)
              ? background.equipment.join(', ')
              : String(background.equipment)}
          </p>
        </section>
      )}

      {/* Feature */}
      {background.feature && (
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Feature: {typeof background.feature === 'object' && background.feature !== null
              ? (background.feature as { name?: string }).name
              : 'Background Feature'}
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            {typeof background.feature === 'object' && background.feature !== null
              ? (background.feature as { description?: string }).description
              : String(background.feature)}
          </p>
        </section>
      )}

      {/* Back Link */}
      <div className="pt-4">
        <Link
          href="/handbook/characters?type=backgrounds"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Backgrounds
        </Link>
      </div>
    </div>
  );
}

// Feat Detail Component
function FeatDetail({ feat }: { feat: Feat }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {feat.name}
        </h1>
        {feat.prerequisites && (
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            <span className="font-medium">Prerequisite:</span> {feat.prerequisites}
          </p>
        )}
      </header>

      {/* Description */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-700 dark:text-gray-300">
          {feat.description}
        </p>
      </section>

      {/* Benefits */}
      {feat.benefits && (
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Benefits
          </h2>
          <BenefitsList benefits={feat.benefits} />
        </section>
      )}

      {/* Back Link */}
      <div className="pt-4">
        <Link
          href="/handbook/characters?type=feats"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Feats
        </Link>
      </div>
    </div>
  );
}

function BenefitsList({ benefits }: { benefits: unknown }) {
  const benefitData = typeof benefits === 'string'
    ? JSON.parse(benefits)
    : benefits;

  if (Array.isArray(benefitData)) {
    return (
      <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
        {benefitData.map((benefit, index) => (
          <li key={index}>{String(benefit)}</li>
        ))}
      </ul>
    );
  }

  return <p className="text-gray-700 dark:text-gray-300">{String(benefitData)}</p>;
}

function ErrorDisplay({ error, backLink }: { error: Error; backLink: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-red-500">Error: {error.message}</p>
      <Link href={backLink} className="mt-4 text-blue-600 hover:underline block">
        Go back
      </Link>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse space-y-8">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
    </div>
  );
}
