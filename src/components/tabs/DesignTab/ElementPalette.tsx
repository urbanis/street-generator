import type { ElementType } from "../../../models/street";
import { useLang } from "../../../i18n";
import { REGISTRY } from "../../../elements/registry";
import { PALETTE_GRID, PALETTE_BUTTON } from "./styles";

interface ElementPaletteProps {
  onAdd: (type: ElementType) => void;
}

export function ElementPalette({ onAdd }: ElementPaletteProps) {
  const lang = useLang();

  return (
    <div className={PALETTE_GRID}>
      {REGISTRY.map((def) => {
        const Icon = def.icon;
        return (
          <button key={def.type} className={PALETTE_BUTTON} onClick={() => onAdd(def.type)}>
            <Icon size={16} color={def.defaultStyle.fill === "#d1d5db" ? "#6b7280" : def.defaultStyle.stroke} />
            <span>{def.label[lang]}</span>
          </button>
        );
      })}
    </div>
  );
}
