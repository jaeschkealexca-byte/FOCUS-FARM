import { MakkoEngine, type IDisplay } from '@makko/engine';
import { GridEntity, DirectionVectors, type Direction } from '../movement/grid-entity';

export class FarmPlayer extends GridEntity {
  constructor() {
    super(2, 5);
    this.direction = 'right';
  }

  get target(): { x: number; y: number } {
    const v = DirectionVectors[this.direction];
    return { x: this.gridX + v.dx, y: this.gridY + v.dy };
  }

  step(direction: Direction, canEnter: (x: number, y: number) => boolean): void {
    this.setDirection(direction);
    const t = this.target;
    if (canEnter(t.x, t.y)) this.move();
  }

  render(originX: number, originY: number, display: IDisplay = MakkoEngine.display): void {
    const d = display;
    const x = originX + this.gridX * 64 + 32;
    const y = originY + this.gridY * 64 + 32;
    d.drawEllipse(x, y + 21, 19, 7, { fill: '#345b43', alpha: 0.45 });
    d.drawRect(x - 13, y + 13, 10, 10, { fill: '#3b4140' });
    d.drawRect(x + 3, y + 13, 10, 10, { fill: '#3b4140' });
    d.drawRect(x - 15, y - 3, 30, 23, { fill: '#e6a46f' });
    d.drawRect(x - 10, y + 1, 20, 17, { fill: '#497f89' });
    d.drawRect(x - 11, y - 19, 22, 18, { fill: '#f4cc98' });
    d.drawRect(x - 15, y - 25, 30, 12, { fill: '#d8b469' });
    d.drawRect(x - 23, y - 17, 46, 6, { fill: '#efd18c' });
    d.drawRect(x - 15, y - 20, 30, 4, { fill: '#937c51' });
    const v = DirectionVectors[this.direction];
    d.drawRect(x + v.dx * 7 - 2, y - 7 + v.dy * 3, 4, 4, { fill: '#39433b' });
  }
}
