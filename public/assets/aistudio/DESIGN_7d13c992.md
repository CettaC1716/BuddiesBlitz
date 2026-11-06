---
name: Aegis Tactical HUD
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353942'
  surface-container-lowest: '#0a0e16'
  surface-container-low: '#181c24'
  surface-container: '#1c2028'
  surface-container-high: '#262a33'
  surface-container-highest: '#31353e'
  on-surface: '#dfe2ee'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#dfe2ee'
  inverse-on-surface: '#2c3039'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#ffb86b'
  on-secondary: '#492900'
  secondary-container: '#ed9000'
  on-secondary-container: '#583300'
  tertiary: '#d3fff0'
  on-tertiary: '#00382d'
  tertiary-container: '#60f0ce'
  on-tertiary-container: '#006b59'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#ffdcbc'
  secondary-fixed-dim: '#ffb86b'
  on-secondary-fixed: '#2c1700'
  on-secondary-fixed-variant: '#683d00'
  tertiary-fixed: '#6bfad8'
  tertiary-fixed-dim: '#48ddbc'
  on-tertiary-fixed: '#002019'
  on-tertiary-fixed-variant: '#005142'
  background: '#0f131c'
  on-background: '#dfe2ee'
  surface-variant: '#31353e'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: 0.06em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: 0.05em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: 0.05em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0.04em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.03em
  body-lg:
    fontFamily: Chivo
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Chivo
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.01em
  body-sm:
    fontFamily: Chivo
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-lg:
    fontFamily: Space Mono
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  label-md:
    fontFamily: Space Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.12em
  label-sm:
    fontFamily: Space Mono
    fontSize: 9px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.15em
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system drives the loadout configuration, tactical armory, and telemetry interface for high-stakes combat shooters. Built on an intersection of high-contrast military schematics, glassmorphic aerospace avionics, and functional industrial ergonomics, it projects lethal precision, technical supremacy, and cold battlefield utility.

Targeted at competitive tactical gamers and sci-fi FPS operators, the UI evokes tension, readiness, and strategic mastery. The aesthetic rejects rounded consumer softness in favor of chamfered structural plates, reticle brackets, telemetry tick marks, and luminous collimated readouts. Glass panels act as polarized ballistic visors—providing deep focus into weapon modularity, heat signatures, and ballistic trajectories over a matte carbon baseline.

## Colors

The palette is engineered around dark carbon composite environments layered with high-output HUD luminescents:

- **Primary (`#00F0FF` - Neon Cyan):** Primary HUD targeting reticles, active weapon selection borders, optimal stat gains, and primary interactive telemetry.
- **Secondary (`#FF9F1C` - Hazard Amber):** Kinetic energy warnings, ammo capacity deltas, tactical tier badges, hardpoint alerts, and mod capacity constraints.
- **Tertiary (`#50E3C2` - Ballistic Mint):** Secondary passive metrics, weapon durability, stable attachments, and system calibration ticks.
- **Neutral Palette:**
  - Base Hull: `#0B0F17` (Deep Carbon Obsidian)
  - Surface Tier 1: `#131B2A` (Slate Metallic Armor)
  - Surface Tier 2: `#1A2436` (Reinforced Polymer Glass)
  - Structural Wireframe: `#2A3B53` (Machined Steel Edge)
  - High-Contrast Text: `#E2F1FF` (Phosphor Ice White)
  - Dim Telemetry: `#5A718F` (Sub-radar Slate)

## Typography

Typography functions as active targeting HUD graphics. Type hierarchy relies on distinct, purpose-driven font selections:

- **Display & Headlines (`Space Grotesk`):** Angular, technical, and aggressive. Rendered uppercase for weapon designations, loadout classifications (e.g., `ASSAULT / HEAVY ORDNANCE`), and tactical alert headings.
- **Body & Specs (`Chivo`):** High-cadence modern grotesque optimized for quick mechanical breakdown text, recoil stabilization summaries, and weapon lore.
- **Labels & Telemetry (`Space Mono`):** Fixed-pitch, technical militaristic readouts. Used across calibration metrics, optic milliradian offsets, slot serial codes, and stats meter numeric readouts. All technical subheaders, coordinates, and slot counters must use `label-md` or `label-sm` in full capitalization with expanded tracking.

## Layout & Spacing

The interface implements a high-density, multi-panel tactical battle grid inspired by flight HUDs and weapons bay schematics:

- **Desktop Layout:** 12-column dynamic modular layout.
  - **Left Rail (3 cols):** Armory inventory list, weapon categories, and loadout preset cards.
  - **Center Canvas (6 cols):** Interactive 3D weapon inspect view, rotating gimbals, schematic dimensional lines, and optic/barrel attachment hardpoints.
  - **Right Rail (3 cols):** Performance stats telemetry meters, fire selector dynamics, mod slots, and deployment CTA.
- **Tablet / Split Screen:** Reflows into an 8-column layout where the inspect canvas anchors the top viewport, with inventory and telemetry docked side-by-side underneath.
- **Mobile HUD:** 4-column stacked configuration featuring swipeable attachment docks and collapsible bottom-sheet weapon diagnostics.
- **Grid Rhythms:** Panels are separated by razor-thin hairline grid lines (`1px solid #1E2B3E`) rather than empty whitespace, giving the illusion of an unbroken avionics dashboard.

## Elevation & Depth

Visual hierarchy is managed through polarized layered glass, luminescence casting, and sharp mechanical outlines:

- **Surface 0 (Deep Null):** Background canvas (`#0B0F17`) covered with an ultra-faint 16px isometric grid texture at 4% opacity.
- **Surface 1 (Armored Chassis):** Base modular containers built with `#131B2A` at 85% opacity, backdrop blur of `16px`, and an outer border of `1px solid rgba(80, 115, 155, 0.25)`.
- **Surface 2 (Selected Module / Active Target):** Elevated panels use `#1A2436` at 92% opacity, backed by a localized cyan ambient glow (`0px 0px 24px -4px rgba(0, 240, 255, 0.2)`).
- **HUD Reticle Framing:** Corner brackets (`L-shaped` borders, 2px wide, 8px long) anchor every critical weapon card, stats block, and optical preview port to simulate targeting alignment.
- **Scanlines:** Translucent horizontal scanline filters (1px alternating at 2% opacity) optionally overlay active telemetry panels to sustain the in-helmet visor illusion.

## Shapes

The design system rejects traditional rounded corners. The shape profile is razor-sharp (`0px`) with tactical 45-degree chamfers on primary cards, action triggers, and military rank badges:

- **Hard Rectangles:** Standard data cells, weapon stat meter bars, and inventory grids feature absolute right angles (`radius: 0`).
- **Tactical Chamfers (Cut Corners):** Modal windows, primary deploy triggers, and selected item frames use clipped diagonal corners (`clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))`).
- **Hazard Stripes:** 45-degree diagonal alternating hash patterns (amber `#FF9F1C` and dark carbon `#131B2A`) appear on muzzle brakes, launcher barrels, and override buttons to flag high-yield ordnance.

## Components

### Buttons & Tactical Triggers
- **Deploy / Primary Action:** High-intensity cyan `#00F0FF` background with `#0B0F17` bold typography, chamfered right-hand corner, with an oscillating faint outer cyan pulse. Hover states trigger a high-voltage white-out wash and amber accent ping.
- **Secondary Mod / Equip:** Dark slate `#131B2A` with a 1px `#2A3B53` border, corner targeting ticks, and cyan text. Hover shifts border to solid cyan `#00F0FF`.
- **Hazard / Purge Action:** Diagonal `#FF9F1C` amber hazard stripe accent ribbon along the top edge, warning tone label font.

### Stats Meters (Firepower, Accuracy, Range, Mobility)
- Segmented linear bar displays comprised of 20 discrete tactical blocks.
- **Base Fill:** Ice-white phosphor or muted slate depending on current baseline value.
- **Comparison Deltas:** Modifying attachments displays stat increases as luminous `#00F0FF` segmented additions, and stat penalties as flashing `#FF9F1C` amber deductions.
- Right-aligned monospaced value labels (`Space Mono`) indicating exact values (`000-100`).

### Weapon Selection & Attachment Grid Slots
- Grid cells are modular squares/rectangles wrapped in hairline `#1E2B3E` borders.
- Top-left displays attachment socket label (`OPTIC`, `MUZZLE`, `MAGAZINE`, `UNDERBARREL`) in `label-sm`.
- Empty slots show a crosshair reticle icon (`+`) with 20% opacity.
- Occupied slots feature high-contrast weapon blueprint silhouettes with tier badges (`COMMON: Muted Slate`, `TACTICAL: Cyan`, `PROTOTYPE: Amber`).

### Input Fields & Search Filters
- Boxed inputs with carbon background and illuminated cyan active left-rail indicator.
- Search iconography replaced with tactical HUD radar sweep reticles.

### Military Badges & Weapon Class Tags
- Monospaced geometric tags featuring hexagonal or chamfered silhouettes.
- Classification tags (`SMG`, `DMR`, `RAILGUN`, `HEAVY ROCK-LAUNCHER`) flanked by military bracket syntax: `[ CLASS: ASSAULT // SPEC-04 ]`.