'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { InitiativeList } from './InitiativeList';
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

interface CombatState {
  active: boolean;
  round: number;
  turn_index: number;
  initiative_order: InitiativeEntry[];
  combatants: Combatant[];
}

interface CombatTrackerProps {
  combatState: CombatState | null;
  isLoading?: boolean;
  onNextTurn?: () => Promise<void>;
  onEndCombat?: (outcome: 'victory' | 'defeat' | 'retreat' | 'truce') => Promise<void>;
  onSelectCombatant?: (combatant: Combatant) => void;
}

export function CombatTracker({
  combatState,
  isLoading = false,
  onNextTurn,
  onEndCombat,
  onSelectCombatant,
}: CombatTrackerProps) {
  const [endingCombat, setEndingCombat] = useState(false);
  const [advancingTurn, setAdvancingTurn] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [selectedCombatant, setSelectedCombatant] = useState<Combatant | null>(null);

  const handleNextTurn = useCallback(async () => {
    if (!onNextTurn) return;
    setAdvancingTurn(true);
    try {
      await onNextTurn();
    } finally {
      setAdvancingTurn(false);
    }
  }, [onNextTurn]);

  const handleEndCombat = useCallback(async (outcome: 'victory' | 'defeat' | 'retreat' | 'truce') => {
    if (!onEndCombat) return;
    setEndingCombat(true);
    try {
      await onEndCombat(outcome);
      setShowEndDialog(false);
    } finally {
      setEndingCombat(false);
    }
  }, [onEndCombat]);

  const handleCombatantSelect = useCallback((combatant: Combatant) => {
    setSelectedCombatant(combatant);
    onSelectCombatant?.(combatant);
  }, [onSelectCombatant]);

  // No active combat
  if (!combatState || !combatState.active) {
    return (
      <div className="p-4 bg-surface rounded-lg border border-border text-center">
        <p className="text-muted text-sm">No active combat</p>
      </div>
    );
  }

  // Get current combatant
  const currentEntry = combatState.initiative_order[combatState.turn_index];
  const currentCombatant = combatState.combatants.find(c => c.id === currentEntry?.id);
  const isPlayerTurn = currentCombatant?.type === 'player';

  // Calculate combat stats
  const activePlayers = combatState.combatants.filter(c => c.type === 'player' && c.is_active);
  const activeEnemies = combatState.combatants.filter(c => c.type === 'monster' && c.is_active);

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-danger/20 px-4 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚔️</span>
            <span className="font-bold text-danger">COMBAT</span>
          </div>
          <span className="text-sm bg-danger/20 px-2 py-0.5 rounded">
            Round {combatState.round}
          </span>
        </div>
      </div>

      {/* Current Turn Highlight */}
      {currentCombatant && (
        <div className={`px-4 py-3 border-b border-border ${isPlayerTurn ? 'bg-primary/10' : 'bg-danger/10'}`}>
          <div className="text-xs text-muted mb-1">Current Turn</div>
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {currentCombatant.type === 'player' ? '🧙' : '👹'}
            </span>
            <span className="font-bold text-lg">{currentCombatant.name}</span>
            <span className="text-sm text-muted">
              ({currentCombatant.current_hp}/{currentCombatant.max_hp} HP)
            </span>
          </div>
        </div>
      )}

      {/* Initiative List */}
      <div className="p-4">
        <InitiativeList
          initiativeOrder={combatState.initiative_order}
          combatants={combatState.combatants}
          currentTurnIndex={combatState.turn_index}
          round={combatState.round}
          compact
          onSelectCombatant={handleCombatantSelect}
        />
      </div>

      {/* Selected Combatant Details */}
      {selectedCombatant && (
        <div className="px-4 pb-4">
          <div className="text-xs text-muted mb-2">Selected</div>
          <CombatantCard
            combatant={selectedCombatant}
            isCurrentTurn={selectedCombatant.id === currentCombatant?.id}
          />
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2">
        {onNextTurn && (
          <Button
            className="w-full"
            onClick={handleNextTurn}
            disabled={advancingTurn || isLoading}
          >
            {advancingTurn ? 'Advancing...' : 'End Turn / Next'}
          </Button>
        )}

        {onEndCombat && !showEndDialog && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setShowEndDialog(true)}
            disabled={endingCombat || isLoading}
          >
            End Combat
          </Button>
        )}

        {/* End Combat Dialog */}
        {showEndDialog && (
          <div className="space-y-2 p-3 bg-surface-hover rounded">
            <div className="text-sm font-medium mb-2">End combat with outcome:</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleEndCombat('victory')}
                disabled={endingCombat}
              >
                Victory
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleEndCombat('retreat')}
                disabled={endingCombat}
              >
                Retreat
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleEndCombat('truce')}
                disabled={endingCombat}
              >
                Truce
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowEndDialog(false)}
                disabled={endingCombat}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Combat Stats Footer */}
      <div className="px-4 py-2 bg-surface-hover text-xs text-muted flex justify-between">
        <span>Players: {activePlayers.length} active</span>
        <span>Enemies: {activeEnemies.length} active</span>
      </div>
    </div>
  );
}
