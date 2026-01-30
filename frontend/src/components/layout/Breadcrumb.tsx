/**
 * Breadcrumb Component
 * T063: Create Breadcrumb component
 */

'use client';

import Link from 'next/link';
import { BreadcrumbItem } from '@/types/api.types';
import { ChevronRightIcon } from './Icons';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-1 text-sm">
        {items.map((item, index) => (
          <li key={item.path} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
            )}
            {item.isActive ? (
              <span className="text-gray-900 font-medium" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.path}
                className="text-gray-500 hover:text-gray-700 hover:underline"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Build breadcrumb items from path segments
 */
export function buildBreadcrumbs(
  path: string,
  labels: Record<string, string> = {}
): BreadcrumbItem[] {
  const segments = path.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    items.push({
      label: labels[segment] || formatLabel(segment),
      path: currentPath,
      isActive: isLast,
    });
  });

  return items;
}

function formatLabel(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
