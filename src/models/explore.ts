import type { InterpretedTags } from "../osm/interpreter";

export type MapLayer = "osm" | "satellite";
export type MapMode  = "none" | "mark-section" | "measure" | "inspect";

export interface InspectResult {
  interpreted: InterpretedTags;
  rawTags:     Record<string, string>;
}
