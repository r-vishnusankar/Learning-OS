---
# Canonical: DESIGN.md YAML frontmatter is the source of truth for colors,
# rounded, typography, spacing, zIndex, and components. .impeccable/design.json
# holds only what frontmatter cannot express (shadows, scrims, density,
# chart/heat ramps, metadata). Do not duplicate values across the two files.
name: Nexus
description: Calm Career Studio — soft, decisive enterprise learning UI where space equals progress.
colors:
  primary: "#8759f2"
  primary-foreground: "#ffffff"
  primary-strong: "#7346e0"
  primary-hover: "#6339c9"
  secondary: "#f3effe"
  secondary-foreground: "#5b3db8"
  background: "#f7f8fa"
  foreground: "#1f2937"
  card: "#ffffff"
  elevated-card: "#ffffff"
  muted: "#eef1f5"
  muted-foreground: "#4b5563"
  border-subtle: "#e8eaf0"
  border-control: "#6b7280"
  border: "#e8eaf0"
  ring: "#8759f2"
  success: "#15803d"
  success-foreground: "#ffffff"
  success-hover: "#166534"
  success-on-light: "#16a34a"
  destructive: "#dc2626"
  destructive-foreground: "#ffffff"
  destructive-hover: "#b91c1c"
  warning: "#ea580c"
  warning-foreground: "#9a3412"
  info: "#2563eb"
  info-foreground: "#ffffff"
  pastel-purple: "#ede4ff"
  pastel-blue: "#dce9ff"
  pastel-yellow: "#fff3c4"
  pastel-yellow-foreground: "#854d0e"
  pastel-pink: "#ffd6e8"
  code-surface: "#0f172a"
  star-fill: "#ffe180"
  star-stroke: "#c9a227"
  medal-bronze: "#b45309"
  sidebar: "#ffffff"
  sidebar-active: "#f3effe"
  sidebar-accent: "#8759f2"
  chart-1: "#8759f2"
  chart-2: "#ff3e80"
  chart-3: "#eab308"
  chart-4: "#a78bfa"
  chart-5: "#fb7185"
  heat-0: "color-mix(in oklab, #8759f2 8%, #eef1f5)"
  heat-1: "color-mix(in oklab, #8759f2 28%, transparent)"
  heat-2: "color-mix(in oklab, #8759f2 55%, transparent)"
  heat-3: "#8759f2"
dark:
  surface-base: "#14161c"
  surface-card: "#1f242f"
  surface-elevated: "#2c3340"
  surface-overlay: "#2c3340"
  foreground: "#e8eaef"
  muted-foreground: "#a0a5b0"
  border-subtle: "#3a4150"
  border-control: "#8b93a7"
  border: "#3a4150"
  primary-on-dark: "#a78bfa"
  primary-strong: "#7346e0"
  primary-hover: "#6339c9"
  primary-foreground: "#ffffff"
  ring: "#a78bfa"
  secondary: "#322e52"
  secondary-foreground: "#c4b5fd"
  success: "#22c55e"
  success-tint: "#1e3833"
  destructive: "#ff8a8a"
  destructive-tint: "#3d242e"
  warning: "#f59e0b"
  warning-tint: "#3f2c29"
  info: "#70b0ff"
  info-tint: "#202e4d"
  pastel-purple: "#302c4e"
  pastel-purple-foreground: "#a78bfa"
  pastel-blue: "#202e4d"
  pastel-blue-foreground: "#70b0ff"
  pastel-yellow: "#3f3b29"
  pastel-yellow-foreground: "#f59e0b"
  pastel-pink: "#43283c"
  pastel-pink-foreground: "#e8eaef"
  sidebar: "#1f242f"
  sidebar-active: "#322e52"
  sidebar-accent: "#a78bfa"
  sidebar-border: "#3a4150"
  chart-1: "#a78bfa"
  chart-2: "#fb7185"
  chart-3: "#facc15"
  chart-4: "#c4b5fd"
  chart-5: "#f9a8d4"
  heat-0: "#2a2f3c"
  heat-1: "#3e3a5a"
  heat-2: "#57507e"
  heat-3: "#a78bfa"
  code-surface: "#0b0d12"
typography:
  display:
    fontFamily: "Poppins, ui-sans-serif, sans-serif"
    fontSize: "2.625rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Poppins, ui-sans-serif, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Poppins, ui-sans-serif, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  card-title:
    fontFamily: "Poppins, ui-sans-serif, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Poppins, ui-sans-serif, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Poppins, ui-sans-serif, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  caption:
    fontFamily: "Poppins, ui-sans-serif, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
  mono-code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "12px"
  control: "18px"
  lg: "20px"
  xl: "28px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
  section-gap: "48px"
  content-max: "1280px"
  sidebar-width: "208px"
  sidebar-collapsed: "64px"
zIndex:
  base: "0"
  sticky: "10"
  dropdown: "100"
  scrim: "200"
  modal: "210"
  toast: "300"
  tooltip: "400"
components:
  button-primary:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: "48px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.pill}"
  button-primary-disabled:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.pill}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.control}"
    padding: "12px 24px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "color-mix(in oklab, #f3effe 80%, #8759f2)"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.control}"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "12px 24px"
    height: "48px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "12px 24px"
    height: "48px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
    padding: "0px"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: "48px"
  button-destructive-hover:
    backgroundColor: "{colors.destructive-hover}"
    textColor: "{colors.destructive-foreground}"
    rounded: "{rounded.pill}"
  button-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.success-foreground}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: "48px"
  button-success-hover:
    backgroundColor: "{colors.success-hover}"
    textColor: "{colors.success-foreground}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    borderColor: "{colors.border-control}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "48px"
  badge-default:
    backgroundColor: "color-mix(in oklab, #8759f2 15%, transparent)"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  badge-beginner:
    backgroundColor: "color-mix(in oklab, #8759f2 10%, transparent)"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  badge-intermediate:
    backgroundColor: "color-mix(in oklab, #8759f2 20%, transparent)"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  badge-advanced:
    backgroundColor: "color-mix(in oklab, #8759f2 35%, transparent)"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  badge-expert:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  nav-sidebar-item:
    backgroundColor: "transparent"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  nav-sidebar-item-active:
    backgroundColor: "{colors.sidebar-active}"
    textColor: "{colors.sidebar-accent}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  overlay-modal:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "24px"
  overlay-sheet:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "24px"
  overlay-dropdown:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "8px"
  overlay-toast:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "16px"
  overlay-tooltip:
    backgroundColor: "{colors.foreground}"
    textColor: "{colors.card}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
---

# Design System: Nexus

## Overview

**Creative North Star: "The Calm Career Studio"**

Nexus looks like an airy, wayfindable studio where every surface is something the learner is *making* — a skill, a level, a credential. The UI is consumer-warm (generous 28px cards, soft pastels, Poppins) while the product voice stays calm and confident: warmth from the interface, authority from the words. Soft visuals never become playful copy; completion states stay declarative (“Level 3 complete. 2 modules to your certificate.”), never celebratory filler.

**Space = progress.** Generous whitespace is not decoration — it is the visual promise that there is room to advance. When a layout choice is ambiguous, pick the option that makes progress more legible. Soft & decisive is the global component feel: large touch targets, an unmistakable primary action, quiet chrome. Density is a token (`comfortable` | `compact`), not a second visual system — admin tables may tighten spacing; radii, color semantics, and elevation rules stay identical.

**Key Characteristics:**
- Soft, rounded studio surfaces with progress-first layout
- Purple as brand chrome; pastels mapped to a small status vocabulary
- Semantic depth: three in-plane levels + one orthogonal overlay plane
- Shape hierarchy by emphasis (pill vs 18px control), not by semantic variant name
- Tabular numerals on all data; mono only for codes and IDs

## Colors

A cool-paper base with one violet brand accent, three semantic pastels, and dedicated success/destructive tokens for the highest-stakes certification states.

### Primary
- **Nexus Violet** (`#8759f2`, white-on-fill **4.43:1 — fails AA**): Brand identity only — focus rings, sidebar accent, chart-1, tints, borders. Never carry white text.
- **Primary Strong** (`#7346e0`, white-on-fill **5.70:1**): Filled surfaces with white text (default CTA rest).
- **Primary Hover** (`#6339c9`, white-on-fill **7.10:1**): Filled primary hover — darker than rest, never brighter.
- **Primary on Violet** (`#ffffff`): Text/icons on primary-strong / primary-hover fills.

### Secondary
- **Lavender Mist** (`#f3effe`): Soft secondary UI fills and sidebar active background. Paired with **Deep Studio Violet** (`#5b3db8`) for secondary text.

### Neutral
- **Cool Paper** (`#f7f8fa`): App background.
- **Ink Slate** (`#1f2937`): Primary text.
- **Card White** (`#ffffff`): Cards, inputs, sidebar, popovers.
- **Quiet Grey** (`#eef1f5`): Muted surfaces.
- **Readable Grey** (`#4b5563`): Secondary text (must stay readable — not washed out).
- **Hairline Mist** (`#e8eaf0`): `--border-subtle` for decorative card/section strokes; prefer shadow over hard border on cards in light mode.
- **Control Mist** (`#6b7280`): `--border-control` for input/checkbox/toggle boundaries (≥3:1).

### Semantic (required — not pastel substitutes)
Every semantic colour ships with an explicit `*-foreground` (and success’s on-light text). Do not guess white.

| Token | Fill / chrome | White-on-fill (measured) | Foreground on fill | On light tint |
|---|---|---|---|---|
| **Primary** | `#8759f2` brand only | **4.43:1 FAIL** — do not use with white text | — | primary text/icons on tints |
| **Primary Strong** | `#7346e0` filled CTA rest | **5.70:1** | `#ffffff` | — |
| **Primary Hover** | `#6339c9` filled CTA hover | **7.10:1** | `#ffffff` | — |
| **Success** | `#15803d` filled rest | **5.02:1** | `#ffffff` | `#16a34a` (`success-on-light`) |
| **Success Hover** | `#166534` | **7.13:1** | `#ffffff` | — |
| **Destructive** | `#dc2626` filled rest | **4.83:1** | `#ffffff` | use tint + label |
| **Destructive Hover** | `#b91c1c` | **6.47:1** | `#ffffff` | — |
| **Warning** | **Never filled with white text** | — | — | Tint + **`warning-foreground` `#9a3412`** |
| **Info** | `#2563eb` | **5.17:1** | `#ffffff` | info ~15% tint + `#2563eb` text when dual-channel |

### Attention tiers (exactly three — decidable)
1. **Soft / passive** — **Attention Butter** (`pastel-yellow` `#fff3c4`) + `pastel-yellow-foreground` (`#854d0e`): under review, pending certification, waiting. Not urgent.
2. **Active / escalated** — **Warning** (`#ea580c` tint + `warning-foreground`): action required, expiring soon, overdue attention.
3. **Terminal negative** — **Destructive** (`#dc2626`): expired, revoked, failed.

There is **no `pending` colour token**. Soft pending states use pastel-yellow; escalated attention uses warning. Do not invent a third orange/amber chrome colour.

### Pastel map (three semantic + one decorative)
- **Progress Lilac** (`#ede4ff`): Brand / progress surfaces only.
- **Info Sky** (`#dce9ff`): Info / role surfaces only.
- **Attention Butter** (`#fff3c4`): Soft/passive attention only (tier 1 above).
- **Decorative Blush** (`#ffd6e8`): Charts, illustration, marketing texture only — **never** a status and **never** a badge fill.

### Level badges (categorical — violet tint ramp)
Skill level is categorical, not status. Intensity encodes level; purple = progress:
- **beginner** → primary @ 10%
- **intermediate** → primary @ 20%
- **advanced** → primary @ 35%
- **expert** → solid primary, white text

### Dark mode palette
| Token | Dark value |
|---|---|
| background | `#0f0f14` |
| foreground | `#f4f4f5` |
| card | `#18181f` |
| elevated-card | `#23232c` |
| border | `#2a2a34` |
| muted-foreground | `#a1a1aa` |
| pastel-purple | `#2a2440` (re-derived) |
| pastel-blue | `#1e2a40` (re-derived) |
| pastel-yellow | `#3d3520` (re-derived) |

Do not reuse light pastel hexes on dark backgrounds.

**The Three-Pastel Rule.** Only purple, blue, and yellow pastels may carry meaning. Pink is decorative. Inventing a fourth status pastel is a regression.

**The Dual-Channel Status Rule.** Pastel is never the sole carrier of status. Every status surface pairs **tint + icon + text label**.

**The High-Stakes Token Rule.** Complete and expired/revoked must use dedicated success and destructive tokens — never purple or yellow alone.

**The Attention Tier Rule.** Soft = pastel-yellow. Escalated = warning tint + dark foreground. Terminal = destructive. No fourth attention colour.

## Typography

**Display Font:** Poppins (via `--font-display`)
**Body Font:** Poppins (via `--font-sans`)
**Label/Mono Font:** JetBrains Mono (via `--font-mono`) — scoped narrowly (see below)

**Character:** Geometric, friendly, and clear at dashboard density. Soft enough for a learning product; weight (600) on titles carries the calm-confident authority the pastel surfaces don’t.

### Hierarchy
- **Display** (600, 2.625rem / 42px, 1.2, -0.02em): Rare marketing or empty-state heroes.
- **Headline / page** (600, 2.125rem / 34px, 1.25, -0.02em): Page titles (`.text-page`).
- **Title / section** (600, 1.5rem / 24px, 1.35): Section headers (`.text-section`).
- **Card title** (600, 1.25rem / 20px, 1.4): Card headings (`.text-card-title`).
- **Body** (400, 1rem / 16px, 1.65): Default reading text.
- **Label / small** (500–600, 0.875rem / 14px): Buttons, badges, meta.
- **Caption** (400, 0.8125rem / 13px): Fine print, timestamps.
- **Mono code** (400, 0.875rem): Codes and IDs only — weight 400 so mono does not optically overpower Poppins body.

### Numerals
- **Default (N1):** `font-variant-numeric: tabular-nums` on **all** data — progress %, scores, XP, dates, counts, table cells, badges, and inline numbers in sentences. Same Poppins face. Use `.tabular-nums` / `.font-data`.
- **Scoped mono (N2):** JetBrains Mono **only** for credential / verification codes, certificate IDs, API keys, and dense admin table numeric columns.

**The Tabular Data Rule.** If a number is compared, aligned in a column, or tracked over time, it uses tabular nums. If a string must be transcribed without 0/O or 1/l confusion, it may use mono.

**The Calm Copy Rule.** UI copy is calm and confident: short declarative sentences, no exclamation marks, no celebratory filler on completion states.

## Layout

App shell: fixed sidebar (`208px` expanded / `64px` collapsed) + main content capped at `--content-max` (`1280px`). Base spacing rhythm is **8px**. Card padding defaults to **24px** in comfortable density.

**Space = progress.** Prefer open section gaps. Use **`section-gap` (`48px`)** between major dashboard sections; larger breathing room may use `2xl` (48px) or `3xl` (64px). When a layout choice is ambiguous, pick the option that makes progress more legible.

**Density token:** `--density: comfortable | compact`.

| Density | Card padding | Row height |
|---|---|---|
| comfortable | 24px | 56px |
| compact | 16px | 40px |

Compact opts in on admin tables and data-dense surfaces only. Radii, color semantics, and elevation rules do **not** change between densities.

**Responsive:** Sidebar collapses; cards stack; touch targets remain large (buttons default `h-12`).

## Elevation & Depth

Depth is semantic information, not atmosphere.

**Model: three in-plane levels + one overlay plane.** The in-plane levels describe relationships between elements on the same surface. The overlay plane is orthogonal — a temporary mode change (modal, dropdown, popover, sheet, toast) while the page below goes inert. It is **not** a fourth elevation step and must not reuse purple glow to “feel higher.”

**What does not change between themes:** radii, emphasis shape rule, spacing, density, typography, tabular-nums, mono scoping, and the *meaning* of levels 1–3 and the overlay plane. Dark mode changes colour values and the **level-2 mechanism** only.

### In-plane levels (exactly three)

| Level | Light mechanism | Dark mechanism | Means |
|---|---|---|---|
| 1 | **Tonal fill** | **Tonal fill** (same) | Grouping |
| 2 | **Neutral shadow** | **Surface lightness** — `surface-base` → `surface-card` → `surface-elevated` (**three steps only**); **shadows are off** (do not stack transparent “mud” shadows) | Interactivity / lift |
| 3 | **Purple glow** | **Purple glow at ~0.10 opacity** + ring (`primary-on-dark`) | Focus & emphasis only |

**Dark level-2 surface ramp** (canonical under frontmatter `dark:` — **exactly three steps**):

| Token | Role |
|---|---|
| `surface-base` | App background |
| `surface-card` | Cards, sidebar, inputs |
| `surface-elevated` | Hovered/active cards, popovers, dropdowns (in-plane) |

Each step is lighter than the last (≥1.15:1 between adjacent steps). This ramp **replaces** shadow in dark mode — do not ship both. **`surface-overlay` is not a ramp step** — see Overlay plane below.

**Hairline borders invert importance.** Light mode prefers shadow over hard border on cards. Dark mode prefers **`border-subtle` + surface lightness** for separation — quiet decorative outlines, not WCAG-forced 3:1 chrome. Use `border-control` only where the boundary *conveys* a control (inputs, checkboxes, toggles, switches). Overlay panels use `surface-overlay` + `border-subtle`.

### Overlay plane (orthogonal — not level 4)

Entering the overlay plane is signalled by a **scrim**, not by more shadow or purple glow. Overlay panels **do not** receive purple glow.

**`surface-overlay` belongs to this plane, not the in-plane ramp.** When an overlay is open the page beneath is already darkened to the scrim composite (`#0c0d12`); `surface-elevated` is not visible behind the panel. Size `surface-overlay` against that **scrim composite** (target ≥1.4:1), reinforced by `border-subtle` and the overlay-panel treatment — not as a fourth rung above `surface-elevated`. Coincidence that the chosen hex may match `surface-elevated` is fine; the *sizing rule* is scrim-relative.

**Inside an overlay, the three in-plane levels reset and apply normally.**

**Tooltips are the exception.** No scrim, no overlay plane. Tooltips use **control-hover** in light; in dark they use `surface-elevated` + `border-subtle` (still in-plane).

Scrim and overlay-panel tokens live only in `.impeccable/design.json` (CSS mirrors `--scrim`). In dark mode, `overlay-panel` shadow is **resolved as unused** — panels use `surface-overlay` + `border-subtle` instead. Dark scrim is derived from a cool value **below** `surface-base` (`rgba(10, 11, 15, 0.80)`), not from Ink Slate (Ink Slate is lighter than the dark base and would lighten the page).

### Shadow Vocabulary (token names — values in design.json)
- **control-rest / control-hover / card-rest** (L2 light only): Disabled (transparent) under `.dark`.
- **card-focus / emphasis-glow** (L3): Purple glow; dark uses reduced opacity (~0.10).
- **overlay-panel** (overlay plane, light): Neutral separation from scrim. **Dark: not used** — surface-overlay + border-subtle.

**The Three-Level Depth Rule.** Tonal = group. Level 2 = interactive lift (shadow in light, three-step surface ramp in dark). Purple glow = in-plane focus/next only. Overlays use the overlay plane + scrim instead of inventing a fourth level.

**The Overlay Plane Rule.** Scrim signals mode change; overlay panels never use purple glow. `surface-overlay` is sized against the scrim composite, not as a fourth ramp rung. Inside overlays, in-plane levels 1–3 apply as usual. Tooltips stay in-plane (no scrim).

## Dark Mode

### Activation
- Strategy: **`class="dark"` on `<html>`** via `next-themes` (`attribute="class"`), not CSS-only `prefers-color-scheme` alone.
- System preference: `enableSystem` — initial/default follows OS when theme is `system`.
- User toggle: header theme control + Settings; choice persists in **`localStorage` key `nexus-theme`**.
- Implementation: `.dark { … }` overrides the same `:root` CSS variables; `@theme` `--color-*` mappings stay defined once and keep pointing at `var(--*)`.
- **FOUC guard:** `#nexus-theme-bootstrap` is a sync inline script in `<head>` (`src/app/layout.tsx`). next-themes injects its own blocking script, but that script mounts inside `<body>` (first child of `ThemeProvider`) — too late to stop a light first paint when dark is stored. The head script is intentional, not a duplicate to delete; both read `nexus-theme` and set the same class. Also require `suppressHydrationWarning` on `<html>`.

### Semantic colour direction (dark)
In dark mode, semantic states render as **tinted surface + coloured text/icon**, not saturated fill + white text. Pastel status surfaces follow the same rule (re-derived dark tints + light foregrounds).

**Exception:** the primary CTA stays **filled `primary-strong` `#7346e0` + white** in both modes (5.70:1 verified). Do not silently lighten the fill; if it feels heavy on dark, propose an alternative explicitly.

**Brand on dark surfaces:** `#8759f2` fails as text (~4.08:1 on `surface-base`). Use **`primary-on-dark` `#a78bfa`** for text, icons, links, and rings. **`primary-strong`** for filled white-text surfaces only.

### Product exception — certificates stay light
Printable / shareable credentials (`src/lib/certificate-pdf.ts` and any certificate print window) use **hardcoded light ink on light paper**. They are **not theme-aware** and must not inherit `.dark` tokens. A dark certificate is wrong when printed or shared externally.

### What does not change
Radii, emphasis shape, spacing, density, typography, tabular-nums, mono scoping, and elevation *meanings* are identical in both modes.

### Dark contrast audit (permanent)

**Measured against in-plane ramp:** `surface-base` `#14161c` · `surface-card` `#1f242f` · `surface-elevated` `#2c3340` (three steps). **Overlay plane (separate):** `surface-overlay` `#2c3340`, sized against scrim composite `#0c0d12`. Re-run whenever these hexes change.

Floor: **4.5:1** text · **3:1** non-text control boundaries / focus rings · **≥1.15:1** adjacent *in-plane* ramp steps · **≥1.4:1** `surface-overlay` vs scrim composite.

| Pair | Ratio | Status |
|---|---|---|
| foreground / surface-base | 15.02 | PASS |
| foreground / surface-card | 12.91 | PASS |
| foreground / surface-elevated | 10.54 | PASS |
| foreground / surface-overlay | 10.54 | PASS |
| muted-foreground / surface-base | 7.32 | PASS |
| muted-foreground / surface-card | 6.29 | PASS |
| muted-foreground / surface-elevated | 5.14 | PASS |
| muted-foreground / surface-overlay | 5.14 | PASS |
| primary-on-dark / surface-base | 6.64 | PASS |
| primary-on-dark / surface-card | 5.71 | PASS |
| primary-on-dark / surface-elevated | 4.66 | PASS |
| primary-on-dark / surface-overlay | 4.66 | PASS |
| ring / surface-base | 6.64 | PASS (≥3:1) |
| ring / surface-card | 5.71 | PASS |
| ring / surface-elevated | 4.66 | PASS |
| ring / surface-overlay | 4.66 | PASS |
| primary-strong + white (CTA) | 5.70 | PASS |
| primary-hover + white | 7.10 | PASS |
| border-subtle / surface-card | 1.52 | decorative (quiet ~1.5–2:1) |
| border-subtle / surface-overlay | 1.24 | decorative (quiet; separation reinforced by scrim) |
| border-control / surface-base | 5.88 | PASS (≥3:1) |
| border-control / surface-card | 5.05 | PASS |
| border-control / surface-elevated | 4.13 | PASS |
| border-control / surface-overlay | 4.13 | PASS |
| success / base & success-tint | 7.94 / 5.52 | PASS |
| destructive / base & tint | 7.97 / 6.21 | PASS |
| warning / base & tint | 8.42 / 6.10 | PASS |
| info / base & tint | 8.05 / 5.99 | PASS |
| pastel-purple-fg / pastel-purple | 4.84 | PASS |
| pastel-blue-fg / pastel-blue | 5.99 | PASS |
| pastel-yellow-fg / pastel-yellow | 5.23 | PASS |
| pastel-pink-fg / pastel-pink | 10.85 | PASS |
| secondary-foreground / secondary | 6.90 | PASS |
| chart-1 / surface-base | 6.64 | PASS (non-text) |
| chart-2 / surface-base | 6.72 | PASS |
| chart-3 / surface-base | 11.81 | PASS |
| chart-4 / surface-base | 9.80 | PASS |
| chart-5 / surface-base | 9.97 | PASS |
| foreground / heat-0 | 11.11 | PASS |
| foreground / heat-1 | 8.91 | PASS |
| foreground / heat-2 | 6.11 | PASS |
| heat-3 cell (surface-base on violet) | 6.64 | PASS |
| **surface-card / surface-base** | **1.16** | **PASS (≥1.15 in-plane ramp)** |
| **surface-elevated / surface-card** | **1.22** | **PASS (≥1.15 in-plane ramp)** |
| **surface-overlay / scrim composite `#0c0d12`** | **1.53** | **PASS (≥1.4 overlay-plane)** |
| brand `#8759f2` / surface-base | 4.08 | FAIL (expected — use primary-on-dark) |

Scrim composite over `surface-base` `#14161c` (L ≈ 0.00806): old Ink Slate veil → `#1d2531` (L ≈ 0.01806, **lighter** — bug); new `rgba(10,11,15,0.80)` → `#0c0d12` (L ≈ 0.00410, **darker** — correct).

## Shapes

Form language is soft and rounded: studio cards at **28px** (`xl`), controls and inputs share **`--radius-control` (18px)**, chips/badges fully pill. Scale: **sm 12 / control 18 / lg 20 / xl 28** — no separate `md` tier.

### Overlay radii (reuse tokens — do not invent)
| Surface | Radius token |
|---|---|
| Modal / dialog | `xl` (28px) — matches cards |
| Sheet (mobile bottom) | `xl` on **top corners only**; bottom corners `0` |
| Dropdown / popover | `lg` (20px) — control-adjacent |
| Toast | `lg` (20px) |
| Tooltip | `sm` (12px) — in-plane, not overlay plane |

### Emphasis → radius (buttons)
| Emphasis | Shape | Token |
|---|---|---|
| **High** (filled default/CTA, filled destructive, filled success) | Pill | `rounded-full` |
| **Lower** (secondary, outline, ghost, link) | 18px rounded-rect | `--radius-control` |

A destructive *confirm* is still high emphasis — substantial pill, differentiated by colour.

### Nested radius
**Inner radius = outer radius − padding**, only for children sitting flush in a parent’s corner.

**Nested-radius floor:** Computed inner radius clamps to a **minimum of 8px**. If `outer − padding` falls below 8 (e.g. 28 − 24 = 4), use **8** and increase card padding to **28px+** where flush corner media is a recurring pattern. Standalone controls inside a card still use their own tokens — do not apply the nested formula to every button in a card.

**The Emphasis Shape Rule.** Hierarchy reads in shape as well as colour. High emphasis = pill; lower emphasis = 18px control.

## Components

Soft & decisive: large targets, clear primary, quiet chrome.

### Buttons
- **Shape:** By emphasis — high = pill; lower = 18px (`--radius-control`), including link (so focus rings stay soft).
- **Primary:** `primary-strong` fill + white; hover → `primary-hover` (darken, never brighten).
- **Success filled (light):** `success` + white; hover → `success-hover`.
- **Success (dark):** tinted surface (`success-tint`) + coloured text (`success`) — not white-on-saturated fill.
- **Destructive filled (light):** `destructive` + white; hover → `destructive-hover`.
- **Destructive (dark):** `destructive-tint` + `destructive` text — same tinted-surface rule.
- **Warning:** Never a white-on-orange filled pill. Tint + warning text in both modes.
- **Secondary / outline / ghost / link:** 18px radius; secondary uses Lavender Mist.
- **Disabled (decision):** `opacity: 60%` + `pointer-events: none` on all variants. WCAG exempts disabled controls, so this is not an AA requirement — **60% was chosen deliberately** for legibility over the common 50% fade. Filled variants keep their foreground colour at reduced opacity (do not swap filled CTAs to `muted-foreground`). Do not “fix” this back to 50% assuming it was an oversight.
- **Focus:** `ring-2` with light `ring` / dark `primary-on-dark`, offset against background.
- **No `accent` button variant** — Progress Lilac is not a button fill.
- **Expert / solid categorical fills:** use `primary-strong` + white in both modes — not `primary-on-dark` as a fill (white on `#a78bfa` fails AA at 2.72:1).

### Chips / Badges
- **Style:** Pill, tinted fill, medium weight, no hard border, `tabular-nums`.
- **State:** Status badges must include icon + label (Dual-Channel Status Rule). Never use Decorative Blush as a badge fill.
- **Level badges:** Violet tint ramp (beginner 10% → expert solid). Not success/info/warning colours.
- **Soft pending:** pastel-yellow tint + dark foreground — not a separate pending chrome token.

### Cards / Containers
- **Corner Style:** 28px.
- **Background:** Light = Card White. Dark = `surface-card` (elevated interactions → `surface-elevated`).
- **Separation:** Light = card-rest shadow, borderless preferred. Dark = **hairline `border-subtle` + three-step surface ramp** — no L2 shadows. Overlays use `surface-overlay` vs scrim, not a fourth ramp step.
- **Shadow Strategy (light):** card-rest (L2); card-focus purple glow only when emphasized.
- **Internal Padding:** `--card-padding` from density token.
- **Nested media:** Nested-radius formula with 8px floor.

### Inputs / Fields
- **Style:** Borderless Card White, **`--radius-control` (18px)**, control-rest shadow, `h-12`.
- **Focus:** Violet ring; **Error / Disabled:** destructive cues; disabled at **60% opacity** (see Buttons — intentional, not 50%).

### Navigation
- **Sidebar:** White (dark: deep ink), 208px / 64px collapsed.
- **Item:** Quiet grey label; active = Lavender Mist fill + Nexus Violet label/icon; control radius.
- **Mobile:** Collapse to icon rail; active state stays tonal (L1).

### Overlays (modal, sheet, dropdown, popover, toast)
Temporary mode change above an inert page. Signalled by **scrim** (`zIndex.scrim`); panel at `zIndex.modal` / `dropdown` / `toast` per the frontmatter scale.

**Light:** panel shadow = `overlay-panel` (design.json) — neutral, never purple glow.  
**Dark (resolved):** panel = `surface-overlay` + `border-subtle`; overlay-panel shadow is not used. Size the panel against the scrim composite, not against `surface-elevated`.

**Behaviour (required):**
- Focus trap while open; focus returns to the trigger on close.
- Escape closes.
- Scrim click closes **non-destructive** overlays only (destructive confirms require an explicit action).
- Body scroll lock while a modal or sheet is open.
- Respect `prefers-reduced-motion`: opacity only — no scale/slide.

**Content inside overlays:**
- Emphasis shape rule unchanged: primary action = pill; cancel/secondary = `--radius-control`.
- Destructive confirm = filled destructive pill in light; dark uses destructive tint + text treatment for the confirm control while remaining high-emphasis (pill, not softer than cancel).
- Calm Copy Rule: titles are declarative. “Revoke this certificate?” is fine; “Are you sure?!” is not.

**Tooltip** — not an overlay. No scrim. `zIndex.tooltip`, `rounded.sm`; light = control-hover; dark = surface-elevated + border.

### Progress & data (signature)
- Progress percentages, scores, XP, and counts use **tabular-nums** (`.font-data`).
- Heatmap cells use `.heat-0`…`.heat-3` (primary mixes), not pink pastel.

## Do's and Don'ts

### Do:
- **Do** treat whitespace as progress affordance — use `section-gap` (48px) between major sections.
- **Do** use three in-plane elevation meanings; signal overlays with a scrim + `overlay-panel`, not a fourth level or purple glow.
- **Do** reset in-plane levels 1–3 inside overlays (cards still use card-rest).
- **Do** use only the named `zIndex` scale from frontmatter for stacking.
- **Do** trap focus in overlays, restore focus to the trigger on close, and lock body scroll for modal/sheet.
- **Do** pair every status with tint + icon + text label.
- **Do** use `#15803d` for filled success + white; use `#16a34a` for success text/icons on light tints.
- **Do** darken all filled button hovers (`primary-hover`, `success-hover`, `destructive-hover`) — never `brightness()` toward white.
- **Do** render warning as tint + `warning-foreground` — never white-on-warning fill.
- **Do** apply `tabular-nums` to all data; reserve JetBrains Mono (weight 400) for codes and IDs.
- **Do** set button radius by emphasis; clamp nested radius to ≥8px.
- **Do** opt admin tables into `compact` density without changing radii or color semantics.
- **Do** encode categorical levels with the violet tint ramp.

### Don't:
- **Don't** invent a fourth in-plane elevation level or put purple glow on modals/dialogs.
- **Don't** extend the surface ramp to include `surface-overlay`. The overlay plane is orthogonal; sizing it as a fourth rung over-lightens it and breaks foreground contrast.
- **Don't** scrim a tooltip — tooltips stay in-plane.
- **Don't** use arbitrary `z-index` values in components; use the frontmatter `zIndex` scale.
- **Don't** default to backdrop blur on scrims.
- **Don't** close a destructive confirm via scrim click — require an explicit action.
- **Don't** change disabled opacity back to 50% — 60% is the recorded decision for legibility.
- **Don't** place white text on `--primary` (`#8759f2`, 4.43:1). Filled white-text surfaces use `--primary-strong`.
- **Don't** use `--primary` as text, icon, or border on dark surfaces. Use `--primary-on-dark`.
- **Don't** brighten filled success/destructive/primary on hover — darken via hover tokens.
- **Don't** invent an `accent` colour that duplicates `pastel-purple` or paint buttons with Progress Lilac.
- **Don't** use Decorative Blush (`#ffd6e8`) for status, badges, or semantic meaning.
- **Don't** express success or destructive states with purple or yellow pastels alone.
- **Don't** spend status colours on categorical scales (level, role, track, department). Categorical scales use tint ramps or decorative hues.
- **Don't** reintroduce a `pending` colour token beside warning and pastel-yellow.
- **Don't** spray purple-tinted shadows on every card — glow is focus/emphasis only.
- **Don't** use playful or exclamatory copy on completion states.
- **Don't** set JetBrains Mono on progress %, scores, or XP.
- **Don't** assign button radius by semantic variant name in a way that makes a high-emphasis destructive confirm look “less substantial.”
- **Don't** invent a fourth density that also changes colour or elevation rules.
- **Don't** reuse light pastel hexes or light heat/chart mixes on dark surfaces — use frontmatter `dark:` tokens.
- **Don't** keep L2 shadows enabled in dark mode alongside the surface ramp.
- **Don't** theme certificate PDFs / print credentials with `.dark` tokens — they stay light.
