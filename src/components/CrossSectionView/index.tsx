import { useState, useRef } from "react";
import { useLang } from "../../i18n";
import type { StreetConfig } from "../../models/street";
import { getElementDef } from "../../elements/registry";
import { computeLayout, BAND_H, ANN_H } from "./renderer";
import type { TemplateOption } from "../../templates";
import { CROSS_SECTION_VIEW, CSV_HEADER, CSV_CONTROLS, CSV_SVG_WRAP, THEME_SELECT, EXPORT_BTN } from "./styles";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

export type SvgTheme =
  | "full"
  | "color-labels"
  | "outline-label"
  | "outline-label-measure"
  | "outline-measure";

const THEMES: { value: SvgTheme; label: { de: string; en: string } }[] = [
  { value: "full",                  label: { de: "Vollständig",             en: "Full" } },
  { value: "color-labels",          label: { de: "Farbe + Labels",          en: "Color + labels" } },
  { value: "outline-label",         label: { de: "Umriss + Labels",         en: "Outline + labels" } },
  { value: "outline-label-measure", label: { de: "Umriss + Labels + Maße",  en: "Outline + labels + measurements" } },
  { value: "outline-measure",       label: { de: "Umriss + Maße",           en: "Outline + measurements" } },
];

function useThemeFlags(theme: SvgTheme) {
  return {
    showColor:   theme === "full" || theme === "color-labels",
    showNames:   theme === "full" || theme === "color-labels" || theme === "outline-label" || theme === "outline-label-measure",
    showMeasure: theme === "full" || theme === "outline-label-measure" || theme === "outline-measure",
  };
}

const FLOOR_COLORS: Record<string, string> = {
  Wohnen:     "#bfdbfe",
  Gewerbe:    "#fde68a",
  Gemischt:   "#c4b5fd",
  Öffentlich: "#bbf7d0",
};

interface CrossSectionViewProps {
  street:           StreetConfig;
  highlightedIds:   string[];
  templates:        TemplateOption[];
  onTemplateApply:  (tpl: TemplateOption) => void;
}

export function CrossSectionView({ street, highlightedIds, templates, onTemplateApply }: CrossSectionViewProps) {
  const lang                                   = useLang();
  const [theme, setTheme]                      = useState<SvgTheme>("full");
  const [zoom, setZoom]                        = useState(1);
  const svgRef                                 = useRef<SVGSVGElement>(null);
  const wrapRef                                = useRef<HTMLDivElement>(null);
  const { showColor, showNames, showMeasure }  = useThemeFlags(theme);

  const layout   = computeLayout(street);
  const W        = layout.totalWidthPx;
  const NAME_H   = street.name ? 24 : 0;
  const GROUND_Y = NAME_H + layout.skyH;
  const SVG_H    = GROUND_Y + BAND_H + ANN_H;

  function fit() {
    if (!wrapRef.current || W === 0) return;
    const { clientWidth, clientHeight } = wrapRef.current;
    const padding = 32;
    const z = Math.min((clientWidth - padding) / W, (clientHeight - padding) / SVG_H);
    setZoom(Math.max(0.1, Math.min(z, 5)));
  }

  function exportSvg() {
    if (!svgRef.current) return;
    const blob = new Blob([svgRef.current.outerHTML], { type: "image/svg+xml" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `${street.name || "street"}.svg`;
    a.click();
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(street, null, 2)], { type: "application/json" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `${street.name || "street"}.json`;
    a.click();
  }

  function exportPng() {
    if (!svgRef.current) return;
    const svg    = svgRef.current;
    const canvas = document.createElement("canvas");
    canvas.width  = W || 400;
    canvas.height = SVG_H;
    const ctx  = canvas.getContext("2d")!;
    const img  = new Image();
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const a    = document.createElement("a");
      a.href     = canvas.toDataURL("image/png");
      a.download = `${street.name || "street"}.png`;
      a.click();
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(blob);
  }

  return (
    <div className={CROSS_SECTION_VIEW}>
      <div className={CSV_HEADER}>
        <div className={CSV_CONTROLS}>
          <select
            className="h-7 rounded border border-input bg-background px-1.5 text-xs text-foreground"
            defaultValue=""
            onChange={(e) => {
              const tpl = templates.find((t) => t.id === e.target.value);
              if (tpl) onTemplateApply(tpl);
              e.target.value = "";
            }}
          >
            <option value="" disabled>{lang === "de" ? "Neue Straße" : "New street"}</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>{tpl.label[lang]}</option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">{lang === "de" ? "Stil" : "Style"}</span>
          <select
            className={THEME_SELECT}
            value={theme}
            onChange={(e) => setTheme(e.target.value as SvgTheme)}
          >
            {THEMES.map((th) => (
              <option key={th.value} value={th.value}>{th.label[lang]}</option>
            ))}
          </select>
          <div className="flex items-center gap-0.5 ml-2 border border-border rounded">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom((z) => Math.min(z * 1.25, 5))} title="Zoom in"><ZoomIn size={12} /></Button>
            <Button variant="ghost" size="sm" className="h-7 px-1.5 text-xs" onClick={fit} title="Fit"><Maximize2 size={11} /></Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom((z) => Math.max(z * 0.8, 0.1))} title="Zoom out"><ZoomOut size={12} /></Button>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-muted-foreground mr-1">{lang === "de" ? "Exportieren" : "Export"}</span>
            <Button variant="outline" size="sm" className={EXPORT_BTN} onClick={exportPng}>
              <Download size={11} />PNG
            </Button>
            <Button variant="outline" size="sm" className={EXPORT_BTN} onClick={exportSvg}>
              <Download size={11} />SVG
            </Button>
            <Button variant="outline" size="sm" className={EXPORT_BTN} onClick={exportJson}>
              <Download size={11} />JSON
            </Button>
          </div>
        </div>
      </div>

      <div ref={wrapRef} className={CSV_SVG_WRAP}>
        {W === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
            {lang === "de" ? "Keine Elemente. Palette unten verwenden." : "No elements. Use the palette below."}
          </div>
        ) : (
          <svg
            ref={svgRef}
            width={W * zoom}
            height={SVG_H * zoom}
            viewBox={`0 0 ${W} ${SVG_H}`}
            xmlns="http://www.w3.org/2000/svg"
            className="block"
          >
            {/* Street name */}
            {street.name && (
              <text
                x={W / 2} y={12}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={11} fontWeight="600" fill="#111827"
              >
                {street.name}
              </text>
            )}

            {/* Elements — ground band + buildings above */}
            {layout.elements.map((le) => {
              const el            = street.elements.find((e) => e.id === le.id)!;
              const def           = getElementDef(el.type);
              const isBuilding    = el.type === "BUILDING_LEFT" || el.type === "BUILDING_RIGHT";
              const isHighlighted = highlightedIds.includes(el.id);

              if (isBuilding && el.building) {
                const floorH         = 3 * layout.scale;
                const totalBuildingH = el.building.floors.length * floorH;
                return (
                  <g key={el.id}>
                    {/* ground band strip */}
                    <rect
                      x={le.x} y={GROUND_Y}
                      width={le.widthPx} height={BAND_H}
                      fill={showColor ? (def.defaultStyle.fill) : "#ffffff"}
                      stroke="#6b7280" strokeWidth={1}
                    />
                    {/* floors rising upward — floor 0 = ground floor = bottom */}
                    {el.building.floors.map((floor, i) => {
                      const floorY = GROUND_Y - (i + 1) * floorH;
                      return (
                        <g key={i}>
                          <rect
                            x={le.x} y={floorY}
                            width={le.widthPx} height={floorH}
                            fill={showColor ? (FLOOR_COLORS[floor.use] ?? "#e5e7eb") : "#ffffff"}
                            stroke="#6b7280" strokeWidth={0.5}
                          />
                          {showNames && floorH > 14 && (
                            <text
                              x={le.x + le.widthPx / 2} y={floorY + floorH / 2}
                              textAnchor="middle" dominantBaseline="middle"
                              fontSize={Math.min(9, le.widthPx / 6)} fill="#374151"
                              transform={le.widthPx < 50 ? `rotate(-90,${le.x + le.widthPx / 2},${floorY + floorH / 2})` : undefined}
                            >
                              {floor.use}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    {isHighlighted && (
                      <rect
                        x={le.x} y={GROUND_Y - totalBuildingH}
                        width={le.widthPx} height={totalBuildingH + BAND_H}
                        fill="none" stroke="#ef4444" strokeWidth={2}
                      />
                    )}
                  </g>
                );
              }

              // Street element — just the ground band
              const mergedStyle = { ...def.defaultStyle, ...el.style };
              const fill        = showColor ? mergedStyle.fill   : "#ffffff";
              const stroke      = showColor ? mergedStyle.stroke : "#333333";
              return (
                <g key={el.id}>
                  <rect
                    x={le.x} y={GROUND_Y}
                    width={le.widthPx} height={BAND_H}
                    fill={fill} stroke={stroke} strokeWidth={1}
                  />
                  {isHighlighted && (
                    <rect
                      x={le.x} y={GROUND_Y}
                      width={le.widthPx} height={BAND_H}
                      fill="none" stroke="#ef4444" strokeWidth={2}
                    />
                  )}
                </g>
              );
            })}

            {/* Annotation zone — tick + name + measurement per element */}
            {layout.elements.map((le) => {
              const el        = street.elements.find((e) => e.id === le.id)!;
              if (el.type === "BUILDING_LEFT" || el.type === "BUILDING_RIGHT") return null;
              const def       = getElementDef(el.type);
              const cx        = le.x + le.widthPx / 2;
              const tickY1    = GROUND_Y + BAND_H;
              const tickY2    = tickY1 + 6;
              const nameY     = tickY2 + 13;
              const measureY  = nameY + 14;
              const tooNarrow = le.widthPx < 20;

              return (
                <g key={`ann-${el.id}`}>
                  {!tooNarrow && <line x1={cx} y1={tickY1} x2={cx} y2={tickY2} stroke="#9ca3af" strokeWidth={1} />}
                  {!tooNarrow && showNames && (
                    <text
                      x={cx} y={nameY}
                      textAnchor="middle" fontSize={9} fill="#374151"
                    >
                      {def.label[lang]}
                    </text>
                  )}
                  {!tooNarrow && showMeasure && (
                    <text
                      x={cx} y={measureY}
                      textAnchor="middle" fontSize={9} fill="#6b7280"
                    >
                      {el.width_m.toFixed(2)} m
                    </text>
                  )}
                </g>
              );
            })}

            {/* Vertical separator lines between elements on the ground band */}
            {layout.elements.map((le) => (
              <line
                key={`sep-${le.id}`}
                x1={le.x} y1={GROUND_Y}
                x2={le.x} y2={GROUND_Y + BAND_H}
                stroke="#6b7280" strokeWidth={0.5}
              />
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}
