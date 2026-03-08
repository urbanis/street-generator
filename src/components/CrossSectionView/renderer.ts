import type { StreetConfig } from "../../models/street";

export interface RenderedElement {
  id: string;
  x: number;
  widthPx: number;
}

export interface RenderLayout {
  elements: RenderedElement[];
  totalWidthPx: number;
  heightPx: number;
  scale: number; // px per meter
}

const HEIGHT_PX = 72;
const MIN_SCALE = 20; // px/m
const MAX_CANVAS_WIDTH = 900;

export function computeLayout(street: StreetConfig): RenderLayout {
  const totalWidth_m = street.elements.reduce((s, e) => s + e.width_m, 0);
  if (totalWidth_m === 0) return { elements: [], totalWidthPx: 0, heightPx: HEIGHT_PX, scale: MIN_SCALE };

  const scale = Math.max(MIN_SCALE, Math.min(MAX_CANVAS_WIDTH / totalWidth_m, 60));
  const totalWidthPx = totalWidth_m * scale;

  let x = 0;
  const elements: RenderedElement[] = street.elements.map((el) => {
    const widthPx = el.width_m * scale;
    const result = { id: el.id, x, widthPx };
    x += widthPx;
    return result;
  });

  return { elements, totalWidthPx, heightPx: HEIGHT_PX, scale };
}
