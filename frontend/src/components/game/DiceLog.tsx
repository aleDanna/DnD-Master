'use client';

import { useState } from 'react';

interface DiceRollEntry {
  id: string;
  rollerName: string;
  dice: string;
  reason: string;
  rolls: number[];
  modifier: number;
  total: number;
  criticalHit?: boolean;
  criticalFail?: boolean;
  timestamp: string;
}

interface DiceLogProps {
  entries: DiceRollEntry[];
  className?: string;
  maxVisible?: number;
}

export function DiceLog({ entries, className = '', maxVisible = 20 }: DiceLogProps) {
  const [expanded, setExpanded] = useState(false);

  const displayEntries = expanded ? entries : entries.slice(-maxVisible);
  const hasMore = entries.length > maxVisible;

  if (entries.length === 0) {
    return (
      <div className={`bg-surface border border-border rounded-lg p-4 ${className}`}>
        <h3 className="text-sm font-semibold text-foreground mb-2">Dice Log</h3>
        <p className="text-sm text-muted">No dice rolls yet</p>
      </div>
    );
  }

  return (
    <div className={`bg-surface border border-border rounded-lg ${className}`}>
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Dice Log</h3>
        <span className="text-xs text-muted">{entries.length} rolls</span>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {hasMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full p-2 text-xs text-primary hover:bg-background transition-colors"
          >
            Show {entries.length - maxVisible} more rolls...
          </button>
        )}

        <div className="divide-y divide-border">
          {displayEntries.map((entry) => (
            <DiceLogEntry key={entry.id} entry={entry} />
          ))}
        </div>
      </div>

      {expanded && hasMore && (
        <button
          onClick={() => setExpanded(false)}
          className="w-full p-2 text-xs text-muted hover:bg-background transition-colors border-t border-border"
        >
          Show less
        </button>
      )}
    </div>
  );
}

interface DiceLogEntryProps {
  entry: DiceRollEntry;
}

function DiceLogEntry({ entry }: DiceLogEntryProps) {
  const formattedTime = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const modifierStr = entry.modifier >= 0 ? `+${entry.modifier}` : entry.modifier.toString();
  const rollsStr = entry.rolls.join(', ');

  return (
    <div className="p-3 hover:bg-background/50 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-foreground">{entry.rollerName}</span>
        <span className="text-xs text-muted">{formattedTime}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-primary font-mono">{entry.dice}</span>
        <span className="text-muted">=</span>
        <span
          className={`text-sm font-bold ${
            entry.criticalHit
              ? 'text-success'
              : entry.criticalFail
              ? 'text-danger'
              : 'text-foreground'
          }`}
        >
          {entry.total}
        </span>
        {entry.criticalHit && <span className="text-xs text-success">CRIT!</span>}
        {entry.criticalFail && <span className="text-xs text-danger">FAIL</span>}
      </div>

      <div className="text-xs text-muted mt-1">
        <span>{entry.reason}</span>
        {entry.rolls.length > 1 && (
          <span className="ml-2">
            [{rollsStr}]{entry.modifier !== 0 && modifierStr}
          </span>
        )}
      </div>
    </div>
  );
}

// Dice roller component
interface DiceRollerProps {
  onRoll: (dice: string, reason?: string) => void;
  disabled?: boolean;
}

export function DiceRoller({ onRoll, disabled = false }: DiceRollerProps) {
  const [customDice, setCustomDice] = useState('');
  const [reason, setReason] = useState('');

  const quickDice = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '2d6'];

  const handleQuickRoll = (dice: string) => {
    if (disabled) return;
    onRoll(dice, reason || undefined);
  };

  const handleCustomRoll = () => {
    if (disabled || !customDice.trim()) return;
    onRoll(customDice.trim(), reason || undefined);
    setCustomDice('');
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Quick Dice</h3>

      {/* Quick dice buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickDice.map((dice) => (
          <button
            key={dice}
            onClick={() => handleQuickRoll(dice)}
            disabled={disabled}
            className="
              px-3 py-1.5 text-sm font-mono
              bg-background hover:bg-border
              border border-border rounded
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {dice}
          </button>
        ))}
      </div>

      {/* Custom roll */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={customDice}
            onChange={(e) => setCustomDice(e.target.value)}
            placeholder="2d6+3"
            disabled={disabled}
            className="
              flex-1 px-3 py-1.5 text-sm font-mono
              bg-background border border-border rounded
              focus:outline-none focus:ring-1 focus:ring-primary
              disabled:opacity-50
            "
          />
          <button
            onClick={handleCustomRoll}
            disabled={disabled || !customDice.trim()}
            className="
              px-4 py-1.5 text-sm font-medium
              bg-primary hover:bg-primary/90 text-white rounded
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Roll
          </button>
        </div>

        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          disabled={disabled}
          className="
            w-full px-3 py-1.5 text-sm
            bg-background border border-border rounded
            focus:outline-none focus:ring-1 focus:ring-primary
            disabled:opacity-50
          "
        />
      </div>
    </div>
  );
}
