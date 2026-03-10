import React from "react";
import type { ElementType } from "../models/street";

export interface FigureRenderProps {
  cx:        number;   // center x of element in SVG coords
  groundY:   number;   // y of ground line
  widthPx:   number;   // element width in px
  scale:     number;   // px per meter
  height_m?: number;   // tree height (trees only)
}

export interface FigureVariant {
  id:        string;
  label:     { de: string; en: string };
  renderSVG: (props: FigureRenderProps) => React.ReactElement;
}

// Shared SVG stroke style — line art, no fill
const S = {
  fill: "none",
  stroke: "#1a1a1a",
  strokeWidth: 1,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function stickFigure(cx: number, groundY: number, s: number, totalH: number): React.ReactElement {
  const headR  = 0.12 * s;
  const headY  = groundY - (totalH - 0.12) * s;
  const torsoB = groundY - 0.61 * totalH * s;
  const armY   = groundY - 0.77 * totalH * s;
  const armSpan = 0.22 * s;
  return (
    <g>
      <circle cx={cx} cy={headY} r={headR} {...S} />
      <line x1={cx} y1={headY + headR} x2={cx} y2={torsoB} {...S} />
      <line x1={cx - armSpan} y1={armY} x2={cx + armSpan} y2={armY} {...S} />
      <line x1={cx} y1={torsoB} x2={cx - 0.12 * s} y2={groundY} {...S} />
      <line x1={cx} y1={torsoB} x2={cx + 0.12 * s} y2={groundY} {...S} />
    </g>
  );
}

function bicycleFrame(cx: number, groundY: number, s: number): React.ReactElement {
  const wR  = 0.33 * s;
  const lWx = cx - 0.5 * s;
  const rWx = cx + 0.5 * s;
  const wY  = groundY - wR;
  const bbX = cx - 0.05 * s, bbY = wY;
  const sX  = cx - 0.32 * s, sY  = groundY - 0.98 * s;
  const htX = cx + 0.32 * s, htY = groundY - 0.9 * s;
  return (
    <g>
      <circle cx={lWx} cy={wY} r={wR} {...S} />
      <circle cx={rWx} cy={wY} r={wR} {...S} />
      <line x1={bbX} y1={bbY} x2={lWx} y2={wY} {...S} />
      <line x1={bbX} y1={bbY} x2={sX} y2={sY} {...S} />
      <line x1={sX} y1={sY} x2={htX} y2={htY} {...S} />
      <line x1={bbX} y1={bbY} x2={htX} y2={htY} {...S} />
      <line x1={htX} y1={htY} x2={rWx} y2={wY} {...S} />
      <line x1={sX - 0.1 * s} y1={sY} x2={sX + 0.1 * s} y2={sY} {...S} />
      <line x1={htX - 0.08 * s} y1={htY - 0.18 * s} x2={htX + 0.08 * s} y2={htY - 0.18 * s} {...S} />
      <line x1={htX} y1={htY} x2={htX} y2={htY - 0.18 * s} {...S} />
    </g>
  );
}

function deciduousTree(cx: number, groundY: number, widthPx: number, s: number, height_m: number): React.ReactElement {
  const trunkH    = height_m * 0.35 * s;
  const trunkW    = Math.max(4, 0.08 * s);
  const canopyR   = Math.min(height_m * 0.38 * s, widthPx * 0.42);
  const trunkTopY = groundY - trunkH;
  const canopyCy  = trunkTopY - canopyR * 0.6;
  return (
    <g>
      <rect x={cx - trunkW / 2} y={trunkTopY} width={trunkW} height={trunkH} rx={trunkW / 4} {...S} />
      <circle cx={cx} cy={canopyCy} r={canopyR} {...S} />
    </g>
  );
}

function coniferTree(cx: number, groundY: number, widthPx: number, s: number, height_m: number): React.ReactElement {
  const trunkH   = height_m * 0.15 * s;
  const trunkW   = Math.max(4, 0.06 * s);
  const treeH    = height_m * s;
  const halfBase = Math.min(treeH * 0.38, widthPx * 0.4);
  const tipY     = groundY - treeH;
  const baseY    = groundY - trunkH;
  return (
    <g>
      <rect x={cx - trunkW / 2} y={groundY - trunkH} width={trunkW} height={trunkH} rx={trunkW / 4} {...S} />
      <polygon points={`${cx},${tipY} ${cx - halfBase},${baseY} ${cx + halfBase},${baseY}`} {...S} />
    </g>
  );
}

// ── Figure variants by element type ──────────────────────────────────────────

const FIGURE_REGISTRY: Partial<Record<ElementType, FigureVariant[]>> = {

  SIDEWALK: [
    {
      id: "pedestrian",
      label: { de: "Erwachsener", en: "Adult" },
      renderSVG: ({ cx, groundY, scale: s }) => (
        <g>{stickFigure(cx, groundY, s, 1.8)}</g>
      ),
    },
    {
      id: "pedestrian-child",
      label: { de: "Erwachsener + Kind", en: "Adult + child" },
      renderSVG: ({ cx, groundY, scale: s }) => (
        <g>
          {stickFigure(cx + 0.25 * s, groundY, s, 1.8)}
          {stickFigure(cx - 0.3 * s, groundY, s, 1.1)}
        </g>
      ),
    },
    {
      id: "pedestrian-bike",
      label: { de: "Erwachsener mit Fahrrad", en: "Adult walking bike" },
      renderSVG: ({ cx, groundY, scale: s }) => {
        const personX = cx - 0.6 * s;
        const bikeX   = cx + 0.15 * s;
        const wR      = 0.33 * s;
        const lWx     = bikeX - 0.45 * s;
        const rWx     = bikeX + 0.45 * s;
        const wY      = groundY - wR;
        const handleY = groundY - 1.0 * s;
        const armY    = groundY - 0.77 * 1.8 * s;
        return (
          <g>
            {stickFigure(personX, groundY, s, 1.8)}
            <line x1={personX + 0.22 * s} y1={armY} x2={bikeX + 0.45 * s} y2={handleY} {...S} />
            <circle cx={lWx} cy={wY} r={wR} {...S} />
            <circle cx={rWx} cy={wY} r={wR} {...S} />
            <line x1={lWx} y1={wY} x2={bikeX} y2={wY - 0.3 * s} {...S} />
            <line x1={rWx} y1={wY} x2={bikeX} y2={wY - 0.3 * s} {...S} />
            <line x1={bikeX} y1={wY - 0.3 * s} x2={bikeX} y2={handleY} {...S} />
            <line x1={bikeX - 0.1 * s} y1={handleY} x2={bikeX + 0.1 * s} y2={handleY} {...S} />
          </g>
        );
      },
    },
  ],

  CYCLE_LANE: [
    {
      id: "cyclist-upright",
      label: { de: "Stadtrad (aufrecht)", en: "City bike (upright)" },
      renderSVG: ({ cx, groundY, scale: s }) => {
        const sX  = cx - 0.32 * s;
        const sY  = groundY - 0.98 * s;
        const htX = cx + 0.32 * s;
        const htY = groundY - 0.9 * s;
        const riderX   = sX + 0.05 * s;
        const headR    = 0.12 * s;
        const headY    = sY - 0.82 * s;
        const torsoTop = headY + headR;
        const elbowY   = (torsoTop + htY - 0.18 * s) / 2;
        return (
          <g>
            {bicycleFrame(cx, groundY, s)}
            <circle cx={riderX} cy={headY} r={headR} {...S} />
            <line x1={riderX} y1={torsoTop} x2={riderX} y2={sY} {...S} />
            <line x1={riderX} y1={elbowY} x2={htX} y2={htY - 0.18 * s} {...S} />
            <line x1={riderX} y1={sY} x2={cx - 0.05 * s} y2={groundY - 0.33 * s} {...S} />
          </g>
        );
      },
    },
    {
      id: "cyclist-racing",
      label: { de: "Rennrad (vorgebeugt)", en: "Racing bike (leaning)" },
      renderSVG: ({ cx, groundY, scale: s }) => {
        const sX  = cx - 0.32 * s;
        const sY  = groundY - 0.98 * s;
        const htX = cx + 0.32 * s;
        const htY = groundY - 0.9 * s;
        const hbY = htY - 0.18 * s;
        const riderHeadX = cx + 0.1 * s;
        const riderHeadY = sY - 0.52 * s;
        const headR = 0.12 * s;
        return (
          <g>
            {bicycleFrame(cx, groundY, s)}
            <circle cx={riderHeadX} cy={riderHeadY} r={headR} {...S} />
            <line x1={sX + 0.05 * s} y1={sY} x2={riderHeadX} y2={riderHeadY + headR} {...S} />
            <line x1={riderHeadX} y1={riderHeadY + headR} x2={htX} y2={hbY} {...S} />
            <line x1={sX + 0.05 * s} y1={sY} x2={cx - 0.05 * s} y2={groundY - 0.33 * s} {...S} />
          </g>
        );
      },
    },
  ],

  TRAFFIC_LANE: [
    {
      id: "car-sedan",
      label: { de: "PKW (Limousine)", en: "Car (sedan)" },
      renderSVG: ({ cx, groundY, widthPx, scale: s }) => {
        const carW   = Math.min(4.5 * s, widthPx * 0.8);
        const scaleF = carW / (4.5 * s);
        const wR     = 0.32 * s * scaleF;
        const bodyH  = 1.45 * s * scaleF * 0.6;
        const roofH  = 1.45 * s * scaleF * 0.4;
        const halfW  = carW / 2;
        const bodyY  = groundY - wR * 2 - bodyH;
        const roofY  = bodyY - roofH;
        const roofInset = halfW * 0.22;
        return (
          <g>
            <rect x={cx - halfW} y={bodyY} width={carW} height={bodyH} rx={wR * 0.4} {...S} />
            <path
              d={`M ${cx - halfW + roofInset} ${bodyY} L ${cx - halfW + roofInset * 0.4} ${roofY} L ${cx + halfW - roofInset * 0.4} ${roofY} L ${cx + halfW - roofInset} ${bodyY}`}
              {...S}
            />
            <circle cx={cx - halfW * 0.62} cy={groundY - wR} r={wR} {...S} />
            <circle cx={cx + halfW * 0.62} cy={groundY - wR} r={wR} {...S} />
            <line x1={cx - halfW + roofInset} y1={bodyY} x2={cx - halfW + roofInset * 0.4} y2={roofY} {...S} />
            <line x1={cx + halfW - roofInset} y1={bodyY} x2={cx + halfW - roofInset * 0.4} y2={roofY} {...S} />
          </g>
        );
      },
    },
    {
      id: "car-van",
      label: { de: "Transporter", en: "Van" },
      renderSVG: ({ cx, groundY, widthPx, scale: s }) => {
        const carW   = Math.min(5.0 * s, widthPx * 0.8);
        const scaleF = carW / (5.0 * s);
        const wR     = 0.35 * s * scaleF;
        const bodyH  = 1.7 * s * scaleF;
        const halfW  = carW / 2;
        const bodyY  = groundY - wR * 2 - bodyH;
        return (
          <g>
            <rect x={cx - halfW} y={bodyY} width={carW} height={bodyH} rx={wR * 0.2} {...S} />
            <line x1={cx - halfW + carW * 0.25} y1={bodyY} x2={cx - halfW + carW * 0.08} y2={bodyY + bodyH * 0.45} {...S} />
            <rect x={cx - halfW * 0.5} y={bodyY + bodyH * 0.05} width={halfW * 0.7} height={bodyH * 0.35} rx={2} {...S} />
            <circle cx={cx - halfW * 0.65} cy={groundY - wR} r={wR} {...S} />
            <circle cx={cx + halfW * 0.65} cy={groundY - wR} r={wR} {...S} />
          </g>
        );
      },
    },
  ],

  PARKING_LANE: [
    {
      id: "car-parallel",
      label: { de: "PKW (parallel)", en: "Car (parallel)" },
      renderSVG: ({ cx, groundY, widthPx, scale: s }) => {
        const carW   = Math.min(4.5 * s, widthPx * 0.8);
        const scaleF = carW / (4.5 * s);
        const wR     = 0.32 * s * scaleF;
        const bodyH  = 1.45 * s * scaleF * 0.6;
        const roofH  = 1.45 * s * scaleF * 0.4;
        const halfW  = carW / 2;
        const bodyY  = groundY - wR * 2 - bodyH;
        const roofY  = bodyY - roofH;
        const roofInset = halfW * 0.22;
        return (
          <g>
            <rect x={cx - halfW} y={bodyY} width={carW} height={bodyH} rx={wR * 0.4} {...S} />
            <path
              d={`M ${cx - halfW + roofInset} ${bodyY} L ${cx - halfW + roofInset * 0.4} ${roofY} L ${cx + halfW - roofInset * 0.4} ${roofY} L ${cx + halfW - roofInset} ${bodyY}`}
              {...S}
            />
            <circle cx={cx - halfW * 0.62} cy={groundY - wR} r={wR} {...S} />
            <circle cx={cx + halfW * 0.62} cy={groundY - wR} r={wR} {...S} />
            <line x1={cx - halfW + roofInset} y1={bodyY} x2={cx - halfW + roofInset * 0.4} y2={roofY} {...S} />
            <line x1={cx + halfW - roofInset} y1={bodyY} x2={cx + halfW - roofInset * 0.4} y2={roofY} {...S} />
          </g>
        );
      },
    },
    {
      id: "car-perpendicular",
      label: { de: "PKW (quer / Schnauze rein)", en: "Car (nose-in)" },
      renderSVG: ({ cx, groundY, widthPx, scale: s }) => {
        const carW   = Math.min(1.9 * s, widthPx * 0.8);
        const scaleF = carW / (1.9 * s);
        const carH   = 1.5 * s * scaleF;
        const wR     = 0.3 * s * scaleF;
        const halfW  = carW / 2;
        const bodyY  = groundY - wR * 2 - carH * 0.6;
        const roofY  = bodyY - carH * 0.4;
        const roofInset = halfW * 0.25;
        return (
          <g>
            <rect x={cx - halfW} y={bodyY} width={carW} height={carH * 0.6} rx={wR * 0.3} {...S} />
            <path
              d={`M ${cx - halfW + roofInset} ${bodyY} L ${cx - halfW + roofInset} ${roofY} L ${cx + halfW - roofInset} ${roofY} L ${cx + halfW - roofInset} ${bodyY}`}
              {...S}
            />
            <rect x={cx - halfW + roofInset + 2} y={roofY + 2} width={carW - roofInset * 2 - 4} height={carH * 0.32} {...S} />
            <rect x={cx - halfW + 3} y={bodyY + carH * 0.1} width={halfW * 0.35} height={carH * 0.18} rx={2} {...S} />
            <rect x={cx + halfW * 0.65} y={bodyY + carH * 0.1} width={halfW * 0.35} height={carH * 0.18} rx={2} {...S} />
            <circle cx={cx - halfW + wR} cy={groundY - wR} r={wR} {...S} />
            <circle cx={cx + halfW - wR} cy={groundY - wR} r={wR} {...S} />
          </g>
        );
      },
    },
  ],

  BUS_LANE: [
    {
      id: "bus",
      label: { de: "Bus", en: "Bus" },
      renderSVG: ({ cx, groundY, widthPx, scale: s }) => {
        const busW   = Math.min(2.55 * s, widthPx * 0.85);
        const scaleF = busW / (2.55 * s);
        const busH   = 3.2 * s * scaleF;
        const wR     = 0.55 * s * scaleF;
        const halfW  = busW / 2;
        const topY   = groundY - wR * 2 - busH;
        const winH   = busH * 0.28;
        const winY   = topY + busH * 0.08;
        return (
          <g>
            <rect x={cx - halfW} y={topY} width={busW} height={busH} rx={4} {...S} />
            <rect x={cx - halfW + 4} y={winY} width={busW - 8} height={winH} rx={2} {...S} />
            <rect x={cx - halfW * 0.7} y={winY + winH + 4} width={halfW * 1.4} height={busH * 0.1} rx={2} {...S} />
            <line x1={cx - halfW} y1={topY + busH * 0.65} x2={cx + halfW} y2={topY + busH * 0.65} {...S} />
            <line x1={cx - halfW * 0.25} y1={topY + busH * 0.65} x2={cx - halfW * 0.25} y2={groundY - wR * 2} {...S} />
            <line x1={cx + halfW * 0.25} y1={topY + busH * 0.65} x2={cx + halfW * 0.25} y2={groundY - wR * 2} {...S} />
            <circle cx={cx - halfW + wR + 4} cy={groundY - wR} r={wR} {...S} />
            <circle cx={cx + halfW - wR - 4} cy={groundY - wR} r={wR} {...S} />
          </g>
        );
      },
    },
  ],

  PLANTING_STRIP: [
    {
      id: "tree-deciduous",
      label: { de: "Laubbaum (runde Krone)", en: "Deciduous tree (round canopy)" },
      renderSVG: ({ cx, groundY, widthPx, scale: s, height_m = 8 }) =>
        deciduousTree(cx, groundY, widthPx, s, height_m),
    },
    {
      id: "tree-conifer",
      label: { de: "Nadelbaum (spitze Krone)", en: "Conifer tree (triangular canopy)" },
      renderSVG: ({ cx, groundY, widthPx, scale: s, height_m = 8 }) =>
        coniferTree(cx, groundY, widthPx, s, height_m),
    },
    {
      id: "no-tree",
      label: { de: "Ohne Baum (Bodendecker)", en: "No tree (ground cover)" },
      renderSVG: ({ cx, groundY, scale: s }) => {
        const grassH = 0.3 * s;
        const bladeW = 0.25 * s;
        return (
          <g>
            {([-bladeW, 0, bladeW] as number[]).map((offset, i) => (
              <path
                key={i}
                d={`M ${cx + offset} ${groundY} Q ${cx + offset - 0.04 * s} ${groundY - grassH * 0.7} ${cx + offset} ${groundY - grassH}`}
                {...S}
              />
            ))}
          </g>
        );
      },
    },
  ],

  MEDIAN: [
    {
      id: "tree-deciduous",
      label: { de: "Laubbaum (runde Krone)", en: "Deciduous tree (round canopy)" },
      renderSVG: ({ cx, groundY, widthPx, scale: s, height_m = 8 }) =>
        deciduousTree(cx, groundY, widthPx, s, height_m),
    },
    {
      id: "tree-conifer",
      label: { de: "Nadelbaum (spitze Krone)", en: "Conifer tree (triangular canopy)" },
      renderSVG: ({ cx, groundY, widthPx, scale: s, height_m = 8 }) =>
        coniferTree(cx, groundY, widthPx, s, height_m),
    },
  ],
};

// Public API ──────────────────────────────────────────────────────────────────

export function getFigureVariants(type: ElementType): FigureVariant[] | undefined {
  return FIGURE_REGISTRY[type];
}

export function getDefaultFigureVariant(type: ElementType): string | undefined {
  return FIGURE_REGISTRY[type]?.[0]?.id;
}
