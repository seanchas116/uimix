import { RectData } from "node-data";
import { Rect } from "paintvec";

export function rectToJSON(rect: Rect): RectData {
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function rectFromJSON(data: RectData): Rect {
  return Rect.from(data);
}

export function roundRectXYWH(rect: Rect): Rect {
  return Rect.from({
    x: Math.round(rect.left),
    y: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  });
}
