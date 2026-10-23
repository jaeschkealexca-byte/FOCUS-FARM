import type { IDisplay } from '@makko/engine';

type DrawStyle = Parameters<IDisplay['drawRect']>[4];
type TextStyle = Parameters<IDisplay['drawText']>[3];
type ImageStyle = Parameters<IDisplay['drawImage']>[5];

/** Creates a drawing surface that zooms farm artwork around the farm center. */
export function createFarmZoomDisplay(display: IDisplay, zoom: number, centerX: number, centerY: number): IDisplay {
  const projectX = (x: number): number => centerX + (x - centerX) * zoom;
  const projectY = (y: number): number => centerY + (y - centerY) * zoom;
  const scaleStyle = (style?: DrawStyle): DrawStyle | undefined =>
    style?.lineWidth === undefined ? style : { ...style, lineWidth: style.lineWidth * zoom };

  return new Proxy(display, {
    get(target, property, receiver): unknown {
      switch (property) {
        case 'drawRect':
          return (x: number, y: number, width: number, height: number, style?: DrawStyle): void =>
            target.drawRect(projectX(x), projectY(y), width * zoom, height * zoom, scaleStyle(style));
        case 'drawRoundRect':
          return (x: number, y: number, width: number, height: number, radius: number, style?: DrawStyle): void =>
            target.drawRoundRect(projectX(x), projectY(y), width * zoom, height * zoom, radius * zoom, scaleStyle(style));
        case 'drawCircle':
          return (x: number, y: number, radius: number, style?: DrawStyle): void =>
            target.drawCircle(projectX(x), projectY(y), radius * zoom, scaleStyle(style));
        case 'drawEllipse':
          return (x: number, y: number, radiusX: number, radiusY: number, style?: DrawStyle): void =>
            target.drawEllipse(projectX(x), projectY(y), radiusX * zoom, radiusY * zoom, scaleStyle(style));
        case 'drawLine':
          return (x1: number, y1: number, x2: number, y2: number, style?: DrawStyle): void =>
            target.drawLine(projectX(x1), projectY(y1), projectX(x2), projectY(y2), scaleStyle(style));
        case 'drawPolygon':
          return (points: Array<{ x: number; y: number }>, style?: DrawStyle): void =>
            target.drawPolygon(points.map(point => ({ x: projectX(point.x), y: projectY(point.y) })), scaleStyle(style));
        case 'drawText':
          return (text: string, x: number, y: number, style?: TextStyle): void => {
            const font = style?.font?.replace(/(\d+(?:\.\d+)?)px/, (_match, size: string) => `${Number(size) * zoom}px`);
            target.drawText(text, projectX(x), projectY(y), style ? { ...style, ...(font ? { font } : {}) } : undefined);
          };
        case 'drawImage':
          return (image: HTMLImageElement, x: number, y: number, width?: number, height?: number, style?: ImageStyle): void =>
            target.drawImage(
              image,
              projectX(x),
              projectY(y),
              width === undefined ? undefined : width * zoom,
              height === undefined ? undefined : height * zoom,
              style,
            );
        default: {
          const value: unknown = Reflect.get(target, property, receiver);
          return typeof value === 'function' ? value.bind(target) : value;
        }
      }
    },
  });
}
