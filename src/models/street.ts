export type ElementType =
  | "SIDEWALK"
  | "CYCLE_LANE"
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

export interface StreetElement {
  id:       string;
  type:     ElementType;
  side:     Side;
  width_m:  number;
  label?:   string;          // custom display label; falls back to element type label if absent
  style?:   ElementStyle;
  building?: BuildingData; // only present when type === "BUILDING_LEFT" | "BUILDING_RIGHT"
}

export interface StreetConfig {
  id:           string;
  name:         string;
  totalWidth_m?: number;
  elements:     StreetElement[];
}
