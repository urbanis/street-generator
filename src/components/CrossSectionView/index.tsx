import { useState, useRef, useEffect } from "react";
import { useLang, useT } from "../../i18n";
import type { TranslationKey } from "../../i18n";
import type { StreetConfig } from "../../models/street";
import { getElementDef } from "../../elements/registry";
import { computeLayout, BAND_H, ANN_H, ROAD_OFFSET_M } from "./renderer";
import { getFigureVariants } from "../../figures/registry";
import { CROSS_SECTION_VIEW, CSV_HEADER, CSV_CONTROLS, CSV_SVG_WRAP } from "./styles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, FileDown, FileUp, Share2, Check, Trash2, Palette, Type, Ruler, PersonStanding, Sparkles } from "lucide-react";
import { AIModal } from "../AIModal";
import { capture } from "../../lib/analytics";

export interface ThemeFlags {
  showColor:   boolean;
  showLabels:  boolean;
  showMeasure: boolean;
}

export const DEFAULT_THEME_FLAGS: ThemeFlags = {
  showColor:   false,
  showLabels:  true,
  showMeasure: true,
};

const FLOOR_COLORS: Record<string, string> = {
  Wohnen:     "#EDE8C0",
  Gewerbe:    "#E4B8B4",
  Gemischt:   "#E4CDB0",
  Öffentlich: "#D8D9D5",
};

const FLOOR_USE_I18N_KEY: Record<string, string> = {
  Wohnen:     "floorUseWohnen",
  Gewerbe:    "floorUseGewerbe",
  Gemischt:   "floorUseGemischt",
  Öffentlich: "floorUseOffentlich",
};

function wrapLabel(text: string, maxWidthPx: number, fontSize: number): string[] {
  const avgCharW = fontSize * 0.55;
  const maxChars = Math.max(1, Math.floor(maxWidthPx / avgCharW));
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word.length > maxChars ? word.slice(0, maxChars) : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface CrossSectionViewProps {
  street:           StreetConfig;
  showAllFigures:         boolean;
  onShowAllFiguresChange: (v: boolean) => void;
  theme:                  ThemeFlags;
  onThemeChange:          (flags: ThemeFlags) => void;
  onStreetImport:   (street: StreetConfig) => void;
  onShare:          () => void;
  shareCopied:      boolean;
  onClear:          () => void;
  onAiGenerate:     (generated: StreetConfig) => void;
  darkMode?:        boolean;
}

export function CrossSectionView({ street, showAllFigures, onShowAllFiguresChange, theme, onThemeChange, onStreetImport, onShare, shareCopied, onClear, onAiGenerate, darkMode = false }: CrossSectionViewProps) {
  const lang                                   = useLang();
  const t                                      = useT();
  const [zoom, setZoom]                        = useState(1);
  const [isPanning, setIsPanning]              = useState(false);
  const [aiModalOpen, setAiModalOpen]          = useState(false);
  const [exportOpen, setExportOpen]            = useState(false);
  const [exportPos, setExportPos]              = useState<{ top: number; right: number } | null>(null);
  const svgRef                                 = useRef<SVGSVGElement>(null);
  const wrapRef                                = useRef<HTMLDivElement>(null);
  const exportBtnRef                           = useRef<HTMLDivElement>(null);
  const panStartRef                            = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  const { showColor, showLabels: showNames, showMeasure } = theme;

  // SVG color palette — adapts to dark mode
  const C = darkMode ? {
    elementFill:    "#1e1e1e",
    elementStroke:  "#888888",
    buildingStroke: "#555555",
    textDark:       "#d1d5db",
    textMuted:      "#9ca3af",
    annotationLine: "#555555",
    separator:      "#555555",
  } : {
    elementFill:    "#ffffff",
    elementStroke:  "#333333",
    buildingStroke: "#6b7280",
    textDark:       "#374151",
    textMuted:      "#6b7280",
    annotationLine: "#9ca3af",
    separator:      "#6b7280",
  };

  const layout          = computeLayout(street);
  const W               = layout.totalWidthPx;
  const NAME_H          = (street.name ? 18 : 0) + (street.subtitle ? 14 : 0);
  const GROUND_Y        = NAME_H + layout.skyH;
  const roadOffsetPx    = ROAD_OFFSET_M * layout.scale;
  const SVG_H           = GROUND_Y + roadOffsetPx + BAND_H + ANN_H;

  function isRoadLevel(type: string) {
    return type === "TRAFFIC_LANE" || type === "PARKING_LANE" || type === "BUS_LANE" || type === "CYCLE_LANE_ROAD";
  }

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const s = JSON.parse(reader.result as string) as StreetConfig;
          onStreetImport(s);
        } catch { alert("Invalid JSON file"); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function handlePanStart(e: React.MouseEvent<HTMLDivElement>) {
    if (!wrapRef.current) return;
    panStartRef.current = { x: e.clientX, y: e.clientY, scrollLeft: wrapRef.current.scrollLeft, scrollTop: wrapRef.current.scrollTop };
    setIsPanning(true);
    e.preventDefault();
  }

  function handlePanMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!panStartRef.current || !wrapRef.current) return;
    wrapRef.current.scrollLeft = panStartRef.current.scrollLeft - (e.clientX - panStartRef.current.x);
    wrapRef.current.scrollTop  = panStartRef.current.scrollTop  - (e.clientY - panStartRef.current.y);
  }

  function handlePanEnd() {
    setIsPanning(false);
    panStartRef.current = null;
  }

  function fit() {
    if (!wrapRef.current || W === 0) return;
    const { clientWidth, clientHeight } = wrapRef.current;
    const padding = 32;
    const z = Math.min((clientWidth - padding) / W, (clientHeight - padding) / SVG_H);
    setZoom(Math.max(0.1, Math.min(z, 5)));
  }

  async function inlineImages(svgEl: SVGSVGElement): Promise<void> {
    const images = svgEl.querySelectorAll("image");
    await Promise.all(Array.from(images).map(async (img) => {
      const href = img.getAttribute("href") || img.getAttribute("xlink:href");
      if (!href || href.startsWith("data:")) return;
      try {
        const buf   = await fetch(href).then((r) => r.arrayBuffer());
        const bytes = new Uint8Array(buf);
        let binary  = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const b64  = btoa(binary);
        const mime = href.endsWith(".svg") ? "image/svg+xml" : "image/png";
        img.setAttribute("href", `data:${mime};base64,${b64}`);
      } catch { /* skip if fetch fails */ }
    }));
  }

  function triggerDownload(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function lightifyExportSvg(svgEl: SVGSVGElement): string {
    let s = new XMLSerializer().serializeToString(svgEl);
    if (darkMode) {
      // Strip dark-mode figure filter so figures export in original colors
      s = s.replace(/\s*filter="url\(#fig-dark\)"/g, "");
      // Replace dark-mode palette colors with light equivalents
      s = s
        .replace(/#1e1e1e/gi, "#ffffff")
        .replace(/#888888/gi, "#333333")
        .replace(/#555555/gi, "#6b7280")
        .replace(/#d1d5db/gi, "#374151")
        .replace(/#9ca3af/gi, "#6b7280");
    }
    return s;
  }

  async function exportSvg() {
    if (!svgRef.current) return;
    const svgEl = svgRef.current.cloneNode(true) as SVGSVGElement;
    await inlineImages(svgEl);
    // Always export with white background regardless of dark mode
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("x", "0"); bg.setAttribute("y", "0");
    bg.setAttribute("width", String(W || 400)); bg.setAttribute("height", String(SVG_H));
    bg.setAttribute("fill", "white");
    svgEl.insertBefore(bg, svgEl.firstChild);
    const blob = new Blob([lightifyExportSvg(svgEl)], { type: "image/svg+xml" });
    const url  = URL.createObjectURL(blob);
    triggerDownload(url, `${street.name || "street"}.svg`);
    URL.revokeObjectURL(url);
    capture("export", { format: "svg" });
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(street, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    triggerDownload(url, `${street.name || "street"}.json`);
    URL.revokeObjectURL(url);
    capture("export", { format: "json" });
  }

  async function exportPng() {
    if (!svgRef.current) return;
    const SCALE = 3;
    const svgEl = svgRef.current.cloneNode(true) as SVGSVGElement;
    await inlineImages(svgEl);
    svgEl.setAttribute("width",  String(W || 400));
    svgEl.setAttribute("height", String(SVG_H));

    // White background rect
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("x", "0"); bg.setAttribute("y", "0");
    bg.setAttribute("width", String(W || 400)); bg.setAttribute("height", String(SVG_H));
    bg.setAttribute("fill", "white");
    svgEl.insertBefore(bg, svgEl.firstChild);

    // Embed font so it renders correctly when SVG is drawn to canvas
    let fontCss = `text { font-family: "itc-avant-garde-gothic-pro", Arial, sans-serif; font-weight: 300; }`;
    try {
      const cssText = await fetch("https://use.typekit.net/wld0zjn.css").then((r) => r.text());
      const blockRx = /@font-face\s*\{([^}]+)\}/g;
      let m: RegExpExecArray | null;
      while ((m = blockRx.exec(cssText)) !== null) {
        const block = m[1];
        if (!block.includes("itc-avant-garde-gothic-pro")) continue;
        if (!block.match(/font-weight\s*:\s*300/)) continue;
        const urlMatch = block.match(/url\("([^"]+)"\)\s*format\("woff2"\)/);
        if (!urlMatch) continue;
        const fontBuf = await fetch(urlMatch[1]).then((r) => r.arrayBuffer());
        const bytes = new Uint8Array(fontBuf);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const b64 = btoa(binary);
        fontCss = `@font-face { font-family: "itc-avant-garde-gothic-pro"; font-weight: 300; src: url("data:font/woff2;base64,${b64}") format("woff2"); } text { font-family: "itc-avant-garde-gothic-pro", Arial, sans-serif; font-weight: 300; }`;
        break;
      }
    } catch { /* fall back to system font */ }

    let defs = svgEl.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svgEl.insertBefore(defs, svgEl.firstChild);
    }
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = fontCss;
    defs.appendChild(style);

    const canvas = document.createElement("canvas");
    canvas.width  = (W || 400) * SCALE;
    canvas.height = SVG_H * SCALE;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(SCALE, SCALE);

    const svgBlob = new Blob([lightifyExportSvg(svgEl)], { type: "image/svg+xml" });
    const imgSrc  = URL.createObjectURL(svgBlob);
    const img     = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(imgSrc);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `${street.name || "street"}.png`);
        URL.revokeObjectURL(url);
        capture("export", { format: "png" });
      }, "image/png");
    };
    img.src = imgSrc;
  }

  return (
    <div className={CROSS_SECTION_VIEW}>
      <div className={CSV_HEADER}>
        <div className={CSV_CONTROLS}>
          {/* Trash — far left */}
          <Button variant="ghost" size="sm" className="h-9 w-9 md:h-7 md:w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive" onClick={onClear} title={t("clearDrawing")} aria-label={t("clearDrawing")}>
            <Trash2 size={14} />
          </Button>

          {/* Theme toggles — color / labels / measures */}
          <div className="flex items-center gap-0.5 border border-border rounded shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-9 w-9 md:h-7 md:w-7 p-0", theme.showColor && "bg-accent text-accent-foreground")}
              onClick={() => onThemeChange({ ...theme, showColor: !theme.showColor })}
              title={t("themeColor")}
              aria-pressed={theme.showColor}
            >
              <Palette size={12} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-9 w-9 md:h-7 md:w-7 p-0", theme.showLabels && "bg-accent text-accent-foreground")}
              onClick={() => onThemeChange({ ...theme, showLabels: !theme.showLabels })}
              title={t("themeLabels")}
              aria-pressed={theme.showLabels}
            >
              <Type size={12} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-9 w-9 md:h-7 md:w-7 p-0", theme.showMeasure && "bg-accent text-accent-foreground")}
              onClick={() => onThemeChange({ ...theme, showMeasure: !theme.showMeasure })}
              title={t("themeMeasures")}
              aria-pressed={theme.showMeasure}
            >
              <Ruler size={12} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-9 w-9 md:h-7 md:w-7 p-0", showAllFigures && "bg-accent text-accent-foreground")}
              onClick={() => onShowAllFiguresChange(!showAllFigures)}
              title={t("figures")}
              aria-pressed={showAllFigures}
            >
              <PersonStanding size={12} />
            </Button>
          </div>

          {/* AI generate — standalone action button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 md:h-7 md:w-7 p-0 shrink-0"
            onClick={() => setAiModalOpen(true)}
            title={t("generateStreet")}
            aria-label={t("generateStreet")}
          >
            <Sparkles size={12} />
          </Button>

          {/* Left spacer — pushes zoom to center (desktop only) */}
          <div className="hidden md:block flex-1" />

          {/* Zoom controls — center */}
          <div className="flex items-center gap-0.5 border border-border rounded shrink-0">
            <Button variant="ghost" size="sm" className="hidden md:flex h-9 w-9 md:h-7 md:w-7 p-0" onClick={() => setZoom((z) => Math.min(z * 1.25, 5))} title={lang === "de" ? "Vergrößern" : "Zoom in"}><ZoomIn size={12} /></Button>
            <Button variant="ghost" size="sm" className="h-9 px-2 md:h-7 md:px-1.5 text-xs" onClick={fit} title={t("fitMap")}><Maximize2 size={11} /></Button>
            <Button variant="ghost" size="sm" className="hidden md:flex h-9 w-9 md:h-7 md:w-7 p-0" onClick={() => setZoom((z) => Math.max(z * 0.8, 0.1))} title={lang === "de" ? "Verkleinern" : "Zoom out"}><ZoomOut size={12} /></Button>
          </div>

          {/* Right group — import, share, download */}
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-9 w-9 md:h-7 md:w-7 p-0 shrink-0" onClick={handleImport} title={t("importJson")} aria-label={t("importJson")}>
              <FileUp size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 md:h-7 md:w-7 p-0 shrink-0" onClick={onShare} title={shareCopied ? t("copied") : t("share")} aria-label={t("share")}>
              {shareCopied ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />}
            </Button>
            {/* Export — custom dropdown, dark-mode friendly */}
            <div className="relative shrink-0" data-tour="export-btn" ref={exportBtnRef}>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 md:h-7 md:w-7 p-0"
                title={t("exportLabel")}
                onClick={() => {
                  if (!exportBtnRef.current) return;
                  const rect = exportBtnRef.current.getBoundingClientRect();
                  setExportPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                  setExportOpen((o) => !o);
                }}
              >
                <FileDown size={14} />
              </Button>
              {exportOpen && exportPos && (
                <>
                  <div className="fixed inset-0 z-[1500]" onClick={() => setExportOpen(false)} />
                  <div
                    className="fixed z-[1501] min-w-[80px] rounded border border-border bg-background shadow-md"
                    style={{ top: exportPos.top, right: exportPos.right }}
                  >
                    {(["PNG", "SVG", "JSON"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        className="block w-full px-3 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          setExportOpen(false);
                          if (fmt === "PNG") exportPng();
                          else if (fmt === "SVG") exportSvg();
                          else exportJson();
                        }}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={wrapRef}
        className={CSV_SVG_WRAP}
        data-tour="cross-section"
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
      >
        {W === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
            {t("noElements")}
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
            {darkMode && (
              <defs>
                {/* Invert colors + reduce alpha: white body→transparent black, black strokes→muted white */}
                <filter id="fig-dark">
                  <feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 0.45 0" />
                </filter>
              </defs>
            )}
            {/* Street name + subtitle */}
            {street.name && (
              <text x={W / 2} y={12} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="600" fill={C.textDark}>
                {street.name}
              </text>
            )}
            {street.subtitle && (
              <text x={W / 2} y={(street.name ? 18 : 0) + 7} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill={C.textMuted}>
                {street.subtitle}
              </text>
            )}

            {/* Elements — ground band + buildings above */}
            {layout.elements.map((le) => {
              const el            = street.elements.find((e) => e.id === le.id)!;
              const def           = getElementDef(el.type);
              const isBuilding = el.type === "BUILDING_LEFT" || el.type === "BUILDING_RIGHT";

              if (isBuilding && el.building) {
                const floorH = 3 * layout.scale;
                return (
                  <g key={el.id}>
                    {/* ground band strip */}
                    <rect
                      x={le.x} y={GROUND_Y}
                      width={le.widthPx} height={BAND_H}
                      fill={showColor ? def.defaultStyle.fill : C.elementFill}
                      stroke={C.buildingStroke} strokeWidth={0.5}
                    />
                    {/* floors rising upward — floor 0 = ground floor = bottom */}
                    {el.building.floors.map((floor, i) => {
                      const floorY = GROUND_Y - (i + 1) * floorH;
                      return (
                        <g key={i}>
                          <rect
                            x={le.x} y={floorY}
                            width={le.widthPx} height={floorH}
                            fill={showColor ? (FLOOR_COLORS[floor.use] ?? "#e5e7eb") : C.elementFill}
                            stroke={C.buildingStroke} strokeWidth={0.5}
                          />
                          {showNames && floorH > 14 && (
                            <text
                              x={le.x + le.widthPx / 2} y={floorY + floorH / 2}
                              textAnchor="middle" dominantBaseline="middle"
                              fontSize={Math.min(9, le.widthPx / 6)} fill={showColor ? "#374151" : C.textDark}
                              transform={le.widthPx < 50 ? `rotate(-90,${le.x + le.widthPx / 2},${floorY + floorH / 2})` : undefined}
                            >
                              {t((FLOOR_USE_I18N_KEY[floor.use] ?? floor.use) as TranslationKey)}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              }

              // Street element — just the ground band
              const mergedStyle = { ...def.defaultStyle, ...el.style };
              const fill        = showColor ? mergedStyle.fill   : C.elementFill;
              const stroke      = showColor ? mergedStyle.stroke : C.elementStroke;
              const bandY       = GROUND_Y + (isRoadLevel(el.type) ? roadOffsetPx : 0);
              const bandH       = isRoadLevel(el.type) ? BAND_H - roadOffsetPx : BAND_H;
              return (
                <g key={el.id}>
                  <rect
                    x={le.x} y={bandY}
                    width={le.widthPx} height={bandH}
                    fill={fill} stroke={stroke} strokeWidth={0.5}
                  />

                </g>
              );
            })}

            {/* Figure rendering pass — line-art figures above ground band */}
            {showAllFigures && layout.elements.map((le) => {
              const el = street.elements.find((e) => e.id === le.id)!;
              if (!el.figure?.show) return null;
              if (le.widthPx < 1.5 * layout.scale) return null; // too narrow
              const variants = getFigureVariants(el.type);
              if (!variants) return null;
              const variant = variants.find((v) => v.id === el.figure!.variant) ?? variants[0];
              if (!variant) return null;
              return (
                <g key={`fig-${le.id}`} filter={darkMode ? "url(#fig-dark)" : undefined}>
                  {variant.renderSVG({
                    cx:       le.x + le.widthPx / 2,
                    groundY:  GROUND_Y + (isRoadLevel(el.type) ? roadOffsetPx : 0),
                    widthPx:  le.widthPx,
                    scale:    layout.scale,
                    height_m: el.figure.height_m,
                  })}
                </g>
              );
            })}

            {/* Annotation zone — engineering dimension lines */}
            {(() => {
              const maxBandBottom = GROUND_Y + roadOffsetPx + BAND_H;
              const TICK_H        = 14; // vertical tick height
              const dimLineY      = maxBandBottom + TICK_H;
              const labelY        = dimLineY + 12;
              const totalLineY    = dimLineY + 46;

              const streetEls = layout.elements.filter((le) => {
                const el = street.elements.find((e) => e.id === le.id)!;
                return el.type !== "BUILDING_LEFT" && el.type !== "BUILDING_RIGHT";
              });
              const totalX1      = streetEls.length > 0 ? streetEls[0].x : 0;
              const totalX2      = streetEls.length > 0 ? streetEls[streetEls.length - 1].x + streetEls[streetEls.length - 1].widthPx : W;
              const totalWidth_m = street.elements
                .filter((e) => e.type !== "BUILDING_LEFT" && e.type !== "BUILDING_RIGHT")
                .reduce((s, e) => s + e.width_m, 0);

              return (
                <>
                  {layout.elements.map((le) => {
                    const el           = street.elements.find((e) => e.id === le.id)!;
                    if (el.type === "BUILDING_LEFT" || el.type === "BUILDING_RIGHT") return null;
                    const def          = getElementDef(el.type);
                    const cx           = le.x + le.widthPx / 2;
                    const tooNarrow    = le.widthPx < 20;
                    const elBandBottom = GROUND_Y + (isRoadLevel(el.type) ? roadOffsetPx : 0) + BAND_H;
                    return (
                      <g key={`ann-${el.id}`}>
                        {/* Dimension lines — only when measures are visible */}
                        {showMeasure && (<>
                          <line x1={le.x}              y1={elBandBottom} x2={le.x}              y2={dimLineY} stroke={C.annotationLine} strokeWidth={0.5} />
                          <line x1={le.x + le.widthPx} y1={elBandBottom} x2={le.x + le.widthPx} y2={dimLineY} stroke={C.annotationLine} strokeWidth={0.5} />
                          <line x1={le.x} y1={dimLineY} x2={le.x + le.widthPx} y2={dimLineY} stroke={C.annotationLine} strokeWidth={0.5} />
                        </>)}
                        {/* Measurement — above dim line */}
                        {!tooNarrow && showMeasure && (
                          <text x={cx} y={dimLineY - 3} textAnchor="middle" dominantBaseline="auto" fontSize={8} fill={C.textMuted}>
                            {el.width_m.toFixed(2)} m
                          </text>
                        )}
                        {/* Label — below dim line, wrapped */}
                        {!tooNarrow && showNames && (() => {
                          const label    = el.label || def.label[lang];
                          const fontSize = 8;
                          const lineH    = fontSize + 2;
                          const lines    = wrapLabel(label, le.widthPx - 4, fontSize);
                          return (
                            <text x={cx} y={labelY} textAnchor="middle" dominantBaseline="hanging" fontSize={fontSize} fill={C.textDark}>
                              {lines.map((line, i) => (
                                <tspan key={i} x={cx} dy={i === 0 ? 0 : lineH}>{line}</tspan>
                              ))}
                            </text>
                          );
                        })()}
                      </g>
                    );
                  })}

                  {/* Total street width dimension line */}
                  {showMeasure && streetEls.length > 0 && (
                    <g>
                      <line x1={totalX1} y1={totalLineY} x2={totalX2} y2={totalLineY} stroke={C.separator} strokeWidth={0.5} />
                      <line x1={totalX1} y1={totalLineY - 5} x2={totalX1} y2={totalLineY + 5} stroke={C.separator} strokeWidth={0.5} />
                      <line x1={totalX2} y1={totalLineY - 5} x2={totalX2} y2={totalLineY + 5} stroke={C.separator} strokeWidth={0.5} />
                      <text x={(totalX1 + totalX2) / 2} y={totalLineY - 3} textAnchor="middle" dominantBaseline="auto" fontSize={8} fill={C.textMuted}>
                        {totalWidth_m.toFixed(2)} m
                      </text>
                    </g>
                  )}
                </>
              );
            })()}

            {/* Vertical separator lines between elements on the ground band */}
            {layout.elements.map((le) => {
              const el     = street.elements.find((e) => e.id === le.id)!;
              const bandY  = GROUND_Y + (isRoadLevel(el.type) ? roadOffsetPx : 0);
              return (
                <line
                  key={`sep-${le.id}`}
                  x1={le.x} y1={bandY}
                  x2={le.x} y2={bandY + BAND_H}
                  stroke={C.separator} strokeWidth={0.5}
                />
              );
            })}
          </svg>
        )}
      </div>
      {aiModalOpen && (
        <AIModal
          lang={lang}
          onGenerate={(s) => { onAiGenerate(s); setAiModalOpen(false); }}
          onClose={() => setAiModalOpen(false)}
        />
      )}
    </div>
  );
}
