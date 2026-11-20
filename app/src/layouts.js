// Panel layouts for the cover: each layout is a list of panels, every panel a
// rectangle in fractions of the cover (x, y, w, h) and the photo slot it shows
// by default (0, 1 or 2). The renderer clips each photo to its panel, so any
// photo fills any panel shape.

export const LAYOUTS = {
  vice: {
    name: 'Vice Grid',
    hint: 'Big hero panel, two stacked panels',
    panels: [
      { x: 0.0, y: 0.0, w: 0.62, h: 1.0, slot: 0 },
      { x: 0.62, y: 0.0, w: 0.38, h: 0.52, slot: 1 },
      { x: 0.62, y: 0.52, w: 0.38, h: 0.48, slot: 2 },
    ],
  },
  strip: {
    name: 'Sunset Strip',
    hint: 'Three tall panels side by side',
    panels: [
      { x: 0.0, y: 0.0, w: 1 / 3, h: 1.0, slot: 0 },
      { x: 1 / 3, y: 0.0, w: 1 / 3, h: 1.0, slot: 1 },
      { x: 2 / 3, y: 0.0, w: 1 / 3, h: 1.0, slot: 2 },
    ],
  },
  hero: {
    name: 'Hero Shot',
    hint: 'One photo, edge to edge',
    panels: [{ x: 0.0, y: 0.0, w: 1.0, h: 1.0, slot: 0 }],
  },
};

/** The export sizes the app offers, in pixels. */
export const SIZES = [
  { id: '1080x1080', label: 'Square', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Wide', w: 1920, h: 1080 },
];

/** A fresh per-panel transform: zoom 1 means cover-fit, dx/dy pan in fractions. */
export function freshPanelTransform() {
  return { zoom: 1.15, dx: 0, dy: 0 };
}

/** One transform per panel slot, shared across layouts (three panels at most). */
export function freshTransforms() {
  return [freshPanelTransform(), freshPanelTransform(), freshPanelTransform()];
}
