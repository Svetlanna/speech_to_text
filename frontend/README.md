# Brynvel — Admin Dashboard HTML Template

A free, dependency-free **admin dashboard / analytics console** template. Six pages,
static HTML, three stylesheets and two small scripts. No build step, no framework,
no chart library, no jQuery.

Built for html.design.

---

## Why this one is different

The html.design catalogue had ~20 marketing/brochure templates and **zero application
UI**, even though "Admin Dashboard" is one of its own listed categories and one of the
highest-demand free-template searches. Brynvel fills that gap — and because it is an
app shell rather than a landing page, its layout can't repeat any previous template.

## Layout spine (app shell archetype)

Not a hero → features → testimonials → CTA page. Every screen is:

1. **Left rail** — brand mark, three nav groups (Monitor / Manage / Configure),
   collapsible to icons, usage meter + user chip pinned to the foot
2. **Command bar** — breadcrumb, ⌘K search trigger, theme toggle, notifications, avatar
3. **Data canvas** — page header, then panels on a 12-column grid

The overview page leads with a **single north-star number at ~3× the scale of anything
else**, with secondary metrics as hairline-separated rows rather than competing cards.
That hierarchy move is the design's whole argument.

## Pages

| File | What it demonstrates |
|---|---|
| `index.html` | North-star KPI, stat tiles with sparklines, area chart, ranked bars, donut, activity feed, status line |
| `analytics.html` | Tabs, filter chips, bar chart, activation funnel, cohort retention heatmap, top-pages table, empty state |
| `customers.html` | Full data table — sortable headers, row selection + bulk bar, live search, pagination, slide-over detail drawer |
| `billing.html` | Plan card with usage meters, payment method, plan radio cards, invoice table, spend chart |
| `settings.html` | Vertical tabs, forms, toggle switches, team table with role selects, API keys with copy-to-clipboard, danger zone |
| `login.html` | Split auth screen with photographic backdrop and social proof |

## Design direction

Modelled on how 2026 data products actually look (Linear, Vercel, Supabase, Sentry,
Mercury): **quiet chrome, restrained colour, tables reclaimed as the primary interface**.
Hierarchy comes from type scale and spacing, not from borders and shadows.

- **Colour** — cool blue-black canvas `#0A0D12` with a single azure accent `#1FB6FF`.
  Green / amber / red appear *only* to carry state (healthy, degraded, failed), never
  as decoration. Direction is also encoded with an arrow, so status never depends on
  colour alone.
- **Type** — Host Grotesk (display) · Schibsted Grotesk (UI) · Azeret Mono (numerals).
  Every figure that can change or be compared is set in tabular mono so columns align
  and digits don't jitter between renders.
- **Themes** — dark by default with a fully designed light theme. The choice is stored
  in `localStorage` and applied by a blocking snippet in `<head>`, so there is no flash
  of the wrong theme on load.

## Charts

Hand-built SVG in `assets/js/charts.js` — no Chart.js, no D3, no network requests.
Charts are declarative; the markup carries the data:

```html
<div class="chart__wrap" data-chart="area" data-height="260" data-prefix="$"
     data-values="164000,171000,168400,182000"
     data-labels="Mar,Apr,May,Jun"></div>
```

Types: `spark`, `area` (with hover crosshair + tooltip), `bar`, `donut`.

## Accessibility

- Semantic landmarks, real `<table>` markup, `aria-current` on the active nav item
- Tabs use `role="tablist"` / `role="tab"` / `role="tabpanel"`; sortable headers expose `aria-sort`
- Sortable headers are keyboard-operable (Enter / Space) and focusable
- Visible focus rings; icon-only buttons carry `aria-label`
- Heatmap cells flip to dark ink above ~62% intensity so text keeps 4.5:1 contrast
- Full `prefers-reduced-motion` support — chart draw-in, reveals and pulses all stop

## Files

```
brynvel/
├── index.html  analytics.html  customers.html
├── billing.html  settings.html  login.html
├── assets/
│   ├── css/  tokens.css · shell.css · ui.css
│   ├── js/   charts.js · app.js
│   └── img/  CREDITS.md
└── README.md
```

Three stylesheets by concern: `tokens.css` (design tokens, reset, buttons, forms),
`shell.css` (rail, command bar, drawer, palette, toasts), `ui.css` (panels, stats,
charts, tables). Swap the token block and the whole console re-skins.

## Customising

Everything visual is a CSS custom property in `assets/css/tokens.css`:

```css
:root {
  --canvas:  #0A0D12;   /* app background   */
  --surface: #10141C;   /* panels, rail     */
  --accent:  #1FB6FF;   /* the one accent   */
  --ok: #34D399;  --warn: #FBBF24;  --err: #F87171;
}
```

Change `--accent` and the charts, active nav state, focus rings, chips and primary
buttons all follow — they all reference the token, none hardcode the colour.

## Browser support

Modern evergreen browsers. Uses `:has()` for the plan radio cards (progressive — the
cards still work without it) and `color-mix()` for the command bar's translucency.

## Notes

- Photography loads from Unsplash at request time — see `assets/img/CREDITS.md`.
  Self-host before production.
- Buttons that would hit a backend raise a toast instead. This is a front-end template;
  there is no server behind it.

---

**Name check (informal, not a legal opinion)** — "Brynvel"

- Google: no company or product under this name; nearest matches are Brynild
  (Norwegian confectionery), Brynje (technical apparel) and Brynwood Partners
  (private equity) — all different names, all unrelated classes
- USPTO: no record returned for the exact mark
- Domain: no owner found for brynvel.com
- Rejected during the search: **Klarvo** (active AI/SaaS compliance platform — same
  category), **Kestrix** (registered UK company), **Kelvora** (active AI assurance
  platform), **Zentari** / **Tavren** (both active software agencies)
- Verdict: clear to ship
