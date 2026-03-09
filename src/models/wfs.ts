export interface WfsFeatureType {
  name:  string;
  title: string;
}

export interface WfsLayer {
  id:           string;
  label:        string;
  url:          string;
  enabled:      boolean;
  featureTypes: WfsFeatureType[];
}

export const DEFAULT_WFS_LAYERS: WfsLayer[] = [
  {
    id:           "fnp_2025",
    label:        "FNP Berlin 2025",
    url:          "https://gdi.berlin.de/services/wfs/fnp_2025",
    enabled:      false,
    featureTypes: [],
  },
];
