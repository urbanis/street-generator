import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents, Polyline, GeoJSON } from "react-leaflet";
import { Info, X } from "lucide-react";
import type { MapReference } from "../../models/map";
import type { MapLayer, MapMode } from "../../models/explore";
import type { WfsLayer, WfsFeatureType } from "../../models/wfs";
import { MAP_PANEL } from "./styles";
import "leaflet/dist/leaflet.css";

const OSM_URL  = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const SAT_URL  = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SAT_ATTR = "Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics";

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(id);
  }, [map]);
  return null;
}

function MapFlyTo({ mapReference }: { mapReference: MapReference | null }) {
  const map = useMap();
  useEffect(() => {
    if (mapReference) {
      map.flyTo([mapReference.lat, mapReference.lng], mapReference.zoom ?? 17, { duration: 1 });
    }
  }, [map, mapReference]);
  return null;
}

function MapClickHandler({ onMapClick, mapMode }: {
  onMapClick?: (lat: number, lng: number) => void;
  mapMode: MapMode;
}) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    container.style.cursor =
      mapMode === "inspect" ? "help"      :
      mapMode !== "none"    ? "crosshair" : "";
  }, [map, mapMode]);
  useMapEvents({
    click(e) {
      if (mapMode !== "none" && onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function WfsGeoJsonLayer({ layer }: { layer: WfsLayer }) {
  const [data, setData] = useState<object | null>(null);

  useEffect(() => {
    if (!layer.enabled) { setData(null); return; }
    let cancelled = false;

    async function load() {
      try {
        // Resolve typeNames — use cached featureTypes or fetch capabilities
        let typeNames = layer.featureTypes.map((ft) => ft.name).filter(Boolean);
        if (typeNames.length === 0) {
          const capRes  = await fetch(`${layer.url}?service=WFS&request=GetCapabilities`);
          const capText = await capRes.text();
          const xml     = new DOMParser().parseFromString(capText, "text/xml");
          typeNames = [...xml.querySelectorAll("FeatureType Name")]
            .map((el) => el.textContent ?? "")
            .filter(Boolean);
        }
        if (cancelled || typeNames.length === 0) return;

        const url =
          `${layer.url}?service=WFS&version=2.0.0&request=GetFeature` +
          `&outputFormat=application/json&count=500&srsName=EPSG:4326` +
          `&typeNames=${encodeURIComponent(typeNames[0])}`;
        const res  = await fetch(url);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [layer.enabled, layer.url, layer.featureTypes]);

  if (!data) return null;
  return (
    <GeoJSON
      key={layer.id + "-loaded"}
      data={data as GeoJSON.FeatureCollection}
      style={{ color: "#6366f1", weight: 1, fillOpacity: 0.25 }}
      onEachFeature={(feature, leafletLayer) => {
        if (!feature.properties) return;
        const rows = Object.entries(feature.properties)
          .map(([k, v]) => `<tr><td style="padding:1px 6px 1px 0;font-weight:600;white-space:nowrap">${k}</td><td>${v ?? ""}</td></tr>`)
          .join("");
        leafletLayer.bindPopup(`<table style="font-size:12px;border-collapse:collapse">${rows}</table>`, { maxHeight: 240 });
      }}
    />
  );
}

interface WfsControlProps {
  layers:   WfsLayer[];
  onChange: (layers: WfsLayer[]) => void;
}

function WfsControl({ layers, onChange }: WfsControlProps) {
  const [infoLayer,   setInfoLayer]   = useState<WfsLayer | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  function toggleLayer(id: string) {
    onChange(layers.map((l) => l.id === id ? { ...l, enabled: !l.enabled } : l));
  }

  async function showCapabilities(layer: WfsLayer) {
    if (layer.featureTypes.length > 0) { setInfoLayer(layer); return; }
    setLoadingInfo(true);
    try {
      const url  = `${layer.url}?service=WFS&request=GetCapabilities`;
      const res  = await fetch(url);
      const text = await res.text();
      const xml  = new DOMParser().parseFromString(text, "text/xml");
      const types: WfsFeatureType[] = [...xml.querySelectorAll("FeatureType")].map((el) => ({
        name:  el.querySelector("Name")?.textContent  ?? "",
        title: el.querySelector("Title")?.textContent ?? "",
      }));
      const updated = layers.map((l) => l.id === layer.id ? { ...l, featureTypes: types } : l);
      onChange(updated);
      setInfoLayer({ ...layer, featureTypes: types });
    } catch {
      setInfoLayer(layer);
    } finally {
      setLoadingInfo(false);
    }
  }

  return (
    <>
      <div className="absolute bottom-8 right-2 z-[1000] flex flex-col gap-1">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className="flex items-center gap-1.5 rounded border border-border bg-background/90 px-2 py-1 text-xs shadow backdrop-blur"
          >
            <input
              type="checkbox"
              checked={layer.enabled}
              onChange={() => toggleLayer(layer.id)}
              className="h-3 w-3 cursor-pointer"
            />
            <span className="max-w-[120px] truncate">{layer.label}</span>
            <button
              className="ml-auto text-muted-foreground hover:text-foreground"
              onClick={() => showCapabilities(layer)}
              title="Layer capabilities"
            >
              {loadingInfo ? "…" : <Info size={12} />}
            </button>
          </div>
        ))}
      </div>

      {infoLayer && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40"
          onClick={() => setInfoLayer(null)}
        >
          <div
            className="relative bg-background rounded-lg border border-border shadow-lg p-4 w-full max-w-sm mx-4 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              onClick={() => setInfoLayer(null)}
            >
              <X size={14} />
            </button>
            <h2 className="text-sm font-semibold mb-2">{infoLayer.label}</h2>
            {infoLayer.featureTypes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No feature types found.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {infoLayer.featureTypes.map((ft) => (
                  <div key={ft.name} className="text-xs">
                    <span className="font-medium">{ft.title || ft.name}</span>
                    {ft.title && <span className="text-muted-foreground ml-1">({ft.name})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export interface MapPanelProps {
  mapReference:       MapReference | null;
  mapLayer?:          MapLayer;
  mapMode?:           MapMode;
  onMapClick?:        (lat: number, lng: number) => void;
  sectionLine?:       [number, number][];
  measurePoints?:     [number, number][];
  wfsLayers?:         WfsLayer[];
  onWfsLayersChange?: (layers: WfsLayer[]) => void;
}

export function MapPanel({
  mapReference,
  mapLayer      = "osm",
  mapMode       = "none",
  onMapClick,
  sectionLine,
  measurePoints,
  wfsLayers     = [],
  onWfsLayersChange,
}: MapPanelProps) {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[52.52, 13.405]}
        zoom={12}
        className={MAP_PANEL}
        zoomControl={true}
      >
        {mapLayer === "satellite" ? (
          <TileLayer attribution={SAT_ATTR} url={SAT_URL} />
        ) : (
          <TileLayer attribution={OSM_ATTR} url={OSM_URL} />
        )}

        <MapInvalidator />
        <MapFlyTo mapReference={mapReference} />
        <MapClickHandler onMapClick={onMapClick} mapMode={mapMode} />

        {sectionLine && sectionLine.length >= 2 && (
          <Polyline positions={sectionLine} pathOptions={{ color: "#ef4444", weight: 3, dashArray: "6 4" }} />
        )}
        {measurePoints && measurePoints.length >= 2 && (
          <Polyline positions={measurePoints} pathOptions={{ color: "#3b82f6", weight: 2 }} />
        )}

        {wfsLayers.map((layer) => (
          <WfsGeoJsonLayer key={layer.id} layer={layer} />
        ))}
      </MapContainer>

      {wfsLayers.length > 0 && onWfsLayersChange && (
        <WfsControl layers={wfsLayers} onChange={onWfsLayersChange} />
      )}
    </div>
  );
}
