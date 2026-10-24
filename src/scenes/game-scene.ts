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
import { Button } from '../ui/ui-elements';
import { SaveManager } from '../save/save-manager';
import { FocusFarmSave } from '../save/focus-farm-save';
import { InventoryWindow } from '../ui/inventory-window';
import { SeedSelector } from '../ui/seed-selector';
import { TimeHud } from '../ui/time-hud';

/** Buttons on the right start below the corner clock. */
const RIGHT_COLUMN_Y = 236;

export class GameScene extends BaseScene {
  readonly id = 'game';
  private world = new FarmWorld();
  private ui = new UILayer();
  private saves = new SaveManager<FocusFarmSave>('quiet-acres-farm', 1);
  private saveAvailable = true;
  private tool = 0;
  private shop = new ShopWindow();
  private focus = new FocusWindow();
  private openFocus = new Button({ label: '⏱ FOCUS & TASKS [F]', anchor: 'top-right', margin: 24, y: RIGHT_COLUMN_Y, width: 312, height: 48, size: 'md' });
  private openShop = new Button({ label: '🌸 SEED SHOP [B]', anchor: 'top-right', margin: 24, y: RIGHT_COLUMN_Y + 56, width: 312, height: 48, size: 'md' });
  private openBackpack = new Button({ label: '🎒 MY BACKPACK [I]', anchor: 'top-right', margin: 24, y: RIGHT_COLUMN_Y + 112, width: 312, height: 48, size: 'md' });
  private zoomIn = new Button({ label: '＋ ZOOM IN', anchor: 'top-right', margin: 24, x: -160, y: RIGHT_COLUMN_Y + 168, width: 152, height: 40, size: 'sm' });
  private zoomOut = new Button({ label: '－ ZOOM OUT', anchor: 'top-right', margin: 24, y: RIGHT_COLUMN_Y + 168, width: 152, height: 40, size: 'sm' });
  private timeHud = new TimeHud();
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
    if (i.isMousePressed(0) && this.isCoinShopButtonHovered(i.mouseX, i.mouseY)) {
      this.inventoryWindow?.close();
      this.shop.open(this.world, () => this.persist());
      return;
    }
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
      const { gridX, gridY } = this.world.screenToGrid(i.mouseX, i.mouseY);
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
    this.focus.update(dt);
    if (this.focus.visible) return;
    if (this.shop.visible) { this.shop.update(dt); return; }

    this.ui.update(dt);
    if (!this.inventoryWindow?.visible) {
      this.timeHud.handleClick();
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
    if (!this.focus.visible && !this.shop.visible) this.timeHud.render();
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

  private getCoinShopButtonBounds(): { x: number; y: number; w: number; h: number } {
    const cardX = 24;
    const cardY = 24;
    const cardW = 316;
    const cardH = 52;
    const w = 88;
    const h = 30;
    return {
      x: cardX + cardW - w - 12,
      y: cardY + (cardH - h) / 2,
      w,
      h,
    };
  }

  private isCoinShopButtonHovered(mx: number, my: number): boolean {
    if (this.shop.visible || this.focus.visible) return false;
    const b = this.getCoinShopButtonBounds();
    return mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h;
  }

  private renderCoinHud(): void {
    const d = MakkoEngine.display;
    const input = MakkoEngine.input;
    const balanceText = `${this.world.coins.toLocaleString()} Coins`;
    const balanceFont = this.shop.visible ? 'bold 18px monospace' : 'bold 20px monospace';
    const textWidth = Math.ceil(d.measureText(balanceText, { font: balanceFont }).width);

    const coinScale = this.shop.visible ? 2.25 : 2.5;
    const coinSize = Math.round(12 * coinScale);
    const padLeft = this.shop.visible ? 14 : 16;
    const gap = 10;
    const padRight = 16;
    const textXOffset = padLeft + coinSize + gap;

    const w = this.shop.visible ? textXOffset + textWidth + padRight : 316;
    const h = this.shop.visible ? 46 : 52;
    const x = this.shop.visible ? Math.round((d.width - w) / 2) : 24;
    const y = this.shop.visible ? 42 : 24;

    // Outer wooden frame with drop shadow matching the farm UI panels
    d.drawRoundRect(x + 3, y + 4, w, h, 14, { fill: '#17130f', alpha: 0.28 });
    d.drawRoundRect(x, y, w, h, 14, {
      fill: '#3e3326',
      stroke: '#c9a878',
      lineWidth: 2,
    });

    // Inner warm parchment card with gilded border
    d.drawRoundRect(x + 5, y + 5, w - 10, h - 10, 10, {
      fill: '#f7edd9',
      stroke: '#d8bc8c',
      lineWidth: 1,
    });

    // Retro 12x12 pixel-art gold coin icon
    this.drawRetroCoinIcon(x + padLeft, y + Math.round((h - coinSize) / 2), coinScale);

    // Vertically centered gold balance
    d.drawText(balanceText, x + textXOffset, y + h / 2, {
      font: balanceFont,
      fill: '#463219',
      align: 'left',
      baseline: 'middle',
    });

    if (!this.shop.visible) {
      // Interactive "Shop [B]" button next to the gold balance
      const btn = this.getCoinShopButtonBounds();
      const hovered = this.isCoinShopButtonHovered(input.mouseX, input.mouseY);
      d.drawRoundRect(btn.x, btn.y + 1, btn.w, btn.h, 8, {
        fill: '#17130f',
        alpha: 0.16,
      });
      d.drawRoundRect(btn.x, btn.y, btn.w, btn.h, 8, {
        fill: hovered ? '#7a965e' : '#69834f',
        stroke: hovered ? '#e6cfa3' : '#4a5e36',
        lineWidth: 1.5,
      });
      d.drawText('Shop [B]', btn.x + btn.w / 2, btn.y + btn.h / 2, {
        font: 'bold 12px monospace',
        fill: '#fff8e7',
        align: 'center',
        baseline: 'middle',
      });
    }
  }

  private drawRetroCoinIcon(originX: number, originY: number, pixelSize: number): void {
    const d = MakkoEngine.display;
    const palette: Record<string, string> = {
      B: '#5a3508', // dark bronze pixel outline
      S: '#c47812', // warm amber shadow bevel
      G: '#f4b825', // classic retro gold body
      Y: '#ffe259', // bright yellow highlight
      W: '#fff9c4', // specular glint
    };
    const rows = [
      '....BBBB....',
      '..BBYYYGBB..',
      '.BYWWYGGGSB.',
      '.BYWYGBSGSB.',
      'BYYYGBWGGGSB',
      'BYGGGBWGGGSB',
      'BGGGGBYGGGSB',
      'BGGGGBYGGSSB',
      '.BGGGGBSSSB.',
      '.BSGGGGSSSB.',
      '..BBSSSSBB..',
      '....BBBB....',
    ];

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const fill = palette[row[c]];
        if (!fill) continue;
        d.drawRect(
          originX + c * pixelSize,
          originY + r * pixelSize,
          Math.ceil(pixelSize),
          Math.ceil(pixelSize),
          { fill },
        );
      }
    }
  }
}
