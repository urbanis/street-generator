import React from "react";
import type { ElementType } from "../models/street";

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

const S = {
  fill: "none",
  stroke: "#1a1a1a",
  strokeWidth: 1,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// ── Private helpers ──────────────────────────────────────────────────────────

/** Detailed human figure with body outlines, bent limbs, and feet */
function humanBody(cx: number, groundY: number, s: number, totalH = 1.8): React.ReactElement {
  const r       = totalH / 1.8;
  const headR   = 0.115 * s * r;
  const headCY  = groundY - totalH * s + headR;
  const shouldY = headCY + headR + 0.15 * s * r;
  const waistY  = groundY - 0.97 * s * r;
  const hipY    = groundY - 0.84 * s * r;
  const kneeY   = groundY - 0.46 * s * r;
  const nHW     = 0.038 * s * r;
  const sHW     = 0.19  * s * r;
  const wHW     = 0.11  * s * r;
  const hipHW   = 0.15  * s * r;
  const elbowY  = (shouldY + hipY) * 0.5;
  return (
    <g>
      <circle cx={cx} cy={headCY} r={headR} {...S} />
      {/* Neck */}
      <line x1={cx - nHW} y1={headCY + headR} x2={cx - nHW} y2={shouldY} {...S} />
      <line x1={cx + nHW} y1={headCY + headR} x2={cx + nHW} y2={shouldY} {...S} />
      {/* Shoulders */}
      <line x1={cx - sHW} y1={shouldY} x2={cx + sHW} y2={shouldY} {...S} />
      {/* Torso sides */}
      <line x1={cx - sHW} y1={shouldY} x2={cx - wHW} y2={waistY} {...S} />
      <line x1={cx + sHW} y1={shouldY} x2={cx + wHW} y2={waistY} {...S} />
      {/* Hips */}
      <line x1={cx - wHW} y1={waistY} x2={cx - hipHW} y2={hipY} {...S} />
      <line x1={cx + wHW} y1={waistY} x2={cx + hipHW} y2={hipY} {...S} />
      <line x1={cx - hipHW} y1={hipY} x2={cx + hipHW} y2={hipY} {...S} />
      {/* Arms */}
      <path d={`M ${cx - sHW} ${shouldY + 0.02 * s * r} L ${cx - sHW - 0.045 * s * r} ${elbowY} L ${cx - 0.11 * s * r} ${hipY}`} {...S} />
      <path d={`M ${cx + sHW} ${shouldY + 0.02 * s * r} L ${cx + sHW + 0.045 * s * r} ${elbowY} L ${cx + 0.11 * s * r} ${hipY}`} {...S} />
      {/* Legs with knees */}
      <path d={`M ${cx - hipHW * 0.6} ${hipY} L ${cx - 0.10 * s * r} ${kneeY} L ${cx - 0.09 * s * r} ${groundY}`} {...S} />
      <path d={`M ${cx + hipHW * 0.6} ${hipY} L ${cx + 0.10 * s * r} ${kneeY} L ${cx + 0.09 * s * r} ${groundY}`} {...S} />
      {/* Feet */}
      <line x1={cx - 0.09 * s * r} y1={groundY} x2={cx - 0.23 * s * r} y2={groundY} {...S} />
      <line x1={cx + 0.09 * s * r} y1={groundY} x2={cx + 0.20 * s * r} y2={groundY} {...S} />
    </g>
  );
}

/** Detailed bicycle with rim circles, chain ring, saddle curve, drop handlebars */
function bicycle(cx: number, groundY: number, s: number): React.ReactElement {
  const wR  = 0.33 * s;
  const lWx = cx - 0.5 * s;
  const rWx = cx + 0.5 * s;
  const wY  = groundY - wR;
  const bbX = cx - 0.05 * s;
  const sX  = cx - 0.32 * s; const sY = groundY - 0.98 * s;
  const htX = cx + 0.32 * s; const htY = groundY - 0.90 * s;
  const hbY = htY - 0.20 * s;
  return (
    <g>
      {/* Wheels + rim circles */}
      <circle cx={lWx} cy={wY} r={wR}        {...S} />
      <circle cx={lWx} cy={wY} r={wR * 0.52} {...S} />
      <circle cx={rWx} cy={wY} r={wR}        {...S} />
      <circle cx={rWx} cy={wY} r={wR * 0.52} {...S} />
      {/* Cross spokes (2 per wheel) */}
      <line x1={lWx - wR * 0.82} y1={wY - wR * 0.4} x2={lWx + wR * 0.82} y2={wY + wR * 0.4} {...S} />
      <line x1={lWx - wR * 0.82} y1={wY + wR * 0.4} x2={lWx + wR * 0.82} y2={wY - wR * 0.4} {...S} />
      <line x1={rWx - wR * 0.82} y1={wY - wR * 0.4} x2={rWx + wR * 0.82} y2={wY + wR * 0.4} {...S} />
      <line x1={rWx - wR * 0.82} y1={wY + wR * 0.4} x2={rWx + wR * 0.82} y2={wY - wR * 0.4} {...S} />
      {/* Chain stay */}
      <line x1={bbX} y1={wY}  x2={lWx} y2={wY}  {...S} />
      {/* Seat tube */}
      <line x1={bbX} y1={wY}  x2={sX}  y2={sY}  {...S} />
      {/* Top tube */}
      <line x1={sX}  y1={sY}  x2={htX} y2={htY} {...S} />
      {/* Down tube */}
      <line x1={bbX} y1={wY}  x2={htX} y2={htY} {...S} />
      {/* Fork */}
      <line x1={htX} y1={htY} x2={rWx} y2={wY}  {...S} />
      {/* Chain ring */}
      <circle cx={bbX} cy={wY} r={0.13 * s} {...S} />
      {/* Saddle (curved line) */}
      <path d={`M ${sX - 0.13 * s} ${sY} Q ${sX} ${sY - 0.05 * s} ${sX + 0.13 * s} ${sY}`} {...S} />
      {/* Handlebar stem */}
      <line x1={htX} y1={htY} x2={htX} y2={hbY} {...S} />
      {/* Drop handlebars */}
      <path d={`M ${htX - 0.12 * s} ${hbY} Q ${htX - 0.12 * s} ${hbY + 0.09 * s} ${htX - 0.05 * s} ${hbY + 0.09 * s}`} {...S} />
      <path d={`M ${htX + 0.12 * s} ${hbY} Q ${htX + 0.12 * s} ${hbY + 0.09 * s} ${htX + 0.05 * s} ${hbY + 0.09 * s}`} {...S} />
      <line x1={htX - 0.12 * s} y1={hbY} x2={htX + 0.12 * s} y2={hbY} {...S} />
    </g>
  );
}

/** Car side profile with wheel arches, curved roof, windows, door, details */
function sedanSide(cx: number, groundY: number, carW: number, s: number, sf: number): React.ReactElement {
  const wR    = 0.32 * s * sf;
  const hfW   = carW / 2;
  const flY   = groundY - wR * 2.1;           // floor of body
  const bltY  = groundY - 0.72 * s * sf;      // beltline
  const roofY = groundY - 1.40 * s * sf;      // roof top
  const fWx   = cx - hfW * 0.55;
  const rWx   = cx + hfW * 0.54;
  const wCy   = groundY - wR;
  // x positions
  const x0 = cx - hfW;
  const x1 = cx - hfW * 0.60;  // hood start
  const x2 = cx - hfW * 0.38;  // windshield base
  const x3 = cx - hfW * 0.23;  // roof front
  const x4 = cx + hfW * 0.18;  // roof rear
  const x5 = cx + hfW * 0.40;  // rear window base
  const x6 = cx + hfW * 0.65;  // trunk end
  const x7 = cx + hfW;
  const midX = (x2 + x5) / 2;
  return (
    <g>
      {/* Front face */}
      <line x1={x0} y1={bltY + 5 * sf} x2={x0} y2={flY} {...S} />
      {/* Hood */}
      <path d={`M ${x0} ${bltY + 5 * sf} Q ${x0} ${bltY} ${x1} ${bltY} L ${x2} ${bltY}`} {...S} />
      {/* Windshield */}
      <line x1={x2} y1={bltY} x2={x3} y2={roofY + 2} {...S} />
      {/* Roof (slight arch) */}
      <path d={`M ${x3} ${roofY + 2} Q ${cx} ${roofY - 3 * sf} ${x4} ${roofY + 2}`} {...S} />
      {/* Rear window */}
      <line x1={x4} y1={roofY + 2} x2={x5} y2={bltY} {...S} />
      {/* Trunk */}
      <line x1={x5} y1={bltY} x2={x6} y2={bltY} {...S} />
      <path d={`M ${x6} ${bltY} Q ${x7} ${bltY} ${x7} ${bltY + 5 * sf}`} {...S} />
      {/* Rear face */}
      <line x1={x7} y1={bltY + 5 * sf} x2={x7} y2={flY} {...S} />
      {/* Floor with wheel arches */}
      <line x1={x0} y1={flY} x2={fWx - wR * 1.2} y2={flY} {...S} />
      <path d={`M ${fWx - wR * 1.2} ${flY} A ${wR * 1.2} ${wR * 0.8} 0 0 1 ${fWx + wR * 1.2} ${flY}`} {...S} />
      <line x1={fWx + wR * 1.2} y1={flY} x2={rWx - wR * 1.2} y2={flY} {...S} />
      <path d={`M ${rWx - wR * 1.2} ${flY} A ${wR * 1.2} ${wR * 0.8} 0 0 1 ${rWx + wR * 1.2} ${flY}`} {...S} />
      <line x1={rWx + wR * 1.2} y1={flY} x2={x7} y2={flY} {...S} />
      {/* Door division */}
      <line x1={midX} y1={bltY} x2={midX} y2={flY} {...S} />
      {/* Windows */}
      <path d={`M ${x2 + 3 * sf} ${bltY - 1} L ${x3 + 2} ${roofY + 6} L ${midX - 4} ${roofY + 6} L ${midX - 4} ${bltY - 1} Z`} {...S} />
      <path d={`M ${midX + 4} ${bltY - 1} L ${midX + 4} ${roofY + 6} L ${x4 - 2} ${roofY + 6} L ${x5 - 3 * sf} ${bltY - 1} Z`} {...S} />
      {/* Wheels + rims */}
      <circle cx={fWx} cy={wCy} r={wR}        {...S} />
      <circle cx={fWx} cy={wCy} r={wR * 0.50} {...S} />
      <circle cx={rWx} cy={wCy} r={wR}        {...S} />
      <circle cx={rWx} cy={wCy} r={wR * 0.50} {...S} />
      {/* Mirror */}
      <rect x={x2 - 6 * sf} y={bltY - 8 * sf} width={6 * sf} height={3 * sf} {...S} />
      {/* Headlight */}
      <rect x={x0 + sf} y={bltY - 7 * sf} width={8 * sf} height={4 * sf} rx={1} {...S} />
      {/* Taillight */}
      <rect x={x7 - 9 * sf} y={bltY - 7 * sf} width={8 * sf} height={4 * sf} rx={1} {...S} />
    </g>
  );
}

/** Van side profile — taller and boxier */
function vanSide(cx: number, groundY: number, carW: number, s: number, sf: number): React.ReactElement {
  const wR   = 0.35 * s * sf;
  const hfW  = carW / 2;
  const flY  = groundY - wR * 2.1;
  const topY = groundY - 2.35 * s * sf;
  const fWx  = cx - hfW * 0.62;
  const rWx  = cx + hfW * 0.62;
  const wCy  = groundY - wR;
  const x0   = cx - hfW;
  const x7   = cx + hfW;
  const cabX = x0 + carW * 0.28;  // cab/cargo divide
  const winH = (flY - topY) * 0.28;
  return (
    <g>
      {/* Body outline */}
      <path d={`M ${x0} ${flY} L ${x0} ${topY + 4 * sf} Q ${x0} ${topY} ${x0 + 4 * sf} ${topY} L ${x7 - 4 * sf} ${topY} Q ${x7} ${topY} ${x7} ${topY + 4 * sf} L ${x7} ${flY}`} {...S} />
      {/* Windshield (angled) */}
      <line x1={x0 + carW * 0.08} y1={flY - (flY - topY) * 0.42} x2={cabX} y2={topY + 3 * sf} {...S} />
      {/* Cab/cargo vertical divider */}
      <line x1={cabX} y1={topY} x2={cabX} y2={flY} {...S} />
      {/* Windows row on cargo */}
      {[0.38, 0.55, 0.72].map((t, i) => (
        <rect key={i} x={x0 + carW * t} y={topY + 6 * sf} width={carW * 0.12} height={winH} rx={2} {...S} />
      ))}
      {/* Floor with wheel arches */}
      <line x1={x0} y1={flY} x2={fWx - wR * 1.2} y2={flY} {...S} />
      <path d={`M ${fWx - wR * 1.2} ${flY} A ${wR * 1.2} ${wR * 0.8} 0 0 1 ${fWx + wR * 1.2} ${flY}`} {...S} />
      <line x1={fWx + wR * 1.2} y1={flY} x2={rWx - wR * 1.2} y2={flY} {...S} />
      <path d={`M ${rWx - wR * 1.2} ${flY} A ${wR * 1.2} ${wR * 0.8} 0 0 1 ${rWx + wR * 1.2} ${flY}`} {...S} />
      <line x1={rWx + wR * 1.2} y1={flY} x2={x7} y2={flY} {...S} />
      {/* Wheels */}
      <circle cx={fWx} cy={wCy} r={wR}        {...S} />
      <circle cx={fWx} cy={wCy} r={wR * 0.50} {...S} />
      <circle cx={rWx} cy={wCy} r={wR}        {...S} />
      <circle cx={rWx} cy={wCy} r={wR * 0.50} {...S} />
      {/* Headlight */}
      <rect x={x0 + sf} y={flY - (flY - topY) * 0.35} width={7 * sf} height={4 * sf} rx={1} {...S} />
    </g>
  );
}

/** Organic deciduous canopy (bumpy path) */
function deciduousTree(cx: number, groundY: number, widthPx: number, s: number, height_m: number): React.ReactElement {
  const trunkH = height_m * 0.35 * s;
  const trunkW = Math.max(4, 0.08 * s);
  const r      = Math.min(height_m * 0.38 * s, widthPx * 0.42);
  const tTopY  = groundY - trunkH;
  const cCy    = tTopY - r * 0.65;
  const lobes  = 8;
  const outer  = r;
  const inner  = r * 0.80;
  const pts: string[] = [];
  for (let i = 0; i <= lobes * 2; i++) {
    const angle = (i / (lobes * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad   = i % 2 === 0 ? outer : inner;
    const x     = (cx + Math.cos(angle) * rad).toFixed(1);
    const y     = (cCy + Math.sin(angle) * rad).toFixed(1);
    pts.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  pts.push("Z");
  return (
    <g>
      <rect x={cx - trunkW / 2} y={tTopY} width={trunkW} height={trunkH} rx={trunkW / 4} {...S} />
      <path d={pts.join(" ")} {...S} />
    </g>
  );
}

/** Three-tiered conifer */
function coniferTree(cx: number, groundY: number, widthPx: number, s: number, height_m: number): React.ReactElement {
  const trunkH = height_m * 0.12 * s;
  const trunkW = Math.max(3, 0.06 * s);
  const totalH = height_m * s;
  const maxHB  = Math.min(totalH * 0.42, widthPx * 0.44);
  const t1BaseY = groundY - trunkH;
  const t1TipY  = t1BaseY - totalH * 0.42;
  const t2BaseY = t1TipY + totalH * 0.12;
  const t2TipY  = t2BaseY - totalH * 0.35;
  const t3BaseY = t2TipY + totalH * 0.10;
  const t3TipY  = t3BaseY - totalH * 0.28;
  return (
    <g>
      <rect x={cx - trunkW / 2} y={groundY - trunkH} width={trunkW} height={trunkH} rx={trunkW / 4} {...S} />
      <polygon points={`${cx},${t1TipY} ${cx - maxHB},${t1BaseY} ${cx + maxHB},${t1BaseY}`} {...S} />
      <polygon points={`${cx},${t2TipY} ${cx - maxHB * 0.72},${t2BaseY} ${cx + maxHB * 0.72},${t2BaseY}`} {...S} />
      <polygon points={`${cx},${t3TipY} ${cx - maxHB * 0.44},${t3BaseY} ${cx + maxHB * 0.44},${t3BaseY}`} {...S} />
    </g>
  );
}

// ── Registry ─────────────────────────────────────────────────────────────────

const FIGURE_REGISTRY: Partial<Record<ElementType, FigureVariant[]>> = {

  SIDEWALK: [
    {
      id: "pedestrian",
      label: { de: "Erwachsener", en: "Adult" },
      renderSVG: ({ cx, groundY, scale: s }) => <g>{humanBody(cx, groundY, s, 1.8)}</g>,
    },
    {
      id: "pedestrian-child",
      label: { de: "Erwachsener + Kind", en: "Adult + child" },
      renderSVG: ({ cx, groundY, scale: s }) => (
        <g>
          {humanBody(cx + 0.28 * s, groundY, s, 1.8)}
          {humanBody(cx - 0.32 * s, groundY, s, 1.1)}
        </g>
      ),
    },
    {
      id: "pedestrian-bike",
      label: { de: "Erwachsener mit Fahrrad", en: "Adult walking bike" },
      renderSVG: ({ cx, groundY, scale: s }) => {
        const personX = cx - 0.65 * s;
        const bikeX   = cx + 0.2 * s;
        const wR      = 0.33 * s;
        const lWx     = bikeX - 0.5 * s;
        const rWx     = bikeX + 0.5 * s;
        const wY      = groundY - wR;
        const htX     = bikeX + 0.32 * s;
        const hbY     = groundY - 1.08 * s;
        const sHW     = 0.19 * s;
        const shouldY = groundY - 1.8 * s + 0.115 * s + 0.15 * s;
        const armY    = (shouldY + groundY - 0.84 * s) * 0.5;
        return (
          <g>
            {humanBody(personX, groundY, s, 1.8)}
            {/* Extended arm to handlebar */}
            <line x1={personX + sHW} y1={armY} x2={htX} y2={hbY + 0.05 * s} {...S} />
            {/* Simplified walked bike */}
            <circle cx={lWx} cy={wY} r={wR}        {...S} />
            <circle cx={lWx} cy={wY} r={wR * 0.52} {...S} />
            <circle cx={rWx} cy={wY} r={wR}        {...S} />
            <circle cx={rWx} cy={wY} r={wR * 0.52} {...S} />
            <line x1={bikeX - 0.05 * s} y1={wY} x2={lWx} y2={wY}      {...S} />
            <line x1={bikeX - 0.05 * s} y1={wY} x2={bikeX - 0.32 * s} y2={groundY - 0.98 * s} {...S} />
            <line x1={bikeX - 0.32 * s} y1={groundY - 0.98 * s} x2={htX} y2={groundY - 0.90 * s} {...S} />
            <line x1={bikeX - 0.05 * s} y1={wY} x2={htX}              y2={groundY - 0.90 * s} {...S} />
            <line x1={htX} y1={groundY - 0.90 * s} x2={rWx}           y2={wY}                 {...S} />
            <line x1={htX} y1={groundY - 0.90 * s} x2={htX}           y2={hbY}                {...S} />
            <line x1={htX - 0.12 * s} y1={hbY} x2={htX + 0.12 * s}   y2={hbY}                {...S} />
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
        const sX   = cx - 0.32 * s;
        const sY   = groundY - 0.98 * s;
        const htX  = cx + 0.32 * s;
        const htY  = groundY - 0.90 * s;
        const hbY  = htY - 0.20 * s;
        const rX   = sX + 0.05 * s;
        const headR = 0.115 * s;
        const headY = sY - 0.82 * s;
        const neckTopY = headY + headR;
        const shouldY = neckTopY + 0.15 * s;
        const sHW = 0.17 * s;
        const wHW = 0.11 * s;
        const hipHW = 0.14 * s;
        const waistY = sY - 0.20 * s;
        return (
          <g>
            {bicycle(cx, groundY, s)}
            {/* Rider head */}
            <circle cx={rX} cy={headY} r={headR} {...S} />
            {/* Neck */}
            <line x1={rX - 0.035 * s} y1={neckTopY} x2={rX - 0.035 * s} y2={shouldY} {...S} />
            <line x1={rX + 0.035 * s} y1={neckTopY} x2={rX + 0.035 * s} y2={shouldY} {...S} />
            {/* Torso */}
            <line x1={rX - sHW} y1={shouldY} x2={rX + sHW} y2={shouldY} {...S} />
            <line x1={rX - sHW} y1={shouldY} x2={rX - wHW} y2={waistY} {...S} />
            <line x1={rX + sHW} y1={shouldY} x2={rX + wHW} y2={waistY} {...S} />
            <line x1={rX - wHW} y1={waistY} x2={rX - hipHW} y2={sY}    {...S} />
            <line x1={rX + wHW} y1={waistY} x2={rX + hipHW} y2={sY}    {...S} />
            {/* Arm to handlebar */}
            <line x1={rX + sHW} y1={shouldY + 0.05 * s} x2={htX} y2={hbY} {...S} />
            {/* Leg to pedal */}
            <line x1={rX} y1={sY} x2={cx - 0.05 * s} y2={groundY - 0.33 * s} {...S} />
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
        const htY = groundY - 0.90 * s;
        const hbY = htY - 0.20 * s;
        const headR = 0.115 * s;
        const headX = cx + 0.12 * s;
        const headY = sY - 0.50 * s;
        return (
          <g>
            {bicycle(cx, groundY, s)}
            {/* Head forward and low (racing tuck) */}
            <circle cx={headX} cy={headY} r={headR} {...S} />
            {/* Torso (diagonal — leaning forward) */}
            <line x1={sX + 0.06 * s} y1={sY} x2={headX - 0.04 * s} y2={headY + headR} {...S} />
            {/* Arms to drops */}
            <path d={`M ${headX - 0.04 * s} ${headY + headR} L ${htX - 0.06 * s} ${hbY + 0.07 * s} L ${htX + 0.05 * s} ${hbY + 0.09 * s}`} {...S} />
            {/* Leg to pedal */}
            <line x1={sX + 0.06 * s} y1={sY} x2={cx - 0.05 * s} y2={groundY - 0.33 * s} {...S} />
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
        const carW = Math.min(4.5 * s, widthPx * 0.8);
        const sf   = carW / (4.5 * s);
        return <g>{sedanSide(cx, groundY, carW, s, sf)}</g>;
      },
    },
    {
      id: "car-van",
      label: { de: "Transporter", en: "Van" },
      renderSVG: ({ cx, groundY, widthPx, scale: s }) => {
        const carW = Math.min(5.0 * s, widthPx * 0.8);
        const sf   = carW / (5.0 * s);
        return <g>{vanSide(cx, groundY, carW, s, sf)}</g>;
      },
    },
  ],

  PARKING_LANE: [
    {
      id: "car-parallel",
      label: { de: "PKW (parallel)", en: "Car (parallel)" },
      renderSVG: ({ cx, groundY, widthPx, scale: s }) => {
        const carW = Math.min(4.5 * s, widthPx * 0.8);
        const sf   = carW / (4.5 * s);
        return <g>{sedanSide(cx, groundY, carW, s, sf)}</g>;
      },
    },
    {
      id: "car-perpendicular",
      label: { de: "PKW (quer / Schnauze rein)", en: "Car (nose-in)" },
      renderSVG: ({ cx, groundY, widthPx, scale: s }) => {
        const carW  = Math.min(1.9 * s, widthPx * 0.8);
        const sf    = carW / (1.9 * s);
        const carH  = 1.5 * s * sf;
        const wR    = 0.30 * s * sf;
        const hfW   = carW / 2;
        const bodyY = groundY - wR * 2 - carH * 0.6;
        const roofY = bodyY - carH * 0.4;
        const ri    = hfW * 0.26;
        const wCy   = groundY - wR;
        return (
          <g>
            {/* Body */}
            <rect x={cx - hfW} y={bodyY} width={carW} height={carH * 0.6} rx={wR * 0.3} {...S} />
            {/* Roof */}
            <path d={`M ${cx - hfW + ri} ${bodyY} L ${cx - hfW + ri} ${roofY} Q ${cx} ${roofY - 4 * sf} ${cx + hfW - ri} ${roofY} L ${cx + hfW - ri} ${bodyY}`} {...S} />
            {/* Windshield */}
            <rect x={cx - hfW + ri + 2} y={roofY + 2} width={carW - ri * 2 - 4} height={carH * 0.32} rx={2} {...S} />
            {/* Headlights */}
            <rect x={cx - hfW + 2 * sf} y={bodyY + carH * 0.08} width={hfW * 0.38} height={carH * 0.18} rx={2} {...S} />
            <rect x={cx + hfW * 0.62}   y={bodyY + carH * 0.08} width={hfW * 0.38} height={carH * 0.18} rx={2} {...S} />
            {/* Grille */}
            <rect x={cx - hfW * 0.5} y={bodyY + carH * 0.32} width={hfW} height={carH * 0.18} rx={2} {...S} />
            {/* Wheels */}
            <circle cx={cx - hfW + wR + 2 * sf} cy={wCy} r={wR}        {...S} />
            <circle cx={cx - hfW + wR + 2 * sf} cy={wCy} r={wR * 0.50} {...S} />
            <circle cx={cx + hfW - wR - 2 * sf} cy={wCy} r={wR}        {...S} />
            <circle cx={cx + hfW - wR - 2 * sf} cy={wCy} r={wR * 0.50} {...S} />
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
        const busW = Math.min(2.55 * s, widthPx * 0.85);
        const sf   = busW / (2.55 * s);
        const busH = 3.2 * s * sf;
        const wR   = 0.55 * s * sf;
        const hfW  = busW / 2;
        const topY = groundY - wR * 2 - busH;
        const wCy  = groundY - wR;
        const winH = busH * 0.22;
        const winY = topY + busH * 0.06;
        const bodyBase = groundY - wR * 2;
        return (
          <g>
            {/* Body */}
            <path d={`M ${cx - hfW + 3 * sf} ${topY} L ${cx + hfW - 3 * sf} ${topY} Q ${cx + hfW} ${topY} ${cx + hfW} ${topY + 4 * sf} L ${cx + hfW} ${bodyBase} L ${cx - hfW} ${bodyBase} L ${cx - hfW} ${topY + 4 * sf} Q ${cx - hfW} ${topY} ${cx - hfW + 3 * sf} ${topY}`} {...S} />
            {/* Upper windows strip */}
            <rect x={cx - hfW + 4 * sf} y={winY} width={busW - 8 * sf} height={winH} rx={2} {...S} />
            {/* Window dividers */}
            {[-0.28, 0, 0.28].map((t, i) => (
              <line key={i} x1={cx + t * busW} y1={winY} x2={cx + t * busW} y2={winY + winH} {...S} />
            ))}
            {/* Destination board */}
            <rect x={cx - hfW * 0.65} y={winY + winH + 3 * sf} width={hfW * 1.3} height={busH * 0.09} rx={1} {...S} />
            {/* Body belt line */}
            <line x1={cx - hfW} y1={topY + busH * 0.60} x2={cx + hfW} y2={topY + busH * 0.60} {...S} />
            {/* Door openings (two doors) */}
            <line x1={cx - hfW * 0.30} y1={topY + busH * 0.60} x2={cx - hfW * 0.30} y2={bodyBase} {...S} />
            <line x1={cx - hfW * 0.05} y1={topY + busH * 0.60} x2={cx - hfW * 0.05} y2={bodyBase} {...S} />
            <line x1={cx + hfW * 0.18} y1={topY + busH * 0.60} x2={cx + hfW * 0.18} y2={bodyBase} {...S} />
            <line x1={cx + hfW * 0.42} y1={topY + busH * 0.60} x2={cx + hfW * 0.42} y2={bodyBase} {...S} />
            {/* Headlights */}
            <rect x={cx - hfW * 0.7} y={topY + busH * 0.66} width={hfW * 0.32} height={busH * 0.08} rx={2} {...S} />
            <rect x={cx + hfW * 0.38} y={topY + busH * 0.66} width={hfW * 0.32} height={busH * 0.08} rx={2} {...S} />
            {/* Wheels */}
            <circle cx={cx - hfW + wR + 3 * sf} cy={wCy} r={wR}        {...S} />
            <circle cx={cx - hfW + wR + 3 * sf} cy={wCy} r={wR * 0.52} {...S} />
            <circle cx={cx + hfW - wR - 3 * sf} cy={wCy} r={wR}        {...S} />
            <circle cx={cx + hfW - wR - 3 * sf} cy={wCy} r={wR * 0.52} {...S} />
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

// ── Public API ────────────────────────────────────────────────────────────────

export function getFigureVariants(type: ElementType): FigureVariant[] | undefined {
  return FIGURE_REGISTRY[type];
}

export function getDefaultFigureVariant(type: ElementType): string | undefined {
  return FIGURE_REGISTRY[type]?.[0]?.id;
}

export function isTreeVariant(variantId: string | undefined): boolean {
  return variantId === "tree-deciduous" || variantId === "tree-conifer";
}
