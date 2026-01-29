// FilterPanel Component - T040
// Generic filter component with multi-select, range, and toggle options

'use client';

import { useState } from 'react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterSectionConfig {
  key: string;
  label: string;
  type: 'multiselect' | 'range' | 'toggle' | 'select';
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
}

interface FilterPanelProps {
  sections: FilterSectionConfig[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onClear: () => void;
}

export function FilterPanel({
  sections,
  values,
  onChange,
  onClear,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = Object.values(values).some((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'boolean') return v;
    return v !== undefined && v !== null && v !== '';
  });

  return (
    <div className="mb-6">
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg w-full justify-between"
        >
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                Active
              </span>
            )}
          </span>
          <ChevronIcon expanded={isExpanded} />
        </button>
      </div>

      {/* Filter content */}
      <div
        className={`
          lg:block
          ${isExpanded ? 'block' : 'hidden'}
        `}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Filters
            </h3>
            {hasActiveFilters && (
              <button
                onClick={onClear}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <FilterSection
                key={section.key}
                config={section}
                value={values[section.key]}
                onChange={(value) => onChange(section.key, value)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FilterSectionProps {
  config: FilterSectionConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FilterSection({ config, value, onChange }: FilterSectionProps) {
  switch (config.type) {
    case 'multiselect':
      return (
        <MultiSelectFilter
          label={config.label}
          options={config.options || []}
          value={value as string[] | undefined}
          onChange={onChange}
        />
      );
    case 'range':
      return (
        <RangeFilter
          label={config.label}
          min={config.min || 0}
          max={config.max || 10}
          step={config.step || 1}
          value={value as [number, number] | undefined}
          onChange={onChange}
        />
      );
    case 'toggle':
      return (
        <ToggleFilter
          label={config.label}
          value={value as boolean | undefined}
          onChange={onChange}
        />
      );
    case 'select':
      return (
        <SelectFilter
          label={config.label}
          options={config.options || []}
          value={value as string | undefined}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
}

interface MultiSelectFilterProps {
  label: string;
  options: FilterOption[];
  value: string[] | undefined;
  onChange: (value: string[]) => void;
}

function MultiSelectFilter({
  label,
  options,
  value = [],
  onChange,
}: MultiSelectFilterProps) {
  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => toggleOption(option.value)}
            className={`
              px-3 py-1 rounded-full text-sm border transition-colors
              ${
                value.includes(option.value)
                  ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="ml-1 opacity-60">({option.count})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

interface RangeFilterProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: [number, number] | undefined;
  onChange: (value: [number, number]) => void;
}

function RangeFilter({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: RangeFilterProps) {
  const currentMin = value?.[0] ?? min;
  const currentMax = value?.[1] ?? max;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}: {currentMin} - {currentMax}
      </label>
      <div className="flex items-center gap-4">
        <input
          type="number"
          min={min}
          max={currentMax}
          step={step}
          value={currentMin}
          onChange={(e) => onChange([Number(e.target.value), currentMax])}
          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <span className="text-gray-500">to</span>
        <input
          type="number"
          min={currentMin}
          max={max}
          step={step}
          value={currentMax}
          onChange={(e) => onChange([currentMin, Number(e.target.value)])}
          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );
}

interface ToggleFilterProps {
  label: string;
  value: boolean | undefined;
  onChange: (value: boolean) => void;
}

function ToggleFilter({ label, value, onChange }: ToggleFilterProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <button
        onClick={() => onChange(!value)}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out
          ${value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}
        `}
        role="switch"
        aria-checked={value}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
            ${value ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

interface SelectFilterProps {
  label: string;
  options: FilterOption[];
  value: string | undefined;
  onChange: (value: string) => void;
}

function SelectFilter({ label, options, value, onChange }: SelectFilterProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-5 h-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

// Predefined filter configurations for spell filtering
export const SPELL_FILTER_SECTIONS: FilterSectionConfig[] = [
  {
    key: 'level',
    label: 'Spell Level',
    type: 'multiselect',
    options: [
      { value: '0', label: 'Cantrip' },
      { value: '1', label: '1st' },
      { value: '2', label: '2nd' },
      { value: '3', label: '3rd' },
      { value: '4', label: '4th' },
      { value: '5', label: '5th' },
      { value: '6', label: '6th' },
      { value: '7', label: '7th' },
      { value: '8', label: '8th' },
      { value: '9', label: '9th' },
    ],
  },
  {
    key: 'school',
    label: 'School',
    type: 'multiselect',
    options: [
      { value: 'abjuration', label: 'Abjuration' },
      { value: 'conjuration', label: 'Conjuration' },
      { value: 'divination', label: 'Divination' },
      { value: 'enchantment', label: 'Enchantment' },
      { value: 'evocation', label: 'Evocation' },
      { value: 'illusion', label: 'Illusion' },
      { value: 'necromancy', label: 'Necromancy' },
      { value: 'transmutation', label: 'Transmutation' },
    ],
  },
  {
    key: 'concentration',
    label: 'Concentration',
    type: 'toggle',
  },
  {
    key: 'ritual',
    label: 'Ritual',
    type: 'toggle',
  },
];

// Predefined filter configurations for monster filtering
export const MONSTER_FILTER_SECTIONS: FilterSectionConfig[] = [
  {
    key: 'size',
    label: 'Size',
    type: 'multiselect',
    options: [
      { value: 'Tiny', label: 'Tiny' },
      { value: 'Small', label: 'Small' },
      { value: 'Medium', label: 'Medium' },
      { value: 'Large', label: 'Large' },
      { value: 'Huge', label: 'Huge' },
      { value: 'Gargantuan', label: 'Gargantuan' },
    ],
  },
  {
    key: 'type',
    label: 'Type',
    type: 'multiselect',
    options: [
      { value: 'aberration', label: 'Aberration' },
      { value: 'beast', label: 'Beast' },
      { value: 'celestial', label: 'Celestial' },
      { value: 'construct', label: 'Construct' },
      { value: 'dragon', label: 'Dragon' },
      { value: 'elemental', label: 'Elemental' },
      { value: 'fey', label: 'Fey' },
      { value: 'fiend', label: 'Fiend' },
      { value: 'giant', label: 'Giant' },
      { value: 'humanoid', label: 'Humanoid' },
      { value: 'monstrosity', label: 'Monstrosity' },
      { value: 'ooze', label: 'Ooze' },
      { value: 'plant', label: 'Plant' },
      { value: 'undead', label: 'Undead' },
    ],
  },
];

// Predefined filter configurations for item filtering
export const ITEM_FILTER_SECTIONS: FilterSectionConfig[] = [
  {
    key: 'type',
    label: 'Item Type',
    type: 'multiselect',
    options: [
      { value: 'weapon', label: 'Weapon' },
      { value: 'armor', label: 'Armor' },
      { value: 'adventuring_gear', label: 'Adventuring Gear' },
      { value: 'tool', label: 'Tool' },
      { value: 'mount', label: 'Mount' },
      { value: 'vehicle', label: 'Vehicle' },
      { value: 'trade_good', label: 'Trade Good' },
      { value: 'magic_item', label: 'Magic Item' },
    ],
  },
  {
    key: 'rarity',
    label: 'Rarity',
    type: 'multiselect',
    options: [
      { value: 'common', label: 'Common' },
      { value: 'uncommon', label: 'Uncommon' },
      { value: 'rare', label: 'Rare' },
      { value: 'very_rare', label: 'Very Rare' },
      { value: 'legendary', label: 'Legendary' },
      { value: 'artifact', label: 'Artifact' },
    ],
  },
  {
    key: 'attunement',
    label: 'Requires Attunement',
    type: 'toggle',
  },
];
