'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import type { Character } from '@/lib/api';

export interface CharacterCardProps {
  character: Character;
  isOwner: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * CharacterCard - Display a character's summary information
 */
export function CharacterCard({
  character,
  isOwner,
  onEdit,
  onDelete,
}: CharacterCardProps) {
  const getAbilityModifier = (score: number): string => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const hpPercentage = (character.current_hp / character.max_hp) * 100;
  const hpColor =
    hpPercentage > 50
      ? 'bg-success'
      : hpPercentage > 25
      ? 'bg-warning'
      : 'bg-danger';

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Character Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-foreground truncate">
                {character.name}
              </h3>
              <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded">
                Lv. {character.level}
              </span>
            </div>
            <p className="text-sm text-muted">
              {character.race} {character.class}
            </p>

            {/* HP Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted">HP</span>
                <span className="font-medium text-foreground">
                  {character.current_hp} / {character.max_hp}
                </span>
              </div>
              <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full ${hpColor} transition-all duration-300`}
                  style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
                />
              </div>
            </div>

            {/* Stats Summary */}
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="px-2 py-1 bg-background rounded text-xs">
                <span className="text-muted">AC</span>{' '}
                <span className="font-medium text-foreground">{character.armor_class}</span>
              </div>
              <div className="px-2 py-1 bg-background rounded text-xs">
                <span className="text-muted">Speed</span>{' '}
                <span className="font-medium text-foreground">{character.speed} ft</span>
              </div>
            </div>

            {/* Ability Scores */}
            <div className="mt-3 grid grid-cols-6 gap-1 text-center">
              {[
                { label: 'STR', value: character.strength },
                { label: 'DEX', value: character.dexterity },
                { label: 'CON', value: character.constitution },
                { label: 'INT', value: character.intelligence },
                { label: 'WIS', value: character.wisdom },
                { label: 'CHA', value: character.charisma },
              ].map((stat) => (
                <div key={stat.label} className="p-1">
                  <div className="text-[10px] text-muted uppercase">{stat.label}</div>
                  <div className="text-sm font-medium text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted">{getAbilityModifier(stat.value)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {isOwner && (
            <div className="flex flex-col gap-2">
              <Link href={`/characters/${character.id}`}>
                <Button variant="secondary" size="sm" className="w-full">
                  View
                </Button>
              </Link>
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-danger hover:text-danger hover:bg-danger/10"
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CharacterCard;
