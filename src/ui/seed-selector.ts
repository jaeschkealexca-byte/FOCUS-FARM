import { MakkoEngine } from '@makko/engine';
import type { FarmWorld } from '../farm/farm-world';
import {
  type CropDef,
  drawSeedPacket,
  formatGrowthTime,
  getCropDef,
} from '../farm/crops';

interface OwnedSeedStack {
  crop: CropDef;
  count: number;
}

/**
 * Interactive Seed Pouch & Quick-Select Tray rendered above the bottom toolbar.
 * Lets players inspect owned seeds, see growth/value stats, and switch seeds
 * with a single click, mouse wheel scroll, or [Q] / [2] keys.
 */
export class SeedSelector {
  private world: FarmWorld;
  private readonly getTool: () => number;
  private readonly setTool: (tool: number) => void;
  private readonly save: () => void;
  private readonly onOpenShop: () => void;

  /** Whether the expanded pouch tray is collapsed manually while Seeds tool is active */
  private collapsedWhileSeedsActive = false;
  /** Whether the pouch tray was manually pinned open while another tool is active */
  private pinnedOpen = false;
  /** Scroll index when player owns more than maxVisibleCards seed varieties */
  private scrollIndex = 0;
  private readonly maxVisibleCards = 6;

  // Geometry constants (1920x1080 space, positioned cleanly above the y=975 toolbar)
  private readonly trayW = 820;
  private readonly trayH = 122;
  private readonly trayX = (1920 - 820) / 2;
  private readonly trayY = 834;

  private readonly pillW = 360;
  private readonly pillH = 34;
  private readonly pillX = (1920 - 360) / 2;
  private readonly pillY = 924;

  constructor(
    world: FarmWorld,
    getTool: () => number,
    setTool: (tool: number) => void,
    save: () => void,
    onOpenShop: () => void,
  ) {
    this.world = world;
    this.getTool = getTool;
    this.setTool = setTool;
    this.save = save;
    this.onOpenShop = onOpenShop;
  }

  setWorld(world: FarmWorld): void {
    this.world = world;
    this.scrollIndex = 0;
  }

  get isExpanded(): boolean {
    if (this.getTool() === 1) {
      return !this.collapsedWhileSeedsActive;
    }
    return this.pinnedOpen;
  }

  openPouch(): void {
    this.collapsedWhileSeedsActive = false;
    this.pinnedOpen = true;
    this.ensureSelectedVisible();
  }

  togglePouch(): void {
    if (this.isExpanded) {
      if (this.getTool() === 1) this.collapsedWhileSeedsActive = true;
      this.pinnedOpen = false;
    } else {
      this.openPouch();
    }
  }

  /** Notify selector when the player switches tools so the tray auto-expands on Seeds [2]. */
  onToolChanged(tool: number): void {
    if (tool === 1) {
      this.collapsedWhileSeedsActive = false;
      this.ensureSelectedVisible();
    } else {
      this.pinnedOpen = false;
    }
  }

  private getOwnedSeeds(): OwnedSeedStack[] {
    const list: OwnedSeedStack[] = [];
    for (const [id, count] of Object.entries(this.world.seeds)) {
      if (count > 0) {
        list.push({ crop: getCropDef(id), count });
      }
    }
    return list;
  }

  ensureSelectedVisible(): void {
    const owned = this.getOwnedSeeds();
    const idx = owned.findIndex(item => item.crop.id === this.world.selectedSeedId);
    if (idx < 0) {
      this.scrollIndex = 0;
      return;
    }
    if (idx < this.scrollIndex) {
      this.scrollIndex = idx;
    } else if (idx >= this.scrollIndex + this.maxVisibleCards) {
      this.scrollIndex = idx - this.maxVisibleCards + 1;
    }
    const maxScroll = Math.max(0, owned.length - this.maxVisibleCards);
    this.scrollIndex = Math.max(0, Math.min(this.scrollIndex, maxScroll));
  }

  /**
   * Handles mouse clicks and scroll wheel on the seed selector tray/pill.
   * Returns true if the input was consumed by the seed selector.
   */
  handleInput(): boolean {
    const input = MakkoEngine.input;
    const mx = input.mouseX;
    const my = input.mouseY;

    // Mouse wheel over expanded tray or toolbar cycles seeds when Seeds tool is active or tray is open
    const overTray = this.isExpanded && this.contains(mx, my, this.trayX, this.trayY, this.trayW, this.trayH);
    const overToolbar = this.contains(mx, my, (1920 - 786) / 2, 964, 786, 92);
    if ((overTray || (overToolbar && this.getTool() === 1)) && (input.isScrollingDown() || input.isScrollingUp())) {
      input.captureWheel();
      const dir = input.isScrollingDown() ? 1 : -1;
      this.world.cycleSelectedSeed(dir);
      this.setTool(1);
      this.ensureSelectedVisible();
      this.save();
      return true;
    }

    if (!input.isMousePressed(0)) return false;

    if (!this.isExpanded) {
      // Check compact seed status pill above toolbar
      if (this.contains(mx, my, this.pillX, this.pillY, this.pillW, this.pillH)) {
        this.setTool(1);
        this.collapsedWhileSeedsActive = false;
        this.pinnedOpen = true;
        this.ensureSelectedVisible();
        this.save();
        return true;
      }
      return false;
    }

    // Expanded tray click handling
    if (!this.contains(mx, my, this.trayX, this.trayY, this.trayW, this.trayH)) {
      return false;
    }

    // Header buttons (Prev, Next, +Shop, Hide)
    const headerY = this.trayY + 8;
    const prevBtnX = this.trayX + this.trayW - 252;
    const nextBtnX = this.trayX + this.trayW - 190;
    const shopBtnX = this.trayX + this.trayW - 126;
    const hideBtnX = this.trayX + this.trayW - 44;

    if (this.contains(mx, my, prevBtnX, headerY, 56, 24)) {
      this.world.cycleSelectedSeed(-1);
      this.setTool(1);
      this.ensureSelectedVisible();
      this.save();
      return true;
    }
    if (this.contains(mx, my, nextBtnX, headerY, 56, 24)) {
      this.world.cycleSelectedSeed(1);
      this.setTool(1);
      this.ensureSelectedVisible();
      this.save();
      return true;
    }
    if (this.contains(mx, my, shopBtnX, headerY, 76, 24)) {
      this.onOpenShop();
      return true;
    }
    if (this.contains(mx, my, hideBtnX, headerY, 34, 24)) {
      this.togglePouch();
      return true;
    }

    const owned = this.getOwnedSeeds();
    if (owned.length === 0) {
      // Clicking empty state banner opens Seed Shop
      if (this.contains(mx, my, this.trayX + 20, this.trayY + 40, this.trayW - 40, 72)) {
        this.onOpenShop();
      }
      return true;
    }

    // Left / Right page arrows if more than maxVisibleCards
    const maxScroll = Math.max(0, owned.length - this.maxVisibleCards);
    if (owned.length > this.maxVisibleCards) {
      if (this.contains(mx, my, this.trayX + 8, this.trayY + 56, 24, 44) && this.scrollIndex > 0) {
        this.scrollIndex--;
        return true;
      }
      if (this.contains(mx, my, this.trayX + this.trayW - 32, this.trayY + 56, 24, 44) && this.scrollIndex < maxScroll) {
        this.scrollIndex++;
        return true;
      }
    }

    // Seed cards
    const visible = owned.slice(this.scrollIndex, this.scrollIndex + this.maxVisibleCards);
    const cardW = 120;
    const cardH = 74;
    const gap = 8;
    const totalRowW = visible.length * cardW + Math.max(0, visible.length - 1) * gap;
    const startX = this.trayX + (this.trayW - totalRowW) / 2;
    const cardY = this.trayY + 40;

    for (let i = 0; i < visible.length; i++) {
      const cx = startX + i * (cardW + gap);
      if (this.contains(mx, my, cx, cardY, cardW, cardH)) {
        const chosen = visible[i];
        this.world.selectedSeedId = chosen.crop.id;
        this.setTool(1);
        this.world.message = `Selected: ${chosen.crop.name} Seeds (${chosen.count} in pouch). Press E on tilled soil to plant.`;
        this.save();
        return true;
      }
    }

    return true;
  }

  render(): void {
    const d = MakkoEngine.display;
    const input = MakkoEngine.input;
    const mx = input.mouseX;
    const my = input.mouseY;

    if (!this.isExpanded) {
      this.renderCompactPill(d, mx, my);
      return;
    }

    const owned = this.getOwnedSeeds();
    this.ensureSelectedVisible();

    const selectedCrop = getCropDef(this.world.selectedSeedId);
    const selectedCount = this.world.seeds[selectedCrop.id] ?? 0;

    // Drop shadow & stitched wooden/parchment tray container
    d.drawRoundRect(this.trayX + 4, this.trayY + 6, this.trayW, this.trayH, 16, {
      fill: '#17130f',
      alpha: 0.32,
    });
    d.drawRoundRect(this.trayX, this.trayY, this.trayW, this.trayH, 16, {
      fill: '#463829',
      alpha: 0.95,
      stroke: '#c9a878',
      lineWidth: 2,
    });
    d.drawRoundRect(this.trayX + 5, this.trayY + 5, this.trayW - 10, this.trayH - 10, 12, {
      fill: '#f5ead4',
      stroke: '#cbb089',
      lineWidth: 1,
    });

    // Top header strip inside tray
    d.drawRoundRect(this.trayX + 8, this.trayY + 7, this.trayW - 16, 26, 8, {
      fill: '#e6d5b8',
    });

    const headerCenterY = this.trayY + 20;
    d.drawText('🌱 SEED POUCH', this.trayX + 18, headerCenterY, {
      font: 'bold 12px monospace',
      fill: '#5c4730',
      align: 'left',
      baseline: 'middle',
    });

    if (owned.length > 0) {
      const infoText = `${selectedCrop.seasonIcon} ${selectedCrop.name}  ·  ⏱ ${formatGrowthTime(selectedCrop.growthMinutes)} focus  ·  🪙 Ships for ${selectedCrop.sellPrice}  ·  In pouch: ×${selectedCount}`;
      d.drawText(infoText, this.trayX + 138, headerCenterY, {
        font: 'bold 12px monospace',
        fill: '#3f5a36',
        align: 'left',
        baseline: 'middle',
      });
    } else {
      d.drawText('No seeds in pouch — buy seeds from the Seed Shop [B]', this.trayX + 138, headerCenterY, {
        font: '12px monospace',
        fill: '#8c4a3b',
        align: 'left',
        baseline: 'middle',
      });
    }

    // Header mini control buttons
    const headerBtnY = this.trayY + 8;
    const prevBtnX = this.trayX + this.trayW - 252;
    const nextBtnX = this.trayX + this.trayW - 190;
    const shopBtnX = this.trayX + this.trayW - 126;
    const hideBtnX = this.trayX + this.trayW - 44;

    this.drawHeaderChip(d, prevBtnX, headerBtnY, 56, 24, '◀ Prev', owned.length > 1, this.contains(mx, my, prevBtnX, headerBtnY, 56, 24));
    this.drawHeaderChip(d, nextBtnX, headerBtnY, 56, 24, 'Next ▶', owned.length > 1, this.contains(mx, my, nextBtnX, headerBtnY, 56, 24));
    this.drawHeaderChip(d, shopBtnX, headerBtnY, 76, 24, '+ Shop [B]', true, this.contains(mx, my, shopBtnX, headerBtnY, 76, 24), true);
    this.drawHeaderChip(d, hideBtnX, headerBtnY, 34, 24, '▾', true, this.contains(mx, my, hideBtnX, headerBtnY, 34, 24));

    // Empty state
    if (owned.length === 0) {
      const emptyHover = this.contains(mx, my, this.trayX + 20, this.trayY + 40, this.trayW - 40, 72);
      d.drawRoundRect(this.trayX + 20, this.trayY + 40, this.trayW - 40, 72, 10, {
        fill: emptyHover ? '#eef4e5' : '#fbf4e4',
        stroke: emptyHover ? '#6f9259' : '#d8c3a0',
        lineWidth: 1.5,
      });
      d.drawText('🌸 Your seed pouch is empty! Click here or press [B] to open the Seed Shop.', this.trayX + this.trayW / 2, this.trayY + 76, {
        font: 'bold 14px monospace',
        fill: '#4c663b',
        align: 'center',
        baseline: 'middle',
      });
      return;
    }

    // Seed cards row
    const visible = owned.slice(this.scrollIndex, this.scrollIndex + this.maxVisibleCards);
    const cardW = 120;
    const cardH = 74;
    const gap = 8;
    const totalRowW = visible.length * cardW + Math.max(0, visible.length - 1) * gap;
    const startX = this.trayX + (this.trayW - totalRowW) / 2;
    const cardY = this.trayY + 40;

    for (let i = 0; i < visible.length; i++) {
      const { crop, count } = visible[i];
      const cx = startX + i * (cardW + gap);
      const isSelected = crop.id === this.world.selectedSeedId;
      const isHovered = this.contains(mx, my, cx, cardY, cardW, cardH);

      d.drawRoundRect(cx, cardY, cardW, cardH, 10, {
        fill: isSelected ? '#dfecc8' : isHovered ? '#fdf8ec' : '#faf0dc',
        stroke: isSelected ? '#557d3e' : isHovered ? '#b88b58' : '#d9c5a3',
        lineWidth: isSelected ? 2.5 : 1.5,
      });

      // Seed packet icon on left side of card
      drawSeedPacket(crop, cx + 6, cardY + 7, 42, 56);

      // Crop title & metadata on right side of card
      const labelX = cx + 52;
      const shortName = crop.name.length > 9 ? `${crop.name.slice(0, 8)}…` : crop.name;
      d.drawText(shortName, labelX, cardY + 20, {
        font: 'bold 12px monospace',
        fill: isSelected ? '#2e4722' : '#4f3d2a',
        align: 'left',
        baseline: 'middle',
      });

      d.drawText(`⏱ ${formatGrowthTime(crop.growthMinutes)}`, labelX, cardY + 38, {
        font: '11px monospace',
        fill: '#6e5c46',
        align: 'left',
        baseline: 'middle',
      });

      // Quantity pill
      d.drawRoundRect(labelX, cardY + 49, 38, 17, 5, {
        fill: isSelected ? '#4c7a39' : '#856e54',
      });
      d.drawText(`×${count}`, labelX + 19, cardY + 57.5, {
        font: 'bold 11px monospace',
        fill: '#ffffff',
        align: 'center',
        baseline: 'middle',
      });

      // Active checkmark badge in top-right corner
      if (isSelected) {
        d.drawCircle(cx + cardW - 11, cardY + 11, 8, {
          fill: '#4c7a39',
          stroke: '#ffffff',
          lineWidth: 1.5,
        });
        d.drawText('✓', cx + cardW - 11, cardY + 11.5, {
          font: 'bold 10px monospace',
          fill: '#ffffff',
          align: 'center',
          baseline: 'middle',
        });
      }
    }

    // Pagination arrows if needed
    const maxScroll = Math.max(0, owned.length - this.maxVisibleCards);
    if (owned.length > this.maxVisibleCards) {
      const canLeft = this.scrollIndex > 0;
      const canRight = this.scrollIndex < maxScroll;
      d.drawRoundRect(this.trayX + 8, this.trayY + 56, 24, 44, 6, {
        fill: canLeft ? '#e5d4b7' : '#efe6d5',
        stroke: '#bca380',
        lineWidth: 1,
      });
      d.drawText('‹', this.trayX + 20, this.trayY + 78, {
        font: 'bold 18px serif',
        fill: canLeft ? '#59432d' : '#b5a48b',
        align: 'center',
        baseline: 'middle',
      });

      d.drawRoundRect(this.trayX + this.trayW - 32, this.trayY + 56, 24, 44, 6, {
        fill: canRight ? '#e5d4b7' : '#efe6d5',
        stroke: '#bca380',
        lineWidth: 1,
      });
      d.drawText('›', this.trayX + this.trayW - 20, this.trayY + 78, {
        font: 'bold 18px serif',
        fill: canRight ? '#59432d' : '#b5a48b',
        align: 'center',
        baseline: 'middle',
      });
    }
  }

  private renderCompactPill(d: typeof MakkoEngine.display, mx: number, my: number): void {
    const hovered = this.contains(mx, my, this.pillX, this.pillY, this.pillW, this.pillH);
    const crop = getCropDef(this.world.selectedSeedId);
    const count = this.world.seeds[crop.id] ?? 0;

    d.drawRoundRect(this.pillX + 2, this.pillY + 3, this.pillW, this.pillH, 17, {
      fill: '#17130f',
      alpha: 0.25,
    });
    d.drawRoundRect(this.pillX, this.pillY, this.pillW, this.pillH, 17, {
      fill: hovered ? '#f6e7c4' : '#ead8b6',
      stroke: hovered ? '#72945b' : '#b89b72',
      lineWidth: 1.5,
    });

    const label = count > 0
      ? `🌱 Active Seed: ${crop.name} (×${count})  ·  [Q] Cycle  ·  ▴ Open Pouch`
      : `🌱 Seed Pouch Empty  ·  Click to open or press [B] for Shop`;
    d.drawText(label, this.pillX + this.pillW / 2, this.pillY + this.pillH / 2, {
      font: 'bold 11px monospace',
      fill: count > 0 ? '#465938' : '#8c4a3b',
      align: 'center',
      baseline: 'middle',
    });
  }

  private drawHeaderChip(
    d: typeof MakkoEngine.display,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    enabled: boolean,
    hovered: boolean,
    accent = false,
  ): void {
    const fill = !enabled
      ? '#dfd3be'
      : accent
        ? hovered ? '#6b8c56' : '#7b9c65'
        : hovered ? '#f9eed9' : '#f1e2c6';
    const stroke = !enabled ? '#cbbca4' : accent ? '#4d6b3c' : '#b89f7a';
    const textFill = !enabled ? '#9e8f79' : accent ? '#fff9eb' : '#59432d';

    d.drawRoundRect(x, y, w, h, 6, { fill, stroke, lineWidth: 1 });
    d.drawText(label, x + w / 2, y + h / 2, {
      font: 'bold 10px monospace',
      fill: textFill,
      align: 'center',
      baseline: 'middle',
    });
  }

  private contains(x: number, y: number, left: number, top: number, width: number, height: number): boolean {
    return x >= left && x <= left + width && y >= top && y <= top + height;
  }
}

