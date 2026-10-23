import { MakkoEngine } from '@makko/engine';
import { Button, type ButtonOptions } from '../ui-elements';
import { GREEN, INK, type Action, type Destination } from './types';

export class SidebarButton extends Button {
  selected = false;
  private readonly destination: Destination;

  constructor(options: ButtonOptions, destination: Destination) {
    super(options);
    this.destination = destination;
  }

  protected draw(): void {
    const d = MakkoEngine.display;
    const hovered = !this.disabled && this.contains(MakkoEngine.input.mouseX, MakkoEngine.input.mouseY);
    d.drawRoundRect(this.x, this.y, this.getWidth(), this.getHeight(), 12, {
      fill: hovered ? '#3a5a3e' : GREEN,
      stroke: this.selected ? '#d5c89a' : '#61775d',
      lineWidth: this.selected ? 3 : 1,
    });
    if (this.selected) {
      d.drawRoundRect(this.x + 4, this.y + 4, this.getWidth() - 8, this.getHeight() - 8, 9, { stroke: '#789071', lineWidth: 1 });
      d.drawRect(this.x + 1, this.y + 18, 5, this.getHeight() - 36, { fill: '#d5c89a' });
    }
    const cx = this.x + this.getWidth() / 2;
    const cy = this.y + 30;
    if (this.destination === 'focus') {
      d.drawCircle(cx, cy, 13, { stroke: '#f4ecd5', lineWidth: 3 });
      d.drawLine(cx, cy, cx, cy - 8, { stroke: '#f4ecd5', lineWidth: 2 });
      d.drawLine(cx, cy, cx + 7, cy + 4, { stroke: '#f4ecd5', lineWidth: 2 });
    } else if (this.destination === 'tasks') {
      for (let row = 0; row < 3; row++) {
        const yy = cy - 11 + row * 11;
        d.drawRoundRect(cx - 19, yy - 4, 9, 9, 2, { stroke: '#f4ecd5', lineWidth: 2 });
        d.drawLine(cx - 5, yy, cx + 18, yy, { stroke: '#f4ecd5', lineWidth: 2 });
      }
    } else if (this.destination === 'farm') {
      d.drawPolygon([
        { x: cx - 18, y: cy - 1 }, { x: cx, y: cy - 17 }, { x: cx + 18, y: cy - 1 },
        { x: cx + 15, y: cy + 1 }, { x: cx + 15, y: cy + 14 }, { x: cx - 15, y: cy + 14 },
        { x: cx - 15, y: cy + 1 },
      ], { fill: '#f4ecd5' });
      d.drawRect(cx - 3, cy + 3, 7, 11, { fill: GREEN });
    } else {
      d.drawRect(cx - 17, cy - 8, 34, 21, { stroke: '#f4ecd5', lineWidth: 2 });
      d.drawLine(cx - 20, cy - 9, cx + 20, cy - 9, { stroke: '#f4ecd5', lineWidth: 3 });
      d.drawLine(cx - 17, cy - 2, cx + 17, cy - 2, { stroke: '#f4ecd5', lineWidth: 2 });
      d.drawLine(cx - 8, cy - 8, cx - 8, cy - 2, { stroke: '#f4ecd5', lineWidth: 2 });
      d.drawLine(cx + 3, cy - 8, cx + 3, cy - 2, { stroke: '#f4ecd5', lineWidth: 2 });
    }
    d.drawText(this.label, cx, this.y + 66, { font: 'bold 17px monospace', fill: '#f4ecd5', align: 'center', baseline: 'middle' });
  }
}

export class ActionButton extends Button {
  private readonly action: Action;

  constructor(options: ButtonOptions, action: Action) {
    super(options);
    this.action = action;
  }

  protected draw(): void {
    const d = MakkoEngine.display;
    const hovered = !this.disabled && this.contains(MakkoEngine.input.mouseX, MakkoEngine.input.mouseY);
    let fill = hovered ? '#78935c' : '#69834f';
    let border = '#465e3d';
    let text = '#fff8e8';
    if (this.action === 'pause' || this.action === 'cancel') {
      fill = hovered ? '#eee8d9' : '#e4dece';
      border = '#aaa58f';
      text = INK;
    } else if (this.action === 'reset') {
      fill = hovered ? '#a95b4a' : '#c77a66';
      border = '#975b4e';
    } else if (this.action === 'add') {
      fill = hovered ? '#e4ead7' : '#edf0e1';
      border = '#9ca987';
      text = INK;
    }
    d.drawRoundRect(this.x, this.y, this.getWidth(), this.getHeight(), 11, {
      fill: this.disabled ? '#d6d3c8' : fill, stroke: border, lineWidth: 2,
    });
    d.drawText(this.label, this.x + this.getWidth() / 2, this.y + this.getHeight() / 2, {
      font: 'bold 19px monospace', fill: this.disabled ? '#85877b' : text, align: 'center', baseline: 'middle',
    });
  }
}

export class InvisibleButton extends Button {
  protected draw(): void {}
}
