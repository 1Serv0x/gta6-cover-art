// Neon Vice Cover Studio's entrypoint (Node 22, standard library only).
//
// It hands the app in: copies app/ (the offline cover maker) and
// screenshots/ (four shots of it at work) from beside this file into the
// output directory, then writes dossier.json there with the kit's vendored
// buildDossier library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in
// for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyEntryTree() {
  mkdirSync(outDir, { recursive: true });
  cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  if (existsSync(join(here, 'screenshots'))) {
    cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
  }
}

// The gate's caps (reference/gate.json): text_max_bytes shapes the dossier
// text, while the other caps refuse an entry the scorer would refuse — more
// than 4 screenshots or one over 256 KiB, more than 993 files in app/ or
// 48 MiB of app files in all, or a path under app/ over 1000 bytes.
function writeDossier() {
  writeFileSync(
    join(outDir, 'dossier.json'),
    buildDossier(outDir, {
      text_max_bytes: 163840,
      screenshots: { max: 4, max_bytes: 262144 },
      app_max_files: 993,
      app_max_bytes: 50331648,
      app_path_max_bytes: 1000,
    }),
  );
}

copyEntryTree();
writeDossier();
