import { MakkoEngine } from '@makko/engine';
import { Button } from '../ui-elements';
import { ActionButton } from './buttons';
import type { ArtworkTransform } from './types';

export function artworkTransform(): ArtworkTransform {
  const display = MakkoEngine.display;
  const scale = Math.min(display.width / 1920, display.height / 1080);
  const width = 1920 * scale;
  const height = 1080 * scale;
  return { x: (display.width - width) / 2, y: (display.height - height) / 2, scale, width, height };
}

export function setArtworkBounds(button: Button, artwork: ArtworkTransform, x: number, y: number, width: number, height: number): void {
  button.x = artwork.x + x * artwork.scale;
  button.y = artwork.y + y * artwork.scale;
  button.width = width * artwork.scale;
  button.height = height * artwork.scale;
}

export function layoutPopup(add: ActionButton, cancel: ActionButton): void {
  const display = MakkoEngine.display;
  const scale = Math.min(display.width / 1920, display.height / 1080);
  const left = (display.width - 520 * scale) / 2;
  const top = (display.height - 244 * scale) / 2;
  add.x = left + 98 * scale;
  add.y = top + 174 * scale;
  add.width = cancel.width = 146 * scale;
  add.height = cancel.height = 48 * scale;
  cancel.x = left + 276 * scale;
  cancel.y = add.y;
}

export function layoutToolbar(buttons: Button[]): void {
  const display = MakkoEngine.display;
  const scale = Math.min(display.width / 1920, display.height / 1080);
  const x = (display.width - 520 * scale) / 2 + 28 * scale;
  const y = (display.height - 244 * scale) / 2 + 130 * scale;
  const widths = [118, 42, 42, 42, 42, 82];
  let cursor = x;
  buttons.forEach((button, index) => {
    button.x = cursor;
    button.y = y;
    button.width = (widths[index] ?? 42) * scale;
    button.height = 32 * scale;
    cursor += button.width + 6 * scale;
  });
}

export function layoutTaskInput(input: HTMLInputElement | null): void {
  if (!input) return;
  const canvas = document.getElementById('gameCanvas');
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const bounds = canvas.getBoundingClientRect();
  const display = MakkoEngine.display;
  if (bounds.width <= 0 || bounds.height <= 0 || display.width <= 0 || display.height <= 0) return;
  const scale = Math.min(display.width / 1920, display.height / 1080);
  const left = (display.width - 520 * scale) / 2;
  const top = (display.height - 244 * scale) / 2;
  const scaleX = bounds.width / display.width;
  const scaleY = bounds.height / display.height;
  input.style.left = `${bounds.left + (left + 28 * scale) * scaleX}px`;
  input.style.top = `${bounds.top + (top + 66 * scale) * scaleY}px`;
  input.style.width = `${464 * scale * scaleX}px`;
  input.style.height = `${54 * scale * scaleY}px`;
  input.style.paddingLeft = `${14 * scale * scaleX}px`;
  input.style.font = `${17 * scale * scaleY}px monospace`;
}

export function pointerToDisplay(event: PointerEvent): { x: number; y: number } | null {
  const canvas = document.getElementById('gameCanvas');
  if (!(canvas instanceof HTMLCanvasElement)) return null;
  const bounds = canvas.getBoundingClientRect();
  const display = MakkoEngine.display;
  if (bounds.width <= 0 || bounds.height <= 0) return null;
  const x = (event.clientX - bounds.left) * display.width / bounds.width;
  const y = (event.clientY - bounds.top) * display.height / bounds.height;
  return x < 0 || y < 0 || x > display.width || y > display.height ? null : { x, y };
}
