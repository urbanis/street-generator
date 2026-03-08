export type ElementType =
  | "SIDEWALK"
  | "CYCLE_LANE"
  | "BUFFER"
  | "PARKING_LANE"
  | "TRAFFIC_LANE"
  | "BUS_LANE"
  | "MEDIAN"
  | "PLANTING_STRIP";

export type Side = "LEFT" | "CENTER" | "RIGHT";

export interface ElementStyle {
  fill: string;
  stroke: string;
}

export interface StreetElement {
  id: string;
  type: ElementType;
  side: Side;
  width_m: number;
  style?: ElementStyle;
}

export interface StreetConfig {
  id: string;
  name: string;
  totalWidth_m?: number;
  elements: StreetElement[];
}
