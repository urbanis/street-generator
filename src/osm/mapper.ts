import type { StreetConfig } from "../models/street";
import type { OsmStreetTags } from "./fetch";

export function osmTagsToStreetConfig(tags: OsmStreetTags): StreetConfig {
  const elements: StreetConfig["elements"] = [];
  const lanes = parseInt(tags["lanes"] ?? "2", 10);
  const laneWidth = 3.25;

  // Sidewalk left
  if (
    tags["sidewalk"] === "both" ||
    tags["sidewalk"] === "left" ||
    tags["sidewalk:left"] === "yes"
  ) {
    elements.push({ id: crypto.randomUUID(), type: "SIDEWALK", side: "LEFT", width_m: 2.5 });
  }

  // Cycle lane left
  if (tags["cycleway"] === "lane" || tags["cycleway:left"] === "lane") {
    elements.push({ id: crypto.randomUUID(), type: "CYCLE_LANE", side: "LEFT", width_m: 2.0 });
    elements.push({ id: crypto.randomUUID(), type: "BUFFER", side: "LEFT", width_m: 0.75 });
  }

  // Traffic lanes (split evenly left/right)
  const leftLanes = Math.floor(lanes / 2);
  const rightLanes = lanes - leftLanes;
  for (let i = 0; i < leftLanes; i++) {
    elements.push({ id: crypto.randomUUID(), type: "TRAFFIC_LANE", side: "LEFT", width_m: laneWidth });
  }
  for (let i = 0; i < rightLanes; i++) {
    elements.push({ id: crypto.randomUUID(), type: "TRAFFIC_LANE", side: "RIGHT", width_m: laneWidth });
  }

  // Cycle lane right
  if (tags["cycleway"] === "lane" || tags["cycleway:right"] === "lane") {
    elements.push({ id: crypto.randomUUID(), type: "BUFFER", side: "RIGHT", width_m: 0.75 });
    elements.push({ id: crypto.randomUUID(), type: "CYCLE_LANE", side: "RIGHT", width_m: 2.0 });
  }

  // Sidewalk right
  if (
    tags["sidewalk"] === "both" ||
    tags["sidewalk"] === "right" ||
    tags["sidewalk:right"] === "yes"
  ) {
    elements.push({ id: crypto.randomUUID(), type: "SIDEWALK", side: "RIGHT", width_m: 2.5 });
  }

  const name = tags["name"] ?? tags["addr:street"] ?? "OSM Street";

  return {
    id: crypto.randomUUID(),
    name,
    elements,
  };
}
