import {
  Footprints,
  Bike,
  Minus,
  ParkingSquare,
  Car,
  Bus,
  AlignCenter,
  Flower2,
  Building2,
} from "lucide-react";
import type { ElementDef } from "./types";
import type { ElementType } from "../models/street";

const REGISTRY: ElementDef[] = [
  {
    type: "SIDEWALK",
    label: { de: "Gehweg", en: "Sidewalk" },
    defaultWidth_m: 2.5,
    defaultStyle: { fill: "#f5f0e8", stroke: "#c8b89a" },
    icon: Footprints,
    renderSVG: ({ x, widthPx, heightPx, style }) => (
      <rect x={x} y={0} width={widthPx} height={heightPx}
        fill={style.fill} stroke={style.stroke} strokeWidth={1} />
    ),
  },
  {
    type: "CYCLE_LANE",
    label: { de: "Radweg", en: "Cycle lane" },
    defaultWidth_m: 2.0,
    defaultStyle: { fill: "#bbf7d0", stroke: "#16a34a" },
    icon: Bike,
    renderSVG: ({ x, widthPx, heightPx, style }) => (
      <rect x={x} y={0} width={widthPx} height={heightPx}
        fill={style.fill} stroke={style.stroke} strokeWidth={1} />
    ),
  },
  {
    type: "CYCLE_LANE_ROAD",
    label: { de: "Radfahrstreifen", en: "Cycle lane (road)" },
    defaultWidth_m: 1.5,
    defaultStyle: { fill: "#bbf7d0", stroke: "#16a34a" },
    icon: Bike,
    renderSVG: ({ x, widthPx, heightPx, style }) => (
      <rect x={x} y={0} width={widthPx} height={heightPx}
        fill={style.fill} stroke={style.stroke} strokeWidth={1} />
    ),
  },
  {
    type: "BUFFER",
    label: { de: "Puffer", en: "Buffer" },
    defaultWidth_m: 0.75,
    defaultStyle: { fill: "#fef9c3", stroke: "#ca8a04" },
    icon: Minus,
    renderSVG: ({ x, widthPx, heightPx, style }) => (
      <g>
        <rect x={x} y={0} width={widthPx} height={heightPx}
          fill={style.fill} stroke={style.stroke} strokeWidth={1} />
        <clipPath id={`buf-clip-${x}`}>
          <rect x={x} y={0} width={widthPx} height={heightPx} />
        </clipPath>
        <g clipPath={`url(#buf-clip-${x})`} opacity={0.4}>
          {Array.from({ length: Math.ceil((widthPx + heightPx) / 8) }, (_, i) => {
            const offset = i * 8 - heightPx;
            return (
              <line key={i} x1={x + offset} y1={heightPx}
                x2={x + offset + heightPx} y2={0}
                stroke={style.stroke} strokeWidth={1} />
            );
          })}
        </g>
      </g>
    ),
  },
  {
    type: "PARKING_LANE",
    label: { de: "Parkstreifen", en: "Parking lane" },
    defaultWidth_m: 2.5,
    defaultStyle: { fill: "#e0e7ff", stroke: "#6366f1" },
    icon: ParkingSquare,
    renderSVG: ({ x, widthPx, heightPx, style }) => (
      <rect x={x} y={0} width={widthPx} height={heightPx}
        fill={style.fill} stroke={style.stroke} strokeWidth={1} />
    ),
  },
  {
    type: "TRAFFIC_LANE",
    label: { de: "Fahrstreifen", en: "Traffic lane" },
    defaultWidth_m: 3.25,
    defaultStyle: { fill: "#d1d5db", stroke: "#6b7280" },
    icon: Car,
    renderSVG: ({ x, widthPx, heightPx, style }) => (
      <rect x={x} y={0} width={widthPx} height={heightPx}
        fill={style.fill} stroke={style.stroke} strokeWidth={1} />
    ),
  },
  {
    type: "BUS_LANE",
    label: { de: "Busspur", en: "Bus lane" },
    defaultWidth_m: 3.5,
    defaultStyle: { fill: "#fde68a", stroke: "#d97706" },
    icon: Bus,
    renderSVG: ({ x, widthPx, heightPx, style }) => (
      <rect x={x} y={0} width={widthPx} height={heightPx}
        fill={style.fill} stroke={style.stroke} strokeWidth={1} />
    ),
  },
  {
    type: "MEDIAN",
    label: { de: "Mittelstreifen", en: "Median" },
    defaultWidth_m: 1.5,
    defaultStyle: { fill: "#d1fae5", stroke: "#059669" },
    icon: AlignCenter,
    renderSVG: ({ x, widthPx, heightPx, style }) => (
      <rect x={x} y={0} width={widthPx} height={heightPx}
        fill={style.fill} stroke={style.stroke} strokeWidth={1} />
    ),
  },
  {
    type: "PLANTING_STRIP",
    label: { de: "Grünstreifen", en: "Planting strip" },
    defaultWidth_m: 1.5,
    defaultStyle: { fill: "#86efac", stroke: "#15803d" },
    icon: Flower2,
    renderSVG: ({ x, widthPx, heightPx, style }) => (
      <rect x={x} y={0} width={widthPx} height={heightPx}
        fill={style.fill} stroke={style.stroke} strokeWidth={1} />
    ),
  },
  {
    type: "BUILDING_LEFT",
    label: { de: "Gebäude links", en: "Building left" },
    defaultWidth_m: 6,
    defaultStyle: { fill: "#e5e7eb", stroke: "#6b7280" },
    icon: Building2,
    renderSVG: ({ x, widthPx, heightPx, style }) => (
      <rect x={x} y={0} width={widthPx} height={heightPx}
        fill={style.fill} stroke={style.stroke} strokeWidth={1} />
    ),
  },
  {
    type: "BUILDING_RIGHT",
    label: { de: "Gebäude rechts", en: "Building right" },
    defaultWidth_m: 6,
    defaultStyle: { fill: "#e5e7eb", stroke: "#6b7280" },
    icon: Building2,
    renderSVG: ({ x, widthPx, heightPx, style }) => (
      <rect x={x} y={0} width={widthPx} height={heightPx}
        fill={style.fill} stroke={style.stroke} strokeWidth={1} />
    ),
  },
];

const REGISTRY_MAP = new Map<ElementType, ElementDef>(
  REGISTRY.map((d) => [d.type, d])
);

export function getElementDef(type: ElementType): ElementDef {
  const def = REGISTRY_MAP.get(type);
  if (!def) throw new Error(`Unknown element type: ${type}`);
  return def;
}

export { REGISTRY };
