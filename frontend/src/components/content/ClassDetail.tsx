/**
 * Class Detail Component
 * T067: Create ClassDetail component for displaying class information
 */

'use client';

import Link from 'next/link';
import { Class } from '@/types/content.types';
import SourceCitation from './SourceCitation';

interface ClassDetailProps {
  classData: Class;
}

export default function ClassDetail({ classData }: ClassDetailProps) {
  return (
    <article className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
            <p className="mt-1 text-gray-600">
              Hit Die: <span className="font-medium">{classData.hitDie}</span>
              {' · '}
              Primary Ability: <span className="font-medium">{classData.primaryAbility}</span>
            </p>
          </div>
          <SourceCitation source={classData.source} />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Description */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
          <p className="text-gray-700">{classData.description}</p>
        </section>

        {/* Proficiencies */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Saving Throws</h3>
            <p className="text-gray-700">{classData.savingThrows.join(', ')}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Armor Proficiencies</h3>
            <p className="text-gray-700">
              {classData.armorProficiencies.length > 0
                ? classData.armorProficiencies.join(', ')
                : 'None'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Weapon Proficiencies</h3>
            <p className="text-gray-700">
              {classData.weaponProficiencies.length > 0
                ? classData.weaponProficiencies.join(', ')
                : 'None'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Tool Proficiencies</h3>
            <p className="text-gray-700">
              {classData.toolProficiencies.length > 0
                ? classData.toolProficiencies.join(', ')
                : 'None'}
            </p>
          </div>
        </section>

        {/* Skills */}
        {classData.skillChoices && (
          <section className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Skill Proficiencies</h3>
            <p className="text-gray-700">
              Choose {classData.skillChoices.count} from:{' '}
              {classData.skillChoices.options.join(', ')}
            </p>
          </section>
        )}

        {/* Class Features */}
        {classData.features && classData.features.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Features</h2>
            <div className="space-y-4">
              {classData.features.map((feature, index) => (
                <div key={index} className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-medium text-gray-900">
                    {feature.name}
                    <span className="ml-2 text-sm text-gray-500">
                      (Level {feature.level})
                    </span>
                  </h3>
                  <p className="mt-1 text-gray-700 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Subclasses */}
        {classData.subclasses && classData.subclasses.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subclasses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classData.subclasses.map((subclass) => (
                <Link
                  key={subclass.id}
                  href={`/classes/${classData.slug}/${subclass.slug}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">{subclass.name}</h3>
                  <SourceCitation source={subclass.source} compact className="mt-1" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
