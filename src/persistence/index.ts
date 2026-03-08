import type { StreetConfig } from "../models/street";
import { TEMPLATES } from "../templates";

const LS_KEY = "berlin-street-designer-street";

export function initStreet(): StreetConfig {
  // Try URL param first
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("s");
  if (encoded) {
    try {
      return JSON.parse(atob(encoded)) as StreetConfig;
    } catch {
      // fall through
    }
  }
  // Try localStorage
  const saved = localStorage.getItem(LS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as StreetConfig;
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
