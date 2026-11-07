// Remove answer keys that are copied verbatim across several tests of one volume.
//
// Vol 7 and Vol 8 Reading each store the same 40-item key on all four tests, so
// three of the four keys in each volume must be wrong. Grading against them
// would mark correct answers wrong, so the keys are cleared and the tests are
// flagged. Re-source the keys from the book's answer section before restoring.
//
//     node scripts/ielts/clear-shared-answer-keys.mjs

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const privateDir = path.join(process.cwd(), '.local-private', 'ielts-ocr');
const bundlePath = path.join(privateDir, 'source-tests.json');
const srcCopyPath = path.join(process.cwd(), 'src', 'data', 'ielts-source-tests.json');

const bundle = JSON.parse(await readFile(bundlePath, 'utf8'));

const groups = new Map();
for (const test of bundle.tests) {
  if (!['Reading', 'Listening'].includes(test.section) || !test.answerKey) continue;
  const volume = test.id.match(/^(vol-\d+|cambridge-\d+)-(reading|listening)-/)?.[1];
  if (!volume || JSON.stringify(test.answerKey) === '{}') continue;
  const fingerprint = JSON.stringify(test.answerKey);
  const key = `${volume}|${fingerprint}`;
  groups.set(key, [...(groups.get(key) ?? []), test]);
}

let cleared = 0;
for (const [key, tests] of groups) {
  if (tests.length < 2) continue;
  for (const test of tests) {
    test.answerKey = {};
    test.answerKeyVerified = false;
    test.missingComponents = [...new Set([...(test.missingComponents ?? []), 'answer-key'])];
    cleared += 1;
  }
  console.log(`cleared shared key for ${tests.map((t) => t.id).join(', ')}`);
}

const serialized = JSON.stringify(bundle, null, 2);
await writeFile(bundlePath, serialized, 'utf8');
await writeFile(srcCopyPath, serialized, 'utf8');
console.log(`cleared ${cleared} test(s)`);
