/**
 * Mobile Search Button Component
 * T119: Add mobile search access (in header when sidebar collapsed)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon, XMarkIcon } from './Icons';
import SearchBar from '@/components/search/SearchBar';

interface MobileSearchButtonProps {
  className?: string;
}

export default function MobileSearchButton({ className = '' }: MobileSearchButtonProps) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setIsSearchOpen(false);
    }
  };

  const handleClose = () => {
    setQuery('');
    setIsSearchOpen(false);
  };

  if (isSearchOpen) {
    return (
      <div className={`flex items-center gap-2 flex-1 ${className}`}>
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={handleSubmit}
          onClear={handleClose}
          placeholder="Search..."
          autoFocus
          className="flex-1"
        />
        <button
          onClick={handleClose}
          className="
            p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100
            transition-colors min-w-[44px] min-h-[44px]
            flex items-center justify-center
          "
          aria-label="Close search"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsSearchOpen(true)}
      className={`
        p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100
        transition-colors min-w-[44px] min-h-[44px]
        flex items-center justify-center
        ${className}
      `}
      aria-label="Open search"
    >
      <SearchIcon className="w-5 h-5" />
    </button>
  );
}
