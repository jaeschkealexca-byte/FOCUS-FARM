// game-analysis-disable: movement-without-dt
/**
 * Grid Entity System
 *
 * Base classes for grid-based entities that move on ticks.
 * Use for Snake segments, Tetris pieces, roguelike characters.
 *
 * Usage:
 *   class Snake extends GridEntity {
 *     onTick() { this.move(this.direction); }
 *   }
 */

/**
 * Direction for grid movement.
 *
 * A union type plus a const object, not a TS enum — a string enum would reject
 * the plain literals you'd naturally write. Both `Direction.UP` and `'up'`
 * are valid here.
 */
export type Direction = 'none' | 'up' | 'down' | 'left' | 'right';

export const Direction = {
  NONE: 'none',
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
} as const satisfies Record<string, Direction>;

/**
 * Direction vectors for movement
 */
export const DirectionVectors: Record<Direction, { dx: number; dy: number }> = {
  [Direction.NONE]: { dx: 0, dy: 0 },
  [Direction.UP]: { dx: 0, dy: -1 },
  [Direction.DOWN]: { dx: 0, dy: 1 },
  [Direction.LEFT]: { dx: -1, dy: 0 },
  [Direction.RIGHT]: { dx: 1, dy: 0 },
};

/**
 * Get opposite direction
 */
export function getOppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case Direction.UP:
      return Direction.DOWN;
    case Direction.DOWN:
      return Direction.UP;
    case Direction.LEFT:
      return Direction.RIGHT;
    case Direction.RIGHT:
      return Direction.LEFT;
    default:
      return Direction.NONE;
  }
}

/**
 * Convert keyboard input to direction
 */
export function keyToDirection(key: string): Direction | null {
  switch (key) {
    case 'ArrowUp':
    case 'KeyW':
      return Direction.UP;
    case 'ArrowDown':
    case 'KeyS':
      return Direction.DOWN;
    case 'ArrowLeft':
    case 'KeyA':
      return Direction.LEFT;
    case 'ArrowRight':
    case 'KeyD':
      return Direction.RIGHT;
    default:
      return null;
  }
}

/**
 * GridEntity - base class for entities that exist on a grid
 */
export class GridEntity {
  gridX: number;
  gridY: number;
  direction: Direction = Direction.NONE;
  active: boolean = true;

  constructor(gridX: number = 0, gridY: number = 0) {
    this.gridX = gridX;
    this.gridY = gridY;
  }

  /**
   * Move one cell in the current direction
   */
  move(dir?: Direction): void {
    const d = dir ?? this.direction;
    const vec = DirectionVectors[d];
    this.gridX += vec.dx;
    this.gridY += vec.dy;
  }

  /**
   * Set direction, preventing reversal if specified
   */
  setDirection(newDir: Direction, preventReversal: boolean = false): void {
    if (preventReversal && newDir === getOppositeDirection(this.direction)) {
      return; // Can't reverse direction (like in Snake)
    }
    this.direction = newDir;
  }

  /**
   * Check if this entity is at a grid position
   */
  isAt(x: number, y: number): boolean {
    return this.gridX === x && this.gridY === y;
  }

  /**
   * Get world position from grid position
   */
  getWorldPosition(cellSize: number): { x: number; y: number } {
    return {
      x: this.gridX * cellSize,
      y: this.gridY * cellSize,
    };
  }

  /**
   * Get center world position (for rendering)
   */
  getCenterPosition(cellSize: number): { x: number; y: number } {
    return {
      x: this.gridX * cellSize + cellSize / 2,
      y: this.gridY * cellSize + cellSize / 2,
    };
  }
}

// ============================================================================
// Grid Helpers
// ============================================================================

/**
 * Grid bounds checking
 */
export function isInBounds(
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  return x >= 0 && x < width && y >= 0 && y < height;
}

/**
 * Convert world position to grid position
 */
export function worldToGrid(
  worldX: number,
  worldY: number,
  cellSize: number
): { gridX: number; gridY: number } {
  return {
    gridX: Math.floor(worldX / cellSize),
    gridY: Math.floor(worldY / cellSize),
  };
}

/**
 * Convert grid position to world position (top-left of cell)
 */
export function gridToWorld(
  gridX: number,
  gridY: number,
  cellSize: number
): { x: number; y: number } {
  return {
    x: gridX * cellSize,
    y: gridY * cellSize,
  };
}

/**
 * Get random grid position within bounds
 */
export function randomGridPosition(
  width: number,
  height: number
): { gridX: number; gridY: number } {
  return {
    gridX: Math.floor(Math.random() * width),
    gridY: Math.floor(Math.random() * height),
  };
}

/**
 * Get random grid position avoiding occupied cells
 */
export function randomEmptyGridPosition(
  width: number,
  height: number,
  occupied: Array<{ gridX: number; gridY: number }>
): { gridX: number; gridY: number } | null {
  const maxAttempts = 100;

  for (let i = 0; i < maxAttempts; i++) {
    const pos = randomGridPosition(width, height);
    const isOccupied = occupied.some(
      (o) => o.gridX === pos.gridX && o.gridY === pos.gridY
    );
    if (!isOccupied) {
      return pos;
    }
  }

  return null; // Grid is full or very crowded
}

/**
 * Manhattan distance between two grid positions
 */
export function gridDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}
