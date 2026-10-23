/**
 * Save/Load System
 *
 * LocalStorage persistence for saving game progress between sessions.
 * Always includes version number for safe migration when save format changes.
 *
 * Usage:
 *   const saves = new SaveManager<MyGameData>('my_game', 1);
 *   saves.save({ player: { x: 100, y: 200 }, score: 500 });
 *   const loaded = saves.load();
 *   if (loaded) { game.player.x = loaded.player.x; }
 */

/**
 * Base interface for save data - always include version for migrations.
 * Extend this with your game-specific data.
 */
export interface SaveData {
  version: number;
}

/**
 * Example save data structure - customize for your game
 */
export interface GameSaveData extends SaveData {
  player: {
    x: number;
    y: number;
    health: number;
  };
  score: number;
  level: number;
  unlockedLevels: number[];
  flags?: Record<string, boolean>;
  variables?: Record<string, number>;
}

/**
 * SaveManager - handles persistence with versioning and migration.
 * Type parameter T extends SaveData to ensure version field exists.
 */
export class SaveManager<T extends SaveData> {
  private readonly key: string;
  private readonly currentVersion: number;
  private migrateFn?: (data: T) => T;

  /**
   * Create a SaveManager
   * @param key LocalStorage key for this save
   * @param version Current save format version
   */
  constructor(key: string, version: number) {
    this.key = key;
    this.currentVersion = version;
  }

  /**
   * Register a migration function to upgrade old saves
   * The function receives old data and should return upgraded data
   */
  setMigration(fn: (data: T) => T): void {
    this.migrateFn = fn;
  }

  /**
   * Save data to LocalStorage
   */
  save(data: Omit<T, 'version'>): void {
    const saveData = {
      ...data,
      version: this.currentVersion,
    } as T;
    localStorage.setItem(this.key, JSON.stringify(saveData));
  }

  /**
   * Load data from LocalStorage
   * Returns null if no save exists or data is corrupted
   */
  load(): T | null {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const data = JSON.parse(raw) as T;

      // Migrate if version mismatch
      if (data.version !== this.currentVersion) {
        return this.migrate(data);
      }

      return data;
    } catch {
      // Corrupted save data
      return null;
    }
  }

  /**
   * Check if a save exists
   */
  exists(): boolean {
    return localStorage.getItem(this.key) !== null;
  }

  /**
   * Delete the save
   */
  delete(): void {
    localStorage.removeItem(this.key);
  }

  /**
   * Migrate old save data to current version
   */
  private migrate(data: T): T | null {
    if (this.migrateFn) {
      const migrated = this.migrateFn(data);
      migrated.version = this.currentVersion;
      // Save migrated data
      localStorage.setItem(this.key, JSON.stringify(migrated));
      return migrated;
    }

    // Unsupported versions are never silently relabeled as current.
    return null;
  }
}

// ============================================================================
// High Score Manager - Simplified persistence for scores
// ============================================================================

export interface HighScoreEntry {
  score: number;
  name: string;
  date: number;
}

/**
 * HighScoreManager - simple leaderboard persistence
 */
export class HighScoreManager {
  private readonly key: string;
  private readonly maxEntries: number;

  constructor(key: string = 'high_scores', maxEntries: number = 10) {
    this.key = key;
    this.maxEntries = maxEntries;
  }

  /**
   * Add a score to the leaderboard if it qualifies
   * Returns the rank (1-based) if added, or null if didn't qualify
   */
  addScore(score: number, name: string = 'Player'): number | null {
    const scores = this.getScores();

    // Check if qualifies
    if (scores.length >= this.maxEntries && score <= scores[scores.length - 1].score) {
      return null;
    }

    const entry: HighScoreEntry = {
      score,
      name,
      date: Date.now(),
    };

    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);
    scores.splice(this.maxEntries);

    localStorage.setItem(this.key, JSON.stringify(scores));

    return scores.indexOf(entry) + 1;
  }

  /**
   * Get all high scores sorted by score descending
   */
  getScores(): HighScoreEntry[] {
    const raw = localStorage.getItem(this.key);
    if (!raw) return [];

    try {
      return JSON.parse(raw) as HighScoreEntry[];
    } catch {
      return [];
    }
  }

  /**
   * Get the highest score
   */
  getHighScore(): number {
    const scores = this.getScores();
    return scores.length > 0 ? scores[0].score : 0;
  }

  /**
   * Check if a score would qualify for the leaderboard
   */
  isHighScore(score: number): boolean {
    const scores = this.getScores();
    if (scores.length < this.maxEntries) return true;
    return score > scores[scores.length - 1].score;
  }

  /**
   * Clear all high scores
   */
  clear(): void {
    localStorage.removeItem(this.key);
  }
}

// ============================================================================
// Example Migration
// ============================================================================

/**
 * Example migration function - customize for your save format changes
 *
 * Usage:
 *   const saves = new SaveManager<GameSaveData>('my_game', 2);
 *   saves.setMigration(migrateGameSave);
 */
export function exampleMigration(data: GameSaveData): GameSaveData {
  // v1 -> v2: Added unlockedLevels
  if (!data.unlockedLevels) {
    data.unlockedLevels = [1];
  }

  // v2 -> v3: Added flags and variables
  if (!data.flags) {
    data.flags = {};
  }
  if (!data.variables) {
    data.variables = {};
  }

  return data;
}
