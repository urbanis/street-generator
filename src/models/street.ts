export type ElementType =
  | "SIDEWALK"
  | "CYCLE_LANE"
  | "CYCLE_LANE_ROAD"
  | "BUFFER"
  | "PARKING_LANE"
  | "TRAFFIC_LANE"
  | "BUS_LANE"
  | "MEDIAN"
  | "PLANTING_STRIP"
  | "BUILDING_LEFT"
  | "BUILDING_RIGHT";

export type Side = "LEFT" | "CENTER" | "RIGHT";

export interface ElementStyle {
  fill: string;
  stroke: string;
}

export type FloorUse = "Wohnen" | "Gewerbe" | "Gemischt" | "Öffentlich";

export interface BuildingFloor {
  use:      FloorUse;
  height_m: number; // always 3 for now
}

export interface BuildingData {
  floors: BuildingFloor[];
}

export interface FigureConfig {
  show:      boolean;  // default off
  variant:   string;   // key into figure registry for this element type
  height_m?: number;   // only for tree variants
}

export interface StreetElement {
  id:       string;
  type:     ElementType;
  side:     Side;
  width_m:  number;
  label?:   string;          // custom display label; falls back to element type label if absent
  style?:   ElementStyle;
  building?: BuildingData; // only present when type === "BUILDING_LEFT" | "BUILDING_RIGHT"
  figure?:  FigureConfig;   // ← add this
}

export interface StreetConfig {
  id:           string;
  name:         string;
  totalWidth_m?: number;
  elements:     StreetElement[];
}
