import type { StreetConfig } from "../../models/street";

export interface RenderedElement {
  id:       string;
  x:        number;
  widthPx:  number;
  heightPx: number; // street elements: HEIGHT_PX; buildings: floors*3*scale
}

export interface RenderLayout {
  elements:      RenderedElement[];
  totalWidthPx:  number;
  heightPx:      number; // max height across all elements (for SVG canvas)
  scale:         number; // px per meter
}

const HEIGHT_PX        = 72;
const MIN_SCALE        = 20;
const MAX_CANVAS_WIDTH = 900;

export function computeLayout(street: StreetConfig): RenderLayout {
  const totalWidth_m = street.elements.reduce((s, e) => s + e.width_m, 0);
  if (totalWidth_m === 0) {
    return { elements: [], totalWidthPx: 0, heightPx: HEIGHT_PX, scale: MIN_SCALE };
  }

  const scale = Math.max(MIN_SCALE, Math.min(MAX_CANVAS_WIDTH / totalWidth_m, 60));
  const totalWidthPx = totalWidth_m * scale;

  let x = 0;
  const elements: RenderedElement[] = street.elements.map((el) => {
    const widthPx = el.width_m * scale;
    let heightPx = HEIGHT_PX;
    if (
      (el.type === "BUILDING_LEFT" || el.type === "BUILDING_RIGHT") &&
      el.building && el.building.floors.length > 0
    ) {
      heightPx = el.building.floors.length * 3 * scale;
    }
    const result = { id: el.id, x, widthPx, heightPx };
    x += widthPx;
    return result;
  });

  const heightPx = Math.max(HEIGHT_PX, ...elements.map((e) => e.heightPx));
  return { elements, totalWidthPx, heightPx, scale };
}
