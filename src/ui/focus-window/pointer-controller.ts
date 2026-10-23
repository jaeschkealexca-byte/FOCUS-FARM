import { pointerToDisplay } from './layout';
import type { FocusClickTarget } from './types';

export interface FocusPointerActions {
  visible(): boolean;
  shopVisible(): boolean;
  layout(): void;
  findClickTarget(x: number, y: number): FocusClickTarget | null;
  findDeleteTaskIndex(x: number, y: number): number | null;
  findToggleTaskIndex(x: number, y: number): number | null;
}

export interface FocusPointerClick {
  target: FocusClickTarget | null;
  deleteIndex: number | null;
  toggleIndex: number | null;
}

export class FocusPointerController {
  private armedTarget: FocusClickTarget | null = null;
  private armedPointerId: number | null = null;
  private armedDeleteIndex: number | null = null;
  private armedToggleIndex: number | null = null;
  private pendingTarget: FocusClickTarget | null = null;
  private pendingDeleteIndex: number | null = null;
  private pendingToggleIndex: number | null = null;

  constructor(private readonly actions: FocusPointerActions) {
    document.addEventListener('pointerdown', event => this.onPointerDown(event));
    document.addEventListener('pointerup', event => this.onPointerUp(event));
    document.addEventListener('pointercancel', event => this.clearArmed(event.pointerId));
  }

  consume(): FocusPointerClick {
    const click = { target: this.pendingTarget, deleteIndex: this.pendingDeleteIndex, toggleIndex: this.pendingToggleIndex };
    this.pendingTarget = null;
    return click;
  }

  reset(): void {
    this.pendingTarget = null;
    this.pendingDeleteIndex = null;
    this.pendingToggleIndex = null;
    this.clearArmed(this.armedPointerId ?? -1);
  }

  private clearArmed(pointerId: number): void {
    if (pointerId !== this.armedPointerId) return;
    this.armedTarget = null;
    this.armedPointerId = null;
    this.armedDeleteIndex = null;
    this.armedToggleIndex = null;
  }

  private onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || !this.actions.visible() || this.actions.shopVisible()) return;
    this.actions.layout();
    const point = pointerToDisplay(event);
    this.armedDeleteIndex = point ? this.actions.findDeleteTaskIndex(point.x, point.y) : null;
    this.armedToggleIndex = point ? this.actions.findToggleTaskIndex(point.x, point.y) : null;
    this.armedTarget = point ? this.actions.findClickTarget(point.x, point.y) : null;
    this.armedPointerId = this.armedTarget ? event.pointerId : null;
  }

  private onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.armedPointerId) return;
    const target = this.armedTarget;
    const deleteIndex = this.armedDeleteIndex;
    const toggleIndex = this.armedToggleIndex;
    this.clearArmed(event.pointerId);
    if (!target || !this.actions.visible() || this.actions.shopVisible()) return;
    const point = pointerToDisplay(event);
    if (!point || this.actions.findClickTarget(point.x, point.y) !== target) return;
    if (target === 'deleteTask') {
      const released = this.actions.findDeleteTaskIndex(point.x, point.y);
      if (released === deleteIndex) {
        this.pendingDeleteIndex = released;
        this.pendingTarget = target;
      }
    } else if (target === 'toggleTask') {
      const released = this.actions.findToggleTaskIndex(point.x, point.y);
      if (released === toggleIndex) {
        this.pendingToggleIndex = released;
        this.pendingTarget = target;
      }
    } else {
      this.pendingTarget = target;
    }
  }
}
