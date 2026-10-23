import { MakkoEngine } from '@makko/engine';
import type { FarmWorld } from '../farm/farm-world';
import {
  type CropDef,
  type Season,
  drawSeedPacket,
  formatGrowthTime,
  getCropDef,
  getCropsBySeason,
} from '../farm/crops';

type ShopSeason = Exclude<Season, 'All'>;

export class ShopWindow {
  visible = false;
  private world: FarmWorld | null = null;
  private save: (() => void) | null = null;
  private selectedSeason: ShopSeason = 'Spring';
  private selectedCropId: string | null = null;
  private page = 0;
  readonly itemsPerPage = 7;

  readonly winW = 1375;
  readonly winH = 850;
  readonly winX = Math.round((1920 - this.winW) / 2);
  readonly winY = Math.round((1080 - this.winH) / 2);

  private readonly seasons: { id: ShopSeason; label: string; assetKey: string }[] = [
    { id: 'Spring', label: 'Spring', assetKey: 'spring_shop_ui' },
    { id: 'Summer', label: 'Summer', assetKey: 'summer_shop_ui' },
    { id: 'Autumn', label: 'Autumn', assetKey: 'autumn_shop_ui' },
    { id: 'Winter', label: 'Winter', assetKey: 'winter_shop_ui' },
  ];

  open(world: FarmWorld, save: () => void, _returnLabel = 'Back to farm'): void {
    this.world = world;
    this.save = save;
    this.visible = true;
    this.selectedSeason = 'Spring';
    this.selectedCropId = null;
    this.page = 0;
  }

  hide(): void {
    this.visible = false;
  }

  handleInput(): void {
    if (!this.visible) return;
    const input = MakkoEngine.input;
    if (input.isKeyPressed('Escape')) {
      this.hide();
      return;
    }
    if (input.isKeyPressed('Digit1')) this.switchSeason('Spring');
    else if (input.isKeyPressed('Digit2')) this.switchSeason('Summer');
    else if (input.isKeyPressed('Digit3')) this.switchSeason('Autumn');
    else if (input.isKeyPressed('Digit4')) this.switchSeason('Winter');

    const crops = getCropsBySeason(this.selectedSeason);
    const pageCount = Math.max(1, Math.ceil(crops.length / this.itemsPerPage));
    if ((input.isKeyPressed('ArrowLeft') || input.isKeyPressed('KeyA')) && this.page > 0) this.page--;
    else if ((input.isKeyPressed('ArrowRight') || input.isKeyPressed('KeyD')) && this.page < pageCount - 1) this.page++;
  }

  update(_dt: number): void {
    if (!this.visible) return;
    const input = MakkoEngine.input;
    if (!input.isMousePressed(0)) return;
    const mx = input.mouseX;
    const my = input.mouseY;

    if (!this.isInRect(mx, my, this.winX, this.winY, this.winW, this.winH)) {
      this.hide();
      return;
    }

    const close = this.closeHitbox();
    if (this.isInRect(mx, my, close.x, close.y, close.w, close.h)) {
      this.hide();
      return;
    }

    const tabs = this.seasonTabBounds();
    for (let index = 0; index < this.seasons.length; index++) {
      const y = tabs.y + index * (tabs.h + tabs.gap);
      if (this.isInRect(mx, my, tabs.x, y, tabs.w, tabs.h)) {
        this.switchSeason(this.seasons[index].id);
        return;
      }
    }

    const crops = getCropsBySeason(this.selectedSeason);
    const shown = crops.slice(this.page * this.itemsPerPage, (this.page + 1) * this.itemsPerPage);
    const cards = this.seedCardBounds();
    for (let index = 0; index < shown.length; index++) {
      const position = this.seedCardPosition(index, shown.length);
      if (this.isInRect(mx, my, position.x, position.y, cards.w, cards.h)) {
        this.selectedCropId = shown[index].id;
        return;
      }
    }

    const buyBtn = this.purchaseButtonBounds();
    if (this.selectedCropId && this.isInRect(mx, my, buyBtn.x, buyBtn.y, buyBtn.w, buyBtn.h)) {
      this.purchase(getCropDef(this.selectedCropId));
      return;
    }

    const pageCount = Math.max(1, Math.ceil(crops.length / this.itemsPerPage));
    const navY = this.winY + this.winH - 170;
    if (this.page > 0 && this.isInRect(mx, my, this.winX + 710, navY, 48, 36)) this.page--;
    else if (this.page < pageCount - 1 && this.isInRect(mx, my, this.winX + 820, navY, 48, 36)) this.page++;
  }

  render(): void {
    if (!this.visible) return;
    const display = MakkoEngine.display;
    const input = MakkoEngine.input;
    const wx = this.winX;
    const wy = this.winY;
    display.drawRect(0, 0, display.width, display.height, { fill: '#17130f', alpha: 0.66 });

    const background = MakkoEngine.staticAsset('shop_ui');
    if (background?.image.complete && background.image.naturalWidth > 0) {
      display.drawImage(background.image, wx, wy, this.winW, this.winH);
    } else {
      display.drawRoundRect(wx, wy, this.winW, this.winH, 20, { fill: '#f7ebd8', stroke: '#704526', lineWidth: 8 });
    }

    const close = this.closeHitbox();
    display.drawRoundRect(close.x, close.y, close.w, close.h, 12, {
      fill: '#ff2948', alpha: 0.3, stroke: '#ff2948', lineWidth: 3,
    });
    this.drawSeasonTabs(input.mouseX, input.mouseY);
    this.drawCropGrid(input.mouseX, input.mouseY);
    this.drawPurchasePanel(input.mouseX, input.mouseY);
  }

  private closeHitbox(): { x: number; y: number; w: number; h: number } {
    const size = 72;
    return {
      x: this.winX + this.winW - 108.5,
      y: this.winY + 86.5,
      w: size,
      h: size,
    };
  }

  private seasonTabBounds(): { x: number; y: number; w: number; h: number; gap: number } {
    return { x: this.winX + 62, y: this.winY + 270, w: 82, h: 82, gap: 10 };
  }

  private seedCardBounds(): { x: number; y: number; w: number; h: number; gap: number; rowGap: number; columns: number } {
    return { x: this.winX + 165, y: this.winY + 270, w: 145, h: 180, gap: 12, rowGap: 14, columns: 7 };
  }

  private seedCardPosition(index: number, totalItems: number): { x: number; y: number } {
    const cards = this.seedCardBounds();
    const rowStart = Math.floor(index / cards.columns) * cards.columns;
    const rowLength = Math.min(cards.columns, totalItems - rowStart);
    const column = index - rowStart;
    const rowOffset = rowLength < cards.columns
      ? ((cards.columns - rowLength) * (cards.w + cards.gap)) / 2
      : 0;
    return {
      x: cards.x + rowOffset + column * (cards.w + cards.gap),
      y: cards.y + Math.floor(index / cards.columns) * (cards.h + cards.rowGap),
    };
  }

  private switchSeason(season: ShopSeason): void {
    this.selectedSeason = season;
    this.selectedCropId = null;
    this.page = 0;
  }

  private purchasePanelBounds(): { x: number; y: number; w: number; h: number } {
    return {
      x: this.winX + 165,
      y: this.winY + 468,
      w: 1087,
      h: 160,
    };
  }

  private purchaseButtonBounds(): { x: number; y: number; w: number; h: number } {
    const panel = this.purchasePanelBounds();
    const w = 216;
    const h = 58;
    return {
      x: panel.x + panel.w - w - 22,
      y: panel.y + Math.round((panel.h - h) / 2),
      w,
      h,
    };
  }

  private purchase(crop: CropDef): void {
    if (!this.world || this.world.coins < crop.buyPrice) return;
    if (this.world.buySeed(crop.id, 1)) this.save?.();
  }

  private drawSeasonTabs(mx: number, my: number): void {
    const display = MakkoEngine.display;
    const tabs = this.seasonTabBounds();
    for (let index = 0; index < this.seasons.length; index++) {
      const season = this.seasons[index];
      const x = tabs.x;
      const y = tabs.y + index * (tabs.h + tabs.gap);
      const asset = MakkoEngine.staticAsset(season.assetKey);
      if (asset?.image.complete && asset.image.naturalWidth > 0) {
        display.drawImage(asset.image, x, y, tabs.w, tabs.h);
      } else {
        display.drawRoundRect(x, y, tabs.w, tabs.h, 12, { fill: '#e6d3b8', stroke: '#795532', lineWidth: 2 });
        display.drawText(season.label, x + tabs.w / 2, y + tabs.h / 2, {
          font: 'bold 17px serif', fill: '#000000', align: 'center', baseline: 'middle',
        });
      }
      if (this.selectedSeason === season.id) {
        display.drawRoundRect(x - 3, y - 3, tabs.w + 6, tabs.h + 6, 12, {
          stroke: '#f4c75e', lineWidth: 4,
        });
      } else if (this.isInRect(mx, my, x, y, tabs.w, tabs.h)) {
        display.drawRoundRect(x - 2, y - 2, tabs.w + 4, tabs.h + 4, 12, {
          stroke: '#fff1c9', lineWidth: 2,
        });
      }
    }
  }

  private drawCropGrid(mx: number, my: number): void {
    const display = MakkoEngine.display;
    const crops = getCropsBySeason(this.selectedSeason);
    const shown = crops.slice(this.page * this.itemsPerPage, (this.page + 1) * this.itemsPerPage);
    const cards = this.seedCardBounds();

    for (let index = 0; index < shown.length; index++) {
      const crop = shown[index];
      const position = this.seedCardPosition(index, shown.length);
      const cx = position.x;
      const cy = position.y;
      const hovered = this.isInRect(mx, my, cx, cy, cards.w, cards.h);
      const selected = this.selectedCropId === crop.id;
      const cardAsset = MakkoEngine.staticAsset('shop_icon_ui');
      if (cardAsset?.image.complete && cardAsset.image.naturalWidth > 0) {
        display.drawImage(cardAsset.image, cx, cy, cards.w, cards.h);
      } else {
        display.drawRoundRect(cx, cy, cards.w, cards.h, 14, {
          fill: '#d7b98c', stroke: '#805631', lineWidth: 2,
        });
      }
      if (selected) {
        display.drawRoundRect(cx - 3, cy - 3, cards.w + 6, cards.h + 6, 16, {
          stroke: '#69834f', lineWidth: 4,
        });
        display.drawRoundRect(cx + 1, cy + 1, cards.w - 2, cards.h - 2, 14, {
          stroke: '#ffe28a', lineWidth: 3,
        });
      } else if (hovered) {
        display.drawRoundRect(cx + 2, cy + 2, cards.w - 4, cards.h - 4, 14, {
          stroke: '#ffe28a', lineWidth: 3,
        });
      }

      const seedBag = crop.staticAssetKey ? MakkoEngine.staticAsset(crop.staticAssetKey) : null;
      if (seedBag?.image.complete && seedBag.image.naturalWidth > 0) {
        const isLargeSeedBag = crop.id === 'carrot' || crop.id === 'potato' || crop.id === 'strawberry' || crop.id === 'cauliflower';
        const imageHeight = isLargeSeedBag ? 104 : 93;
        const imageWidth = imageHeight * (seedBag.width / seedBag.height);
        const imageY = cy + (isLargeSeedBag ? 12 : 17.5);
        display.drawImage(seedBag.image, cx + (cards.w - imageWidth) / 2, imageY, imageWidth, imageHeight);
      }
      // The price is printed over the card's brown price strip.
      const priceText = `${crop.buyPrice}`;
      const priceFont = 'bold 24px monospace';
      const priceTextWidth = display.measureText(priceText, { font: priceFont }).width;
      const coinSize = 20;
      const coinGap = 7;
      const rowWidth = coinSize + coinGap + priceTextWidth;
      const rowLeft = cx + (cards.w - rowWidth) / 2 - 8;
      const priceY = cy + 145;
      const coinCenterX = rowLeft + coinSize / 2;
      display.drawCircle(coinCenterX, priceY, coinSize / 2, {
        fill: '#e9a923', stroke: '#805014', lineWidth: 2,
      });
      display.drawCircle(coinCenterX, priceY, 6, {
        fill: '#ffd968', stroke: '#fff0a8', lineWidth: 1,
      });
      display.drawText(priceText, rowLeft + coinSize + coinGap, priceY, {
        font: priceFont, fill: '#000000', align: 'left', baseline: 'middle',
      });

      if (selected) {
        const badgeW = 92;
        const badgeH = 20;
        const badgeX = cx + (cards.w - badgeW) / 2;
        const badgeY = cy - 10;
        display.drawRoundRect(badgeX, badgeY, badgeW, badgeH, 6, {
          fill: '#587444', stroke: '#f2d38a', lineWidth: 1.5,
        });
        display.drawText('✓ SELECTED', badgeX + badgeW / 2, badgeY + badgeH / 2, {
          font: 'bold 10px monospace', fill: '#fff8e7', align: 'center', baseline: 'middle',
        });
      }
    }

    const pageCount = Math.max(1, Math.ceil(crops.length / this.itemsPerPage));
    if (pageCount > 1) {
      const navY = this.winY + this.winH - 170;
      const prevX = this.winX + 710;
      const nextX = this.winX + 820;
      this.drawPageButton(prevX, navY, '◀', this.page > 0, this.isInRect(mx, my, prevX, navY, 48, 36));
      display.drawText(`${this.page + 1} / ${pageCount}`, this.winX + 789, navY + 18, {
        font: 'bold 15px monospace', fill: '#000000', align: 'center', baseline: 'middle',
      });
      this.drawPageButton(nextX, navY, '▶', this.page < pageCount - 1, this.isInRect(mx, my, nextX, navY, 48, 36));
    }
  }

  private drawPurchasePanel(mx: number, my: number): void {
    const d = MakkoEngine.display;
    const panel = this.purchasePanelBounds();
    const buyBtn = this.purchaseButtonBounds();

    // Wooden outer frame + parchment inner board
    d.drawRoundRect(panel.x + 3, panel.y + 4, panel.w, panel.h, 16, {
      fill: '#17130f', alpha: 0.25,
    });
    d.drawRoundRect(panel.x, panel.y, panel.w, panel.h, 16, {
      fill: '#3e3326', stroke: '#c9a878', lineWidth: 2,
    });
    d.drawRoundRect(panel.x + 6, panel.y + 6, panel.w - 12, panel.h - 12, 12, {
      fill: '#f7edd9', stroke: '#d8bc8c', lineWidth: 1,
    });

    if (!this.selectedCropId) {
      d.drawText('🌱 Select a Seed Packet Above', panel.x + 32, panel.y + 58, {
        font: 'bold 20px monospace',
        fill: '#463219',
        align: 'left',
        baseline: 'middle',
      });
      d.drawText(
        'Click any seed packet in the shop above to inspect its details, then click PURCHASE.',
        panel.x + 32,
        panel.y + 98,
        {
          font: '14px monospace',
          fill: '#786246',
          align: 'left',
          baseline: 'middle',
        },
      );

      // Disabled Purchase Button
      d.drawRoundRect(buyBtn.x, buyBtn.y, buyBtn.w, buyBtn.h, 12, {
        fill: '#d5c6ad',
        stroke: '#a89476',
        lineWidth: 2,
      });
      d.drawText('SELECT ITEM', buyBtn.x + buyBtn.w / 2, buyBtn.y + buyBtn.h / 2, {
        font: 'bold 15px monospace',
        fill: '#6e5c44',
        align: 'center',
        baseline: 'middle',
      });
      return;
    }

    const crop = getCropDef(this.selectedCropId);
    const coins = this.world?.coins ?? 0;
    const owned = this.world?.seeds[crop.id] ?? 0;
    const canAfford = coins >= crop.buyPrice;
    const btnHovered = canAfford && this.isInRect(mx, my, buyBtn.x, buyBtn.y, buyBtn.w, buyBtn.h);

    // Left seed packet preview box
    const previewX = panel.x + 20;
    const previewY = panel.y + 18;
    const previewW = 100;
    const previewH = 124;
    d.drawRoundRect(previewX, previewY, previewW, previewH, 10, {
      fill: '#ecdec3',
      stroke: '#cbb289',
      lineWidth: 1.5,
    });
    drawSeedPacket(crop, previewX + 12, previewY + 10, 76, 104);

    // Crop title & owned count pill
    const infoX = previewX + previewW + 22;
    d.drawText(`${crop.seasonIcon} ${crop.seedName}`, infoX, panel.y + 34, {
      font: 'bold 20px monospace',
      fill: '#3e2d19',
      align: 'left',
      baseline: 'middle',
    });

    const pouchText = `In Pouch: ×${owned}`;
    const pouchFont = 'bold 12px monospace';
    const pouchW = d.measureText(pouchText, { font: pouchFont }).width + 20;
    const titleW = d.measureText(`${crop.seasonIcon} ${crop.seedName}`, { font: 'bold 20px monospace' }).width;
    const pouchX = infoX + titleW + 16;
    d.drawRoundRect(pouchX, panel.y + 21, pouchW, 25, 7, {
      fill: '#dfead2',
      stroke: '#799962',
      lineWidth: 1.5,
    });
    d.drawText(pouchText, pouchX + pouchW / 2, panel.y + 33.5, {
      font: pouchFont,
      fill: '#3a5e2c',
      align: 'center',
      baseline: 'middle',
    });

    // Description
    d.drawText(crop.description, infoX, panel.y + 66, {
      font: '13px monospace',
      fill: '#6b563e',
      align: 'left',
      baseline: 'middle',
    });

    // Stats row
    const profit = crop.sellPrice - crop.buyPrice;
    const statsLine = `⏱ Growth: ${formatGrowthTime(crop.growthMinutes)}   ·   🪙 Price: ${crop.buyPrice} Coins   ·   📦 Harvest Value: ${crop.sellPrice} Coins (+${profit} profit)`;
    d.drawText(statsLine, infoX, panel.y + 98, {
      font: 'bold 13px monospace',
      fill: '#513f29',
      align: 'left',
      baseline: 'middle',
    });

    // Affordability / action line
    const statusLine = canAfford
      ? '✓ Click PURCHASE on the right to buy 1 seed packet'
      : `⚠ Need ${crop.buyPrice - coins} more Coins — sell harvested crops at the shipping bin [V]`;
    d.drawText(statusLine, infoX, panel.y + 128, {
      font: 'bold 12px monospace',
      fill: canAfford ? '#3f6a34' : '#9c4b34',
      align: 'left',
      baseline: 'middle',
    });

    // Purchase Button on the right
    d.drawRoundRect(buyBtn.x + 2, buyBtn.y + 3, buyBtn.w, buyBtn.h, 12, {
      fill: '#17130f',
      alpha: 0.22,
    });
    d.drawRoundRect(buyBtn.x, buyBtn.y, buyBtn.w, buyBtn.h, 12, {
      fill: canAfford ? (btnHovered ? '#7a965e' : '#69834f') : '#b89c86',
      stroke: canAfford ? (btnHovered ? '#f2d38a' : '#4a5e36') : '#8c6d56',
      lineWidth: 2,
    });
    d.drawText(
      canAfford ? 'PURCHASE' : 'NOT ENOUGH GOLD',
      buyBtn.x + buyBtn.w / 2,
      buyBtn.y + 21,
      {
        font: canAfford ? 'bold 16px monospace' : 'bold 13px monospace',
        fill: '#fff8e7',
        align: 'center',
        baseline: 'middle',
      },
    );
    d.drawText(
      `${crop.buyPrice} Coins`,
      buyBtn.x + buyBtn.w / 2,
      buyBtn.y + 41,
      {
        font: 'bold 12px monospace',
        fill: canAfford ? '#e5f0d8' : '#f2ded0',
        align: 'center',
        baseline: 'middle',
      },
    );
  }

  private drawPageButton(x: number, y: number, label: string, enabled: boolean, hovered: boolean): void {
    const display = MakkoEngine.display;
    display.drawRoundRect(x, y, 48, 36, 8, {
      fill: enabled ? (hovered ? '#f3d89b' : '#ead2a8') : '#d7c8b1',
      stroke: '#785532', lineWidth: 1.5,
    });
    display.drawText(label, x + 24, y + 18, {
      font: 'bold 16px monospace', fill: '#000000', align: 'center', baseline: 'middle',
    });
  }

  private isInRect(x: number, y: number, rx: number, ry: number, rw: number, rh: number): boolean {
    return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
  }
}
