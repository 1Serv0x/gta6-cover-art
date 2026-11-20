// Wires Neon Vice Cover Studio: photo slots, layout and caption controls,
// per-panel crop (drag to pan, scroll to zoom, or the sliders), the live
// preview, and PNG export in the three post sizes. A `?shot=` query sets up
// a fixed scene for a screenshot instead (./shots.js).
import { LAYOUTS, SIZES, freshTransforms } from './layouts.js';
import { drawCover, renderExport, coverPanelRects } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const SAMPLES = ['boulevard', 'beach', 'skyline'];

const state = {
  layout: 'vice',
  title: 'Neon Vice',
  subtitle: 'Vice City • 2026',
  fillAll: false,
  grade: 1,
  badge: true,
  photos: [null, null, null],
  transforms: freshTransforms(),
  selectedPanel: 0,
};

let exportSize = SIZES[0];

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function redraw() {
  canvas.width = exportSize.w;
  canvas.height = exportSize.h;
  drawCover(canvas, state);
  syncPanelControls();
}

function syncPanelControls() {
  const t = state.transforms[state.selectedPanel];
  document.getElementById('zoom').value = t.zoom;
  document.getElementById('pan-x').value = t.dx;
  document.getElementById('pan-y').value = t.dy;
  document.getElementById('panel-name').textContent = String(state.selectedPanel + 1);
}

function setThumb(slot, url) {
  document.querySelector(`.slot[data-slot="${slot}"] .thumb`).src = url;
}

async function loadSampleInto(slot, name) {
  const url = `samples/${name}.jpg`;
  state.photos[slot] = await loadImage(url);
  setThumb(slot, url);
  redraw();
}

/** Puts the three sample photos in the slots so the first cover is one click away. */
async function loadDefaultPhotos() {
  await Promise.all(SAMPLES.map((name, i) => loadSampleInto(i, name)));
}

function downloadPNG(w, h) {
  return new Promise((resolve) => {
    renderExport(state, w, h).toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-vice-cover-${w}x${h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(blob);
    }, 'image/png');
  });
}

async function exportOne(size) {
  const blob = await downloadPNG(size.w, size.h);
  status.textContent = `Saved neon-vice-cover-${size.w}x${size.h}.png (${Math.round(blob.size / 1024)} KiB)`;
  return blob;
}

// --- photo slots -----------------------------------------------------------
document.querySelectorAll('.slot input[type=file]').forEach((input, slot) => {
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    state.photos[slot] = await loadImage(url);
    setThumb(slot, url);
    redraw();
  });
});
document.querySelectorAll('.sample-btn').forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    const slot = Number(e.target.closest('.slot').dataset.slot);
    await loadSampleInto(slot, btn.dataset.sample);
  });
});
document.getElementById('fill-all').addEventListener('change', (e) => {
  state.fillAll = e.target.checked;
  redraw();
});

// --- layout ------------------------------------------------------------------
document.querySelectorAll('input[name=layout]').forEach((radio) => {
  radio.addEventListener('change', () => {
    state.layout = radio.value;
    document.getElementById('layout-hint').textContent = LAYOUTS[state.layout].hint;
    state.selectedPanel = 0;
    redraw();
  });
});

// --- selected panel: sliders -------------------------------------------------
function panelTransform() {
  return state.transforms[state.selectedPanel];
}
document.getElementById('zoom').addEventListener('input', (e) => {
  panelTransform().zoom = Number(e.target.value);
  redraw();
});
document.getElementById('pan-x').addEventListener('input', (e) => {
  panelTransform().dx = Number(e.target.value);
  redraw();
});
document.getElementById('pan-y').addEventListener('input', (e) => {
  panelTransform().dy = Number(e.target.value);
  redraw();
});
document.getElementById('reset-panel').addEventListener('click', () => {
  state.transforms[state.selectedPanel] = { zoom: 1.15, dx: 0, dy: 0 };
  redraw();
});

// --- caption, grade, badge -----------------------------------------------------
document.getElementById('title').addEventListener('input', (e) => {
  state.title = e.target.value;
  redraw();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});
document.getElementById('grade').addEventListener('input', (e) => {
  state.grade = Number(e.target.value);
  redraw();
});
document.getElementById('badge').addEventListener('change', (e) => {
  state.badge = e.target.checked;
  redraw();
});

// --- export size + buttons -----------------------------------------------------
document.querySelectorAll('input[name=size]').forEach((radio) => {
  radio.addEventListener('change', () => {
    exportSize = SIZES.find((s) => s.id === radio.value) ?? SIZES[0];
    redraw();
  });
});
document.getElementById('export').addEventListener('click', () => exportOne(exportSize));
document.getElementById('export-all').addEventListener('click', async () => {
  for (const size of SIZES) await exportOne(size);
  status.textContent = 'Saved all three sizes: 1080×1080, 1080×1350, 1920×1080.';
});

// --- preview: click to select a panel, drag to pan, scroll to zoom --------------
function panelAt(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const x = ((clientX - box.left) / box.width) * canvas.width;
  const y = ((clientY - box.top) / box.height) * canvas.height;
  const rects = coverPanelRects(canvas.width, canvas.height, state.layout);
  return { x, y, index: rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) };
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  if (hit.index === -1) return;
  state.selectedPanel = hit.index;
  const rect = coverPanelRects(canvas.width, canvas.height, state.layout)[hit.index];
  drag = { x: hit.x, y: hit.y, rect, start: { ...panelTransform() } };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const hit = panelAt(e.clientX, e.clientY);
  const t = panelTransform();
  t.dx = drag.start.dx + (hit.x - drag.x) / drag.rect.w;
  t.dy = drag.start.dy + (hit.y - drag.y) / drag.rect.h;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const t = panelTransform();
  t.zoom = Math.min(3, Math.max(1, t.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  redraw();
}, { passive: false });

// --- test hooks: the screenshot and export checks drive the app through these ---
window.__coverApp = {
  state,
  renderExport: (w, h) => renderExport(state, w, h),
  exportPNG: (w, h) => new Promise((resolve) => {
    renderExport(state, w, h).toBlob((blob) => resolve(blob), 'image/png');
  }),
};

// --- boot ----------------------------------------------------------------------
async function boot() {
  try {
    const face = new FontFace('Anton', 'url(./fonts/Anton-Regular.ttf)');
    document.fonts.add(face);
    await face.load();
  } catch {
    // The cover falls back to Arial Black when the font cannot load.
  }
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (shot) {
    await runShot(shot, query, { state, redraw, loadSampleInto, loadImage, setExportSize });
  } else {
    await loadDefaultPhotos();
    redraw();
  }
  window.__shotReady = true;
}

/** Sets the preview/export size by id, used by the shot scenes. */
function setExportSize(id) {
  exportSize = SIZES.find((s) => s.id === id) ?? SIZES[0];
  const radio = document.querySelector(`input[name=size][value="${exportSize.id}"]`);
  if (radio) radio.checked = true;
}

boot();
