import type { StreetConfig } from "../models/street";

export interface TemplateOption {
  id: string;
  label: { de: string; en: string };
  config: StreetConfig;
}

const THREE_FLOORS = { floors: [
  { use: "Wohnen" as const, height_m: 3 },
  { use: "Wohnen" as const, height_m: 3 },
  { use: "Wohnen" as const, height_m: 3 },
] };

function makeStreet(
  name: string,
  elements: StreetConfig["elements"]
): StreetConfig {
  return { id: crypto.randomUUID(), name, elements };
}

export const TEMPLATES: TemplateOption[] = [
  {
    id: "empty",
    label: { de: "Neue leere Straße", en: "New empty street" },
    config: makeStreet("Neue Straße", []),
  },
  {
    id: "residential",
    label: { de: "Wohnstraße", en: "Residential street" },
    config: makeStreet("Wohnstraße", [
      { id: crypto.randomUUID(), type: "BUILDING_LEFT",  side: "LEFT",   width_m: 12, building: THREE_FLOORS },
      { id: crypto.randomUUID(), type: "SIDEWALK",       side: "LEFT",   width_m: 3.0 },
      { id: crypto.randomUUID(), type: "PLANTING_STRIP", side: "LEFT",   width_m: 1.5 },
      { id: crypto.randomUUID(), type: "TRAFFIC_LANE",   side: "LEFT",   width_m: 3.25 },
      { id: crypto.randomUUID(), type: "TRAFFIC_LANE",   side: "RIGHT",  width_m: 3.25 },
      { id: crypto.randomUUID(), type: "PLANTING_STRIP", side: "RIGHT",  width_m: 1.5 },
      { id: crypto.randomUUID(), type: "SIDEWALK",       side: "RIGHT",  width_m: 3.0 },
      { id: crypto.randomUUID(), type: "BUILDING_RIGHT", side: "RIGHT",  width_m: 12, building: THREE_FLOORS },
    ]),
  },
  {
    id: "mainroad",
    label: { de: "Hauptstraße", en: "Main road" },
    config: makeStreet("Hauptstraße", [
      { id: crypto.randomUUID(), type: "BUILDING_LEFT",  side: "LEFT",   width_m: 12, building: THREE_FLOORS },
      { id: crypto.randomUUID(), type: "SIDEWALK",       side: "LEFT",   width_m: 4.0 },
      { id: crypto.randomUUID(), type: "CYCLE_LANE",     side: "LEFT",   width_m: 2.0 },
      { id: crypto.randomUUID(), type: "BUFFER",         side: "LEFT",   width_m: 0.75 },
      { id: crypto.randomUUID(), type: "PARKING_LANE",   side: "LEFT",   width_m: 2.0 },
      { id: crypto.randomUUID(), type: "TRAFFIC_LANE",   side: "LEFT",   width_m: 3.25 },
      { id: crypto.randomUUID(), type: "TRAFFIC_LANE",   side: "LEFT",   width_m: 3.25 },
      { id: crypto.randomUUID(), type: "MEDIAN",         side: "CENTER", width_m: 2.0 },
      { id: crypto.randomUUID(), type: "TRAFFIC_LANE",   side: "RIGHT",  width_m: 3.25 },
      { id: crypto.randomUUID(), type: "TRAFFIC_LANE",   side: "RIGHT",  width_m: 3.25 },
      { id: crypto.randomUUID(), type: "PARKING_LANE",   side: "RIGHT",  width_m: 2.0 },
      { id: crypto.randomUUID(), type: "BUFFER",         side: "RIGHT",  width_m: 0.75 },
      { id: crypto.randomUUID(), type: "CYCLE_LANE",     side: "RIGHT",  width_m: 2.0 },
      { id: crypto.randomUUID(), type: "SIDEWALK",       side: "RIGHT",  width_m: 4.0 },
      { id: crypto.randomUUID(), type: "BUILDING_RIGHT", side: "RIGHT",  width_m: 12, building: THREE_FLOORS },
    ]),
  },
];
