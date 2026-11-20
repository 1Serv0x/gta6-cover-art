// Neon Vice Cover Studio, wired up: photo slots, frame and caption controls,
// per-panel cropping (drag to pan, scroll to zoom, or the sliders), the live
// preview, and PNG export in the three post sizes. A `?shot=` query stages a
// fixed scene for a screenshot instead (stageScene, below).
//
// Polished pass on exports: the export buttons lock while a PNG is being
// written (no double-clicks, no overlapping downloads), "Export all three"
// runs the sizes one at a time with a short pause between them so the
// browser finishes each download, and file names are built from the
// headline (slugified, falling back to "neon-vice-cover") instead of a
// fixed name. Drag pans are clamped to the slider range via clampPan.

import { FRAMES, OUTPUT_SIZES, newCrops, newCrop, clampPan } from './frames.js';
import { paintPoster, renderForExport, frameBoxes } from './painter.js';

const poster = document.getElementById('poster');
const notice = document.getElementById('notice');
const downloadBtn = document.getElementById('download');
const downloadAllBtn = document.getElementById('download-all');
const SAMPLE_NAMES = ['boulevard', 'beach', 'skyline'];

const cover = {
  frame: 'grid',
  headline: 'Neon Vice',
  tagline: 'Vice City • 2026',
  singlePhoto: false,
  warmth: 1,
  emblem: true,
  images: [null, null, null],
  crops: newCrops(),
  pickedPanel: 0,
};

let outputSize = OUTPUT_SIZES[0];
let exporting = false;

/** Loads an image from a URL, resolving once it can be painted. */
export function fetchImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function paint() {
  poster.width = outputSize.w;
  poster.height = outputSize.h;
  paintPoster(poster, cover);
  syncCropControls();
}

function syncCropControls() {
  const crop = cover.crops[cover.pickedPanel];
  document.getElementById('crop-zoom').value = crop.zoom;
  document.getElementById('crop-x').value = crop.dx;
  document.getElementById('crop-y').value = crop.dy;
  document.getElementById('panel-number').textContent = String(cover.pickedPanel + 1);
}

function showThumb(slot, url) {
  document.querySelector(`.slot[data-slot="${slot}"] .thumb`).src = url;
}

async function putSampleIn(slot, name) {
  const url = `samples/${name}.jpg`;
  cover.images[slot] = await fetchImage(url);
  showThumb(slot, url);
  paint();
}

/** Fills the three slots with the built-in samples, so the first cover is one click away. */
async function fillWithSamples() {
  await Promise.all(SAMPLE_NAMES.map((name, i) => putSampleIn(i, name)));
}

/** Turns the headline into a safe file-name slug; "Neon Vice" -> "neon-vice". */
export function slugifyHeadline(text) {
  const slug = (text || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'neon-vice-cover';
}

function exportFileName(w, h) {
  return `${slugifyHeadline(cover.headline)}-${w}x${h}.png`;
}

function setExporting(busy) {
  exporting = busy;
  downloadBtn.disabled = busy;
  downloadAllBtn.disabled = busy;
}

function savePNG(w, h) {
  return new Promise((resolve, reject) => {
    renderForExport(cover, w, h).toBlob((blob) => {
      if (!blob) return reject(new Error('PNG export produced no data'));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = exportFileName(w, h);
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(blob);
    }, 'image/png');
  });
}

async function exportSingle(size) {
  if (exporting) return null;
  setExporting(true);
  try {
    const blob = await savePNG(size.w, size.h);
    notice.textContent = `Saved ${exportFileName(size.w, size.h)} (${Math.round(blob.size / 1024)} KiB)`;
    return blob;
  } catch (err) {
    notice.textContent = `Export failed: ${err.message}`;
    return null;
  } finally {
    setExporting(false);
  }
}

// --- photo slots -----------------------------------------------------------
document.querySelectorAll('.slot input[type=file]').forEach((input, slot) => {
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    cover.images[slot] = await fetchImage(url);
    showThumb(slot, url);
    paint();
  });
});
document.querySelectorAll('.sample-btn').forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    const slot = Number(e.target.closest('.slot').dataset.slot);
    await putSampleIn(slot, btn.dataset.sample);
  });
});
document.getElementById('single-photo').addEventListener('change', (e) => {
  cover.singlePhoto = e.target.checked;
  paint();
});

// --- frame -------------------------------------------------------------------
document.querySelectorAll('input[name=frame]').forEach((radio) => {
  radio.addEventListener('change', () => {
    cover.frame = radio.value;
    document.getElementById('frame-note').textContent = FRAMES[cover.frame].note;
    cover.pickedPanel = 0;
    paint();
  });
});

// --- picked panel: sliders ---------------------------------------------------
function pickedCrop() {
  return cover.crops[cover.pickedPanel];
}
document.getElementById('crop-zoom').addEventListener('input', (e) => {
  pickedCrop().zoom = Number(e.target.value);
  paint();
});
document.getElementById('crop-x').addEventListener('input', (e) => {
  pickedCrop().dx = Number(e.target.value);
  paint();
});
document.getElementById('crop-y').addEventListener('input', (e) => {
  pickedCrop().dy = Number(e.target.value);
  paint();
});
document.getElementById('crop-reset').addEventListener('click', () => {
  cover.crops[cover.pickedPanel] = newCrop();
  paint();
});

// --- words, warmth, emblem -----------------------------------------------------
document.getElementById('headline').addEventListener('input', (e) => {
  cover.headline = e.target.value;
  paint();
});
document.getElementById('tagline').addEventListener('input', (e) => {
  cover.tagline = e.target.value;
  paint();
});
document.getElementById('warmth').addEventListener('input', (e) => {
  cover.warmth = Number(e.target.value);
  paint();
});
document.getElementById('emblem').addEventListener('change', (e) => {
  cover.emblem = e.target.checked;
  paint();
});

// --- output size + buttons -------------------------------------------------------
document.querySelectorAll('input[name=ratio]').forEach((radio) => {
  radio.addEventListener('change', () => {
    outputSize = OUTPUT_SIZES.find((s) => s.id === radio.value) ?? OUTPUT_SIZES[0];
    paint();
  });
});
downloadBtn.addEventListener('click', () => exportSingle(outputSize));
downloadAllBtn.addEventListener('click', async () => {
  if (exporting) return;
  setExporting(true);
  try {
    for (const size of OUTPUT_SIZES) {
      await savePNG(size.w, size.h);
      // Give the browser a beat to finish each download before the next.
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    notice.textContent = 'Saved all three sizes: 1080×1080, 1080×1350, 1920×1080.';
  } catch (err) {
    notice.textContent = `Export failed: ${err.message}`;
  } finally {
    setExporting(false);
  }
});

// --- preview: click to pick a panel, drag to pan, scroll to zoom -----------------
function panelUnder(clientX, clientY) {
  const box = poster.getBoundingClientRect();
  const x = ((clientX - box.left) / box.width) * poster.width;
  const y = ((clientY - box.top) / box.height) * poster.height;
  const boxes = frameBoxes(poster.width, poster.height, cover.frame);
  return { x, y, index: boxes.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) };
}

let drag = null;
poster.addEventListener('pointerdown', (e) => {
  const hit = panelUnder(e.clientX, e.clientY);
  if (hit.index === -1) return;
  cover.pickedPanel = hit.index;
  const box = frameBoxes(poster.width, poster.height, cover.frame)[hit.index];
  drag = { x: hit.x, y: hit.y, box, start: { ...pickedCrop() } };
  poster.setPointerCapture(e.pointerId);
  paint();
});
poster.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const hit = panelUnder(e.clientX, e.clientY);
  const crop = pickedCrop();
  crop.dx = clampPan(drag.start.dx + (hit.x - drag.x) / drag.box.w);
  crop.dy = clampPan(drag.start.dy + (hit.y - drag.y) / drag.box.h);
  paint();
});
poster.addEventListener('pointerup', () => { drag = null; });
poster.addEventListener('wheel', (e) => {
  e.preventDefault();
  const crop = pickedCrop();
  crop.zoom = Math.min(3, Math.max(1, crop.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  paint();
}, { passive: false });

// --- fixed scenes for screenshots ----------------------------------------------
// ?shot=cover shows the cover alone at an export size; ?shot=editor shows the
// editor with photos loaded. The query picks the size (1080x1080, 1080x1350 or
// 1920x1080), the frame and the words. start() sets window.__shotReady once
// the scene is painted.
async function stageScene(shot, query) {
  const size = query.get('size') ?? '1920x1080';
  const frame = query.get('frame') ?? 'grid';
  const headline = query.get('title');
  const tagline = query.get('subtitle');

  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (FRAMES[frame]) {
    cover.frame = frame;
    const radio = document.querySelector(`input[name=frame][value="${frame}"]`);
    if (radio) radio.checked = true;
    document.getElementById('frame-note').textContent = FRAMES[frame].note;
  }
  if (headline !== null) {
    cover.headline = headline;
    document.getElementById('headline').value = headline;
  }
  if (tagline !== null) {
    cover.tagline = tagline;
    document.getElementById('tagline').value = tagline;
  }
  pickSize(size);
  await Promise.all(SAMPLE_NAMES.map((name, i) => putSampleIn(i, name)));
  paint();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

/** Picks the preview/output size by id, used by the shot scenes. */
function pickSize(id) {
  outputSize = OUTPUT_SIZES.find((s) => s.id === id) ?? OUTPUT_SIZES[0];
  const radio = document.querySelector(`input[name=ratio][value="${outputSize.id}"]`);
  if (radio) radio.checked = true;
}

// --- hooks the screenshot and export checks drive the app through --------------
window.__coverApp = {
  cover,
  renderExport: (w, h) => renderForExport(cover, w, h),
  exportPNG: (w, h) => new Promise((resolve) => {
    renderForExport(cover, w, h).toBlob((blob) => resolve(blob), 'image/png');
  }),
};

// --- boot ----------------------------------------------------------------------
async function start() {
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
    await stageScene(shot, query);
  } else {
    await fillWithSamples();
    paint();
  }
  window.__shotReady = true;
}

start();
