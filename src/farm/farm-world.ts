import { RealCalendar } from '../time/real-calendar';
import { MakkoEngine, type IDisplay } from '@makko/engine';
import { FarmPlayer } from './farm-player';
import { CropPlot } from './crop-plot';
import { FocusFarmSave } from '../save/focus-farm-save';
import { createFarmZoomDisplay } from './farm-zoom';
import { getCropDef, CROP_LIST, formatGrowthTime } from './crops';

export class FarmWorld {
  readonly width = 18;
  readonly height = 10;
  readonly originX = 384;
  readonly originY = 252;
  zoom = 1;
  player = new FarmPlayer();
  plots = Array.from({ length: 180 }, () => new CropPlot());

  seeds: Record<string, number> = { carrot: 3, cabbage: 2, strawberry: 1 };
  produce: Record<string, number> = {};
  selectedSeedId = 'carrot';
  toolbarSlots: Array<string | null> = [null, null, null, null];

  coins = 50;
  sessions = 0;
  minutes = 0;
  message = 'A small beginning. Press E to till the tile in front of you.';

  zoomIn(): void {
    this.zoom = Math.min(3, Math.round((this.zoom + 0.1) * 10) / 10);
  }

  zoomOut(): void {
    this.zoom = Math.max(0.75, Math.round((this.zoom - 0.1) * 10) / 10);
  }

  get totalSeeds(): number {
    return Object.values(this.seeds).reduce((sum, count) => sum + count, 0);
  }

  get totalProduce(): number {
    return Object.values(this.produce).reduce((sum, count) => sum + count, 0);
  }

  get totalProduceValue(): number {
    let total = 0;
    for (const [id, count] of Object.entries(this.produce)) {
      if (count > 0) {
        total += getCropDef(id).sellPrice * count;
      }
    }
    return total;
  }

  canEnter(x: number, y: number): boolean {
    return (
      Number.isInteger(x) &&
      Number.isInteger(y) &&
      x >= 0 &&
      y >= 0 &&
      x < this.width &&
      y < this.height &&
      !(y === 1 && (x === 1 || x === 2))
    );
  }

  plotAt(x: number, y: number): CropPlot | undefined {
    return this.canEnter(x, y) ? this.plots[y * this.width + x] : undefined;
  }

  get targetPlot(): CropPlot | undefined {
    const t = this.player.target;
    return this.plotAt(t.x, t.y);
  }

  cycleSelectedSeed(dir = 1): void {
    const ownedIds = Object.keys(this.seeds).filter(id => (this.seeds[id] ?? 0) > 0);
    if (ownedIds.length === 0) {
      this.message = 'Your seed pouch is empty! Open the Seed Shop [B] to buy seeds.';
      return;
    }
    const currentIndex = ownedIds.indexOf(this.selectedSeedId);
    const nextIndex = currentIndex < 0
      ? 0
      : (currentIndex + dir + ownedIds.length) % ownedIds.length;
    this.selectedSeedId = ownedIds[nextIndex];
    const crop = getCropDef(this.selectedSeedId);
    const count = this.seeds[crop.id] ?? 0;
    this.message = `Selected: ${crop.name} Seeds (${count} in pouch). Press E to plant.`;
  }

  useTool(tool: number, plot: CropPlot | undefined = this.targetPlot): boolean {
    const p = plot;
    if (!p) {
      this.message = 'That tile is beyond the farm or reserved for the market.';
      return false;
    }

    if (tool === 0 && !p.tilled) {
      p.tilled = true;
      this.message = 'Fresh soil. Select Seeds [2], then press E to plant.';
      return true;
    }

    if (tool === 1) {
      if (!p.tilled) {
        this.message = 'Seeds need empty, tilled soil. Use Hoe [1] first.';
        return false;
      }
      if (p.planted) {
        this.message = 'A crop is already growing here.';
        return false;
      }

      // Ensure we have seeds of selected type, or switch to one we have
      let seedId = this.selectedSeedId;
      if ((this.seeds[seedId] ?? 0) <= 0) {
        const other = Object.keys(this.seeds).find(id => (this.seeds[id] ?? 0) > 0);
        if (other) {
          seedId = other;
          this.selectedSeedId = other;
        } else {
          this.message = 'No seeds left in your pouch! Open SEED SHOP [B] to buy more.';
          return false;
        }
      }

      const crop = getCropDef(seedId);
      p.planted = true;
      p.cropId = seedId;
      p.growth = 0;
      p.previewGrowth = null;
      p.watered = false;
      this.seeds[seedId] = Math.max(0, (this.seeds[seedId] ?? 0) - 1);

      this.message = `Planted ${crop.name} seeds! Water with [3] then E. (${formatGrowthTime(crop.growthMinutes)} focus needed)`;

      // If ran out of this seed, auto-cycle to another available seed
      if ((this.seeds[seedId] ?? 0) <= 0) {
        delete this.seeds[seedId];
        this.toolbarSlots = this.toolbarSlots.map(key => key === `seed:${seedId}` ? null : key);
        const next = Object.keys(this.seeds).find(id => (this.seeds[id] ?? 0) > 0);
        if (next) this.selectedSeedId = next;
      }
      return true;
    }

    if (tool === 2) {
      if (!p.planted) {
        this.message = 'Plant a seed before watering with [3].';
        return false;
      }
      if (p.mature) {
        this.message = `This ${p.cropDef.name} is fully mature! Switch to Harvest [4] then press E.`;
        return false;
      }
      if (p.watered) {
        this.message = 'Already watered! It will grow during your next focus block [F].';
        return false;
      }
      p.watered = true;
      this.message = `Watered ${p.cropDef.name}! Press F to begin a real-time focus block.`;
      return true;
    }

    if (tool === 3) {
      if (!p.planted) {
        this.message = 'Nothing planted here to harvest.';
        return false;
      }
      if (!p.mature) {
        const def = p.cropDef;
        this.message = `Growing ${def.name}: ${formatGrowthTime(p.growth)} / ${formatGrowthTime(def.growthMinutes)} focused time completed.`;
        return false;
      }

      const def = p.cropDef;
      this.produce[def.id] = (this.produce[def.id] ?? 0) + 1;
      p.planted = false;
      p.cropId = null;
      p.watered = false;
      p.growth = 0;
      p.previewGrowth = null;
      this.message = `Harvested a fresh ${def.name}! Sell beside the shipping bin with [V] (+${def.sellPrice} coins).`;
      return true;
    }

    return false;
  }

  buySeed(cropId: string, quantity = 1): boolean {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20 || !CROP_LIST.some(crop => crop.id === cropId)) return false;
    const crop = getCropDef(cropId);
    const cost = crop.buyPrice * quantity;

    if (this.coins < cost) {
      this.message = `Need ${cost} coins for ${quantity}× ${crop.seedName}. Sell harvested crops with [V]!`;
      return false;
    }

    this.coins -= cost;
    this.seeds[crop.id] = (this.seeds[crop.id] ?? 0) + quantity;
    this.selectedSeedId = crop.id;
    this.message = `Bought ${quantity}× ${crop.seedName}! Selected and ready to plant.`;
    return true;
  }

  sellProduce(): boolean {
    if (Math.abs(this.player.gridX - 2) + Math.abs(this.player.gridY - 1) !== 1) {
      this.message = 'Stand beside the wooden shipping bin to sell your harvest.';
      return false;
    }

    if (this.totalProduce === 0) {
      this.message = 'The shipping bin is empty. Harvest mature crops with [4] to sell them here.';
      return false;
    }

    let earned = 0;
    const soldItems: string[] = [];

    for (const [id, count] of Object.entries(this.produce)) {
      if (count > 0) {
        const crop = getCropDef(id);
        const subtotal = crop.sellPrice * count;
        earned += subtotal;
        soldItems.push(`${count}× ${crop.name}`);
      }
    }

    this.coins += earned;
    this.produce = {};
    this.toolbarSlots = this.toolbarSlots.map(key => key?.startsWith('produce:') ? null : key);
    this.message = `Harvest shipped! +${earned} coins (${soldItems.join(', ')}).`;
    return true;
  }

  toSave(): FocusFarmSave {
    const data = new FocusFarmSave();
    data.player = { x: this.player.gridX, y: this.player.gridY, direction: this.player.direction };
    data.plots = this.plots.map((p, index) => ({
      x: index % this.width,
      y: Math.floor(index / this.width),
      tilled: p.tilled,
      crop: p.planted ? (p.cropId ?? 'carrot') : null,
      watered: p.watered,
      growth: p.growth,
    }));
    data.seeds = { ...this.seeds };
    data.produce = { ...this.produce };
    data.selectedSeed = this.selectedSeedId;
    data.toolbarSlots = [...this.toolbarSlots];
    data.coins = this.coins;
    data.sessions = this.sessions;
    data.minutes = this.minutes;
    return data;
  }

  restore(data: FocusFarmSave): void {
    this.clearGrowthPreview();
    this.player.gridX = data.player.x;
    this.player.gridY = data.player.y;
    this.player.direction = data.player.direction;

    for (const saved of data.plots) {
      const p = this.plots[saved.y * this.width + saved.x];
      if (!p) continue;
      p.tilled = saved.tilled;
      p.planted = saved.crop !== null;
      p.cropId = saved.crop;
      p.watered = saved.watered;
      p.growth = saved.growth;
    }

    // Support migration from v1 (number) to v2 (Record<string, number>)
    const availableCropIds = new Set(CROP_LIST.map(crop => crop.id));
    if (typeof (data as unknown as { seeds: unknown }).seeds === 'number') {
      const oldSeeds = (data as unknown as { seeds: number }).seeds;
      this.seeds = oldSeeds > 0 ? { carrot: oldSeeds } : {};
    } else if (data.seeds && typeof data.seeds === 'object') {
      this.seeds = Object.fromEntries(Object.entries(data.seeds).filter(([id, count]) => availableCropIds.has(id) && count > 0));
    }

    if (typeof (data as unknown as { produce: unknown }).produce === 'number') {
      const oldProduce = (data as unknown as { produce: number }).produce;
      this.produce = oldProduce > 0 ? { carrot: oldProduce } : {};
    } else if (data.produce && typeof data.produce === 'object') {
      this.produce = Object.fromEntries(Object.entries(data.produce).filter(([, count]) => count > 0));
    }

    if (data.selectedSeed && availableCropIds.has(data.selectedSeed)) {
      this.selectedSeedId = data.selectedSeed;
    } else {
      this.selectedSeedId = 'carrot';
    }

    const ownedKeys = new Set([
      ...Object.entries(this.seeds).filter(([, count]) => count > 0).map(([id]) => `seed:${id}`),
      ...Object.entries(this.produce).filter(([, count]) => count > 0).map(([id]) => `produce:${id}`),
    ]);
    this.toolbarSlots = Array.isArray(data.toolbarSlots) && data.toolbarSlots.length === 4
      ? data.toolbarSlots.map(key => typeof key === 'string' && ownedKeys.has(key) ? key : null)
      : [null, null, null, null];
    const existingSave = data as FocusFarmSave & { cropPlotsClearedForGrowthTest?: boolean };
    if (existingSave.cropPlotsClearedForGrowthTest !== true) {
      for (const plot of this.plots) {
        plot.planted = false;
        plot.cropId = null;
        plot.watered = false;
        plot.growth = 0;
        plot.previewGrowth = null;
      }
    }

    this.coins = data.coins;
    this.sessions = data.sessions;
    this.minutes = data.minutes;
    this.message = 'Welcome back! Your farm and crops are thriving.';
  }

  wateredSnapshot(): number[] {
    return this.plots.flatMap((p, index) => (p.planted && p.watered && !p.mature ? [index] : []));
  }

  previewFocus(elapsedMinutes: number, snapshot: readonly number[]): void {
    for (const plot of this.plots) plot.previewGrowth = null;
    for (const index of snapshot) {
      const plot = this.plots[index];
      if (plot && plot.planted && plot.watered && !plot.mature) {
        plot.previewGrowth = Math.min(plot.cropDef.growthMinutes, plot.growth + elapsedMinutes);
      }
    }
  }

  commitFocusProgress(minutes: number, snapshot: readonly number[]): void {
    if (minutes <= 0) return;
    for (const index of snapshot) {
      const plot = this.plots[index];
      if (plot && plot.planted && plot.watered && !plot.mature) {
        plot.growth = Math.min(plot.cropDef.growthMinutes, plot.growth + minutes);
        if (plot.mature) plot.watered = false;
      }
    }
    this.clearGrowthPreview();
  }

  clearGrowthPreview(): void {
    for (const plot of this.plots) plot.previewGrowth = null;
  }

  completeFocus(minutes: number, snapshot: readonly number[]): void {
    this.clearGrowthPreview();
    let grown = 0;
    for (const index of snapshot) {
      const p = this.plots[index];
      if (p && p.planted && p.watered && !p.mature) {
        const maxGrowth = p.cropDef.growthMinutes;
        p.growth = Math.min(maxGrowth, p.growth + minutes);
        p.previewGrowth = null;
        p.watered = false;
        grown++;
      }
    }
    this.sessions++;
    this.minutes += minutes;
    this.message = `Lovely work! ${minutes} focused minutes completed; ${grown} crops grew. Rewater for the next block.`;
  }

  render(): void {
    const display = MakkoEngine.display;
    const centerX = this.originX + this.width * 32;
    const centerY = this.originY + this.height * 32;
    const zoomDisplay = createFarmZoomDisplay(display, this.zoom, centerX, centerY);
    this.renderFarm(zoomDisplay);
    this.renderCropHover(display, centerX, centerY);
  }

  private renderCropHover(display: IDisplay, centerX: number, centerY: number): void {
    const mouseX = MakkoEngine.input.mouseX;
    const mouseY = MakkoEngine.input.mouseY;
    const worldX = centerX + (mouseX - centerX) / this.zoom;
    const worldY = centerY + (mouseY - centerY) / this.zoom;
    const gridX = Math.floor((worldX - this.originX) / 64);
    const gridY = Math.floor((worldY - this.originY) / 64);
    const plot = this.plotAt(gridX, gridY);
    if (!plot?.planted) return;

    const crop = plot.cropDef;
    const title = `${crop.seasonIcon} ${crop.name}`;
    const growthLine = plot.mature
      ? '✦ Mature — Ready to harvest [4]'
      : `⏱ ${formatGrowthTime(plot.growth)} / ${formatGrowthTime(crop.growthMinutes)} (${plot.growthPercent}%)`;
    const subLine = plot.mature
      ? `🪙 Ships for ${crop.sellPrice} coins`
      : plot.watered
        ? '💧 Watered · Grows next Focus [F]'
        : 'Needs water · Use Watering Can [3]';

    const titleFont = 'bold 14px monospace';
    const subFont = '12px monospace';
    const paddingX = 14;
    const contentW = Math.max(
      display.measureText(title, { font: titleFont }).width,
      display.measureText(growthLine, { font: subFont }).width,
      display.measureText(subLine, { font: subFont }).width,
      190,
    );
    const tooltipWidth = contentW + paddingX * 2;
    const tooltipHeight = 82;
    const tooltipX = Math.min(mouseX + 16, display.width - tooltipWidth - 12);
    const tooltipY = Math.min(mouseY + 16, display.height - tooltipHeight - 12);

    display.drawRoundRect(tooltipX + 3, tooltipY + 4, tooltipWidth, tooltipHeight, 10, { fill: '#17130f', alpha: 0.35 });
    display.drawRoundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 10, {
      fill: '#fff7e5',
      stroke: plot.mature ? '#c28b2c' : '#779464',
      lineWidth: 2,
    });

    display.drawText(title, tooltipX + paddingX, tooltipY + 18, {
      font: titleFont,
      fill: '#3c5233',
      align: 'left',
      baseline: 'middle',
    });
    display.drawText(growthLine, tooltipX + paddingX, tooltipY + 38, {
      font: subFont,
      fill: plot.mature ? '#8c5d19' : '#526348',
      align: 'left',
      baseline: 'middle',
    });

    // Mini growth progress bar
    const barW = tooltipWidth - paddingX * 2;
    const barY = tooltipY + 50;
    display.drawRoundRect(tooltipX + paddingX, barY, barW, 6, 3, { fill: '#e3d5bc' });
    const fillRatio = plot.mature ? 1 : Math.max(0.06, plot.growthPercent / 100);
    display.drawRoundRect(tooltipX + paddingX, barY, barW * fillRatio, 6, 3, {
      fill: plot.mature ? '#d99b26' : plot.watered ? '#5698a8' : '#7a9e64',
    });

    display.drawText(subLine, tooltipX + paddingX, tooltipY + 68, {
      font: subFont,
      fill: plot.mature ? '#6e5634' : plot.watered ? '#386f80' : '#9c5b3b',
      align: 'left',
      baseline: 'middle',
    });
  }

  private renderFarm(d: IDisplay): void {
    const ox = this.originX;
    const oy = this.originY;
    const calendar = RealCalendar.shared;

    d.drawRoundRect(ox - 18, oy - 18, 1188, 676, 16, { fill: calendar.palette.edge });
    d.drawRect(ox - 7, oy - 7, 1166, 654, { fill: calendar.season === 'Winter' ? '#f2f6fa' : '#b6ad7e' });

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.plots[y * this.width + x].render(ox + x * 64, oy + y * 64, x, y, d, false);
      }
    }
    this.renderGrassDecorations(d, ox, oy);

    // Draw cultivated soil above meadow tufts so grass never covers a tilled plot.
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const plot = this.plots[y * this.width + x];
        if (plot?.tilled) plot.render(ox + x * 64, oy + y * 64, x, y, d, false);
      }
    }

    // Seed Stand landmark
    const sx = ox + 64;
    const sy = oy + 64;
    d.drawRect(sx + 7, sy + 28, 50, 32, { fill: '#b38358' });
    d.drawRect(sx + 11, sy + 34, 42, 17, { fill: '#e0c193' });
    d.drawRect(sx + 3, sy + 8, 58, 23, { fill: '#eee0ac' });
    for (let i = 0; i < 3; i++) {
      d.drawRect(sx + 3 + i * 20, sy + 8, 10, 23, { fill: '#8caa80' });
    }
    d.drawText('SEEDS', sx + 32, sy + 47, { font: 'bold 10px monospace', align: 'center', fill: '#584936' });

    // Shipping Bin landmark
    const bx = ox + 128;
    d.drawRect(bx + 8, sy + 20, 48, 40, { fill: '#88694c' });
    d.drawRect(bx + 4, sy + 16, 56, 12, { fill: '#c39f70' });
    d.drawRect(bx + 16, sy + 18, 32, 4, { fill: '#4a4439' });
    d.drawText('SHIP', bx + 32, sy + 45, { font: 'bold 10px monospace', align: 'center', fill: '#eddfb7' });

    const t = this.player.target;
    if (this.canEnter(t.x, t.y)) {
      d.drawRoundRect(ox + t.x * 64 + 2, oy + t.y * 64 + 2, 60, 60, 6, {
        stroke: '#ffe6ab',
        lineWidth: 3,
      });
    }

    if (calendar.season === 'Winter') {
      d.drawRect(sx + 3, sy + 7, 58, 5, { fill: '#f2f7fc' });
      d.drawRect(bx + 4, sy + 15, 56, 5, { fill: '#f2f7fc' });
    }

    this.player.render(ox, oy, d);

    // Render planted crops last so they layer over the player and farm objects.
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const plot = this.plots[y * this.width + x];
        if (plot?.planted) plot.renderCropOverlay(ox + x * 64, oy + y * 64, d);
      }
    }

    if (calendar.nightAlpha > 0) {
      d.drawRect(ox, oy, 1152, 640, { fill: '#28324f', alpha: calendar.nightAlpha });
    }
  }

  private renderGrassDecorations(d: IDisplay, ox: number, oy: number): void {
    const grass1 = MakkoEngine.staticAsset('grass_1');
    const grass2 = MakkoEngine.staticAsset('grass_2');
    const grass3 = MakkoEngine.staticAsset('grass_3');
    const assets = [grass1, grass2, grass3].filter(
      (asset): asset is NonNullable<typeof asset> =>
        Boolean(asset?.image.complete && asset.image.naturalWidth > 0),
    );
    if (assets.length === 0) return;

    const randomAt = (x: number, y: number, salt: number): number => {
      const value = Math.sin((x + 1) * 127.1 + (y + 1) * 311.7 + salt * 74.7) * 43758.5453;
      return value - Math.floor(value);
    };

    const centerX = ox + this.width * 32;
    const centerY = oy + this.height * 32;
    const clipX = centerX + (ox - centerX) * this.zoom;
    const clipY = centerY + (oy - centerY) * this.zoom;
    d.pushClipRect(clipX, clipY, this.width * 64 * this.zoom, this.height * 64 * this.zoom);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const plot = this.plots[y * this.width + x];
        if (!plot || plot.tilled || (y === 1 && (x === 1 || x === 2))) continue;

        const tileX = ox + x * 64;
        const tileY = oy + y * 64;
        const patchNoise = Math.sin(x * 0.74 + y * 0.31) * Math.cos(y * 0.91 - x * 0.22);
        const wildPatch = patchNoise > 0.05 || randomAt(x, y, 5) > 0.82;
        const sparseTile = randomAt(x, y, 1) < 0.24 && !wildPatch;
        const count = sparseTile
          ? Math.floor(randomAt(x, y, 3) * 3)
          : wildPatch
            ? 11 + Math.floor(randomAt(x, y, 2) * 10)
            : 2 + Math.floor(randomAt(x, y, 4) * 4);

        for (let tuft = 0; tuft < count; tuft++) {
          const asset = assets[Math.floor(randomAt(x, y, 10 + tuft * 7) * assets.length)];
          if (!asset) continue;
          const spread = wildPatch ? 82 : 66;
          const minX = -8;
          const maxX = Math.max(minX, 64 + spread - asset.width);
          const px = tileX + minX + randomAt(x, y, 20 + tuft * 11) * (maxX - minX);
          const groundY = tileY + 64 - randomAt(x, y, 30 + tuft * 13) * (wildPatch ? 46 : 32);
          d.drawImage(asset.image, px, groundY - asset.height, asset.width, asset.height);
        }
      }
    }

    d.popClip();
  }
}
