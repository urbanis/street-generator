import { useEffect, useMemo, useState } from "react";
import type { StreetConfig } from "./models/street";
import type { MapReference } from "./models/map";
import { runValidation } from "./rules/engine";
import { TopBar } from "./components/TopBar";
import { Sidebar } from "./components/Sidebar";
import type { Tab } from "./components/Sidebar";
import { CrossSectionView } from "./components/CrossSectionView";
import type { ThemeFlags } from "./components/CrossSectionView";
import { DEFAULT_THEME_FLAGS } from "./components/CrossSectionView";
import { MapPanel } from "./components/MapPanel";
import { TEMPLATES } from "./templates";
import type { TemplateOption } from "./templates";
import { initStreet, encodeStreetToUrl, saveToLocalStorage } from "./persistence";
import { LangProvider } from "./i18n";
import type { Lang } from "./i18n";
import type { MapLayer, MapMode } from "./models/explore";
import type { WfsLayer } from "./models/wfs";
import { DEFAULT_WFS_LAYERS } from "./models/wfs";
import { WelcomeModal } from "./components/WelcomeModal";
import { TourTooltip, TOUR_STEPS } from "./components/TourTooltip";
import { getDefaultFigureVariant } from "./figures/registry";

const LANG_KEY = "berlin-street-designer-lang";
const TOUR_KEY = "berlin-street-designer-tour-done";

function withDefaultFigures(config: StreetConfig): StreetConfig {
  return {
    ...config,
    elements: config.elements.map((e) => {
      if (e.figure) return e;
      const variant = getDefaultFigureVariant(e.type);
      return variant ? { ...e, figure: { show: true, variant } } : e;
    }),
  };
}

function cloneTemplate(tpl: StreetConfig): StreetConfig {
  return withDefaultFigures({ ...tpl, id: crypto.randomUUID(), elements: tpl.elements.map((e) => ({ ...e, id: crypto.randomUUID() })) });
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
  const [mapVisible,    setMapVisible]    = useState(false);
  const [showAllFigures, setShowAllFigures] = useState(true);
  const [theme,         setTheme]          = useState<ThemeFlags>(DEFAULT_THEME_FLAGS);
  const [showWelcome, setShowWelcome] = useState<boolean>(
    () => !localStorage.getItem(TOUR_KEY)
  );
  const [tourStep, setTourStep] = useState<number | null>(null);

  useEffect(() => { saveToLocalStorage(street); }, [street]);
  useEffect(() => { localStorage.setItem(LANG_KEY, lang); }, [lang]);

  // Switch sidebar tab when the tour step requires it
  useEffect(() => {
    if (tourStep === null) return;
    const tab = TOUR_STEPS[tourStep].tab;
    if (tab) setActiveTab(tab);
  }, [tourStep]);

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

  function handleClear() {
    setStreet((s) => ({ ...s, name: "", subtitle: undefined, elements: [] }));
  }

  function handleStreetGenerated(generated: StreetConfig) {
    setStreet(withDefaultFigures(generated));
    setOsmDisclaimer(true);
  }

  function handleTemplateApply(tpl: TemplateOption) {
    setStreet(cloneTemplate(tpl.config));
  }

  function handleTourStart() {
    setShowWelcome(false);
    setTourStep(0);
  }

  function handleTourSkip() {
    localStorage.setItem(TOUR_KEY, "1");
    setShowWelcome(false);
  }

  function handleTourNext() {
    setTourStep((prev) => {
      if (prev === null) return null;
      if (prev >= TOUR_STEPS.length - 1) {
        localStorage.setItem(TOUR_KEY, "1");
        return null;
      }
      return prev + 1;
    });
  }

  function handleTourBack() {
    setTourStep((prev) => {
      if (prev === null || prev === 0) return prev;
      return prev - 1;
    });
  }

  function handleTourExit() {
    localStorage.setItem(TOUR_KEY, "1");
    setTourStep(null);
  }

  function handleReplayTour() {
    localStorage.removeItem(TOUR_KEY);
    setTourStep(null);
    setShowWelcome(true);
  }

  return (
    <LangProvider value={lang}>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <TopBar
          lang={lang}
          onLangChange={setLang}
          docsOpen={docsOpen}
          onDocsClose={() => setDocsOpen(false)}
          onReplayTour={handleReplayTour}
        />
        {/* Mobile: single-column scroll stack (CrossSection → Sidebar → Map).
            Desktop: two-column grid — sidebar left spanning both rows,
            CrossSection top-right, Map bottom-right. */}
        <div className="flex-1 grid grid-cols-1 overflow-y-auto lg:h-full lg:grid-cols-[24rem_1fr] lg:grid-rows-[1fr_1fr] lg:overflow-hidden">

          {/* CrossSection — row 1 on mobile (DOM order), top-right on desktop */}
          <div className={`min-h-64 overflow-hidden lg:min-h-0 lg:col-start-2 lg:row-start-1${!mapVisible ? " lg:row-span-2" : ""}`}>
            <CrossSectionView
              street={street}
              showAllFigures={showAllFigures}
              onShowAllFiguresChange={setShowAllFigures}
              theme={theme}
              onThemeChange={setTheme}
              onStreetImport={(s) => setStreet(withDefaultFigures(s))}
              onShare={handleShare}
              shareCopied={shareCopied}
              onClear={handleClear}
            />
          </div>

          {/* Sidebar — row 2 on mobile (DOM order), left column spanning both rows on desktop */}
          <div className="lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:h-full">
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
              mapVisible={mapVisible}
              onToggleMap={() => setMapVisible((v) => !v)}
              onShowMap={() => setMapVisible(true)}
              onFitMap={() => { setMapVisible(true); setMapReference((r) => r ? { ...r } : r); }}
              templates={TEMPLATES}
              onTemplateApply={handleTemplateApply}
            />
          </div>

          {/* Map — row 3 on mobile (DOM order), bottom-right on desktop */}
          {mapVisible && (
            <div className="min-h-64 overflow-hidden lg:min-h-0 lg:col-start-2 lg:row-start-2">
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
            </div>
          )}
        </div>
      </div>
      {showWelcome && (
        <WelcomeModal lang={lang} onLangChange={setLang} onStart={handleTourStart} onSkip={handleTourSkip} />
      )}
      {tourStep !== null && (
        <TourTooltip
          step={tourStep}
          total={TOUR_STEPS.length}
          lang={lang}
          onNext={handleTourNext}
          onBack={handleTourBack}
          onExit={handleTourExit}
        />
      )}
    </LangProvider>
  );
}
