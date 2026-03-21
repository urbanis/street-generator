import { useState, useEffect, useId, useRef } from "react";
import { ChevronUp, ChevronDown, ChevronRight, X, GripVertical } from "lucide-react";
import type { StreetElement, ElementType, Side, FloorUse } from "../../../models/street";
import { useT, useLang } from "../../../i18n";
import type { TranslationKey } from "../../../i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getElementDef, REGISTRY } from "../../../elements/registry";
import { getFigureVariants, getDefaultFigureVariant, isTreeVariant } from "../../../figures/registry";
import type { FigureConfig } from "../../../models/street";
import { CARD_BASE, CARD_DRAG_OVER, CARD_HIGHLIGHTED, CARD_DEFAULT, CARD_HEADER, CARD_BODY, GRIP } from "./styles";

const SIDES: Side[] = ["LEFT", "CENTER", "RIGHT"];

const FLOOR_USES: FloorUse[] = ["Wohnen", "Gewerbe", "Gemischt", "Öffentlich"];
const FLOOR_USE_LABELS: Record<FloorUse, { de: string; en: string }> = {
  Wohnen:     { de: "Wohnen",     en: "Residential" },
  Gewerbe:    { de: "Gewerbe",    en: "Commercial" },
  Gemischt:   { de: "Gemischt",   en: "Mixed" },
  Öffentlich: { de: "Öffentlich", en: "Public" },
};

interface ElementCardProps {
  element: StreetElement;
  index: number;
  total: number;
  isHighlighted: boolean;
  isDragOver: boolean;
  forceOpen?: boolean | null;
  onChange: (updated: StreetElement) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

export function ElementCard({
  element, index, total, isHighlighted, isDragOver, forceOpen,
  onChange, onMoveUp, onMoveDown, onRemove,
  onDragStart, onDragOver, onDrop, onDragEnd,
}: ElementCardProps) {
  const widthId                = useId();
  const t                      = useT();
  const lang                   = useLang();
  const cardRef                = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen]    = useState(false);
  const def                    = getElementDef(element.type);
  const isBuilding             = element.type === "BUILDING_LEFT" || element.type === "BUILDING_RIGHT";
  const Icon                   = def.icon;
  const mergedStyle            = { ...def.defaultStyle, ...element.style };

  // Auto-expand when highlighted from the map
  useEffect(() => {
    if (isHighlighted) setIsOpen(true);
  }, [isHighlighted]);

  // Sync with parent expand/collapse all
  useEffect(() => {
    if (forceOpen != null) setIsOpen(forceOpen);
  }, [forceOpen]);

  const cardClass = [
    CARD_BASE,
    isDragOver ? CARD_DRAG_OVER : isHighlighted ? CARD_HIGHLIGHTED : CARD_DEFAULT,
  ].join(" ");

  return (
    <div
      ref={cardRef}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={() => {
        if (cardRef.current) cardRef.current.draggable = false;
        onDragEnd();
      }}
      className={cardClass}
    >
      {/* ── Header ── */}
      <div className={CARD_HEADER}>
        {/* Drag grip */}
        <div
          className={GRIP}
          onMouseDown={() => { if (cardRef.current) cardRef.current.draggable = true; }}
          onMouseUp={() => { if (cardRef.current) cardRef.current.draggable = false; }}
        >
          <GripVertical size={14} />
        </div>

        {/* Element icon */}
        <Icon size={14} className="shrink-0 text-muted-foreground" />

        {/* Type label — editable Select for non-buildings, plain text for buildings */}
        {isBuilding ? (
          <span className="flex-1 min-w-0 text-xs font-medium truncate">
            {def.label[lang]}
          </span>
        ) : (
          <Select key={lang} value={element.type} onValueChange={(v) => onChange({ ...element, type: v as ElementType })}>
            <SelectTrigger className="flex-1 min-w-0 h-auto py-0 border-0 bg-transparent shadow-none text-xs font-medium focus:ring-0 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:shrink-0">
              <SelectValue placeholder={def.label[lang]} />
            </SelectTrigger>
            <SelectContent>
              {REGISTRY.filter((d) => d.type !== "BUILDING_LEFT" && d.type !== "BUILDING_RIGHT").map((d) => (
                <SelectItem key={d.type} value={d.type} className="text-xs">
                  {t(d.type as TranslationKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Width badge */}
        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
          {element.width_m.toFixed(2)} m
        </span>

        {/* Chevron toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 md:h-6 md:w-6 shrink-0"
          onClick={() => setIsOpen((o) => !o)}
        >
          <ChevronRight
            size={12}
            className={`transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
          />
        </Button>

        {/* Up / Down / Delete */}
        <Button variant="ghost" size="icon" className="h-9 w-9 md:h-6 md:w-6 shrink-0" onClick={onMoveUp} disabled={index === 0}>
          <ChevronUp size={12} />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 md:h-6 md:w-6 shrink-0" onClick={onMoveDown} disabled={index === total - 1}>
          <ChevronDown size={12} />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 md:h-6 md:w-6 shrink-0 text-muted-foreground hover:text-destructive" onClick={onRemove}>
          <X size={12} />
        </Button>
      </div>

      {/* ── Body (collapsible) ── */}
      {isOpen && (
        <div className={CARD_BODY}>
          {/* Custom label */}
          <Input
            type="text"
            className="h-7 text-xs"
            placeholder={t("customLabel")}
            value={element.label ?? ""}
            onChange={(e) => onChange({ ...element, label: e.target.value || undefined })}
          />

          {/* Width row */}
          <div className="flex items-center gap-1.5">
            <Label htmlFor={widthId} className="shrink-0 text-xs">{t("widthLabel")}</Label>
            <Input
              id={widthId}
              type="number"
              className="w-16 h-7 text-xs"
              value={element.width_m}
              min={0.1} max={50} step={0.5}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onChange({ ...element, width_m: isNaN(val) ? 0 : val });
              }}
            />
            <span className="text-xs text-muted-foreground shrink-0">m</span>
            {!isBuilding && (
              <Select value={element.side} onValueChange={(v) => onChange({ ...element, side: v as Side })}>
                <SelectTrigger className="flex-1 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIDES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {t(s as TranslationKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Color pickers — non-buildings only */}
          {!isBuilding && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                {t("colorFill")}
                <input
                  type="color"
                  className="h-5 w-8 cursor-pointer rounded border-none p-0"
                  value={mergedStyle.fill}
                  onChange={(e) => onChange({ ...element, style: { ...mergedStyle, fill: e.target.value } })}
                />
              </label>
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                {t("colorStroke")}
                <input
                  type="color"
                  className="h-5 w-8 cursor-pointer rounded border-none p-0"
                  value={mergedStyle.stroke}
                  onChange={(e) => onChange({ ...element, style: { ...mergedStyle, stroke: e.target.value } })}
                />
              </label>
            </div>
          )}

          {/* Floor editor — buildings only */}
          {isBuilding && element.building && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t("floors")} ({element.building.floors.length})</span>
              {element.building.floors.map((floor, fi) => (
                <div key={fi} className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">{element.building!.floors.length - fi}</span>
                  <select
                    className="flex-1 h-6 text-xs rounded border border-input bg-background px-1"
                    value={floor.use}
                    onChange={(e) => {
                      const floors = [...element.building!.floors];
                      floors[fi] = { ...floors[fi], use: e.target.value as FloorUse };
                      onChange({ ...element, building: { ...element.building!, floors } });
                    }}
                  >
                    {FLOOR_USES.map((u) => (
                      <option key={u} value={u}>{FLOOR_USE_LABELS[u][lang]}</option>
                    ))}
                  </select>
                  <button
                    className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      const floors = element.building!.floors.filter((_, i) => i !== fi);
                      onChange({ ...element, building: { ...element.building!, floors } });
                    }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              <button
                className="mt-0.5 h-6 text-xs text-primary hover:underline text-left"
                onClick={() => {
                  const floors = [...element.building!.floors, { use: "Wohnen" as FloorUse, height_m: 3 }];
                  onChange({ ...element, building: { ...element.building!, floors } });
                }}
              >
                + {t("addFloor")}
              </button>
            </div>
          )}

          {/* Figure section — only for element types with figure variants */}
          {(() => {
            const variants = getFigureVariants(element.type);
            if (!variants || variants.length === 0) return null;
            const fig = element.figure;
            const isTree = isTreeVariant(fig?.variant);
            return (
              <div className="flex flex-col gap-1.5 pt-1 border-t border-border">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-border"
                    checked={fig?.show ?? false}
                    onChange={(e) => {
                      const defaultVariant = getDefaultFigureVariant(element.type) ?? variants[0].id;
                      const newFig: FigureConfig = {
                        show:     e.target.checked,
                        variant:  fig?.variant ?? defaultVariant,
                        height_m: fig?.height_m,
                      };
                      onChange({ ...element, figure: newFig });
                    }}
                  />
                  {t("showFigure")}
                </label>

                {fig?.show && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground shrink-0">{t("figureVariant")}</span>
                    <Select
                      value={fig.variant || variants[0].id}
                      onValueChange={(v) => {
                        const isNewTree = isTreeVariant(v);
                        onChange({
                          ...element,
                          figure: {
                            ...fig,
                            variant:  v,
                            height_m: isNewTree ? (fig.height_m ?? 8) : undefined,
                          },
                        });
                      }}
                    >
                      <SelectTrigger className="flex-1 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {variants.map((variant) => (
                          <SelectItem key={variant.id} value={variant.id} className="text-xs">
                            {variant.label[lang]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {fig?.show && isTree && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground shrink-0">{t("figureHeight")}</span>
                    <Input
                      type="number"
                      className="w-16 h-7 text-xs"
                      value={fig.height_m ?? 8}
                      min={2} max={30} step={1}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onChange({
                          ...element,
                          figure: { ...fig, height_m: isNaN(val) ? 8 : val },
                        });
                      }}
                    />
                    <span className="text-xs text-muted-foreground shrink-0">m</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
