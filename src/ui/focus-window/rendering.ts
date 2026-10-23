import { MakkoEngine } from '@makko/engine';
import { ActionButton } from './buttons';
import type { ArtworkTransform, FocusData, TaskTextStyle } from './types';
import {
  DEFAULT_TASK_STYLE, INK, LIST_BOTTOM, LIST_TOP, ROW_HEIGHT, TASK_CHECKBOX_X,
  TASK_DELETE_X, TASK_FONT_FAMILIES, TASK_FONT_LABELS, TASK_LABEL_X, TASK_TEXT_COLORS,
} from './types';
import type { Button } from '../ui-elements';

export interface FocusWindowRenderState {
  data: FocusData;
  editingTask: boolean;
  draft: string;
  draftStyle: TaskTextStyle;
  scrollOffset: number;
  artworkTransform(): ArtworkTransform;
  popupAdd: ActionButton;
  popupCancel: ActionButton;
  fontButton: Button;
  smallerTextButton: Button;
  largerTextButton: Button;
  boldButton: Button;
  italicButton: Button;
  colorButton: Button;
}

export class FocusWindowRenderer {
  renderTasks(state: FocusWindowRenderState, artwork: ArtworkTransform): void {
    const d = MakkoEngine.display;
    d.pushClipRect(
      artwork.x + 990 * artwork.scale,
      artwork.y + LIST_TOP * artwork.scale,
      854 * artwork.scale,
      (LIST_BOTTOM - LIST_TOP) * artwork.scale,
    );
    for (let index = 0; index < state.data.tasks.length; index++) {
      const rowY = LIST_TOP + index * ROW_HEIGHT - state.scrollOffset;
      if (rowY + ROW_HEIGHT < LIST_TOP || rowY > LIST_BOTTOM) continue;
      const task = state.data.tasks[index];
      const style = task.style ?? DEFAULT_TASK_STYLE;
      const y = artwork.y + (rowY + ROW_HEIGHT / 2) * artwork.scale;
      const checkboxX = artwork.x + TASK_CHECKBOX_X * artwork.scale;
      const size = 22 * artwork.scale;
      d.drawRoundRect(checkboxX - size / 2, y - size / 2, size, size, 4 * artwork.scale, {
        fill: task.done ? '#69834f' : '#fffdf5', stroke: '#748465', lineWidth: 2 * artwork.scale,
      });
      if (task.done) {
        d.drawLine(checkboxX - 6 * artwork.scale, y, checkboxX - 1 * artwork.scale, y + 5 * artwork.scale, { stroke: '#fff8e8', lineWidth: 2.5 * artwork.scale });
        d.drawLine(checkboxX - 1 * artwork.scale, y + 5 * artwork.scale, checkboxX + 7 * artwork.scale, y - 5 * artwork.scale, { stroke: '#fff8e8', lineWidth: 2.5 * artwork.scale });
      }
      d.drawText(task.label, artwork.x + TASK_LABEL_X * artwork.scale, y, {
        font: `${style.italic ? 'italic ' : ''}${style.bold ? 'bold ' : ''}${style.fontSize * artwork.scale}px ${TASK_FONT_FAMILIES[style.fontIndex]}`,
        fill: task.done ? '#89917f' : TASK_TEXT_COLORS[style.colorIndex], baseline: 'middle',
      });
      const deleteX = artwork.x + TASK_DELETE_X * artwork.scale;
      const mouseX = (MakkoEngine.input.mouseX - artwork.x) / artwork.scale;
      const mouseY = (MakkoEngine.input.mouseY - artwork.y) / artwork.scale;
      const hovered = !state.editingTask && mouseX >= TASK_CHECKBOX_X - 14 && mouseX <= TASK_DELETE_X + 16 && mouseY >= rowY && mouseY <= rowY + ROW_HEIGHT;
      if (hovered) {
        d.drawCircle(deleteX, y, 13 * artwork.scale, { fill: '#c77a66', stroke: '#975b4e', lineWidth: 2 * artwork.scale });
        d.drawLine(deleteX - 5 * artwork.scale, y - 5 * artwork.scale, deleteX + 5 * artwork.scale, y + 5 * artwork.scale, { stroke: '#fff8e8', lineWidth: 2 * artwork.scale });
        d.drawLine(deleteX + 5 * artwork.scale, y - 5 * artwork.scale, deleteX - 5 * artwork.scale, y + 5 * artwork.scale, { stroke: '#fff8e8', lineWidth: 2 * artwork.scale });
      }
    }
    d.popClip();
    if (state.editingTask) this.drawAddTaskPopup(state);
  }

  private drawAddTaskPopup(state: FocusWindowRenderState): void {
    const d = MakkoEngine.display;
    const scale = Math.min(d.width / 1920, d.height / 1080);
    const width = 520 * scale;
    const height = 244 * scale;
    const left = (d.width - width) / 2;
    const top = (d.height - height) / 2;
    d.drawRect(0, 0, d.width, d.height, { fill: '#101219', alpha: 0.58 });
    d.drawRoundRect(left, top, width, height, 18 * scale, { fill: '#fbf7e9', stroke: '#748465', lineWidth: 2 * scale });
    d.drawText('Add a task', left + 28 * scale, top + 38 * scale, { font: `bold ${22 * scale}px monospace`, fill: INK, baseline: 'middle' });
    d.drawRoundRect(left + 28 * scale, top + 66 * scale, 464 * scale, 54 * scale, 8 * scale, { fill: '#fffdf5', stroke: '#aeb29b', lineWidth: 2 * scale });
    d.drawText(state.draft ? `${state.draft}|` : 'Type your task', left + 42 * scale, top + 93 * scale, {
      font: state.draft ? `${state.draftStyle.italic ? 'italic ' : ''}${state.draftStyle.bold ? 'bold ' : ''}${state.draftStyle.fontSize * scale}px ${TASK_FONT_FAMILIES[state.draftStyle.fontIndex]}` : `${17 * scale}px monospace`,
      fill: state.draft ? TASK_TEXT_COLORS[state.draftStyle.colorIndex] : '#969783', baseline: 'middle',
    });
    state.popupAdd.render();
    state.popupCancel.render();
    this.drawTextToolbar(state, state.artworkTransform());
  }

  private drawTextToolbar(state: FocusWindowRenderState, artwork: ArtworkTransform): void {
    const d = MakkoEngine.display;
    const scale = artwork.scale;
    const buttons: Array<{ button: Button; label: string; active?: boolean }> = [
      { button: state.fontButton, label: `Font: ${TASK_FONT_LABELS[state.draftStyle.fontIndex]}` },
      { button: state.smallerTextButton, label: 'A−' },
      { button: state.largerTextButton, label: 'A+' },
      { button: state.boldButton, label: 'B', active: state.draftStyle.bold },
      { button: state.italicButton, label: 'I', active: state.draftStyle.italic },
      { button: state.colorButton, label: 'Color' },
    ];
    for (const item of buttons) {
      const button = item.button;
      const hovered = button.contains(MakkoEngine.input.mouseX, MakkoEngine.input.mouseY);
      d.drawRoundRect(button.x, button.y, button.getWidth(), button.getHeight(), 7 * scale, {
        fill: item.active ? '#8ba77b' : hovered ? '#e6ead8' : '#f4f0df', stroke: '#aeb29b', lineWidth: 2 * scale,
      });
      d.drawText(item.label, button.x + button.getWidth() / 2, button.y + button.getHeight() / 2, {
        font: `${item.label === 'B' ? 'bold ' : ''}${item.label === 'I' ? 'italic ' : ''}${16 * scale}px ${TASK_FONT_FAMILIES[state.draftStyle.fontIndex]}`,
        fill: INK, align: 'center', baseline: 'middle',
      });
    }
  }

  drawControlHitboxes(buttons: Array<{ button: Button; color: string }>, artworkScale: number, indexOffset = 0): void {
    const d = MakkoEngine.display;
    for (const [localIndex, { button, color }] of buttons.entries()) {
      const index = indexOffset + localIndex;
      d.drawRect(button.x, button.y, button.getWidth(), button.getHeight(), { fill: color, alpha: 0.08, stroke: color, lineWidth: 3 });
      const hovered = !button.disabled && button.contains(MakkoEngine.input.mouseX, MakkoEngine.input.mouseY);
      if (!hovered) continue;
      if (index > 2) continue;
      const factor = index === 0 ? 0.88 : index === 1 ? 0.89 : 1;
      const offset = index === 0 ? 17 * artworkScale : index === 1 ? 10 * artworkScale : 0;
      const width = button.getWidth() * factor + (index === 0 ? 5 * artworkScale : 0);
      const height = button.getHeight() * factor;
      d.drawRoundRect(button.x + (button.getWidth() - width) / 2 + offset, button.y + (button.getHeight() - height) / 2, width, height, 14 * artworkScale * factor, {
        fill: index === 0 ? '#82bd78' : index === 1 ? '#d9c9a8' : color, alpha: 0.3,
      });
    }
  }

  drawCountdown(text: string, artwork: ArtworkTransform): void {
    MakkoEngine.display.drawText(text, artwork.x + 590 * artwork.scale, artwork.y + 535 * artwork.scale, {
      font: `bold ${76 * artwork.scale}px monospace`, fill: '#493321', align: 'center', baseline: 'middle',
    });
  }
}
