import type { FocusData, TaskTextStyle } from './types';
import { TASK_FONT_FAMILIES, TASK_LIMIT, TASK_TEXT_COLORS } from './types';

export function isFocusData(value: unknown): value is FocusData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<FocusData>;
  return data.version === 1 && Array.isArray(data.tasks) && data.tasks.length <= TASK_LIMIT &&
    data.tasks.every(task => task && typeof task.label === 'string' && task.label.length <= 48 && typeof task.done === 'boolean') &&
    !!data.days && typeof data.days === 'object' && !Array.isArray(data.days) &&
    Object.entries(data.days).every(([date, day]) =>
      /^\d{4}-\d{2}-\d{2}$/.test(date) && day && Number.isFinite(day.sessions) && day.sessions >= 0 &&
      Number.isFinite(day.minutes) && day.minutes >= 0);
}

export function isTaskTextStyle(value: unknown): value is TaskTextStyle {
  if (!value || typeof value !== 'object') return false;
  const style = value as Partial<TaskTextStyle>;
  return Number.isInteger(style.fontIndex) && (style.fontIndex ?? -1) >= 0 && (style.fontIndex ?? 99) < TASK_FONT_FAMILIES.length &&
    Number.isFinite(style.fontSize) && (style.fontSize ?? 0) >= 14 && (style.fontSize ?? 99) <= 30 &&
    typeof style.bold === 'boolean' && typeof style.italic === 'boolean' &&
    Number.isInteger(style.colorIndex) && (style.colorIndex ?? -1) >= 0 && (style.colorIndex ?? 99) < TASK_TEXT_COLORS.length;
}

export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
