/**
 * Sidebar Component
 * T061: Create Sidebar component (hierarchical navigation)
 */

'use client';

import { useNavigation } from '@/lib/hooks/useNavigation';
import { useSidebar } from '@/lib/hooks/useSidebar';
import SidebarItem from './SidebarItem';

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { categories, isLoading, isError } = useNavigation();
  const sidebar = useSidebar();

  if (isLoading) {
    return (
      <nav className="flex-1 px-2 py-4 space-y-1">
        <div className="animate-pulse space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded" />
          ))}
        </div>
      </nav>
    );
  }

  if (isError) {
    return (
      <nav className="flex-1 px-4 py-4">
        <div className="text-sm text-red-600">
          Failed to load navigation. Please try refreshing.
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
      {categories.map(category => (
        <SidebarItem
          key={category.id}
          node={{
            id: category.id,
            label: category.label,
            slug: category.slug,
            type: 'category',
            path: category.path,
            children: category.children,
          }}
          depth={0}
          isExpanded={sidebar.isExpanded(category.id)}
          onToggle={() => sidebar.toggle(category.id)}
          sidebar={sidebar}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
