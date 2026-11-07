// Point each Listening test at its four per-part MP3s when all four exist.
//
// The source-practice room plays `audioFiles[part - 1]`, so a test that lists
// one full-length MP3 plays that whole recording from 0:00 for every part.
// Run after cut-listening-parts.py (or after copying part files in by hand):
//
//     node scripts/ielts/wire-listening-parts.mjs
//
// Idempotent. Tests whose parts are missing keep their existing entries.

import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const privateDir = path.join(process.cwd(), '.local-private', 'ielts-ocr');
const bundlePath = path.join(privateDir, 'source-tests.json');
const srcCopyPath = path.join(process.cwd(), 'src', 'data', 'ielts-source-tests.json');

const bundle = JSON.parse(await readFile(bundlePath, 'utf8'));
const exists = (file) => access(path.join(privateDir, file)).then(() => true, () => false);

let wired = 0;
const skipped = [];

for (const test of bundle.tests) {
  if (test.section !== 'Listening') continue;
  const match = test.id.match(/^(cambridge|vol)-(\d+)-listening-(\d)$/);
  if (!match) continue;
  const [, kind, volume, number] = match;
  const stem = kind === 'vol' ? `vol${volume}-listening-test${number}` : `cambridge${volume}-listening-test${number}`;
  const parts = [1, 2, 3, 4].map((part) => `${stem}-part${part}.mp3`);
  const present = await Promise.all(parts.map(exists));

  if (!present.every(Boolean)) {
    skipped.push(test.id);
    continue;
  }
  const alreadyWired = JSON.stringify(test.audioFiles) === JSON.stringify(parts);
  test.audioFiles = parts;
  test.missingComponents = (test.missingComponents ?? []).filter((item) => item !== 'audio');
  if (!alreadyWired) wired += 1;
}

const serialized = JSON.stringify(bundle, null, 2);
await writeFile(bundlePath, serialized, 'utf8');
await writeFile(srcCopyPath, serialized, 'utf8');

console.log(`wired ${wired} test(s) to per-part audio`);
console.log(`still without all four parts (${skipped.length}): ${skipped.join(', ') || '-'}`);
