import React from "react";
import type { ElementType } from "../models/street";
import treeDetailedUrl from "../assets/figures/tree-detailed.svg";
import sidewalkManFrontUrl from "../assets/figures/sidewalk-man-front.svg";
import sidewalkManBackUrl from "../assets/figures/sidewalk-man-back.svg";
import sidewalkManKidBackUrl from "../assets/figures/sidewalk-man-kid-back.svg";
import sidewalkSeniorFrontUrl from "../assets/figures/sidewalk-senior-front.svg";
import parkingLeftUrl from "../assets/figures/parking-left.svg";
import trafficAutoFrontUrl from "../assets/figures/traffic-lane-auto-front.svg";
import trafficAutoBackUrl from "../assets/figures/traffic-lane-auto-back.svg";

export interface FigureRenderProps {
  cx:        number;
  groundY:   number;
  widthPx:   number;
  scale:     number;
  height_m?: number;
}

export interface FigureVariant {
  id:        string;
  label:     { de: string; en: string };
  renderSVG: (props: FigureRenderProps) => React.ReactElement;
}

// ── Registry ─────────────────────────────────────────────────────────────────

const FIGURE_REGISTRY: Partial<Record<ElementType, FigureVariant[]>> = {

  SIDEWALK: [
    {
      id: "pedestrian-front",
      label: { de: "Erwachsener (vorne)", en: "Adult (front)" },
      renderSVG: ({ cx, groundY, scale: s }) => {
        const h = 1.8 * s;
        const w = h * (182.84 / 454.4);
        return <image href={sidewalkManFrontUrl} x={cx - w / 2} y={groundY - h} width={w} height={h} />;
      },
    },
    {
      id: "pedestrian-back",
      label: { de: "Erwachsener (hinten)", en: "Adult (back)" },
      renderSVG: ({ cx, groundY, scale: s }) => {
        const h = 1.8 * s;
        const w = h * (182.84 / 454.4);
        return <image href={sidewalkManBackUrl} x={cx - w / 2} y={groundY - h} width={w} height={h} />;
      },
    },
    {
      id: "pedestrian-senior",
      label: { de: "Senior (vorne)", en: "Senior (front)" },
      renderSVG: ({ cx, groundY, scale: s }) => {
        const h = 1.8 * s;
        const w = h * (182.84 / 454.4);
        return <image href={sidewalkSeniorFrontUrl} x={cx - w / 2} y={groundY - h} width={w} height={h} />;
      },
    },
    {
      id: "pedestrian-kid-back",
      label: { de: "Erwachsener + Kind (hinten)", en: "Adult + child (back)" },
      renderSVG: ({ cx, groundY, scale: s }) => {
        const h = 1.8 * s;
        const w = h * (182.84 / 454.4);
        return <image href={sidewalkManKidBackUrl} x={cx - w / 2} y={groundY - h} width={w} height={h} />;
      },
    },
  ],

  // CYCLE_LANE: no SVG assets yet — variants will appear once files are added

  TRAFFIC_LANE: [
    {
      id: "car-front",
      label: { de: "PKW (Frontalansicht)", en: "Car (front view)" },
      renderSVG: ({ cx, groundY, scale: s }) => {
        const h = 1.5 * s;
        const w = h * (238.5 / 207.35);
        return <image href={trafficAutoFrontUrl} x={cx - w / 2} y={groundY - h} width={w} height={h} />;
      },
    },
    {
      id: "car-back",
      label: { de: "PKW (Rückansicht)", en: "Car (back view)" },
      renderSVG: ({ cx, groundY, scale: s }) => {
        const h = 1.5 * s;
        const w = h * (243.15 / 207.35);
        return <image href={trafficAutoBackUrl} x={cx - w / 2} y={groundY - h} width={w} height={h} />;
      },
    },
  ],

  PARKING_LANE: [
    {
      id: "car-side",
      label: { de: "PKW (Seitenansicht)", en: "Car (side view)" },
      renderSVG: ({ cx, groundY, widthPx, scale: s }) => {
        const carW = Math.min(4.5 * s, widthPx * 0.8);
        const h    = carW * (207.35 / 546.01);
        return <image href={parkingLeftUrl} x={cx - carW / 2} y={groundY - h} width={carW} height={h} />;
      },
    },
  ],

  // BUS_LANE: no SVG assets yet — variants will appear once files are added

  PLANTING_STRIP: [
    {
      id: "tree-detailed",
      label: { de: "Detaillierter Baum", en: "Detailed tree" },
      renderSVG: ({ cx, groundY, scale: s, height_m = 8 }) => {
        const h = height_m * s;
        const w = h * (600.63 / 580.67);
        return <image href={treeDetailedUrl} x={cx - w / 2} y={groundY - h} width={w} height={h} />;
      },
    },
  ],

  MEDIAN: [
    {
      id: "tree-detailed",
      label: { de: "Detaillierter Baum", en: "Detailed tree" },
      renderSVG: ({ cx, groundY, scale: s, height_m = 8 }) => {
        const h = height_m * s;
        const w = h * (600.63 / 580.67);
        return <image href={treeDetailedUrl} x={cx - w / 2} y={groundY - h} width={w} height={h} />;
      },
    },
  ],
};

// ── Public API ────────────────────────────────────────────────────────────────

export function getFigureVariants(type: ElementType): FigureVariant[] | undefined {
  return FIGURE_REGISTRY[type];
}

export function getDefaultFigureVariant(type: ElementType): string | undefined {
  return FIGURE_REGISTRY[type]?.[0]?.id;
}

export function isTreeVariant(variantId: string | undefined): boolean {
  return variantId === "tree-deciduous" || variantId === "tree-conifer" || variantId === "tree-detailed";
}
