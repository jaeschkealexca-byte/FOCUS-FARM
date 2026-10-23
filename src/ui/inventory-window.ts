import { MakkoEngine, type IDisplay } from '@makko/engine';
import type { FarmWorld } from '../farm/farm-world';
import { drawCropEmblem, drawSeedPacket, getCropDef } from '../farm/crops';

type InventoryFilter = 'All' | 'Seeds' | 'Harvest' | 'Tools';
type EntryKind = 'seed' | 'produce' | 'tool';

interface InventoryEntry {
  key: string;
  kind: EntryKind;
  id: string;
  name: string;
  count: number;
  description: string;
  toolIndex?: number;
}

/** Illustrated farm backpack and persistent quick-access toolbar. */
export class InventoryWindow {
  private world: FarmWorld;
  private readonly getTool: () => number;
  private readonly setTool: (tool: number) => void;
  private readonly save: () => void;
  visible = false;
  private filter: InventoryFilter = 'All';
  private selectedKey = '';
  private page = 0;

  private readonly x = 46;
  private readonly y = 220;
  private readonly width = 430;
  private readonly height = 680;
  private readonly filters: InventoryFilter[] = ['All', 'Seeds', 'Harvest', 'Tools'];
  private readonly toolNames = ['Hoe', 'Seeds', 'Watering Can', 'Harvest'];

  constructor(world: FarmWorld, getTool: () => number, setTool: (tool: number) => void, save: () => void) {
    this.world = world;
    this.getTool = getTool;
    this.setTool = setTool;
    this.save = save;
  }

  setWorld(world: FarmWorld): void {
    this.world = world;
    this.selectedKey = '';
    this.page = 0;
  }

  open(): void {
    this.visible = true;
    this.filter = 'All';
    this.page = 0;
    const selectedSeed = this.world.seeds[this.world.selectedSeedId] ?? 0;
    this.selectedKey = selectedSeed > 0
      ? `seed:${this.world.selectedSeedId}`
      : this.ownedStacks()[0]?.key ?? '';
  }

  close(): void {
    this.visible = false;
  }

  /** Handles toolbar clicks during play and backpack controls while it is open. */
  handleInput(): void {
    const input = MakkoEngine.input;
    if (this.visible) {
      if (!input.isMousePressed(0)) return;
      const mx = input.mouseX;
      const my = input.mouseY;
      if (this.contains(mx, my, this.x + this.width - 54, this.y + 16, 38, 38)) {
        this.close();
        return;
      }

      if (this.contains(mx, my, this.x + 20, this.y + 580, 120, 26)) {
        this.addSelectedToToolbar();
        return;
      }
      if (this.contains(mx, my, this.x + 150, this.y + 580, 120, 26)) {
        this.removeSelectedFromToolbar();
        return;
      }
      if (this.contains(mx, my, this.x + 280, this.y + 580, 120, 26)) {
        this.discardSelectedItem();
        return;
      }

      const toolbarSlot = this.toolbarSlotAt(mx, my);
      if (toolbarSlot >= 0) {
        if (toolbarSlot < 4) this.selectHotbarSlot(toolbarSlot);
        else this.removeFromToolbar(toolbarSlot - 4);
        return;
      }

      const tabW = 91;
      for (let index = 0; index < this.filters.length; index++) {
        const tabX = this.x + 20 + index * 97;
        if (this.contains(mx, my, tabX, this.y + 88, tabW, 38)) {
          this.filter = this.filters[index];
          this.page = 0;
          return;
        }
      }

      const entries = this.filteredEntries();
      const pageCount = Math.max(1, Math.ceil(entries.length / 6));
      this.page = Math.min(this.page, pageCount - 1);
      const gridX = this.x + 20;
      const gridY = this.y + 151;
      const slotW = 185;
      const slotH = 69;
      for (let index = 0; index < entries.slice(this.page * 6, this.page * 6 + 6).length; index++) {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const sx = gridX + col * 192;
        const sy = gridY + row * 75;
        if (this.contains(mx, my, sx, sy, slotW, slotH)) {
          this.selectEntry(entries[this.page * 6 + index]);
          return;
        }
      }

      const pageY = this.y + 614;
      if (this.contains(mx, my, this.x + 284, pageY, 48, 30) && this.page > 0) this.page--;
      else if (this.contains(mx, my, this.x + 378, pageY, 48, 30) && this.page < pageCount - 1) this.page++;
      return;
    }

    const slot = this.toolbarSlotAt(input.mouseX, input.mouseY);
    if (slot >= 0) this.selectHotbarSlot(slot);
  }

  update(_dt: number): void {
    const pages = Math.max(1, Math.ceil(this.filteredEntries().length / 6));
    this.page = Math.min(this.page, pages - 1);
  }

  /** Slot is zero-based; slots five through eight select their assigned stacks. */
  selectHotbarSlot(slot: number): boolean {
    if (slot < 0 || slot > 7) return false;
    if (slot < 4) {
      const changed = this.getTool() !== slot;
      this.setTool(slot);
      if (changed) this.save();
      return changed;
    }
    const stack = this.toolbarEntry(slot - 4);
    if (!stack) return false;
    this.selectEntry(stack);
    return true;
  }

  renderToolbar(): void {
    const d = MakkoEngine.display;
    const x = (1920 - 760) / 2;
    const y = 975;
    d.drawRoundRect(x - 13, y - 11, 786, 92, 18, { fill: '#3e3326', alpha: 0.88, stroke: '#c9a878', lineWidth: 2 });
    for (let slot = 0; slot < 8; slot++) {
      const sx = x + slot * 95;
      const sy = y;
      const active = slot < 4 ? this.getTool() === slot : this.selectedStackMatches(this.toolbarEntry(slot - 4));
      d.drawRoundRect(sx, sy, 84, 70, 10, {
        fill: active ? '#f6e4b8' : '#e3d0aa',
        stroke: active ? '#b87538' : '#aa8a60',
        lineWidth: active ? 3 : 1.5,
      });
      d.drawRoundRect(sx + 5, sy + 5, 74, 60, 7, { fill: active ? '#fff6df' : '#f4ead3' });
      d.drawText(String(slot + 1), sx + 11, sy + 10, { font: 'bold 12px monospace', fill: '#6c5034', align: 'left', baseline: 'top' });
      if (slot < 4) {
        const icons = ['⚒', '🌱', '💧', '✦'];
        d.drawText(icons[slot], sx + 42, sy + 28, { font: '25px serif', fill: '#5c7547', align: 'center', baseline: 'middle' });
        d.drawText(['Hoe', 'Seeds', 'Water', 'Harvest'][slot], sx + 42, sy + 55, { font: '11px monospace', fill: '#59432d', align: 'center', baseline: 'middle' });
      } else {
        const stack = this.toolbarEntry(slot - 4);
        if (stack) this.drawStackIcon(stack, sx + 42, sy + 33, 30);
        else d.drawText('·', sx + 42, sy + 34, { font: '24px serif', fill: '#b7a68a', align: 'center', baseline: 'middle' });
        if (stack) d.drawText(`×${stack.count}`, sx + 70, sy + 59, { font: 'bold 11px monospace', fill: '#4c663b', align: 'right', baseline: 'middle' });
      }
    }
  }

  render(): void {
    if (!this.visible) return;
    const d = MakkoEngine.display;
    const entries = this.filteredEntries();
    const visibleEntries = entries.slice(this.page * 6, this.page * 6 + 6);
    const pageCount = Math.max(1, Math.ceil(entries.length / 6));

    // Soft shadow, stitched leather edge, and warm canvas lining.
    d.drawRoundRect(this.x + 8, this.y + 10, this.width, this.height, 24, { fill: '#17130f', alpha: 0.35 });
    d.drawRoundRect(this.x, this.y, this.width, this.height, 24, { fill: '#79543a', stroke: '#503722', lineWidth: 4 });
    d.drawRoundRect(this.x + 8, this.y + 8, this.width - 16, this.height - 16, 19, { fill: '#ead3ac', stroke: '#bd9567', lineWidth: 2 });
    d.drawRoundRect(this.x + 17, this.y + 17, this.width - 34, this.height - 34, 16, { fill: '#fff5df' });
    d.drawRoundRect(this.x + 22, this.y + 22, this.width - 44, 55, 13, { fill: '#719166' });
    d.drawText('✿  MY BACKPACK', this.x + 38, this.y + 49, { font: 'bold 24px serif', fill: '#fff8e7', align: 'left', baseline: 'middle' });
    d.drawRoundRect(this.x + this.width - 54, this.y + 25, 38, 34, 9, { fill: '#a75e49' });
    d.drawText('×', this.x + this.width - 35, this.y + 42, { font: 'bold 22px serif', fill: '#fff8e7', align: 'center', baseline: 'middle' });

    for (let index = 0; index < this.filters.length; index++) {
      const filter = this.filters[index];
      const tx = this.x + 20 + index * 97;
      const active = this.filter === filter;
      d.drawRoundRect(tx, this.y + 88, 91, 38, 10, { fill: active ? '#829d70' : '#f2e5cc', stroke: active ? '#58744f' : '#d4c09e', lineWidth: 1.5 });
      d.drawText(filter, tx + 45, this.y + 107, { font: 'bold 13px monospace', fill: active ? '#fff9e9' : '#67533b', align: 'center', baseline: 'middle' });
    }

    d.drawText('YOUR THINGS', this.x + 24, this.y + 140, { font: 'bold 13px monospace', fill: '#8b7151', align: 'left', baseline: 'middle' });
    for (let index = 0; index < 6; index++) {
      const entry = visibleEntries[index];
      const col = index % 2;
      const row = Math.floor(index / 2);
      const sx = this.x + 20 + col * 192;
      const sy = this.y + 151 + row * 75;
      const selected = !!entry && this.selectedKey === entry.key;
      d.drawRoundRect(sx, sy, 185, 69, 11, { fill: selected ? '#e4efcf' : '#f8edda', stroke: selected ? '#779464' : '#dfcdae', lineWidth: selected ? 2 : 1 });
      if (!entry) continue;
      this.drawStackIcon(entry, sx + 35, sy + 34, 36);
      const displayName = entry.name.length > 15 ? `${entry.name.slice(0, 14)}…` : entry.name;
      d.drawText(displayName, sx + 63, sy + 26, { font: 'bold 13px monospace', fill: '#513e2b', align: 'left', baseline: 'middle' });
      d.drawText(entry.kind === 'tool' ? 'Farm tool' : `Quantity  ×${entry.count}`, sx + 63, sy + 48, { font: '11px monospace', fill: '#887359', align: 'left', baseline: 'middle' });
    }

    d.drawRoundRect(this.x + 20, this.y + 470, this.width - 40, 115, 13, { fill: '#f0e1c5', stroke: '#d1b993', lineWidth: 1.5 });
    const selected = this.findSelectedEntry(entries);
    d.drawText('A LITTLE ABOUT IT', this.x + 34, this.y + 489, { font: 'bold 12px monospace', fill: '#8b7151', align: 'left', baseline: 'middle' });
    if (selected) {
      this.drawStackIcon(selected, this.x + 58, this.y + 541, 40);
      d.drawText(selected.name, this.x + 91, this.y + 527, { font: 'bold 16px serif', fill: '#4f5f3f', align: 'left', baseline: 'middle' });
      const details = this.wrapDescription(selected.description, 42);
      d.drawText(details[0] ?? '', this.x + 91, this.y + 549, { font: '11px monospace', fill: '#725d44', align: 'left', baseline: 'middle' });
      d.drawText(details[1] ?? '', this.x + 91, this.y + 568, { font: '11px monospace', fill: '#725d44', align: 'left', baseline: 'middle' });
    } else {
      d.drawText('Your pockets are ready for a new find.', this.x + 34, this.y + 540, { font: '13px serif', fill: '#725d44', align: 'left', baseline: 'middle' });
    }

    const selectedKey = selected?.kind === 'tool' ? '' : selected?.key ?? '';
    const isOnToolbar = selectedKey !== '' && this.world.toolbarSlots.includes(selectedKey);
    this.drawActionButton(d, this.x + 20, this.y + 580, 'Add to bar', selectedKey !== '' && !isOnToolbar && this.world.toolbarSlots.includes(null));
    this.drawActionButton(d, this.x + 150, this.y + 580, 'Remove from bar', isOnToolbar);
    this.drawActionButton(d, this.x + 280, this.y + 580, 'Delete stack', selected?.kind === 'seed' || selected?.kind === 'produce');

    d.drawText(`${this.page + 1} / ${pageCount}`, this.x + this.width - 76, this.y + 622, { font: '13px monospace', fill: '#876d4e', align: 'center', baseline: 'middle' });
    if (pageCount > 1) {
      d.drawText('‹', this.x + this.width - 123, this.y + 622, { font: 'bold 20px serif', fill: '#765a3b', align: 'center', baseline: 'middle' });
      d.drawText('›', this.x + this.width - 29, this.y + 622, { font: 'bold 20px serif', fill: '#765a3b', align: 'center', baseline: 'middle' });
    }
    d.drawText('I / ESC  Close backpack', this.x + this.width / 2, this.y + 665, { font: '11px monospace', fill: '#947b5c', align: 'center', baseline: 'middle' });
  }

  private addSelectedToToolbar(): void {
    const selected = this.findSelectedEntry(this.filteredEntries());
    if (!selected || selected.kind === 'tool' || this.world.toolbarSlots.includes(selected.key)) return;
    const emptySlot = this.world.toolbarSlots.indexOf(null);
    if (emptySlot < 0) return;
    this.world.toolbarSlots[emptySlot] = selected.key;
    this.selectedKey = selected.key;
    this.save();
  }

  private removeSelectedFromToolbar(): void {
    const selected = this.findSelectedEntry(this.filteredEntries());
    if (!selected) return;
    const slot = this.world.toolbarSlots.indexOf(selected.key);
    if (slot < 0) return;
    this.world.toolbarSlots[slot] = null;
    this.save();
  }

  private removeFromToolbar(slot: number): void {
    if (slot < 0 || slot >= this.world.toolbarSlots.length) return;
    if (this.world.toolbarSlots[slot] === null) return;
    this.world.toolbarSlots[slot] = null;
    this.save();
  }

  private discardSelectedItem(): void {
    const selected = this.findSelectedEntry(this.filteredEntries());
    if (!selected || (selected.kind !== 'seed' && selected.kind !== 'produce')) return;
    const inventory = selected.kind === 'seed' ? this.world.seeds : this.world.produce;
    if ((inventory[selected.id] ?? 0) <= 0) return;

    delete inventory[selected.id];
    this.world.toolbarSlots = this.world.toolbarSlots.map(key => key === selected.key ? null : key);

    if (selected.kind === 'seed' && this.world.selectedSeedId === selected.id) {
      const nextSeedId = Object.keys(this.world.seeds).find(id => (this.world.seeds[id] ?? 0) > 0);
      if (nextSeedId) this.world.selectedSeedId = nextSeedId;
    }

    const remainingStacks = this.ownedStacks();
    if (!remainingStacks.some(entry => entry.key === this.selectedKey)) {
      this.selectedKey = remainingStacks[0]?.key ?? '';
    }
    this.save();
  }

  private drawActionButton(d: IDisplay, x: number, y: number, label: string, enabled: boolean): void {
    d.drawRoundRect(x, y, 120, 26, 7, {
      fill: enabled ? '#829d70' : '#ded2bd',
      stroke: enabled ? '#58744f' : '#cbbda8',
      lineWidth: 1,
    });
    d.drawText(label, x + 60, y + 13, {
      font: 'bold 10px monospace',
      fill: enabled ? '#fff9e9' : '#9d917f',
      align: 'center',
      baseline: 'middle',
    });
  }

  private selectEntry(entry: InventoryEntry): void {
    this.selectedKey = entry.key;
    let changed = false;
    if (entry.kind === 'seed') {
      changed = this.world.selectedSeedId !== entry.id || this.getTool() !== 1;
      this.world.selectedSeedId = entry.id;
      this.setTool(1);
    } else if (entry.kind === 'produce') {
      changed = this.getTool() !== 3;
      this.setTool(3);
    } else if (entry.toolIndex !== undefined) {
      changed = this.getTool() !== entry.toolIndex;
      this.setTool(entry.toolIndex);
    }
    if (changed) this.save();
  }

  private findSelectedEntry(entries: InventoryEntry[]): InventoryEntry | undefined {
    return entries.find(entry => entry.key === this.selectedKey) ??
      entries.find(entry => entry.kind === 'seed' && entry.id === this.world.selectedSeedId) ??
      entries[0];
  }

  private filteredEntries(): InventoryEntry[] {
    const entries: InventoryEntry[] = [];
    if (this.filter === 'All' || this.filter === 'Seeds') {
      for (const [id, count] of Object.entries(this.world.seeds)) {
        if (count <= 0) continue;
        const crop = getCropDef(id);
        entries.push({ key: `seed:${id}`, kind: 'seed', id, name: crop.seedName, count, description: crop.description });
      }
    }
    if (this.filter === 'All' || this.filter === 'Harvest') {
      for (const [id, count] of Object.entries(this.world.produce)) {
        if (count <= 0) continue;
        const crop = getCropDef(id);
        entries.push({ key: `produce:${id}`, kind: 'produce', id, name: crop.name, count, description: `Fresh ${crop.name.toLowerCase()} from your farm. Ships for ${crop.sellPrice} coins each.` });
      }
    }
    if (this.filter === 'All' || this.filter === 'Tools') {
      this.toolNames.forEach((name, toolIndex) => entries.push({
        key: `tool:${toolIndex}`, kind: 'tool', id: String(toolIndex), name, count: 0,
        description: toolIndex === 1 ? `Plant ${getCropDef(this.world.selectedSeedId).seedName.toLowerCase()} in tilled soil.` : `Use ${name.toLowerCase()} on the tile in front of you.`,
        toolIndex,
      }));
    }
    return entries;
  }

  private ownedStacks(): InventoryEntry[] {
    const stacks: InventoryEntry[] = [];
    for (const [id, count] of Object.entries(this.world.seeds)) {
      if (count <= 0) continue;
      const crop = getCropDef(id);
      stacks.push({ key: `seed:${id}`, kind: 'seed', id, name: crop.seedName, count, description: crop.description });
    }
    for (const [id, count] of Object.entries(this.world.produce)) {
      if (count <= 0) continue;
      const crop = getCropDef(id);
      stacks.push({ key: `produce:${id}`, kind: 'produce', id, name: crop.name, count, description: `Fresh ${crop.name.toLowerCase()} from your farm.` });
    }
    return stacks;
  }

  private toolbarEntry(slot: number): InventoryEntry | undefined {
    const key = this.world.toolbarSlots[slot];
    if (key === null || key === undefined) return undefined;
    return this.ownedStacks().find(entry => entry.key === key);
  }

  private selectedStackMatches(entry: InventoryEntry | undefined): boolean {
    if (!entry) return false;
    if (entry.kind === 'seed') return this.getTool() === 1 && this.world.selectedSeedId === entry.id;
    if (entry.kind === 'produce') return this.getTool() === 3 && this.selectedKey === entry.key;
    return false;
  }

  private drawStackIcon(entry: InventoryEntry, cx: number, cy: number, size: number): void {
    const crop = getCropDef(entry.id);
    if (entry.kind === 'seed') drawSeedPacket(crop, cx - size / 2, cy - size / 2, size, size, entry.count);
    else if (entry.kind === 'produce') {
      const assetKey = crop.harvestAssetKey;
      const asset = assetKey ? MakkoEngine.staticAsset(assetKey) : null;
      if (asset?.image.complete && asset.image.naturalWidth > 0) {
        const scale = Math.min(size / asset.width, size / asset.height);
        const width = asset.width * scale;
        const height = asset.height * scale;
        MakkoEngine.display.drawImage(asset.image, cx - width / 2, cy - height / 2, width, height);
      } else {
        drawCropEmblem(crop, cx, cy);
      }
    }
    else {
      const icons = ['⚒', '🌱', '💧', '✦'];
      const toolIndex = entry.toolIndex ?? Number(entry.id);
      MakkoEngine.display.drawText(icons[toolIndex] ?? '✿', cx, cy, { font: '23px serif', fill: '#5c7547', align: 'center', baseline: 'middle' });
    }
  }

  private wrapDescription(text: string, maxLength: number): string[] {
    const words = text.split(/\\s+/);
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > maxLength && line) {
        lines.push(line);
        line = word;
      } else line = candidate;
      if (lines.length === 2) break;
    }
    if (lines.length < 2 && line) lines.push(line);
    return lines;
  }

  private toolbarSlotAt(mx: number, my: number): number {
    const x = (1920 - 760) / 2;
    const y = 975;
    if (my < y || my > y + 70) return -1;
    const slot = Math.floor((mx - x) / 95);
    if (slot < 0 || slot > 7 || mx > x + slot * 95 + 84) return -1;
    return slot;
  }

  private contains(x: number, y: number, left: number, top: number, width: number, height: number): boolean {
    return x >= left && x <= left + width && y >= top && y <= top + height;
  }
}
