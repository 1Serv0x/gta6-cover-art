// Paints the multi-panel cover onto a canvas at the canvas's own size:
// white poster borders and gutters, one photo per panel (cropped and panned
// per panel), a Vice City neon-sunset wash, heavy poster lettering along the
// foot, and an optional vector palm-sunset emblem. All of it is drawn here
// from scratch: no Rockstar logo, artwork or font anywhere.
import { FRAMES } from './frames.js';

/** Pixel boxes for the panels of a cover this size, borders and gutters in. */
export function frameBoxes(width, height, frameId) {
  const frame = FRAMES[frameId] ?? FRAMES.grid;
  const edge = Math.round(Math.min(width, height) * 0.02);
  const gap = Math.max(2, Math.round(Math.min(width, height) * 0.012));
  const innerW = width - edge * 2;
  const innerH = height - edge * 2;
  return frame.panels.map((panel) => ({
    x: edge + panel.x * innerW + gap / 2,
    y: edge + panel.y * innerH + gap / 2,
    w: panel.w * innerW - gap,
    h: panel.h * innerH - gap,
  }));
}

/** Paints `cover` onto `canvas` (an HTMLCanvasElement) at its own size. */
export function paintPoster(canvas, cover) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const frame = FRAMES[cover.frame] ?? FRAMES.grid;
  const edge = Math.round(Math.min(w, h) * 0.02);
  const boxes = frameBoxes(w, h, cover.frame);

  // Poster paper: a warm-white sheet behind everything.
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, w, h);

  frame.panels.forEach((panel, i) => {
    paintPhotoPanel(ctx, boxes[i], photoForPanel(cover, panel), cover.crops[i], cover.warmth);
  });

  paintHeadline(ctx, w, h, edge, cover);
  if (cover.emblem) paintEmblem(ctx, w, h, edge);
}

/** Which photo a panel shows: slot 0 everywhere when single-photo is on. */
function photoForPanel(cover, panel) {
  const slot = cover.singlePhoto ? 0 : panel.slot;
  return cover.images[slot] ?? null;
}

/** One panel: the photo cover-fit with its crop, then the sunset wash. */
function paintPhotoPanel(ctx, box, photo, crop, warmth) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  if (photo) {
    const c = boundCrop(crop);
    const scale = Math.max(box.w / photo.naturalWidth, box.h / photo.naturalHeight) * c.zoom;
    const dw = photo.naturalWidth * scale;
    const dh = photo.naturalHeight * scale;
    const cx = box.x + box.w / 2 + c.dx * box.w;
    const cy = box.y + box.h / 2 + c.dy * box.h;
    ctx.filter = `saturate(${(1 + 0.28 * warmth).toFixed(2)}) contrast(${(1 + 0.08 * warmth).toFixed(2)}) brightness(1.02)`;
    ctx.drawImage(photo, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.filter = 'none';
  } else {
    paintBlankPanel(ctx, box);
  }
  sunsetWash(ctx, box, warmth);
  ctx.restore();
  ctx.strokeStyle = 'rgba(20, 0, 30, 0.28)';
  ctx.lineWidth = 1;
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);
}

/** Keeps a pan inside the photo: at zoom 1 there is nowhere to pan to. */
function boundCrop(crop) {
  const room = 0.45 * (1 - 1 / Math.max(1, crop.zoom));
  return {
    zoom: Math.min(3, Math.max(1, crop.zoom)),
    dx: Math.min(room, Math.max(-room, crop.dx)),
    dy: Math.min(room, Math.max(-room, crop.dy)),
  };
}

/** A panel with no photo yet: a painted sunset with a low sun. */
function paintBlankPanel(ctx, box) {
  const g = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
  g.addColorStop(0, '#ff9e57');
  g.addColorStop(0.55, '#ff5e8a');
  g.addColorStop(1, '#7b2fbe');
  ctx.fillStyle = g;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.fillStyle = 'rgba(255, 244, 200, 0.9)';
  ctx.beginPath();
  ctx.arc(box.x + box.w / 2, box.y + box.h * 0.62, Math.min(box.w, box.h) * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = `bold ${Math.max(12, Math.round(box.h * 0.045))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD A PHOTO', box.x + box.w / 2, box.y + box.h * 0.3);
}

/** The neon-sunset wash: warm light up top, magenta at the foot, vignette. */
function sunsetWash(ctx, box, warmth) {
  if (warmth <= 0) return;
  const g = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
  g.addColorStop(0, `rgba(255, 190, 90, ${(0.1 * warmth).toFixed(3)})`);
  g.addColorStop(0.55, `rgba(255, 110, 90, ${(0.05 * warmth).toFixed(3)})`);
  g.addColorStop(1, `rgba(255, 40, 150, ${(0.24 * warmth).toFixed(3)})`);
  ctx.fillStyle = g;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  const v = ctx.createRadialGradient(
    box.x + box.w / 2, box.y + box.h / 2, Math.min(box.w, box.h) * 0.35,
    box.x + box.w / 2, box.y + box.h / 2, Math.max(box.w, box.h) * 0.75,
  );
  v.addColorStop(0, 'rgba(15, 0, 25, 0)');
  v.addColorStop(1, `rgba(15, 0, 25, ${(0.3 * warmth).toFixed(3)})`);
  ctx.fillStyle = v;
  ctx.fillRect(box.x, box.y, box.w, box.h);
}

/** The words: a dark scrim along the foot, the headline in Anton, tagline under it. */
function paintHeadline(ctx, w, h, edge, cover) {
  const scrimH = h * 0.27;
  const scrim = ctx.createLinearGradient(0, h - scrimH, 0, h);
  scrim.addColorStop(0, 'rgba(12, 0, 24, 0)');
  scrim.addColorStop(1, 'rgba(12, 0, 24, 0.78)');
  ctx.fillStyle = scrim;
  ctx.fillRect(edge, h - scrimH, w - edge * 2, scrimH);

  const headline = (cover.headline || '').trim().toUpperCase();
  if (headline) {
    let size = Math.min(w * 0.13, h * 0.155);
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    while (ctx.measureText(headline).width > w * 0.88 && size > 10) {
      size -= 2;
      ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    }
    ctx.save();
    // A slight lean, the poster-lettering slant.
    ctx.translate(w / 2, h - h * 0.085);
    ctx.transform(1, 0, -0.07, 1, 0, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(18, 0, 32, 0.92)';
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeText(headline, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 45, 150, 0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.03;
    ctx.fillText(headline, 0, 0);
    ctx.restore();
  }

  const tagline = (cover.tagline || '').trim().toUpperCase();
  if (tagline) {
    const size = Math.max(10, Math.round(h * 0.028));
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    try { ctx.letterSpacing = `${Math.round(size * 0.42)}px`; } catch { /* older browsers */ }
    ctx.fillStyle = '#ffd9ec';
    ctx.fillText(tagline, w / 2, h - h * 0.028);
    try { ctx.letterSpacing = '0px'; } catch { /* older browsers */ }
  }
}

/** A round palm-sunset emblem, drawn in vectors, top right of the cover. */
function paintEmblem(ctx, w, h, edge) {
  const r = Math.min(w, h) * 0.072;
  const cx = w - edge - r * 1.15;
  const cy = edge + r * 1.15;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const sky = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  sky.addColorStop(0, '#ffcf5e');
  sky.addColorStop(0.5, '#ff6a8a');
  sky.addColorStop(1, '#8a2be2');
  ctx.fillStyle = sky;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.28, r * 0.26, 0, Math.PI * 2);
  ctx.fill();
  // Sea line and palm silhouette.
  ctx.fillStyle = '#2a0a4a';
  ctx.fillRect(cx - r, cy + r * 0.42, r * 2, r * 0.58);
  drawPalmTree(ctx, cx - r * 0.08, cy + r * 0.42, r * 0.52);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r + Math.max(2, r * 0.09), 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(18, 0, 32, 0.55)';
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.stroke();
}

/** A small palm silhouette: one curved trunk, six drooping fronds. */
function drawPalmTree(ctx, x, baseY, size) {
  ctx.strokeStyle = '#2a0a4a';
  ctx.fillStyle = '#2a0a4a';
  ctx.lineWidth = Math.max(1.5, size * 0.07);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + size * 0.08, baseY - size * 0.55, x + size * 0.22, baseY - size * 0.95);
  ctx.stroke();
  const topX = x + size * 0.22;
  const topY = baseY - size * 0.95;
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI * (0.08 + i * 0.17);
    const len = size * (0.62 - Math.abs(i - 2.5) * 0.05);
    const ex = topX + Math.cos(angle) * len;
    const ey = topY - Math.sin(angle) * len * 0.45 + len * 0.28;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(angle) * len * 0.6, topY - Math.sin(angle) * len * 0.5, ex, ey);
    ctx.stroke();
  }
}

/** Paints the cover at an export size and hands back a fresh canvas. */
export function renderForExport(cover, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  paintPoster(canvas, cover);
  return canvas;
}
