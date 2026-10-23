export interface FocusData {
  version: number;
  tasks: { label: string; done: boolean; style?: TaskTextStyle }[];
  days: Record<string, { sessions: number; minutes: number }>;
}

export interface TaskTextStyle {
  fontIndex: number;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  colorIndex: number;
}

export interface ArtworkTransform {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

export type Destination = 'focus' | 'tasks' | 'farm' | 'shop';
export type Action = 'play' | 'pause' | 'reset' | 'add' | 'cancel';
export type FocusClickTarget =
  | 'play' | 'pause' | 'reset' | 'addTask' | 'deleteTask' | 'toggleTask'
  | 'font' | 'smallerText' | 'largerText' | 'toggleBold' | 'toggleItalic'
  | 'cycleTextColor' | 'navFocus' | 'navTasks' | 'navFarm' | 'navShop'
  | 'popupAdd' | 'popupCancel';

export const INK = '#344936';
export const GREEN = '#304d36';
export const TASK_LIMIT = 30;
export const ROW_HEIGHT = 64;
export const LIST_TOP = 440;
export const LIST_BOTTOM = 926;
export const TASK_CHECKBOX_X = 1052;
export const TASK_DELETE_X = 1812;
export const TASK_LABEL_X = 1080;
export const TASK_FONT_FAMILIES = ['Arial, sans-serif', 'Georgia, serif', 'cursive'] as const;
export const TASK_FONT_LABELS = ['Sans', 'Serif', 'Script'] as const;
export const TASK_TEXT_COLORS = ['#445641', '#3d6670', '#9a5946'] as const;
export const DEFAULT_TASK_STYLE: TaskTextStyle = {
  fontIndex: 0,
  fontSize: 18,
  bold: false,
  italic: false,
  colorIndex: 0,
};
