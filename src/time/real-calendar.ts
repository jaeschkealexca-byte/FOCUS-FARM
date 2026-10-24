import { SaveManager } from '../save/save-manager';

/** Local device time, never accelerated game time. Meteorological seasons. */
export class RealCalendar {
  static readonly shared = new RealCalendar();
  private now = new Date();
  private second = -1;
  private southern = false;
  private saves = new SaveManager<{ version: number; southern: boolean }>('quiet-acres-calendar', 1);
  private readonly timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  private readonly dateFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  time = '';
  date = '';
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter' = 'Spring';
  phase = 'Day';
  nightAlpha = 0;
  /** Short English weekday, e.g. "Mon". */
  weekday = '';
  /** 1-based day within the current meteorological season. */
  dayOfSeason = 1;
  /** 12-hour clock without seconds, e.g. "06:20". */
  clock = '';
  meridiem: 'AM' | 'PM' = 'AM';
  /** Fractional hour of the local day (0–24). */
  hour = 0;
  /** Local date key, e.g. "2026-10-24" (used to roll daily weather). */
  dateKey = '';
  constructor() {
    try {
      const saved = this.saves.load();
      if (saved && typeof saved.southern === 'boolean') this.southern = saved.southern;
    } catch { /* Keep default when browser storage is unavailable. */ }
    this.update(0);
  }
  get hemisphere(): string { return this.southern ? 'Southern' : 'Northern'; }
  toggleHemisphere(): void {
    this.southern = !this.southern;
    try { this.saves.save({ southern: this.southern }); } catch { /* Still works for this visit. */ }
    this.second = -1;
    this.update(0);
  }
  update(_dt: number): void {
    const timestamp = Date.now();
    const second = Math.floor(timestamp / 1000);
    if (second === this.second) return;
    this.second = second;
    this.now = new Date(timestamp);
    this.time = this.timeFormat.format(this.now);
    this.date = this.dateFormat.format(this.now);
    const index = (Math.floor((this.now.getMonth() + 1) / 3) + (this.southern ? 2 : 0)) % 4;
    this.season = (['Winter', 'Spring', 'Summer', 'Autumn'] as const)[index];
    const hour = this.now.getHours() + this.now.getMinutes() / 60;
    this.hour = hour;
    this.weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][this.now.getDay()];
    const h12 = this.now.getHours() % 12 || 12;
    this.clock = `${String(h12).padStart(2, '0')}:${String(this.now.getMinutes()).padStart(2, '0')}`;
    this.meridiem = this.now.getHours() < 12 ? 'AM' : 'PM';
    const y = this.now.getFullYear(), m = this.now.getMonth();
    this.dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(this.now.getDate()).padStart(2, '0')}`;
    // Meteorological seasons start on Mar 1 / Jun 1 / Sep 1 / Dec 1.
    const startMonth = m - (m + 1) % 3;
    const seasonStart = new Date(y, startMonth, 1);
    const today = new Date(y, m, this.now.getDate());
    this.dayOfSeason = Math.round((today.getTime() - seasonStart.getTime()) / 86400000) + 1;
    this.phase = hour < 6 || hour >= 20 ? 'Night' : hour < 8 ? 'Dawn' : hour >= 18 ? 'Dusk' : 'Day';
    this.nightAlpha = hour < 6 || hour >= 20 ? .28 : hour < 8 ? .28 * (8 - hour) / 2 : hour >= 18 ? .28 * (hour - 18) / 2 : 0;
  }
  get palette(): { grass: readonly string[]; edge: string; detail: string; flower: string; sky: string; tree: string; treeLight: string } {
    switch (this.season) {
      case 'Winter': return { grass: ['#e0e9ef', '#d7e3eb', '#edf2f5', '#dae6ee'], edge: '#bacfdd', detail: '#b0c5d4', flower: '#ffffff', sky: '#dce4f1', tree: '#b6cbd3', treeLight: '#f0f5fa' };
      case 'Autumn': return { grass: ['#bba071', '#c4a775', '#cfb27d', '#bca16e'], edge: '#967951', detail: '#bb754f', flower: '#edba6c', sky: '#f0d5cf', tree: '#bd805e', treeLight: '#edbd83' };
      case 'Summer': return { grass: ['#7f9e66', '#839f68', '#88a46d', '#809c65'], edge: '#74925e', detail: '#a4b77c', flower: '#ffe6a1', sky: '#d7e5f0', tree: '#7fa774', treeLight: '#b4cf89' };
      default: return { grass: ['#a3bd85', '#a9c38b', '#b2cb94', '#a7be88'], edge: '#89a66f', detail: '#83a66b', flower: '#f4bbd3', sky: '#ead8ed', tree: '#cc91ae', treeLight: '#efbdd2' };
    }
  }
}
