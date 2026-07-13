---
version: alpha
name: LINSTOR GUI 2026
description: LINBIT brand design system for linstor-gui — light/dark theming via CSS custom properties
colors:
  # Brand (identical in BOTH modes — fills stay light peach, labels stay dark)
  brand-primary: "#FFCC9C"
  brand-primary-hover: "#FFDCBC"
  brand-primary-active: "#FFBA80"
  brand-accent: "#F79133"
  text-on-brand: "#111111"
  # Surfaces — light mode (dark mode variants use the -dark suffix)
  bg-page: "#FFFFFF"
  bg-page-dark: "#111111"
  bg-surface: "#F7F7F7"
  bg-surface-dark: "#1A1A1A"
  bg-nav-item-selected: "#E4E4E4"
  bg-nav-item-selected-dark: "#3F3F3F"
  bg-nav-item-hover: "#F0F0F0"
  bg-nav-item-hover-dark: "#2A2A2A"
  bg-toggle-track: "#FFFFFF"
  bg-toggle-track-dark: "#333333"
  bg-button-secondary-hover: "#FFDCBC"
  bg-button-secondary-hover-dark: "#4A2A15"
  # Text
  text-primary: "#000000"
  text-primary-dark: "#F0F0F0"
  text-secondary: "#3F3F3F"
  text-secondary-dark: "#EEEEEE"
  text-nav: "#111111"
  text-nav-dark: "#E0E0E0"
  text-muted: "#888888"
  text-muted-dark: "#808080"
  # Icons
  icon-default: "#111111"
  icon-default-dark: "#E0E0E0"
  icon-subtle: "#3F3F3F"
  icon-subtle-dark: "#777777"
  # Borders
  border-subtle: "#EEEEEE"
  border-subtle-dark: "#2E2E2E"
  border-default: "#D9D9D9"
  border-default-dark: "#4A4A4A"
  border-button-active: "#DA1E28"
  border-button-active-dark: "#FF5C63"
  border-button-inactive: "#AAAAAA"
  border-button-inactive-dark: "#555555"
  # Interactive / status
  interactive-primary: "#499BBB"
  interactive-primary-dark: "#5AACCC"
  status-error: "#FA4D56"
  status-error-dark: "#FF6B72"
  status-warning: "#FFC130"
typography:
  nav-label:
    fontFamily: Roboto
    fontSize: 16px
    fontWeight: 500
  body:
    fontFamily: Roboto
    fontSize: 14px
    fontWeight: 400
  page-title:
    fontFamily: Roboto
    fontSize: 18px
    fontWeight: 600
rounded:
  sm: 4px
  md: 8px
  lg: 16px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
components:
  button-primary:
    backgroundColor: "{colors.brand-primary}"
    textColor: "{colors.text-on-brand}"
    rounded: "{rounded.sm}"
  button-primary-hover:
    backgroundColor: "{colors.brand-primary-hover}"
    textColor: "{colors.text-on-brand}"
  button-secondary:
    textColor: "{colors.text-nav}"
    rounded: "{rounded.sm}"
  button-secondary-hover:
    backgroundColor: "{colors.bg-button-secondary-hover}"
  button-danger:
    backgroundColor: "{colors.bg-page}"
    textColor: "{colors.border-button-active}"
    rounded: "{rounded.sm}"
  button-danger-hover:
    backgroundColor: "{colors.border-button-active}"
    textColor: "#FFFFFF"
  nav-item:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-nav}"
    rounded: "{rounded.sm}"
    height: 41px
  nav-item-hover:
    backgroundColor: "{colors.bg-nav-item-hover}"
  nav-item-selected:
    backgroundColor: "{colors.bg-nav-item-selected}"
  theme-toggle-track:
    backgroundColor: "{colors.bg-toggle-track}"
    rounded: "{rounded.sm}"
    height: 31px
  theme-toggle-segment-selected:
    backgroundColor: "{colors.bg-page}"
    textColor: "{colors.text-nav}"
---

## Overview

LINBIT industrial minimalism: quiet neutral surfaces, one warm brand accent
(peach `#FFCC9C` filled controls with the darker orange `#F79133` reserved for
icons/text/charts), and a strict two-mode theme. Nothing in feature code picks
its own colors — every surface, text, icon, and border color comes from a
semantic token.

Source of truth in code: `src/app/const/themeTokens.ts` (34 semantic tokens,
both modes) emitted as CSS custom properties — light on `:root`, dark on
`:root[data-theme="dark"]`. Naming: token `bg/nav-item/selected` → CSS
`var(--bg-nav-item-selected)`. `-dark` suffixed tokens in this file document
the dark value of the same custom property; code references the un-suffixed
custom property and the mode switch does the rest.

Design source: Figma `LINSTOR-GUI-2026` (fileKey `mNxW4ZTup7rrAwkF1Y83JN`).
Where the exported tokens JSON and the prototype visuals disagree (e.g. the
JSON claims the light top bar is `#111`), **the prototype visuals win** — the
light top bar is `bg-surface`.

## Colors

- **bg-page / bg-surface**: page vs. chrome. The top bar and sidebar share
  `bg-surface`; content and cards sit on `bg-page`. Cards are outlined with
  `border-subtle`, never shadowed.
- **brand-primary (#FFCC9C)** is a *fill* color. It does not flip with the
  theme, so anything on top of it uses `text-on-brand` (#111) — never
  `text-primary`, which flips to near-white in dark mode.
- **brand-accent (#F79133)** is for icons, links-on-brand, and chart series
  where the peach would be illegible. Never use it as a large fill.
- **text-nav vs text-primary**: `text-nav` (#111/#E0E0E0) is the working text
  color for controls and navigation; `text-primary` (#000/#F0F0F0) is for
  content emphasis. `text-muted` is de-emphasis only — it fails WCAG AA on
  purpose (flagged with design).
- **interactive-primary** (#499BBB) is the link/data-accent blue.
- Status colors (`status-error`, `status-warning`) are feedback-only.

## Typography

Roboto everywhere (falls back to the system stack). Nav labels and toggle
labels are Roboto Medium 16px per the handoff; typography is not yet
tokenized in Figma, so treat these as provisional.

## Layout & Spacing

- Top bar 82px, `bg-surface`, 1px `border-subtle` bottom.
- Sidebar 240px, `bg-surface`; auto-collapses below 992px (icons-only) and
  hides entirely below 768px behind the hamburger.
- Content padding 24px (16px below `md`). Spacing scale: 4/8/16/24.
- Corner radius: 4px controls, 8px overlays, 16px modals.

## Components

All interactive primitives live in `@app/components/*` (Button, Input,
Select, InputNumber, Switch, Checkbox, Radio, Link, SearchForm) and derive
from the tokens; native antd components pick the brand up via the derived
theme in `src/app/const/antdTheme.ts` (`getAntdTheme(mode)` switches antd's
dark algorithm). Sidebar nav-item states live in `src/app/app.css` keyed on
the custom properties.

- **button-primary**: peach fill, dark label, both modes. Hover lightens the
  fill (`brand-primary-hover`).
- **button-secondary**: transparent fill, 1.5px `brand-primary` border, label
  `text-nav` (flips with theme). Hover fills with
  `bg-button-secondary-hover` (peach tint in light, deep brown in dark).
- **button-danger**: `bg-page` fill, `border-button-active` red border/label;
  hover inverts to solid red with white label.
- **nav-item**: 41px row, 4px radius, icon 18×18 + Roboto Medium 16px label;
  chevron rotates 180° in 150ms. Hover → `bg-nav-item-hover`, active route →
  `bg-nav-item-selected` + `aria-current="page"`.
- **theme-toggle**: 31px segmented control pinned at the sidebar bottom; the
  selected segment is a `bg-page` pill with `border-default`; clicking flips
  `data-theme` and persists to localStorage (`__gui__theme`).

## Do's and Don'ts

- **Never hardcode a hex value in feature code.** Use
  `var(--token-name)` in styles, `cssVar('token/name')` from
  `@app/const/themeTokens`, or the `tokens` table in `@app/const/color` for
  the mode-independent brand palette.
- **Don't use `text-primary`/`icon-default` on brand fills** — they flip in
  dark mode; use `text-on-brand`.
- Charts (ApexCharts) cannot read CSS custom properties — take the mode from
  `useThemeMode()` and pass explicit values (`foreColor`, `grid.borderColor`,
  `tooltip.theme`).
- Tailwind arbitrary values are fine when they reference tokens:
  `bg-[var(--bg-surface)]`, `border-[color:var(--border-subtle)]`.
- SVG icon assets use `stroke="currentColor"` / `fill="currentColor"` and get
  their color from the surrounding text token — never bake white/black into
  the asset (exception: art inside colored badges, e.g. faulty-resource).
- New colors go into `themeTokens.ts` *and* this file first, then get used.
