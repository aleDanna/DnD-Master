/**
 * Content Skeleton Component
 * T128: Add loading skeletons for all content pages
 */

'use client';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component
 */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Content panel skeleton for detail pages
 */
export function ContentPanelSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-48" />

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * List page skeleton
 */
export function ListPageSkeleton({ itemCount = 6 }: { itemCount?: number }) {
  return (
    <div className="animate-pulse space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: itemCount }).map((_, i) => (
          <div
            key={i}
            className="p-4 bg-white rounded-lg border border-gray-200"
          >
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Spell card skeleton
 */
export function SpellCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Monster stat block skeleton
 */
export function MonsterStatBlockSkeleton() {
  return (
    <div className="bg-amber-50 rounded-lg border-2 border-amber-600 overflow-hidden animate-pulse">
      <div className="p-6 border-b-2 border-amber-600 bg-amber-100">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="p-6 space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-44" />
        </div>

        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-4 w-8 mx-auto mb-1" />
              <Skeleton className="h-4 w-12 mx-auto" />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}

/**
 * Class detail skeleton
 */
export function ClassDetailSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Race detail skeleton
 */
export function RaceDetailSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <Skeleton className="h-5 w-40 mb-2" />
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentPanelSkeleton;
