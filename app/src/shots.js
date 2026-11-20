// Fixed scenes for screenshots: ?shot=cover shows the cover alone at an
// export size, ?shot=editor shows the editor with photos loaded. The query
// picks the size (1080x1080, 1080x1350 or 1920x1080), the layout and the
// caption. main.js sets window.__shotReady once the scene is painted.
import { LAYOUTS } from './layouts.js';

const SAMPLES = ['boulevard', 'beach', 'skyline'];

export async function runShot(shot, query, api) {
  const { state, redraw, loadSampleInto, setExportSize } = api;
  const size = query.get('size') ?? '1920x1080';
  const layout = query.get('layout') ?? 'vice';
  const title = query.get('title');
  const subtitle = query.get('subtitle');

  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (LAYOUTS[layout]) {
    state.layout = layout;
    const radio = document.querySelector(`input[name=layout][value="${layout}"]`);
    if (radio) radio.checked = true;
    document.getElementById('layout-hint').textContent = LAYOUTS[layout].hint;
  }
  if (title !== null) {
    state.title = title;
    document.getElementById('title').value = title;
  }
  if (subtitle !== null) {
    state.subtitle = subtitle;
    document.getElementById('subtitle').value = subtitle;
  }
  setExportSize(size);
  await Promise.all(SAMPLES.map((name, i) => loadSampleInto(i, name)));
  redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}
