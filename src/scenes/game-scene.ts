import { RealCalendar } from '../time/real-calendar';
import { MakkoEngine } from '@makko/engine';
import { BaseScene } from '../scene/base-scene';
import type { Game } from '../game/game';
import { FarmWorld } from '../farm/farm-world';
import { ShopWindow } from '../ui/shop-window';
import { FocusWindow } from '../ui/focus-window';
import { keyToDirection } from '../movement/grid-entity';
import { UILayer } from '../ui/ui-layer';
import { Button, Text, Panel } from '../ui/ui-elements';
import { SaveManager } from '../save/save-manager';
import { FocusFarmSave } from '../save/focus-farm-save';
import { InventoryWindow } from '../ui/inventory-window';

export class GameScene extends BaseScene {
  readonly id = 'game';
  private world = new FarmWorld();
  private ui = new UILayer();
  private saves = new SaveManager<FocusFarmSave>('quiet-acres-farm', 1);
  private saveAvailable = true;
  private tool = 0;
  private shop = new ShopWindow();
  private openShop = new Button({ label: '🌸 SEED SHOP [B]', anchor: 'top-right', margin: 42, y: 76, width: 290, height: 58, size: 'lg' });
  private focus = new FocusWindow();
  private openFocus = new Button({ label: 'F  Focus & Tasks', anchor: 'top-right', margin: 42, width: 290, height: 58, size: 'lg' });
  private zoomIn = new Button({ label: '＋ Zoom', anchor: 'top-right', margin: 42, x: -124, y: 146, width: 118, height: 46, size: 'md' });
  private zoomOut = new Button({ label: '－ Zoom', anchor: 'top-right', margin: 42, y: 146, width: 118, height: 46, size: 'md' });
  private calendarText = new Text({ text: '', size: 'sm', color: 'accent' });
  private calendarDate = new Text({ text: '', size: 'sm', color: 'muted' });
  private hemisphereButton = new Button({ label: '', height: 40, size: 'sm', variant: 'ghost' });
  private inventoryWindow: InventoryWindow | null = null;

  constructor(_game: Game) { super(); }

  init(): void {
    this.inventoryWindow = new InventoryWindow(this.world, () => this.tool, tool => { this.tool = tool; }, () => this.persist());
    this.ui.add(new Panel({ anchor: 'top-left', margin: 40, width: 320, padding: 18, gap: 12, children: [
      this.calendarText, this.calendarDate, this.hemisphereButton,
      new Text({ text: 'Local time • real calendar', size: 'sm', color: 'muted' }),
    ] }));
    this.ui.add(this.openFocus);
    this.ui.add(this.openShop);
    this.ui.add(this.zoomIn);
    this.ui.add(this.zoomOut);
  }

  enter(): void {
    this.focus.disposeSession();
    this.shop.hide();
    this.inventoryWindow?.close();
    this.tool = 0;
    // Retain in-memory progress if browser storage is unavailable.
    if (this.saveAvailable) {
      const loaded: unknown = this.saves.load();
      this.world = new FarmWorld();
      if (FocusFarmSave.isValid(loaded)) this.world.restore(loaded);
    }
    this.inventoryWindow?.setWorld(this.world);
  }

  exit(): void {
    this.focus.disposeSession();
    this.shop.hide();
    this.persist();
  }

  private persist(): void {
    try {
      this.saves.save(this.world.toSave());
      this.saveAvailable = true;
    } catch {
      this.saveAvailable = false;
      this.world.message = 'Browser storage is unavailable. Your farm is safe here until this page closes.';
    }
  }

  handleInput(): void {
    const i = MakkoEngine.input;
    if (this.focus.visible) { this.focus.handleInput(); return; }
    if (this.shop.visible) { this.shop.handleInput(); return; }
    if (i.isKeyPressed('KeyI')) {
      if (this.inventoryWindow?.visible) this.inventoryWindow.close();
      else this.inventoryWindow?.open();
      return;
    }
    if (this.inventoryWindow?.visible) {
      if (i.isKeyPressed('Escape')) { this.inventoryWindow.close(); return; }
      this.inventoryWindow.handleInput();
      return;
    }
    if (i.isKeyPressed('Escape')) { this.switchTo('start'); return; }
    this.inventoryWindow?.handleInput();
    if (i.isKeyPressed('KeyB')) { this.shop.open(this.world, () => this.persist()); return; }
    if (i.isKeyPressed('KeyF')) { this.focus.open(this.world, () => this.persist()); return; }

    // Cycle seeds with Q
    if (i.isKeyPressed('KeyQ')) {
      this.world.cycleSelectedSeed(1);
      this.persist();
    }

    for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD']) {
      if (i.isKeyPressed(key)) {
        const dir = keyToDirection(key);
        if (dir) {
          this.world.player.step(dir, (x, y) => this.world.canEnter(x, y));
          this.persist();
        }
        break;
      }
    }

    for (let j = 0; j < 4; j++) {
      if (i.isKeyPressed(`Digit${j + 1}`)) {
        if (j === 1 && this.tool === 1) {
          // Pressing 2 while Seeds already active cycles seed variety!
          this.world.cycleSelectedSeed(1);
          this.persist();
        } else {
          this.tool = j;
        }
      }
    }
    for (let j = 4; j < 8; j++) {
      if (i.isKeyPressed(`Digit${j + 1}`)) this.inventoryWindow?.selectHotbarSlot(j);
    }

    if (i.isKeyPressed('KeyE') && this.world.useTool(this.tool)) this.persist();
    if (i.isKeyPressed('KeyV') && this.world.sellProduce()) this.persist();
  }

  update(dt: number): void {
    const calendar = RealCalendar.shared;
    calendar.update(dt);
    this.calendarText.text = `${calendar.time}  ·  ${calendar.season}`;
    this.calendarDate.text = calendar.date;
    this.hemisphereButton.label = `${calendar.hemisphere} · Switch`;
    this.focus.update(dt);
    if (this.focus.visible) return;
    if (this.shop.visible) { this.shop.update(dt); return; }

    this.ui.update(dt);
    if (!this.inventoryWindow?.visible) {
      if (this.hemisphereButton.isClicked()) calendar.toggleHemisphere();
      if (this.zoomIn.isClicked()) this.world.zoomIn();
      if (this.zoomOut.isClicked()) this.world.zoomOut();
      if (this.openFocus.isClicked()) this.focus.open(this.world, () => this.persist());
      else if (this.openShop.isClicked()) this.shop.open(this.world, () => this.persist());
    }
  }

  render(): void {
    this.world.render();
    this.ui.render();
    this.focus.render();
    this.shop.render();
    if (!this.focus.visible && !this.shop.visible) {
      this.inventoryWindow?.renderToolbar();
      this.inventoryWindow?.render();
    }
    if (!this.focus.visible) this.renderCoinHud();
  }

  private renderCoinHud(): void {
    const display = MakkoEngine.display;
    const asset = MakkoEngine.staticAsset('ui_window_coins');
    if (!asset || !asset.image.complete || asset.image.naturalWidth <= 0 || asset.image.naturalHeight <= 0) return;

    const sourceWidth = asset.image.naturalWidth;
    const sourceHeight = asset.image.naturalHeight;
    const targetHeight = asset.height;
    const scale = targetHeight / sourceHeight;
    const leftSourceWidth = Math.round(sourceWidth * 0.34);
    const rightSourceWidth = Math.round(sourceWidth * 0.17);
    const middleSourceWidth = sourceWidth - leftSourceWidth - rightSourceWidth;
    const leftWidth = leftSourceWidth * scale;
    const rightWidth = rightSourceWidth * scale;
    const minimumMiddleWidth = middleSourceWidth * scale;
    const balance = String(this.world.coins);
    const fontSize = 32;
    const font = `bold ${fontSize}px "Courier New", monospace`;
    const textWidth = display.measureText(balance, { font }).width;
    const textPadding = 16;
    const middleWidth = Math.max(minimumMiddleWidth, textWidth + textPadding * 2);
    const barWidth = leftWidth + middleWidth + rightWidth;
    const rightMargin = 32;
    const x = display.width - barWidth - rightMargin;
    const y = 220;

    // Keep both decorated ends intact and expand only the plain center strip.
    display.drawImageRegion(
      asset.image, 0, 0, leftSourceWidth, sourceHeight,
      x, y, leftWidth, targetHeight,
    );
    display.drawImageRegion(
      asset.image, leftSourceWidth, 0, middleSourceWidth, sourceHeight,
      x + leftWidth, y, middleWidth, targetHeight,
    );
    display.drawImageRegion(
      asset.image, sourceWidth - rightSourceWidth, 0, rightSourceWidth, sourceHeight,
      x + leftWidth + middleWidth, y, rightWidth, targetHeight,
    );

    display.drawText(balance, x + leftWidth + textPadding, y + targetHeight / 2, {
      font, fill: '#000000', align: 'left', baseline: 'middle',
    });
  }

}
