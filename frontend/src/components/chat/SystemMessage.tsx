'use client';

interface DiceRoll {
  dice: string;
  total: number;
  rolls: number[];
  criticalHit?: boolean;
  criticalFail?: boolean;
}

interface SystemMessageProps {
  content: string;
  mechanics?: string;
  diceRoll?: DiceRoll;
  timestamp: string;
}

export function SystemMessage({
  content,
  mechanics,
  diceRoll,
  timestamp,
}: SystemMessageProps) {
  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex justify-center my-4">
      <div className="bg-background/50 border border-border rounded-lg px-4 py-3 max-w-md text-center">
        {/* Dice roll display */}
        {diceRoll && (
          <div className="mb-2">
            <div className="flex items-center justify-center gap-2 text-lg font-bold">
              <span className="text-primary">{diceRoll.dice}</span>
              <span className="text-muted">=</span>
              <span
                className={`
                  ${diceRoll.criticalHit ? 'text-success' : ''}
                  ${diceRoll.criticalFail ? 'text-danger' : ''}
                  ${!diceRoll.criticalHit && !diceRoll.criticalFail ? 'text-foreground' : ''}
                `}
              >
                {diceRoll.total}
              </span>
              {diceRoll.criticalHit && (
                <span className="text-success text-sm font-normal">CRITICAL!</span>
              )}
              {diceRoll.criticalFail && (
                <span className="text-danger text-sm font-normal">Critical Fail</span>
              )}
            </div>
            {diceRoll.rolls.length > 1 && (
              <div className="text-xs text-muted mt-1">
                Rolls: [{diceRoll.rolls.join(', ')}]
              </div>
            )}
          </div>
        )}

        {/* Main content */}
        <p className="text-sm text-muted">{content}</p>

        {/* Mechanics */}
        {mechanics && (
          <p className="text-xs text-muted/70 italic mt-1">{mechanics}</p>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted/50 mt-2">{formattedTime}</p>
      </div>
    </div>
  );
}

// Export event type formatters
export function formatDiceRollMessage(
  rollerName: string,
  dice: string,
  reason: string,
  total: number,
  rolls: number[]
): string {
  return `${rollerName} rolled ${dice} for ${reason}: ${total}`;
}

export function formatCombatStartMessage(participantCount: number): string {
  return `Combat begins with ${participantCount} participants!`;
}

export function formatCombatEndMessage(outcome: string): string {
  const outcomes: Record<string, string> = {
    victory: 'Victory! The enemies have been defeated.',
    defeat: 'Defeat. The party has fallen.',
    retreat: 'The party retreated from combat.',
    truce: 'A truce has been reached.',
  };
  return outcomes[outcome] || 'Combat has ended.';
}

export function formatTurnStartMessage(name: string, round: number): string {
  return `Round ${round}: It's ${name}'s turn!`;
}
