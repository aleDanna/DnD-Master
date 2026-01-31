/**
 * Skills List Page
 * T097: Create skills list page
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchSkillsGrouped } from '@/lib/api/contentApi';
import { ContentSkeleton } from '@/components/layout/ContentPanel';

function getAbilityColor(ability: string): string {
  const colors: Record<string, string> = {
    Strength: 'border-red-500 bg-red-50',
    Dexterity: 'border-green-500 bg-green-50',
    Constitution: 'border-orange-500 bg-orange-50',
    Intelligence: 'border-blue-500 bg-blue-50',
    Wisdom: 'border-purple-500 bg-purple-50',
    Charisma: 'border-pink-500 bg-pink-50',
  };
  return colors[ability] || 'border-gray-500 bg-gray-50';
}

export default function SkillsPage() {
  const { data: groupedSkills, isLoading, isError } = useQuery({
    queryKey: ['skillsGrouped'],
    queryFn: fetchSkillsGrouped,
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Skills</h1>
        <ContentSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Skills</h1>
        <div className="text-red-600">Failed to load skills. Please try again.</div>
      </div>
    );
  }

  const abilityOrder = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
  const abilities = abilityOrder.filter((ability) => groupedSkills?.[ability]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Skills</h1>
      <p className="text-gray-600 mb-6">
        Skills represent specific aspects of ability scores, and proficiency in a skill demonstrates a focus on that aspect.
      </p>

      <div className="space-y-8">
        {abilities.map((ability) => (
          <section key={ability}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{ability}</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {groupedSkills![ability].map((skill) => (
                <Link
                  key={skill.id}
                  href={`/skills/${skill.slug}`}
                  className={`block p-4 rounded-lg border-l-4 hover:shadow-md transition-all ${getAbilityColor(ability)}`}
                >
                  <h3 className="font-medium text-gray-900">{skill.name}</h3>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {abilities.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No skills found. Skills will be available once the database is seeded.
        </p>
      )}
    </div>
  );
}
