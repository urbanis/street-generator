export type MapLayer = "osm" | "satellite";
export type MapMode  = "none" | "mark-section" | "measure" | "inspect";

export interface InspectResult {
  summary: {
    name?:     string;
    lanes?:    number;
    maxspeed?: string;
    surface?:  string;
  };
  rawTags: Record<string, string>;
}
