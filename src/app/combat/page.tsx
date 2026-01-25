'use client';

import { useState } from 'react';
import {
  Plus,
  Minus,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Trash2,
  Heart,
  Shield,
  Swords,
  Users,
  Skull,
  ChevronUp,
  ChevronDown,
  Dices,
  Settings,
  GripVertical,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

interface Combatant {
  id: string;
  name: string;
  type: 'player' | 'enemy' | 'ally';
  initiative: number;
  ac: number;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  conditions: string[];
  notes?: string;
  isConcentrating?: boolean;
}

const CONDITIONS = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
  'Exhaustion 1',
  'Exhaustion 2',
  'Exhaustion 3',
  'Exhaustion 4',
  'Exhaustion 5',
  'Exhaustion 6',
];

// Mock combatants
const initialCombatants: Combatant[] = [
  {
    id: '1',
    name: 'Thorin',
    type: 'player',
    initiative: 18,
    ac: 18,
    maxHp: 52,
    currentHp: 45,
    tempHp: 0,
    conditions: [],
  },
  {
    id: '2',
    name: 'Goblin 1',
    type: 'enemy',
    initiative: 15,
    ac: 15,
    maxHp: 7,
    currentHp: 7,
    tempHp: 0,
    conditions: [],
  },
  {
    id: '3',
    name: 'Elara',
    type: 'player',
    initiative: 14,
    ac: 13,
    maxHp: 28,
    currentHp: 28,
    tempHp: 0,
    conditions: [],
    isConcentrating: true,
  },
  {
    id: '4',
    name: 'Goblin 2',
    type: 'enemy',
    initiative: 12,
    ac: 15,
    maxHp: 7,
    currentHp: 4,
    tempHp: 0,
    conditions: ['Poisoned'],
  },
  {
    id: '5',
    name: 'Bugbear',
    type: 'enemy',
    initiative: 8,
    ac: 16,
    maxHp: 27,
    currentHp: 27,
    tempHp: 0,
    conditions: [],
  },
];

export default function CombatPage() {
  const [combatants, setCombatants] = useState<Combatant[]>(
    [...initialCombatants].sort((a, b) => b.initiative - a.initiative)
  );
  const [currentTurn, setCurrentTurn] = useState(0);
  const [round, setRound] = useState(1);
  const [isActive, setIsActive] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCombatant, setSelectedCombatant] = useState<Combatant | null>(null);
  const [hpChange, setHpChange] = useState<{ id: string; amount: string } | null>(null);

  const currentCombatant = combatants[currentTurn];

  const nextTurn = () => {
    if (currentTurn >= combatants.length - 1) {
      setCurrentTurn(0);
      setRound((r) => r + 1);
    } else {
      setCurrentTurn((t) => t + 1);
    }
  };

  const prevTurn = () => {
    if (currentTurn <= 0) {
      if (round > 1) {
        setCurrentTurn(combatants.length - 1);
        setRound((r) => r - 1);
      }
    } else {
      setCurrentTurn((t) => t - 1);
    }
  };

  const resetCombat = () => {
    setCurrentTurn(0);
    setRound(1);
    setIsActive(false);
  };

  const updateHp = (id: string, delta: number) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        let newHp = c.currentHp + delta;
        if (newHp > c.maxHp) newHp = c.maxHp;
        if (newHp < 0) newHp = 0;
        return { ...c, currentHp: newHp };
      })
    );
  };

  const applyHpChange = (id: string, amount: number, isDamage: boolean) => {
    updateHp(id, isDamage ? -amount : amount);
    setHpChange(null);
  };

  const updateInitiative = (id: string, initiative: number) => {
    setCombatants((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, initiative } : c
      );
      return updated.sort((a, b) => b.initiative - a.initiative);
    });
  };

  const toggleCondition = (id: string, condition: string) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const hasCondition = c.conditions.includes(condition);
        return {
          ...c,
          conditions: hasCondition
            ? c.conditions.filter((cond) => cond !== condition)
            : [...c.conditions, condition],
        };
      })
    );
  };

  const removeCombatant = (id: string) => {
    const index = combatants.findIndex((c) => c.id === id);
    if (index <= currentTurn && currentTurn > 0) {
      setCurrentTurn((t) => t - 1);
    }
    setCombatants((prev) => prev.filter((c) => c.id !== id));
  };

  const rollInitiative = () => {
    setCombatants((prev) =>
      prev
        .map((c) => ({
          ...c,
          initiative: Math.floor(Math.random() * 20) + 1,
        }))
        .sort((a, b) => b.initiative - a.initiative)
    );
    setCurrentTurn(0);
    setRound(1);
  };

  const getHpPercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100);
  };

  const getHpColor = (percentage: number) => {
    if (percentage > 50) return 'bg-success';
    if (percentage > 25) return 'bg-warning';
    return 'bg-error';
  };

  return (
    <AppLayout title="Combat Tracker" subtitle={isActive ? `Round ${round}` : 'Not in combat'}>
      <div className="p-6">
        {/* Combat Controls */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={isActive ? 'outline' : 'default'}
                  onClick={() => setIsActive(!isActive)}
                >
                  {isActive ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Combat
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={prevTurn}
                  disabled={!isActive || (round === 1 && currentTurn === 0)}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={nextTurn} disabled={!isActive}>
                  <SkipForward className="w-4 h-4 mr-2" />
                  Next Turn
                </Button>
              </div>
              <div className="h-6 w-px bg-border" />
              <Button variant="outline" onClick={rollInitiative}>
                <Dices className="w-4 h-4 mr-2" />
                Roll All Initiative
              </Button>
              <Button variant="outline" onClick={resetCombat}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Combatant
              </Button>
            </div>
          </div>
          {isActive && currentCombatant && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-foreground-secondary">Current Turn</p>
              <p className="text-xl font-semibold">{currentCombatant.name}</p>
            </div>
          )}
        </Card>

        {/* Initiative Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
            {combatants.map((combatant, index) => {
              const hpPercent = getHpPercentage(combatant.currentHp, combatant.maxHp);
              const isDead = combatant.currentHp <= 0;
              const isCurrent = isActive && index === currentTurn;

              return (
                <Card
                  key={combatant.id}
                  className={cn(
                    'transition-all',
                    isCurrent && 'ring-2 ring-accent',
                    isDead && 'opacity-50'
                  )}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Drag Handle & Initiative */}
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-foreground-tertiary cursor-grab" />
                        <div className="w-12 h-12 rounded-lg bg-background-secondary flex flex-col items-center justify-center">
                          <span className="text-xs text-foreground-secondary">Init</span>
                          <input
                            type="number"
                            value={combatant.initiative}
                            onChange={(e) =>
                              updateInitiative(combatant.id, parseInt(e.target.value) || 0)
                            }
                            className="w-8 text-center text-lg font-bold bg-transparent border-none focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Name & Type */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              combatant.type === 'player'
                                ? 'bg-success'
                                : combatant.type === 'enemy'
                                ? 'bg-error'
                                : 'bg-info'
                            )}
                          />
                          <h3 className={cn('font-semibold', isDead && 'line-through')}>
                            {combatant.name}
                          </h3>
                          {combatant.isConcentrating && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/10 text-purple-400">
                              Concentrating
                            </span>
                          )}
                          {isDead && (
                            <Skull className="w-4 h-4 text-error" />
                          )}
                        </div>
                        {/* Conditions */}
                        {combatant.conditions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {combatant.conditions.map((condition) => (
                              <span
                                key={condition}
                                className="px-2 py-0.5 text-xs rounded-full bg-warning/10 text-warning cursor-pointer"
                                onClick={() => toggleCondition(combatant.id, condition)}
                              >
                                {condition} ×
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* AC */}
                      <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-background-secondary">
                        <Shield className="w-4 h-4 text-info" />
                        <span className="font-medium">{combatant.ac}</span>
                      </div>

                      {/* HP */}
                      <div className="w-48">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4 text-error" />
                            <span className="font-medium">
                              {combatant.currentHp}/{combatant.maxHp}
                            </span>
                            {combatant.tempHp > 0 && (
                              <span className="text-info">+{combatant.tempHp}</span>
                            )}
                          </div>
                          <span className="text-xs text-foreground-secondary">
                            {hpPercent}%
                          </span>
                        </div>
                        <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                          <div
                            className={cn('h-full transition-all', getHpColor(hpPercent))}
                            style={{ width: `${hpPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* HP Controls */}
                      <div className="flex items-center gap-1">
                        {hpChange?.id === combatant.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={hpChange.amount}
                              onChange={(e) =>
                                setHpChange({ ...hpChange, amount: e.target.value })
                              }
                              className="w-16 text-center"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const amount = parseInt(hpChange.amount) || 0;
                                  applyHpChange(combatant.id, amount, true);
                                }
                                if (e.key === 'Escape') setHpChange(null);
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const amount = parseInt(hpChange.amount) || 0;
                                applyHpChange(combatant.id, amount, true);
                              }}
                              className="text-error"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const amount = parseInt(hpChange.amount) || 0;
                                applyHpChange(combatant.id, amount, false);
                              }}
                              className="text-success"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setHpChange({ id: combatant.id, amount: '' })}
                            >
                              <Swords className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedCombatant(combatant)}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeCombatant(combatant.id)}
                            >
                              <Trash2 className="w-4 h-4 text-error" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Sidebar - Conditions & Quick Add */}
          <div className="space-y-4">
            {/* Round Info */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Combat Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-foreground-secondary">Round</p>
                  <p className="text-2xl font-bold">{round}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">Combatants</p>
                  <p className="text-2xl font-bold">{combatants.length}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    <span>{combatants.filter((c) => c.type === 'player').length} Players</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-error" />
                    <span>{combatants.filter((c) => c.type === 'enemy').length} Enemies</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Conditions Quick Reference */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Conditions</h3>
              <div className="flex flex-wrap gap-1">
                {CONDITIONS.slice(0, 14).map((condition) => (
                  <button
                    key={condition}
                    className="px-2 py-1 text-xs rounded-full bg-background-secondary hover:bg-background-tertiary transition-colors"
                    onClick={() => {
                      if (currentCombatant) {
                        toggleCondition(currentCombatant.id, condition);
                      }
                    }}
                  >
                    {condition}
                  </button>
                ))}
              </div>
            </Card>

            {/* Quick Add Monsters */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Quick Add</h3>
              <div className="space-y-2">
                {[
                  { name: 'Goblin', hp: 7, ac: 15 },
                  { name: 'Orc', hp: 15, ac: 13 },
                  { name: 'Skeleton', hp: 13, ac: 13 },
                  { name: 'Zombie', hp: 22, ac: 8 },
                ].map((monster) => (
                  <button
                    key={monster.name}
                    onClick={() => {
                      const newCombatant: Combatant = {
                        id: `${Date.now()}`,
                        name: `${monster.name} ${combatants.filter((c) => c.name.startsWith(monster.name)).length + 1}`,
                        type: 'enemy',
                        initiative: Math.floor(Math.random() * 20) + 1,
                        ac: monster.ac,
                        maxHp: monster.hp,
                        currentHp: monster.hp,
                        tempHp: 0,
                        conditions: [],
                      };
                      setCombatants((prev) =>
                        [...prev, newCombatant].sort((a, b) => b.initiative - a.initiative)
                      );
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-background-secondary transition-colors text-left"
                  >
                    <span>{monster.name}</span>
                    <span className="text-sm text-foreground-secondary">
                      HP {monster.hp} | AC {monster.ac}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Combatant Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Combatant"
      >
        <AddCombatantForm
          onAdd={(combatant) => {
            setCombatants((prev) =>
              [...prev, combatant].sort((a, b) => b.initiative - a.initiative)
            );
            setShowAddModal(false);
          }}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Combatant Modal */}
      <Modal
        isOpen={!!selectedCombatant}
        onClose={() => setSelectedCombatant(null)}
        title="Edit Combatant"
      >
        {selectedCombatant && (
          <EditCombatantForm
            combatant={selectedCombatant}
            onSave={(updated) => {
              setCombatants((prev) =>
                prev.map((c) => (c.id === updated.id ? updated : c))
              );
              setSelectedCombatant(null);
            }}
            onCancel={() => setSelectedCombatant(null)}
          />
        )}
      </Modal>
    </AppLayout>
  );
}

// Add Combatant Form Component
function AddCombatantForm({
  onAdd,
  onCancel,
}: {
  onAdd: (combatant: Combatant) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    type: 'enemy' as 'player' | 'enemy' | 'ally',
    initiative: '',
    ac: '',
    hp: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: `${Date.now()}`,
      name: form.name,
      type: form.type,
      initiative: parseInt(form.initiative) || Math.floor(Math.random() * 20) + 1,
      ac: parseInt(form.ac) || 10,
      maxHp: parseInt(form.hp) || 10,
      currentHp: parseInt(form.hp) || 10,
      tempHp: 0,
      conditions: [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Goblin, Orc, etc."
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Type</label>
        <div className="flex gap-2">
          {(['player', 'enemy', 'ally'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setForm({ ...form, type })}
              className={cn(
                'px-4 py-2 rounded-lg capitalize transition-colors',
                form.type === type
                  ? 'bg-accent text-white'
                  : 'bg-background-secondary hover:bg-background-tertiary'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Initiative</label>
          <Input
            type="number"
            value={form.initiative}
            onChange={(e) => setForm({ ...form, initiative: e.target.value })}
            placeholder="Roll"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">AC</label>
          <Input
            type="number"
            value={form.ac}
            onChange={(e) => setForm({ ...form, ac: e.target.value })}
            placeholder="10"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">HP</label>
          <Input
            type="number"
            value={form.hp}
            onChange={(e) => setForm({ ...form, hp: e.target.value })}
            placeholder="10"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Combatant</Button>
      </div>
    </form>
  );
}

// Edit Combatant Form Component
function EditCombatantForm({
  combatant,
  onSave,
  onCancel,
}: {
  combatant: Combatant;
  onSave: (combatant: Combatant) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(combatant);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">AC</label>
          <Input
            type="number"
            value={form.ac}
            onChange={(e) => setForm({ ...form, ac: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Current HP</label>
          <Input
            type="number"
            value={form.currentHp}
            onChange={(e) =>
              setForm({ ...form, currentHp: parseInt(e.target.value) || 0 })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Max HP</label>
          <Input
            type="number"
            value={form.maxHp}
            onChange={(e) => setForm({ ...form, maxHp: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Temp HP</label>
        <Input
          type="number"
          value={form.tempHp}
          onChange={(e) => setForm({ ...form, tempHp: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isConcentrating}
            onChange={(e) => setForm({ ...form, isConcentrating: e.target.checked })}
            className="w-4 h-4 rounded border-border"
          />
          <span className="text-sm">Concentrating</span>
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Conditions</label>
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
          {CONDITIONS.map((condition) => (
            <button
              key={condition}
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  conditions: form.conditions.includes(condition)
                    ? form.conditions.filter((c) => c !== condition)
                    : [...form.conditions, condition],
                })
              }
              className={cn(
                'px-2 py-1 text-xs rounded-full transition-colors',
                form.conditions.includes(condition)
                  ? 'bg-warning/20 text-warning'
                  : 'bg-background-secondary hover:bg-background-tertiary'
              )}
            >
              {condition}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
}
