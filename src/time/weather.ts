import type { RealCalendar } from './real-calendar';

export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'snowy' | 'rainbow';

/** Small deterministic hash so every device shows the same weather for a date. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
}

/** Cozy, never-punishing daily weather: purely cosmetic, rolled once per local date. */
export function weatherFor(calendar: RealCalendar): Weather {
  const roll = hash(`${calendar.dateKey}|${calendar.season}`);
  const table: Record<RealCalendar['season'], Array<[Weather, number]>> = {
    Spring: [['sunny', .40], ['cloudy', .20], ['rainy', .22], ['windy', .08], ['rainbow', .10]],
    Summer: [['sunny', .62], ['cloudy', .14], ['rainy', .10], ['windy', .06], ['rainbow', .08]],
    Autumn: [['sunny', .32], ['cloudy', .26], ['rainy', .22], ['windy', .16], ['rainbow', .04]],
    Winter: [['sunny', .26], ['cloudy', .26], ['snowy', .38], ['windy', .10]],
  };
  let acc = 0;
  for (const [weather, chance] of table[calendar.season]) { acc += chance; if (roll < acc) return weather; }
  return 'sunny';
}
