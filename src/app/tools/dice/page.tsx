'use client';

import { useState } from 'react';
import { Dices, History, Trash2, Copy, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface DiceRoll {
  id: string;
  expression: string;
  rolls: number[];
  modifier: number;
  total: number;
  timestamp: Date;
  type?: string;
}

const COMMON_DICE = [
  { sides: 4, color: 'bg-red-500' },
  { sides: 6, color: 'bg-orange-500' },
  { sides: 8, color: 'bg-yellow-500' },
  { sides: 10, color: 'bg-green-500' },
  { sides: 12, color: 'bg-blue-500' },
  { sides: 20, color: 'bg-purple-500' },
  { sides: 100, color: 'bg-pink-500' },
];

const QUICK_ROLLS = [
  { label: 'Attack (d20)', expression: '1d20', type: 'attack' },
  { label: 'Advantage', expression: '2d20kh1', type: 'advantage' },
  { label: 'Disadvantage', expression: '2d20kl1', type: 'disadvantage' },
  { label: 'Ability Check', expression: '1d20', type: 'check' },
  { label: 'Saving Throw', expression: '1d20', type: 'save' },
  { label: 'Initiative', expression: '1d20', type: 'initiative' },
];

export default function DiceRollerPage() {
  const [expression, setExpression] = useState('1d20');
  const [modifier, setModifier] = useState(0);
  const [history, setHistory] = useState<DiceRoll[]>([]);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const parseExpression = (expr: string): { count: number; sides: number; keep?: string } | null => {
    // Match patterns like 1d20, 2d6, 4d6kh3, 2d20kl1
    const match = expr.toLowerCase().match(/^(\d+)?d(\d+)(k[hl](\d+))?$/);
    if (!match) return null;

    return {
      count: parseInt(match[1]) || 1,
      sides: parseInt(match[2]),
      keep: match[3],
    };
  };

  const rollDice = (expr: string, mod: number = 0, type?: string) => {
    const parsed = parseExpression(expr);
    if (!parsed) {
      alert('Invalid dice expression. Use format like 1d20, 2d6, 4d6kh3');
      return;
    }

    const { count, sides, keep } = parsed;
    let rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);

    // Handle keep highest/lowest
    let keptRolls = [...rolls];
    if (keep) {
      const keepCount = parseInt(keep.slice(2)) || 1;
      const sortedRolls = [...rolls].sort((a, b) => b - a);
      if (keep.includes('l')) {
        keptRolls = sortedRolls.slice(-keepCount);
      } else {
        keptRolls = sortedRolls.slice(0, keepCount);
      }
    }

    const rollSum = keptRolls.reduce((a, b) => a + b, 0);
    const total = rollSum + mod;

    const roll: DiceRoll = {
      id: `${Date.now()}`,
      expression: expr,
      rolls,
      modifier: mod,
      total,
      timestamp: new Date(),
      type,
    };

    setLastRoll(roll);
    setHistory((prev) => [roll, ...prev].slice(0, 50));
  };

  const handleQuickRoll = (sides: number) => {
    rollDice(`1d${sides}`, modifier);
  };

  const handleExpressionRoll = () => {
    rollDice(expression, modifier);
  };

  const clearHistory = () => {
    setHistory([]);
    setLastRoll(null);
  };

  const copyRoll = (roll: DiceRoll) => {
    const text = `${roll.expression}${roll.modifier >= 0 ? '+' : ''}${roll.modifier !== 0 ? roll.modifier : ''} = ${roll.total} [${roll.rolls.join(', ')}]`;
    navigator.clipboard.writeText(text);
    setCopiedId(roll.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCriticalClass = (roll: DiceRoll) => {
    if (roll.expression.includes('d20')) {
      const d20Roll = roll.rolls[0];
      if (d20Roll === 20) return 'text-success';
      if (d20Roll === 1) return 'text-error';
    }
    return '';
  };

  return (
    <AppLayout title="Dice Roller" subtitle="Roll any dice combination">
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Dice Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Last Roll Display */}
            <Card className="p-8 text-center">
              {lastRoll ? (
                <div className="animate-fade-in">
                  <p className="text-sm text-foreground-secondary mb-2">
                    {lastRoll.expression}
                    {lastRoll.modifier !== 0 && (
                      <span>
                        {lastRoll.modifier >= 0 ? ' + ' : ' - '}
                        {Math.abs(lastRoll.modifier)}
                      </span>
                    )}
                  </p>
                  <p className={cn('text-6xl font-bold mb-4', getCriticalClass(lastRoll))}>
                    {lastRoll.total}
                  </p>
                  <p className="text-foreground-secondary">
                    Rolls: [{lastRoll.rolls.join(', ')}]
                    {lastRoll.modifier !== 0 && ` + ${lastRoll.modifier}`}
                  </p>
                  {lastRoll.expression.includes('d20') && (
                    <div className="mt-2">
                      {lastRoll.rolls[0] === 20 && (
                        <span className="text-success font-bold">CRITICAL HIT!</span>
                      )}
                      {lastRoll.rolls[0] === 1 && (
                        <span className="text-error font-bold">CRITICAL MISS!</span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-foreground-tertiary">
                  <Dices className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Roll some dice!</p>
                </div>
              )}
            </Card>

            {/* Dice Buttons */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Quick Roll</h3>
              <div className="flex flex-wrap gap-3 mb-6">
                {COMMON_DICE.map((die) => (
                  <button
                    key={die.sides}
                    onClick={() => handleQuickRoll(die.sides)}
                    className={cn(
                      'w-16 h-16 rounded-xl flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95',
                      die.color,
                      'text-white font-bold shadow-lg'
                    )}
                  >
                    <span className="text-xs opacity-75">d</span>
                    <span className="text-xl">{die.sides}</span>
                  </button>
                ))}
              </div>

              {/* Custom Expression */}
              <h3 className="font-semibold mb-4">Custom Roll</h3>
              <div className="flex gap-3">
                <Input
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  placeholder="e.g., 2d6+3, 4d6kh3"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleExpressionRoll()}
                />
                <div className="flex items-center gap-2">
                  <span className="text-foreground-secondary">+</span>
                  <Input
                    type="number"
                    value={modifier}
                    onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                    className="w-20 text-center"
                  />
                </div>
                <Button onClick={handleExpressionRoll}>
                  <Dices className="w-4 h-4 mr-2" />
                  Roll
                </Button>
              </div>
              <p className="text-xs text-foreground-tertiary mt-2">
                Supports: NdX, NdXkh/klN (keep highest/lowest), modifiers
              </p>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Common Rolls</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {QUICK_ROLLS.map((roll) => (
                  <Button
                    key={roll.label}
                    variant="outline"
                    onClick={() => rollDice(roll.expression, modifier, roll.type)}
                    className="justify-start"
                  >
                    {roll.label}
                  </Button>
                ))}
              </div>
            </Card>
          </div>

          {/* History Sidebar */}
          <div>
            <Card>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  <h3 className="font-semibold">History</h3>
                </div>
                {history.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearHistory}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {history.length === 0 ? (
                  <div className="p-8 text-center text-foreground-tertiary">
                    <p>No rolls yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {history.map((roll) => (
                      <div
                        key={roll.id}
                        className="p-3 hover:bg-background-secondary transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground-secondary">
                            {roll.expression}
                            {roll.modifier !== 0 && (
                              <span>
                                {roll.modifier >= 0 ? '+' : ''}
                                {roll.modifier}
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() => copyRoll(roll)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {copiedId === roll.id ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4 text-foreground-tertiary" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={cn('text-2xl font-bold', getCriticalClass(roll))}>
                            {roll.total}
                          </span>
                          <span className="text-xs text-foreground-tertiary">
                            [{roll.rolls.join(', ')}]
                          </span>
                        </div>
                        {roll.type && (
                          <span className="text-xs text-foreground-tertiary capitalize">
                            {roll.type}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
