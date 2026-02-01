/**
 * Breadcrumb Component
 * T063: Create Breadcrumb component
 */

'use client';

import Link from 'next/link';
import { ChevronRightIcon } from './Icons';

// Flexible breadcrumb item that accepts either path or href
interface FlexibleBreadcrumbItem {
  label: string;
  path?: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items: FlexibleBreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-1 text-sm">
        {items.map((item, index) => {
          const itemPath = item.path || item.href;
          const isLast = index === items.length - 1;
          const isActive = item.isActive ?? isLast ?? !itemPath;

          return (
            <li key={itemPath || item.label} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
              )}
              {isActive || !itemPath ? (
                <span className="text-gray-900 font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={itemPath}
                  className="text-gray-500 hover:text-gray-700 hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
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
