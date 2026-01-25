'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  Moon,
  Sun,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6">
      {/* Left: Title */}
      <div className="flex items-center gap-4">
        {title && (
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-foreground-secondary">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary" />
          <input
            type="text"
            placeholder="Search characters, campaigns, sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-2 text-sm rounded-lg',
              'bg-background-secondary border border-border',
              'placeholder:text-foreground-tertiary',
              'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent',
              'transition-colors'
            )}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-foreground-tertiary bg-background-tertiary rounded">
            <span>⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {actions}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-foreground-secondary" />
          ) : (
            <Moon className="w-5 h-5 text-foreground-secondary" />
          )}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg hover:bg-background-secondary transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-foreground-secondary" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={cn(
              'flex items-center gap-2 p-1.5 pr-3 rounded-lg transition-colors',
              'hover:bg-background-secondary',
              isProfileOpen && 'bg-background-secondary'
            )}
          >
            <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
              <User className="w-4 h-4 text-accent" />
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 text-foreground-secondary transition-transform',
              isProfileOpen && 'rotate-180'
            )} />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-lg bg-background border border-border shadow-lg z-20 animate-fade-in">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium">Dungeon Master</p>
                  <p className="text-xs text-foreground-secondary">dm@dndmaster.app</p>
                </div>
                <div className="p-1">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-background-secondary transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-background-secondary transition-colors"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </div>
                <div className="p-1 border-t border-border">
                  <button
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-background-secondary transition-colors w-full text-left text-error"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
