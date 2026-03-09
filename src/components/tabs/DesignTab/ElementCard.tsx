import { useId, useRef } from "react";
import { ChevronUp, ChevronDown, X, GripVertical } from "lucide-react";
import type { StreetElement, ElementType, Side, FloorUse } from "../../../models/street";
import { useT, useLang } from "../../../i18n";
import type { TranslationKey } from "../../../i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getElementDef, REGISTRY } from "../../../elements/registry";
import { CARD_BASE, CARD_DRAG_OVER, CARD_HIGHLIGHTED, CARD_DEFAULT, GRIP } from "./styles";

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
  element, index, total, isHighlighted, isDragOver,
  onChange, onMoveUp, onMoveDown, onRemove,
  onDragStart, onDragOver, onDrop, onDragEnd,
}: ElementCardProps) {
  const widthId = useId();
  const t = useT();
  const cardRef = useRef<HTMLDivElement>(null);
  const def = getElementDef(element.type);
  const lang       = useLang();
  const isBuilding = element.type === "BUILDING_LEFT" || element.type === "BUILDING_RIGHT";
  const Icon = def.icon;
  const mergedStyle = { ...def.defaultStyle, ...element.style };

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
      <div
        className={GRIP}
        onMouseDown={() => { if (cardRef.current) cardRef.current.draggable = true; }}
        onMouseUp={() => { if (cardRef.current) cardRef.current.draggable = false; }}
      >
        <GripVertical size={14} />
      </div>

      <div className="flex items-center shrink-0">
        <Icon size={16} color={mergedStyle.stroke} />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        {/* Type selector — non-buildings only */}
        {!isBuilding && (
          <Select value={element.type} onValueChange={(v) => onChange({ ...element, type: v as ElementType })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGISTRY.filter((d) => d.type !== "BUILDING_LEFT" && d.type !== "BUILDING_RIGHT").map((def) => (
                <SelectItem key={def.type} value={def.type}>
                  {t(def.type as TranslationKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Width — always shown */}
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
              Fill
              <input
                type="color"
                className="h-5 w-8 cursor-pointer rounded border-none p-0"
                value={mergedStyle.fill}
                onChange={(e) => onChange({ ...element, style: { ...mergedStyle, fill: e.target.value } })}
              />
            </label>
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              Stroke
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
      </div>

      <div className="flex flex-col gap-0.5 shrink-0">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp} disabled={index === 0}>
          <ChevronUp size={14} />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown} disabled={index === total - 1}>
          <ChevronDown size={14} />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onRemove}>
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}
