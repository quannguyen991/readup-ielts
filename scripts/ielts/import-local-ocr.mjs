import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Private local import: extracted book text is written under .local-private,
// which is ignored by Git and is not included in normal app bundles.
const [sourceDirArg] = process.argv.slice(2);
if (!sourceDirArg) {
  console.error('Usage: node scripts/ielts/import-local-ocr.mjs <OCR-output-directory>');
  process.exit(2);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceDir = path.resolve(sourceDirArg);
const outDir = path.join(root, '.local-private', 'ielts-ocr');
const read = (name) => readFile(path.join(sourceDir, name), 'utf8');

function splitPages(markdown) {
  const pages = [];
  const chunks = markdown.split(/(?=^## PDF page \d+\s*$)/m);
  for (const chunk of chunks) {
    const match = chunk.match(/^## PDF page (\d+)\s*\r?\n([\s\S]*)$/m);
    if (!match) continue;
    const page = Number(match[1]);
    const text = match[2].replace(/\r/g, '').replace(/\n---\s*$/, '').trim();
    pages.push({
      page,
      text,
      reviewLines: [...text.matchAll(/^\[OCR confidence ([0-9.]+)\].*$/gm)].map((m) => ({
        confidence: Number(m[1]),
        original: m[0],
      })),
    });
  }
  return pages;
}

function selectRange(pages, start, end) {
  return pages.filter(({ page }) => page >= start && page <= end);
}

const questions = splitPages(await read('Cambridge_IELTS_8_questions_OCR.md'));
const support = splitPages(await read('Cambridge_IELTS_8_support_OCR.md'));
const volQuestions = splitPages(await read('VOL_10_KEY_questions.md'));
const volAnswers = splitPages(await read('VOL_10_KEY_answers.md'));
console.log(`Parsed pages: Cambridge questions ${questions.length}, Cambridge support ${support.length}, VOL questions ${volQuestions.length}, VOL answers ${volAnswers.length}.`);
const status = await read('IELTS_PDF_extraction_status.md');
const reviewMatch = status.match(/review pages:\s*([\d, ]+)/i);
const reviewPages = reviewMatch ? reviewMatch[1].split(',').map((n) => Number(n.trim())) : [];

const academicRanges = [[9, 31], [32, 54], [55, 79], [80, 102]];
const cambridgeAcademic = academicRanges.map(([start, end], index) => ({
  id: `cambridge-ielts-8-academic-${index + 1}`,
  title: `Cambridge IELTS 8 · Academic Test ${index + 1}`,
  source: 'Cambridge IELTS 8',
  pages: selectRange(questions, start, end),
  supportPages: support.filter((p) => new RegExp(`\\bTEST ${index + 1}\\b`, 'i').test(p.text)),
}));

const gt = [
  { id: 'cambridge-ielts-8-general-a', title: 'Cambridge IELTS 8 · General Training Test A', start: 103, end: 115 },
  { id: 'cambridge-ielts-8-general-b', title: 'Cambridge IELTS 8 · General Training Test B', start: 116, end: 128 },
].map(({ id, title, start, end }) => ({
  id, title, source: 'Cambridge IELTS 8', pages: selectRange(questions, start, end),
  supportPages: support.filter((p) => new RegExp(`\\b${id.endsWith('-a') ? 'TEST A' : 'TEST B'}\\b`, 'i').test(p.text)),
}));

const volRanges = [[1, 15], [16, 30], [31, 45], [46, 61], [62, 78], [79, 92]];
const volTests = volRanges.map(([start, end], index) => ({
  id: `vol-10-key-reading-${index + 1}`,
  title: `VOL 10 KEY · Reading Test ${index + 1}`,
  source: 'VOL 10 KEY',
  pages: selectRange(volQuestions, start, end),
  supportPages: volAnswers.filter((p) => p.page >= 12 + index * 15 && p.page < 12 + (index + 1) * 15),
}));

const bundle = {
  generatedAt: new Date().toISOString(),
  distribution: 'local-only; source OCR is excluded from Git and normal deploy bundles',
  reviewPages,
  sources: [
    { name: 'Cambridge IELTS 8', questions: 'Cambridge_IELTS_8_questions_OCR.md', support: 'Cambridge_IELTS_8_support_OCR.md' },
    { name: 'VOL 10 KEY', questions: 'VOL_10_KEY_questions.md', answers: 'VOL_10_KEY_answers.md', verifiedCambridgeVolume: false },
  ],
  tests: [...cambridgeAcademic, ...gt, ...volTests],
};

// Preserve user-imported Drive tests when this older OCR import is rerun.
// Their PDFs, audio and extracted text stay private and are never bundled.
try {
  const existing = JSON.parse(await readFile(path.join(outDir, 'source-tests.json'), 'utf8'));
  const driveTests = (existing.tests ?? []).filter((test) => test.externalOnly || /^cambridge-(8|17|18|19|20|21)-/.test(test.id));
  const byId = new Map([...bundle.tests, ...driveTests].map((test) => [test.id, test]));
  bundle.tests = [...byId.values()];
  bundle.reviewPages = [...new Set([...bundle.reviewPages, ...(existing.reviewPages ?? [])])].sort((a, b) => a - b);
  const sources = [...bundle.sources, ...(existing.sources ?? [])];
  bundle.sources = [...new Map(sources.map((source) => [source.name, source])).values()];
} catch {
  // The first import has no previous private bundle to merge.
}

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'source-tests.json'), JSON.stringify(bundle), 'utf8');
console.log(`Imported ${bundle.tests.length} source sets (${bundle.tests.reduce((n, t) => n + t.pages.length, 0)} question pages).`);
for (const test of bundle.tests) console.log(`  ${test.id}: ${test.pages.length} question pages`);
console.log(`OCR review pages retained: ${reviewPages.join(', ')}.`);
console.log(`Private output: ${path.relative(root, path.join(outDir, 'source-tests.json'))}`);
