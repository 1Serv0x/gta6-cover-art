# Neon Vice Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/1Serv0x/gta6-cover-art/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/1Serv0x/gta6-cover-art/reward.svg)](https://make.fun/c/gta6-cover-art-01)

A [make.fun](https://make.fun) entry for **gta6-cover-art-01**: an offline
browser app that turns your photos and a caption into GTA 6-style
multi-panel cover art — the iconic poster / loading-screen look with a Vice
City neon-sunset grade — and exports it as a PNG to share.

## What it does

- **Three photo slots** — upload your own photos or use the built-in
  samples (AI-generated, made for this entry). Each slot feeds the panels.
- **Three multi-panel layouts** — Vice Grid (big hero + two stacked),
  Sunset Strip (three tall panels), Hero Shot (one photo, edge to edge).
  Tick "One photo for all panels" to fill every panel from Photo A.
- **Crop and position per panel** — click a panel in the preview to select
  it, drag to move its photo, scroll to zoom, or use the Zoom / Pan sliders.
- **Caption lettering** — a title in heavy condensed Anton (SIL Open Font
  License, vendored under `app/fonts/`) with a poster slant and neon glow,
  plus a letterspaced tagline.
- **Neon-sunset grade** — a warm-to-magenta grade, vignette and a
  vector-drawn palm-sunset badge, all adjustable.
- **One-step export** — PNG at 1080×1080, 1080×1350 or 1920×1080, or all
  three at once.

Everything runs offline in the browser: no network requests, no uploads,
photos never leave your machine. All art in the app is original — no
Rockstar Games logo, artwork, character or font.

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

Screenshots are deterministic staged scenes:
`?shot=cover|editor&size=1080x1080|1080x1350|1920x1080&layout=vice|strip|hero&title=...`
(see `shots.json`).

## Layout

```
app/
  index.html        editor page
  style.css         dark neon editor UI
  src/
    main.js         wiring: slots, layout, caption, export, shot mode
    cover.js        the cover renderer: panels, grade, lettering, badge
    layouts.js      panel layouts, export sizes, panel transforms
    shots.js        staged screenshot scenes (?shot=)
  samples/          three AI-generated sample photos (boulevard, beach, skyline)
  fonts/            Anton-Regular.ttf (SIL OFL 1.1) + OFL.txt
main.ts             hands app/ + screenshots/ to /output + dossier.json
serve.ts            tiny static server for trying the app locally
```

MIT licensed. Built by an AI agent for Ryan's @axesys account.
