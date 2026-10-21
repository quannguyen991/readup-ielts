import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import external from '../../src/data/ielts-external-tests.json';
import { CURRENT_FORECAST_SAMPLES, CURRENT_FORECAST_SETS } from '../../src/data/speaking-forecast-current';
import { getSpeakingQuestion } from '../../src/services/speaking/bank';
import { compareSourceTests, EXPECTED_PARTS, hasCompleteKey, prepareSourceTest, type SourceTest } from '../../src/services/ielts/source-catalog';

const privateDir = path.resolve('.local-private/ielts-ocr');
let raw: { tests: SourceTest[] };
try {
  raw = JSON.parse(readFileSync(path.join(privateDir, 'source-tests.json'), 'utf8')) as { tests: SourceTest[] };
} catch {
  raw = JSON.parse(readFileSync(path.resolve('src/data/ielts-source-tests.json'), 'utf8')) as { tests: SourceTest[] };
}
const local = raw.tests.filter((t) => !t.externalOnly).map(prepareSourceTest).sort(compareSourceTests);
const issues: string[] = [];
for (const test of local) {
  if (!test.section || test.parts?.length !== EXPECTED_PARTS[test.section]) issues.push(`${test.id}: wrong part count`);
  if (test.section === 'Reading' || test.section === 'Listening') {
    const numbers = test.parts!.flatMap((part) => Array.from({ length: Math.max(0, part.questionEnd - part.questionStart + 1) }, (_, i) => part.questionStart + i));
    if (numbers.join(',') !== Array.from({ length: 40 }, (_, i) => i + 1).join(',')) issues.push(`${test.id}: answer ranges do not cover 1–40 exactly`);
  }
  for (const file of [test.pdfAsset, ...(test.audioFiles ?? []), ...test.pages.map((p) => p.imageAsset), ...test.supportPages.map((p) => p.imageAsset)].filter(Boolean) as string[]) {
    if (!existsSync(path.join(privateDir, file))) issues.push(`${test.id}: missing asset ${file}`);
  }
}
for (const sample of CURRENT_FORECAST_SAMPLES) {
  assert.equal(getSpeakingQuestion(sample.id)?.text, sample.question, `Sample opens wrong question: ${sample.id}`);
  if (sample.part === 2) {
    const count = sample.sampleAnswer.trim().split(/\s+/).length;
    assert.ok(count >= 180 && count <= 260, `${sample.id}: Part 2 is ${count} words`);
    assert.equal(sample.cueBullets?.length, 4);
  }
}
const combined = new Map([...external.tests as SourceTest[], ...raw.tests].map((t) => [t.id, t]));
const report = {
  checkedAt: new Date().toISOString(), totalCatalogueEntries: combined.size,
  localPapers: local.length, papersWithExpectedParts: local.filter((t) => t.section && t.parts?.length === EXPECTED_PARTS[t.section]).length,
  publicTestLinks: external.tests.length, publicSourcePages: external.sources.length,
  verifiedScoringKeys: local.filter(hasCompleteKey).length,
  newForecastSets: CURRENT_FORECAST_SETS.length, newSpeakingSamples: CURRENT_FORECAST_SAMPLES.length,
  missingAssets: local.filter((t) => t.missingComponents?.length).map((t) => ({ id: t.id, missing: t.missingComponents })),
  papers: local.map((t) => ({ id: t.id, source: t.source, section: t.section, ranges: t.parts?.map((p) => [p.questionStart, p.questionEnd]), audioFiles: t.audioFiles?.length ?? 0, verifiedKey: hasCompleteKey(t) })),
  issues,
};
writeFileSync('docs/IELTS_BANK_AUDIT_2026-10-20.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, papers: undefined }, null, 2));
if (issues.length) process.exitCode = 1;
