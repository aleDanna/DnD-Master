'use client';

interface Condition {
  name: string;
  duration?: number;
}

interface Combatant {
  id: string;
  type: 'player' | 'npc' | 'monster';
  name: string;
  initiative: number;
  current_hp: number;
  max_hp: number;
  armor_class: number;
  conditions: Condition[];
  is_active: boolean;
}

interface CombatantCardProps {
  combatant: Combatant;
  isCurrentTurn: boolean;
  compact?: boolean;
  onSelect?: (combatant: Combatant) => void;
}

const conditionColors: Record<string, string> = {
  blinded: 'bg-gray-500',
  charmed: 'bg-pink-500',
  deafened: 'bg-gray-400',
  frightened: 'bg-purple-500',
  grappled: 'bg-orange-500',
  incapacitated: 'bg-red-700',
  invisible: 'bg-blue-300',
  paralyzed: 'bg-yellow-600',
  petrified: 'bg-stone-500',
  poisoned: 'bg-green-600',
  prone: 'bg-amber-700',
  restrained: 'bg-orange-600',
  stunned: 'bg-yellow-500',
  unconscious: 'bg-red-800',
};

function getConditionColor(conditionName: string): string {
  return conditionColors[conditionName.toLowerCase()] || 'bg-gray-500';
}

function getHpPercentage(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

function getHpColor(percentage: number): string {
  if (percentage > 75) return 'bg-green-500';
  if (percentage > 50) return 'bg-yellow-500';
  if (percentage > 25) return 'bg-orange-500';
  return 'bg-red-500';
}

function getTypeIcon(type: 'player' | 'npc' | 'monster'): string {
  switch (type) {
    case 'player':
      return '🧙';
    case 'npc':
      return '👤';
    case 'monster':
      return '👹';
  }
}

export function CombatantCard({
  combatant,
  isCurrentTurn,
  compact = false,
  onSelect,
}: CombatantCardProps) {
  const hpPercentage = getHpPercentage(combatant.current_hp, combatant.max_hp);
  const hpColor = getHpColor(hpPercentage);
  const isDown = combatant.current_hp <= 0;

  if (compact) {
    return (
      <div
        className={`
          flex items-center gap-2 px-2 py-1 rounded cursor-pointer
          ${isCurrentTurn ? 'bg-primary/20 ring-2 ring-primary' : 'bg-surface'}
          ${isDown ? 'opacity-50' : ''}
          ${onSelect ? 'hover:bg-surface-hover' : ''}
        `}
        onClick={() => onSelect?.(combatant)}
      >
        <span className="text-sm">{getTypeIcon(combatant.type)}</span>
        <span className="flex-1 text-sm truncate">{combatant.name}</span>
        <span className="text-xs text-muted">{combatant.initiative}</span>
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-lg p-3 border transition-all
        ${isCurrentTurn ? 'border-primary bg-primary/10 shadow-lg' : 'border-border bg-surface'}
        ${isDown ? 'opacity-60' : ''}
        ${onSelect ? 'cursor-pointer hover:border-primary/50' : ''}
      `}
      onClick={() => onSelect?.(combatant)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{getTypeIcon(combatant.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{combatant.name}</span>
            {isCurrentTurn && (
              <span className="px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                TURN
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Init: {combatant.initiative}</span>
            <span>AC: {combatant.armor_class}</span>
          </div>
        </div>
      </div>

      {/* HP Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span>HP</span>
          <span className={isDown ? 'text-danger' : ''}>
            {combatant.current_hp} / {combatant.max_hp}
          </span>
        </div>
        <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${hpColor}`}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
      </div>

      {/* Conditions */}
      {combatant.conditions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {combatant.conditions.map((condition, index) => (
            <span
              key={`${condition.name}-${index}`}
              className={`
                px-1.5 py-0.5 text-xs rounded-full text-white
                ${getConditionColor(condition.name)}
              `}
              title={
                condition.duration
                  ? `${condition.name} (${condition.duration} rounds)`
                  : condition.name
              }
            >
              {condition.name}
              {condition.duration && ` (${condition.duration})`}
            </span>
          ))}
        </div>
      )}

      {/* Status indicators */}
      {isDown && (
        <div className="mt-2 text-xs text-danger font-medium">
          {combatant.type === 'player' ? 'UNCONSCIOUS' : 'DEFEATED'}
        </div>
      )}
    </div>
  );
}
