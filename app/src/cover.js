// Draws the multi-panel GTA-style cover onto a canvas at the canvas's own
// size: white poster gutters, one photo per panel (crop + pan per panel),
// a Vice City neon-sunset grade, bold Anton caption lettering along the
// foot, and an optional vector palm-sunset badge. Everything drawn here is
// the entrant's own art: no Rockstar logo, artwork or font.
import { LAYOUTS } from './layouts.js';

/** Panel rectangles in pixels for a cover of this size, gutters included. */
export function coverPanelRects(width, height, layoutId) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.vice;
  const border = Math.round(Math.min(width, height) * 0.02);
  const gutter = Math.max(2, Math.round(Math.min(width, height) * 0.012));
  const innerW = width - border * 2;
  const innerH = height - border * 2;
  return layout.panels.map((panel) => ({
    x: border + panel.x * innerW + gutter / 2,
    y: border + panel.y * innerH + gutter / 2,
    w: panel.w * innerW - gutter,
    h: panel.h * innerH - gutter,
  }));
}

/** Renders `state` onto `canvas` (an HTMLCanvasElement) at its own size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.vice;

  // Poster paper: white outer border and white gutters between panels.
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, w, h);
  const border = Math.round(Math.min(w, h) * 0.02);
  const rects = coverPanelRects(w, h, state.layout);

  layout.panels.forEach((panel, i) => {
    drawPanel(ctx, rects[i], panelPhoto(state, panel), state.transforms[i], state.grade);
  });

  drawTitleBlock(ctx, w, h, border, state);
  if (state.badge) drawPalmBadge(ctx, w, h, border);
}

/** Which photo a panel shows: slot 0 everywhere when fill-all is on. */
function panelPhoto(state, panel) {
  const slot = state.fillAll ? 0 : panel.slot;
  return state.photos[slot] ?? null;
}

/** One panel: the photo cover-fit with its zoom/pan, then the sunset grade. */
function drawPanel(ctx, rect, photo, transform, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (photo) {
    const t = clampTransform(transform);
    const scale = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) * t.zoom;
    const dw = photo.naturalWidth * scale;
    const dh = photo.naturalHeight * scale;
    const cx = rect.x + rect.w / 2 + t.dx * rect.w;
    const cy = rect.y + rect.h / 2 + t.dy * rect.h;
    ctx.filter = `saturate(${(1 + 0.28 * grade).toFixed(2)}) contrast(${(1 + 0.08 * grade).toFixed(2)}) brightness(1.02)`;
    ctx.drawImage(photo, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.filter = 'none';
  } else {
    drawEmptyPanel(ctx, rect);
  }
  sunsetGrade(ctx, rect, grade);
  ctx.restore();
  ctx.strokeStyle = 'rgba(20, 0, 30, 0.28)';
  ctx.lineWidth = 1;
  ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
}

/** Keeps a pan inside the photo: at zoom 1 there is nowhere to pan to. */
function clampTransform(t) {
  const maxPan = 0.45 * (1 - 1 / Math.max(1, t.zoom));
  return {
    zoom: Math.min(3, Math.max(1, t.zoom)),
    dx: Math.min(maxPan, Math.max(-maxPan, t.dx)),
    dy: Math.min(maxPan, Math.max(-maxPan, t.dy)),
  };
}

/** A panel with no photo yet: a painted sunset gradient with a low sun. */
function drawEmptyPanel(ctx, rect) {
  const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  g.addColorStop(0, '#ff9e57');
  g.addColorStop(0.55, '#ff5e8a');
  g.addColorStop(1, '#7b2fbe');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255, 244, 200, 0.9)';
  ctx.beginPath();
  ctx.arc(rect.x + rect.w / 2, rect.y + rect.h * 0.62, Math.min(rect.w, rect.h) * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = `bold ${Math.max(12, Math.round(rect.h * 0.045))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h * 0.3);
}

/** The neon-sunset grade: warm top light, magenta foot, soft vignette. */
function sunsetGrade(ctx, rect, grade) {
  if (grade <= 0) return;
  const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  g.addColorStop(0, `rgba(255, 190, 90, ${(0.1 * grade).toFixed(3)})`);
  g.addColorStop(0.55, `rgba(255, 110, 90, ${(0.05 * grade).toFixed(3)})`);
  g.addColorStop(1, `rgba(255, 40, 150, ${(0.24 * grade).toFixed(3)})`);
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const v = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  v.addColorStop(0, 'rgba(15, 0, 25, 0)');
  v.addColorStop(1, `rgba(15, 0, 25, ${(0.3 * grade).toFixed(3)})`);
  ctx.fillStyle = v;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** The caption: a dark scrim along the foot, the title in Anton, the tagline under it. */
function drawTitleBlock(ctx, w, h, border, state) {
  const scrimH = h * 0.27;
  const scrim = ctx.createLinearGradient(0, h - scrimH, 0, h);
  scrim.addColorStop(0, 'rgba(12, 0, 24, 0)');
  scrim.addColorStop(1, 'rgba(12, 0, 24, 0.78)');
  ctx.fillStyle = scrim;
  ctx.fillRect(border, h - scrimH, w - border * 2, scrimH);

  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    let size = Math.min(w * 0.13, h * 0.155);
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    while (ctx.measureText(title).width > w * 0.88 && size > 10) {
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
    ctx.strokeText(title, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 45, 150, 0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.03;
    ctx.fillText(title, 0, 0);
    ctx.restore();
  }

  const subtitle = (state.subtitle || '').trim().toUpperCase();
  if (subtitle) {
    const size = Math.max(10, Math.round(h * 0.028));
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    try { ctx.letterSpacing = `${Math.round(size * 0.42)}px`; } catch { /* older browsers */ }
    ctx.fillStyle = '#ffd9ec';
    ctx.fillText(subtitle, w / 2, h - h * 0.028);
    try { ctx.letterSpacing = '0px'; } catch { /* older browsers */ }
  }
}

/** A circular palm-sunset emblem, drawn in vectors, top right of the cover. */
function drawPalmBadge(ctx, w, h, border) {
  const r = Math.min(w, h) * 0.072;
  const cx = w - border - r * 1.15;
  const cy = border + r * 1.15;
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
  drawPalm(ctx, cx - r * 0.08, cy + r * 0.42, r * 0.52);
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

/** A small palm tree silhouette: a curved trunk and six drooping fronds. */
function drawPalm(ctx, x, baseY, size) {
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

/** Renders the cover at an export size and returns a fresh canvas. */
export function renderExport(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, state);
  return canvas;
}
