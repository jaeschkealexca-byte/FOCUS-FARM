import { RealCalendar } from '../time/real-calendar';
import { MakkoEngine } from '@makko/engine';
import { UIWidget } from './ui-layer';

/** Panoramic, hand-drawn pixel meadow banner; no screenshot is used as UI. */
export class FocusLandscape extends UIWidget {
  constructor(private meadow = true) { super({ height: meadow ? 180 : 112 }); }

  protected measureWidth(): number { return 1792; }
  protected measureHeight(): number { return this.meadow ? 180 : 112; }

  renderAt(x: number, y: number, width: number, height: number): void {
    this.x = x;
    this.y = y;
    this.setAssignedSize(width, height);
    this.render();
    this.setAssignedSize(undefined, undefined);
  }

  protected draw(): void {
    const d = MakkoEngine.display;
    const x = this.x;
    const y = this.y;
    const w = this.getWidth();
    const h = this.getHeight();
    const palette = RealCalendar.shared.palette;

    d.drawRect(x, y, w, h, { fill: palette.sky });
    d.drawRect(x, y + 92, w, 38, { fill: '#b8d0ad' });
    d.drawPolygon([
      { x, y: y + 121 },
      { x: x + w * 0.18, y: y + 63 },
      { x: x + w * 0.33, y: y + 121 },
      { x: x + w * 0.5, y: y + 72 },
      { x: x + w * 0.68, y: y + 125 },
      { x: x + w * 0.83, y: y + 70 },
      { x: x + w, y: y + 118 },
      { x: x + w, y: y + 148 },
      { x, y: y + 148 },
    ], { fill: '#93b58a' });
    d.drawPolygon([
      { x, y: y + 139 },
      { x: x + w * 0.27, y: y + 99 },
      { x: x + w * 0.42, y: y + 141 },
      { x: x + w * 0.65, y: y + 102 },
      { x: x + w * 0.79, y: y + 140 },
      { x: x + w, y: y + 105 },
      { x: x + w, y: y + 159 },
      { x, y: y + 159 },
    ], { fill: '#78976e' });

    // Small block clouds and a soft sun.
    d.drawRect(x + 104, y + 27, 96, 10, { fill: '#fff8e8' });
    d.drawRect(x + 126, y + 17, 55, 11, { fill: '#fff8e8' });
    d.drawRect(x + w * 0.43, y + 39, 75, 8, { fill: '#fff8e8' });
    d.drawRect(x + w * 0.45, y + 30, 45, 10, { fill: '#fff8e8' });
    d.drawRect(x + w * 0.78, y + 24, 42, 42, { fill: '#f2d38a' });
    d.drawRect(x + w * 0.78 - 7, y + 32, 7, 27, { fill: '#f2d38a' });
    d.drawRect(x + w * 0.78 + 42, y + 32, 7, 27, { fill: '#f2d38a' });

    // Distant cottage among orchard trees.
    const houseX = x + w * 0.69;
    d.drawRect(houseX, y + 79, 124, 62, { fill: '#f6edda', stroke: '#665942', lineWidth: 3 });
    d.drawPolygon([
      { x: houseX - 12, y: y + 83 },
      { x: houseX + 62, y: y + 35 },
      { x: houseX + 136, y: y + 83 },
    ], { fill: '#a75f53', stroke: '#665942', lineWidth: 3 });
    d.drawRect(houseX + 50, y + 104, 23, 37, { fill: '#76563d' });
    d.drawRect(houseX + 14, y + 94, 21, 20, { fill: '#a9c9bd', stroke: '#665942', lineWidth: 2 });
    d.drawRect(houseX + 89, y + 94, 21, 20, { fill: '#a9c9bd', stroke: '#665942', lineWidth: 2 });
    d.drawRect(houseX + 23, y + 95, 3, 18, { fill: '#f6edda' });
    d.drawRect(houseX + 90, y + 102, 19, 3, { fill: '#f6edda' });

    const drawTree = (tx: number, ty: number, scale: number): void => {
      d.drawRect(tx + 20 * scale, ty + 35 * scale, 12 * scale, 54 * scale, { fill: '#72543a' });
      d.drawRect(tx + 2 * scale, ty + 15 * scale, 48 * scale, 39 * scale, { fill: '#537b4b' });
      d.drawRect(tx + 11 * scale, ty + 2 * scale, 31 * scale, 27 * scale, { fill: '#709664' });
      d.drawRect(tx + 9 * scale, ty + 24 * scale, 12 * scale, 8 * scale, { fill: '#86aa72' });
    };
    drawTree(x + 270, y + 46, 1.05);
    drawTree(x + 510, y + 61, 0.78);
    drawTree(x + w - 270, y + 50, 0.9);
    drawTree(x + w - 124, y + 60, 0.7);

    // Foreground rolling meadow and continuous split-rail fence.
    d.drawRect(x, y + 141, w, 39, { fill: palette.grass[2] });
    d.drawRect(x, y + 166, w, 14, { fill: palette.grass[3] });
    d.drawRect(x + 24, y + 142, w - 48, 5, { fill: '#916e4c' });
    d.drawRect(x + 24, y + 160, w - 48, 5, { fill: '#916e4c' });
    for (let post = x + 34; post < x + w - 20; post += 112) {
      d.drawRect(post, y + 134, 8, 38, { fill: '#73543a' });
      d.drawRect(post + 2, y + 136, 3, 32, { fill: '#b08a5d' });
    }
    for (let tuft = x + 12; tuft < x + w; tuft += 55) {
      const flower = Math.floor((tuft - x) / 55) % 4 === 0;
      d.drawRect(tuft, y + 171, 3, 8, { fill: '#446d3e' });
      d.drawRect(tuft + 5, y + 168, 3, 11, { fill: '#5b7e48' });
      if (flower) d.drawRect(tuft + 1, y + 166, 5, 5, { fill: '#d78f83' });
    }

    if (RealCalendar.shared.nightAlpha > 0) {
      d.drawRect(x, y, w, h, { fill: '#493d65', alpha: RealCalendar.shared.nightAlpha });
    }
  }
}
