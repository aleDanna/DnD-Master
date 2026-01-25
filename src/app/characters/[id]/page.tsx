'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Heart,
  Shield,
  Zap,
  Swords,
  BookOpen,
  Backpack,
  Sparkles,
  User,
  MoreHorizontal,
  Plus,
  Minus,
  Moon,
  Sun,
  Dices,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

// Mock character data
const mockCharacter = {
  id: '1',
  name: 'Thorin Ironforge',
  race: { name: 'Mountain Dwarf' },
  classes: [{ name: 'Fighter', level: 5 }],
  level: 5,
  background: { name: 'Soldier' },
  alignment: 'Lawful Good',
  experiencePoints: 6500,
  abilityScores: {
    strength: 18,
    dexterity: 12,
    constitution: 16,
    intelligence: 10,
    wisdom: 14,
    charisma: 8,
  },
  maxHitPoints: 52,
  currentHitPoints: 45,
  temporaryHitPoints: 0,
  armorClass: 18,
  speed: 25,
  proficiencyBonus: 3,
  initiative: 1,
  hitDice: [{ dieType: 10, total: 5, used: 1 }],
  deathSaves: { successes: 0, failures: 0 },
  proficiencies: {
    savingThrows: ['strength', 'constitution'],
    skills: ['athletics', 'intimidation', 'perception', 'survival'],
    tools: [],
    weapons: ['simple', 'martial'],
    armor: ['light', 'medium', 'heavy', 'shields'],
    languages: ['Common', 'Dwarvish'],
  },
  conditions: [],
  exhaustionLevel: 0,
  inspiration: false,
  features: [
    { name: 'Fighting Style: Defense', source: 'Fighter 1', description: '+1 AC when wearing armor' },
    { name: 'Second Wind', source: 'Fighter 1', description: 'Regain 1d10 + level HP as bonus action' },
    { name: 'Action Surge', source: 'Fighter 2', description: 'Take an additional action on your turn' },
    { name: 'Extra Attack', source: 'Fighter 5', description: 'Attack twice when you take Attack action' },
    { name: 'Dwarven Resilience', source: 'Dwarf', description: 'Advantage on saves vs. poison' },
    { name: 'Stonecunning', source: 'Dwarf', description: 'History checks related to stonework' },
  ],
  inventory: [
    { id: '1', name: 'Longsword', quantity: 1, equipped: true },
    { id: '2', name: 'Shield', quantity: 1, equipped: true },
    { id: '3', name: 'Chain Mail', quantity: 1, equipped: true },
    { id: '4', name: 'Handaxe', quantity: 2, equipped: false },
    { id: '5', name: 'Backpack', quantity: 1, equipped: false },
    { id: '6', name: 'Rope (50 ft)', quantity: 1, equipped: false },
    { id: '7', name: 'Healing Potion', quantity: 3, equipped: false },
  ],
  currency: { cp: 0, sp: 15, ep: 0, gp: 125, pp: 0 },
  personality: {
    traits: ['I face problems head-on. A simple, direct solution is the best path to success.'],
    ideals: ['Responsibility. I do what I must and obey just authority.'],
    bonds: ['I would still lay down my life for the people I served with.'],
    flaws: ['I made a terrible mistake in battle that cost many lives.'],
  },
  backstory: 'Thorin served as a soldier in the dwarven army for 50 years before retiring to a life of adventure...',
};

const SKILLS = [
  { name: 'Acrobatics', ability: 'dexterity' },
  { name: 'Animal Handling', ability: 'wisdom' },
  { name: 'Arcana', ability: 'intelligence' },
  { name: 'Athletics', ability: 'strength' },
  { name: 'Deception', ability: 'charisma' },
  { name: 'History', ability: 'intelligence' },
  { name: 'Insight', ability: 'wisdom' },
  { name: 'Intimidation', ability: 'charisma' },
  { name: 'Investigation', ability: 'intelligence' },
  { name: 'Medicine', ability: 'wisdom' },
  { name: 'Nature', ability: 'intelligence' },
  { name: 'Perception', ability: 'wisdom' },
  { name: 'Performance', ability: 'charisma' },
  { name: 'Persuasion', ability: 'charisma' },
  { name: 'Religion', ability: 'intelligence' },
  { name: 'Sleight of Hand', ability: 'dexterity' },
  { name: 'Stealth', ability: 'dexterity' },
  { name: 'Survival', ability: 'wisdom' },
];

type Tab = 'abilities' | 'features' | 'inventory' | 'spells' | 'bio';

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = params.id;

  const [character, setCharacter] = useState(mockCharacter);
  const [activeTab, setActiveTab] = useState<Tab>('abilities');
  const [showHpModal, setShowHpModal] = useState(false);
  const [hpChangeAmount, setHpChangeAmount] = useState('');

  const getModifier = (score: number) => Math.floor((score - 10) / 2);
  const formatModifier = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

  const isProficientInSave = (ability: string) =>
    character.proficiencies.savingThrows.includes(ability);

  const isProficientInSkill = (skill: string) =>
    character.proficiencies.skills.includes(skill.toLowerCase());

  const getSkillModifier = (skill: { name: string; ability: string }) => {
    const abilityMod = getModifier(character.abilityScores[skill.ability as keyof typeof character.abilityScores]);
    const profBonus = isProficientInSkill(skill.name) ? character.proficiencyBonus : 0;
    return abilityMod + profBonus;
  };

  const handleHpChange = (isDamage: boolean) => {
    const amount = parseInt(hpChangeAmount) || 0;
    if (amount === 0) return;

    let newHp = isDamage
      ? character.currentHitPoints - amount
      : character.currentHitPoints + amount;

    newHp = Math.max(0, Math.min(character.maxHitPoints, newHp));

    setCharacter({ ...character, currentHitPoints: newHp });
    setShowHpModal(false);
    setHpChangeAmount('');
  };

  const hpPercentage = Math.round((character.currentHitPoints / character.maxHitPoints) * 100);

  return (
    <AppLayout
      title={character.name}
      subtitle={`Level ${character.level} ${character.race.name} ${character.classes.map(c => c.name).join('/')}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      }
    >
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Quick Stats */}
          <div className="space-y-4">
            {/* HP Card */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-error" />
                  <span className="font-semibold">Hit Points</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowHpModal(true)}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-3xl font-bold text-center mb-2">
                {character.currentHitPoints} / {character.maxHitPoints}
                {character.temporaryHitPoints > 0 && (
                  <span className="text-info text-lg"> +{character.temporaryHitPoints}</span>
                )}
              </div>
              <div className="h-3 bg-background-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    hpPercentage > 50 ? 'bg-success' : hpPercentage > 25 ? 'bg-warning' : 'bg-error'
                  )}
                  style={{ width: `${hpPercentage}%` }}
                />
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowHpModal(true)}>
                  <Minus className="w-4 h-4 mr-1" />
                  Damage
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowHpModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Heal
                </Button>
              </div>
            </Card>

            {/* Combat Stats */}
            <Card className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center mb-1">
                    <Shield className="w-5 h-5 text-info" />
                  </div>
                  <div className="text-2xl font-bold">{character.armorClass}</div>
                  <div className="text-xs text-foreground-secondary">AC</div>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-1">
                    <Zap className="w-5 h-5 text-warning" />
                  </div>
                  <div className="text-2xl font-bold">{formatModifier(getModifier(character.abilityScores.dexterity))}</div>
                  <div className="text-xs text-foreground-secondary">Initiative</div>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-1">
                    <Swords className="w-5 h-5 text-error" />
                  </div>
                  <div className="text-2xl font-bold">{character.speed}ft</div>
                  <div className="text-xs text-foreground-secondary">Speed</div>
                </div>
              </div>
            </Card>

            {/* Hit Dice & Rest */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Hit Dice & Rest</h3>
              {character.hitDice.map((hd, i) => (
                <div key={i} className="flex items-center justify-between mb-2">
                  <span className="text-sm">d{hd.dieType}</span>
                  <span className="text-sm">{hd.total - hd.used} / {hd.total}</span>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="flex-1">
                  <Moon className="w-4 h-4 mr-1" />
                  Short Rest
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Sun className="w-4 h-4 mr-1" />
                  Long Rest
                </Button>
              </div>
            </Card>

            {/* Inspiration & Conditions */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Inspiration</span>
                <Button
                  size="sm"
                  variant={character.inspiration ? 'default' : 'outline'}
                  onClick={() => setCharacter({ ...character, inspiration: !character.inspiration })}
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
              {character.conditions.length > 0 && (
                <div>
                  <span className="text-sm text-foreground-secondary">Conditions:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {character.conditions.map((c, i) => (
                      <Badge key={i} variant="warning">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Tabbed Content */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="border-b border-border mb-4">
              <div className="flex gap-1">
                {[
                  { id: 'abilities', label: 'Abilities', icon: User },
                  { id: 'features', label: 'Features', icon: BookOpen },
                  { id: 'inventory', label: 'Inventory', icon: Backpack },
                  { id: 'spells', label: 'Spells', icon: Sparkles },
                  { id: 'bio', label: 'Biography', icon: User },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors',
                      activeTab === tab.id
                        ? 'border-accent text-accent'
                        : 'border-transparent text-foreground-secondary hover:text-foreground'
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'abilities' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ability Scores */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Ability Scores</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(character.abilityScores).map(([ability, score]) => {
                      const mod = getModifier(score);
                      const isProficient = isProficientInSave(ability);
                      return (
                        <div
                          key={ability}
                          className="p-3 rounded-lg bg-background-secondary text-center"
                        >
                          <div className="text-xs uppercase text-foreground-secondary mb-1">
                            {ability.slice(0, 3)}
                          </div>
                          <div className="text-2xl font-bold">{score}</div>
                          <div className="text-sm text-foreground-secondary">
                            {formatModifier(mod)}
                          </div>
                          <div className="text-xs mt-1">
                            Save: {formatModifier(mod + (isProficient ? character.proficiencyBonus : 0))}
                            {isProficient && <span className="text-success ml-1">*</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Skills */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Skills</h3>
                  <div className="space-y-1 text-sm max-h-[400px] overflow-y-auto">
                    {SKILLS.map((skill) => {
                      const isProficient = isProficientInSkill(skill.name);
                      const mod = getSkillModifier(skill);
                      return (
                        <div
                          key={skill.name}
                          className="flex items-center justify-between py-1"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full',
                                isProficient ? 'bg-success' : 'bg-background-tertiary'
                              )}
                            />
                            <span className={isProficient ? 'font-medium' : ''}>
                              {skill.name}
                            </span>
                            <span className="text-foreground-tertiary text-xs">
                              ({skill.ability.slice(0, 3).toUpperCase()})
                            </span>
                          </div>
                          <span className="font-mono">{formatModifier(mod)}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Proficiencies */}
                <Card className="p-4 md:col-span-2">
                  <h3 className="font-semibold mb-4">Proficiencies & Languages</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <h4 className="text-sm text-foreground-secondary mb-2">Armor</h4>
                      <div className="flex flex-wrap gap-1">
                        {character.proficiencies.armor.map((a) => (
                          <Badge key={a} variant="secondary">{a}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm text-foreground-secondary mb-2">Weapons</h4>
                      <div className="flex flex-wrap gap-1">
                        {character.proficiencies.weapons.map((w) => (
                          <Badge key={w} variant="secondary">{w}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm text-foreground-secondary mb-2">Tools</h4>
                      <div className="flex flex-wrap gap-1">
                        {character.proficiencies.tools.length > 0
                          ? character.proficiencies.tools.map((t) => (
                            <Badge key={t} variant="secondary">{t}</Badge>
                          ))
                          : <span className="text-foreground-tertiary text-sm">None</span>
                        }
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm text-foreground-secondary mb-2">Languages</h4>
                      <div className="flex flex-wrap gap-1">
                        {character.proficiencies.languages.map((l) => (
                          <Badge key={l} variant="secondary">{l}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-3">
                {character.features.map((feature, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{feature.name}</h4>
                        <p className="text-xs text-foreground-secondary">{feature.source}</p>
                      </div>
                    </div>
                    <p className="text-sm mt-2 text-foreground-secondary">{feature.description}</p>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-4">
                {/* Currency */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Currency</h3>
                  <div className="flex gap-4 justify-center">
                    {Object.entries(character.currency).map(([coin, amount]) => (
                      <div key={coin} className="text-center">
                        <div className="text-xl font-bold">{amount}</div>
                        <div className="text-xs uppercase text-foreground-secondary">{coin}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Equipment */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Equipment</h3>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {character.inventory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-background-secondary"
                      >
                        <div className="flex items-center gap-2">
                          {item.equipped && (
                            <Badge variant="success" className="text-xs">E</Badge>
                          )}
                          <span>{item.name}</span>
                          {item.quantity > 1 && (
                            <span className="text-foreground-secondary">x{item.quantity}</span>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'spells' && (
              <Card className="p-8 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-foreground-tertiary" />
                <p className="text-foreground-secondary">This character is not a spellcaster.</p>
              </Card>
            )}

            {activeTab === 'bio' && (
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Personality Traits</h3>
                  <p className="text-foreground-secondary">{character.personality.traits[0]}</p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Ideals</h3>
                  <p className="text-foreground-secondary">{character.personality.ideals[0]}</p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Bonds</h3>
                  <p className="text-foreground-secondary">{character.personality.bonds[0]}</p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Flaws</h3>
                  <p className="text-foreground-secondary">{character.personality.flaws[0]}</p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Backstory</h3>
                  <p className="text-foreground-secondary">{character.backstory}</p>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HP Modal */}
      <Modal isOpen={showHpModal} onClose={() => setShowHpModal(false)} title="Modify Hit Points">
        <div className="space-y-4">
          <Input
            type="number"
            value={hpChangeAmount}
            onChange={(e) => setHpChangeAmount(e.target.value)}
            placeholder="Amount"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              className="flex-1"
              variant="destructive"
              onClick={() => handleHpChange(true)}
            >
              <Minus className="w-4 h-4 mr-2" />
              Damage
            </Button>
            <Button
              className="flex-1"
              variant="default"
              onClick={() => handleHpChange(false)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Heal
            </Button>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setShowHpModal(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
