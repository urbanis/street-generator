import { useT } from "../../i18n";
import type { StreetConfig } from "../../models/street";
import type { ValidationResultItem } from "../../rules/types";
import type { MapReference } from "../../models/map";
import type { MapLayer, MapMode } from "../../models/explore";
import { ExploreTab } from "../tabs/ExploreTab";
import type { TemplateOption } from "../../templates";
import { DesignTab } from "../tabs/DesignTab";
import { EvaluateTab } from "../tabs/EvaluateTab";
import {
  SIDEBAR, TAB_BAR, TAB_BUTTON_ACTIVE, TAB_BUTTON_INACTIVE, TAB_CONTENT,
} from "./styles";

export type Tab = "explore" | "design" | "evaluate";

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  street: StreetConfig;
  onStreetChange: (street: StreetConfig) => void;
  highlightedIds: string[];
  results: ValidationResultItem[];
  mapReference: MapReference | null;
  onReferenceSet: (ref: MapReference | null) => void;
  onStreetGenerated: (street: StreetConfig) => void;
  osmDisclaimer: boolean;
  onClearOsmDisclaimer: () => void;
  mapLayer:              MapLayer;
  mapMode:               MapMode;
  onMapLayerChange:      (layer: MapLayer) => void;
  onMapModeChange:       (mode: MapMode) => void;
  onSectionLineChange:   (line: [number, number][] | undefined) => void;
  onMeasurePointsChange: (pts: [number, number][] | undefined) => void;
  onRegisterMapClick:    (fn: ((lat: number, lng: number) => void) | null) => void;
  onOpenDocs:            () => void;
  mapVisible:            boolean;
  onToggleMap:           () => void;
  onShowMap:             () => void;
  onFitMap:              () => void;
  templates:               TemplateOption[];
  onTemplateApply:         (tpl: TemplateOption) => void;
}

export function Sidebar({
  activeTab, onTabChange, street, onStreetChange,
  highlightedIds, results, mapReference, onReferenceSet,
  onStreetGenerated, osmDisclaimer, onClearOsmDisclaimer,
  mapLayer, mapMode, onMapLayerChange, onMapModeChange,
  onSectionLineChange, onMeasurePointsChange, onRegisterMapClick, onOpenDocs,
  mapVisible, onToggleMap, onShowMap, onFitMap,
  templates, onTemplateApply,
}: SidebarProps) {
  const t = useT();
  const hasIssues = results.some((r) => r.status !== "PASS");

  return (
    <div className={SIDEBAR}>
      <div className={TAB_BAR}>
        {(["explore", "design", "evaluate"] as Tab[]).map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? TAB_BUTTON_ACTIVE : TAB_BUTTON_INACTIVE}
            onClick={() => onTabChange(tab)}
            data-tour={tab === "design" ? "design-tab" : tab === "explore" ? "explore-tab" : tab === "evaluate" ? "evaluate-tab" : undefined}
          >
            <span className="relative inline-flex items-center gap-1">
              {t(tab === "explore" ? "tabExplore" : tab === "design" ? "tabDesign" : "tabEvaluate")}
              {tab === "evaluate" && hasIssues && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              )}
            </span>
          </button>
        ))}
      </div>

      {/* All tabs always mounted — hidden via CSS only */}
      <div className={`${TAB_CONTENT} ${activeTab === "explore" ? "" : "hidden"}`}>
        <ExploreTab
          mapReference={mapReference}
          onReferenceSet={onReferenceSet}
          onStreetGenerated={onStreetGenerated}
          onTabChange={onTabChange}
          mapLayer={mapLayer}
          mapMode={mapMode}
          onMapLayerChange={onMapLayerChange}
          onMapModeChange={onMapModeChange}
          onSectionLineChange={onSectionLineChange}
          onMeasurePointsChange={onMeasurePointsChange}
          onRegisterMapClick={onRegisterMapClick}
          mapVisible={mapVisible}
          onToggleMap={onToggleMap}
          onShowMap={onShowMap}
          onFitMap={onFitMap}
        />
      </div>
      <div className={`${TAB_CONTENT} ${activeTab === "design" ? "" : "hidden"}`}>
        <DesignTab
          street={street}
          onStreetChange={onStreetChange}
          highlightedIds={highlightedIds}
          osmDisclaimer={osmDisclaimer}
          onClearOsmDisclaimer={onClearOsmDisclaimer}
          templates={templates}
          onTemplateApply={onTemplateApply}
        />
      </div>
      <div className={`${TAB_CONTENT} ${activeTab === "evaluate" ? "" : "hidden"}`}>
        <EvaluateTab results={results} onOpenDocs={onOpenDocs} />
      </div>
    </div>
  );
}
