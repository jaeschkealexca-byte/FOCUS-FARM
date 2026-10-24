import { MakkoEngine } from '@makko/engine';
import { RealCalendar } from '../time/real-calendar';
import { weatherFor, type Weather } from '../time/weather';

/**
 * Corner clock HUD built from the "Little Acre" time UI kit:
 * a leafy double panel with a sky window (time of day / weather),
 * the weekday + season day, a 12-hour clock and a round weather badge.
 *
 * All PNGs in assets/UI/time are pre-scaled to their on-screen size,
 * so they are drawn 1:1 (the engine renders with smoothing disabled).
 */
const files: Record<string, string> = {
  time_panel: new URL('../../assets/UI/time/time_panel.png', import.meta.url).href,
  sky_morning: new URL('../../assets/UI/time/sky_morning.png', import.meta.url).href,
  sky_noon: new URL('../../assets/UI/time/sky_noon.png', import.meta.url).href,
  sky_evening: new URL('../../assets/UI/time/sky_evening.png', import.meta.url).href,
  sky_moon: new URL('../../assets/UI/time/sky_moon.png', import.meta.url).href,
  sky_stars: new URL('../../assets/UI/time/sky_stars.png', import.meta.url).href,
  sky_rain: new URL('../../assets/UI/time/sky_rain.png', import.meta.url).href,
  sky_snow: new URL('../../assets/UI/time/sky_snow.png', import.meta.url).href,
  sky_clouds: new URL('../../assets/UI/time/sky_clouds.png', import.meta.url).href,
  badge_sun: new URL('../../assets/UI/time/badge_sun.png', import.meta.url).href,
  badge_sunrise: new URL('../../assets/UI/time/badge_sunrise.png', import.meta.url).href,
  badge_daylight: new URL('../../assets/UI/time/badge_daylight.png', import.meta.url).href,
  badge_sunset: new URL('../../assets/UI/time/badge_sunset.png', import.meta.url).href,
  badge_moon: new URL('../../assets/UI/time/badge_moon.png', import.meta.url).href,
  badge_moon_stars: new URL('../../assets/UI/time/badge_moon_stars.png', import.meta.url).href,
  badge_cloud: new URL('../../assets/UI/time/badge_cloud.png', import.meta.url).href,
  badge_rain: new URL('../../assets/UI/time/badge_rain.png', import.meta.url).href,
  badge_snow: new URL('../../assets/UI/time/badge_snow.png', import.meta.url).href,
  badge_wind: new URL('../../assets/UI/time/badge_wind.png', import.meta.url).href,
  badge_rainbow: new URL('../../assets/UI/time/badge_rainbow.png', import.meta.url).href,
};
const images = new Map<string, HTMLImageElement>();
for (const [key, url] of Object.entries(files)) {
  const img = new Image();
  img.src = url;
  images.set(key, img);
}

const FONT = '"Pixelify Sans", "Courier New", monospace';
const INK = '#5b3a29';
const INK_SOFT = '#7a5238';
const EMBOSS = '#fff4de';

// Geometry inside time_panel.png (389 × 250).
const PANEL = { w: 389, h: 250 };
const SKY = { x: 64, y: 42, w: 65, h: 66 };
const DATE = { cx: 233, top: 41, bottom: 115 };
const TIME = { cx: 171, cy: 175 };
const BADGE = { cx: 328, cy: 172, size: 58 };

export class TimeHud {
  /** Distance from the top-right corner of the canvas. */
  constructor(private margin = 16) {
    try { void document.fonts?.load(`bold 32px ${FONT}`); } catch { /* fallback font is fine */ }
  }

  get bounds(): { x: number; y: number; w: number; h: number } {
    const d = MakkoEngine.display;
    return { x: d.width - PANEL.w - this.margin, y: this.margin - 6, w: PANEL.w, h: PANEL.h };
  }

  isHovered(): boolean {
    const { x, y, w, h } = this.bounds;
    const i = MakkoEngine.input;
    return i.mouseX >= x + 50 && i.mouseX <= x + w - 30 && i.mouseY >= y + 30 && i.mouseY <= y + h - 40;
  }

  /** Clicking the clock toggles the hemisphere (seasons flip). */
  handleClick(): boolean {
    if (!MakkoEngine.input.isMousePressed(0) || !this.isHovered()) return false;
    RealCalendar.shared.toggleHemisphere();
    return true;
  }

  render(): void {
    const d = MakkoEngine.display;
    const cal = RealCalendar.shared;
    const weather = weatherFor(cal);
    const { x, y } = this.bounds;

    this.draw('time_panel', x, y);
    this.draw(`sky_${skyFor(cal.hour, weather)}`, x + SKY.x, y + SKY.y);
    this.draw(`badge_${badgeFor(cal.hour, weather)}`, x + BADGE.cx - BADGE.size / 2, y + BADGE.cy - BADGE.size / 2);

    // Weekday + day of season
    const dateMid = (DATE.top + DATE.bottom) / 2;
    this.text(cal.weekday, x + DATE.cx, y + dateMid - 13, `bold 34px ${FONT}`, INK);
    this.text(`${cal.season} · Day ${cal.dayOfSeason}`, x + DATE.cx, y + dateMid + 19, `bold 15px ${FONT}`, INK_SOFT);

    // 12-hour clock: big digits + small AM/PM, centred together
    const bigFont = `bold 36px ${FONT}`;
    const smallFont = `bold 22px ${FONT}`;
    const big = d.measureText(cal.clock, { font: bigFont }).width;
    const small = d.measureText(cal.meridiem, { font: smallFont }).width;
    const gap = 8;
    const left = x + TIME.cx - (big + gap + small) / 2;
    this.text(cal.clock, left, y + TIME.cy, bigFont, INK, 'left');
    this.text(cal.meridiem, left + big + gap, y + TIME.cy + 3, smallFont, INK, 'left');

    if (this.isHovered()) this.renderTooltip(weather);
  }

  private renderTooltip(weather: Weather): void {
    const d = MakkoEngine.display;
    const cal = RealCalendar.shared;
    const lines = [
      `${cal.date} · ${cal.phase}`,
      `Weather: ${WEATHER_LABEL[weather]}`,
      `${cal.hemisphere} hemisphere · click to switch`,
    ];
    const font = `14px ${FONT}`;
    const w = Math.max(...lines.map(l => d.measureText(l, { font }).width)) + 28;
    const h = lines.length * 20 + 18;
    const { x, y } = this.bounds;
    const tx = x + PANEL.w - w - 20;
    const ty = y + PANEL.h - 24;
    d.drawRoundRect(tx + 2, ty + 3, w, h, 10, { fill: '#17130f', alpha: .25 });
    d.drawRoundRect(tx, ty, w, h, 10, { fill: '#f7e3c1', stroke: '#8a5a36', lineWidth: 2 });
    lines.forEach((line, i) => d.drawText(line, tx + 14, ty + 19 + i * 20, { font, fill: INK, align: 'left', baseline: 'middle' }));
  }

  private draw(key: string, x: number, y: number): void {
    const img = images.get(key);
    if (img) MakkoEngine.display.drawImage(img, Math.round(x), Math.round(y), undefined, undefined, { pivot: null });
  }

  private text(text: string, x: number, y: number, font: string, fill: string, align: CanvasTextAlign = 'center'): void {
    const d = MakkoEngine.display;
    d.drawText(text, Math.round(x), Math.round(y) + 1, { font, fill: EMBOSS, align, baseline: 'middle' });
    d.drawText(text, Math.round(x), Math.round(y), { font, fill, align, baseline: 'middle' });
  }
}

const WEATHER_LABEL: Record<Weather, string> = {
  sunny: 'Sunny', cloudy: 'Cloudy', rainy: 'Rain', windy: 'Windy', snowy: 'Snow', rainbow: 'Rainbow',
};

const isNight = (hour: number): boolean => hour < 5 || hour >= 20;

/** Square sky window: time of day, replaced by a weather sky when it rains, snows or is overcast. */
export function skyFor(hour: number, weather: Weather): string {
  if (!isNight(hour)) {
    if (weather === 'rainy') return 'rain';
    if (weather === 'snowy') return 'snow';
    if (weather === 'cloudy') return 'clouds';
  }
  if (hour < 5) return 'stars';
  if (hour < 8) return 'morning';
  if (hour < 16) return 'noon';
  if (hour < 20) return 'evening';
  return 'moon';
}

/** Round badge: the day's weather, or the sun's position on clear days, moon at night. */
export function badgeFor(hour: number, weather: Weather): string {
  if (weather === 'rainy') return 'rain';
  if (weather === 'snowy') return 'snow';
  if (weather === 'cloudy') return 'cloud';
  if (isNight(hour)) return hour < 5 ? 'moon_stars' : 'moon';
  if (weather === 'windy') return 'wind';
  if (weather === 'rainbow') return 'rainbow';
  if (hour < 8) return 'sunrise';
  if (hour < 11) return 'sun';
  if (hour < 17) return 'daylight';
  return 'sunset';
}
