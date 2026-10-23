import { MakkoEngine } from '@makko/engine';
import type { FarmWorld } from '../farm/farm-world';
import { type CropDef, type Season, getCropsBySeason } from '../farm/crops';

type ShopSeason = Exclude<Season, 'All'>;

export class ShopWindow {
  visible = false;
  private world: FarmWorld | null = null;
  private save: (() => void) | null = null;
  private selectedSeason: ShopSeason = 'Spring';
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
        this.purchase(shown[index]);
        return;
      }
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
    this.page = 0;
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
      const cardAsset = MakkoEngine.staticAsset('shop_icon_ui');
      if (cardAsset?.image.complete && cardAsset.image.naturalWidth > 0) {
        display.drawImage(cardAsset.image, cx, cy, cards.w, cards.h);
      } else {
        display.drawRoundRect(cx, cy, cards.w, cards.h, 14, {
          fill: '#d7b98c', stroke: '#805631', lineWidth: 2,
        });
      }
      if (hovered) {
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
