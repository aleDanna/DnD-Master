'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Token, TokenData } from './Token';

interface TerrainTile {
  x: number;
  y: number;
  type: 'wall' | 'difficult' | 'water' | 'pit';
}

interface MapState {
  grid_width: number;
  grid_height: number;
  tokens: TokenData[];
  terrain: TerrainTile[];
}

interface MapCanvasProps {
  mapState: MapState | null;
  currentTurnTokenId?: string;
  selectedTokenId?: string;
  onTokenSelect?: (token: TokenData | null) => void;
  onTokenMove?: (tokenId: string, newX: number, newY: number) => void;
  className?: string;
}

const terrainColors: Record<TerrainTile['type'], string> = {
  wall: '#374151',      // dark gray
  difficult: '#854d0e', // brown
  water: '#1e40af',     // blue
  pit: '#1f2937',       // very dark
};

const MIN_CELL_SIZE = 20;
const MAX_CELL_SIZE = 80;
const DEFAULT_CELL_SIZE = 40;

export function MapCanvas({
  mapState,
  currentTurnTokenId,
  selectedTokenId,
  onTokenSelect,
  onTokenMove,
  className = '',
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const [draggingToken, setDraggingToken] = useState<TokenData | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  // Auto-fit grid to container
  useEffect(() => {
    if (!containerRef.current || !mapState) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const cellWidth = Math.floor(containerWidth / mapState.grid_width);
    const cellHeight = Math.floor(containerHeight / mapState.grid_height);
    const optimalCellSize = Math.min(cellWidth, cellHeight);

    setCellSize(Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, optimalCellSize)));
  }, [mapState]);

  // Handle drag start
  const handleDragStart = useCallback((token: TokenData, event: React.MouseEvent) => {
    if (!onTokenMove) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDraggingToken(token);
    setDragOffset({
      x: event.clientX - rect.left - token.x * cellSize,
      y: event.clientY - rect.top - token.y * cellSize,
    });
    setDragPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }, [cellSize, onTokenMove]);

  // Handle drag move
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!draggingToken || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setDragPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }, [draggingToken]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    if (!draggingToken || !mapState) return;

    // Calculate new grid position
    const newX = Math.floor((dragPosition.x - dragOffset.x + cellSize / 2) / cellSize);
    const newY = Math.floor((dragPosition.y - dragOffset.y + cellSize / 2) / cellSize);

    // Clamp to grid bounds
    const clampedX = Math.max(0, Math.min(mapState.grid_width - 1, newX));
    const clampedY = Math.max(0, Math.min(mapState.grid_height - 1, newY));

    // Check if actually moved
    if (clampedX !== draggingToken.x || clampedY !== draggingToken.y) {
      onTokenMove?.(draggingToken.id, clampedX, clampedY);
    }

    setDraggingToken(null);
  }, [draggingToken, dragPosition, dragOffset, cellSize, mapState, onTokenMove]);

  // Handle click on empty cell
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    // Only deselect if clicking on the canvas itself, not on a token
    if (target === containerRef.current || target.classList.contains('grid-cell')) {
      onTokenSelect?.(null);
    }
  }, [onTokenSelect]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setCellSize(prev => Math.min(MAX_CELL_SIZE, prev + 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setCellSize(prev => Math.max(MIN_CELL_SIZE, prev - 10));
  }, []);

  if (!mapState) {
    return (
      <div className={`flex items-center justify-center bg-surface rounded-lg border border-border ${className}`}>
        <p className="text-muted text-sm">No map available</p>
      </div>
    );
  }

  const gridWidth = mapState.grid_width * cellSize;
  const gridHeight = mapState.grid_height * cellSize;

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-surface border-b border-border">
        <span className="text-sm text-muted">
          {mapState.grid_width}x{mapState.grid_height} grid
        </span>
        <div className="flex items-center gap-1">
          <button
            className="px-2 py-1 text-sm bg-surface-hover rounded hover:bg-surface-hover/80"
            onClick={handleZoomOut}
            disabled={cellSize <= MIN_CELL_SIZE}
          >
            −
          </button>
          <span className="text-xs text-muted w-12 text-center">{cellSize}px</span>
          <button
            className="px-2 py-1 text-sm bg-surface-hover rounded hover:bg-surface-hover/80"
            onClick={handleZoomIn}
            disabled={cellSize >= MAX_CELL_SIZE}
          >
            +
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-background"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <div
          className="relative"
          style={{
            width: `${gridWidth}px`,
            height: `${gridHeight}px`,
            minWidth: `${gridWidth}px`,
            minHeight: `${gridHeight}px`,
          }}
        >
          {/* Grid lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={gridWidth}
            height={gridHeight}
          >
            {/* Vertical lines */}
            {Array.from({ length: mapState.grid_width + 1 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i * cellSize}
                y1={0}
                x2={i * cellSize}
                y2={gridHeight}
                stroke="currentColor"
                strokeOpacity={0.1}
              />
            ))}
            {/* Horizontal lines */}
            {Array.from({ length: mapState.grid_height + 1 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * cellSize}
                x2={gridWidth}
                y2={i * cellSize}
                stroke="currentColor"
                strokeOpacity={0.1}
              />
            ))}
          </svg>

          {/* Terrain tiles */}
          {mapState.terrain.map((tile, index) => (
            <div
              key={`terrain-${index}`}
              className="absolute grid-cell"
              style={{
                left: tile.x * cellSize,
                top: tile.y * cellSize,
                width: cellSize,
                height: cellSize,
                backgroundColor: terrainColors[tile.type],
                opacity: 0.7,
              }}
              title={tile.type}
            />
          ))}

          {/* Tokens */}
          {mapState.tokens.map(token => (
            <Token
              key={token.id}
              token={token}
              cellSize={cellSize}
              isSelected={selectedTokenId === token.id}
              isDragging={draggingToken?.id === token.id}
              isCurrentTurn={currentTurnTokenId === token.id}
              onSelect={onTokenSelect}
              onDragStart={handleDragStart}
            />
          ))}

          {/* Drag preview */}
          {draggingToken && (
            <div
              className="absolute pointer-events-none opacity-50 z-50"
              style={{
                left: dragPosition.x - dragOffset.x - cellSize * 0.1,
                top: dragPosition.y - dragOffset.y - cellSize * 0.1,
                width: cellSize * 0.8,
                height: cellSize * 0.8,
                backgroundColor: 'rgba(var(--primary-rgb), 0.3)',
                borderRadius: '50%',
                border: '2px dashed rgba(var(--primary-rgb), 0.8)',
              }}
            />
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-2 bg-surface border-t border-border text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          Player
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          Monster
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          NPC
        </span>
      </div>
    </div>
  );
}
