/**
 * Tick Timer System
 *
 * Tick-based timing for grid games where movement happens at fixed intervals.
 * Use for Snake, Tetris, roguelikes, and turn-based movement.
 *
 * Usage:
 *   const ticker = new TickTimer(150); // 150ms between ticks
 *   // In game loop:
 *   if (ticker.update(dt)) {
 *     // Tick happened - move snake, process turn, etc.
 *     snake.move();
 *   }
 */

/**
 * TickTimer - triggers at fixed intervals independent of frame rate.
 * Visual updates still use raw dt, but game logic uses ticks.
 */
export class TickTimer {
  private tickRate: number; // ms between ticks
  private readonly minTickRate: number;
  private lastTick: number = 0;
  private accumulator: number = 0;

  /**
   * Create a TickTimer
   * @param tickRate Initial milliseconds between ticks
   * @param minTickRate Minimum tick rate (fastest speed)
   */
  constructor(tickRate: number = 150, minTickRate: number = 50) {
    this.tickRate = tickRate;
    this.minTickRate = minTickRate;
    this.lastTick = performance.now();
  }

  /**
   * Update the timer. Returns true if a tick occurred.
   * Call once per frame in your game loop.
   */
  update(dt: number): boolean {
    this.accumulator += dt;

    if (this.accumulator >= this.tickRate) {
      this.accumulator -= this.tickRate;
      this.lastTick = performance.now();
      return true;
    }

    return false;
  }

  /**
   * Update with multiple tick support. Returns number of ticks that occurred.
   * Use when you need to process multiple ticks per frame (e.g., catch-up after pause).
   */
  updateMultiple(dt: number): number {
    this.accumulator += dt;
    let ticks = 0;

    while (this.accumulator >= this.tickRate) {
      this.accumulator -= this.tickRate;
      ticks++;
    }

    if (ticks > 0) {
      this.lastTick = performance.now();
    }

    return ticks;
  }

  /**
   * Speed up the tick rate (decrease interval).
   * @param amount Milliseconds to subtract from tick rate
   */
  speedUp(amount: number = 5): void {
    this.tickRate = Math.max(this.minTickRate, this.tickRate - amount);
  }

  /**
   * Slow down the tick rate (increase interval).
   * @param amount Milliseconds to add to tick rate
   */
  slowDown(amount: number = 5): void {
    this.tickRate += amount;
  }

  /**
   * Set tick rate directly
   */
  setTickRate(rate: number): void {
    this.tickRate = Math.max(this.minTickRate, rate);
  }

  /**
   * Get current tick rate in milliseconds
   */
  getTickRate(): number {
    return this.tickRate;
  }

  /**
   * Get progress to next tick (0-1)
   */
  getProgress(): number {
    return this.accumulator / this.tickRate;
  }

  /**
   * Reset the timer (clear accumulator)
   */
  reset(): void {
    this.accumulator = 0;
    this.lastTick = performance.now();
  }

  /**
   * Force a tick immediately
   */
  forceTick(): void {
    this.accumulator = this.tickRate;
  }
}

// ============================================================================
// Cooldown Timer - for abilities and actions
// ============================================================================

/**
 * Simple cooldown timer for abilities, attacks, spawns, etc.
 *
 * Usage:
 *   const attackCooldown = new Cooldown(500); // 500ms cooldown
 *   if (attackCooldown.isReady() && input.isKeyPressed('Space')) {
 *     attack();
 *     attackCooldown.trigger();
 *   }
 *   attackCooldown.update(dt);
 */
export class Cooldown {
  private remaining: number = 0;
  private readonly duration: number;

  constructor(duration: number) {
    this.duration = duration;
  }

  /**
   * Update the cooldown
   */
  update(dt: number): void {
    if (this.remaining > 0) {
      this.remaining -= dt;
    }
  }

  /**
   * Check if cooldown is complete
   */
  isReady(): boolean {
    return this.remaining <= 0;
  }

  /**
   * Start the cooldown
   */
  trigger(): void {
    this.remaining = this.duration;
  }

  /**
   * Get remaining time in ms
   */
  getRemaining(): number {
    return Math.max(0, this.remaining);
  }

  /**
   * Get cooldown progress (0 = just triggered, 1 = ready)
   */
  getProgress(): number {
    if (this.remaining <= 0) return 1;
    return 1 - this.remaining / this.duration;
  }

  /**
   * Reset cooldown to ready
   */
  reset(): void {
    this.remaining = 0;
  }
}
