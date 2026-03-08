import { useState, useRef, useEffect } from "react";
import { Search, Maximize2, Trash2, MapPin } from "lucide-react";
import { useT } from "../../../i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { MapReference } from "../../../models/map";
import type { StreetConfig } from "../../../models/street";
import { fetchOsmStreetAt } from "../../../osm/fetch";
import { osmTagsToStreetConfig } from "../../../osm/mapper";
import type { Tab } from "../../Sidebar";
import {
  EXPLORE_TAB, SEARCH_INPUT, TOOLBAR_ROW, MODE_BUTTON_ACTIVE, MODE_BUTTON_INACTIVE, ERROR_BOX,
} from "./styles";

export type MapMode = "none" | "mark-section" | "measure" | "inspect";

interface ExploreTabProps {
  mapReference: MapReference | null;
  onReferenceSet: (ref: MapReference | null) => void;
  onStreetGenerated: (street: StreetConfig) => void;
  onTabChange: (tab: Tab) => void;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function ExploreTab({ mapReference, onReferenceSet, onStreetGenerated, onTabChange }: ExploreTabProps) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>("none");
  const [osmError, setOsmError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchSuggestions(q: string) {
    if (!q.trim()) { setResults([]); return; }
    // Berlin viewport, bounded loosely, prioritise Berlin by adding city name hint
    const searchQ = q.includes("Berlin") ? q : `${q}, Berlin`;
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQ)}` +
      `&viewbox=13.0882,52.6755,13.7611,52.3382&bounded=0&countrycodes=de&limit=6`;
    try {
      const res = await fetch(url, { headers: { "Accept-Language": "de" } });
      const data = (await res.json()) as NominatimResult[];
      setResults(data);
      setShowResults(true);
    } catch {
      setResults([]);
    }
  }

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function selectResult(r: NominatimResult) {
    const ref: MapReference = {
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      zoom: 17,
      label: r.display_name,
    };
    onReferenceSet(ref);
    setShowResults(false);
    setQuery(r.display_name.split(",")[0]);
  }

  async function handleGenerate() {
    if (!mapReference) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setGenerating(true);
    setOsmError(null);
    try {
      const tags = await fetchOsmStreetAt(mapReference.lat, mapReference.lng, abortRef.current.signal);
      if (!tags) throw new Error("No OSM data found");
      const street = osmTagsToStreetConfig(tags);
      onStreetGenerated(street);
      requestAnimationFrame(() => onTabChange("design"));
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setOsmError(t("osmError"));
      }
    } finally {
      setGenerating(false);
    }
  }

  function modeBtn(mode: MapMode, label: string) {
    return (
      <button
        className={mapMode === mode ? MODE_BUTTON_ACTIVE : MODE_BUTTON_INACTIVE}
        onClick={() => setMapMode(mapMode === mode ? "none" : mode)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className={EXPLORE_TAB}>
      <div className="relative flex gap-1">
        <div className="relative flex-1">
          <Input
            className={SEARCH_INPUT}
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") fetchSuggestions(query); if (e.key === "Escape") setShowResults(false); }}
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

      <div className={TOOLBAR_ROW}>
        {modeBtn("mark-section", t("mapModeMarkSection"))}
        {modeBtn("measure", t("mapModeMeasure"))}
        {modeBtn("inspect", t("mapModeInspect"))}
        <Button variant="ghost" size="icon" className="h-7 w-7" title={t("fitMap")}>
          <Maximize2 size={13} />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" title={t("clearMap")} onClick={() => onReferenceSet(null)}>
          <Trash2 size={13} />
        </Button>
      </div>

      {mapReference && (
        <Button size="sm" className="h-7 text-xs w-full" onClick={handleGenerate} disabled={generating}>
          {generating ? "…" : t("generateSection")}
        </Button>
      )}

      {osmError && <div className={ERROR_BOX}>{osmError}</div>}
    </div>
  );
}
