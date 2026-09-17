# Howrah Bridge — Enterprise Marketing PMO Dashboard

A static, dependency-light PMO dashboard that turns the *Howrah Bridge 12-Month Digital
Marketing Master Strategy* workbook into a delivery programme: phases, modules, tasks,
Gantt charts, deliverables, risks and client-facing KPIs.

**Entry point:** `pmo/index.html` — open it directly, or serve the repository root and
browse to `/pmo/`.

```bash
python3 -m http.server 8899      # from the repository root
# http://127.0.0.1:8899/pmo/
```

No build step, no bundler, no framework. Plain ES5-safe JavaScript plus Chart.js from CDN.

---

## Programme model

| | |
|---|---|
| Business | Howrah Bridge Cloud Kitchen & Catering (Powai hub, Mumbai) |
| Programme | Digital Marketing Growth Plan |
| Window | Month 1 = Oct 2025 → Month 12 = Sep 2026 |
| Reporting date (`asOf`) | 17 Sep 2026 — Month 12, the programme's final month |
| Source | `Howrah_Bridge_12_Month_Digital_Marketing_Master_Strategy.xlsx` (13 sheets) |

The nine delivery phases map onto the workbook as follows:

| Phase | Name | Source sheet(s) |
|---|---|---|
| 1 | Website Audit & Foundation | Phase 1 – Website Audit, Phase 2 – Competitor Analysis |
| 2 | SEO Implementation | Phase 3 – SEO Master Plan |
| 3 | Content Marketing | Phase 5 – Content Calendar |
| 4 | Local SEO | Phase 4 – Local SEO & GBP |
| 5 | Meta Ads | Phase 6 – Meta Ads Plan |
| 6 | Google Ads | Phase 7 – Google Ads Plan |
| 7 | Link Building | Phase 9 – Link Building & PR |
| 8 | Conversion Optimization | Phase 8 – CRO & Funnels |
| 9 | Reporting & Analytics | Phase 11 – KPI Dashboard |

The two remaining sheets feed the cross-cutting pages: *Phase 10 – 12M Roadmap* drives the
executive timeline and master Gantt, and *Exec Summary* + *Menu & Basket Analytics* drive the
Business Intelligence page.

---

## Pages

| Route | Page |
|---|---|
| `#/home` | Executive overview: project card, 12 KPI cards, phase health matrix, 12-month roadmap, phase/module delivery board, milestones, top risks |
| `#/phase/p1` … `#/phase/p9` | Per-phase: summary strip, delivery board, module register, phase Gantt, deliverables tracker, risk register, phase KPIs, verbatim source appendix |
| `#/gantt` | Master marketing Gantt across all 8 workstreams with milestones and the dependency map |
| `#/kpis` | Client-facing KPI meters, commercial model and paid-media allocation |
| `#/deliverables` | Global deliverables tracker with status / phase / text filters |
| `#/risks` | Global risk register, exposure heatmap and per-phase exposure |
| `#/intel` | The audited empirical baseline: geography, cohorts, menu engineering, competitors |

Clicking any module name opens a drill-down with its full task and deliverable list.

---

## File layout

```
pmo/
  index.html            script order matters: core → data → components → views → app
  css/pmo.css           the whole design system (tokens, components, print, responsive)
  js/
    pmo-core.js         registry, rollup engine, date maths, formatters
    pmo-ui.js           shared component builders + chart palette/options
    pmo-gantt.js        shared Gantt renderer (month grid, bars, milestones, now line)
    view-*.js           one file per page
    pmo-app.js          sidebar, hash router, module modal, boot
    data/
      program.js        identity, months, team, roadmap, milestones, KPI targets, revenue model, dependencies
      intel.js          audited baseline: geography, cohorts, menu, competitors
      library.js        verbatim source tables (keywords, editorial calendar, campaigns, link tiers…)
      phase-1..9.js     one file per phase: modules → tasks → deliverables, plus risks and KPIs
```

## Data model

Data files only ever call `PMO.registerProgram / registerPhase / registerIntel / registerLibrary`.
Everything derived — progress percentages, task rollups, overdue flags, phase windows, Gantt bar
geometry, programme health — is computed once in `PMO.build()`, so the data files stay declarative.

Progress follows the reference dashboard's convention: **the percentage is `completed / total`
tasks**, with the in-flight share drawn as a blue segment beyond the green completed bar.
A task is *overdue* when its `due` date is before `asOf` and it is not complete.

### Adding or editing content

1. Edit the relevant `js/data/*.js` file. Ids follow `p<phase>-m<module>-t<task>`.
2. Allowed enums — module/task `status`: `completed`, `in-progress`, `not-started`, `blocked`;
   `priority` / risk `impact`: `Critical`, `High`, `Medium`, `Low`; deliverable `status`:
   `Delivered`, `In Review`, `In Progress`, `Pending`, `Blocked`; risk `status`: `Open`,
   `Mitigating`, `Monitoring`, `Closed`.
3. Keep every date inside `2025-10-01 … 2026-09-30`.
4. Re-anchor the whole programme by changing `programStart` / `programEnd` / `asOf` in
   `program.js` — every bar, meter and rollup follows.

## Charts

Charts follow the data-visualisation house rules: one axis only (never a second scale),
categorical hues assigned in fixed order from a CVD-validated palette, single-series charts carry
no legend because the title names them, direct value labels at the bar ends, and every chart has a
"View as table" fallback. Status colours (green/blue/amber/red) are reserved for delivery state
and are never reused as series colours.
