import type { StreetConfig, StreetElement } from "../models/street";
import { TEMPLATES } from "../templates";

const LS_KEY = "berlin-street-designer-street";

const VALID_ELEMENT_TYPES = new Set<string>([
  "SIDEWALK","CYCLE_LANE","CYCLE_LANE_ROAD","BUFFER","PARKING_LANE",
  "TRAFFIC_LANE","BUS_LANE","MEDIAN","PLANTING_STRIP","BUILDING_LEFT","BUILDING_RIGHT",
]);

/** Sanitize a parsed-but-unvalidated StreetConfig before it enters the app. */
export function sanitizeStreet(raw: unknown): StreetConfig {
  if (!raw || typeof raw !== "object") throw new Error("Not an object");
  const obj = raw as Record<string, unknown>;
  const elements: StreetElement[] = Array.isArray(obj.elements)
    ? (obj.elements as unknown[])
        .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
        .filter((e) => VALID_ELEMENT_TYPES.has(e.type as string))
        .map((e) => ({
          ...(e as unknown as StreetElement),
          width_m: typeof e.width_m === "number" ? Math.min(Math.max(e.width_m, 0.1), 30) : 3,
        }))
    : [];
  return {
    id:       typeof obj.id === "string" ? obj.id : crypto.randomUUID(),
    name:     typeof obj.name === "string" ? obj.name.slice(0, 80) : "Imported street",
    subtitle: typeof obj.subtitle === "string" ? obj.subtitle.slice(0, 120) : undefined,
    elements,
  } as StreetConfig;
}

export function initStreet(): StreetConfig {
  // Try URL param first
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("s");
  if (encoded) {
    try {
      return sanitizeStreet(JSON.parse(atob(encoded)));
    } catch {
      // fall through
    }
  }
  // Try localStorage
  const saved = localStorage.getItem(LS_KEY);
  if (saved) {
    try {
      return sanitizeStreet(JSON.parse(saved));
    } catch {
      // fall through
    }
  }
  // Default template
  const empty = TEMPLATES[0].config;
  return { ...empty, id: crypto.randomUUID(), elements: [] };
}

export function saveToLocalStorage(street: StreetConfig): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(street));
  } catch {
    // Quota exceeded — ignore
  }
}

export function encodeStreetToUrl(street: StreetConfig): string {
  const encoded = btoa(JSON.stringify(street));
  const url = new URL(window.location.href);
  url.searchParams.set("s", encoded);
  return url.toString();
}
