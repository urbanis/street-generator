import { describe, it, expect } from "vitest";
import { runValidation } from "./engine";
import type { StreetConfig, StreetElement, ElementType } from "../models/street";

// ── Test builders ──────────────────────────────────────────────────────────
// Small factories so every test reads like a sentence: "given a street with…".
// This keeps the ARRANGE step short and the intent obvious.
let n = 0;
const el = (type: ElementType, width_m: number): StreetElement =>
  ({ id: `e${n++}`, type, side: "LEFT", width_m });

const street = (...elements: StreetElement[]): StreetConfig =>
  ({ id: "s", name: "Test street", elements });

// Run the validator and keep only the results for one rule.
const forRule = (s: StreetConfig, ruleId: string) =>
  runValidation(s, "en").filter((r) => r.rule_id === ruleId);

// ── R01: a threshold rule (≥) — classic boundary-value testing ──────────────
describe("R01 — Sidewalk must be ≥ 2.5 m", () => {
  it("passes at exactly 2.5 m (boundary is inclusive)", () => {
    const [r] = forRule(street(el("SIDEWALK", 2.5)), "R01");
    expect(r.status).toBe("PASS");
  });

  it("fails just below the boundary (2.49 m)", () => {
    const [r] = forRule(street(el("SIDEWALK", 2.49)), "R01");
    expect(r.status).toBe("FAIL");
  });

  it("emits one result per sidewalk on the street", () => {
    const results = forRule(street(el("SIDEWALK", 3), el("SIDEWALK", 1)), "R01");
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.status)).toEqual(["PASS", "FAIL"]);
  });
});

// ── R03: a range rule (min–max) — test BOTH edges, inside and outside ───────
describe("R03 — Traffic lane must be within 2.75–3.75 m", () => {
  it("passes at the lower boundary (2.75 m)", () => {
    expect(forRule(street(el("TRAFFIC_LANE", 2.75)), "R03")[0].status).toBe("PASS");
  });

  it("passes at the upper boundary (3.75 m)", () => {
    expect(forRule(street(el("TRAFFIC_LANE", 3.75)), "R03")[0].status).toBe("PASS");
  });

  it("fails when too narrow (2.5 m)", () => {
    expect(forRule(street(el("TRAFFIC_LANE", 2.5)), "R03")[0].status).toBe("FAIL");
  });

  it("fails when too wide (4.0 m)", () => {
    expect(forRule(street(el("TRAFFIC_LANE", 4.0)), "R03")[0].status).toBe("FAIL");
  });
});

// ── R09: an aggregate rule — sums a subset of elements ──────────────────────
describe("R09 — Total carriageway must be ≤ 13.0 m", () => {
  it("sums only carriageway elements (traffic + bus + parking)", () => {
    // 3.5 + 3.5 + 2.5 = 9.5 m → within limit
    const s = street(el("TRAFFIC_LANE", 3.5), el("TRAFFIC_LANE", 3.5), el("PARKING_LANE", 2.5));
    expect(forRule(s, "R09")[0].status).toBe("PASS");
  });

  it("fails when the carriageway sum exceeds 13 m", () => {
    // 3.75 × 4 = 15 m → over the limit
    const s = street(...Array.from({ length: 4 }, () => el("TRAFFIC_LANE", 3.75)));
    expect(forRule(s, "R09")[0].status).toBe("FAIL");
  });

  it("ignores non-carriageway elements (a 20 m sidewalk must not count)", () => {
    const s = street(el("SIDEWALK", 20), el("TRAFFIC_LANE", 3));
    expect(forRule(s, "R09")[0].status).toBe("PASS");
  });

  it("emits no R09 result when the street has no carriageway at all", () => {
    const s = street(el("SIDEWALK", 3), el("PLANTING_STRIP", 2));
    expect(forRule(s, "R09")).toHaveLength(0);
  });
});

// ── R06: a relational rule with a WARN severity (not just PASS/FAIL) ─────────
describe("R06 — Buffer between cycle lane and traffic/parking", () => {
  it("WARNs when a cycle lane sits directly beside a traffic lane", () => {
    const r = forRule(street(el("CYCLE_LANE", 2), el("TRAFFIC_LANE", 3)), "R06");
    expect(r).toHaveLength(1);
    expect(r[0].status).toBe("WARN");
  });

  it("does not warn when a wide-enough buffer separates them", () => {
    const s = street(el("CYCLE_LANE", 2), el("BUFFER", 0.75), el("TRAFFIC_LANE", 3));
    expect(forRule(s, "R06")).toHaveLength(0);
  });
});
