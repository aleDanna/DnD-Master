/**
 * Rules Landing Page
 * T077: Create rules landing page
 */

import Link from 'next/link';
import ContentPanel, { ContentSection } from '@/components/layout/ContentPanel';

export const metadata = {
  title: 'Rules - DnD Master',
  description: 'Browse D&D 5th Edition rules by category',
};

const RULE_CATEGORIES = [
  {
    name: 'Using Ability Scores',
    slug: 'using-ability-scores',
    description: 'Learn how ability scores define your character\'s capabilities.',
  },
  {
    name: 'Adventuring',
    slug: 'adventuring',
    description: 'Rules for exploration, travel, and resting.',
  },
  {
    name: 'Combat',
    slug: 'combat',
    description: 'Everything you need to know about fighting in D&D.',
  },
  {
    name: 'Spellcasting',
    slug: 'spellcasting',
    description: 'The rules for casting spells and magical effects.',
  },
];

export default function RulesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Rules</h1>
      <p className="text-gray-600 mb-6">
        Browse the core rules of Dungeons & Dragons 5th Edition.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {RULE_CATEGORIES.map(category => (
          <Link
            key={category.slug}
            href={`/rules/${category.slug}`}
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {category.name}
            </h2>
            <p className="text-sm text-gray-600">{category.description}</p>
          </Link>
        ))}
      </div>

      <ContentPanel title="Quick Reference" className="mt-8">
        <ContentSection title="Getting Started">
          <p>
            Welcome to the Rules Explorer! Use the sidebar to navigate through
            different rule categories, or search for specific terms using the
            search bar.
          </p>
        </ContentSection>
        <ContentSection title="Navigation Tips">
          <ul className="list-disc list-inside space-y-1">
            <li>Click on categories to expand them</li>
            <li>Click on specific items to view their details</li>
            <li>Use the breadcrumb navigation to go back</li>
            <li>On mobile, tap the menu icon to open the sidebar</li>
          </ul>
        </ContentSection>
      </ContentPanel>
    </div>
  );
}
