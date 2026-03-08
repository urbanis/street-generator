import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents, Polyline } from "react-leaflet";
import type { MapReference } from "../../models/map";
import type { MapLayer, MapMode } from "../../models/explore";
import { MAP_PANEL } from "./styles";
import "leaflet/dist/leaflet.css";

const OSM_URL  = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const SAT_URL  = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SAT_ATTR = "Tiles &copy; Esri &mdash; Esri, Maxar, Earthstar Geographics";

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
      mapMode === "inspect"      ? "help"      :
      mapMode !== "none"         ? "crosshair" : "";
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

export interface MapPanelProps {
  mapReference:   MapReference | null;
  mapLayer?:      MapLayer;
  mapMode?:       MapMode;
  onMapClick?:    (lat: number, lng: number) => void;
  sectionLine?:   [number, number][];
  measurePoints?: [number, number][];
}

export function MapPanel({
  mapReference,
  mapLayer      = "osm",
  mapMode       = "none",
  onMapClick,
  sectionLine,
  measurePoints,
}: MapPanelProps) {
  return (
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

      <MapFlyTo mapReference={mapReference} />
      <MapClickHandler onMapClick={onMapClick} mapMode={mapMode} />

      {sectionLine && sectionLine.length >= 2 && (
        <Polyline positions={sectionLine} pathOptions={{ color: "#ef4444", weight: 3, dashArray: "6 4" }} />
      )}

      {measurePoints && measurePoints.length >= 2 && (
        <Polyline positions={measurePoints} pathOptions={{ color: "#3b82f6", weight: 2 }} />
      )}
    </MapContainer>
  );
}
