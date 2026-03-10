import { describe, it, expect } from "vitest";
import { interpretOsmTags } from "./interpreter";

describe("interpretOsmTags — basics", () => {
  it("returns name, highway, width, maxspeed, surface", () => {
    const result = interpretOsmTags({
      name: "Lutherstraße", highway: "residential",
      width: "4", maxspeed: "50", surface: "asphalt",
    });
    expect(result.name).toBe("Lutherstraße");
    expect(result.highway).toBe("residential");
    expect(result.width_m).toBe(4);
    expect(result.maxspeed).toBe(50);
    expect(result.surface).toBe("asphalt");
  });

  it("defaults missing numeric fields to undefined", () => {
    const result = interpretOsmTags({});
    expect(result.width_m).toBeUndefined();
    expect(result.maxspeed).toBeUndefined();
    expect(result.lanes.total).toBe(2);
  });
});

describe("interpretOsmTags — lanes", () => {
  it("parses oneway=yes", () => {
    const r = interpretOsmTags({ oneway: "yes", lanes: "3" });
    expect(r.lanes.oneway).toBe(true);
    expect(r.lanes.total).toBe(3);
  });

  it("parses oneway:bicycle=no (bicycle exempt)", () => {
    const r = interpretOsmTags({ oneway: "yes", "oneway:bicycle": "no" });
    expect(r.lanes.oneway).toBe(true);
    expect(r.lanes.bicycleExemptFromOneway).toBe(true);
  });

  it("parses lanes:forward and lanes:backward", () => {
    const r = interpretOsmTags({ lanes: "4", "lanes:forward": "3", "lanes:backward": "1" });
    expect(r.lanes.forward).toBe(3);
    expect(r.lanes.backward).toBe(1);
  });
});

describe("interpretOsmTags — sidewalk", () => {
  it("sidewalk=both → left yes, right yes", () => {
    const r = interpretOsmTags({ sidewalk: "both" });
    expect(r.sidewalk.left).toBe("yes");
    expect(r.sidewalk.right).toBe("yes");
  });

  it("sidewalk=left → left yes, right no", () => {
    const r = interpretOsmTags({ sidewalk: "left" });
    expect(r.sidewalk.left).toBe("yes");
    expect(r.sidewalk.right).toBe("no");
  });

  it("sidewalk:right=separate", () => {
    const r = interpretOsmTags({ "sidewalk:right": "separate" });
    expect(r.sidewalk.right).toBe("separate");
  });

  it("sidewalk=separate → left separate, right separate", () => {
    const r = interpretOsmTags({ sidewalk: "separate" });
    expect(r.sidewalk.left).toBe("separate");
    expect(r.sidewalk.right).toBe("separate");
  });
});

describe("interpretOsmTags — cycleway", () => {
  it("cycleway=lane → both sides lane", () => {
    const r = interpretOsmTags({ cycleway: "lane" });
    expect(r.cycleway.left).toBe("lane");
    expect(r.cycleway.right).toBe("lane");
  });

  it("cycleway:left=track, cycleway:right=lane", () => {
    const r = interpretOsmTags({ "cycleway:left": "track", "cycleway:right": "lane" });
    expect(r.cycleway.left).toBe("track");
    expect(r.cycleway.right).toBe("lane");
  });

  it("bicycle_road=yes", () => {
    const r = interpretOsmTags({ bicycle_road: "yes" });
    expect(r.bicycleRoad).toBe(true);
  });

  it("cycleway:both=track → both sides track", () => {
    const r = interpretOsmTags({ "cycleway:both": "track" });
    expect(r.cycleway.left).toBe("track");
    expect(r.cycleway.right).toBe("track");
  });
});

describe("interpretOsmTags — parking", () => {
  it("parking:left=separate, parking:right=lane with details", () => {
    const r = interpretOsmTags({
      "parking:left": "separate",
      "parking:right": "lane",
      "parking:right:orientation": "parallel",
      "parking:right:fee": "yes",
    });
    expect(r.parking.left.type).toBe("separate");
    expect(r.parking.right.type).toBe("lane");
    expect(r.parking.right.orientation).toBe("parallel");
    expect(r.parking.right.fee).toBe(true);
  });

  it("no parking tags → both sides none", () => {
    const r = interpretOsmTags({});
    expect(r.parking.left.type).toBe("none");
    expect(r.parking.right.type).toBe("none");
  });

  it("parking:both=lane → both sides lane", () => {
    const r = interpretOsmTags({ "parking:both": "lane" });
    expect(r.parking.left.type).toBe("lane");
    expect(r.parking.right.type).toBe("lane");
  });
});
