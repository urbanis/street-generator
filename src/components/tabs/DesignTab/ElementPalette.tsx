import type { ElementType } from "../../../models/street";
import { useLang } from "../../../i18n";
import { REGISTRY } from "../../../elements/registry";
import { PALETTE_GRID, PALETTE_BUTTON } from "./styles";

interface ElementPaletteProps {
  onAdd:          (type: ElementType) => void;
  existingTypes?: ElementType[];
}

export function ElementPalette({ onAdd, existingTypes = [] }: ElementPaletteProps) {
  const lang = useLang();

  return (
    <div className={PALETTE_GRID}>
      {REGISTRY.map((def) => {
        const Icon       = def.icon;
        const isBuilding = def.type === "BUILDING_LEFT" || def.type === "BUILDING_RIGHT";
        const disabled   = isBuilding && existingTypes.includes(def.type);
        return (
          <button
            key={def.type}
            className={`${PALETTE_BUTTON} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            onClick={() => !disabled && onAdd(def.type)}
            disabled={disabled}
            title={disabled ? (lang === "de" ? "Bereits vorhanden" : "Already added") : undefined}
          >
            <Icon size={16} />
            <span>{def.label[lang]}</span>
          </button>
        );
      })}
    </div>
  );
}
