import { useState, useRef } from "react";
import { useLang } from "../../i18n";
import type { StreetConfig } from "../../models/street";
import { getElementDef } from "../../elements/registry";
import { computeLayout } from "./renderer";
import { CROSS_SECTION_VIEW, CSV_HEADER, CSV_TITLE, CSV_SVG_WRAP, THEME_SELECT, EXPORT_BTN } from "./styles";
import { Button } from "@/components/ui/button";

export type SvgTheme = "full" | "color-labels" | "color-only" | "bw-pattern" | "bw-labels" | "outline";

const THEMES: { value: SvgTheme; label: { de: string; en: string } }[] = [
  { value: "full",         label: { de: "Vollständig",           en: "Full" } },
  { value: "color-labels", label: { de: "Farbe + Labels",        en: "Color + labels" } },
  { value: "color-only",  label: { de: "Nur Farbe",              en: "Color only" } },
  { value: "bw-pattern",  label: { de: "S/W + Muster + Labels",  en: "B&W + pattern + labels" } },
  { value: "bw-labels",   label: { de: "S/W + Labels",           en: "B&W + labels" } },
  { value: "outline",     label: { de: "Nur Umriss",             en: "Outline only" } },
];

function useThemeStyle(theme: SvgTheme) {
  const showColor  = theme === "full" || theme === "color-labels" || theme === "color-only";
  const showLabels = theme === "full" || theme === "color-labels" || theme === "bw-pattern" || theme === "bw-labels";
  return { showColor, showLabels };
}

interface CrossSectionViewProps {
  street: StreetConfig;
  highlightedIds: string[];
}

export function CrossSectionView({ street, highlightedIds }: CrossSectionViewProps) {
  const lang = useLang();
  const [theme, setTheme] = useState<SvgTheme>("full");
  const svgRef = useRef<SVGSVGElement>(null);
  const { showColor, showLabels } = useThemeStyle(theme);

  const layout = computeLayout(street);
  const W = layout.totalWidthPx;
  const H = layout.heightPx;
  const LABEL_H = showLabels ? 20 : 0;
  const SVG_H = H + LABEL_H + 24;

  function exportSvg() {
    if (!svgRef.current) return;
    const blob = new Blob([svgRef.current.outerHTML], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${street.name || "street"}.svg`;
    a.click();
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(street, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${street.name || "street"}.json`;
    a.click();
  }

  function exportPng() {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = W || 400;
    canvas.height = SVG_H;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${street.name || "street"}.png`;
      a.click();
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(blob);
  }

  return (
    <div className={CROSS_SECTION_VIEW}>
      <div className={CSV_HEADER}>
        <span className={CSV_TITLE}>{street.name}</span>

        <select
          className={THEME_SELECT}
          value={theme}
          onChange={(e) => setTheme(e.target.value as SvgTheme)}
        >
          {THEMES.map((th) => (
            <option key={th.value} value={th.value}>{th.label[lang]}</option>
          ))}
        </select>

        <Button variant="outline" size="sm" className={EXPORT_BTN} onClick={exportPng}>PNG</Button>
        <Button variant="outline" size="sm" className={EXPORT_BTN} onClick={exportSvg}>SVG</Button>
        <Button variant="outline" size="sm" className={EXPORT_BTN} onClick={exportJson}>JSON</Button>
      </div>

      <div className={`${CSV_SVG_WRAP} flex justify-center`}>
        {W === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
            Add elements in the Design tab.
          </div>
        ) : (
          <svg
            ref={svgRef}
            width={W}
            height={SVG_H}
            viewBox={`0 0 ${W} ${SVG_H}`}
            xmlns="http://www.w3.org/2000/svg"
            className="block"
          >
            {layout.elements.map((le) => {
              const el = street.elements.find((e) => e.id === le.id)!;
              const def = getElementDef(el.type);
              const mergedStyle = { ...def.defaultStyle, ...el.style };
              const style = showColor ? mergedStyle : { fill: "#ffffff", stroke: "#333333" };
              const isHighlighted = highlightedIds.includes(el.id);

              return (
                <g key={el.id}>
                  {def.renderSVG({ x: le.x, widthPx: le.widthPx, heightPx: H, style, scale: layout.scale })}
                  {isHighlighted && (
                    <rect x={le.x} y={0} width={le.widthPx} height={H}
                      fill="none" stroke="#ef4444" strokeWidth={2} />
                  )}
                </g>
              );
            })}

            {/* Dimension line */}
            <line x1={0} y1={H + 4} x2={W} y2={H + 4} stroke="#6b7280" strokeWidth={1} />
            {layout.elements.map((le) => {
              const el = street.elements.find((e) => e.id === le.id)!;
              return (
                <g key={`dim-${el.id}`}>
                  <line x1={le.x} y1={H + 1} x2={le.x} y2={H + 8} stroke="#6b7280" strokeWidth={1} />
                  <text x={le.x + le.widthPx / 2} y={H + 18}
                    textAnchor="middle" fontSize={9} fill="#6b7280">
                    {el.width_m.toFixed(2)}m
                  </text>
                </g>
              );
            })}

            {/* Labels */}
            {showLabels && layout.elements.map((le) => {
              const el = street.elements.find((e) => e.id === le.id)!;
              const def = getElementDef(el.type);
              if (le.widthPx < 24) return null;
              return (
                <text
                  key={`lbl-${el.id}`}
                  x={le.x + le.widthPx / 2}
                  y={H / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.min(10, le.widthPx / 5)}
                  fill="#374151"
                  transform={le.widthPx < 60 ? `rotate(-90, ${le.x + le.widthPx / 2}, ${H / 2})` : undefined}
                >
                  {def.label[lang]}
                </text>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
