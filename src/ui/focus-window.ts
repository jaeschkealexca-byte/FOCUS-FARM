import { MakkoEngine } from '@makko/engine';
import { FocusSession } from '../farm/focus-session';
import type { FarmWorld } from '../farm/farm-world';
import { SaveManager } from '../save/save-manager';
import { ShopWindow } from './shop-window';
import { Button } from './ui-elements';
import { ActionButton, InvisibleButton, SidebarButton } from './focus-window/buttons';
import { artworkTransform, layoutPopup, layoutTaskInput, layoutToolbar, setArtworkBounds } from './focus-window/layout';
import { FocusPointerController } from './focus-window/pointer-controller';
import { FocusWindowRenderer } from './focus-window/rendering';
import { createTaskInput } from './focus-window/task-input';
import { isFocusData, isTaskTextStyle, localDateKey } from './focus-window/task-data';
import {
  DEFAULT_TASK_STYLE, LIST_BOTTOM, LIST_TOP, ROW_HEIGHT, TASK_CHECKBOX_X, TASK_DELETE_X,
  TASK_FONT_FAMILIES, TASK_LIMIT, TASK_TEXT_COLORS, type FocusClickTarget, type FocusData, type TaskTextStyle,
} from './focus-window/types';

/** Focus workspace. Session deadlines continue to settle while this window is hidden. */
export class FocusWindow {
  visible = false;
  private world: FarmWorld | null = null;
  private saveFarm: (() => void) | null = null;
  private session: FocusSession | null = null;
  private readonly duration = 25;
  private readonly shop = new ShopWindow();
  private readonly saves = new SaveManager<FocusData>('quiet-acres-focus-desk', 1);
  private readonly renderer = new FocusWindowRenderer();
  private data: FocusData = { version: 1, tasks: [], days: {} };
  private selectedWorkspace: 'focus' | 'tasks' = 'focus';
  private scrollOffset = 0;
  private editingTask = false;
  private draft = '';
  private draftStyle: TaskTextStyle = { ...DEFAULT_TASK_STYLE };
  private editorHandledKey = false;
  private taskInput: HTMLInputElement | null = null;
  private readonly pointer = new FocusPointerController({
    visible: () => this.visible,
    shopVisible: () => this.shop.visible,
    layout: () => { this.layoutHitboxes(); this.layoutEditor(); },
    findClickTarget: (x, y) => this.findClickTarget(x, y),
    findDeleteTaskIndex: (x, y) => this.findDeleteTaskIndex(x, y),
    findToggleTaskIndex: (x, y) => this.findToggleTaskIndex(x, y),
  });
  private readonly navFocus = new SidebarButton({ label: 'Focus', x: 48, y: 332, width: 158, height: 88, variant: 'ghost' }, 'focus');
  private readonly navTasks = new SidebarButton({ label: 'Tasks', x: 48, y: 434, width: 158, height: 88, variant: 'ghost' }, 'tasks');
  private readonly navFarm = new SidebarButton({ label: 'Farm', x: 48, y: 536, width: 158, height: 88, variant: 'ghost' }, 'farm');
  private readonly navShop = new SidebarButton({ label: 'Shop', x: 48, y: 638, width: 158, height: 88, variant: 'ghost' }, 'shop');
  private readonly playHitbox = new InvisibleButton({ label: '', x: 0, y: 0, width: 1, height: 1 });
  private readonly pauseHitbox = new InvisibleButton({ label: '', x: 0, y: 0, width: 1, height: 1 });
  private readonly resetHitbox = new InvisibleButton({ label: '', x: 0, y: 0, width: 1, height: 1 });
  private readonly addTaskHitbox = new InvisibleButton({ label: '', x: 0, y: 0, width: 1, height: 1 });
  private readonly fontButton = new InvisibleButton({ label: '', x: 0, y: 0, width: 1, height: 1 });
  private readonly smallerTextButton = new InvisibleButton({ label: '', x: 0, y: 0, width: 1, height: 1 });
  private readonly largerTextButton = new InvisibleButton({ label: '', x: 0, y: 0, width: 1, height: 1 });
  private readonly boldButton = new InvisibleButton({ label: '', x: 0, y: 0, width: 1, height: 1 });
  private readonly italicButton = new InvisibleButton({ label: '', x: 0, y: 0, width: 1, height: 1 });
  private readonly colorButton = new InvisibleButton({ label: '', x: 0, y: 0, width: 1, height: 1 });
  private readonly popupAdd = new ActionButton({ label: 'Add', x: 0, y: 0, width: 140, height: 48 }, 'add');
  private readonly popupCancel = new ActionButton({ label: 'Cancel', x: 0, y: 0, width: 140, height: 48 }, 'cancel');
  private readonly rendererControls = [
    { button: this.playHitbox, color: '#35e56b' }, { button: this.pauseHitbox, color: '#35baff' },
    { button: this.resetHitbox, color: '#ff5268' }, { button: this.addTaskHitbox, color: '#ffd447' },
  ];

  constructor() {
    this.loadData();
    this.clampScrollOffset();
  }

  private loadData(): void {
    try {
      const loaded: unknown = this.saves.load();
      if (isFocusData(loaded)) {
        this.data = loaded;
        for (const task of this.data.tasks) {
          if (!isTaskTextStyle(task.style)) task.style = { ...DEFAULT_TASK_STYLE };
        }
      } else if (!this.saves.exists()) {
        this.data.tasks = [
          { label: 'Write project proposal', done: false }, { label: 'Read for 30 minutes', done: false },
          { label: 'Plan tomorrow’s tasks', done: false }, { label: 'Work on portfolio', done: false },
          { label: 'Tidy up workspace', done: false },
        ];
        this.persist();
      }
    } catch {
      // Local storage may be unavailable; keep in-memory defaults usable.
    }
  }

  private persist(): void {
    try { this.saves.save(this.data); } catch { /* Continue in memory if storage is unavailable. */ }
  }

  private clampScrollOffset(): void {
    const viewport = LIST_BOTTOM - LIST_TOP;
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, Math.max(0, this.data.tasks.length * ROW_HEIGHT - viewport)));
  }

  private deleteTask(index: number): void {
    if (index < 0 || index >= this.data.tasks.length) return;
    this.data.tasks.splice(index, 1);
    this.persist();
    this.clampScrollOffset();
  }

  private finishAddTask(): void {
    const label = this.draft.trim();
    if (!label || this.data.tasks.length >= TASK_LIMIT) return;
    this.data.tasks.push({ label: label.slice(0, 48), done: false, style: { ...this.draftStyle } });
    this.persist();
    this.clampScrollOffset();
    this.scrollOffset = Math.max(0, this.data.tasks.length * ROW_HEIGHT - (LIST_BOTTOM - LIST_TOP));
    this.editingTask = false;
    this.draft = '';
    this.removeTaskInput();
  }

  private cancelAddTask(): void {
    this.editingTask = false;
    this.draft = '';
    this.removeTaskInput();
  }

  private createTaskInput(): void {
    this.removeTaskInput();
    this.taskInput = createTaskInput(
      value => { this.draft = value; },
      () => { this.editorHandledKey = true; this.finishAddTask(); },
      () => { this.editorHandledKey = true; this.cancelAddTask(); },
      () => { this.editorHandledKey = true; },
    );
  }

  private removeTaskInput(): void {
    this.taskInput?.remove();
    this.taskInput = null;
  }

  private layoutHitboxes(): void {
    const artwork = artworkTransform();
    setArtworkBounds(this.playHitbox, artwork, 235, 855, 232, 112);
    setArtworkBounds(this.pauseHitbox, artwork, 500, 855, 215, 112);
    setArtworkBounds(this.resetHitbox, artwork, 755, 855, 220, 112);
    setArtworkBounds(this.addTaskHitbox, artwork, 1620, 326, 245, 68);
    setArtworkBounds(this.navFocus, artwork, 48, 332, 158, 88);
    setArtworkBounds(this.navTasks, artwork, 48, 434, 158, 88);
    setArtworkBounds(this.navFarm, artwork, 48, 536, 158, 88);
    setArtworkBounds(this.navShop, artwork, 48, 638, 158, 88);
  }

  private layoutEditor(): void {
    layoutPopup(this.popupAdd, this.popupCancel);
    layoutToolbar([this.fontButton, this.smallerTextButton, this.largerTextButton, this.boldButton, this.italicButton, this.colorButton]);
    layoutTaskInput(this.taskInput);
  }

  private findTaskIndex(x: number, y: number, centerX: number, halfWidth: number): number | null {
    if (this.editingTask || this.data.tasks.length === 0) return null;
    const artwork = artworkTransform();
    const localX = (x - artwork.x) / artwork.scale;
    const localY = (y - artwork.y) / artwork.scale;
    if (localX < centerX - halfWidth || localX > centerX + halfWidth || localY < LIST_TOP || localY > LIST_BOTTOM) return null;
    const index = Math.floor((localY - LIST_TOP + this.scrollOffset) / ROW_HEIGHT);
    if (index < 0 || index >= this.data.tasks.length) return null;
    const rowY = LIST_TOP + index * ROW_HEIGHT - this.scrollOffset;
    return localY >= rowY && localY <= rowY + ROW_HEIGHT ? index : null;
  }

  private findDeleteTaskIndex(x: number, y: number): number | null {
    return this.findTaskIndex(x, y, TASK_DELETE_X, 16);
  }

  private findToggleTaskIndex(x: number, y: number): number | null {
    return this.findTaskIndex(x, y, TASK_CHECKBOX_X, 13);
  }

  private findClickTarget(x: number, y: number): FocusClickTarget | null {
    if (this.findDeleteTaskIndex(x, y) !== null) return 'deleteTask';
    if (this.findToggleTaskIndex(x, y) !== null) return 'toggleTask';
    const targets: Array<[FocusClickTarget, Button]> = this.editingTask
      ? [['popupAdd', this.popupAdd], ['popupCancel', this.popupCancel], ['font', this.fontButton], ['smallerText', this.smallerTextButton], ['largerText', this.largerTextButton], ['toggleBold', this.boldButton], ['toggleItalic', this.italicButton], ['cycleTextColor', this.colorButton]]
      : [['play', this.playHitbox], ['pause', this.pauseHitbox], ['reset', this.resetHitbox], ['addTask', this.addTaskHitbox], ['navFocus', this.navFocus], ['navTasks', this.navTasks], ['navFarm', this.navFarm], ['navShop', this.navShop]];
    for (const [target, button] of targets) if (!button.disabled && button.contains(x, y)) return target;
    return null;
  }

  private consumeClickTarget(): FocusClickTarget | null {
    return this.pointer.consume().target;
  }

  open(world: FarmWorld, save: () => void): void {
    this.world = world;
    this.saveFarm = save;
    this.visible = true;
    this.editorHandledKey = false;
    this.pointer.reset();
  }

  hide(): void {
    this.shop.hide();
    this.cancelAddTask();
    this.visible = false;
    this.pointer.reset();
  }

  disposeSession(): void {
    if (this.session) {
      this.world?.commitFocusProgress(this.session.elapsedMinutes, this.session.plots);
      this.session.cancel();
      this.saveFarm?.();
    }
    this.session = null;
    this.world?.clearGrowthPreview();
    this.hide();
  }

  handleInput(): void {
    if (this.shop.visible) { this.shop.handleInput(); return; }
    if (this.editorHandledKey) { this.editorHandledKey = false; return; }
    if (!this.visible) return;
    if (this.editingTask) {
      if (MakkoEngine.input.isKeyPressed('Escape')) this.cancelAddTask();
      return;
    }
    if (MakkoEngine.input.isKeyPressed('Escape')) this.hide();
    else if (MakkoEngine.input.isKeyPressed('Enter')) this.startTimer();
  }

  private startTimer(): void {
    if (this.session) { this.session.resume(); return; }
    this.session = new FocusSession(this.duration, this.world?.wateredSnapshot() ?? []);
  }

  private updateSession(): void {
    this.world?.previewFocus(this.session?.elapsedMinutes ?? 0, this.session?.plots ?? []);
    if (!this.session?.complete()) return;
    this.world?.completeFocus(this.session.minutes, this.session.plots);
    this.saveFarm?.();
    const key = localDateKey(new Date());
    const day = this.data.days[key] ?? { sessions: 0, minutes: 0 };
    day.sessions++;
    day.minutes += this.session.minutes;
    this.data.days[key] = day;
    this.persist();
    this.session = null;
  }

  update(dt: number): void {
    this.updateSession();
    if (!this.visible) return;
    if (this.shop.visible) { this.shop.update(dt); return; }
    this.navFocus.selected = this.selectedWorkspace === 'focus';
    this.navTasks.selected = this.selectedWorkspace === 'tasks';
    this.layoutHitboxes();
    this.layoutEditor();
    this.playHitbox.disabled = !!this.session && !this.session.paused;
    this.pauseHitbox.disabled = !this.session || this.session.paused;
    this.resetHitbox.disabled = !this.session;
    this.addTaskHitbox.disabled = this.editingTask || this.data.tasks.length >= TASK_LIMIT;
    this.popupAdd.disabled = this.data.tasks.length >= TASK_LIMIT || !this.draft.trim();
    for (const button of [this.navFocus, this.navTasks, this.navFarm, this.navShop]) button.update(dt);
    if (this.editingTask) { this.popupAdd.update(dt); this.popupCancel.update(dt); }
    const click = this.pointer.consume();
    this.processClick(click.target, click.deleteIndex, click.toggleIndex);
    this.handleWheel();
  }

  private processClick(target: FocusClickTarget | null, deleteIndex: number | null, toggleIndex: number | null): void {
    if (target === 'font') this.draftStyle.fontIndex = (this.draftStyle.fontIndex + 1) % TASK_FONT_FAMILIES.length;
    if (target === 'smallerText') this.draftStyle.fontSize = Math.max(14, this.draftStyle.fontSize - 2);
    if (target === 'largerText') this.draftStyle.fontSize = Math.min(30, this.draftStyle.fontSize + 2);
    if (target === 'toggleBold') this.draftStyle.bold = !this.draftStyle.bold;
    if (target === 'toggleItalic') this.draftStyle.italic = !this.draftStyle.italic;
    if (target === 'cycleTextColor') this.draftStyle.colorIndex = (this.draftStyle.colorIndex + 1) % TASK_TEXT_COLORS.length;
    if (target === 'deleteTask' && deleteIndex !== null) this.deleteTask(deleteIndex);
    if (target === 'toggleTask' && toggleIndex !== null) {
      const task = this.data.tasks[toggleIndex];
      if (task) { task.done = !task.done; this.persist(); }
    }
    if (target === 'navFocus') this.selectedWorkspace = 'focus';
    if (target === 'navTasks') this.selectedWorkspace = 'tasks';
    if (target === 'navFarm') { this.hide(); return; }
    if (target === 'navShop' && this.world && this.saveFarm) { this.shop.open(this.world, this.saveFarm, 'Back to focus'); return; }
    if (target === 'play') this.startTimer();
    if (target === 'pause') this.session?.pause();
    if (target === 'reset') {
      if (this.session) this.world?.commitFocusProgress(this.session.elapsedMinutes, this.session.plots);
      this.session?.cancel();
      this.session = null;
      this.world?.clearGrowthPreview();
      this.saveFarm?.();
    }
    if (target === 'addTask') {
      this.editingTask = true;
      this.draft = '';
      this.draftStyle = { ...DEFAULT_TASK_STYLE };
      this.createTaskInput();
    }
    if (this.editingTask && target === 'popupAdd') this.finishAddTask();
    if (this.editingTask && target === 'popupCancel') this.cancelAddTask();
  }

  private handleWheel(): void {
    const input = MakkoEngine.input;
    const inside = input.mouseX >= 965 && input.mouseX <= 1878 && input.mouseY >= LIST_TOP && input.mouseY <= LIST_BOTTOM;
    if (inside && (input.isScrollingDown() || input.isScrollingUp())) {
      input.captureWheel();
      this.scrollOffset += (input.isScrollingDown() ? 1 : -1) * ROW_HEIGHT * 2;
      this.clampScrollOffset();
    }
  }

  render(): void {
    if (!this.visible) return;
    layoutTaskInput(this.taskInput);
    const display = MakkoEngine.display;
    const asset = MakkoEngine.staticAsset('ui_focus_1');
    if (!asset || !asset.image.complete || asset.image.naturalWidth <= 0 || asset.image.naturalHeight <= 0) return;
    const artwork = artworkTransform();
    display.drawImage(asset.image, artwork.x, artwork.y, artwork.width, artwork.height, { pivot: null });
    this.renderer.renderTasks({
      data: this.data,
      editingTask: this.editingTask,
      draft: this.draft,
      draftStyle: this.draftStyle,
      scrollOffset: this.scrollOffset,
      artworkTransform,
      popupAdd: this.popupAdd,
      popupCancel: this.popupCancel,
      fontButton: this.fontButton,
      smallerTextButton: this.smallerTextButton,
      largerTextButton: this.largerTextButton,
      boldButton: this.boldButton,
      italicButton: this.italicButton,
      colorButton: this.colorButton,
    }, artwork);
    this.renderer.drawCountdown(this.session?.countdown ?? '25:00', artwork);
    this.rendererControls.forEach((control, index) => {
      this.renderer.drawControlHitboxes([control], artwork.scale, index);
    });
  }

}
