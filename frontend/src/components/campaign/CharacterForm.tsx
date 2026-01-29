'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { CreateCharacterInput, UpdateCharacterInput } from '@/lib/api';

export interface CharacterFormProps {
  initialValues?: Partial<CreateCharacterInput>;
  campaignId: string;
  onSubmit: (data: CreateCharacterInput | UpdateCharacterInput) => Promise<void>;
  onCancel?: () => void;
  isEdit?: boolean;
}

const D5E_RACES = [
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Gnome', 'Half-Elf', 'Half-Orc',
  'Tiefling', 'Dragonborn', 'Aasimar', 'Goliath', 'Tabaxi', 'Kenku',
];

const D5E_CLASSES = [
  'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk',
  'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard',
];

/**
 * CharacterForm - Form for creating/editing characters
 */
export function CharacterForm({
  initialValues,
  campaignId,
  onSubmit,
  onCancel,
  isEdit = false,
}: CharacterFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(initialValues?.name || '');
  const [race, setRace] = useState(initialValues?.race || D5E_RACES[0]);
  const [charClass, setCharClass] = useState(initialValues?.class || D5E_CLASSES[0]);
  const [level, setLevel] = useState(initialValues?.level || 1);
  const [maxHp, setMaxHp] = useState(initialValues?.max_hp || 10);
  const [currentHp, setCurrentHp] = useState(initialValues?.current_hp || 10);
  const [armorClass, setArmorClass] = useState(initialValues?.armor_class || 10);
  const [speed, setSpeed] = useState(initialValues?.speed || 30);
  const [strength, setStrength] = useState(initialValues?.strength || 10);
  const [dexterity, setDexterity] = useState(initialValues?.dexterity || 10);
  const [constitution, setConstitution] = useState(initialValues?.constitution || 10);
  const [intelligence, setIntelligence] = useState(initialValues?.intelligence || 10);
  const [wisdom, setWisdom] = useState(initialValues?.wisdom || 10);
  const [charisma, setCharisma] = useState(initialValues?.charisma || 10);
  const [notes, setNotes] = useState(initialValues?.notes || '');

  const getAbilityModifier = (score: number): string => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data: CreateCharacterInput = {
        campaign_id: campaignId,
        name,
        race,
        class: charClass,
        level,
        max_hp: maxHp,
        current_hp: currentHp,
        armor_class: armorClass,
        speed,
        strength,
        dexterity,
        constitution,
        intelligence,
        wisdom,
        charisma,
        notes: notes || undefined,
      };

      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save character');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
          Basic Information
        </h3>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Character Name *
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter character name"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Race *
            </label>
            <select
              value={race}
              onChange={(e) => setRace(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            >
              {D5E_RACES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Class *
            </label>
            <select
              value={charClass}
              onChange={(e) => setCharClass(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            >
              {D5E_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Level
          </label>
          <Input
            type="number"
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
            min={1}
            max={20}
          />
        </div>
      </div>

      {/* Combat Stats */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
          Combat Statistics
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Max HP *
            </label>
            <Input
              type="number"
              value={maxHp}
              onChange={(e) => setMaxHp(parseInt(e.target.value) || 1)}
              min={1}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Current HP *
            </label>
            <Input
              type="number"
              value={currentHp}
              onChange={(e) => setCurrentHp(parseInt(e.target.value) || 0)}
              min={0}
              max={maxHp}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Armor Class *
            </label>
            <Input
              type="number"
              value={armorClass}
              onChange={(e) => setArmorClass(parseInt(e.target.value) || 10)}
              min={1}
              max={30}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Speed (ft)
          </label>
          <Input
            type="number"
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value) || 30)}
            min={0}
            step={5}
          />
        </div>
      </div>

      {/* Ability Scores */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
          Ability Scores
        </h3>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: 'Strength', value: strength, setter: setStrength },
            { label: 'Dexterity', value: dexterity, setter: setDexterity },
            { label: 'Constitution', value: constitution, setter: setConstitution },
            { label: 'Intelligence', value: intelligence, setter: setIntelligence },
            { label: 'Wisdom', value: wisdom, setter: setWisdom },
            { label: 'Charisma', value: charisma, setter: setCharisma },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <label className="block text-xs font-medium text-muted mb-1 uppercase">
                {stat.label.slice(0, 3)}
              </label>
              <Input
                type="number"
                value={stat.value}
                onChange={(e) => stat.setter(parseInt(e.target.value) || 10)}
                min={1}
                max={30}
                className="text-center"
              />
              <div className="text-xs text-muted mt-1">
                {getAbilityModifier(stat.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
          Notes
        </h3>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          placeholder="Background, personality traits, bonds, flaws..."
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={loading}>
          {isEdit ? 'Save Changes' : 'Create Character'}
        </Button>
      </div>
    </form>
  );
}

export default CharacterForm;
