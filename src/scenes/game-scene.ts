import { RealCalendar } from '../time/real-calendar';
import { MakkoEngine } from '@makko/engine';
import { BaseScene } from '../scene/base-scene';
import type { Game } from '../game/game';
import { FarmWorld } from '../farm/farm-world';
import { formatGrowthTime, getCropDef } from '../farm/crops';
import { ShopWindow } from '../ui/shop-window';
import { FocusWindow } from '../ui/focus-window';
import { keyToDirection } from '../movement/grid-entity';
import { UILayer } from '../ui/ui-layer';
import { Button, Text, Panel } from '../ui/ui-elements';
import { SaveManager } from '../save/save-manager';
import { FocusFarmSave } from '../save/focus-farm-save';
import { InventoryWindow } from '../ui/inventory-window';
import { SeedSelector } from '../ui/seed-selector';

export class GameScene extends BaseScene {
  readonly id = 'game';
  private world = new FarmWorld();
  private ui = new UILayer();
  private saves = new SaveManager<FocusFarmSave>('quiet-acres-farm', 1);
  private saveAvailable = true;
  private tool = 0;
  private shop = new ShopWindow();
  private focus = new FocusWindow();
  private openFocus = new Button({ label: '⏱ FOCUS & TASKS [F]', anchor: 'top-right', margin: 36, width: 280, height: 50, size: 'md' });
  private openShop = new Button({ label: '🌸 SEED SHOP [B]', anchor: 'top-right', margin: 36, y: 58, width: 280, height: 50, size: 'md' });
  private openBackpack = new Button({ label: '🎒 MY BACKPACK [I]', anchor: 'top-right', margin: 36, y: 116, width: 280, height: 50, size: 'md' });
  private zoomIn = new Button({ label: '＋ Zoom', anchor: 'top-right', margin: 36, x: -146, y: 174, width: 134, height: 42, size: 'sm' });
  private zoomOut = new Button({ label: '－ Zoom', anchor: 'top-right', margin: 36, y: 174, width: 134, height: 42, size: 'sm' });
  private calendarText = new Text({ text: '', size: 'sm', color: 'accent' });
  private calendarDate = new Text({ text: '', size: 'sm', color: 'muted' });
  private hemisphereButton = new Button({ label: '', height: 38, size: 'sm', variant: 'ghost' });
  private inventoryWindow: InventoryWindow | null = null;
  private seedSelector: SeedSelector | null = null;

  constructor(_game: Game) { super(); }

  private setActiveTool(tool: number): void {
    this.tool = tool;
    this.seedSelector?.onToolChanged(tool);
  }

  init(): void {
    this.inventoryWindow = new InventoryWindow(
      this.world,
      () => this.tool,
      tool => this.setActiveTool(tool),
      () => this.persist(),
    );
    this.seedSelector = new SeedSelector(
      this.world,
      () => this.tool,
      tool => this.setActiveTool(tool),
      () => this.persist(),
      () => this.shop.open(this.world, () => this.persist()),
    );
    this.ui.add(new Panel({ anchor: 'top-left', margin: 36, width: 310, padding: 16, gap: 10, children: [
      this.calendarText, this.calendarDate, this.hemisphereButton,
      new Text({ text: 'Local time • real calendar', size: 'sm', color: 'muted' }),
    ] }));
    this.ui.add(this.openFocus);
    this.ui.add(this.openShop);
    this.ui.add(this.openBackpack);
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
    this.seedSelector?.setWorld(this.world);
    this.seedSelector?.onToolChanged(this.tool);
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
    if (this.seedSelector?.handleInput()) return;
    this.inventoryWindow?.handleInput();
    if (i.isKeyPressed('KeyB')) { this.shop.open(this.world, () => this.persist()); return; }
    if (i.isKeyPressed('KeyF')) { this.focus.open(this.world, () => this.persist()); return; }

    // Cycle seeds with Q (Shift+Q cycles backward) and auto-equip the Seeds tool
    if (i.isKeyPressed('KeyQ')) {
      const reverse = i.isKeyDown('ShiftLeft') || i.isKeyDown('ShiftRight');
      this.world.cycleSelectedSeed(reverse ? -1 : 1);
      this.setActiveTool(1);
      this.seedSelector?.ensureSelectedVisible();
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
          this.seedSelector?.openPouch();
          this.persist();
        } else {
          this.setActiveTool(j);
        }
      }
    }
    for (let j = 4; j < 8; j++) {
      if (i.isKeyPressed(`Digit${j + 1}`)) this.inventoryWindow?.selectHotbarSlot(j);
    }

    if (this.tool === 3 && i.isMousePressed(0)) {
      const centerX = this.world.originX + this.world.width * 32;
      const centerY = this.world.originY + this.world.height * 32;
      const worldX = centerX + (i.mouseX - centerX) / this.world.zoom;
      const worldY = centerY + (i.mouseY - centerY) / this.world.zoom;
      const gridX = Math.floor((worldX - this.world.originX) / 64);
      const gridY = Math.floor((worldY - this.world.originY) / 64);
      const plot = this.world.plotAt(gridX, gridY);
      if (plot?.planted && this.world.useTool(this.tool, plot)) this.persist();
    }
    if (i.isKeyPressed('KeyE') && this.world.useTool(this.tool)) {
      this.seedSelector?.ensureSelectedVisible();
      this.persist();
    }
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
      else if (this.openBackpack.isClicked()) this.inventoryWindow?.open();
    } else if (this.openBackpack.isClicked()) {
      this.inventoryWindow.close();
    }
  }

  render(): void {
    this.world.render();
    this.ui.render();
    if (!this.focus.visible && !this.shop.visible) {
      this.renderStatusBanner();
      if (!this.inventoryWindow?.visible) {
        this.seedSelector?.render();
      }
      this.inventoryWindow?.renderToolbar();
      this.inventoryWindow?.render();
    }
    this.focus.render();
    this.shop.render();
    if (!this.focus.visible) this.renderCoinHud();
  }

  private renderStatusBanner(): void {
    const d = MakkoEngine.display;
    const bannerW = 840;
    const bannerH = 76;
    const bx = (d.width - bannerW) / 2;
    const by = 36;

    // Warm parchment bulletin board at top-center
    d.drawRoundRect(bx + 3, by + 4, bannerW, bannerH, 14, { fill: '#17130f', alpha: 0.28 });
    d.drawRoundRect(bx, by, bannerW, bannerH, 14, {
      fill: '#463829',
      alpha: 0.92,
      stroke: '#c9a878',
      lineWidth: 2,
    });
    d.drawRoundRect(bx + 5, by + 5, bannerW - 10, bannerH - 10, 10, {
      fill: '#f7edd9',
      stroke: '#d3bc97',
      lineWidth: 1,
    });

    // Primary message line (world.message)
    const msg = this.world.message.length > 86
      ? `${this.world.message.slice(0, 85)}…`
      : this.world.message;
    d.drawText(msg, bx + bannerW / 2, by + 25, {
      font: 'bold 13px monospace',
      fill: '#463625',
      align: 'center',
      baseline: 'middle',
    });

    // Divider line
    d.drawLine(bx + 18, by + 42, bx + bannerW - 18, by + 42, { stroke: '#dfd0b4', lineWidth: 1 });

    // Bottom left: contextual tile prompt
    const hint = this.getTargetActionHint();
    d.drawText(hint.text, bx + 20, by + 57, {
      font: 'bold 12px monospace',
      fill: hint.color,
      align: 'left',
      baseline: 'middle',
    });

    // Bottom right: quick summary of active seed, harvest bag, and focus sessions
    const crop = getCropDef(this.world.selectedSeedId);
    const seedCount = this.world.seeds[crop.id] ?? 0;
    const summary = `🌱 ${crop.name}: ×${seedCount}  ·  🧺 Harvest: ×${this.world.totalProduce}  ·  ⏱ Sessions: ${this.world.sessions}`;
    d.drawText(summary, bx + bannerW - 20, by + 57, {
      font: '11px monospace',
      fill: '#6b5842',
      align: 'right',
      baseline: 'middle',
    });
  }

  private getTargetActionHint(): { text: string; color: string } {
    const besideShippingBin =
      Math.abs(this.world.player.gridX - 2) + Math.abs(this.world.player.gridY - 1) === 1;
    if (besideShippingBin && this.world.totalProduce > 0) {
      return {
        text: `📦 Next to Shipping Bin: Press [V] to ship harvest (+${this.world.totalProduceValue} coins)`,
        color: '#3f6a34',
      };
    }

    const plot = this.world.targetPlot;
    if (!plot) {
      const t = this.world.player.target;
      if (t.y === 1 && (t.x === 1 || t.x === 2)) {
        return {
          text: this.world.totalProduce > 0
            ? `📦 Shipping Bin: Press [V] to sell harvest (+${this.world.totalProduceValue} coins) or [B] for Seed Shop`
            : '🌸 Market Stand: Press [B] to open the Seed Shop',
          color: '#5a4934',
        };
      }
      return { text: 'Use WASD / Arrow Keys to face a farm tile', color: '#78654e' };
    }

    if (!plot.tilled) {
      return this.tool === 0
        ? { text: '⚒ Target tile: Press [E] to till soil with Hoe', color: '#3f6a34' }
        : { text: '💡 Target tile is untilled — switch to Hoe [1] then press [E]', color: '#7a5c38' };
    }

    if (!plot.planted) {
      const crop = getCropDef(this.world.selectedSeedId);
      const count = this.world.seeds[crop.id] ?? 0;
      if (count <= 0) {
        return { text: '🌸 Tilled soil ready — open Seed Shop [B] to buy seeds!', color: '#8c4a3b' };
      }
      return this.tool === 1
        ? { text: `🌱 Target tile: Press [E] to plant ${crop.name} Seeds (×${count} left)`, color: '#3f6a34' }
        : { text: `💡 Tilled soil — press [2] for Seeds (${crop.name}) then [E] to plant`, color: '#5c6b45' };
    }

    const crop = plot.cropDef;
    if (plot.mature) {
      return this.tool === 3
        ? { text: `✦ ${crop.name} is mature! Press [E] to harvest (+${crop.sellPrice} coins)`, color: '#9c6514' }
        : { text: `✦ ${crop.name} is mature! Switch to Harvest [4] then press [E]`, color: '#9c6514' };
    }

    if (!plot.watered) {
      return this.tool === 2
        ? { text: `💧 Target tile: Press [E] to water ${crop.name}`, color: '#2e6b7d' }
        : { text: `💧 ${crop.name} needs water — switch to Watering Can [3] then press [E]`, color: '#2e6b7d' };
    }

    return {
      text: `⏱ ${crop.name} watered (${formatGrowthTime(plot.growth)} / ${formatGrowthTime(crop.growthMinutes)}) — Press [F] to Focus`,
      color: '#48683a',
    };
  }

  private renderCoinHud(): void {
    const display = MakkoEngine.display;
    const asset = MakkoEngine.staticAsset('ui_window_coins');
    const rightMargin = 36;
    const y = 268;

    if (!asset || !asset.image.complete || asset.image.naturalWidth <= 0 || asset.image.naturalHeight <= 0) {
      // Cozy fallback coin badge while image asset loads
      const text = `🪙 ${this.world.coins}`;
      const font = 'bold 22px "Courier New", monospace';
      const w = Math.max(140, display.measureText(text, { font }).width + 36);
      const h = 48;
      const x = display.width - w - rightMargin;
      display.drawRoundRect(x, y, w, h, 12, { fill: '#f5ead4', stroke: '#c9a878', lineWidth: 2 });
      display.drawText(text, x + w / 2, y + h / 2, { font, fill: '#463625', align: 'center', baseline: 'middle' });
      return;
    }

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
    const x = display.width - barWidth - rightMargin;

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
