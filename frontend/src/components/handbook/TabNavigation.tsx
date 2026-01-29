// TabNavigation Component - T017
// Horizontal tab bar for handbook categories

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export interface Tab {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

const HANDBOOK_TABS: Tab[] = [
  { id: 'rules', label: 'Rules', href: '/handbook/rules' },
  { id: 'characters', label: 'Characters', href: '/handbook/characters' },
  { id: 'spells', label: 'Spells', href: '/handbook/spells' },
  { id: 'bestiary', label: 'Bestiary', href: '/handbook/bestiary' },
  { id: 'equipment', label: 'Equipment', href: '/handbook/equipment' },
];

export interface TabNavigationProps {
  tabs?: Tab[];
  className?: string;
}

export function TabNavigation({
  tabs = HANDBOOK_TABS,
  className = '',
}: TabNavigationProps) {
  const pathname = usePathname();

  // Determine active tab from pathname
  const activeTab = tabs.find((tab) => pathname.startsWith(tab.href))?.id || tabs[0]?.id;

  return (
    <nav
      className={`border-b border-gray-200 dark:border-gray-700 ${className}`}
      aria-label="Handbook navigation"
    >
      <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <li key={tab.id} className="mr-2">
              <Link
                href={tab.href}
                className={`
                  inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg
                  transition-colors duration-200
                  ${
                    isActive
                      ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.icon && <span className="mr-2">{tab.icon}</span>}
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Sub-navigation for Characters tab
export const CHARACTER_SUB_TABS: Tab[] = [
  { id: 'classes', label: 'Classes', href: '/handbook/characters?type=classes' },
  { id: 'races', label: 'Races', href: '/handbook/characters?type=races' },
  { id: 'backgrounds', label: 'Backgrounds', href: '/handbook/characters?type=backgrounds' },
  { id: 'feats', label: 'Feats', href: '/handbook/characters?type=feats' },
];

export interface SubTabNavigationProps {
  tabs: Tab[];
  activeId?: string;
  className?: string;
}

export function SubTabNavigation({
  tabs,
  activeId,
  className = '',
}: SubTabNavigationProps) {
  return (
    <div className={`flex gap-2 mb-4 ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium
              transition-colors duration-200
              ${
                isActive
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }
            `}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export default TabNavigation;
