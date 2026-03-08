import { useId, useRef } from "react";
import { ChevronUp, ChevronDown, X, GripVertical } from "lucide-react";
import type { StreetElement, ElementType, Side } from "../../../models/street";
import { useT } from "../../../i18n";
import type { TranslationKey } from "../../../i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getElementDef, REGISTRY } from "../../../elements/registry";
import { CARD_BASE, CARD_DRAG_OVER, CARD_HIGHLIGHTED, CARD_DEFAULT, GRIP } from "./styles";

const SIDES: Side[] = ["LEFT", "CENTER", "RIGHT"];

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
        <Select value={element.type} onValueChange={(v) => onChange({ ...element, type: v as ElementType })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REGISTRY.map((def) => (
              <SelectItem key={def.type} value={def.type}>
                {t(def.type as TranslationKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <Label htmlFor={widthId} className="shrink-0 text-xs">{t("widthLabel")}</Label>
          <Input
            id={widthId}
            type="number"
            className="w-16 h-7 text-xs"
            value={element.width_m}
            min={0.1} max={20} step={0.05}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onChange({ ...element, width_m: isNaN(val) ? 0 : val });
            }}
          />
          <span className="text-xs text-muted-foreground shrink-0">m</span>
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
        </div>

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
