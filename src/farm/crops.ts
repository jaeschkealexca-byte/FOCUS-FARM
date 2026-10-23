import { MakkoEngine } from '@makko/engine';

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'All';

export interface CropDef {
  id: string;
  name: string;
  seedName: string;
  season: Season;
  buyPrice: number;
  sellPrice: number;
  growthMinutes: number;
  seasonIcon: string;
  seasonColor: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  foliageColor: string;
  staticAssetKey?: string;
  harvestAssetKey?: string;
}

export const CROPS: Record<string, CropDef> = {
  cabbage: {
    id: 'cabbage',
    name: 'Cabbage',
    seedName: 'Cabbage Seeds',
    season: 'Spring',
    buyPrice: 20,
    sellPrice: 45,
    growthMinutes: 1 / 6,
    seasonIcon: '🌸',
    seasonColor: '#b85d85',
    description: 'Crisp and leafy. A hardy spring staple that grows into dense, ruffled heads.',
    primaryColor: '#72ba59',
    accentColor: '#9edb84',
    foliageColor: '#53913d',
  },
  garlic: {
    id: 'garlic',
    name: 'Garlic',
    seedName: 'Garlic Seeds',
    season: 'Spring',
    buyPrice: 20,
    sellPrice: 50,
    growthMinutes: 1 / 6,
    seasonIcon: '🌸',
    seasonColor: '#b85d85',
    description: 'A fragrant spring allium with papery white bulbs and fresh green shoots.',
    primaryColor: '#eee8d5',
    accentColor: '#fffaf0',
    foliageColor: '#71964b',
    staticAssetKey: 'garlic_1',
    harvestAssetKey: 'garlic_2',
  },
  kale: {
    id: 'kale',
    name: 'Kale',
    seedName: 'Kale Seeds',
    season: 'Spring',
    buyPrice: 25,
    sellPrice: 60,
    growthMinutes: 1 / 6,
    seasonIcon: '🌸',
    seasonColor: '#b85d85',
    description: 'Hardy leafy greens with deep green, ruffled leaves.',
    primaryColor: '#3f7a43',
    accentColor: '#73a85e',
    foliageColor: '#2c6038',
    staticAssetKey: 'kale_redesign_1',
    harvestAssetKey: 'kale_s2_1',
  },
  rhubarb: {
    id: 'rhubarb',
    name: 'Rhubarb',
    seedName: 'Rhubarb Seeds',
    season: 'Spring',
    buyPrice: 30,
    sellPrice: 70,
    growthMinutes: 1 / 6,
    seasonIcon: '🌸',
    seasonColor: '#b85d85',
    description: 'Tart spring stalks with broad, leafy tops.',
    primaryColor: '#bd435a',
    accentColor: '#e58475',
    foliageColor: '#53804b',
    staticAssetKey: 'rhubarb_1',
    harvestAssetKey: 'rhubarb_2',
  },
  carrot: {
    id: 'carrot',
    name: 'Carrot',
    seedName: 'Carrot Seeds',
    season: 'Spring',
    buyPrice: 15,
    sellPrice: 35,
    growthMinutes: 1 / 6,
    seasonIcon: '🌸',
    seasonColor: '#b85d85',
    description: 'Sweet, crunchy orange roots. Quick to grow with delicate feathery greens.',
    primaryColor: '#f17726',
    accentColor: '#ffa05c',
    foliageColor: '#4f9b3c',
    staticAssetKey: 'carrot_1',
    harvestAssetKey: 'carrot_2',
  },
  potato: {
    id: 'potato',
    name: 'Potato',
    seedName: 'Potato Seeds',
    season: 'Spring',
    buyPrice: 20,
    sellPrice: 50,
    growthMinutes: 1 / 6,
    seasonIcon: '🌸',
    seasonColor: '#b85d85',
    description: 'Hearty golden tubers resting safely underground in loose farm soil.',
    primaryColor: '#cca064',
    accentColor: '#ebd09e',
    foliageColor: '#5c8a42',
    staticAssetKey: 'potatoe_1',
    harvestAssetKey: 'potato_2',
  },
  beet: {
    id: 'beet',
    name: 'Beet',
    seedName: 'Beet Seeds',
    season: 'Autumn',
    buyPrice: 25,
    sellPrice: 60,
    growthMinutes: 1 / 6,
    seasonIcon: '🍁',
    seasonColor: '#c26227',
    description: 'Earthy crimson roots with leafy tops, ready for the autumn harvest.',
    primaryColor: '#a7293d',
    accentColor: '#e45b61',
    foliageColor: '#4f7937',
    staticAssetKey: 'beet_1',
    harvestAssetKey: 'beet_2',
  },
  pumpkin: {
    id: 'pumpkin',
    name: 'Pumpkin',
    seedName: 'Pumpkin Seeds',
    season: 'Autumn',
    buyPrice: 40,
    sellPrice: 100,
    growthMinutes: 1 / 6,
    seasonIcon: '🍁',
    seasonColor: '#c26227',
    description: 'Prized autumn gourds. Takes longer to mature, but fetches a handsome price.',
    primaryColor: '#e86a17',
    accentColor: '#ff9842',
    foliageColor: '#4d7832',
    staticAssetKey: 'pumpkin_1',
    harvestAssetKey: 'pumpkin_2',
  },
  strawberry: {
    id: 'strawberry',
    name: 'Strawberry',
    seedName: 'Strawberry Seeds',
    season: 'Spring',
    buyPrice: 30,
    sellPrice: 70,
    growthMinutes: 1 / 6,
    seasonIcon: '🌸',
    seasonColor: '#b85d85',
    description: 'Juicy, fragrant ruby berries adored by farm visitors and town markets.',
    primaryColor: '#e63946',
    accentColor: '#ff7582',
    foliageColor: '#387b32',
    staticAssetKey: 'strawberry_1',
    harvestAssetKey: 'strawberry_2',
  },
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    seedName: 'Tomato Seeds',
    season: 'Summer',
    buyPrice: 25,
    sellPrice: 55,
    growthMinutes: 1 / 6,
    seasonIcon: '🌻',
    seasonColor: '#c98a1a',
    description: 'Plump sun-warmed red fruit growing in heavy clusters along lush vines.',
    primaryColor: '#e03030',
    accentColor: '#ff6b6b',
    foliageColor: '#3c7e33',
    staticAssetKey: 'tomato_1',
    harvestAssetKey: 'tomato_2',
  },
  corn: {
    id: 'corn',
    name: 'Corn',
    seedName: 'Corn Seeds',
    season: 'Summer',
    buyPrice: 30,
    sellPrice: 75,
    growthMinutes: 1 / 6,
    seasonIcon: '🌻',
    seasonColor: '#c98a1a',
    description: 'Tall golden stalks carrying sweet ears wrapped in tender green husks.',
    primaryColor: '#f4c430',
    accentColor: '#ffe57f',
    foliageColor: '#558b2f',
    staticAssetKey: 'corn_1',
    harvestAssetKey: 'corn_2',
  },
  bok_choy: {
    id: 'bok_choy',
    name: 'Bok Choy',
    seedName: 'Bok Choy Seeds',
    season: 'Summer',
    buyPrice: 25,
    sellPrice: 60,
    growthMinutes: 1 / 6,
    seasonIcon: '🌻',
    seasonColor: '#c98a1a',
    description: 'Tender green leaves with crisp pale stems.',
    primaryColor: '#79a94b',
    accentColor: '#d6e39b',
    foliageColor: '#4d7d3e',
    staticAssetKey: 'bok_choy_1',
  },
  broccoli: {
    id: 'broccoli',
    name: 'Broccoli',
    seedName: 'Broccoli Seeds',
    season: 'Summer',
    buyPrice: 30,
    sellPrice: 75,
    growthMinutes: 1 / 6,
    seasonIcon: '🌻',
    seasonColor: '#c98a1a',
    description: 'A hearty green floret with thick stems.',
    primaryColor: '#3f874b',
    accentColor: '#74b85f',
    foliageColor: '#32673b',
    staticAssetKey: 'brocolli_1',
    harvestAssetKey: 'broccoli_2',
  },
  melon: {
    id: 'melon',
    name: 'Melon',
    seedName: 'Melon Seeds',
    season: 'Summer',
    buyPrice: 35,
    sellPrice: 85,
    growthMinutes: 1 / 6,
    seasonIcon: '🌻',
    seasonColor: '#c98a1a',
    description: 'Sweet, juicy summer melon with a refreshing golden flesh.',
    primaryColor: '#76a84a',
    accentColor: '#e4c85a',
    foliageColor: '#4f7937',
    staticAssetKey: 'melon_1',
    harvestAssetKey: 'melon_2',
  },
  red_cabbage: {
    id: 'red_cabbage',
    name: 'Red Cabbage',
    seedName: 'Red Cabbage Seeds',
    season: 'Summer',
    buyPrice: 30,
    sellPrice: 75,
    growthMinutes: 1 / 6,
    seasonIcon: '🌻',
    seasonColor: '#c98a1a',
    description: 'A colorful summer cabbage with crisp, deep red leaves.',
    primaryColor: '#8e4b83',
    accentColor: '#c27eae',
    foliageColor: '#477542',
    staticAssetKey: 'red_cabbage_1',
  },
  blueberry: {
    id: 'blueberry',
    name: 'Blueberry',
    seedName: 'Blueberry Seeds',
    season: 'Summer',
    buyPrice: 35,
    sellPrice: 90,
    growthMinutes: 1 / 6,
    seasonIcon: '🌻',
    seasonColor: '#c98a1a',
    description: 'Clusters of sweet blue summer berries, ready for a sunny harvest.',
    primaryColor: '#4568aa',
    accentColor: '#839fe0',
    foliageColor: '#477542',
    staticAssetKey: 'blueberry_1',
    harvestAssetKey: 'blueberry_2',
  },
  cranberry: {
    id: 'cranberry',
    name: 'Cranberry',
    seedName: 'Cranberry Seeds',
    season: 'Autumn',
    buyPrice: 30,
    sellPrice: 75,
    growthMinutes: 1 / 6,
    seasonIcon: '🍁',
    seasonColor: '#c26227',
    description: 'Tart red berries ripening in cool autumn weather.',
    primaryColor: '#a7293d',
    accentColor: '#e45b61',
    foliageColor: '#4f7937',
    staticAssetKey: 'cranberrie_1',
    harvestAssetKey: 'cranberry_2_1',
  },
  grape: {
    id: 'grape',
    name: 'Grape',
    seedName: 'Grape Seeds',
    season: 'Autumn',
    buyPrice: 35,
    sellPrice: 90,
    growthMinutes: 1 / 6,
    seasonIcon: '🍁',
    seasonColor: '#c26227',
    description: 'Juicy clusters of grapes ready for an autumn harvest.',
    primaryColor: '#6f4794',
    accentColor: '#aa79c5',
    foliageColor: '#4f7937',
    staticAssetKey: 'grape_1',
    harvestAssetKey: 'grape_2',
  },
  cauliflower: {
    id: 'cauliflower',
    name: 'Cauliflower',
    seedName: 'Cauliflower Seeds',
    season: 'Spring',
    buyPrice: 35,
    sellPrice: 85,
    growthMinutes: 1 / 6,
    seasonIcon: '🌸',
    seasonColor: '#b85d85',
    description: 'Delicate creamy white curds surrounded by a protective crown of broad leaves.',
    primaryColor: '#f5edd4',
    accentColor: '#ffffff',
    foliageColor: '#52834b',
    staticAssetKey: 'couliflower_1',
  },
  eggplant: {
    id: 'eggplant',
    name: 'Eggplant',
    seedName: 'Eggplant Seeds',
    season: 'Autumn',
    buyPrice: 25,
    sellPrice: 60,
    growthMinutes: 1 / 6,
    seasonIcon: '🍁',
    seasonColor: '#c26227',
    description: 'Glossy deep purple aubergines with a velvety texture and rich flavor.',
    primaryColor: '#6a1b7a',
    accentColor: '#9c4d97',
    foliageColor: '#436d33',
    staticAssetKey: 'eggplant_1_1',
  },
  snow_berry: {
    id: 'snow_berry',
    name: 'Snow Berry',
    seedName: 'Snow Berry Seeds',
    season: 'Winter',
    buyPrice: 25,
    sellPrice: 60,
    growthMinutes: 1 / 6,
    seasonIcon: '❄️',
    seasonColor: '#4a8cb8',
    description: 'Enchanted frosted berries that thrive under gentle winter snowfalls.',
    primaryColor: '#48bfe3',
    accentColor: '#a9e8f8',
    foliageColor: '#729bb0',
  },
  leek: {
    id: 'leek',
    name: 'Leek',
    seedName: 'Leek Seeds',
    season: 'Winter',
    buyPrice: 20,
    sellPrice: 50,
    growthMinutes: 1 / 6,
    seasonIcon: '❄️',
    seasonColor: '#4a8cb8',
    description: 'Mild winter alliums with tender white stalks and fresh green tops.',
    primaryColor: '#dce8c1',
    accentColor: '#f4f7df',
    foliageColor: '#6f9b4f',
    staticAssetKey: 'leek_1',
    harvestAssetKey: 'leek_2',
  },
  parsnip: {
    id: 'parsnip',
    name: 'Parsnip',
    seedName: 'Parsnip Seeds',
    season: 'Winter',
    buyPrice: 20,
    sellPrice: 55,
    growthMinutes: 1 / 6,
    seasonIcon: '❄️',
    seasonColor: '#4a8cb8',
    description: 'Sweet, pale roots made richer by cold winter soil.',
    primaryColor: '#e8d8b4',
    accentColor: '#fff0d4',
    foliageColor: '#6e9854',
    staticAssetKey: 'parsnip_1',
    harvestAssetKey: 'parsnip_2',
  },
  radish: {
    id: 'radish',
    name: 'Radish',
    seedName: 'Radish Seeds',
    season: 'Winter',
    buyPrice: 15,
    sellPrice: 40,
    growthMinutes: 1 / 6,
    seasonIcon: '❄️',
    seasonColor: '#4a8cb8',
    description: 'Peppery, crisp roots with bright color and snowy-season greens.',
    primaryColor: '#d84769',
    accentColor: '#f98da3',
    foliageColor: '#688e66',
    staticAssetKey: 'radish_1',
    harvestAssetKey: 'radish_2',
  },
  spinach: {
    id: 'spinach',
    name: 'Spinach',
    seedName: 'Spinach Seeds',
    season: 'Winter',
    buyPrice: 20,
    sellPrice: 50,
    growthMinutes: 1 / 6,
    seasonIcon: '❄️',
    seasonColor: '#4a8cb8',
    description: 'Nutritious, dark leafy greens that thrive in the winter garden.',
    primaryColor: '#35734b',
    accentColor: '#69a66a',
    foliageColor: '#285d3b',
    staticAssetKey: 'spinach',
    harvestAssetKey: 'spinach_2',
  },
  winter_radish: {
    id: 'winter_radish',
    name: 'Winter Radish',
    seedName: 'Winter Radish Seeds',
    season: 'Winter',
    buyPrice: 15,
    sellPrice: 35,
    growthMinutes: 1 / 6,
    seasonIcon: '❄️',
    seasonColor: '#4a8cb8',
    description: 'Crisp magenta winter daikon with a spicy bite and cool frosted greens.',
    primaryColor: '#c72c57',
    accentColor: '#f9a8c2',
    foliageColor: '#628a7e',
  },
  dawnroot: {
    id: 'dawnroot',
    name: 'Dawnroot',
    seedName: 'Dawnroot Seeds',
    season: 'All',
    buyPrice: 10,
    sellPrice: 25,
    growthMinutes: 1 / 6,
    seasonIcon: '🌿',
    seasonColor: '#538260',
    description: 'A resilient, mystic golden tuber that thrives in any weather or season.',
    primaryColor: '#f2ba6d',
    accentColor: '#ffe19e',
    foliageColor: '#7bbb68',
  },
};

export const CROP_LIST: CropDef[] = [
  CROPS.dawnroot,
  CROPS.garlic,
  CROPS.kale,
  CROPS.rhubarb,
  CROPS.carrot,
  CROPS.potato,
  CROPS.strawberry,
  CROPS.cauliflower,
  CROPS.tomato,
  CROPS.corn,
  CROPS.bok_choy,
  CROPS.broccoli,
  CROPS.melon,
  CROPS.red_cabbage,
  CROPS.blueberry,
  CROPS.cranberry,
  CROPS.beet,
  CROPS.eggplant,
  CROPS.grape,
  CROPS.pumpkin,
  CROPS.snow_berry,
  CROPS.leek,
  CROPS.parsnip,
  CROPS.radish,
  CROPS.spinach,
  CROPS.winter_radish,
];

export function getCropDef(id: string | null | undefined): CropDef {
  if (!id) return CROPS.dawnroot;
  return CROPS[id] ?? CROPS.dawnroot;
}

export function formatGrowthTime(minutes: number): string {
  const seconds = Math.round(minutes * 60);
  return seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)}m`;
}

export function getCropsBySeason(season: Season): CropDef[] {
  const seedArtworkKeys = new Set([
    'carrot_1', 'potatoe_1', 'couliflower_1', 'strawberry_1',
    'garlic_1', 'kale_redesign_1', 'rhubarb_1',
    'tomato_1', 'corn_1', 'bok_choy_1', 'brocolli_1',
    'melon_1', 'red_cabbage_1', 'blueberry_1',
    'cranberrie_1', 'beet_1', 'eggplant_1_1', 'grape_1', 'pumpkin_1',
    'leek_1', 'parsnip_1', 'radish_1', 'spinach',
  ]);
  return CROP_LIST.filter(crop =>
    (crop.id === 'kale' || (crop.staticAssetKey !== undefined && seedArtworkKeys.has(crop.staticAssetKey))) &&
    (season === 'All' || crop.season === season || crop.season === 'All')
  );
}


/**
 * Draw a detailed seed packet graphic on canvas at (x, y).
 * Width: w (approx 60-75px), Height: h (approx 75-95px).
 */
export function drawSeedPacket(
  crop: CropDef,
  x: number,
  y: number,
  w = 66,
  h = 82,
  ownedCount?: number
): void {
  const d = MakkoEngine.display;

  if (crop.staticAssetKey) {
    const asset = MakkoEngine.staticAsset(crop.staticAssetKey);
    if (asset?.image.complete && asset.image.naturalWidth > 0) {
      const pad = 2;
      const maxW = w - pad * 2;
      const maxH = h - pad * 2;
      const scale = Math.min(maxW / asset.width, maxH / asset.height);
      const drawW = asset.width * scale;
      const drawH = asset.height * scale;
      d.drawImage(asset.image, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH);
      if (ownedCount !== undefined && ownedCount > 0) {
        const badgeW = Math.min(36, Math.max(24, w * 0.38));
        const badgeH = Math.min(22, Math.max(16, h * 0.24));
        const bx = x + w - badgeW + 2;
        const by = y + h - badgeH + 2;
        d.drawRoundRect(bx, by, badgeW, badgeH, 5, { fill: '#457b52', stroke: '#ffffff', lineWidth: 1 });
        d.drawText(`×${ownedCount}`, bx + badgeW / 2, by + badgeH / 2, {
          font: `bold ${Math.max(9, Math.min(13, badgeH * 0.68))}px monospace`,
          fill: '#ffffff', align: 'center', baseline: 'middle',
        });
      }
      return;
    }
  }

  // Vector-drawn fallback bag for crops without an available project asset.
  d.drawRoundRect(x + 2, y + 3, w, h, 7, { fill: '#000000', alpha: 0.12 });

  // Kraft paper main pouch
  d.drawRoundRect(x, y, w, h, 6, {
    fill: '#deb788',
    stroke: '#aa8153',
    lineWidth: 1.5,
  });

  // Folded paper shadow/line near top
  d.drawLine(x + 3, y + 15, x + w - 3, y + 15, { stroke: '#be9568', lineWidth: 1.5 });

  // Top crimp seal / flap
  d.drawRoundRect(x + 2, y + 2, w - 4, 12, 4, { fill: '#c99f6f' });
  for (let sx = x + 7; sx < x + w - 6; sx += 6) {
    d.drawLine(sx, y + 3, sx, y + 12, { stroke: '#9b7145', lineWidth: 1 });
  }

  // White/cream center illustration frame
  const frameW = w - 16;
  const frameH = h - 34;
  const frameX = x + 8;
  const frameY = y + 18;
  d.drawRoundRect(frameX, frameY, frameW, frameH, 5, {
    fill: '#fffaf0',
    stroke: '#d5bea1',
    lineWidth: 1,
  });

    if (crop.staticAssetKey) {
      const asset = MakkoEngine.staticAsset(crop.staticAssetKey);
      if (asset?.image.complete && asset.image.naturalWidth > 0) {
        const pad = 4;
        const maxW = frameW - pad * 2;
        const maxH = frameH - pad * 2;
        const scale = Math.min(maxW / asset.width, maxH / asset.height);
        const drawW = asset.width * scale;
        const drawH = asset.height * scale;
        d.drawImage(asset.image, frameX + (frameW - drawW) / 2, frameY + (frameH - drawH) / 2, drawW, drawH);
      } else {
        drawCropEmblem(crop, frameX + frameW / 2, frameY + frameH / 2);
      }
    } else {
      drawCropEmblem(crop, frameX + frameW / 2, frameY + frameH / 2);
    }


  // Bottom seed pouch accent label band
  d.drawRoundRect(x + 6, y + h - 13, w - 12, 9, 3, { fill: crop.primaryColor, alpha: 0.85 });

  // Owned count badge in bottom-right corner if requested
  if (ownedCount !== undefined && ownedCount > 0) {
    const badgeW = 24;
    const badgeH = 16;
    const bx = x + w - badgeW + 3;
    const by = y + h - badgeH + 3;
    d.drawRoundRect(bx, by, badgeW, badgeH, 5, { fill: '#457b52', stroke: '#ffffff', lineWidth: 1 });
    d.drawText(`×${ownedCount}`, bx + badgeW / 2, by + badgeH / 2, {
      font: 'bold 11px monospace',
      fill: '#ffffff',
      align: 'center',
      baseline: 'middle',
    });
  }
}

/**
 * Draw an iconic mini illustration of the crop centered at (cx, cy).
 */
export function drawCropEmblem(crop: CropDef, cx: number, cy: number): void {
  const d = MakkoEngine.display;
  switch (crop.id) {
    case 'cabbage': {
      // Outer ruffled leaves
      d.drawCircle(cx - 7, cy, 10, { fill: '#5e9f4a' });
      d.drawCircle(cx + 7, cy, 10, { fill: '#5e9f4a' });
      d.drawCircle(cx, cy + 4, 11, { fill: '#6cb854' });
      // Inner head
      d.drawCircle(cx, cy - 1, 9, { fill: '#94e07b', stroke: '#498138', lineWidth: 1 });
      d.drawCircle(cx + 1, cy - 2, 5, { fill: '#c0f2ab' });
      break;
    }
    case 'carrot': {
      // Green feathery leafy top
      d.drawLine(cx, cy - 4, cx - 7, cy - 15, { stroke: '#4a9939', lineWidth: 2 });
      d.drawLine(cx, cy - 4, cx, cy - 17, { stroke: '#5ebb49', lineWidth: 2 });
      d.drawLine(cx, cy - 4, cx + 7, cy - 15, { stroke: '#4a9939', lineWidth: 2 });
      // Orange root body
      d.drawPolygon([
        { x: cx - 6, y: cy - 4 },
        { x: cx + 6, y: cy - 4 },
        { x: cx + 2, y: cy + 12 },
        { x: cx, y: cy + 16 },
        { x: cx - 2, y: cy + 12 },
      ], { fill: '#f17726' });
      // Highlights & ridges
      d.drawLine(cx - 4, cy + 1, cx + 1, cy + 1, { stroke: '#d65b10', lineWidth: 1 });
      d.drawLine(cx - 3, cy + 6, cx + 2, cy + 6, { stroke: '#d65b10', lineWidth: 1 });
      d.drawLine(cx - 2, cy - 1, cx - 1, cy + 10, { stroke: '#ffa76b', lineWidth: 1.5 });
      break;
    }
    case 'potato': {
      // Earthy golden potato
      d.drawEllipse(cx, cy, 12, 9, { fill: '#cca064', stroke: '#9e733c', lineWidth: 1 });
      d.drawCircle(cx - 4, cy - 2, 6, { fill: '#deb983' });
      // Potato eyes
      d.drawCircle(cx - 5, cy - 2, 1, { fill: '#805928' });
      d.drawCircle(cx + 4, cy + 1, 1, { fill: '#805928' });
      d.drawCircle(cx - 1, cy + 4, 1, { fill: '#805928' });
      break;
    }
    case 'pumpkin': {
      // Pumpkin ribs
      d.drawEllipse(cx - 7, cy + 2, 7, 10, { fill: '#d65d13' });
      d.drawEllipse(cx + 7, cy + 2, 7, 10, { fill: '#d65d13' });
      d.drawEllipse(cx, cy + 2, 9, 11, { fill: '#f07e28', stroke: '#ba4906', lineWidth: 1 });
      d.drawCircle(cx - 2, cy, 5, { fill: '#ffa559' });
      // Stem
      d.drawRect(cx - 2, cy - 12, 4, 6, { fill: '#558738' });
      d.drawLine(cx, cy - 11, cx + 4, cy - 14, { stroke: '#6aa348', lineWidth: 2 });
      break;
    }
    case 'strawberry': {
      // Green calyx top
      d.drawPolygon([
        { x: cx - 8, y: cy - 7 },
        { x: cx, y: cy - 4 },
        { x: cx + 8, y: cy - 7 },
        { x: cx + 4, y: cy - 3 },
        { x: cx - 4, y: cy - 3 },
      ], { fill: '#45993a' });
      // Red berry body
      d.drawPolygon([
        { x: cx - 8, y: cy - 3 },
        { x: cx + 8, y: cy - 3 },
        { x: cx + 6, y: cy + 5 },
        { x: cx, y: cy + 13 },
        { x: cx - 6, y: cy + 5 },
      ], { fill: '#e63946', stroke: '#b01927', lineWidth: 1 });
      // Highlight & seeds
      d.drawCircle(cx - 3, cy + 1, 3, { fill: '#ff7582' });
      d.drawCircle(cx - 3, cy + 1, 0.8, { fill: '#fff275' });
      d.drawCircle(cx + 3, cy + 1, 0.8, { fill: '#fff275' });
      d.drawCircle(cx, cy + 6, 0.8, { fill: '#fff275' });
      d.drawCircle(cx - 2, cy + 9, 0.8, { fill: '#fff275' });
      break;
    }
    case 'tomato': {
      // Red shiny body
      d.drawCircle(cx, cy + 2, 10, { fill: '#e03030', stroke: '#b01c1c', lineWidth: 1 });
      d.drawCircle(cx - 3, cy - 1, 4, { fill: '#ff6666' });
      // Green star calyx
      d.drawLine(cx - 6, cy - 6, cx + 6, cy - 6, { stroke: '#4ea03a', lineWidth: 2 });
      d.drawLine(cx, cy - 8, cx, cy - 3, { stroke: '#4ea03a', lineWidth: 2 });
      d.drawCircle(cx, cy - 6, 2, { fill: '#3d822b' });
      break;
    }
    case 'corn': {
      // Green husk
      d.drawEllipse(cx - 4, cy + 2, 4, 11, { fill: '#558b2f' });
      d.drawEllipse(cx + 4, cy + 2, 4, 11, { fill: '#558b2f' });
      // Golden cob
      d.drawRoundRect(cx - 4, cy - 6, 8, 16, 4, { fill: '#f4c430', stroke: '#c99616', lineWidth: 1 });
      for (let yk = cy - 4; yk <= cy + 8; yk += 3) {
        d.drawLine(cx - 3, yk, cx + 3, yk, { stroke: '#d69e18', lineWidth: 1 });
      }
      // Silk
      d.drawLine(cx - 1, cy - 7, cx - 3, cy - 12, { stroke: '#b89467', lineWidth: 1 });
      d.drawLine(cx + 1, cy - 7, cx + 3, cy - 13, { stroke: '#b89467', lineWidth: 1 });
      break;
    }
    case 'cauliflower': {
      // Outer wrapper leaves
      d.drawCircle(cx - 7, cy + 1, 8, { fill: '#52834b' });
      d.drawCircle(cx + 7, cy + 1, 8, { fill: '#52834b' });
      d.drawCircle(cx, cy + 6, 8, { fill: '#45733e' });
      // White curd florets
      d.drawCircle(cx, cy - 1, 8, { fill: '#fcf8ea', stroke: '#d9cdb0', lineWidth: 1 });
      d.drawCircle(cx - 3, cy - 3, 3, { fill: '#ffffff' });
      d.drawCircle(cx + 3, cy - 3, 3, { fill: '#ffffff' });
      d.drawCircle(cx, cy + 1, 3, { fill: '#ffffff' });
      break;
    }
    case 'eggplant': {
      // Deep purple teardrop
      d.drawPolygon([
        { x: cx - 4, y: cy - 4 },
        { x: cx + 4, y: cy - 4 },
        { x: cx + 8, y: cy + 4 },
        { x: cx + 4, y: cy + 12 },
        { x: cx - 4, y: cy + 12 },
        { x: cx - 8, y: cy + 4 },
      ], { fill: '#6a1b7a', stroke: '#450952', lineWidth: 1 });
      d.drawCircle(cx - 2, cy + 4, 3, { fill: '#aa55bb' });
      // Green calyx cap
      d.drawPolygon([
        { x: cx - 6, y: cy - 5 },
        { x: cx + 6, y: cy - 5 },
        { x: cx, y: cy - 2 },
      ], { fill: '#4a8536' });
      d.drawLine(cx, cy - 5, cx - 2, cy - 11, { stroke: '#4a8536', lineWidth: 2 });
      break;
    }
    case 'snow_berry': {
      // Frost cyan berries
      d.drawLine(cx - 6, cy + 5, cx + 6, cy - 7, { stroke: '#759ea8', lineWidth: 2 });
      d.drawCircle(cx - 4, cy + 3, 5, { fill: '#48bfe3', stroke: '#2e8ba8', lineWidth: 1 });
      d.drawCircle(cx + 4, cy - 3, 5, { fill: '#48bfe3', stroke: '#2e8ba8', lineWidth: 1 });
      d.drawCircle(cx + 1, cy + 4, 4, { fill: '#72efdd' });
      // Highlights
      d.drawCircle(cx - 5, cy + 1, 1.5, { fill: '#ffffff' });
      d.drawCircle(cx + 3, cy - 5, 1.5, { fill: '#ffffff' });
      break;
    }
    case 'winter_radish': {
      // Leaves
      d.drawLine(cx, cy - 5, cx - 6, cy - 13, { stroke: '#568b75', lineWidth: 2 });
      d.drawLine(cx, cy - 5, cx + 6, cy - 13, { stroke: '#568b75', lineWidth: 2 });
      // Magenta / white root
      d.drawPolygon([
        { x: cx - 5, y: cy - 5 },
        { x: cx + 5, y: cy - 5 },
        { x: cx + 3, y: cy + 8 },
        { x: cx, y: cy + 15 },
        { x: cx - 3, y: cy + 8 },
      ], { fill: '#c72c57' });
      // White tip
      d.drawPolygon([
        { x: cx - 2, y: cy + 9 },
        { x: cx + 2, y: cy + 9 },
        { x: cx, y: cy + 15 },
      ], { fill: '#fae4eb' });
      break;
    }
    default: {
      // Dawnroot
      d.drawRoundRect(cx - 6, cy - 4, 12, 16, 5, { fill: '#f2ba6d', stroke: '#c78f44', lineWidth: 1 });
      d.drawCircle(cx - 2, cy, 3, { fill: '#ffe6a1' });
      d.drawLine(cx, cy - 4, cx - 6, cy - 13, { stroke: '#7bbb68', lineWidth: 2 });
      d.drawLine(cx, cy - 4, cx + 6, cy - 13, { stroke: '#9fd689', lineWidth: 2 });
      // Magic sparkle
      d.drawCircle(cx + 7, cy - 3, 2, { fill: '#fff0a3' });
      break;
    }
  }
}
