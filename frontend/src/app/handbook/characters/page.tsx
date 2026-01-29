// Characters Page - T025
// Display character options (classes, races, backgrounds, feats) with sub-navigation

'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePaginatedContent } from '@/hooks/handbook/useContent';
import { ContentCard } from '@/components/handbook/ContentCard';
import { SubTabNavigation, CHARACTER_SUB_TABS } from '@/components/handbook/TabNavigation';
import { getClasses, getRaces, getBackgrounds, getFeats } from '@/lib/handbook/api';
import type { ClassSummary, RaceSummary, BackgroundSummary, FeatSummary } from '@/lib/handbook/types';

type CharacterType = 'classes' | 'races' | 'backgrounds' | 'feats';

export default function CharactersPage() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as CharacterType | null;
  const activeType = typeParam || 'classes';

  return (
    <div>
      <SubTabNavigation tabs={CHARACTER_SUB_TABS} activeId={activeType} />

      {activeType === 'classes' && <ClassesList />}
      {activeType === 'races' && <RacesList />}
      {activeType === 'backgrounds' && <BackgroundsList />}
      {activeType === 'feats' && <FeatsList />}
    </div>
  );
}

function ClassesList() {
  const {
    data: classes,
    isLoading,
    error,
    page,
    setPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedContent<ClassSummary>(
    'classes',
    (page, limit) => getClasses({ page, limit }),
    { initialPage: 1, limit: 20 }
  );

  if (error) {
    return <div className="text-red-500 p-4">Error loading classes: {error.message}</div>;
  }

  return (
    <div>
      <h2 className="font-semibold text-gray-900 dark:text-white text-xl mb-4">
        Classes
      </h2>

      {isLoading ? (
        <LoadingGrid />
      ) : classes && classes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <ContentCard
                key={cls.id}
                id={cls.id}
                name={cls.name}
                slug={cls.slug}
                type="class"
                href={`/handbook/characters/classes/${cls.slug}`}
                badges={[{ label: cls.hitDie, color: 'blue' }]}
                attributes={[{ label: 'Primary', value: cls.primaryAbility }]}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            setPage={setPage}
          />
        </>
      ) : (
        <EmptyState message="No classes found" />
      )}
    </div>
  );
}

function RacesList() {
  const {
    data: races,
    isLoading,
    error,
    page,
    setPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedContent<RaceSummary>(
    'races',
    (page, limit) => getRaces({ page, limit }),
    { initialPage: 1, limit: 20 }
  );

  if (error) {
    return <div className="text-red-500 p-4">Error loading races: {error.message}</div>;
  }

  return (
    <div>
      <h2 className="font-semibold text-gray-900 dark:text-white text-xl mb-4">
        Races
      </h2>

      {isLoading ? (
        <LoadingGrid />
      ) : races && races.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {races.map((race) => (
              <ContentCard
                key={race.id}
                id={race.id}
                name={race.name}
                slug={race.slug}
                type="race"
                href={`/handbook/characters/races/${race.slug}`}
                badges={[{ label: race.size, color: 'gray' }]}
                attributes={[{ label: 'Speed', value: `${race.speed} ft` }]}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            setPage={setPage}
          />
        </>
      ) : (
        <EmptyState message="No races found" />
      )}
    </div>
  );
}

function BackgroundsList() {
  const {
    data: backgrounds,
    isLoading,
    error,
    page,
    setPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedContent<BackgroundSummary>(
    'backgrounds',
    (page, limit) => getBackgrounds({ page, limit }),
    { initialPage: 1, limit: 20 }
  );

  if (error) {
    return <div className="text-red-500 p-4">Error loading backgrounds: {error.message}</div>;
  }

  return (
    <div>
      <h2 className="font-semibold text-gray-900 dark:text-white text-xl mb-4">
        Backgrounds
      </h2>

      {isLoading ? (
        <LoadingGrid />
      ) : backgrounds && backgrounds.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {backgrounds.map((bg) => (
              <ContentCard
                key={bg.id}
                id={bg.id}
                name={bg.name}
                slug={bg.slug}
                type="background"
                href={`/handbook/characters/backgrounds/${bg.slug}`}
                attributes={[
                  {
                    label: 'Skills',
                    value: bg.skillProficiencies.slice(0, 2).join(', '),
                  },
                ]}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            setPage={setPage}
          />
        </>
      ) : (
        <EmptyState message="No backgrounds found" />
      )}
    </div>
  );
}

function FeatsList() {
  const {
    data: feats,
    isLoading,
    error,
    page,
    setPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedContent<FeatSummary>(
    'feats',
    (page, limit) => getFeats({ page, limit }),
    { initialPage: 1, limit: 20 }
  );

  if (error) {
    return <div className="text-red-500 p-4">Error loading feats: {error.message}</div>;
  }

  return (
    <div>
      <h2 className="font-semibold text-gray-900 dark:text-white text-xl mb-4">
        Feats
      </h2>

      {isLoading ? (
        <LoadingGrid />
      ) : feats && feats.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feats.map((feat) => (
              <ContentCard
                key={feat.id}
                id={feat.id}
                name={feat.name}
                slug={feat.slug}
                type="feat"
                href={`/handbook/characters/feats/${feat.slug}`}
                attributes={
                  feat.prerequisites
                    ? [{ label: 'Prereq', value: feat.prerequisites }]
                    : []
                }
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            setPage={setPage}
          />
        </>
      ) : (
        <EmptyState message="No feats found" />
      )}
    </div>
  );
}

// Shared components

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(9)].map((_, i) => (
        <div
          key={i}
          className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <p>{message}</p>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  setPage,
}: {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  setPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center gap-2 mt-6">
      <button
        onClick={() => setPage(page - 1)}
        disabled={!hasPrevPage}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
      >
        Previous
      </button>
      <span className="px-4 py-2 text-sm">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => setPage(page + 1)}
        disabled={!hasNextPage}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
