'use client';

import { CombatantCard } from './CombatantCard';

interface Condition {
  name: string;
  duration?: number;
}

interface InitiativeEntry {
  id: string;
  type: 'player' | 'npc' | 'monster';
  name: string;
  initiative: number;
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

interface InitiativeListProps {
  initiativeOrder: InitiativeEntry[];
  combatants: Combatant[];
  currentTurnIndex: number;
  round: number;
  compact?: boolean;
  onSelectCombatant?: (combatant: Combatant) => void;
}

export function InitiativeList({
  initiativeOrder,
  combatants,
  currentTurnIndex,
  round,
  compact = false,
  onSelectCombatant,
}: InitiativeListProps) {
  // Map initiative entries to full combatant data
  const orderedCombatants = initiativeOrder
    .map(entry => combatants.find(c => c.id === entry.id))
    .filter((c): c is Combatant => c !== undefined);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="font-semibold text-sm">Initiative Order</h3>
        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
          Round {round}
        </span>
      </div>

      {/* Turn indicator */}
      {orderedCombatants[currentTurnIndex] && (
        <div className="px-2 py-1 bg-primary/10 rounded text-sm">
          <span className="text-muted">Current: </span>
          <span className="font-medium">
            {orderedCombatants[currentTurnIndex].name}
          </span>
        </div>
      )}

      {/* Initiative list */}
      <div className={compact ? 'space-y-1' : 'space-y-2'}>
        {orderedCombatants.map((combatant, index) => (
          <div key={combatant.id} className="relative">
            {/* Turn indicator line */}
            {index === currentTurnIndex && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l" />
            )}

            <CombatantCard
              combatant={combatant}
              isCurrentTurn={index === currentTurnIndex}
              compact={compact}
              onSelect={onSelectCombatant}
            />
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="px-2 pt-2 border-t border-border text-xs text-muted">
        <div className="flex justify-between">
          <span>
            Players: {combatants.filter(c => c.type === 'player' && c.is_active).length}/
            {combatants.filter(c => c.type === 'player').length}
          </span>
          <span>
            Enemies: {combatants.filter(c => c.type === 'monster' && c.is_active).length}/
            {combatants.filter(c => c.type === 'monster').length}
          </span>
        </div>
      </div>
    </div>
  );
}
