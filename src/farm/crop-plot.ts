import { RealCalendar } from '../time/real-calendar';
import { MakkoEngine, type IDisplay } from '@makko/engine';
import { getCropDef, type CropDef } from './crops';

const CARROT_GROWTH_ASSETS = ['carrot_s1', 'carrot_s2', 'carrot_s2', 'carrot_s3'] as const;
const POTATO_GROWTH_ASSETS = ['potato_s1', 'potato_s2', 'potato_s3', 'potato_s4_1'] as const;
const STRAWBERRY_GROWTH_ASSETS = ['strawberries_s1', 'strawberries_s2', 'strawberries_s3', 'strawberries_s4'] as const;
const CAULIFLOWER_GROWTH_ASSETS = ['cauliflower_s1', 'cauliflower_s2', 'cauliflower_s3', 'cauliflower_s4'] as const;
const GARLIC_GROWTH_ASSETS = ['garlic_1_1', 'garlic_s2', 'garlic_s3'] as const;
const RHUBARB_GROWTH_ASSETS = ['rhubarb_s1', 'rhubarb_s2', 'rhubarb_s3', 'rhubarb_s3'] as const;
const TOMATO_GROWTH_ASSETS = ['tomato_s1', 'tomato_s2', 'tomato_s3', 'tomato_s4'] as const;
const BLUEBERRY_GROWTH_ASSETS = ['blueberry_s1', 'blueberry_s2', 'blueberry_s3', 'blueberry_s4'] as const;
const CORN_GROWTH_ASSETS = ['corn_s1', 'corn_s2', 'corn_s3', 'corn_s4'] as const;
const MELON_GROWTH_ASSETS = ['melon_s1', 'melon_s2', 'melon_s3', 'melon_s4'] as const;
const PUMPKIN_GROWTH_ASSETS = ['pumpkin_s1', 'pumpkin_s2', 'pumpkin_s3', 'pumpkin_s4'] as const;
const CRANBERRY_GROWTH_ASSETS = ['cranberry_s1', 'cranberry_2', 'cranberry_s3', 'cranberry_s4'] as const;
const BEET_GROWTH_ASSETS = ['beet_s1', 'beet_s2', 'beet_s3', 'beet_s4'] as const;
const BROCCOLI_GROWTH_ASSETS = ['broccoli_s1', 'broccoli_s2', 'broccoli_s3', 'broccoli_s4'] as const;
const PARSNIP_GROWTH_ASSETS = ['parsnip_s1', 'parsnip_s2', 'parsnip_s3', 'parsnip_s4'] as const;
const LEEK_GROWTH_ASSETS = ['leek_s1', 'leek_s2', 'leek_s3', 'leek_s4'] as const;
const SPINACH_GROWTH_ASSETS = ['spinach_s1', 'spinach_s2', 'spinach_s3', 'spinach_s4'] as const;
const KALE_GROWTH_ASSETS = ['kale_s1', 'kale_s2', 'kale_s3', 'kale_s4'] as const;
const RADISH_GROWTH_ASSETS = ['radish_s1', 'radish_s2', 'radish_s3', 'radish_s4'] as const;

type CropDrawStyle = Parameters<IDisplay['drawRect']>[4];
type CropImageStyle = Parameters<IDisplay['drawImage']>[5];
type CropTextStyle = Parameters<IDisplay['drawText']>[3];

function createCropScaleDisplay(display: IDisplay, anchorX: number, anchorY: number, scale: number): IDisplay {
  const projectX = (x: number): number => anchorX + (x - anchorX) * scale;
  const projectY = (y: number): number => anchorY + (y - anchorY) * scale;
  const scaleStyle = (style?: CropDrawStyle): CropDrawStyle | undefined =>
    style?.lineWidth === undefined ? style : { ...style, lineWidth: style.lineWidth * scale };

  return new Proxy(display, {
    get(target, property, receiver): unknown {
      switch (property) {
        case 'drawRect':
          return (x: number, y: number, width: number, height: number, style?: CropDrawStyle): void =>
            target.drawRect(projectX(x), projectY(y), width * scale, height * scale, scaleStyle(style));
        case 'drawRoundRect':
          return (x: number, y: number, width: number, height: number, radius: number, style?: CropDrawStyle): void =>
            target.drawRoundRect(projectX(x), projectY(y), width * scale, height * scale, radius * scale, scaleStyle(style));
        case 'drawCircle':
          return (x: number, y: number, radius: number, style?: CropDrawStyle): void =>
            target.drawCircle(projectX(x), projectY(y), radius * scale, scaleStyle(style));
        case 'drawEllipse':
          return (x: number, y: number, radiusX: number, radiusY: number, style?: CropDrawStyle): void =>
            target.drawEllipse(projectX(x), projectY(y), radiusX * scale, radiusY * scale, scaleStyle(style));
        case 'drawLine':
          return (x1: number, y1: number, x2: number, y2: number, style?: CropDrawStyle): void =>
            target.drawLine(projectX(x1), projectY(y1), projectX(x2), projectY(y2), scaleStyle(style));
        case 'drawPolygon':
          return (points: Array<{ x: number; y: number }>, style?: CropDrawStyle): void =>
            target.drawPolygon(points.map(point => ({ x: projectX(point.x), y: projectY(point.y) })), scaleStyle(style));
        case 'drawImage':
          return (image: HTMLImageElement, x: number, y: number, width?: number, height?: number, style?: CropImageStyle): void =>
            target.drawImage(
              image,
              projectX(x),
              projectY(y),
              width === undefined ? undefined : width * scale,
              height === undefined ? undefined : height * scale,
              style,
            );
        case 'drawText':
          return (text: string, x: number, y: number, style?: CropTextStyle): void => {
            const font = style?.font?.replace(/(\\d+(?:\\.\\d+)?)px/, (_match, size: string) => `${Number(size) * scale}px`);
            target.drawText(text, projectX(x), projectY(y), style ? { ...style, ...(font ? { font } : {}) } : undefined);
          };
        default: {
          const value: unknown = Reflect.get(target, property, receiver);
          return typeof value === 'function' ? value.bind(target) : value;
        }
      }
    },
  });
}


export class CropPlot {
  tilled = false;
  planted = false;
  cropId: string | null = null;
  watered = false;
  growth = 0;
  previewGrowth: number | null = null;

  get cropDef(): CropDef {
    return getCropDef(this.cropId);
  }

  get mature(): boolean {
    if (!this.planted) return false;
    return this.growth >= this.cropDef.growthMinutes;
  }

  get growthPercent(): number {
    if (!this.planted) return 0;
    return Math.min(100, Math.floor((this.growth / this.cropDef.growthMinutes) * 100));
  }

  render(x: number, y: number, gridX: number, gridY: number, display: IDisplay = MakkoEngine.display): void {
    const d = display;
    const palette = RealCalendar.shared.palette;
    const season = RealCalendar.shared.season;
    const shade = (gridX * 7 + gridY * 3) % 4;

    // Base grass tile
    const grassAsset = MakkoEngine.staticAsset('grass_tile_1');
    if (grassAsset?.image.complete && grassAsset.image.naturalWidth > 0) {
      d.drawImage(grassAsset.image, x, y, 64, 64);
    } else {
      d.drawRect(x, y, 64, 64, { fill: palette.grass[shade] });
      d.drawRect(x, y + 63, 64, 1, { fill: palette.edge });
    }

    if (!this.tilled) {
      const px = x + 9 + (gridX * 13 + gridY * 9) % 39;
      const py = y + 10 + (gridY * 17 + gridX * 3) % 36;
      d.drawRect(px, py, 3, 7, { fill: palette.detail });
      d.drawRect(px + 4, py - 3, 3, 8, { fill: palette.edge });
      if (season === 'Spring' && shade === 0) {
        d.drawRect(px - 3, py - 4, 9, 5, { fill: palette.flower });
        d.drawRect(px, py - 5, 3, 3, { fill: '#fff0c6' });
      } else if (season === 'Autumn') {
        d.drawRect(px + 12, py + 7, 8, 4, { fill: shade % 2 ? '#d58554' : '#e6ba69' });
      } else if (season === 'Winter') {
        d.drawLine(px - 4, py + 1, px + 8, py + 1, { stroke: '#ffffff', lineWidth: 2 });
      }
      return;
    }

    // Tilled soil patch
    const soilAsset = MakkoEngine.staticAsset(this.watered ? 'soil_tile_2' : 'soil_tile_1');
    if (soilAsset?.image.complete && soilAsset.image.naturalWidth > 0) {
      d.drawImage(soilAsset.image, x, y, 64, 64);
    } else {
      d.drawRoundRect(x + 3, y + 3, 58, 58, 7, { fill: this.watered ? '#655345' : '#98704f' });
      for (let i = 0; i < 3; i++) {
        d.drawLine(x + 10, y + 15 + i * 16, x + 54, y + 15 + i * 16, {
          stroke: this.watered ? '#7a6854' : '#ae845c',
          lineWidth: 3,
        });
      }
    }
    if (season === 'Winter') d.drawRect(x + 5, y + 4, 54, 5, { fill: '#edf4fa' });

    if (!this.planted) return;

    // Crop rendering by stage
    const def = this.cropDef;
    const visualGrowth = this.previewGrowth ?? this.growth;
    const ratio = Math.min(1, visualGrowth / def.growthMinutes);
    const stage = def.id === 'strawberry' || def.id === 'cauliflower'
      ? (this.mature || ratio >= 1 ? 3 : ratio < 0.33 ? 0 : ratio < 0.66 ? 1 : 2)
      : ratio >= 1 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.25 ? 1 : 0;
    const cx = x + 32;
    const cy = y + 34;
    const cropDisplay = createCropScaleDisplay(d, cx, y + 62, 0.72);

    if (def.id === 'potato') this.renderPotatoStage(cx, cy, stage, cropDisplay);
    else if (def.id === 'strawberry') this.renderStrawberryStage(cx, cy, stage, cropDisplay);
    else if (def.id === 'cauliflower') this.renderCauliflowerStage(cx, cy, stage, cropDisplay);
    else if (def.id === 'carrot') this.renderCarrotStage(cx, cy, stage, cropDisplay);
    else if (def.id === 'garlic') this.renderGarlicStage(cx, y, stage, cropDisplay);
    else if (def.id === 'rhubarb') this.renderRhubarbStage(cx, y, stage, cropDisplay);
    else if (def.id === 'tomato') this.renderTomatoStage(cx, y, stage, cropDisplay);
    else if (def.id === 'blueberry') this.renderBlueberryStage(cx, y, stage, cropDisplay);
    else if (def.id === 'corn') this.renderCornStage(cx, y, stage, cropDisplay);
    else if (def.id === 'melon') this.renderMelonStage(cx, y, stage, cropDisplay);
    else if (def.id === 'pumpkin') this.renderPumpkinStage(cx, y, stage, cropDisplay);
    else if (def.id === 'cranberry') this.renderCranberryStage(cx, y, stage, cropDisplay);
    else if (def.id === 'beet') this.renderBeetStage(cx, y, stage, cropDisplay);
    else if (def.id === 'broccoli') this.renderBroccoliStage(cx, y, stage, cropDisplay);
    else if (def.id === 'parsnip') this.renderParsnipStage(cx, y, stage, cropDisplay);
    else if (def.id === 'leek') this.renderLeekStage(cx, y, stage, cropDisplay);
    else if (def.id === 'spinach') this.renderSpinachStage(cx, y, stage, cropDisplay);
    else if (def.id === 'kale') this.renderKaleStage(cx, y, stage, cropDisplay);
    else if (def.id === 'radish') this.renderRadishStage(cx, y, stage, cropDisplay);
    else this.renderCropStage(cx, cy, def, stage, cropDisplay);

    // Water droplet indicator
    if (this.watered) {
      d.drawCircle(x + 53, y + 53, 4, { fill: '#93cdd0' });
      d.drawCircle(x + 52, y + 52, 1.5, { fill: '#ffffff' });
    }

    // Harvest sparkle when fully mature
    if (this.previewGrowth !== null ? this.previewGrowth >= def.growthMinutes : this.mature) {
      const pulse = (Math.sin(Date.now() / 250) + 1) * 0.5;
      d.drawCircle(x + 48, y + 14, 2 + pulse * 1.5, { fill: '#fff5b0' });
      d.drawCircle(x + 16, y + 46, 1.5 + (1 - pulse) * 1.5, { fill: '#ffffff' });
    }
  }

  private renderCarrotStage(cx: number, cy: number, stage: number, d: IDisplay): void {
    const clampedStage = Math.min(3, Math.max(0, stage));
    const assetKey = CARROT_GROWTH_ASSETS[clampedStage];
    const asset = MakkoEngine.staticAsset(assetKey);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      const drawX = Math.round(cx - asset.width / 2);
      const drawY = Math.round(cy + 18 - asset.height);
      d.drawImage(asset.image, drawX, drawY, asset.width, asset.height);
      return;
    }
    this.renderCropStage(cx, cy, this.cropDef, stage, d);
  }

  private renderGarlicStage(cx: number, tileY: number, stage: number, d: IDisplay): void {
    const stageIndex = Math.min(GARLIC_GROWTH_ASSETS.length - 1, Math.max(0, stage));
    const asset = MakkoEngine.staticAsset(GARLIC_GROWTH_ASSETS[stageIndex]);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      const maxSizes = [24, 34, 46] as const;
      const maxHeight = maxSizes[stageIndex];
      const scale = maxHeight / asset.height;
      const width = asset.width * scale;
      const height = asset.height * scale;
      d.drawImage(asset.image, cx - width / 2, tileY + 58 - height, width, height);
      return;
    }
    this.renderCropStage(cx, tileY + 34, this.cropDef, stage, d);
  }

  private renderRhubarbStage(cx: number, tileY: number, stage: number, d: IDisplay): void {
    const stageIndex = Math.min(RHUBARB_GROWTH_ASSETS.length - 1, Math.max(0, stage));
    const asset = MakkoEngine.staticAsset(RHUBARB_GROWTH_ASSETS[stageIndex]);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      const maxHeights = [24, 36, 50, 50] as const;
      const height = maxHeights[stageIndex];
      const scale = height / asset.height;
      const width = asset.width * scale;
      d.drawImage(asset.image, cx - width / 2, tileY + 58 - height, width, height);
      return;
    }
    this.renderCropStage(cx, tileY + 34, this.cropDef, stage, d);
  }

  private renderTomatoStage(cx: number, tileY: number, stage: number, d: IDisplay): void {
    const stageIndex = Math.min(TOMATO_GROWTH_ASSETS.length - 1, Math.max(0, stage));
    const asset = MakkoEngine.staticAsset(TOMATO_GROWTH_ASSETS[stageIndex]);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      const maxHeights = [24, 34, 46, 50] as const;
      const height = maxHeights[stageIndex];
      const scale = height / asset.height;
      const width = asset.width * scale;
      d.drawImage(asset.image, cx - width / 2, tileY + 58 - height, width, height);
      return;
    }
    this.renderCropStage(cx, tileY + 34, this.cropDef, stage, d);
  }

  private renderBlueberryStage(cx: number, tileY: number, stage: number, d: IDisplay): void {
    const stageIndex = Math.min(BLUEBERRY_GROWTH_ASSETS.length - 1, Math.max(0, stage));
    const asset = MakkoEngine.staticAsset(BLUEBERRY_GROWTH_ASSETS[stageIndex]);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      const maxHeights = [24, 34, 46, 50] as const;
      const height = maxHeights[stageIndex];
      const scale = height / asset.height;
      const width = asset.width * scale;
      d.drawImage(asset.image, cx - width / 2, tileY + 58 - height, width, height);
      return;
    }
    this.renderCropStage(cx, tileY + 34, this.cropDef, stage, d);
  }

  private renderCornStage(cx: number, tileY: number, stage: number, d: IDisplay): void {
    const stageIndex = Math.min(CORN_GROWTH_ASSETS.length - 1, Math.max(0, stage));
    const asset = MakkoEngine.staticAsset(CORN_GROWTH_ASSETS[stageIndex]);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      const maxHeights = [26, 34, 46, 56] as const;
      const height = maxHeights[stageIndex];
      const scale = height / asset.height;
      const width = asset.width * scale;
      d.drawImage(asset.image, cx - width / 2, tileY + 58 - height, width, height);
      return;
    }
    this.renderCropStage(cx, tileY + 34, this.cropDef, stage, d);
  }

  private renderMelonStage(cx: number, tileY: number, stage: number, d: IDisplay): void {
    const stageIndex = Math.min(MELON_GROWTH_ASSETS.length - 1, Math.max(0, stage));
    const asset = MakkoEngine.staticAsset(MELON_GROWTH_ASSETS[stageIndex]);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      const maxHeights = [24, 34, 46, 52] as const;
      const height = maxHeights[stageIndex];
      const scale = height / asset.height;
      const width = asset.width * scale;
      d.drawImage(asset.image, cx - width / 2, tileY + 58 - height, width, height);
      return;
    }
    this.renderCropStage(cx, tileY + 34, this.cropDef, stage, d);
  }

  private renderPumpkinStage(cx: number, tileY: number, stage: number, d: IDisplay): void {
    const stageIndex = Math.min(PUMPKIN_GROWTH_ASSETS.length - 1, Math.max(0, stage));
    const asset = MakkoEngine.staticAsset(PUMPKIN_GROWTH_ASSETS[stageIndex]);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      const maxHeights = [24, 34, 46, 54] as const;
      const height = maxHeights[stageIndex];
      const scale = height / asset.height;
      const width = asset.width * scale;
      d.drawImage(asset.image, cx - width / 2, tileY + 58 - height, width, height);
      return;
    }
    this.renderCropStage(cx, tileY + 34, this.cropDef, stage, d);
  }

  private renderKaleStage(cx: number, tileY: number, stage: number, d: IDisplay): void {
    const stageIndex = Math.min(KALE_GROWTH_ASSETS.length - 1, Math.max(0, stage));
    const asset = MakkoEngine.staticAsset(KALE_GROWTH_ASSETS[stageIndex]);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      const maxHeights = [26, 36, 46, 54] as const;
      const scale = Math.min(58 / asset.width, maxHeights[stageIndex] / asset.height);
      const width = asset.width * scale;
      const height = asset.height * scale;
      d.drawImage(asset.image, cx - width / 2, tileY + 58 - height, width, height);
      return;
    }
    this.renderCropStage(cx, tileY + 34, this.cropDef, stage, d);
  }

  private renderRadishStage(cx: number, tileY: number, stage: number, d: IDisplay): void {
    const stageIndex = Math.min(RADISH_GROWTH_ASSETS.length - 1, Math.max(0, stage));
    const asset = MakkoEngine.staticAsset(RADISH_GROWTH_ASSETS[stageIndex]);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      const maxHeights = [24, 32, 44, 52] as const;
      const scale = Math.min(58 / asset.width, maxHeights[stageIndex] / asset.height);
      const width = asset.width * scale;
      const height = asset.height * scale;
      d.drawImage(asset.image, cx - width / 2, tileY + 58 - height, width, height);
      return;
    }
    this.renderCropStage(cx, tileY + 34, this.cropDef, stage, d);
  }

  private renderCranberryStage(cx: number, tileY: number, stage: number, d: IDisplay): void {
    const stageIndex = Math.min(CRANBERRY_GROWTH_ASSETS.length - 1, Math.max(0, stage));
    const asset = MakkoEngine.staticAsset(CRANBERRY_GROWTH_ASSETS[stageIndex]);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      d.drawImage(asset.image, cx - asset.width / 2, tileY + 58 - asset.height, asset.width, asset.height);
      return;
    }
    this.renderCropStage(cx, tileY + 34, this.cropDef, stage, d);
  }

  private renderBeetStage(cx: number, tileY: number, stage: number, d: IDisplay): void {
    const stageIndex = Math.min(BEET_GROWTH_ASSETS.length - 1, Math.max(0, stage));
    const asset = MakkoEngine.staticAsset(BEET_GROWTH_ASSETS[stageIndex]);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      d.drawImage(asset.image, cx - asset.width / 2, tileY + 58 - asset.height, asset.width, asset.height);
      return;
    }
    this.renderCropStage(cx, tileY + 34, this.cropDef, stage, d);
  }

  private renderBroccoliStage(cx: number, tileY: number, stage: number, d: IDisplay): void {
    const stageIndex = Math.min(BROCCOLI_GROWTH_ASSETS.length - 1, Math.max(0, stage));
    const asset = MakkoEngine.staticAsset(BROCCOLI_GROWTH_ASSETS[stageIndex]);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      d.drawImage(asset.image, cx - asset.width / 2, tileY + 58 - asset.height, asset.width, asset.height);
      return;
    }
    this.renderCropStage(cx, tileY + 34, this.cropDef, stage, d);
  }

  private renderLeekStage(cx: number, tileY: number, stage: number, d: IDisplay): void {
    const stageIndex = Math.min(LEEK_GROWTH_ASSETS.length - 1, Math.max(0, stage));
    const asset = MakkoEngine.staticAsset(LEEK_GROWTH_ASSETS[stageIndex]);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      d.drawImage(asset.image, cx - asset.width / 2, tileY + 58 - asset.height, asset.width, asset.height);
      return;
    }
    this.renderCropStage(cx, tileY + 34, this.cropDef, stage, d);
  }

  private renderSpinachStage(cx: number, tileY: number, stage: number, d: IDisplay): void {
    const stageIndex = Math.min(SPINACH_GROWTH_ASSETS.length - 1, Math.max(0, stage));
    const asset = MakkoEngine.staticAsset(SPINACH_GROWTH_ASSETS[stageIndex]);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      d.drawImage(asset.image, cx - asset.width / 2, tileY + 58 - asset.height, asset.width, asset.height);
      return;
    }
    this.renderCropStage(cx, tileY + 34, this.cropDef, stage, d);
  }

  private renderParsnipStage(cx: number, tileY: number, stage: number, d: IDisplay): void {
    const stageIndex = Math.min(PARSNIP_GROWTH_ASSETS.length - 1, Math.max(0, stage));
    const asset = MakkoEngine.staticAsset(PARSNIP_GROWTH_ASSETS[stageIndex]);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      d.drawImage(asset.image, cx - asset.width / 2, tileY + 58 - asset.height, asset.width, asset.height);
      return;
    }
    this.renderCropStage(cx, tileY + 34, this.cropDef, stage, d);
  }

  private renderPotatoStage(cx: number, cy: number, stage: number, d: IDisplay): void {
    const assetKey = POTATO_GROWTH_ASSETS[stage];
    const asset = MakkoEngine.staticAsset(assetKey);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      d.drawImage(asset.image, cx - asset.width / 2, cy - asset.height / 2, asset.width, asset.height);
      return;
    }
    this.renderCropStage(cx, cy, this.cropDef, stage, d);
  }

  private renderCauliflowerStage(cx: number, cy: number, stage: number, d: IDisplay): void {
    const assetKey = CAULIFLOWER_GROWTH_ASSETS[Math.min(3, Math.max(0, stage))];
    const asset = MakkoEngine.staticAsset(assetKey);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      const drawX = Math.round(cx - asset.width / 2);
      const drawY = Math.round(cy + 18 - asset.height);
      d.drawImage(asset.image, drawX, drawY, asset.width, asset.height);
      return;
    }

    // Fall back to a stage-appropriate cauliflower illustration while assets load.
    if (stage === 0) {
      d.drawRect(cx - 2, cy + 2, 4, 10, { fill: '#4f8b3d' });
      d.drawEllipse(cx - 5, cy, 5, 3, { fill: '#73b94c' });
      d.drawEllipse(cx + 5, cy, 5, 3, { fill: '#73b94c' });
      return;
    }

    if (stage === 1) {
      d.drawEllipse(cx - 9, cy + 2, 8, 6, { fill: '#45733e' });
      d.drawEllipse(cx + 9, cy + 2, 8, 6, { fill: '#45733e' });
      d.drawEllipse(cx, cy - 3, 7, 5, { fill: '#52834b' });
      return;
    }

    d.drawEllipse(cx - 12, cy + 3, 10, 6, { fill: '#45733e' });
    d.drawEllipse(cx + 12, cy + 3, 10, 6, { fill: '#45733e' });
    d.drawEllipse(cx, cy + 8, 12, 6, { fill: '#3d6637' });
    const curdRadius = stage === 2 ? 7 : 10;
    d.drawCircle(cx, cy - 3, curdRadius, { fill: '#f7eed4', stroke: '#ccbfa3', lineWidth: 1 });
    d.drawCircle(cx - curdRadius * 0.38, cy - 5, curdRadius * 0.38, { fill: '#ffffff' });
    d.drawCircle(cx + curdRadius * 0.38, cy - 5, curdRadius * 0.38, { fill: '#ffffff' });
    d.drawCircle(cx, cy - 1, curdRadius * 0.38, { fill: '#ffffff' });
  }

  private renderStrawberryStage(cx: number, cy: number, stage: number, d: IDisplay): void {
    const assetKey = STRAWBERRY_GROWTH_ASSETS[Math.min(3, Math.max(0, stage))];
    const asset = MakkoEngine.staticAsset(assetKey);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      const drawX = Math.round(cx - asset.width / 2);
      const drawY = Math.round(cy + 18 - asset.height);
      d.drawImage(asset.image, drawX, drawY, asset.width, asset.height);
      return;
    }

    if (stage === 0) {
      // Phase 1: Sprout - Young seedling breaking through tilled farm soil
      d.drawRoundRect(cx - 8, cy + 8, 16, 5, 2, { fill: '#75451f' });
      d.drawRect(cx - 2, cy + 2, 4, 10, { fill: '#226a24' });
      d.drawPolygon([
        { x: cx, y: cy + 4 }, { x: cx - 8, y: cy + 1 },
        { x: cx - 10, y: cy - 5 }, { x: cx - 4, y: cy - 4 },
        { x: cx, y: cy },
      ], { fill: '#268b27' });
      d.drawRect(cx - 7, cy - 3, 5, 2, { fill: '#55c52f' });
      d.drawPolygon([
        { x: cx, y: cy + 2 }, { x: cx + 7, y: cy - 4 },
        { x: cx + 11, y: cy - 4 }, { x: cx + 9, y: cy + 2 },
        { x: cx + 2, y: cy + 5 },
      ], { fill: '#237c24' });
      d.drawRect(cx + 4, cy - 2, 5, 2, { fill: '#51bd2d' });
      return;
    }

    if (stage === 1) {
      // Phase 2: Foliage - Expanding cluster of bright green trifoliate strawberry leaves
      d.drawRect(cx - 2, cy - 1, 4, 17, { fill: '#205d20' });
      d.drawPolygon([
        { x: cx - 1, y: cy + 3 }, { x: cx - 15, y: cy - 1 },
        { x: cx - 18, y: cy - 6 }, { x: cx - 15, y: cy - 11 },
        { x: cx - 8, y: cy - 9 }, { x: cx - 2, y: cy - 4 },
      ], { fill: '#17651d' });
      d.drawPolygon([
        { x: cx - 1, y: cy + 2 }, { x: cx - 12, y: cy - 1 },
        { x: cx - 15, y: cy - 5 }, { x: cx - 10, y: cy - 7 },
        { x: cx - 3, y: cy - 3 },
      ], { fill: '#35a927' });
      d.drawRect(cx - 12, cy - 6, 5, 3, { fill: '#62cf32' });
      d.drawPolygon([
        { x: cx + 1, y: cy + 1 }, { x: cx + 9, y: cy - 7 },
        { x: cx + 15, y: cy - 9 }, { x: cx + 18, y: cy - 4 },
        { x: cx + 15, y: cy + 2 }, { x: cx + 4, y: cy + 5 },
      ], { fill: '#17651d' });
      d.drawPolygon([
        { x: cx + 2, y: cy + 1 }, { x: cx + 9, y: cy - 5 },
        { x: cx + 14, y: cy - 6 }, { x: cx + 14, y: cy - 2 },
        { x: cx + 11, y: cy }, { x: cx + 4, y: cy + 3 },
      ], { fill: '#42b52b' });
      d.drawRect(cx + 9, cy - 4, 4, 3, { fill: '#70d23b' });
      d.drawPolygon([
        { x: cx - 3, y: cy - 3 }, { x: cx - 4, y: cy - 13 },
        { x: cx, y: cy - 17 }, { x: cx + 5, y: cy - 14 },
        { x: cx + 4, y: cy - 5 }, { x: cx + 1, y: cy - 2 },
      ], { fill: '#1c6b20' });
      d.drawPolygon([
        { x: cx - 1, y: cy - 4 }, { x: cx - 1, y: cy - 12 },
        { x: cx + 1, y: cy - 15 }, { x: cx + 3, y: cy - 12 },
        { x: cx + 2, y: cy - 5 },
      ], { fill: '#55bf2e' });
      return;
    }

    // Leaf canopy expands for Phase 3 (Flowering) and Phase 4 (Ripe Fruit)
    d.drawRect(cx - 2, cy - 1, 4, 17, { fill: '#205d20' });
    d.drawPolygon([
      { x: cx - 1, y: cy + 3 }, { x: cx - 17, y: cy - 1 },
      { x: cx - 21, y: cy - 7 }, { x: cx - 18, y: cy - 13 },
      { x: cx - 10, y: cy - 11 }, { x: cx - 3, y: cy - 5 },
    ], { fill: '#17651d' });
    d.drawPolygon([
      { x: cx - 1, y: cy + 2 }, { x: cx - 14, y: cy - 1 },
      { x: cx - 17, y: cy - 7 }, { x: cx - 12, y: cy - 9 },
      { x: cx - 4, y: cy - 4 },
    ], { fill: '#35a927' });
    d.drawRect(cx - 14, cy - 7, 6, 3, { fill: '#62cf32' });
    d.drawPolygon([
      { x: cx + 1, y: cy + 1 }, { x: cx + 10, y: cy - 8 },
      { x: cx + 17, y: cy - 10 }, { x: cx + 21, y: cy - 4 },
      { x: cx + 17, y: cy + 2 }, { x: cx + 4, y: cy + 6 },
    ], { fill: '#17651d' });
    d.drawPolygon([
      { x: cx + 3, y: cy + 1 }, { x: cx + 11, y: cy - 6 },
      { x: cx + 17, y: cy - 7 }, { x: cx + 17, y: cy - 3 },
      { x: cx + 13, y: cy }, { x: cx + 5, y: cy + 3 },
    ], { fill: '#42b52b' });
    d.drawRect(cx + 11, cy - 5, 5, 3, { fill: '#70d23b' });
    d.drawPolygon([
      { x: cx - 4, y: cy - 4 }, { x: cx - 5, y: cy - 15 },
      { x: cx, y: cy - 20 }, { x: cx + 6, y: cy - 16 },
      { x: cx + 5, y: cy - 6 }, { x: cx + 1, y: cy - 2 },
    ], { fill: '#1c6b20' });
    d.drawPolygon([
      { x: cx - 1, y: cy - 5 }, { x: cx - 1, y: cy - 14 },
      { x: cx + 1, y: cy - 17 }, { x: cx + 4, y: cy - 14 },
      { x: cx + 3, y: cy - 6 },
    ], { fill: '#55bf2e' });

    // Side leaves
    d.drawPolygon([
      { x: cx - 4, y: cy + 4 }, { x: cx - 14, y: cy + 1 },
      { x: cx - 19, y: cy + 5 }, { x: cx - 17, y: cy + 12 },
      { x: cx - 10, y: cy + 13 }, { x: cx - 2, y: cy + 8 },
    ], { fill: '#1b6a20' });
    d.drawPolygon([
      { x: cx + 4, y: cy + 4 }, { x: cx + 13, y: cy + 1 },
      { x: cx + 19, y: cy + 5 }, { x: cx + 17, y: cy + 12 },
      { x: cx + 10, y: cy + 13 }, { x: cx + 2, y: cy + 8 },
    ], { fill: '#1b6a20' });
    d.drawRect(cx - 14, cy + 5, 7, 4, { fill: '#42ae29' });
    d.drawRect(cx + 7, cy + 5, 7, 4, { fill: '#42ae29' });
    d.drawRect(cx - 11, cy + 6, 4, 2, { fill: '#68cd35' });
    d.drawRect(cx + 8, cy + 6, 4, 2, { fill: '#68cd35' });

    // White blossoms with warm yellow centers appear at flowering stage (Phase 3 & Phase 4)
    this.drawStrawberryFlower(cx - 11, cy - 12, d);
    this.drawStrawberryFlower(cx + 13, cy - 8, d);
    if (stage === 2) return;

    // Phase 4: Ripe berries hang beneath the foliage once the plant is mature
    this.drawStrawberryBerry(cx - 13, cy + 3, 0.8, d);
    this.drawStrawberryBerry(cx + 12, cy + 1, 0.78, d);
    this.drawStrawberryBerry(cx + 1, cy + 8, 0.9, d);
  }

  private drawStrawberryFlower(cx: number, cy: number, d: IDisplay): void {
    d.drawRect(cx - 2, cy - 5, 4, 3, { fill: '#fffdf0' });
    d.drawRect(cx - 5, cy - 2, 3, 4, { fill: '#fffdf0' });
    d.drawRect(cx + 2, cy - 2, 3, 4, { fill: '#fffdf0' });
    d.drawRect(cx - 2, cy + 2, 4, 3, { fill: '#fffdf0' });
    d.drawRect(cx - 2, cy - 1, 4, 4, { fill: '#f5d92d' });
  }

  private drawStrawberryBerry(cx: number, cy: number, scale: number, d: IDisplay): void {
    const width = 10 * scale;
    const height = 13 * scale;
    d.drawPolygon([
      { x: cx - width / 2, y: cy - height * 0.35 },
      { x: cx + width / 2, y: cy - height * 0.35 },
      { x: cx + width * 0.38, y: cy + height * 0.2 },
      { x: cx, y: cy + height / 2 },
      { x: cx - width * 0.38, y: cy + height * 0.2 },
    ], { fill: '#e52d3c', stroke: '#941b24', lineWidth: 1 });
    d.drawRect(cx - 2, cy - height * 0.45, 4, 2, { fill: '#48a72f' });
    d.drawRect(cx - 1, cy - height * 0.25, 2, 2, { fill: '#fff17b' });
    d.drawRect(cx + 2, cy, 2, 2, { fill: '#fff17b' });
    d.drawRect(cx - 1, cy + height * 0.2, 2, 2, { fill: '#fff17b' });
  }

  private renderCropStage(cx: number, cy: number, def: CropDef, stage: number, d: IDisplay): void {

    // Stage 0: Sprout / Young seed shoot
    if (stage === 0) {
      d.drawRoundRect(cx - 5, cy + 6, 10, 6, 2, { fill: '#835f3d' });
      d.drawLine(cx, cy + 6, cx, cy - 2, { stroke: '#70a845', lineWidth: 2 });
      d.drawCircle(cx - 3, cy - 2, 2.5, { fill: '#8cd357' });
      d.drawCircle(cx + 3, cy - 2, 2.5, { fill: '#8cd357' });
      return;
    }

    // Stage 1: Growing leafy bush / shoots
    if (stage === 1) {
      d.drawLine(cx, cy + 8, cx, cy - 4, { stroke: '#568b36', lineWidth: 2.5 });
      d.drawEllipse(cx - 6, cy - 2, 5, 8, { fill: def.foliageColor });
      d.drawEllipse(cx + 6, cy - 2, 5, 8, { fill: def.foliageColor });
      d.drawCircle(cx, cy - 7, 5, { fill: '#8cd357' });
      return;
    }

    // Stage 2: Pre-mature budding
    if (stage === 2) {
      // Foliage base
      d.drawEllipse(cx - 8, cy + 2, 7, 9, { fill: def.foliageColor });
      d.drawEllipse(cx + 8, cy + 2, 7, 9, { fill: def.foliageColor });
      d.drawEllipse(cx, cy - 6, 9, 6, { fill: def.foliageColor });

      // Small budding fruit / swollen root
      d.drawCircle(cx, cy + 2, 6, { fill: def.primaryColor, alpha: 0.85 });
      return;
    }

    // Stage 3: Fully Mature Crop!
    this.renderMatureCrop(cx, cy, def, d);
  }

  private renderMatureCrop(cx: number, cy: number, def: CropDef, d: IDisplay): void {

    // Static asset fallback or custom drawing
    switch (def.id) {
      case 'cabbage': {
        // Outer cabbage leaves
        d.drawCircle(cx - 9, cy + 2, 10, { fill: '#4d8a3a' });
        d.drawCircle(cx + 9, cy + 2, 10, { fill: '#4d8a3a' });
        d.drawCircle(cx, cy + 8, 10, { fill: '#5a9947' });
        // Dense head
        d.drawCircle(cx, cy - 1, 11, { fill: '#84d46c', stroke: '#3f772e', lineWidth: 1.5 });
        d.drawCircle(cx - 2, cy - 3, 6, { fill: '#a8ee92' });
        d.drawCircle(cx + 3, cy + 1, 4, { fill: '#6ebd54' });
        break;
      }

      case 'carrot': {
        // Lush feathery greens
        d.drawLine(cx, cy - 2, cx - 11, cy - 15, { stroke: '#408732', lineWidth: 2.5 });
        d.drawLine(cx, cy - 2, cx, cy - 18, { stroke: '#56a743', lineWidth: 2.5 });
        d.drawLine(cx, cy - 2, cx + 11, cy - 15, { stroke: '#408732', lineWidth: 2.5 });
        d.drawCircle(cx - 10, cy - 14, 3, { fill: '#6ebd54' });
        d.drawCircle(cx, cy - 17, 3, { fill: '#7cd262' });
        d.drawCircle(cx + 10, cy - 14, 3, { fill: '#6ebd54' });
        // Carrot root bulging out of the soil
        d.drawPolygon([
          { x: cx - 8, y: cy - 2 },
          { x: cx + 8, y: cy - 2 },
          { x: cx + 3, y: cy + 13 },
          { x: cx, y: cy + 17 },
          { x: cx - 3, y: cy + 13 },
        ], { fill: '#f17726' });
        d.drawLine(cx - 5, cy + 3, cx + 2, cy + 3, { stroke: '#cc5a12', lineWidth: 1.5 });
        d.drawLine(cx - 4, cy + 8, cx + 3, cy + 8, { stroke: '#cc5a12', lineWidth: 1.5 });
        d.drawLine(cx - 3, cy, cx - 1, cy + 12, { stroke: '#ffaa6e', lineWidth: 2 });
        break;
      }

      case 'potato': {
        // Bushy leafy green top
        d.drawCircle(cx - 8, cy - 8, 7, { fill: '#4d7832' });
        d.drawCircle(cx + 8, cy - 8, 7, { fill: '#4d7832' });
        d.drawCircle(cx, cy - 12, 8, { fill: '#5e943e' });
        // Potato tubers in furrow
        d.drawEllipse(cx - 6, cy + 4, 9, 7, { fill: '#cca064', stroke: '#8c6633', lineWidth: 1 });
        d.drawCircle(cx - 8, cy + 2, 4, { fill: '#deb983' });
        d.drawEllipse(cx + 7, cy + 6, 8, 6, { fill: '#bfa06b', stroke: '#8c6633', lineWidth: 1 });
        d.drawCircle(cx - 6, cy + 4, 1, { fill: '#634720' });
        d.drawCircle(cx + 8, cy + 6, 1, { fill: '#634720' });
        break;
      }

      case 'pumpkin': {
        // Sprawling vines
        d.drawLine(cx, cy - 6, cx - 14, cy - 12, { stroke: '#4d7832', lineWidth: 2 });
        d.drawLine(cx, cy - 6, cx + 14, cy - 10, { stroke: '#4d7832', lineWidth: 2 });
        d.drawCircle(cx - 13, cy - 11, 4, { fill: '#639c42' });
        d.drawCircle(cx + 13, cy - 9, 4, { fill: '#639c42' });
        // Big plump pumpkin
        d.drawEllipse(cx - 9, cy + 3, 9, 13, { fill: '#c9540c' });
        d.drawEllipse(cx + 9, cy + 3, 9, 13, { fill: '#c9540c' });
        d.drawEllipse(cx, cy + 3, 11, 14, { fill: '#e86a17', stroke: '#a84105', lineWidth: 1.5 });
        d.drawCircle(cx - 3, cy, 6, { fill: '#ffa559' });
        // Stem
        d.drawRect(cx - 3, cy - 14, 5, 8, { fill: '#558738' });
        d.drawLine(cx, cy - 13, cx + 5, cy - 17, { stroke: '#6aa348', lineWidth: 2 });
        break;
      }

      case 'strawberry': {
        // Dark green leaves
        d.drawEllipse(cx - 10, cy - 6, 7, 9, { fill: '#336d26' });
        d.drawEllipse(cx + 10, cy - 6, 7, 9, { fill: '#336d26' });
        d.drawEllipse(cx, cy - 11, 8, 7, { fill: '#418232' });
        // Big juicy strawberry
        d.drawPolygon([
          { x: cx - 10, y: cy - 2 },
          { x: cx + 10, y: cy - 2 },
          { x: cx + 8, y: cy + 7 },
          { x: cx, y: cy + 16 },
          { x: cx - 8, y: cy + 7 },
        ], { fill: '#e63946', stroke: '#9e1422', lineWidth: 1.5 });
        // Strawberry seeds & shine
        d.drawCircle(cx - 4, cy + 2, 4, { fill: '#ff6b78' });
        d.drawCircle(cx - 3, cy + 3, 1, { fill: '#fff275' });
        d.drawCircle(cx + 4, cy + 3, 1, { fill: '#fff275' });
        d.drawCircle(cx, cy + 9, 1, { fill: '#fff275' });
        // Green calyx top
        d.drawPolygon([
          { x: cx - 8, y: cy - 6 },
          { x: cx, y: cy - 2 },
          { x: cx + 8, y: cy - 6 },
          { x: cx + 4, y: cy - 1 },
          { x: cx - 4, y: cy - 1 },
        ], { fill: '#45993a' });
        break;
      }

      case 'tomato': {
        // Staked vine
        d.drawLine(cx, cy + 14, cx, cy - 16, { stroke: '#4d7832', lineWidth: 2 });
        d.drawEllipse(cx - 8, cy - 8, 6, 8, { fill: '#3c7e33' });
        d.drawEllipse(cx + 8, cy - 8, 6, 8, { fill: '#3c7e33' });
        // Two glossy ripe tomatoes
        d.drawCircle(cx - 6, cy + 4, 9, { fill: '#d92525', stroke: '#9e1414', lineWidth: 1 });
        d.drawCircle(cx - 8, cy + 2, 3, { fill: '#ff6666' });
        d.drawCircle(cx + 7, cy + 2, 8, { fill: '#e83333', stroke: '#a81818', lineWidth: 1 });
        d.drawCircle(cx + 5, cy, 3, { fill: '#ff7777' });
        // Green calyx stars
        d.drawLine(cx - 9, cy - 4, cx - 3, cy - 4, { stroke: '#4ea03a', lineWidth: 2 });
        d.drawLine(cx + 4, cy - 5, cx + 10, cy - 5, { stroke: '#4ea03a', lineWidth: 2 });
        break;
      }

      case 'corn': {
        // Tall corn stalk
        d.drawLine(cx, cy + 15, cx, cy - 18, { stroke: '#447824', lineWidth: 3.5 });
        d.drawLine(cx, cy - 5, cx - 12, cy - 13, { stroke: '#568b2f', lineWidth: 3 });
        d.drawLine(cx, cy - 2, cx + 12, cy - 10, { stroke: '#568b2f', lineWidth: 3 });
        // Golden cob with husk
        d.drawEllipse(cx - 4, cy + 1, 4, 11, { fill: '#558b2f' });
        d.drawEllipse(cx + 4, cy + 1, 4, 11, { fill: '#558b2f' });
        d.drawRoundRect(cx - 4, cy - 8, 8, 17, 4, { fill: '#f4c430', stroke: '#b5820a', lineWidth: 1 });
        for (let yk = cy - 6; yk <= cy + 7; yk += 3) {
          d.drawLine(cx - 3, yk, cx + 3, yk, { stroke: '#d49b1a', lineWidth: 1 });
        }
        // Silk tassel
        d.drawLine(cx - 1, cy - 9, cx - 3, cy - 15, { stroke: '#b58e57', lineWidth: 1.5 });
        d.drawLine(cx + 1, cy - 9, cx + 3, cy - 16, { stroke: '#b58e57', lineWidth: 1.5 });
        break;
      }

      case 'cauliflower': {
        // Leafy outer bowl
        d.drawCircle(cx - 10, cy, 10, { fill: '#45733e' });
        d.drawCircle(cx + 10, cy, 10, { fill: '#45733e' });
        d.drawCircle(cx, cy + 8, 10, { fill: '#3d6637' });
        // Dense white curd florets
        d.drawCircle(cx, cy - 1, 11, { fill: '#f7eed4', stroke: '#ccbfa3', lineWidth: 1.5 });
        d.drawCircle(cx - 4, cy - 3, 4, { fill: '#ffffff' });
        d.drawCircle(cx + 4, cy - 3, 4, { fill: '#ffffff' });
        d.drawCircle(cx, cy + 2, 4, { fill: '#ffffff' });
        break;
      }

      case 'eggplant': {
        // Foliage
        d.drawEllipse(cx - 8, cy - 10, 7, 9, { fill: '#436d33' });
        d.drawEllipse(cx + 8, cy - 10, 7, 9, { fill: '#436d33' });
        // Shiny eggplant
        d.drawPolygon([
          { x: cx - 5, y: cy - 4 },
          { x: cx + 5, y: cy - 4 },
          { x: cx + 10, y: cy + 5 },
          { x: cx + 5, y: cy + 15 },
          { x: cx - 5, y: cy + 15 },
          { x: cx - 10, y: cy + 5 },
        ], { fill: '#6a1b7a', stroke: '#3f004d', lineWidth: 1.5 });
        d.drawCircle(cx - 3, cy + 5, 4, { fill: '#9f48ad' });
        // Green calyx cap
        d.drawPolygon([
          { x: cx - 7, y: cy - 6 },
          { x: cx + 7, y: cy - 6 },
          { x: cx, y: cy - 2 },
        ], { fill: '#4a8536' });
        break;
      }

      case 'snow_berry': {
        // Frosty branch
        d.drawLine(cx - 8, cy + 8, cx + 8, cy - 10, { stroke: '#729bb0', lineWidth: 2.5 });
        d.drawCircle(cx - 6, cy + 4, 7, { fill: '#48bfe3', stroke: '#207894', lineWidth: 1 });
        d.drawCircle(cx + 6, cy - 4, 7, { fill: '#48bfe3', stroke: '#207894', lineWidth: 1 });
        d.drawCircle(cx, cy + 2, 6, { fill: '#72efdd' });
        d.drawCircle(cx - 7, cy + 2, 2, { fill: '#ffffff' });
        d.drawCircle(cx + 5, cy - 6, 2, { fill: '#ffffff' });
        break;
      }

      case 'winter_radish': {
        // Green frosty leaves
        d.drawLine(cx, cy - 4, cx - 9, cy - 15, { stroke: '#568b75', lineWidth: 2.5 });
        d.drawLine(cx, cy - 4, cx + 9, cy - 15, { stroke: '#568b75', lineWidth: 2.5 });
        // Magenta / white radish
        d.drawPolygon([
          { x: cx - 7, y: cy - 4 },
          { x: cx + 7, y: cy - 4 },
          { x: cx + 4, y: cy + 10 },
          { x: cx, y: cy + 16 },
          { x: cx - 4, y: cy + 10 },
        ], { fill: '#c72c57' });
        d.drawPolygon([
          { x: cx - 3, y: cy + 10 },
          { x: cx + 3, y: cy + 10 },
          { x: cx, y: cy + 16 },
        ], { fill: '#fae4eb' });
        break;
      }

      default: {
        // Dawnroot: classic golden root
        d.drawRoundRect(cx - 10, cy - 3, 20, 20, 6, { fill: '#f2ba6d', stroke: '#bf8637', lineWidth: 1.5 });
        d.drawRect(cx - 6, cy + 2, 5, 10, { fill: '#ffdb91' });
        d.drawRect(cx - 2, cy - 14, 4, 22, { fill: '#b3d279' });
        d.drawPolygon([{ x: cx, y: cy - 2 }, { x: cx - 18, y: cy - 16 }, { x: cx - 7, y: cy - 18 }], { fill: '#7bbb68' });
        d.drawPolygon([{ x: cx, y: cy - 4 }, { x: cx + 18, y: cy - 18 }, { x: cx + 7, y: cy - 18 }], { fill: '#b7d781' });
        d.drawCircle(cx + 12, cy - 18, 3, { fill: '#ffe6a1' });
        break;
      }
    }
  }
}
