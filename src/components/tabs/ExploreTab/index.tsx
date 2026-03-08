import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Maximize2, Trash2, MapPin, ExternalLink } from "lucide-react";
import L from "leaflet";
import { useT, useLang } from "../../../i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MapReference } from "../../../models/map";
import type { StreetConfig } from "../../../models/street";
import type { MapLayer, MapMode, InspectResult } from "../../../models/explore";
import { fetchOsmStreetAt } from "../../../osm/fetch";
import { osmTagsToStreetConfig } from "../../../osm/mapper";
import type { Tab } from "../../Sidebar";
import {
  EXPLORE_TAB, SEARCH_INPUT, TOOLBAR_ROW, MODE_BUTTON_ACTIVE, MODE_BUTTON_INACTIVE, ERROR_BOX,
} from "./styles";

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

  // ── Inspect helper ────────────────────────────────────────────────────────

  async function handleInspect(lat: number, lng: number) {
    setInspecting(true);
    setInspectResult(null);
    setTagsExpanded(false);
    try {
      const tags = await fetchOsmStreetAt(lat, lng);
      if (!tags) {
        setInspectResult({ summary: {}, rawTags: {} });
        return;
      }
      const rawTags = Object.fromEntries(
        Object.entries(tags).filter(([, v]) => v !== undefined) as [string, string][]
      );
      setInspectResult({
        summary: {
          name:     rawTags.name,
          lanes:    rawTags.lanes ? Number(rawTags.lanes) : undefined,
          maxspeed: rawTags.maxspeed,
          surface:  rawTags.surface,
        },
        rawTags,
      });
    } catch {
      setOsmError(t("osmError"));
    } finally {
      setInspecting(false);
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

  // Auto-generate when section has 2 points
  useEffect(() => {
    if (sectionPoints.length === 2 && mapMode === "mark-section") {
      const midLat = (sectionPoints[0][0] + sectionPoints[1][0]) / 2;
      const midLng = (sectionPoints[0][1] + sectionPoints[1][1]) / 2;
      onReferenceSet({ lat: midLat, lng: midLng, zoom: 17, label: "Section midpoint" });
      handleGenerate(midLat, midLng);
    }
  }, [sectionPoints]);

  // ── Mode toggle ───────────────────────────────────────────────────────────

  function toggleMode(mode: MapMode) {
    const next = mapMode === mode ? "none" : mode;
    onMapModeChange(next);
    if (next !== "mark-section") { setSectionPoints([]); onSectionLineChange(undefined); }
    if (next !== "measure")      { measurePtsRef.current = []; onMeasurePointsChange(undefined); setMeasureDist(0); }
    if (next !== "inspect")      { setInspectResult(null); }
  }

  function modeBtn(mode: MapMode, label: string) {
    return (
      <button
        className={mapMode === mode ? MODE_BUTTON_ACTIVE : MODE_BUTTON_INACTIVE}
        onClick={() => toggleMode(mode)}
      >
        {label}
      </button>
    );
  }

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
              if (e.key === "Enter") fetchSuggestions(query);
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
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => fetchSuggestions(query)}>
          <Search size={14} />
        </Button>
      </div>

      {/* Layer toggle */}
      <div className="flex gap-1">
        <button
          className={mapLayer === "osm" ? MODE_BUTTON_ACTIVE : MODE_BUTTON_INACTIVE}
          onClick={() => onMapLayerChange("osm")}
        >
          {t("mapStreet")}
        </button>
        <button
          className={mapLayer === "satellite" ? MODE_BUTTON_ACTIVE : MODE_BUTTON_INACTIVE}
          onClick={() => onMapLayerChange("satellite")}
        >
          {t("mapSatellite")}
        </button>
      </div>

      {/* Mode + utility toolbar */}
      <div className={TOOLBAR_ROW}>
        {modeBtn("mark-section", t("mapModeMarkSection"))}
        {modeBtn("measure",      t("mapModeMeasure"))}
        {modeBtn("inspect",      t("mapModeInspect"))}
        <Button variant="ghost" size="icon" className="h-7 w-7" title={t("fitMap")}>
          <Maximize2 size={13} />
        </Button>
        <Button
          variant="ghost" size="icon" className="h-7 w-7" title={t("clearMap")}
          onClick={() => { onReferenceSet(null); setSectionPoints([]); measurePtsRef.current = []; setInspectResult(null); onSectionLineChange(undefined); onMeasurePointsChange(undefined); }}
        >
          <Trash2 size={13} />
        </Button>
      </div>

      {/* Generate button (normal search mode) */}
      {mapReference && mapMode !== "mark-section" && (
        <Button size="sm" className="h-7 text-xs w-full" onClick={() => handleGenerate()} disabled={generating}>
          {generating ? "…" : t("generateSection")}
        </Button>
      )}

      {/* Mark-section hint */}
      {mapMode === "mark-section" && (
        <p className="text-xs text-muted-foreground">
          {lang === "de"
            ? `${sectionPoints.length}/2 Punkte gesetzt. Klicke auf die Karte.`
            : `${sectionPoints.length}/2 points set. Click on the map.`}
        </p>
      )}

      {/* Measure distance readout */}
      {mapMode === "measure" && (
        <div className="flex items-center justify-between rounded border border-border px-2 py-1.5 text-xs">
          <span className="text-muted-foreground">
            {lang === "de" ? `Distanz: ${measureDist} m` : `Distance: ${measureDist} m`}
          </span>
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => { measurePtsRef.current = []; onMeasurePointsChange(undefined); setMeasureDist(0); }}
          >
            {t("measureClear")}
          </button>
        </div>
      )}

      {/* Inspect loading */}
      {mapMode === "inspect" && inspecting && (
        <div className="text-xs text-muted-foreground px-1">…</div>
      )}

      {/* Inspect results */}
      {mapMode === "inspect" && inspectResult && (
        <div className="rounded border border-border p-2 text-xs flex flex-col gap-1">
          {Object.keys(inspectResult.rawTags).length === 0 ? (
            <span className="text-muted-foreground">{t("inspectNoData")}</span>
          ) : (
            <>
              <div className="flex flex-col gap-0.5">
                {inspectResult.summary.name     && <span><strong>{lang === "de" ? "Name" : "Name"}:</strong> {inspectResult.summary.name}</span>}
                {inspectResult.summary.lanes    && <span><strong>{lang === "de" ? "Fahrspuren" : "Lanes"}:</strong> {inspectResult.summary.lanes}</span>}
                {inspectResult.summary.maxspeed && <span><strong>{lang === "de" ? "Tempo" : "Speed"}:</strong> {inspectResult.summary.maxspeed}</span>}
                {inspectResult.summary.surface  && <span><strong>{lang === "de" ? "Oberfläche" : "Surface"}:</strong> {inspectResult.summary.surface}</span>}
              </div>
              <button
                className="text-left text-muted-foreground hover:text-foreground underline mt-1"
                onClick={() => setTagsExpanded((v) => !v)}
              >
                {tagsExpanded ? t("inspectTagsHide") : t("inspectTags")}
              </button>
              {tagsExpanded && (
                <div className="mt-1 flex flex-col gap-0.5 max-h-40 overflow-y-auto">
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
    </div>
  );
}
