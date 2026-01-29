// Handbook Layout - T019
// Main layout for handbook pages with tab navigation

import { TabNavigation } from '@/components/handbook/TabNavigation';

export const metadata = {
  title: 'Rules & Handbook | DnD Master',
  description: 'Browse D&D 5th Edition rules, spells, monsters, items, and more',
};

export default function HandbookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Rules & Handbook
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and search D&D 5th Edition content
          </p>
        </header>

        <TabNavigation className="mb-6" />

        <main>{children}</main>
      </div>
    </div>
  );
}
