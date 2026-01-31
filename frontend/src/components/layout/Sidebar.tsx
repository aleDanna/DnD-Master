/**
 * Sidebar Component
 * T061: Create Sidebar component (hierarchical navigation)
 * T113: Integrate SearchBar into Sidebar component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@/lib/hooks/useNavigation';
import { useSidebar } from '@/lib/hooks/useSidebar';
import SidebarItem from './SidebarItem';
import SearchBar from '@/components/search/SearchBar';
import { CompactRecentSearches } from '@/components/search/RecentSearches';

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const router = useRouter();
  const { categories, isLoading, isError } = useNavigation();
  const sidebar = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      onNavigate?.();
    }
  };

  const handleRecentSearchSelect = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
    onNavigate?.();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1">
        {/* Search Bar */}
        <div className="px-3 pt-3 pb-2">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSearchSubmit}
            placeholder="Search..."
          />
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          <div className="animate-pulse space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded" />
            ))}
          </div>
        </nav>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col flex-1">
        {/* Search Bar */}
        <div className="px-3 pt-3 pb-2">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSearchSubmit}
            placeholder="Search..."
          />
        </div>
        {/* Browse Rules Header */}
        <div className="px-4 py-2 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Browse Rules</h2>
        </div>
        <nav className="flex-1 px-4 py-4">
          <div className="text-sm text-red-600 mb-2">
            Failed to list entries
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Retry
          </button>
        </nav>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Search Bar */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearchSubmit}
          placeholder="Search..."
        />
        <CompactRecentSearches
          onSelect={handleRecentSearchSelect}
          limit={3}
          className="mt-2"
        />
      </div>

      {/* Browse Rules Header */}
      <div className="px-4 py-2 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-900">Browse Rules</h2>
      </div>

      {/* Navigation */}
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
    </div>
  );
}
