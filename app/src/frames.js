// Frames for Neon Vice Cover Studio: how a cover splits into photo panels,
// the export sizes on offer, and the crop each panel starts with.
//
// A frame is a set of panels. Every panel is a rectangle in fractions of the
// cover (x, y, w, h) plus the photo slot it shows by default (0, 1 or 2).
// The painter clips each photo to its panel, so any photo fills any shape.

export const FRAMES = {
  grid: {
    label: 'Vice Grid',
    note: 'One big hero panel, two stacked beside it',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1, slot: 0 },
      { x: 0.62, y: 0, w: 0.38, h: 0.52, slot: 1 },
      { x: 0.62, y: 0.52, w: 0.38, h: 0.48, slot: 2 },
    ],
  },
  columns: {
    label: 'Sunset Strip',
    note: 'Three tall panels standing side by side',
    panels: [
      { x: 0, y: 0, w: 1 / 3, h: 1, slot: 0 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1, slot: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1, slot: 2 },
    ],
  },
  solo: {
    label: 'Hero Shot',
    note: 'A single photo, edge to edge',
    panels: [{ x: 0, y: 0, w: 1, h: 1, slot: 0 }],
  },
};

/** The PNG sizes the app exports, in pixels. */
export const OUTPUT_SIZES = [
  { id: '1080x1080', label: 'Square', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Wide', w: 1920, h: 1080 },
];

/** A panel's starting crop: slightly zoomed in, centred. Zoom 1 is cover-fit. */
export function newCrop() {
  return { zoom: 1.15, dx: 0, dy: 0 };
}

/** One starting crop per photo slot (three panels at most). */
export function newCrops() {
  return [newCrop(), newCrop(), newCrop()];
}
