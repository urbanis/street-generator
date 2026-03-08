import React, { createContext, useContext } from "react";

export type Lang = "de" | "en";

const TRANSLATIONS = {
  de: {
    appTitle: "Berlin Querschnitt-Validator",
    version: "v0.1",
    // Tabs
    tabExplore: "Erkunden",
    tabDesign: "Entwerfen",
    tabEvaluate: "Bewerten",
    // Toolbar
    newStreet: "Neue Straße",
    importJson: "JSON importieren",
    documentation: "Dokumentation",
    share: "Teilen",
    // Element types
    SIDEWALK: "Gehweg",
    CYCLE_LANE: "Radweg",
    BUFFER: "Puffer",
    PARKING_LANE: "Parkstreifen",
    TRAFFIC_LANE: "Fahrspur",
    BUS_LANE: "Busspur",
    MEDIAN: "Mittelstreifen",
    PLANTING_STRIP: "Pflanzstreifen",
    // Sides
    LEFT: "Links",
    CENTER: "Mitte",
    RIGHT: "Rechts",
    // Card labels
    widthLabel: "Breite",
    // Validation
    PASS: "OK",
    WARN: "Warnung",
    FAIL: "Fehler",
    // CrossSection
    exportPng: "PNG",
    exportSvg: "SVG",
    exportJson: "JSON",
    themeFull: "Vollständig",
    themeColorLabels: "Farbe + Labels",
    themeColorOnly: "Nur Farbe",
    themeBwPattern: "S/W + Muster + Labels",
    themeBwLabels: "S/W + Labels",
    themeOutline: "Nur Umriss",
    // Map / Explore
    searchPlaceholder: "Adresse oder Ort suchen…",
    mapStreet: "Karte",
    mapSatellite: "Satellit",
    mapModeMarkSection: "Abschnitt markieren",
    mapModeMeasure: "Messen",
    mapModeInspect: "Inspizieren",
    fitMap: "Einpassen",
    clearMap: "Löschen",
    generateSection: "Abschnitt generieren",
    osmDisclaimer: "Daten aus OpenStreetMap. Bitte prüfen und anpassen.",
    // OSM
    osmError: "OSM-Abfrage fehlgeschlagen",
    // Rules
    R01: "Gehweg ≥ 2,5 m",
    R02: "Radweg ≥ 1,85 m",
    R03: "Fahrspur 2,75–3,75 m",
    R04: "Parkstreifen 2,0–2,5 m",
    R05: "Busspur ≥ 3,0 m",
    R06: "Puffer zwischen Rad und Parken/Verkehr ≥ 0,75 m",
    R07: "Mittelstreifen ≥ 1,0 m",
    R08: "Pflanzstreifen ≥ 1,5 m",
    R09: "Fahrbahn gesamt ≤ 13,0 m",
    R10: "Straße gesamt ≤ 30,0 m",
    // Misc
    noElements: "Keine Elemente. Palette unten verwenden.",
    addElement: "Element hinzufügen",
    streetName: "Straßenname",
    streetNamePlaceholder: "z. B. Unter den Linden",
  },
  en: {
    appTitle: "Berlin Cross-Section Validator",
    version: "v0.1",
    tabExplore: "Explore",
    tabDesign: "Design",
    tabEvaluate: "Evaluate",
    newStreet: "New street",
    importJson: "Import JSON",
    documentation: "Documentation",
    share: "Share",
    SIDEWALK: "Sidewalk",
    CYCLE_LANE: "Cycle lane",
    BUFFER: "Buffer",
    PARKING_LANE: "Parking lane",
    TRAFFIC_LANE: "Traffic lane",
    BUS_LANE: "Bus lane",
    MEDIAN: "Median",
    PLANTING_STRIP: "Planting strip",
    LEFT: "Left",
    CENTER: "Center",
    RIGHT: "Right",
    widthLabel: "Width",
    PASS: "Pass",
    WARN: "Warning",
    FAIL: "Fail",
    exportPng: "PNG",
    exportSvg: "SVG",
    exportJson: "JSON",
    themeFull: "Full",
    themeColorLabels: "Color + labels",
    themeColorOnly: "Color only",
    themeBwPattern: "B&W + pattern + labels",
    themeBwLabels: "B&W + labels",
    themeOutline: "Outline only",
    searchPlaceholder: "Search address or place…",
    mapStreet: "Map",
    mapSatellite: "Satellite",
    mapModeMarkSection: "Mark section",
    mapModeMeasure: "Measure",
    mapModeInspect: "Inspect",
    fitMap: "Fit",
    clearMap: "Clear",
    generateSection: "Generate section",
    osmDisclaimer: "Data from OpenStreetMap. Please review and adjust.",
    osmError: "OSM query failed",
    R01: "Sidewalk ≥ 2.5 m",
    R02: "Cycle lane ≥ 1.85 m",
    R03: "Traffic lane 2.75–3.75 m",
    R04: "Parking lane 2.0–2.5 m",
    R05: "Bus lane ≥ 3.0 m",
    R06: "Buffer between cycle and parking/traffic ≥ 0.75 m",
    R07: "Median ≥ 1.0 m",
    R08: "Planting strip ≥ 1.5 m",
    R09: "Total carriageway ≤ 13.0 m",
    R10: "Street total width ≤ 30.0 m",
    noElements: "No elements. Use the palette below.",
    addElement: "Add element",
    streetName: "Street name",
    streetNamePlaceholder: "e.g. Unter den Linden",
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.de;

const LangContext = createContext<Lang>("de");

export function LangProvider({
  value,
  children,
}: {
  value: Lang;
  children: React.ReactNode;
}) {
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

export function useT(): (key: TranslationKey) => string {
  const lang = useLang();
  return (key: TranslationKey) => TRANSLATIONS[lang][key] as string;
}
