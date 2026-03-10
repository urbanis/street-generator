import type { StreetConfig } from "../models/street";
import type { OsmStreetTags } from "./fetch";
import { interpretOsmTags } from "./interpreter";
import type { InterpretedTags, CyclewayType } from "./interpreter";

export function osmTagsToStreetConfig(tags: OsmStreetTags): StreetConfig {
  const interp = interpretOsmTags(tags);
  const name   = tags["name"] ?? tags["addr:street"] ?? "OSM Street";
  return interpretedToStreetConfig(interp, name);
}

function interpretedToStreetConfig(interp: InterpretedTags, name: string): StreetConfig {
  const elements: StreetConfig["elements"] = [];

  // Lane width: use measured road width divided by lanes if available, else 3.25m
  const laneWidth = interp.width_m && interp.lanes.total > 0
    ? Math.max(2.5, interp.width_m / interp.lanes.total)
    : 3.25;

  // Determine lane distribution
  const total    = interp.lanes.total;
  const oneway   = interp.lanes.oneway;
  const forward  = interp.lanes.forward  ?? (oneway ? total : Math.ceil(total / 2));
  const backward = interp.lanes.backward ?? (oneway ? 0     : Math.floor(total / 2));

  // ── LEFT side (outermost → innermost) ──────────────────────────

  // Sidewalk left
  if (interp.sidewalk.left !== "no") {
    elements.push({ id: crypto.randomUUID(), type: "SIDEWALK", side: "LEFT", width_m: 2.5 });
  }

  // Cycleway left
  pushCycleway(elements, "LEFT", interp.cycleway.left, interp.bicycleRoad);

  // Parking left
  if (interp.parking.left.type === "lane" || interp.parking.left.type === "street_side") {
    elements.push({ id: crypto.randomUUID(), type: "PARKING_LANE", side: "LEFT", width_m: 2.0 });
  }

  // Traffic lanes left (backward direction)
  if (interp.bicycleRoad) {
    // Bicycle road: use CYCLE_LANE instead of TRAFFIC_LANE
    for (let i = 0; i < backward; i++) {
      elements.push({ id: crypto.randomUUID(), type: "CYCLE_LANE", side: "LEFT", width_m: laneWidth });
    }
  } else {
    for (let i = 0; i < backward; i++) {
      elements.push({ id: crypto.randomUUID(), type: "TRAFFIC_LANE", side: "LEFT", width_m: laneWidth });
    }
  }

  // ── RIGHT side (innermost → outermost) ─────────────────────────

  // Traffic lanes right (forward direction)
  if (interp.bicycleRoad) {
    for (let i = 0; i < forward; i++) {
      elements.push({ id: crypto.randomUUID(), type: "CYCLE_LANE", side: "RIGHT", width_m: laneWidth });
    }
  } else {
    for (let i = 0; i < forward; i++) {
      elements.push({ id: crypto.randomUUID(), type: "TRAFFIC_LANE", side: "RIGHT", width_m: laneWidth });
    }
  }

  // Parking right
  if (interp.parking.right.type === "lane" || interp.parking.right.type === "street_side") {
    elements.push({ id: crypto.randomUUID(), type: "PARKING_LANE", side: "RIGHT", width_m: 2.0 });
  }

  // Cycleway right
  pushCycleway(elements, "RIGHT", interp.cycleway.right, interp.bicycleRoad);

  // Sidewalk right
  if (interp.sidewalk.right !== "no") {
    elements.push({ id: crypto.randomUUID(), type: "SIDEWALK", side: "RIGHT", width_m: 2.5 });
  }

  return { id: crypto.randomUUID(), name, elements };
}

function pushCycleway(
  elements: StreetConfig["elements"],
  side: "LEFT" | "RIGHT",
  type: CyclewayType,
  bicycleRoad: boolean,
): void {
  if (bicycleRoad) return; // bicycle road: whole road is cycle space, no separate lane
  if (type === "none") return;

  const cycleWidth = type === "track" ? 2.5 : 2.0;

  if (side === "LEFT") {
    elements.push({ id: crypto.randomUUID(), type: "CYCLE_LANE", side: "LEFT",  width_m: cycleWidth });
    elements.push({ id: crypto.randomUUID(), type: "BUFFER",      side: "LEFT",  width_m: 0.75 });
  } else {
    elements.push({ id: crypto.randomUUID(), type: "BUFFER",      side: "RIGHT", width_m: 0.75 });
    elements.push({ id: crypto.randomUUID(), type: "CYCLE_LANE",  side: "RIGHT", width_m: cycleWidth });
  }
}
