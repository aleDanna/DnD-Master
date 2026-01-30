/**
 * Search Bar Component
 * T108: Create SearchBar component
 * T124: Update SearchBar with search mode toggle
 */

'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon, XMarkIcon } from '@/components/layout/Icons';
import { SearchMode } from '@/types/api.types';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  autoFocus?: boolean;
  className?: string;
  searchMode?: SearchMode;
  onSearchModeChange?: (mode: SearchMode) => void;
  showModeToggle?: boolean;
}

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Search rules, spells, monsters...',
  isLoading = false,
  autoFocus = false,
  className = '',
  searchMode = 'full-text',
  onSearchModeChange,
  showModeToggle = false,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
    if (e.key === 'Escape') {
      if (value) {
        handleClear();
      } else {
        inputRef.current?.blur();
      }
    }
  };

  const handleClear = () => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div className={`${className}`}>
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          ) : (
            <SearchIcon className="w-4 h-4 text-gray-400" />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            block w-full pl-10 pr-10 py-2.5
            border border-gray-300 rounded-lg
            bg-white text-gray-900 text-sm
            placeholder-gray-400
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors
            min-h-[44px]
          "
          aria-label="Search"
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="
              absolute inset-y-0 right-0 pr-3
              flex items-center
              text-gray-400 hover:text-gray-600
              focus:outline-none focus:text-gray-600
            "
            aria-label="Clear search"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Mode Toggle */}
      {showModeToggle && onSearchModeChange && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">Mode:</span>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => onSearchModeChange('full-text')}
              className={`
                px-3 py-1 text-xs font-medium transition-colors
                ${searchMode === 'full-text'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }
              `}
              aria-label="Keyword search"
            >
              Keyword
            </button>
            <button
              type="button"
              onClick={() => onSearchModeChange('semantic')}
              className={`
                px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1
                ${searchMode === 'semantic'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }
              `}
              aria-label="AI-powered semantic search"
            >
              <span>AI</span>
              <span className="text-[10px]">✨</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version of SearchBar for sidebar
 */
export function CompactSearchBar({
  onFocus,
  className = '',
}: {
  onFocus?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <SearchBar
      value={query}
      onChange={setQuery}
      onSubmit={handleSubmit}
      placeholder="Search..."
      className={className}
      autoFocus={false}
    />
  );
}
