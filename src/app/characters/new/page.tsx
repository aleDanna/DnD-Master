'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Dices,
  RefreshCw,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

const RACES = [
  { value: 'human', label: 'Human', bonus: '+1 to all abilities' },
  { value: 'elf', label: 'Elf', bonus: '+2 DEX' },
  { value: 'dwarf', label: 'Dwarf', bonus: '+2 CON' },
  { value: 'halfling', label: 'Halfling', bonus: '+2 DEX' },
  { value: 'dragonborn', label: 'Dragonborn', bonus: '+2 STR, +1 CHA' },
  { value: 'gnome', label: 'Gnome', bonus: '+2 INT' },
  { value: 'half-elf', label: 'Half-Elf', bonus: '+2 CHA, +1 to two others' },
  { value: 'half-orc', label: 'Half-Orc', bonus: '+2 STR, +1 CON' },
  { value: 'tiefling', label: 'Tiefling', bonus: '+2 CHA, +1 INT' },
];

const CLASSES = [
  { value: 'barbarian', label: 'Barbarian', hitDie: 'd12', primary: 'Strength' },
  { value: 'bard', label: 'Bard', hitDie: 'd8', primary: 'Charisma' },
  { value: 'cleric', label: 'Cleric', hitDie: 'd8', primary: 'Wisdom' },
  { value: 'druid', label: 'Druid', hitDie: 'd8', primary: 'Wisdom' },
  { value: 'fighter', label: 'Fighter', hitDie: 'd10', primary: 'Strength or Dexterity' },
  { value: 'monk', label: 'Monk', hitDie: 'd8', primary: 'Dexterity & Wisdom' },
  { value: 'paladin', label: 'Paladin', hitDie: 'd10', primary: 'Strength & Charisma' },
  { value: 'ranger', label: 'Ranger', hitDie: 'd10', primary: 'Dexterity & Wisdom' },
  { value: 'rogue', label: 'Rogue', hitDie: 'd8', primary: 'Dexterity' },
  { value: 'sorcerer', label: 'Sorcerer', hitDie: 'd6', primary: 'Charisma' },
  { value: 'warlock', label: 'Warlock', hitDie: 'd8', primary: 'Charisma' },
  { value: 'wizard', label: 'Wizard', hitDie: 'd6', primary: 'Intelligence' },
];

const BACKGROUNDS = [
  { value: 'acolyte', label: 'Acolyte' },
  { value: 'charlatan', label: 'Charlatan' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'entertainer', label: 'Entertainer' },
  { value: 'folk-hero', label: 'Folk Hero' },
  { value: 'guild-artisan', label: 'Guild Artisan' },
  { value: 'hermit', label: 'Hermit' },
  { value: 'noble', label: 'Noble' },
  { value: 'outlander', label: 'Outlander' },
  { value: 'sage', label: 'Sage' },
  { value: 'sailor', label: 'Sailor' },
  { value: 'soldier', label: 'Soldier' },
  { value: 'urchin', label: 'Urchin' },
];

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

const ABILITIES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;

const steps = [
  { id: 'basics', label: 'Basics' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'details', label: 'Details' },
  { id: 'review', label: 'Review' },
];

export default function NewCharacterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [abilityMethod, setAbilityMethod] = useState<'standard' | 'roll' | 'point-buy'>('standard');
  const [rolledScores, setRolledScores] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    race: '',
    class: '',
    background: '',
    abilities: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    traits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    backstory: '',
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateAbility = (ability: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      abilities: { ...prev.abilities, [ability]: value },
    }));
  };

  const rollAbilityScores = () => {
    const scores: number[] = [];
    for (let i = 0; i < 6; i++) {
      // Roll 4d6, drop lowest
      const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => b - a);
      scores.push(rolls[0] + rolls[1] + rolls[2]);
    }
    setRolledScores(scores.sort((a, b) => b - a));
  };

  const getModifier = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name && formData.race && formData.class && formData.background;
      case 1:
        return true;
      case 2:
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    console.log('Creating character:', formData);
    router.push('/characters');
  };

  return (
    <AppLayout
      title="Create Character"
      subtitle="Build your adventurer"
      actions={
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      }
    >
      <div className="p-6 max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                      index < currentStep
                        ? 'bg-accent text-white'
                        : index === currentStep
                        ? 'bg-accent text-white'
                        : 'bg-background-secondary text-foreground-secondary'
                    )}
                  >
                    {index < currentStep ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      index <= currentStep
                        ? 'text-foreground'
                        : 'text-foreground-secondary'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-24 h-0.5 mx-4',
                      index < currentStep ? 'bg-accent' : 'bg-border'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-6">
          {/* Step 1: Basics */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Character Name
                    </label>
                    <Input
                      placeholder="Enter character name"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Race</label>
                    <Select
                      value={formData.race}
                      onChange={(e) => updateFormData('race', e.target.value)}
                    >
                      <option value="">Select a race</option>
                      {RACES.map((race) => (
                        <option key={race.value} value={race.value}>
                          {race.label} ({race.bonus})
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Class</label>
                    <Select
                      value={formData.class}
                      onChange={(e) => updateFormData('class', e.target.value)}
                    >
                      <option value="">Select a class</option>
                      {CLASSES.map((cls) => (
                        <option key={cls.value} value={cls.value}>
                          {cls.label} ({cls.hitDie}, {cls.primary})
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Background
                    </label>
                    <Select
                      value={formData.background}
                      onChange={(e) => updateFormData('background', e.target.value)}
                    >
                      <option value="">Select a background</option>
                      {BACKGROUNDS.map((bg) => (
                        <option key={bg.value} value={bg.value}>
                          {bg.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Abilities */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Ability Scores</h2>
                <div className="flex gap-2 mb-6">
                  <Button
                    variant={abilityMethod === 'standard' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAbilityMethod('standard')}
                  >
                    Standard Array
                  </Button>
                  <Button
                    variant={abilityMethod === 'roll' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAbilityMethod('roll')}
                  >
                    Roll
                  </Button>
                  <Button
                    variant={abilityMethod === 'point-buy' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAbilityMethod('point-buy')}
                  >
                    Point Buy
                  </Button>
                </div>

                {abilityMethod === 'standard' && (
                  <p className="text-sm text-foreground-secondary mb-4">
                    Assign these scores to your abilities: {STANDARD_ARRAY.join(', ')}
                  </p>
                )}

                {abilityMethod === 'roll' && (
                  <div className="mb-4">
                    <Button variant="outline" onClick={rollAbilityScores}>
                      <Dices className="w-4 h-4 mr-2" />
                      Roll 4d6 (drop lowest)
                    </Button>
                    {rolledScores.length > 0 && (
                      <p className="text-sm text-foreground-secondary mt-2">
                        Rolled: {rolledScores.join(', ')}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ABILITIES.map((ability) => (
                    <div key={ability} className="p-4 rounded-lg bg-background-secondary">
                      <label className="block text-sm font-medium capitalize mb-2">
                        {ability}
                      </label>
                      <div className="flex items-center gap-2">
                        <Select
                          value={formData.abilities[ability].toString()}
                          onChange={(e) =>
                            updateAbility(ability, parseInt(e.target.value))
                          }
                          className="flex-1"
                        >
                          {(abilityMethod === 'standard'
                            ? STANDARD_ARRAY
                            : abilityMethod === 'roll' && rolledScores.length > 0
                            ? rolledScores
                            : Array.from({ length: 13 }, (_, i) => i + 8)
                          ).map((score) => (
                            <option key={score} value={score}>
                              {score}
                            </option>
                          ))}
                        </Select>
                        <span className="text-lg font-bold w-12 text-center">
                          {getModifier(formData.abilities[ability])}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  Personality & Background
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Personality Traits
                    </label>
                    <Textarea
                      placeholder="Describe your character's personality..."
                      value={formData.traits}
                      onChange={(e) => updateFormData('traits', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ideals</label>
                    <Textarea
                      placeholder="What principles guide your character?"
                      value={formData.ideals}
                      onChange={(e) => updateFormData('ideals', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bonds</label>
                    <Textarea
                      placeholder="What connections tie your character to the world?"
                      value={formData.bonds}
                      onChange={(e) => updateFormData('bonds', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Flaws</label>
                    <Textarea
                      placeholder="What are your character's weaknesses?"
                      value={formData.flaws}
                      onChange={(e) => updateFormData('flaws', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Backstory
                    </label>
                    <Textarea
                      placeholder="Write your character's history..."
                      value={formData.backstory}
                      onChange={(e) => updateFormData('backstory', e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Review Your Character</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground-secondary">
                      Name
                    </h3>
                    <p className="text-lg font-semibold">{formData.name || '—'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground-secondary">
                      Race
                    </h3>
                    <p className="capitalize">{formData.race || '—'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground-secondary">
                      Class
                    </h3>
                    <p className="capitalize">{formData.class || '—'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground-secondary">
                      Background
                    </h3>
                    <p className="capitalize">{formData.background || '—'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground-secondary mb-2">
                    Ability Scores
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {ABILITIES.map((ability) => (
                      <div
                        key={ability}
                        className="p-2 rounded-lg bg-background-secondary text-center"
                      >
                        <p className="text-xs text-foreground-secondary uppercase">
                          {ability.slice(0, 3)}
                        </p>
                        <p className="text-lg font-bold">
                          {formData.abilities[ability]}
                        </p>
                        <p className="text-sm text-foreground-secondary">
                          {getModifier(formData.abilities[ability])}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() =>
                  setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))
                }
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                <Check className="w-4 h-4 mr-2" />
                Create Character
              </Button>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
