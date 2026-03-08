import type { StreetConfig } from "../models/street";
import type { ValidationResultItem } from "./types";

export function runRastRules(street: StreetConfig): ValidationResultItem[] {
  const results: ValidationResultItem[] = [];
  const els = street.elements;

  // R01: Sidewalk ≥ 2.5 m
  const sidewalks = els.filter((e) => e.type === "SIDEWALK");
  for (const s of sidewalks) {
    results.push({
      rule_id: "R01",
      status: s.width_m >= 2.5 ? "PASS" : "FAIL",
      message_de: `Gehweg ${s.width_m.toFixed(2)} m (≥ 2,5 m erforderlich)`,
      message_en: `Sidewalk ${s.width_m.toFixed(2)} m (≥ 2.5 m required)`,
      affected_element_ids: [s.id],
    });
  }

  // R02: Cycle lane ≥ 1.85 m
  const cycleLanes = els.filter((e) => e.type === "CYCLE_LANE");
  for (const c of cycleLanes) {
    results.push({
      rule_id: "R02",
      status: c.width_m >= 1.85 ? "PASS" : "FAIL",
      message_de: `Radweg ${c.width_m.toFixed(2)} m (≥ 1,85 m erforderlich)`,
      message_en: `Cycle lane ${c.width_m.toFixed(2)} m (≥ 1.85 m required)`,
      affected_element_ids: [c.id],
    });
  }

  // R03: Traffic lane 2.75–3.75 m
  const trafficLanes = els.filter((e) => e.type === "TRAFFIC_LANE");
  for (const t of trafficLanes) {
    const ok = t.width_m >= 2.75 && t.width_m <= 3.75;
    results.push({
      rule_id: "R03",
      status: ok ? "PASS" : "FAIL",
      message_de: `Fahrspur ${t.width_m.toFixed(2)} m (2,75–3,75 m erforderlich)`,
      message_en: `Traffic lane ${t.width_m.toFixed(2)} m (2.75–3.75 m required)`,
      affected_element_ids: [t.id],
    });
  }

  // R04: Parking lane 2.0–2.5 m
  const parkingLanes = els.filter((e) => e.type === "PARKING_LANE");
  for (const p of parkingLanes) {
    const ok = p.width_m >= 2.0 && p.width_m <= 2.5;
    results.push({
      rule_id: "R04",
      status: ok ? "PASS" : "FAIL",
      message_de: `Parkstreifen ${p.width_m.toFixed(2)} m (2,0–2,5 m erforderlich)`,
      message_en: `Parking lane ${p.width_m.toFixed(2)} m (2.0–2.5 m required)`,
      affected_element_ids: [p.id],
    });
  }

  // R05: Bus lane ≥ 3.0 m
  const busLanes = els.filter((e) => e.type === "BUS_LANE");
  for (const b of busLanes) {
    results.push({
      rule_id: "R05",
      status: b.width_m >= 3.0 ? "PASS" : "FAIL",
      message_de: `Busspur ${b.width_m.toFixed(2)} m (≥ 3,0 m erforderlich)`,
      message_en: `Bus lane ${b.width_m.toFixed(2)} m (≥ 3.0 m required)`,
      affected_element_ids: [b.id],
    });
  }

  // R06: Buffer between cycle and parking/traffic ≥ 0.75 m
  for (let i = 0; i < els.length - 1; i++) {
    const a = els[i];
    const b = els[i + 1];
    const cycleNext =
      (a.type === "CYCLE_LANE" && (b.type === "PARKING_LANE" || b.type === "TRAFFIC_LANE")) ||
      ((a.type === "PARKING_LANE" || a.type === "TRAFFIC_LANE") && b.type === "CYCLE_LANE");
    if (cycleNext) {
      results.push({
        rule_id: "R06",
        status: "WARN",
        message_de: "Puffer zwischen Rad- und Parkstreifen/Fahrspur fehlt",
        message_en: "Buffer between cycle lane and parking/traffic lane missing",
        affected_element_ids: [a.id, b.id],
      });
    }
    if (a.type === "BUFFER" || b.type === "BUFFER") {
      const buf = a.type === "BUFFER" ? a : b;
      if (buf.width_m < 0.75) {
        results.push({
          rule_id: "R06",
          status: "FAIL",
          message_de: `Puffer ${buf.width_m.toFixed(2)} m (≥ 0,75 m erforderlich)`,
          message_en: `Buffer ${buf.width_m.toFixed(2)} m (≥ 0.75 m required)`,
          affected_element_ids: [buf.id],
        });
      }
    }
  }

  // R07: Median ≥ 1.0 m
  const medians = els.filter((e) => e.type === "MEDIAN");
  for (const m of medians) {
    results.push({
      rule_id: "R07",
      status: m.width_m >= 1.0 ? "PASS" : "FAIL",
      message_de: `Mittelstreifen ${m.width_m.toFixed(2)} m (≥ 1,0 m erforderlich)`,
      message_en: `Median ${m.width_m.toFixed(2)} m (≥ 1.0 m required)`,
      affected_element_ids: [m.id],
    });
  }

  // R08: Planting strip ≥ 1.5 m
  const plantingStrips = els.filter((e) => e.type === "PLANTING_STRIP");
  for (const p of plantingStrips) {
    results.push({
      rule_id: "R08",
      status: p.width_m >= 1.5 ? "PASS" : "FAIL",
      message_de: `Pflanzstreifen ${p.width_m.toFixed(2)} m (≥ 1,5 m erforderlich)`,
      message_en: `Planting strip ${p.width_m.toFixed(2)} m (≥ 1.5 m required)`,
      affected_element_ids: [p.id],
    });
  }

  // R09: Total carriageway ≤ 13.0 m
  const carriageTypes = new Set(["TRAFFIC_LANE", "BUS_LANE", "PARKING_LANE"]);
  const carriageWidth = els
    .filter((e) => carriageTypes.has(e.type))
    .reduce((sum, e) => sum + e.width_m, 0);
  if (carriageWidth > 0) {
    results.push({
      rule_id: "R09",
      status: carriageWidth <= 13.0 ? "PASS" : "FAIL",
      message_de: `Fahrbahn gesamt ${carriageWidth.toFixed(2)} m (≤ 13,0 m)`,
      message_en: `Total carriageway ${carriageWidth.toFixed(2)} m (≤ 13.0 m)`,
    });
  }

  // R10: Street total width ≤ 30.0 m
  const totalWidth = els.reduce((sum, e) => sum + e.width_m, 0);
  if (totalWidth > 0) {
    results.push({
      rule_id: "R10",
      status: totalWidth <= 30.0 ? "PASS" : "WARN",
      message_de: `Straße gesamt ${totalWidth.toFixed(2)} m (≤ 30,0 m empfohlen)`,
      message_en: `Street total ${totalWidth.toFixed(2)} m (≤ 30.0 m recommended)`,
    });
  }

  return results;
}
