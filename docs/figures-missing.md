# Missing Figure SVGs

All files go in `src/assets/figures/`. Once added, register each variant in `src/figures/registry.tsx` following the existing SVG-import pattern.

---

## SIDEWALK (3 missing)

| File | Variant ID | Label DE / EN | Notes |
|------|-----------|---------------|-------|
| `sidewalk-adult.svg` | `pedestrian` | Erwachsener / Adult | Single adult, front or side view |
| `sidewalk-adult-kid.svg` | `pedestrian-child` | Erwachsener + Kind / Adult + child | Adult with child beside them |
| `sidewalk-adult-bike.svg` | `pedestrian-bike` | Erwachsener mit Fahrrad / Adult walking bike | Adult walking a bicycle |

---

## CYCLE_LANE (2 missing — element has no figures until these are added)

| File | Variant ID | Label DE / EN | Notes |
|------|-----------|---------------|-------|
| `cycle-lane-upright.svg` | `cyclist-upright` | Stadtrad (aufrecht) / City bike (upright) | Rider in upright posture on city bike, side view |
| `cycle-lane-racing.svg` | `cyclist-racing` | Rennrad (vorgebeugt) / Racing bike (leaning) | Rider in racing tuck, side view |

---

## CYCLE_LANE_ROAD (2 missing — element has no figures until these are added)

| File | Variant ID | Label DE / EN | Notes |
|------|-----------|---------------|-------|
| `cycle-lane-upright.svg` | `cyclist-upright` | Stadtrad (aufrecht) / City bike (upright) | Same file as CYCLE_LANE |
| `cycle-lane-racing.svg` | `cyclist-racing` | Rennrad (vorgebeugt) / Racing bike (leaning) | Same file as CYCLE_LANE |

---

## TRAFFIC_LANE (2 missing)

| File | Variant ID | Label DE / EN | Notes |
|------|-----------|---------------|-------|
| `traffic-lane-sedan.svg` | `car-sedan` | PKW (Limousine) / Car (sedan) | Sedan side profile |
| `traffic-lane-van.svg` | `car-van` | Transporter / Van | Van side profile, taller and boxier than sedan |

---

## PARKING_LANE (2 missing)

| File | Variant ID | Label DE / EN | Notes |
|------|-----------|---------------|-------|
| `parking-parallel.svg` | `car-parallel` | PKW (parallel) / Car (parallel) | Car parked parallel to curb, side view |
| `parking-perpendicular.svg` | `car-perpendicular` | PKW (quer / Schnauze rein) / Car (nose-in) | Car parked nose-in, front/quarter view |

---

## BUS_LANE (1 missing — element has no figures until this is added)

| File | Variant ID | Label DE / EN | Notes |
|------|-----------|---------------|-------|
| `bus-lane.svg` | `bus` | Bus / Bus | Bus side profile |

---

## PLANTING_STRIP (3 missing)

| File | Variant ID | Label DE / EN | Notes |
|------|-----------|---------------|-------|
| `tree-deciduous.svg` | `tree-deciduous` | Laubbaum (runde Krone) / Deciduous tree | Round canopy; shared with MEDIAN |
| `tree-conifer.svg` | `tree-conifer` | Nadelbaum (spitze Krone) / Conifer tree | Triangular canopy; shared with MEDIAN |
| `planting-strip-ground.svg` | `no-tree` | Ohne Baum (Bodendecker) / No tree (ground cover) | Low ground cover, no trunk |

---

## MEDIAN (2 missing — shares files with PLANTING_STRIP)

| File | Variant ID | Notes |
|------|-----------|-------|
| `tree-deciduous.svg` | `tree-deciduous` | Same file as PLANTING_STRIP |
| `tree-conifer.svg` | `tree-conifer` | Same file as PLANTING_STRIP |

---

## Summary

| Total missing | Unique files |
|---------------|-------------|
| 17 variants | 13 SVG files (`tree-deciduous.svg` and `tree-conifer.svg` shared between PLANTING_STRIP and MEDIAN; `cycle-lane-upright.svg` and `cycle-lane-racing.svg` shared between CYCLE_LANE and CYCLE_LANE_ROAD) |

Note: CYCLE_LANE_ROAD shares the same 2 SVG files with CYCLE_LANE — adding those files unblocks figures for both element types simultaneously.

## Elements with no figures until SVGs are added

- **CYCLE_LANE** — figure toggle hidden until `cycle-lane-upright.svg` is added
- **CYCLE_LANE_ROAD** — figure toggle hidden until `cycle-lane-upright.svg` is added (same files as CYCLE_LANE)
- **BUS_LANE** — figure toggle hidden until `bus-lane.svg` is added
