import { MakkoEngine } from '@makko/engine';
import { BaseScene } from '../scene/base-scene';
import { Menu } from '../menu/menu';
import type { Game } from '../game/game';
import { UILayer, UI_THEME } from '../ui/ui-layer';
import { Text, Panel } from '../ui/ui-elements';

export class StartScene extends BaseScene {
  readonly id = 'start';
  private menu = new Menu({ anchor: 'center', y: 160, panel: true });
  private ui = new UILayer();

  constructor(_game: Game) { super(); }

  init(): void {
    Object.assign(UI_THEME, {
      background: '#101219',
      surface: '#3e3326',
      surfaceHover: '#524332',
      border: '#c9a878',
      borderLight: '#e3c79c',
      text: '#fff8e7',
      textMuted: '#d8c7a8',
      textDim: '#9e8b6e',
      primary: '#69834f',
      primaryHover: '#7a965e',
      primaryActive: '#587041',
      accent: '#f2d38a',
      xp: '#9cc385',
    });
    UI_THEME.font.family = 'monospace';
    UI_THEME.font.sizeSm = 14;
    UI_THEME.font.sizeMd = 16;
    UI_THEME.font.sizeLg = 20;
    UI_THEME.font.sizeXl = 30;
    UI_THEME.font.size2xl = 44;
    this.menu.addItem({ label: 'Enter your farm', action: () => this.switchTo('game') });
    this.ui.add(new Text({ text: 'Q U I E T   A C R E S', size: '2xl', color: 'accent', anchor: 'center', y: -160 }));
    this.ui.add(new Text({ text: 'A little care. A little focus. Something good grows.', size: 'lg', anchor: 'center', y: -85, color: 'muted' }));
    this.ui.add(new Panel({ anchor: 'bottom', margin: 90, padding: 24, gap: 12, children: [
      new Text({ text: 'TILL  →  PLANT  →  WATER  →  FOCUS  →  HARVEST', size: 'md', align: 'center', color: 'accent' }),
      new Text({ text: 'Your crops grow only when a real-time focus block is complete.', size: 'md', align: 'center' }),
      new Text({ text: 'No deadlines. No lost streaks. Just your own gentle pace.', size: 'sm', align: 'center', color: 'muted' }),
    ] }));
  }

  enter(): void { this.menu.setSelectedIndex(0); }

  handleInput(): void {
    const i = MakkoEngine.input;
    if (i.isKeyPressed('ArrowUp')) this.menu.navigateUp();
    if (i.isKeyPressed('ArrowDown')) this.menu.navigateDown();
    if (i.isKeyPressed('Enter') || i.isKeyPressed('Space')) this.menu.select();
  }

  update(dt: number): void { this.menu.update(dt); this.ui.update(dt); }

  render(): void {
    this.ui.render();
    this.menu.render();
  }
}
