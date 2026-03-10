import type { StreetConfig } from "../../models/street";
import { isTreeVariant } from "../../figures/registry";

export interface RenderedElement {
  id:      string;
  x:       number;
  widthPx: number;
}

export interface RenderLayout {
  elements:     RenderedElement[];
  totalWidthPx: number;
  scale:        number;
  skyH:         number; // height of sky zone in px
}

export const BAND_H  = 16; // ground band height px (~0.20 m visual)
export const SKY_MIN = 40; // minimum sky zone height px
export const ANN_H   = 52; // annotation zone height px

const MIN_SCALE        = 20;
const MAX_CANVAS_WIDTH = 900;

export function computeLayout(street: StreetConfig): RenderLayout {
  const totalWidth_m = street.elements.reduce((s, e) => s + e.width_m, 0);
  if (totalWidth_m === 0) {
    return { elements: [], totalWidthPx: 0, scale: MIN_SCALE, skyH: SKY_MIN };
  }

  const scale        = Math.max(MIN_SCALE, Math.min(MAX_CANVAS_WIDTH / totalWidth_m, 60));
  const totalWidthPx = totalWidth_m * scale;

  let x = 0;
  const elements: RenderedElement[] = street.elements.map((el) => {
    const widthPx = el.width_m * scale;
    const result  = { id: el.id, x, widthPx };
    x += widthPx;
    return result;
  });

  // Human-scale figure heights in meters (used for skyH calculation)
  const FIGURE_HEIGHTS_M: Partial<Record<string, number>> = {
    pedestrian:          1.8,
    "pedestrian-child":  1.8,
    "pedestrian-bike":   1.8,
    "cyclist-upright":   2.0,
    "cyclist-racing":    2.0,
    "car-sedan":         1.5,
    "car-van":           2.4,
    "car-parallel":      1.5,
    "car-perpendicular": 1.5,
    bus:                 3.2,
  };

  const skyH = street.elements.reduce((max, el) => {
    // Buildings
    if (
      (el.type === "BUILDING_LEFT" || el.type === "BUILDING_RIGHT") &&
      el.building && el.building.floors.length > 0
    ) {
      return Math.max(max, el.building.floors.length * 3 * scale);
    }
    // Figures
    if (el.figure?.show) {
      const variantId = el.figure.variant;
      // Trees: use height_m directly
      if (isTreeVariant(variantId)) {
        const h = (el.figure.height_m ?? 8) * scale;
        return Math.max(max, h + 8); // +8px breathing room
      }
      // Human-scale and vehicles
      const h = FIGURE_HEIGHTS_M[variantId];
      if (h) return Math.max(max, h * scale + 8);
    }
    return max;
  }, SKY_MIN);

  return { elements, totalWidthPx, scale, skyH };
}
