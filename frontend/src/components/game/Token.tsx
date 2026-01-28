'use client';

import { useCallback, useRef } from 'react';

export interface TokenData {
  id: string;
  type: 'player' | 'npc' | 'monster' | 'object';
  x: number;
  y: number;
  label: string;
  color?: string;
}

interface TokenProps {
  token: TokenData;
  cellSize: number;
  isSelected?: boolean;
  isDragging?: boolean;
  isCurrentTurn?: boolean;
  onSelect?: (token: TokenData) => void;
  onDragStart?: (token: TokenData, event: React.MouseEvent) => void;
}

const defaultColors: Record<TokenData['type'], string> = {
  player: '#4ade80', // green
  npc: '#60a5fa',    // blue
  monster: '#f87171', // red
  object: '#a78bfa',  // purple
};

const typeIcons: Record<TokenData['type'], string> = {
  player: '🧙',
  npc: '👤',
  monster: '👹',
  object: '📦',
};

export function Token({
  token,
  cellSize,
  isSelected = false,
  isDragging = false,
  isCurrentTurn = false,
  onSelect,
  onDragStart,
}: TokenProps) {
  const tokenRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(token);
    onDragStart?.(token, e);
  }, [token, onSelect, onDragStart]);

  const color = token.color || defaultColors[token.type];
  const icon = typeIcons[token.type];

  // Position token at center of cell
  const size = Math.min(cellSize * 0.8, 40);
  const left = token.x * cellSize + (cellSize - size) / 2;
  const top = token.y * cellSize + (cellSize - size) / 2;

  return (
    <div
      ref={tokenRef}
      className={`
        absolute rounded-full flex items-center justify-center
        cursor-pointer select-none transition-shadow
        ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
        ${isDragging ? 'opacity-50 cursor-grabbing z-50' : 'z-10'}
        ${isCurrentTurn ? 'animate-pulse ring-2 ring-warning' : ''}
      `}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        boxShadow: isSelected ? '0 0 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.2)',
      }}
      onMouseDown={handleMouseDown}
      title={token.label}
    >
      {/* Icon or initial */}
      <span className="text-white text-sm select-none" style={{ fontSize: size * 0.5 }}>
        {cellSize > 30 ? icon : token.label.charAt(0).toUpperCase()}
      </span>

      {/* Label (shown on hover or when selected) */}
      {(isSelected || cellSize > 40) && (
        <div
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-1 py-0.5 bg-background/80 rounded text-xs whitespace-nowrap"
          style={{ fontSize: Math.max(8, size * 0.25) }}
        >
          {token.label}
        </div>
      )}

      {/* Current turn indicator */}
      {isCurrentTurn && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full border border-background" />
      )}
    </div>
  );
}
