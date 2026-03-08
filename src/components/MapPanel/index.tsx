import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { MapReference } from "../../models/map";
import { MAP_PANEL } from "./styles";
import "leaflet/dist/leaflet.css";

interface MapFlyToProps {
  mapReference: MapReference | null;
}

function MapFlyTo({ mapReference }: MapFlyToProps) {
  const map = useMap();
  useEffect(() => {
    if (mapReference) {
      map.flyTo([mapReference.lat, mapReference.lng], mapReference.zoom ?? 17, { duration: 1 });
    }
  }, [map, mapReference]);
  return null;
}

interface MapPanelProps {
  mapReference: MapReference | null;
}

export function MapPanel({ mapReference }: MapPanelProps) {
  return (
    <MapContainer
      center={[52.52, 13.405]}
      zoom={12}
      className={MAP_PANEL}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapFlyTo mapReference={mapReference} />
    </MapContainer>
  );
}
