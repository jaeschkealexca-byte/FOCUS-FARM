export class FocusSession {
  readonly minutes: number;
  readonly plots: readonly number[];
  private deadline: number;
  private pausedRemaining: number | null = null;
  private settled = false;

  constructor(minutes: number, plots: number[]) {
    this.minutes = minutes;
    this.deadline = Date.now() + minutes * 60_000;
    this.plots = [...plots];
  }

  get paused(): boolean { return this.pausedRemaining !== null; }
  get remainingMs(): number { return this.pausedRemaining ?? Math.max(0, this.deadline - Date.now()); }
  get elapsedMinutes(): number { return Math.max(0, (this.minutes * 60_000 - this.remainingMs) / 60_000); }
  pause(): void { if (!this.paused && !this.settled && this.remainingMs > 0) this.pausedRemaining = this.remainingMs; }
  resume(): void {
    if (this.pausedRemaining === null || this.settled) return;
    this.deadline = Date.now() + this.pausedRemaining;
    this.pausedRemaining = null;
  }
  get countdown(): string {
    const seconds = Math.ceil(this.remainingMs / 1000);
    return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  }
  complete(): boolean {
    if (this.settled || this.paused || this.remainingMs > 0) return false;
    this.settled = true;
    return true;
  }
  cancel(): void { this.settled = true; }
}
