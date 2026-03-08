import type { ElementType, ElementStyle } from "../models/street";
import type { LucideIcon } from "lucide-react";

export interface ElementDef {
  type: ElementType;
  label: { de: string; en: string };
  defaultWidth_m: number;
  defaultStyle: ElementStyle;
  icon: LucideIcon;
  renderSVG: (props: {
    x: number;
    widthPx: number;
    heightPx: number;
    style: ElementStyle;
    scale: number;
  }) => React.ReactNode;
}
