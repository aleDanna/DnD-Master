/**
 * Content Panel Component
 * T064: Create ContentPanel component (main display area)
 */

'use client';

import { ReactNode } from 'react';

interface ContentPanelProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function ContentPanel({
  children,
  title,
  subtitle,
  actions,
}: ContentPanelProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg">
      {(title || actions) && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">{children}</div>
    </div>
  );
}

/**
 * Content section within a panel
 */
export function ContentSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-6 last:mb-0">
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-3">{title}</h3>
      )}
      <div className="text-gray-700">{children}</div>
    </div>
  );
}

/**
 * Content loading skeleton
 */
export function ContentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-6" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  );
}
