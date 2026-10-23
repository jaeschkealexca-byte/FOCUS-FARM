import staticManifestData from '../../static-asset-manifest.json';
import sizingManifestData from '../../.makko/sizing-manifest.json';

export interface LinearGradientStop {
  offset: number;
  color: string;
}

export interface LinearGradientFill {
  type: 'linear';
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  stops: LinearGradientStop[];
}

export interface DrawStyle {
  fill?: string | LinearGradientFill;
  stroke?: string;
  lineWidth?: number;
  alpha?: number;
}

export interface TextStyle {
  font?: string;
  fill?: string;
  stroke?: string;
  lineWidth?: number;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  alpha?: number;
}

export interface ImageStyle {
  pivot?: string | null;
  alpha?: number;
  flipX?: boolean;
  flipY?: boolean;
}

export interface IDisplay {
  readonly width: number;
  readonly height: number;
  beginFrame(): void;
  endFrame(): void;
  clear(color?: string): void;
  setImageSmoothing(enabled: boolean): void;
  setGlobalOffset(x: number, y: number): void;
  pushClipRect(x: number, y: number, width: number, height: number): void;
  popClip(): void;
  measureText(text: string, style?: { font?: string }): { width: number };
  drawRect(x: number, y: number, width: number, height: number, style?: DrawStyle): void;
  drawRoundRect(x: number, y: number, width: number, height: number, radius: number, style?: DrawStyle): void;
  drawCircle(x: number, y: number, radius: number, style?: DrawStyle): void;
  drawEllipse(x: number, y: number, radiusX: number, radiusY: number, style?: DrawStyle): void;
  drawLine(x1: number, y1: number, x2: number, y2: number, style?: DrawStyle): void;
  drawPolygon(points: Array<{ x: number; y: number }>, style?: DrawStyle): void;
  drawText(text: string, x: number, y: number, style?: TextStyle): void;
  drawImage(image: HTMLImageElement, x: number, y: number, width?: number, height?: number, style?: ImageStyle): void;
  drawImageRegion(
    image: HTMLImageElement,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    style?: ImageStyle,
  ): void;
}

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

export interface IInput {
  readonly mouseX: number;
  readonly mouseY: number;
  readonly touches: readonly TouchPoint[];
  capture(keys: string[]): void;
  endFrame(): void;
  isKeyDown(code: string): boolean;
  isKeyPressed(code: string): boolean;
  isKeyReleased(code: string): boolean;
  isMouseDown(button?: number): boolean;
  isMousePressed(button?: number): boolean;
  isMouseReleased(button?: number): boolean;
  isTouchDown(): boolean;
  isTouchPressed(): boolean;
  isTouchReleased(): boolean;
  isScrollingUp(): boolean;
  isScrollingDown(): boolean;
  captureWheel(): void;
}

export interface StaticAsset {
  key: string;
  url: string;
  image: HTMLImageElement;
  width: number;
  height: number;
}

export interface EngineInitOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  manifests?: unknown[];
}

interface ManifestAssetRecord {
  url: string;
  name?: string;
  asset_type?: string;
  sourceId?: string;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    category?: string;
  };
}

interface SizingRecord {
  key: string;
  source: string;
  longSidePx: number;
  anchor?: string;
  locked?: boolean;
}

const rawStaticAssets = (staticManifestData as { assets?: Record<string, ManifestAssetRecord> }).assets ?? {};
const rawSizingEntries = (sizingManifestData as { entries?: Record<string, SizingRecord> }).entries ?? {};

function computeSizedDimensions(key: string, rawWidth: number, rawHeight: number): { width: number; height: number } {
  const sizing = rawSizingEntries[`static:${key}`];
  if (sizing && sizing.longSidePx > 0) {
    const longSide = Math.max(rawWidth, rawHeight);
    if (longSide > 0) {
      const scale = sizing.longSidePx / longSide;
      return {
        width: rawWidth * scale,
        height: rawHeight * scale,
      };
    }
  }
  return { width: rawWidth, height: rawHeight };
}

class CanvasDisplay implements IDisplay {
  width = 1920;
  height = 1080;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private imageSmoothing = false;
  private offsetX = 0;
  private offsetY = 0;
  private clipDepth = 0;

  init(canvas: HTMLCanvasElement, width: number, height: number): void {
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    canvas.width = width;
    canvas.height = height;
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = this.imageSmoothing;
    }

    const updateCanvasSize = (): void => {
      const parent = canvas.parentElement;
      const availW = parent ? parent.clientWidth : window.innerWidth;
      const availH = parent ? parent.clientHeight : window.innerHeight;
      if (availW <= 0 || availH <= 0) return;
      const scale = Math.min(availW / this.width, availH / this.height);
      canvas.style.width = `${Math.floor(this.width * scale)}px`;
      canvas.style.height = `${Math.floor(this.height * scale)}px`;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
  }

  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  setImageSmoothing(enabled: boolean): void {
    this.imageSmoothing = enabled;
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = enabled;
    }
  }

  setGlobalOffset(x: number, y: number): void {
    this.offsetX = x;
    this.offsetY = y;
  }

  beginFrame(): void {
    if (!this.ctx) return;
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = this.imageSmoothing;
    this.offsetX = 0;
    this.offsetY = 0;
    this.clipDepth = 0;
  }

  endFrame(): void {
    if (!this.ctx) return;
    while (this.clipDepth > 0) {
      this.ctx.restore();
      this.clipDepth--;
    }
    this.ctx.restore();
  }

  clear(color = '#000000'): void {
    if (!this.ctx) return;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }

  pushClipRect(x: number, y: number, width: number, height: number): void {
    if (!this.ctx) return;
    this.ctx.save();
    this.clipDepth++;
    this.ctx.beginPath();
    this.ctx.rect(x + this.offsetX, y + this.offsetY, width, height);
    this.ctx.clip();
  }

  popClip(): void {
    if (!this.ctx || this.clipDepth <= 0) return;
    this.ctx.restore();
    this.clipDepth--;
  }

  measureText(text: string, style?: { font?: string }): { width: number } {
    if (!this.ctx) return { width: text.length * 8 };
    this.ctx.save();
    if (style?.font) this.ctx.font = style.font;
    const width = this.ctx.measureText(text).width;
    this.ctx.restore();
    return { width };
  }

  private resolveFillStyle(fill: string | LinearGradientFill): string | CanvasGradient {
    if (typeof fill === 'string') return fill;
    if (!this.ctx) return '#000000';
    const grad = this.ctx.createLinearGradient(
      fill.x0 + this.offsetX,
      fill.y0 + this.offsetY,
      fill.x1 + this.offsetX,
      fill.y1 + this.offsetY,
    );
    for (const stop of fill.stops) {
      grad.addColorStop(stop.offset, stop.color);
    }
    return grad;
  }

  private applyShapeStyle(style?: DrawStyle): void {
    if (!this.ctx || !style) return;
    if (style.fill && style.fill !== 'transparent') {
      this.ctx.fillStyle = this.resolveFillStyle(style.fill);
      this.ctx.fill();
    }
    if (style.stroke && style.stroke !== 'transparent' && (style.lineWidth ?? 1) > 0) {
      this.ctx.strokeStyle = style.stroke;
      this.ctx.lineWidth = style.lineWidth ?? 1;
      this.ctx.stroke();
    }
  }

  drawRect(x: number, y: number, width: number, height: number, style?: DrawStyle): void {
    if (!this.ctx || !style) return;
    this.ctx.save();
    if (style.alpha !== undefined) this.ctx.globalAlpha *= style.alpha;
    this.ctx.beginPath();
    this.ctx.rect(x + this.offsetX, y + this.offsetY, width, height);
    this.applyShapeStyle(style);
    this.ctx.restore();
  }

  drawRoundRect(x: number, y: number, width: number, height: number, radius: number, style?: DrawStyle): void {
    if (!this.ctx || !style) return;
    const r = Math.max(0, Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2));
    this.ctx.save();
    if (style.alpha !== undefined) this.ctx.globalAlpha *= style.alpha;
    this.ctx.beginPath();
    this.ctx.roundRect(x + this.offsetX, y + this.offsetY, width, height, r);
    this.applyShapeStyle(style);
    this.ctx.restore();
  }

  drawCircle(x: number, y: number, radius: number, style?: DrawStyle): void {
    if (!this.ctx || !style || radius <= 0) return;
    this.ctx.save();
    if (style.alpha !== undefined) this.ctx.globalAlpha *= style.alpha;
    this.ctx.beginPath();
    this.ctx.arc(x + this.offsetX, y + this.offsetY, radius, 0, Math.PI * 2);
    this.applyShapeStyle(style);
    this.ctx.restore();
  }

  drawEllipse(x: number, y: number, radiusX: number, radiusY: number, style?: DrawStyle): void {
    if (!this.ctx || !style || radiusX <= 0 || radiusY <= 0) return;
    this.ctx.save();
    if (style.alpha !== undefined) this.ctx.globalAlpha *= style.alpha;
    this.ctx.beginPath();
    this.ctx.ellipse(x + this.offsetX, y + this.offsetY, radiusX, radiusY, 0, 0, Math.PI * 2);
    this.applyShapeStyle(style);
    this.ctx.restore();
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, style?: DrawStyle): void {
    if (!this.ctx) return;
    const stroke = style?.stroke ?? (typeof style?.fill === 'string' ? style.fill : '#ffffff');
    const lineWidth = style?.lineWidth ?? 1;
    if (lineWidth <= 0) return;
    this.ctx.save();
    if (style?.alpha !== undefined) this.ctx.globalAlpha *= style.alpha;
    this.ctx.beginPath();
    this.ctx.moveTo(x1 + this.offsetX, y1 + this.offsetY);
    this.ctx.lineTo(x2 + this.offsetX, y2 + this.offsetY);
    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawPolygon(points: Array<{ x: number; y: number }>, style?: DrawStyle): void {
    if (!this.ctx || !style || points.length < 2) return;
    this.ctx.save();
    if (style.alpha !== undefined) this.ctx.globalAlpha *= style.alpha;
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x + this.offsetX, points[0].y + this.offsetY);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x + this.offsetX, points[i].y + this.offsetY);
    }
    this.ctx.closePath();
    this.applyShapeStyle(style);
    this.ctx.restore();
  }

  drawText(text: string, x: number, y: number, style?: TextStyle): void {
    if (!this.ctx) return;
    this.ctx.save();
    if (style?.alpha !== undefined) this.ctx.globalAlpha *= style.alpha;
    if (style?.font) this.ctx.font = style.font;
    this.ctx.textAlign = style?.align ?? 'left';
    this.ctx.textBaseline = style?.baseline ?? 'alphabetic';
    const drawX = x + this.offsetX;
    const drawY = y + this.offsetY;
    if (style?.stroke && (style.lineWidth ?? 0) > 0) {
      this.ctx.strokeStyle = style.stroke;
      this.ctx.lineWidth = style.lineWidth ?? 1;
      this.ctx.strokeText(text, drawX, drawY);
    }
    this.ctx.fillStyle = style?.fill ?? '#ffffff';
    this.ctx.fillText(text, drawX, drawY);
    this.ctx.restore();
  }

  drawImage(
    image: HTMLImageElement,
    x: number,
    y: number,
    width?: number,
    height?: number,
    style?: ImageStyle,
  ): void {
    if (!this.ctx || !image.complete || image.naturalWidth <= 0) return;
    const w = width ?? image.naturalWidth;
    const h = height ?? image.naturalHeight;
    this.ctx.save();
    if (style?.alpha !== undefined) this.ctx.globalAlpha *= style.alpha;
    this.ctx.drawImage(image, x + this.offsetX, y + this.offsetY, w, h);
    this.ctx.restore();
  }

  drawImageRegion(
    image: HTMLImageElement,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    style?: ImageStyle,
  ): void {
    if (!this.ctx || !image.complete || image.naturalWidth <= 0 || sw <= 0 || sh <= 0) return;
    this.ctx.save();
    if (style?.alpha !== undefined) this.ctx.globalAlpha *= style.alpha;
    this.ctx.drawImage(image, sx, sy, sw, sh, dx + this.offsetX, dy + this.offsetY, dw, dh);
    this.ctx.restore();
  }
}

class InputManager implements IInput {
  mouseX = 0;
  mouseY = 0;
  touches: TouchPoint[] = [];

  private capturedKeys = new Set<string>();
  private keysDown = new Set<string>();
  private keysPressed = new Set<string>();
  private keysReleased = new Set<string>();

  private mouseDown = new Set<number>();
  private mousePressed = new Set<number>();
  private mouseReleased = new Set<number>();

  private touchDown = false;
  private touchPressed = false;
  private touchReleased = false;

  private wheelDeltaY = 0;
  private wheelCaptured = false;

  init(display: CanvasDisplay): void {
    const toDisplayCoords = (clientX: number, clientY: number): { x: number; y: number } => {
      const canvas = display.getCanvas();
      if (!canvas) return { x: clientX, y: clientY };
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
      return {
        x: ((clientX - rect.left) * display.width) / rect.width,
        y: ((clientY - rect.top) * display.height) / rect.height,
      };
    };

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const isInputTarget =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable);

      if (!isInputTarget && this.capturedKeys.has(e.code)) {
        e.preventDefault();
      }
      if (!this.keysDown.has(e.code)) {
        this.keysPressed.add(e.code);
      }
      this.keysDown.add(e.code);
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keysDown.delete(e.code);
      this.keysReleased.add(e.code);
    });

    window.addEventListener('blur', () => {
      this.keysDown.clear();
      this.mouseDown.clear();
      this.touchDown = false;
      this.touches = [];
    });

    window.addEventListener('mousemove', (e: MouseEvent) => {
      const pos = toDisplayCoords(e.clientX, e.clientY);
      this.mouseX = pos.x;
      this.mouseY = pos.y;
    });

    window.addEventListener('mousedown', (e: MouseEvent) => {
      const pos = toDisplayCoords(e.clientX, e.clientY);
      this.mouseX = pos.x;
      this.mouseY = pos.y;
      if (!this.mouseDown.has(e.button)) {
        this.mousePressed.add(e.button);
      }
      this.mouseDown.add(e.button);
    });

    window.addEventListener('mouseup', (e: MouseEvent) => {
      const pos = toDisplayCoords(e.clientX, e.clientY);
      this.mouseX = pos.x;
      this.mouseY = pos.y;
      this.mouseDown.delete(e.button);
      this.mouseReleased.add(e.button);
    });

    window.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        this.wheelDeltaY += e.deltaY;
        if (this.wheelCaptured) {
          e.preventDefault();
        }
      },
      { passive: false },
    );

    const updateTouches = (e: TouchEvent): void => {
      this.touches = Array.from(e.touches).map(t => {
        const pos = toDisplayCoords(t.clientX, t.clientY);
        return { id: t.identifier, x: pos.x, y: pos.y };
      });
    };

    window.addEventListener('touchstart', (e: TouchEvent) => {
      updateTouches(e);
      if (!this.touchDown) this.touchPressed = true;
      this.touchDown = true;
    });

    window.addEventListener('touchmove', (e: TouchEvent) => {
      updateTouches(e);
    });

    window.addEventListener('touchend', (e: TouchEvent) => {
      updateTouches(e);
      if (this.touches.length === 0) {
        this.touchDown = false;
        this.touchReleased = true;
      }
    });

    window.addEventListener('touchcancel', () => {
      this.touches = [];
      this.touchDown = false;
      this.touchReleased = true;
    });
  }

  capture(keys: string[]): void {
    for (const key of keys) {
      this.capturedKeys.add(key);
    }
  }

  endFrame(): void {
    this.keysPressed.clear();
    this.keysReleased.clear();
    this.mousePressed.clear();
    this.mouseReleased.clear();
    this.touchPressed = false;
    this.touchReleased = false;
    this.wheelDeltaY = 0;
    this.wheelCaptured = false;
  }

  isKeyDown(code: string): boolean {
    return this.keysDown.has(code);
  }

  isKeyPressed(code: string): boolean {
    return this.keysPressed.has(code);
  }

  isKeyReleased(code: string): boolean {
    return this.keysReleased.has(code);
  }

  isMouseDown(button = 0): boolean {
    return this.mouseDown.has(button);
  }

  isMousePressed(button = 0): boolean {
    return this.mousePressed.has(button);
  }

  isMouseReleased(button = 0): boolean {
    return this.mouseReleased.has(button);
  }

  isTouchDown(): boolean {
    return this.touchDown;
  }

  isTouchPressed(): boolean {
    return this.touchPressed;
  }

  isTouchReleased(): boolean {
    return this.touchReleased;
  }

  isScrollingUp(): boolean {
    return this.wheelDeltaY < 0;
  }

  isScrollingDown(): boolean {
    return this.wheelDeltaY > 0;
  }

  captureWheel(): void {
    this.wheelCaptured = true;
  }
}

class MakkoEngineImpl {
  readonly display: IDisplay;
  readonly input: IInput;
  private readonly displayImpl = new CanvasDisplay();
  private readonly inputImpl = new InputManager();
  private readonly staticAssets = new Map<string, StaticAsset>();

  constructor() {
    this.display = this.displayImpl;
    this.input = this.inputImpl;
  }

  async initEngine(options: EngineInitOptions): Promise<void> {
    this.displayImpl.init(options.canvas, options.width, options.height);
    this.inputImpl.init(this.displayImpl);
    this.preloadStaticAssets();
  }

  private preloadStaticAssets(): void {
    for (const [key, record] of Object.entries(rawStaticAssets)) {
      this.loadOrCreateAsset(key, record);
    }
  }

  private loadOrCreateAsset(key: string, record: ManifestAssetRecord): StaticAsset {
    const existing = this.staticAssets.get(key);
    if (existing) return existing;

    const metaW = record.metadata?.width ?? 64;
    const metaH = record.metadata?.height ?? 64;
    const initialDims = computeSizedDimensions(key, metaW, metaH);

    const img = new Image();
    const asset: StaticAsset = {
      key,
      url: record.url,
      image: img,
      width: initialDims.width,
      height: initialDims.height,
    };

    img.onload = () => {
      const rawW = img.naturalWidth || metaW;
      const rawH = img.naturalHeight || metaH;
      const dims = computeSizedDimensions(key, rawW, rawH);
      asset.width = dims.width;
      asset.height = dims.height;
    };

    img.src = record.url;
    this.staticAssets.set(key, asset);
    return asset;
  }

  staticAsset(key: string): StaticAsset | null {
    const cached = this.staticAssets.get(key);
    if (cached) return cached;
    const record = rawStaticAssets[key];
    if (!record) return null;
    return this.loadOrCreateAsset(key, record);
  }
}

export const MakkoEngine = new MakkoEngineImpl();

