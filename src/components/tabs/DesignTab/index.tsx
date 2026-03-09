import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { StreetConfig, StreetElement, ElementType } from "../../../models/street";
import { useT } from "../../../i18n";
import { getElementDef } from "../../../elements/registry";
import { ElementCard } from "./ElementCard";
import { ElementPalette } from "./ElementPalette";
import { DESIGN_TAB, DISCLAIMER, ELEMENT_LIST, EMPTY_STATE } from "./styles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DesignTabProps {
  street: StreetConfig;
  onStreetChange: (street: StreetConfig) => void;
  highlightedIds: string[];
  osmDisclaimer: boolean;
  onClearOsmDisclaimer: () => void;
}

function sortBuildingsToEdges(elements: StreetElement[]): StreetElement[] {
  const left   = elements.filter((e) => e.type === "BUILDING_LEFT");
  const middle = elements.filter((e) => e.type !== "BUILDING_LEFT" && e.type !== "BUILDING_RIGHT");
  const right  = elements.filter((e) => e.type === "BUILDING_RIGHT");
  return [...left, ...middle, ...right];
}

export function DesignTab({ street, onStreetChange, highlightedIds, osmDisclaimer, onClearOsmDisclaimer }: DesignTabProps) {
  const t = useT();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function updateElement(index: number, updated: StreetElement) {
    const elements = [...street.elements];
    elements[index] = updated;
    onStreetChange({ ...street, elements });
  }

  function removeElement(index: number) {
    const elements = street.elements.filter((_, i) => i !== index);
    onStreetChange({ ...street, elements });
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const elements = [...street.elements];
    [elements[index - 1], elements[index]] = [elements[index], elements[index - 1]];
    onStreetChange({ ...street, elements });
  }

  function moveDown(index: number) {
    if (index === street.elements.length - 1) return;
    const elements = [...street.elements];
    [elements[index], elements[index + 1]] = [elements[index + 1], elements[index]];
    onStreetChange({ ...street, elements });
  }

  function addElement(type: ElementType) {
    const def = getElementDef(type);
    const isBuilding = type === "BUILDING_LEFT" || type === "BUILDING_RIGHT";
    if (isBuilding && street.elements.some((e) => e.type === type)) return;
    const newEl: StreetElement = {
      id:       crypto.randomUUID(),
      type,
      side:     "LEFT",
      width_m:  def.defaultWidth_m,
      building: isBuilding
        ? { floors: [
            { use: "Wohnen", height_m: 3 },
            { use: "Wohnen", height_m: 3 },
            { use: "Wohnen", height_m: 3 },
          ]}
        : undefined,
    };
    const elements = sortBuildingsToEdges([...street.elements, newEl]);
    onStreetChange({ ...street, elements });
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const elements = [...street.elements];
    const [moved] = elements.splice(dragIndex, 1);
    elements.splice(targetIndex, 0, moved);
    onStreetChange({ ...street, elements });
    setDragIndex(null);
    setDragOverIndex(null);
  }

  return (
    <div className={DESIGN_TAB}>
      {osmDisclaimer && (
        <div className={DISCLAIMER}>
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span className="flex-1">{t("osmDisclaimer")}</span>
          <button onClick={onClearOsmDisclaimer} className="shrink-0">
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Label className="text-xs">{t("streetName")}</Label>
        <Input
          className="h-7 text-xs"
          placeholder={t("streetNamePlaceholder")}
          value={street.name}
          onChange={(e) => onStreetChange({ ...street, name: e.target.value })}
        />
      </div>

      <div className="border-b border-border pb-2">
        <p className="text-xs text-muted-foreground mb-1.5">{t("addElement")}</p>
        <ElementPalette
          onAdd={addElement}
          existingTypes={street.elements.map((e) => e.type)}
        />
      </div>

      <div className={ELEMENT_LIST}>
        {street.elements.length === 0 ? (
          <div className={EMPTY_STATE}>{t("noElements")}</div>
        ) : (
          street.elements.map((el, i) => (
            <ElementCard
              key={el.id}
              element={el}
              index={i}
              total={street.elements.length}
              isHighlighted={highlightedIds.includes(el.id)}
              isDragOver={dragOverIndex === i}
              onChange={(updated) => updateElement(i, updated)}
              onMoveUp={() => moveUp(i)}
              onMoveDown={() => moveDown(i)}
              onRemove={() => removeElement(i)}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
            />
          ))
        )}
      </div>

    </div>
  );
}
