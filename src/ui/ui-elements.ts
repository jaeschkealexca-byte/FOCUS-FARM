/**
 * UI Elements
 *
 * Core widgets: Button, StatusBar, Text, Panel, KeyHint.
 * All take a single options object; every option has a sensible default.
 * Pass `anchor` to pin to a screen region, or omit x/y entirely inside containers.
 *
 *   new Button({ label: 'OK' })                              // auto-sized
 *   new StatusBar({ anchor: 'top-left', value: hp, max: 100 })
 *   new Panel({ anchor: 'bottom-left', title: 'COMMAND', children: [menu] })
 */

import { MakkoEngine } from '@makko/engine';
import {
  type UIPlacement,
  type TextSize,
  type TextAlign,
  UIWidget,
  UI_THEME,
  fontFor,
  fontSizeOf,
  resolveColor,
  measureTextWidth,
  getPointer,
} from './ui-layer';
import { type UIContainerOptions, type UIDirection, UIContainer } from './ui-layout';

// ============================================================================
// Button
// ============================================================================

export type ButtonVariant = 'primary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_HEIGHTS: Record<ButtonSize, number> = { sm: 32, md: 42, lg: 50 };
const BUTTON_FONTS: Record<ButtonSize, TextSize> = { sm: 'sm', md: 'md', lg: 'lg' };
const BUTTON_MIN_WIDTH = 80;

export interface ButtonOptions extends UIPlacement {
  label: string;
  /** primary: solid fill (default) · ghost: transparent + border · danger: red */
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Omit for auto-width from the label */
  width?: number;
  height?: number;
}

/**
 * Button - clickable widget with hover/press states, mouse + touch.
 * Poll isClicked() after calling update(dt) each frame (UILayer.update does this).
 */
export class Button extends UIWidget {
  label: string;
  variant: ButtonVariant;
  size: ButtonSize;
  disabled: boolean;

  private isHovered = false;
  private isPressed = false;
  private armed = false;
  private clickedThisFrame = false;

  constructor(options: ButtonOptions) {
    super(options);
    this.label = options.label;
    this.variant = options.variant ?? 'primary';
    this.size = options.size ?? 'md';
    this.disabled = options.disabled ?? false;
  }

  protected measureWidth(): number {
    const w = measureTextWidth(this.label, fontFor(BUTTON_FONTS[this.size], true)) + UI_THEME.spacing.lg * 2;
    return Math.max(BUTTON_MIN_WIDTH, w);
  }

  protected measureHeight(): number {
    return BUTTON_HEIGHTS[this.size];
  }

  protected tick(_dt: number): void {
    this.clickedThisFrame = false;
    if (this.disabled) {
      this.isHovered = false;
      this.isPressed = false;
      this.armed = false;
      return;
    }
    const p = getPointer();
    this.isHovered = this.contains(p.x, p.y);
    this.isPressed = this.isHovered && p.down;
    if (p.pressed && this.isHovered) this.armed = true;
    if (p.released) {
      if (this.armed && this.isHovered) this.clickedThisFrame = true;
      this.armed = false;
    } else if (!p.down) {
      this.armed = false;
    }
  }

  /**
   * True only on the frame the pointer is released over the button.
   * Requires update(dt) to be called each frame. Always false when disabled.
   */
  isClicked(): boolean {
    return this.clickedThisFrame;
  }

  protected draw(): void {
    const display = MakkoEngine.display;
    const w = this.getWidth();
    const h = this.getHeight();
    const shiftY = this.disabled ? 0 : this.isPressed ? 1.5 : this.isHovered ? -1 : 0;
    const bx = this.x;
    const by = this.y + shiftY;
    const font = fontFor(BUTTON_FONTS[this.size], true);

    if (this.variant === 'ghost') {
      display.drawRoundRect(bx, by, w, h, 8, {
        fill: this.isPressed ? '#614f3c' : this.isHovered ? '#524332' : '#47392a',
        stroke: this.isHovered ? '#e3c79c' : '#b89b72',
        lineWidth: 1.5,
      });
      display.drawText(this.label, bx + w / 2, by + h / 2, {
        font,
        fill: this.disabled ? UI_THEME.textDim : '#f5ead4',
        align: 'center',
        baseline: 'middle',
      });
      return;
    }

    // Soft drop shadow
    if (!this.isPressed) {
      display.drawRoundRect(this.x + 2, this.y + 3, w, h, 12, {
        fill: '#17130f',
        alpha: 0.28,
      });
    }

    const { outerFill, outerStroke, innerFill, innerStroke, textColor, badgeFill, badgeText } = this.getFarmButtonStyle();

    // Outer wooden/leather frame
    display.drawRoundRect(bx, by, w, h, 12, {
      fill: outerFill,
      stroke: outerStroke,
      lineWidth: 2,
    });

    // Inner parchment/sage plaque face
    const inset = 4;
    display.drawRoundRect(bx + inset, by + inset, w - inset * 2, h - inset * 2, 8, {
      fill: innerFill,
      stroke: innerStroke,
      lineWidth: 1,
    });

    // Check if the label ends with a keyboard shortcut badge like "[F]", "[B]", "[I]"
    const keyMatch = /^(.+?)\s*\[([^\]]+)\]$/.exec(this.label);
    if (keyMatch) {
      const mainLabel = keyMatch[1].trim();
      const keyLabel = keyMatch[2].trim();
      const badgeW = Math.max(26, measureTextWidth(keyLabel, fontFor('xs', true)) + 14);
      const badgeH = Math.min(24, h - 14);
      const badgeX = bx + w - inset - badgeW - 8;
      const badgeY = by + (h - badgeH) / 2;

      display.drawText(mainLabel, bx + inset + 12, by + h / 2, {
        font,
        fill: textColor,
        align: 'left',
        baseline: 'middle',
      });

      display.drawRoundRect(badgeX, badgeY, badgeW, badgeH, 6, {
        fill: badgeFill,
        stroke: outerStroke,
        lineWidth: 1,
      });
      display.drawText(keyLabel, badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.5, {
        font: fontFor('xs', true),
        fill: badgeText,
        align: 'center',
        baseline: 'middle',
      });
    } else {
      display.drawText(this.label, bx + w / 2, by + h / 2, {
        font,
        fill: textColor,
        align: 'center',
        baseline: 'middle',
      });
    }
  }

  private getFarmButtonStyle(): {
    outerFill: string;
    outerStroke: string;
    innerFill: string;
    innerStroke: string;
    textColor: string;
    badgeFill: string;
    badgeText: string;
  } {
    if (this.disabled) {
      return {
        outerFill: '#6e6253',
        outerStroke: '#9c8e7b',
        innerFill: '#ded2bd',
        innerStroke: '#cbbda8',
        textColor: '#8d8170',
        badgeFill: '#c5b8a2',
        badgeText: '#7a6f5f',
      };
    }
    if (this.variant === 'danger') {
      return {
        outerFill: '#5c2822',
        outerStroke: this.isHovered ? '#e69583' : '#b85c4b',
        innerFill: this.isPressed ? '#943c31' : this.isHovered ? '#bf5648' : '#a7493c',
        innerStroke: '#d47a6a',
        textColor: '#fff8e7',
        badgeFill: '#6e2820',
        badgeText: '#fff8e7',
      };
    }
    return {
      outerFill: '#463829',
      outerStroke: this.isHovered ? '#e0b872' : '#c9a878',
      innerFill: this.isPressed ? '#e8d7b9' : this.isHovered ? '#fffaf0' : '#f7edd9',
      innerStroke: this.isHovered ? '#c49e68' : '#d5be99',
      textColor: this.isHovered ? '#2f4527' : '#463625',
      badgeFill: this.isHovered ? '#557a44' : '#69834f',
      badgeText: '#fff8e7',
    };
  }
}

// ============================================================================
// StatusBar
// ============================================================================

export type StatusBarType = 'health' | 'mana' | 'stamina' | 'xp';

export interface StatusBarOptions extends UIPlacement {
  value: number;
  max: number;
  type?: StatusBarType;
  /** Optional short label drawn inside the left edge, e.g. 'HP' */
  label?: string;
  /** Draw 'value/max' inside the right edge */
  showValue?: boolean;
  width?: number;
  height?: number;
}

/**
 * StatusBar - horizontal bar for health, mana, stamina, xp.
 * Mutate `value` (and `max`) directly as the game state changes.
 */
export class StatusBar extends UIWidget {
  value: number;
  max: number;
  type: StatusBarType;
  label: string;
  showValue: boolean;

  constructor(options: StatusBarOptions) {
    super(options);
    this.value = options.value;
    this.max = options.max;
    this.type = options.type ?? 'health';
    this.label = options.label ?? '';
    this.showValue = options.showValue ?? false;
  }

  protected measureWidth(): number {
    return 200;
  }

  protected measureHeight(): number {
    return 18;
  }

  private getBarColor(): string {
    if (this.type === 'health') {
      return this.value / this.max < 0.25 ? UI_THEME.healthLow : UI_THEME.health;
    }
    const colors: Record<StatusBarType, string> = {
      health: UI_THEME.health,
      mana: UI_THEME.mana,
      stamina: UI_THEME.stamina,
      xp: UI_THEME.xp,
    };
    return colors[this.type];
  }

  protected draw(): void {
    const display = MakkoEngine.display;
    const w = this.getWidth();
    const h = this.getHeight();

    display.drawRoundRect(this.x, this.y, w, h, UI_THEME.radius.sm, {
      fill: UI_THEME.surface,
      stroke: UI_THEME.border,
      lineWidth: 1,
    });

    const inset = 2;
    const ratio = this.max > 0 ? Math.max(0, Math.min(1, this.value / this.max)) : 0;
    const fillWidth = (w - inset * 2) * ratio;
    if (fillWidth > 0) {
      display.drawRoundRect(this.x + inset, this.y + inset, fillWidth, h - inset * 2, UI_THEME.radius.sm - 1, {
        fill: this.getBarColor(),
      });
    }

    const font = fontFor('xs', true);
    if (this.label) {
      display.drawText(this.label, this.x + UI_THEME.spacing.sm, this.y + h / 2, {
        font,
        fill: UI_THEME.text,
        align: 'left',
        baseline: 'middle',
      });
    }
    if (this.showValue) {
      display.drawText(`${Math.round(this.value)}/${Math.round(this.max)}`, this.x + w - UI_THEME.spacing.sm, this.y + h / 2, {
        font,
        fill: UI_THEME.text,
        align: 'right',
        baseline: 'middle',
      });
    }
  }
}

// ============================================================================
// Text
// ============================================================================

export interface TextOptions extends UIPlacement {
  text: string;
  size?: TextSize;
  /** Theme token ('text' | 'muted' | 'dim' | 'primary' | 'accent') or any CSS color */
  color?: string;
  align?: TextAlign;
  bold?: boolean;
  /** Optional box width for alignment; containers set this automatically */
  width?: number;
}

/**
 * Text - single-line text. Renders from its top-left corner.
 * Mutate `text` directly for live values (score, timer).
 * Inside a stretched container slot, `align` positions the text within the slot.
 */
export class Text extends UIWidget {
  text: string;
  size: TextSize;
  color: string;
  align: TextAlign;
  bold: boolean;

  constructor(options: TextOptions) {
    super(options);
    this.text = options.text;
    this.size = options.size ?? 'md';
    this.color = options.color ?? 'text';
    this.align = options.align ?? 'left';
    this.bold = options.bold ?? false;
  }

  protected measureWidth(): number {
    return measureTextWidth(this.text, fontFor(this.size, this.bold));
  }

  protected measureHeight(): number {
    return fontSizeOf(this.size);
  }

  protected draw(): void {
    const display = MakkoEngine.display;
    const font = fontFor(this.size, this.bold);

    // Free-placed text (raw x/y, no box) keeps canvas point-alignment semantics:
    // align 'center' means "centered on x" — useful for labels over game objects.
    // Anchored or container-managed text aligns within its laid-out box instead.
    const hasBox =
      this.anchor !== undefined ||
      this.layoutManaged ||
      this.width !== undefined ||
      this.assignedWidth !== undefined;

    let drawX = this.x;
    const canvasAlign: TextAlign = this.align;
    if (hasBox) {
      const boxW = this.getWidth();
      if (this.align === 'center') drawX = this.x + boxW / 2;
      else if (this.align === 'right') drawX = this.x + boxW;
    }

    display.drawText(this.text, drawX, this.y, {
      font,
      fill: resolveColor(this.color),
      align: canvasAlign,
      baseline: 'top',
    });
  }
}

// ============================================================================
// Panel
// ============================================================================

export interface PanelOptions extends UIContainerOptions {
  /** Flow direction for children. Default 'vertical' */
  direction?: UIDirection;
  /** Optional header drawn above the children */
  title?: string;
  background?: string;
  borderColor?: string;
  radius?: number;
}

/**
 * Panel - surface container that owns and lays out its children.
 * Auto-sizes to content by default; pass width/height for a fixed frame.
 * A bare `new Panel({ x, y, width, height })` still works as a background rect.
 */
export class Panel extends UIContainer {
  title: string;
  background: string;
  borderColor: string;
  radius: number;

  constructor(options: PanelOptions = {}) {
    super(options.direction ?? 'vertical', {
      ...options,
      padding: options.padding ?? UI_THEME.spacing.lg,
    });
    this.title = options.title ?? '';
    this.background = options.background ?? UI_THEME.surface;
    this.borderColor = options.borderColor ?? UI_THEME.border;
    this.radius = options.radius ?? UI_THEME.radius.lg;
  }

  protected contentOffsetTop(): number {
    if (!this.title) return 0;
    return fontSizeOf('sm') + UI_THEME.spacing.sm;
  }

  protected measureWidth(): number {
    let w = super.measureWidth();
    if (this.title) {
      w = Math.max(w, measureTextWidth(this.title, fontFor('sm', true)) + this.padding * 2);
    }
    return w;
  }

  protected drawBackground(): void {
    const display = MakkoEngine.display;
    const w = this.getWidth();
    const h = this.getHeight();
    display.drawRoundRect(this.x + 2, this.y + 3, w, h, this.radius, {
      fill: '#17130f',
      alpha: 0.28,
    });
    display.drawRoundRect(this.x, this.y, w, h, this.radius, {
      fill: this.background,
      stroke: this.borderColor,
      lineWidth: 2,
    });
    if (this.title) {
      display.drawText(this.title, this.x + this.padding, this.y + this.padding, {
        font: fontFor('sm', true),
        fill: UI_THEME.textMuted,
        align: 'left',
        baseline: 'top',
      });
    }
  }
}

// ============================================================================
// KeyHint
// ============================================================================

export interface KeyHintOptions extends UIPlacement {
  /** Key name shown in the key cap, e.g. 'SPACE', 'E' */
  key: string;
  /** Optional trailing description, e.g. 'Jump' → [SPACE] Jump */
  label?: string;
}

/**
 * KeyHint - keyboard shortcut chip that looks like a physical key cap.
 */
export class KeyHint extends UIWidget {
  key: string;
  label: string;

  constructor(options: KeyHintOptions) {
    super(options);
    this.key = options.key;
    this.label = options.label ?? '';
  }

  private capWidth(): number {
    return measureTextWidth(this.key, fontFor('xs')) + UI_THEME.spacing.sm * 2;
  }

  protected measureWidth(): number {
    let w = this.capWidth();
    if (this.label) {
      w += UI_THEME.spacing.sm + measureTextWidth(this.label, fontFor('xs'));
    }
    return w;
  }

  protected measureHeight(): number {
    return fontSizeOf('xs') + UI_THEME.spacing.xs * 2;
  }

  protected draw(): void {
    const display = MakkoEngine.display;
    const capW = this.capWidth();
    const h = this.getHeight();

    display.drawRoundRect(this.x, this.y, capW, h, UI_THEME.radius.sm, {
      fill: 'rgba(255, 255, 255, 0.06)',
      stroke: UI_THEME.border,
      lineWidth: 1,
    });
    display.drawText(this.key, this.x + capW / 2, this.y + h / 2, {
      font: fontFor('xs'),
      fill: UI_THEME.textDim,
      align: 'center',
      baseline: 'middle',
    });
    if (this.label) {
      display.drawText(this.label, this.x + capW + UI_THEME.spacing.sm, this.y + h / 2, {
        font: fontFor('xs'),
        fill: UI_THEME.textMuted,
        align: 'left',
        baseline: 'middle',
      });
    }
  }
}
