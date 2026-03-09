import { useEffect, useMemo, useState } from "react";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import type { StreetConfig } from "./models/street";
import type { MapReference } from "./models/map";
import { runValidation } from "./rules/engine";
import { TopBar } from "./components/TopBar";
import { Sidebar } from "./components/Sidebar";
import type { Tab } from "./components/Sidebar";
import { CrossSectionView } from "./components/CrossSectionView";
import { MapPanel } from "./components/MapPanel";
import { TEMPLATES } from "./templates";
import type { TemplateOption } from "./templates";
import { initStreet, encodeStreetToUrl, saveToLocalStorage } from "./persistence";
import { LangProvider } from "./i18n";
import type { Lang } from "./i18n";
import type { MapLayer, MapMode } from "./models/explore";
import type { WfsLayer } from "./models/wfs";
import { DEFAULT_WFS_LAYERS } from "./models/wfs";

const LANG_KEY = "berlin-street-designer-lang";

function cloneTemplate(tpl: StreetConfig): StreetConfig {
  return { ...tpl, id: crypto.randomUUID(), elements: tpl.elements.map((e) => ({ ...e, id: crypto.randomUUID() })) };
}

function getDefaultStreet(): StreetConfig {
  const saved = initStreet();
  // If no saved street (empty elements and default name), load Wohnstraße
  if (saved.elements.length === 0) {
    const residential = TEMPLATES.find((t) => t.id === "residential");
    if (residential) return cloneTemplate(residential.config);
  }
  return cloneTemplate(saved);
}

export default function App() {
  const [lang, setLang]                   = useState<Lang>(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return (saved === "en" || saved === "de") ? saved : "de";
  });
  const [street, setStreet]               = useState<StreetConfig>(getDefaultStreet);
  const [mapReference, setMapReference]   = useState<MapReference | null>(null);
  const [activeTab, setActiveTab]         = useState<Tab>("design");
  const [osmDisclaimer, setOsmDisclaimer] = useState(false);
  const [shareCopied, setShareCopied]     = useState(false);
  const [mapLayer,      setMapLayer]      = useState<MapLayer>("osm");
  const [mapMode,       setMapMode]       = useState<MapMode>("none");
  const [sectionLine,   setSectionLine]   = useState<[number, number][] | undefined>();
  const [measurePoints, setMeasurePoints] = useState<[number, number][] | undefined>();
  const [onMapClick,    setOnMapClick]    = useState<((lat: number, lng: number) => void) | undefined>();
  const [wfsLayers,     setWfsLayers]     = useState<WfsLayer[]>(DEFAULT_WFS_LAYERS);
  const [docsOpen,      setDocsOpen]      = useState(false);

  useEffect(() => { saveToLocalStorage(street); }, [street]);
  useEffect(() => { localStorage.setItem(LANG_KEY, lang); }, [lang]);

  function handleShare() {
    const url = encodeStreetToUrl(street);
    navigator.clipboard?.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }).catch(() => {});
  }

  const results        = useMemo(() => runValidation(street, lang), [street, lang]);
  const highlightedIds = useMemo(
    () => results.filter((r) => r.status !== "PASS").flatMap((r) => r.affected_element_ids ?? []),
    [results],
  );

  function handleStreetGenerated(generated: StreetConfig) {
    setStreet(generated);
    setOsmDisclaimer(true);
  }

  function handleTemplateApply(tpl: TemplateOption) {
    setStreet(cloneTemplate(tpl.config));
  }

  return (
    <LangProvider value={lang}>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <TopBar
          lang={lang}
          onLangChange={setLang}
          street={street}
          onStreetImport={setStreet}
          onShare={handleShare}
          shareCopied={shareCopied}
          docsOpen={docsOpen}
          onDocsClose={() => setDocsOpen(false)}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            street={street}
            onStreetChange={setStreet}
            highlightedIds={highlightedIds}
            results={results}
            mapReference={mapReference}
            onReferenceSet={setMapReference}
            onStreetGenerated={handleStreetGenerated}
            osmDisclaimer={osmDisclaimer}
            onClearOsmDisclaimer={() => setOsmDisclaimer(false)}
            mapLayer={mapLayer}
            mapMode={mapMode}
            onMapLayerChange={setMapLayer}
            onMapModeChange={setMapMode}
            onSectionLineChange={setSectionLine}
            onMeasurePointsChange={setMeasurePoints}
            onRegisterMapClick={(fn) => setOnMapClick(() => fn ?? undefined)}
            onOpenDocs={() => setDocsOpen(true)}
          />

          <div className="flex flex-1 flex-col overflow-hidden">
            <PanelGroup orientation="vertical" defaultLayout={{ "cross-section": 50, "map": 50 }}>
              <Panel id="cross-section" defaultSize={50} minSize={20}>
                <CrossSectionView
                  street={street}
                  highlightedIds={highlightedIds}
                  templates={TEMPLATES}
                  onTemplateApply={handleTemplateApply}
                />
              </Panel>
              <PanelResizeHandle className="h-1 bg-border hover:bg-primary/40 transition-colors cursor-row-resize" />
              <Panel id="map" defaultSize={50} minSize={20}>
                <MapPanel
                  mapReference={mapReference}
                  mapLayer={mapLayer}
                  mapMode={mapMode}
                  onMapClick={onMapClick}
                  sectionLine={sectionLine}
                  measurePoints={measurePoints}
                  wfsLayers={wfsLayers}
                  onWfsLayersChange={setWfsLayers}
                />
              </Panel>
            </PanelGroup>
          </div>
        </div>
      </div>
    </LangProvider>
  );
}
