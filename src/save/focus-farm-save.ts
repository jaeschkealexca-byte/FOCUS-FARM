import type { SaveData } from './save-manager';
import type { Direction } from '../movement/grid-entity';

export interface SavedPlot {
  x: number;
  y: number;
  tilled: boolean;
  crop: string | null;
  watered: boolean;
  growth: number;
}

export class FocusFarmSave implements SaveData {
  version = 2;
  width = 18;
  height = 10;
  player: { x: number; y: number; direction: Direction } = { x: 2, y: 5, direction: 'right' };
  plots: SavedPlot[] = [];
  seeds: Record<string, number> = { carrot: 3, cabbage: 2, strawberry: 1 };
  produce: Record<string, number> = {};
  selectedSeed = 'carrot';
  coins = 50;
  sessions = 0;
  minutes = 0;
  toolbarSlots: Array<string | null> = [null, null, null, null];
  cropPlotsClearedForGrowthTest = true;

  static isValid(value: unknown): value is FocusFarmSave {
    const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
    const count = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
    const growthValue = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
    const position = (x: unknown, y: unknown): boolean => count(x) && count(y) && x < 18 && y < 10;

    if (!record(value) || (value.version !== 1 && value.version !== 2) || value.width !== 18 || value.height !== 10) return false;
    if (!record(value.player) || !position(value.player.x, value.player.y)) return false;
    if (value.player.y === 1 && (value.player.x === 1 || value.player.x === 2)) return false;
    if (typeof value.player.direction !== 'string' || !['up', 'down', 'left', 'right'].includes(value.player.direction)) return false;

    for (const key of ['coins', 'sessions', 'minutes']) if (!count(value[key])) return false;

    // Seeds can be number (v1) or Record<string, number> (v2)
    if (typeof value.seeds !== 'number' && !record(value.seeds)) return false;
    if (typeof value.produce !== 'number' && !record(value.produce)) return false;

    if (value.toolbarSlots !== undefined && (!Array.isArray(value.toolbarSlots) || value.toolbarSlots.length !== 4 || !value.toolbarSlots.every(slot => slot === null || typeof slot === 'string'))) return false;
    if (!Array.isArray(value.plots) || value.plots.length !== 180) return false;
    const seen = new Set<number>();
    for (const plot of value.plots as unknown[]) {
      if (!record(plot) || !count(plot.x) || !count(plot.y) || !position(plot.x, plot.y)) return false;
      const index = plot.y * 18 + plot.x;
      if (seen.has(index)) return false;
      seen.add(index);
      if (typeof plot.tilled !== 'boolean' || typeof plot.watered !== 'boolean') return false;
      if (plot.crop !== null && typeof plot.crop !== 'string') return false;
      if (!growthValue(plot.growth)) return false;
      if (plot.crop !== null && !plot.tilled) return false;
      if (plot.crop === null && (plot.watered || plot.growth !== 0)) return false;
      if (plot.y === 1 && (plot.x === 1 || plot.x === 2) && (plot.tilled || plot.crop !== null)) return false;
    }
    return true;
  }
}
