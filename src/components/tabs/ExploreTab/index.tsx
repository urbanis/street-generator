import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { Search, MapPin, ExternalLink, Eye, EyeOff, Crosshair, Ruler, ScanSearch, Maximize2, Trash2 } from "lucide-react";
import L from "leaflet";
import { useT, useLang } from "../../../i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MapReference } from "../../../models/map";
import type { StreetConfig } from "../../../models/street";
import type { MapLayer, MapMode, InspectResult } from "../../../models/explore";
import { fetchOsmStreetAt } from "../../../osm/fetch";
import { interpretOsmTags } from "../../../osm/interpreter";
import { osmTagsToStreetConfig } from "../../../osm/mapper";
import type { Tab } from "../../Sidebar";
import {
  EXPLORE_TAB, SEARCH_INPUT, MODE_BUTTON_ACTIVE, MODE_BUTTON_INACTIVE, ERROR_BOX,
  TOOL_CARD_ACTIVE, TOOL_CARD_INACTIVE, TOOL_ICON_WRAP,
} from "./styles";
import { capture } from "../../../lib/analytics";

interface ExploreTabProps {
  mapReference:          MapReference | null;
  onReferenceSet:        (ref: MapReference | null) => void;
  onStreetGenerated:     (street: StreetConfig) => void;
  onTabChange:           (tab: Tab) => void;
  mapLayer:              MapLayer;
  mapMode:               MapMode;
  onMapLayerChange:      (layer: MapLayer) => void;
  onMapModeChange:       (mode: MapMode) => void;
  onSectionLineChange:   (line: [number, number][] | undefined) => void;
  onMeasurePointsChange: (pts: [number, number][] | undefined) => void;
  onRegisterMapClick:    (fn: ((lat: number, lng: number) => void) | null) => void;
  mapVisible:            boolean;
  onToggleMap:           () => void;
  onShowMap:             () => void;
  onFitMap:              () => void;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function ExploreTab({
  mapReference, onReferenceSet, onStreetGenerated, onTabChange,
  mapLayer, mapMode, onMapLayerChange, onMapModeChange,
  onSectionLineChange, onMeasurePointsChange, onRegisterMapClick,
  mapVisible, onToggleMap, onShowMap, onFitMap,
}: ExploreTabProps) {
  const t    = useT();
  const lang = useLang();

  // Search state
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState<NominatimResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [osmError,    setOsmError]    = useState<string | null>(null);
  const [generating,  setGenerating]  = useState(false);
  const abortRef    = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Interaction state
  const [sectionPoints,  setSectionPoints]  = useState<[number, number][]>([]);
  const measurePtsRef                       = useRef<[number, number][]>([]);
  const [measureDist,    setMeasureDist]    = useState(0);
  const [inspectResult,  setInspectResult]  = useState<InspectResult | null>(null);
  const [inspectNoData,  setInspectNoData]  = useState(false);
  const [tagsExpanded,   setTagsExpanded]   = useState(false);
  const [inspecting,     setInspecting]     = useState(false);

  // ── Nominatim search ──────────────────────────────────────────────────────

  async function fetchSuggestions(q: string) {
    if (!q.trim()) { setResults([]); return; }
    const searchQ = q.includes("Berlin") ? q : `${q}, Berlin`;
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQ)}` +
      `&viewbox=13.0882,52.6755,13.7611,52.3382&bounded=0&countrycodes=de&limit=6`;
    try {
      const res  = await fetch(url, { headers: { "Accept-Language": "de" } });
      const data = (await res.json()) as NominatimResult[];
      setResults(data);
      setShowResults(true);
    } catch {
      setResults([]);
    }
  }

  useEffect(() => {
    if (query.length < 3) { setResults([]); setShowResults(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function selectResult(r: NominatimResult) {
    onShowMap();
    const ref: MapReference = { lat: parseFloat(r.lat), lng: parseFloat(r.lon), zoom: 17, label: r.display_name };
    onReferenceSet(ref);
    setShowResults(false);
    setQuery(r.display_name.split(",")[0]);
  }

  // ── OSM generate ─────────────────────────────────────────────────────────

  async function handleGenerate(lat?: number, lng?: number) {
    const fetchLat = lat ?? mapReference?.lat;
    const fetchLng = lng ?? mapReference?.lng;
    if (fetchLat == null || fetchLng == null) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setGenerating(true);
    setOsmError(null);
    try {
      const tags = await fetchOsmStreetAt(fetchLat, fetchLng, abortRef.current.signal);
      if (!tags) throw new Error("No OSM data found");
      const street = osmTagsToStreetConfig(tags);
      onStreetGenerated(street);
      requestAnimationFrame(() => onTabChange("design"));
    } catch (err) {
      if ((err as Error).name !== "AbortError") setOsmError(t("osmError"));
    } finally {
      setGenerating(false);
    }
  }

  function handleGenerateFromInspect() {
    if (!inspectResult) return;
    const street = osmTagsToStreetConfig(inspectResult.rawTags as Record<string, string | undefined>);
    onStreetGenerated(street);
    requestAnimationFrame(() => onTabChange("design"));
  }

  // ── Inspect helper ────────────────────────────────────────────────────────

  async function handleInspect(lat: number, lng: number) {
    setInspecting(true);
    const mapEl = document.querySelector(".leaflet-container") as HTMLElement | null;
    if (mapEl) mapEl.style.cursor = "wait";
    setInspectResult(null);
    setTagsExpanded(false);
    try {
      const tags = await fetchOsmStreetAt(lat, lng);
      if (!tags) {
        setInspectResult(null);
        setInspectNoData(true);
        return;
      }
      setInspectNoData(false);
      const rawTags = Object.fromEntries(
        Object.entries(tags).filter(([, v]) => v !== undefined) as [string, string][]
      );
      setInspectResult({
        interpreted: interpretOsmTags(tags),
        rawTags,
      });
    } catch {
      setOsmError(t("osmError"));
    } finally {
      setInspecting(false);
      if (mapEl) mapEl.style.cursor = "help";
    }
  }

  // ── Map click handler (registered with App → MapPanel) ───────────────────

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (mapMode === "mark-section") {
      setSectionPoints((prev) => {
        const next: [number, number][] = prev.length < 2
          ? [...prev, [lat, lng]]
          : [[lat, lng]];
        onSectionLineChange(next.length >= 2 ? next : undefined);
        return next;
      });
    } else if (mapMode === "measure") {
      const next: [number, number][] = [...measurePtsRef.current, [lat, lng]];
      measurePtsRef.current = next;
      onMeasurePointsChange(next);
      if (next.length >= 2) {
        let d = 0;
        for (let i = 1; i < next.length; i++) {
          d += L.latLng(next[i - 1]).distanceTo(L.latLng(next[i]));
        }
        setMeasureDist(Math.round(d));
      }
    } else if (mapMode === "inspect") {
      handleInspect(lat, lng);
    }
    // handleInspect omitted intentionally — including it would re-register the
    // map click handler on every render; its behavior is keyed off mapMode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapMode, onSectionLineChange, onMeasurePointsChange]);

  // Register/unregister click handler with App
  useEffect(() => {
    if (mapMode !== "none") {
      onRegisterMapClick(handleMapClick);
    } else {
      onRegisterMapClick(null);
    }
    return () => { onRegisterMapClick(null); };
  }, [mapMode, handleMapClick, onRegisterMapClick]);


  // ── Mode toggle ───────────────────────────────────────────────────────────

  function toggleMode(mode: MapMode) {
    onShowMap();
    const next = mapMode === mode ? "none" : mode;
    if (next !== "none") capture("tool_activated", { tool: next });
    onMapModeChange(next);
    setOsmError(null);
    if (next !== "mark-section") { setSectionPoints([]); onSectionLineChange(undefined); }
    if (next !== "measure")      { measurePtsRef.current = []; onMeasurePointsChange(undefined); setMeasureDist(0); }
    if (next !== "inspect")      { setInspectResult(null); setInspectNoData(false); }
  }

  const TOOLS: { mode: MapMode; icon: ReactNode; name: string; description: string }[] = [
    {
      mode: "mark-section",
      icon: <Crosshair size={15} />,
      name: lang === "de" ? "Schnittlinie" : "Section line",
      description: lang === "de"
        ? "Klicke zwei Punkte auf die Karte, um einen Querschnitt zu erzeugen."
        : "Click two points on the map to generate a cross-section.",
    },
    {
      mode: "measure",
      icon: <Ruler size={15} />,
      name: lang === "de" ? "Messen" : "Measure",
      description: lang === "de"
        ? "Klicke mehrere Punkte auf die Karte, um Abstände zu messen."
        : "Click points on the map to measure distances.",
    },
    {
      mode: "inspect",
      icon: <ScanSearch size={15} />,
      name: lang === "de" ? "Inspizieren" : "Inspect",
      description: lang === "de"
        ? "Klicke auf eine Straße, um ihre OSM-Daten zu sehen und einen Querschnitt zu erzeugen."
        : "Click a street to see its OSM data and generate a cross-section.",
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={EXPLORE_TAB}>

      {/* Search input */}
      <div className="relative flex gap-1">
        <div className="relative flex-1">
          <Input
            className={SEARCH_INPUT}
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { onShowMap(); fetchSuggestions(query); }
              if (e.key === "Escape") setShowResults(false);
            }}
            onFocus={() => results.length > 0 && setShowResults(true)}
          />
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 mt-0.5 rounded-md border border-border bg-background shadow-md">
              {results.map((r, i) => (
                <button
                  key={i}
                  className="flex w-full items-start gap-1.5 px-2 py-1.5 text-xs text-left hover:bg-muted first:rounded-t-md last:rounded-b-md"
                  onMouseDown={() => selectResult(r)}
                >
                  <MapPin size={11} className="shrink-0 mt-0.5 text-muted-foreground" />
                  <span className="line-clamp-2">{r.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { onShowMap(); fetchSuggestions(query); }}>
          <Search size={14} />
        </Button>
      </div>

      {/* Map visibility + basemaps */}
      {!mapVisible ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 gap-2 text-xs"
          onClick={onToggleMap}
        >
          <Eye size={14} />
          {lang === "de" ? "Karte anzeigen" : "Show map"}
        </Button>
      ) : (
        <div className="flex gap-1 items-center">
          <button
            className={mapLayer === "osm" ? MODE_BUTTON_ACTIVE : MODE_BUTTON_INACTIVE}
            onClick={() => onMapLayerChange("osm")}
          >
            {t("mapStreet")}
          </button>
          <button
            className={mapLayer === "cartodb" ? MODE_BUTTON_ACTIVE : MODE_BUTTON_INACTIVE}
            onClick={() => onMapLayerChange("cartodb")}
          >
            {t("mapVoyager")}
          </button>
          <button
            className={mapLayer === "satellite" ? MODE_BUTTON_ACTIVE : MODE_BUTTON_INACTIVE}
            onClick={() => onMapLayerChange("satellite")}
          >
            {t("mapSatellite")}
          </button>
          <Button
            variant="ghost" size="sm"
            className="h-7 px-2 text-xs gap-1 ml-auto shrink-0 text-muted-foreground"
            onClick={onToggleMap}
          >
            <EyeOff size={13} />
            {lang === "de" ? "Ausblenden" : "Hide"}
          </Button>
        </div>
      )}

      {/* Tool cards */}
      <div className="flex flex-col gap-1.5">
        {TOOLS.map((tool) => (
          <button
            key={tool.mode}
            className={mapMode === tool.mode ? TOOL_CARD_ACTIVE : TOOL_CARD_INACTIVE}
            onClick={() => toggleMode(tool.mode)}
            aria-pressed={mapMode === tool.mode}
          >
            <span className={TOOL_ICON_WRAP}>{tool.icon}</span>
            <span className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium leading-none">{tool.name}</span>
              <span className="text-xs text-muted-foreground leading-snug">{tool.description}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Active tool feedback — shown below active card */}
      {mapMode !== "none" && (
        <div className="rounded border border-border bg-muted/30 p-2.5 flex flex-col gap-2">

          {/* Mark-section hint */}
          {mapMode === "mark-section" && (
            <p className="text-xs text-muted-foreground">
              {sectionPoints.length < 2
                ? (lang === "de"
                    ? `${sectionPoints.length}/2 Punkte gesetzt. Klicke auf die Karte.`
                    : `${sectionPoints.length}/2 points set. Click on the map.`)
                : (lang === "de"
                    ? "Linie gesetzt. Generieren bestätigen?"
                    : "Line set. Confirm to generate?")}
            </p>
          )}

          {/* Measure distance readout */}
          {mapMode === "measure" && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {lang === "de" ? `Distanz: ${measureDist} m` : `Distance: ${measureDist} m`}
              </span>
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => { measurePtsRef.current = []; onMeasurePointsChange(undefined); setMeasureDist(0); }}
              >
                {t("measureClear")}
              </button>
            </div>
          )}

          {/* Inspect loading */}
          {mapMode === "inspect" && inspecting && (
            <div className="text-xs text-muted-foreground">…</div>
          )}

          {/* Inspect no data */}
          {mapMode === "inspect" && !inspecting && inspectNoData && (
            <p className="text-xs text-muted-foreground">{t("inspectNoData")}</p>
          )}

          {/* Inspect results */}
          {mapMode === "inspect" && inspectResult && (
            <div className="text-xs flex flex-col gap-2">
              {Object.keys(inspectResult.rawTags).length === 0 ? (
                <span className="text-muted-foreground">{t("inspectNoData")}</span>
              ) : (
                <>
                  {/* Road basics */}
                  <div className="flex flex-col gap-0.5">
                    {inspectResult.interpreted.name && (
                      <span className="font-semibold">{inspectResult.interpreted.name}</span>
                    )}
                    <span className="text-muted-foreground">
                      {[
                        inspectResult.interpreted.highway,
                        inspectResult.interpreted.width_m != null ? `${inspectResult.interpreted.width_m} m` : undefined,
                        inspectResult.interpreted.maxspeed != null ? `${inspectResult.interpreted.maxspeed} km/h` : undefined,
                        inspectResult.interpreted.surface,
                      ].filter(Boolean).join(" · ")}
                    </span>
                  </div>

                  {/* Lanes */}
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{lang === "de" ? "Fahrstreifen" : "Lanes"}</span>
                    <span className="text-muted-foreground">
                      {inspectResult.interpreted.lanes.total}
                      {inspectResult.interpreted.lanes.oneway && (
                        <> · {lang === "de" ? "Einbahnstraße" : "oneway"}
                        {inspectResult.interpreted.lanes.bicycleExemptFromOneway && (
                          <> ({lang === "de" ? "Rad frei" : "cyclists ok"})</>
                        )}</>
                      )}
                    </span>
                  </div>

                  {/* Cycling */}
                  {(inspectResult.interpreted.cycleway.left !== "none" ||
                    inspectResult.interpreted.cycleway.right !== "none" ||
                    inspectResult.interpreted.bicycleRoad) && (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{lang === "de" ? "Radverkehr" : "Cycling"}</span>
                      {inspectResult.interpreted.bicycleRoad && (
                        <span className="text-muted-foreground">{lang === "de" ? "Fahrradstraße" : "Bicycle road"}</span>
                      )}
                      {inspectResult.interpreted.cycleway.left !== "none" && (
                        <span className="text-muted-foreground">
                          {lang === "de" ? "links" : "left"}: {inspectResult.interpreted.cycleway.left}
                        </span>
                      )}
                      {inspectResult.interpreted.cycleway.right !== "none" && (
                        <span className="text-muted-foreground">
                          {lang === "de" ? "rechts" : "right"}: {inspectResult.interpreted.cycleway.right}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Parking */}
                  {(inspectResult.interpreted.parking.left.type !== "none" ||
                    inspectResult.interpreted.parking.right.type !== "none") && (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{lang === "de" ? "Parken" : "Parking"}</span>
                      {(["left", "right"] as const).map((s) => {
                        const p = inspectResult.interpreted.parking[s];
                        if (p.type === "none") return null;
                        return (
                          <span key={s} className="text-muted-foreground">
                            {lang === "de" ? (s === "left" ? "links" : "rechts") : s}: {p.type}
                            {p.orientation && ` · ${p.orientation}`}
                            {p.fee === true && ` · ${lang === "de" ? "kostenpflichtig" : "fee"}`}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Sidewalk */}
                  {(inspectResult.interpreted.sidewalk.left !== "no" ||
                    inspectResult.interpreted.sidewalk.right !== "no") && (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{lang === "de" ? "Gehweg" : "Sidewalk"}</span>
                      {inspectResult.interpreted.sidewalk.left === inspectResult.interpreted.sidewalk.right ? (
                        <span className="text-muted-foreground">
                          {lang === "de" ? "beidseitig" : "both"} ({inspectResult.interpreted.sidewalk.left})
                        </span>
                      ) : (
                        <>
                          {inspectResult.interpreted.sidewalk.left !== "no" && (
                            <span className="text-muted-foreground">
                              {lang === "de" ? "links" : "left"}: {inspectResult.interpreted.sidewalk.left}
                            </span>
                          )}
                          {inspectResult.interpreted.sidewalk.right !== "no" && (
                            <span className="text-muted-foreground">
                              {lang === "de" ? "rechts" : "right"}: {inspectResult.interpreted.sidewalk.right}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Raw tags toggle */}
                  <button
                    className="text-left text-muted-foreground hover:text-foreground underline"
                    onClick={() => setTagsExpanded((v) => !v)}
                  >
                    {tagsExpanded
                      ? t("inspectTagsHide")
                      : `${t("inspectTags")} (${Object.keys(inspectResult.rawTags).length})`}
                  </button>
                  {tagsExpanded && (
                    <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                      {Object.entries(inspectResult.rawTags).map(([k, v]) => (
                        <div key={k} className="flex gap-1">
                          <span className="text-muted-foreground shrink-0">{k}:</span>
                          <span className="break-all">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}

                </>
              )}
            </div>
          )}

        </div>
      )}

      {osmError && <div className={ERROR_BOX}>{osmError}</div>}

      {/* Street imagery links */}
      {mapReference && (
        <div className="flex flex-col gap-1 mt-1">
          <span className="text-xs text-muted-foreground">{t("mapillaryLabel")}</span>
          <a
            href={`https://www.mapillary.com/app/?lat=${mapReference.lat}&lng=${mapReference.lng}&z=17`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded border border-border px-2 py-1.5 text-xs hover:bg-muted"
          >
            <ExternalLink size={11} className="shrink-0 text-muted-foreground" />
            <span>Mapillary</span>
          </a>
          <a
            href={
              `https://www.google.com/maps/@${mapReference.lat},${mapReference.lng}` +
              `,3a,75y,0h,90t/data=!3m1!1e1`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded border border-border px-2 py-1.5 text-xs hover:bg-muted"
          >
            <ExternalLink size={11} className="shrink-0 text-muted-foreground" />
            <span>{t("streetViewLink")}</span>
          </a>
        </div>
      )}

      {/* Bottom utility bar */}
      <div className="flex gap-1 items-center pt-1 border-t border-border mt-auto">
        <Button
          size="sm"
          className="h-8 text-xs flex-1"
          onClick={() => {
            if (mapMode === "inspect" && inspectResult) {
              handleGenerateFromInspect();
            } else if (mapMode === "mark-section" && sectionPoints.length === 2) {
              const midLat = (sectionPoints[0][0] + sectionPoints[1][0]) / 2;
              const midLng = (sectionPoints[0][1] + sectionPoints[1][1]) / 2;
              onReferenceSet({ lat: midLat, lng: midLng, zoom: 17, label: "Section midpoint" });
              handleGenerate(midLat, midLng);
            } else {
              handleGenerate();
            }
          }}
          disabled={
            generating ||
            (mapMode === "mark-section" && sectionPoints.length < 2) ||
            (mapMode === "inspect" && !inspectResult) ||
            (mapMode === "measure") ||
            (mapMode === "none" && !mapReference)
          }
        >
          {generating ? "…" : t("generateSection")}
        </Button>
        <Button
          variant="ghost" size="icon" className="h-8 w-8 shrink-0"
          title={t("fitMap")}
          onClick={onFitMap}
          disabled={!mapReference}
        >
          <Maximize2 size={13} />
        </Button>
        <Button
          variant="ghost" size="icon" className="h-8 w-8 shrink-0"
          title={t("clearMap")}
          onClick={() => {
            onReferenceSet(null);
            setSectionPoints([]);
            measurePtsRef.current = [];
            setInspectResult(null);
            onSectionLineChange(undefined);
            onMeasurePointsChange(undefined);
            setMeasureDist(0);
          }}
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
}
