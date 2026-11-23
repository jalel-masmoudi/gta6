// Coral Bay: Underworld - make.fun gta6-01 entrypoint (Node 22)
// Handing in an original open-world crime game set in the sun-soaked metropolis of Coral Bay:
// Exploring on foot and by car, driving & carjacking, ambient traffic & living pedestrians,
// a 5-star escalating wanted system with aggressive CBPD police cruisers, full multi-stage
// story campaign, tactical combat with arsenal of firearms, circular minimap & modern HUD,
// start screen, and persistent localStorage save. 100% offline, zero network requests.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

if (existsSync(out)) {
  rmSync(out, { recursive: true, force: true });
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Write the official entry dossier containing screenshots and game source outline
const dossierData = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(out, 'dossier.json'), dossierData);
console.log('Coral Bay: Underworld dossier successfully generated in:', out);
