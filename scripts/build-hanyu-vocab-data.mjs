import { createReadStream } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = resolve(ROOT, '.local-private/hanyu-source');
const INPUT_DIR = resolve(SOURCE_DIR, 'parsed');
const OUTPUT = resolve(ROOT, 'src/data/east-asian-hanyu-vocab.json');
const DICTIONARY = resolve(SOURCE_DIR, 'opencidian-entries.jsonl.gz');

const VOLUMES = [
  { id: 'han-ngu-1', topicSlug: 'book-hanyu-revised-2006-vol-1-shang', title: '第一册 上', titleVi: 'Quyển 1 · Tập trên', lessons: 15, firstPrintedLesson: 1, expectedRows: 356, expectedLessonRows: [12, 14, 23, 23, 16, 37, 23, 23, 20, 20, 27, 24, 32, 41, 21] },
  { id: 'han-ngu-2', topicSlug: 'book-hanyu-revised-2006-vol-1-xia', title: '第一册 下', titleVi: 'Quyển 1 · Tập dưới', lessons: 15, firstPrintedLesson: 16, expectedRows: 542, expectedLessonRows: [35, 30, 29, 29, 39, 36, 40, 47, 39, 35, 39, 30, 37, 32, 45] },
  { id: 'han-ngu-3', topicSlug: 'book-hanyu-revised-2006-vol-2-shang', title: '第二册 上', titleVi: 'Quyển 2 · Tập trên', lessons: 10, firstPrintedLesson: 1, expectedRows: 422, expectedLessonRows: [41, 37, 42, 39, 54, 37, 51, 35, 48, 38] },
  { id: 'han-ngu-4', topicSlug: 'book-hanyu-revised-2006-vol-2-xia', title: '第二册 下', titleVi: 'Quyển 2 · Tập dưới', lessons: 10, firstPrintedLesson: 11, expectedRows: 436, expectedLessonRows: [41, 52, 41, 49, 45, 38, 30, 39, 38, 63] },
  { id: 'han-ngu-5', topicSlug: 'book-hanyu-revised-2006-vol-3-shang', title: '第三册 上', titleVi: 'Quyển 3 · Tập trên', lessons: 13, firstPrintedLesson: 1, expectedRows: 658, expectedLessonRows: [39, 49, 48, 52, 52, 45, 47, 49, 42, 51, 67, 58, 59] },
  { id: 'han-ngu-6', topicSlug: 'book-hanyu-revised-2006-vol-3-xia', title: '第三册 下', titleVi: 'Quyển 3 · Tập dưới', lessons: 13, firstPrintedLesson: 14, expectedRows: 842, expectedLessonRows: [64, 46, 51, 63, 63, 53, 79, 64, 74, 59, 62, 93, 71] },
];

const BOOK_SLUG = 'book-hanyu-revised-2006';
const CEDICT_CREDIT = 'Vietnamese senses: CVDICT via OpenCidian by Perxel, CC BY-SA 4.0.';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  const headers = rows.shift()?.map((header) => header.trim()) ?? [];
  return rows.filter((cells) => cells.some((value) => value.length)).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ''])),
  );
}

function normalizePinyin(value) {
  return String(value ?? '')
    .toLocaleLowerCase('en-US')
    .replace(/u:/g, 'ü')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}]/gu, '');
}

function dictionaryKey(simplified, pinyin) {
  return `${simplified}|${normalizePinyin(pinyin)}`;
}

async function readOpenCidian() {
  const index = new Map();
  const input = createReadStream(DICTIONARY).pipe(createGunzip());
  const lines = createInterface({ input, crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    const senses = entry.vi?.src === 'cvdict' && Array.isArray(entry.vi.senses)
      ? entry.vi.senses.filter(Boolean)
      : [];
    if (!senses.length) continue;
    const key = dictionaryKey(entry.simp, entry.pinyin);
    const previous = index.get(key) ?? [];
    index.set(key, [...new Set([...previous, ...senses])]);
  }
  return index;
}

async function loadVolume(volume, dictionary) {
  const file = resolve(INPUT_DIR, `${volume.id}-vocab.csv`);
  const rows = parseCsv(await readFile(file, 'utf8'));
  const required = ['lesson', 'book_page', 'simplified', 'traditional', 'pinyin', 'English_gloss', 'notes'];
  const headers = new Set(rows.length ? Object.keys(rows[0]) : []);
  const missingHeaders = required.filter((header) => !headers.has(header));
  if (missingHeaders.length) throw new Error(`${file} is missing headers: ${missingHeaders.join(', ')}`);

  const byLesson = new Map();
  const unique = new Set();
  for (const row of rows) {
    const sourceLessonNumber = Number.parseInt(row.lesson, 10);
    const localLessonNumber = Number.parseInt(row.local_lesson, 10)
      || sourceLessonNumber - volume.firstPrintedLesson + 1;
    if (!Number.isInteger(sourceLessonNumber) || localLessonNumber < 1 || localLessonNumber > volume.lessons) {
      throw new Error(`${file}: invalid printed/local lesson number ${row.lesson}/${row.local_lesson}`);
    }
    const word = row.simplified.trim();
    const pinyin = row.pinyin.trim();
    if (!word || !pinyin || !row.English_gloss.trim()) throw new Error(`${file}: blank headword, pinyin, or English gloss in lesson ${sourceLessonNumber}`);
    const uniqueKey = `${localLessonNumber}|${word}`;
    if (unique.has(uniqueKey)) throw new Error(`${file}: duplicate lesson/headword ${uniqueKey}`);
    unique.add(uniqueKey);

    const vi = dictionary.get(dictionaryKey(word, pinyin));
    const bookPage = Number.parseInt(row.book_page, 10);
    const note = row.notes.trim();
    const sourceKind = /supplementary|补充/i.test(note) ? 'supplementary'
      : /proper name|专名/i.test(note) ? 'proper-name'
        : /related|subentry|子项/i.test(note) ? 'related'
          : 'main';
    const sourceWord = {
      w: word,
      t: row.traditional.trim() || word,
      p: pinyin,
      g: row.English_gloss.trim(),
      vi: vi?.join('；'),
      s: Number.isFinite(bookPage) ? bookPage : undefined,
      n: [sourceKind !== 'main' ? sourceKind : '', note, vi ? 'CVDICT via OpenCidian (exact headword+pinyin match)' : 'No exact OpenCidian Vietnamese match; preserve textbook English gloss'].filter(Boolean).join(' · '),
      k: sourceKind,
    };
    const list = byLesson.get(localLessonNumber) ?? [];
    list.push(sourceWord);
    byLesson.set(localLessonNumber, list);
  }

  const lessons = Array.from({ length: volume.lessons }, (_, index) => {
    const lessonNumber = index + 1;
    const sourceLessonNumber = volume.firstPrintedLesson + index;
    const lessonRows = byLesson.get(lessonNumber) ?? [];
    if (!lessonRows.length) throw new Error(`${file}: lesson ${lessonNumber} has no rows`);
    const pages = [...new Set(lessonRows.map((row) => row.s).filter(Number.isFinite))].sort((a, b) => a - b);
    return {
      slug: `${volume.topicSlug}-lesson-${String(lessonNumber).padStart(2, '0')}`,
      name: `${volume.title} · Lesson ${sourceLessonNumber}`,
      nameVi: `${volume.titleVi} · Bài ${sourceLessonNumber}`,
      lessonIndex: lessonNumber,
      sourceLesson: sourceLessonNumber,
      sourceUnit: lessonNumber,
      lessonTitle: null,
      sourcePages: pages,
      blurb: `${lessonRows.length} từ · ${volume.titleVi}`,
      rows: lessonRows,
    };
  });
  const wordCount = lessons.reduce((sum, lesson) => sum + lesson.rows.length, 0);
  if (wordCount !== volume.expectedRows) throw new Error(`${file}: expected ${volume.expectedRows} rows, got ${wordCount}`);
  const observedLessonRows = lessons.map((lesson) => lesson.rows.length);
  if (observedLessonRows.some((count, index) => count !== volume.expectedLessonRows[index])) {
    throw new Error(`${file}: per-lesson counts ${observedLessonRows.join(',')} differ from audited counts ${volume.expectedLessonRows.join(',')}`);
  }
  return {
    slug: volume.topicSlug,
    name: `${volume.title} · Hanyu Jiaocheng (2006 revised edition)`,
    nameVi: volume.titleVi,
    sourceTheme: volume.titleVi,
    wordCount,
    lessons,
  };
}

const meta = JSON.parse(await readFile(resolve(SOURCE_DIR, 'opencidian-meta.json'), 'utf8'));
if (meta.license?.id !== 'CC-BY-SA-4.0') throw new Error(`Unexpected OpenCidian license: ${meta.license?.id}`);
const dictionary = await readOpenCidian();
const topics = [];
for (const volume of VOLUMES) topics.push(await loadVolume(volume, dictionary));
const wordCount = topics.reduce((sum, topic) => sum + topic.wordCount, 0);
const unitCount = topics.reduce((sum, topic) => sum + topic.lessons.length, 0);

const book = {
  slug: BOOK_SLUG,
  name: 'Hanyu Jiaocheng · Revised Edition (2006)',
  nameVi: 'Giáo trình Hán ngữ · Bản sửa đổi 2006',
  language: 'zh',
  blurb: `${wordCount.toLocaleString('vi-VN')} mục từ theo 6 tập · 76 bài · giữ thứ tự từ vựng trong sách.`,
  sourceNote: `Từ, pinyin và nghĩa tiếng Anh được đối chiếu theo các trang từ vựng trong sáu PDF người dùng cung cấp; số trang hiển thị là số in trong sách. Nghĩa tiếng Việt chỉ ghép khi khớp chính xác chữ giản thể và pinyin với CVDICT qua OpenCidian by Perxel. ${CEDICT_CREDIT} Phần dữ liệu từ điển phát hành theo CC BY-SA 4.0.`,
  sourceUrl: 'https://www.blcup.com/SeriesBook/index/265',
  wordCount,
  unitCount,
  topics,
  license: 'CC BY-SA 4.0 for the OpenCidian-derived Vietnamese gloss subset; textbook source content used under the user-provided license.',
  attribution: meta.license.attribution,
  dictionaryVersion: meta.version,
};

await writeFile(OUTPUT, `${JSON.stringify([book], null, 2)}\n`, 'utf8');
const matched = topics.flatMap((topic) => topic.lessons.flatMap((lesson) => lesson.rows)).filter((row) => row.vi).length;
console.log(`Wrote ${OUTPUT}: ${wordCount} vocabulary rows, ${unitCount} lessons, ${matched} exact OpenCidian Vietnamese matches.`);
