# Berlin Cross-Section Validator

A browser-based tool for designing and validating street cross-sections against Berlin planning standards. Build a street profile element by element, check it against official width requirements, explore real streets on the map, and export your design.

Available in **English** and **German** — toggle the language in the top bar.

---

## What you can do

- **Design** a street cross-section from scratch or from a template
- **Validate** it instantly against 10 rules based on the German RASt guidelines
- **Explore** Berlin's streets on an interactive map with satellite imagery, measurements, and live OpenStreetMap data
- **Export** your cross-section as SVG, PNG, or JSON

---

## Getting started

The screen is divided into two areas:

- **Left sidebar** — your workspace (Design, Explore, Evaluate tabs)
- **Right panel** — the live cross-section preview

To start quickly, use the **New street** dropdown in the cross-section header to load a template:

| Template | Description |
|---|---|
| New empty street | Blank canvas |
| Residential street | 2 lanes, sidewalks, planting strips, buildings |
| Main road | 4 lanes, median, cycle lanes, parking, sidewalks, buildings |

---

## Design tab

This is where you build your street profile.

### Street name

Type a name at the top — it appears in the cross-section preview and in exported files.

### Adding elements

Click any element in the palette to add it to your street. Elements are laid out from left to right in the order you add them.

| Element | What it represents |
|---|---|
| Sidewalk | Pedestrian footpath |
| Cycle lane | Dedicated bicycle path |
| Buffer | Safety gap between a cycle lane and traffic |
| Parking lane | On-street parking strip |
| Traffic lane | Car or mixed-traffic lane |
| Bus lane | Dedicated bus lane |
| Median | Central dividing strip |
| Planting strip | Green strip with trees or vegetation |
| Building (left / right) | Building facade at the street edge |

### Editing an element

Click the **arrow** on any element card to expand it. Inside you can:

- **Rename** it — type a custom label, or leave it blank to use the default name
- **Set the width** in metres
- **Change the side** (Left, Centre, Right)
- **Adjust colours** (fill and stroke)
- **Buildings only**: add or remove floors and set each floor's use (Residential, Commercial, Mixed, Public)

### Reordering

Grab the grip handle on the left of any card and drag it to a new position. You can also use the up/down arrow buttons.

### Expand / collapse all

Use the **Expand all / Collapse all** button above the element list to open or close all cards at once.

---

## Cross-section preview

The right panel shows a live drawing of your street, updated instantly as you make changes.

### Style

Choose a display style from the dropdown:

| Style | What it shows |
|---|---|
| Full | Colours, labels, and measurements |
| Colour + labels | Colours and element names |
| Outline + labels | Black and white with names |
| Outline + labels + measurements | Black and white with names and widths |
| Outline + measurements | Black and white with widths only |

### Zoom

Use **Zoom in**, **Fit**, and **Zoom out** to adjust the view. **Fit** scales the drawing to fill the available space automatically.

### Export

| Format | Best for |
|---|---|
| SVG | Presentations and print — scales to any size without losing quality |
| PNG | Inserting into documents, slides, or emails |
| JSON | Saving and sharing your design — can be loaded back into the tool |

---

## Evaluate tab

Every time you edit your street, the tool automatically checks it against 10 width rules from the German **RASt** (Richtlinien für die Anlage von Stadtstraßen) guidelines.

Each rule shows one of three results:

- **PASS** — meets the requirement
- **WARN** — acceptable but worth reviewing
- **FAIL** — does not meet the minimum requirement

### Rules checked

| Rule | Element | Requirement |
|---|---|---|
| R01 | Sidewalk | At least 2.5 m |
| R02 | Cycle lane | At least 1.85 m |
| R03 | Traffic lane | Between 2.75 m and 3.75 m |
| R04 | Parking lane | Between 2.0 m and 2.5 m |
| R05 | Bus lane | At least 3.0 m |
| R06 | Buffer | At least 0.75 m between a cycle lane and traffic or parking |
| R07 | Median | At least 1.0 m |
| R08 | Planting strip | At least 1.5 m |
| R09 | Total carriageway | No more than 13.0 m (traffic + bus + parking combined) |
| R10 | Total street width | No more than 30.0 m recommended |

Click **Documentation** at the top of the Evaluate tab for the full reference.

---

## Explore tab

An interactive map of Berlin to help you look at real streets and gather context for your design.

### Map tools

| Tool | What it does |
|---|---|
| Satellite | Toggle satellite imagery |
| Mark section | Draw a line on the map to mark where your cross-section is |
| Measure | Click two points to measure the distance between them |
| Inspect | Click anywhere on the map to see OpenStreetMap data for that location |

**Inspect** surfaces information like road type, width, surface material, parking layout, cycling infrastructure, sidewalk presence, and more — directly from OpenStreetMap.

### Street-level imagery

After clicking a location on the map, use the **Mapillary** or **Street View** buttons to open street-level photos of that spot. Useful for understanding what a street actually looks like on the ground.

### WFS layers

Load official Berlin geodata layers (Web Feature Service) directly onto the map to overlay planning information on top of the satellite view.

---

## Tips

- **Buildings** always sit at the left and right edges of the profile. You can add one on each side.
- The cross-section **updates live** as you change widths, so you can immediately see the effect of any adjustment.
- **Custom labels** appear both in the card header and in the exported SVG — helpful for renaming elements to match local terminology, or leaving them blank for a cleaner diagram.
- To share a design, export it as **JSON** and send the file. The recipient can load it back using the **New street** dropdown.
- Clicking an element on the cross-section SVG **highlights** the corresponding card in the sidebar — and vice versa.
