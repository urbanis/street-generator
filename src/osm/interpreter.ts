import type { OsmStreetTags } from "./fetch";

export type SidewalkPresence   = "yes" | "no" | "separate";
export type CyclewayType       = "none" | "lane" | "track" | "shared_lane";
export type ParkingType        = "none" | "lane" | "street_side" | "separate";
export type ParkingOrientation = "parallel" | "diagonal" | "perpendicular";

export interface ParkingFacility {
  type:         ParkingType;
  orientation?: ParkingOrientation;
  fee?:         boolean;
}

export interface InterpretedTags {
  name?:     string;
  highway?:  string;
  width_m?:  number;
  maxspeed?: number;
  surface?:  string;
  lanes: {
    total:                   number;
    forward?:                number;
    backward?:               number;
    oneway:                  boolean;
    bicycleExemptFromOneway: boolean;
  };
  sidewalk: { left: SidewalkPresence; right: SidewalkPresence };
  cycleway: { left: CyclewayType;     right: CyclewayType     };
  parking:  { left: ParkingFacility;  right: ParkingFacility  };
  bicycleRoad: boolean;
}

export function interpretOsmTags(tags: OsmStreetTags): InterpretedTags {
  return {
    name:     tags["name"],
    highway:  tags["highway"],
    width_m:  tags["width"]    ? (parseFloat(tags["width"]!)    || undefined) : undefined,
    maxspeed: tags["maxspeed"] ? (parseInt(tags["maxspeed"]!, 10) || undefined) : undefined,
    surface:  tags["surface"],
    lanes:    interpretLanes(tags),
    sidewalk: interpretSidewalk(tags),
    cycleway: interpretCycleway(tags),
    parking:  interpretParking(tags),
    bicycleRoad: tags["bicycle_road"] === "yes",
  };
}

function interpretLanes(tags: OsmStreetTags): InterpretedTags["lanes"] {
  const total    = Math.max(1, parseInt(tags["lanes"] ?? "2", 10) || 2);
  const forward  = tags["lanes:forward"]  ? parseInt(tags["lanes:forward"]!,  10) : undefined;
  const backward = tags["lanes:backward"] ? parseInt(tags["lanes:backward"]!, 10) : undefined;
  return {
    total,
    forward,
    backward,
    oneway:                  tags["oneway"] === "yes",
    bicycleExemptFromOneway: tags["oneway:bicycle"] === "no",
  };
}

function resolveSide(
  both: string | undefined,
  side: string | undefined,
  explicit: string | undefined,
): SidewalkPresence {
  const val = explicit ?? (both === "yes" || both === "separate" ? both : undefined) ?? side;
  if (val === "yes" || val === "both") return "yes";
  if (val === "separate")              return "separate";
  return "no";
}

function interpretSidewalk(tags: OsmStreetTags): InterpretedTags["sidewalk"] {
  const sw = tags["sidewalk"];
  const swBoth: string | undefined =
    sw === "both"     ? "yes"      :
    sw === "separate" ? "separate" :
    tags["sidewalk:both"];
  const swLeft  = sw === "left"  || sw === "both" ? "yes" : undefined;
  const swRight = sw === "right" || sw === "both" ? "yes" : undefined;
  return {
    left:  resolveSide(swBoth, swLeft,  tags["sidewalk:left"]),
    right: resolveSide(swBoth, swRight, tags["sidewalk:right"]),
  };
}

function resolveCycleway(
  global: string | undefined,
  side:   string | undefined,
  both:   string | undefined,
): CyclewayType {
  const val = side ?? both ?? global;
  if (val === "lane" || val === "opposite_lane") return "lane";
  if (val === "track")                           return "track";
  if (val === "shared_lane")                     return "shared_lane";
  return "none";
}

function interpretCycleway(tags: OsmStreetTags): InterpretedTags["cycleway"] {
  return {
    left:  resolveCycleway(tags["cycleway"], tags["cycleway:left"],  tags["cycleway:both"]),
    right: resolveCycleway(tags["cycleway"], tags["cycleway:right"], tags["cycleway:both"]),
  };
}

function resolveParkingType(val: string | undefined): ParkingType {
  if (val === "lane")        return "lane";
  if (val === "street_side") return "street_side";
  if (val === "separate")    return "separate";
  return "none";
}

function interpretParking(tags: OsmStreetTags): InterpretedTags["parking"] {
  function side(s: "left" | "right"): ParkingFacility {
    const type = resolveParkingType(
      tags[`parking:${s}`] ?? tags["parking:both"]
    );
    const orient = tags[`parking:${s}:orientation`] as ParkingOrientation | undefined;
    const fee    = tags[`parking:${s}:fee`] === "yes" ? true
                 : tags[`parking:${s}:fee`] === "no"  ? false
                 : undefined;
    return { type, ...(orient ? { orientation: orient } : {}), ...(fee !== undefined ? { fee } : {}) };
  }
  return { left: side("left"), right: side("right") };
}
