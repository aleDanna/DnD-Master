'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Map,
  Swords,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Dices,
  MessageSquare,
  Scroll,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

const mainNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Characters', href: '/characters', icon: Users },
  { name: 'Campaigns', href: '/campaigns', icon: Map },
  { name: 'Sessions', href: '/sessions', icon: BookOpen },
  { name: 'Combat', href: '/combat', icon: Swords },
];

const toolNavItems: NavItem[] = [
  { name: 'Dice Roller', href: '/tools/dice', icon: Dices },
  { name: 'Rules Reference', href: '/tools/rules', icon: Scroll },
  { name: 'AI Dungeon Master', href: '/tools/ai-dm', icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar-bg border-r border-border transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Dices className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-lg">DnD Master</span>
          )}
        </Link>
      </div>

      {/* New Campaign Button */}
      <div className="p-3">
        <Link
          href="/campaigns/new"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border',
            'hover:bg-sidebar-hover transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && <span className="text-sm">New Campaign</span>}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-sidebar-hover text-foreground'
                    : 'text-foreground-secondary hover:bg-sidebar-hover hover:text-foreground',
                  isCollapsed && 'justify-center'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="text-sm flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>

        {/* Tools Section */}
        {!isCollapsed && (
          <div className="mt-6">
            <h3 className="px-3 mb-2 text-xs font-medium text-foreground-tertiary uppercase tracking-wider">
              Tools
            </h3>
          </div>
        )}
        <div className="space-y-1 mt-2">
          {toolNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-sidebar-hover text-foreground'
                    : 'text-foreground-secondary hover:bg-sidebar-hover hover:text-foreground',
                  isCollapsed && 'justify-center'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-3 space-y-1">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
            'text-foreground-secondary hover:bg-sidebar-hover hover:text-foreground',
            isCollapsed && 'justify-center'
          )}
        >
          <Settings className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm">Settings</span>}
        </Link>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full',
            'text-foreground-secondary hover:bg-sidebar-hover hover:text-foreground',
            isCollapsed && 'justify-center'
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
