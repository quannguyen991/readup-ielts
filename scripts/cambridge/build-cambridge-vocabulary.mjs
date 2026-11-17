import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

const index = readJson('src/data/seed/vocab-cambridge/index.json');
const dictionary = readJson('src/data/seed/vocab-cambridge/entries.json');
const supplements = readJson('src/data/seed/vocab-cambridge/cam-fill.json');
const sourceTests = readJson('.local-private/ielts-ocr/source-tests.json');
const examVocabulary = readJson('src/data/exam-vocabulary.json');
const topicVocabulary = readJson('src/data/seed/vocab-topics/index.json');
const examItemsByKey = new Map();
for (const set of examVocabulary.sets ?? []) {
  const match = set.id?.match(/^cambridge-(\d+)-(reading)-(\d+)/i);
  if (!match) continue;
  const book = Number(match[1]);
  const test = Number(match[3]);
  if (book < 10 || book > 21) continue;
  for (const item of set.items ?? []) {
    const key = keyOf(item.term);
    if (!examItemsByKey.has(key)) examItemsByKey.set(key, { item, refs: [] });
    examItemsByKey.get(key).refs.push({ book, test, section: 'Reading', page: Number(item.sourcePage) || null, source: set.id });
  }
}
const topicItemsByKey = new Map();
for (const topic of topicVocabulary ?? []) {
  for (const item of topic.words ?? []) {
    const key = keyOf(item.word);
    if (!topicItemsByKey.has(key)) topicItemsByKey.set(key, { item, refs: [] });
    topicItemsByKey.get(key).refs.push({ source: 'ielts-topic-vocabulary', topic: topic.slug, topicName: topic.name });
  }
}

const books = new Map();
const corpus = new Map();

function keyOf(term) {
  return String(term)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function searchable(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s+/g, ' ');
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensureTerm(term) {
  const key = keyOf(term);
  if (!corpus.has(key)) {
    const entry = dictionary[key];
    const supplement = supplements[key];
    const examEntry = examItemsByKey.get(key)?.item;
    const topicEntry = topicItemsByKey.get(key)?.item;
    corpus.set(key, {
      term: String(term).trim(),
      normalized: key,
      lemma: examEntry?.lemma || null,
      dictionary: entry
        ? {
            ipa: entry[0] || null,
            partOfSpeech: entry[1] || null,
            definitionEn: entry[2] || null,
            meaningVi: entry[3] || null,
            paraphrases: Array.isArray(entry[5]) ? entry[5].filter(Boolean) : [],
            collocation: typeof entry[6] === 'string' && entry[6].trim() ? entry[6].trim() : null,
          }
        : supplement
          ? {
              ipa: supplement.ipa || null,
              partOfSpeech: supplement.pos || null,
              definitionEn: supplement.definitionEn || null,
              meaningVi: supplement.meaningVi || null,
              paraphrases: Array.isArray(supplement.synonyms) ? supplement.synonyms.filter(Boolean) : [],
              collocation: null,
            }
          : examItemsByKey.has(key)
            ? {
                ipa: null,
                partOfSpeech: examEntry?.partOfSpeech || null,
                definitionEn: examEntry?.meaningEn || null,
                meaningVi: examEntry?.meaningVi || null,
                paraphrases: Array.isArray(examEntry?.synonyms) ? examEntry.synonyms.filter(Boolean) : [],
                collocation: null,
              }
            : topicEntry
              ? {
                  ipa: topicEntry.ipa || null,
                  partOfSpeech: topicEntry.pos || null,
                  definitionEn: topicEntry.definitionEn || null,
                  meaningVi: topicEntry.meaningVi || null,
                  paraphrases: Array.isArray(topicEntry.synonyms) ? topicEntry.synonyms.filter(Boolean) : [],
                  collocation: topicEntry.collocation || null,
                }
              : null,
      references: { readingPassages: [], curatedExamLists: [], curatedLexicons: [], cachedPageText: [], standalonePdfOcr: [], standalonePdfText: [] },
      tags: [],
      priority: 'extended',
      confidence: null,
    });
  }
  return corpus.get(key);
}

function addUnique(list, value, identity) {
  const id = identity(value);
  if (!list.some((existing) => identity(existing) === id)) list.push(value);
}

function tokensOf(text) {
  return String(text ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function buildTermTrie(records) {
  const rootNode = { children: new Map(), records: [] };
  for (const record of records) {
    const tokens = tokensOf(record.term);
    if (!tokens.length) continue;
    let node = rootNode;
    for (const token of tokens) {
      if (!node.children.has(token)) node.children.set(token, { children: new Map(), records: [] });
      node = node.children.get(token);
    }
    node.records.push(record);
  }
  return rootNode;
}

function findTermsInPage(text, trie) {
  const tokens = tokensOf(text);
  const found = new Map();
  for (let start = 0; start < tokens.length; start += 1) {
    let node = trie;
    for (let end = start; end < tokens.length; end += 1) {
      node = node.children.get(tokens[end]);
      if (!node) break;
      for (const record of node.records) found.set(record.normalized, record);
    }
  }
  return found.values();
}

let indexPassageCount = 0;
for (const book of index.books ?? []) {
  const bookNumber = Number(book.n);
  if (bookNumber < 10 || bookNumber > 21) continue;
  let passageCount = 0;
  for (const passage of book.passages ?? []) {
    passageCount += 1;
    indexPassageCount += 1;
    for (const rawTerm of passage.words ?? []) {
      const record = ensureTerm(rawTerm);
      addUnique(
        record.references.readingPassages,
        { book: bookNumber, test: Number(passage.test), passage: Number(passage.passage), source: 'cambridge-reading-vocabulary-index' },
        (ref) => `${ref.book}:${ref.test}:${ref.passage}`,
      );
    }
  }
  books.set(bookNumber, { readingIndexPassages: passageCount });
}

for (const [key, list] of examItemsByKey) {
  const record = ensureTerm(key);
  for (const ref of list.refs) {
    addUnique(record.references.curatedExamLists, ref, (item) => `${item.book}:${item.test}:${item.page}`);
  }
}
for (const [key, list] of topicItemsByKey) {
  const record = ensureTerm(list.item.word);
  for (const ref of list.refs) {
    addUnique(record.references.curatedLexicons, ref, (item) => `${item.source}:${item.topic}`);
  }
}

const candidateTerms = new Map();
for (const term of [...Object.keys(dictionary), ...Object.keys(supplements), ...[...examItemsByKey.keys()], ...[...topicItemsByKey.values()].map((entry) => entry.item.word), ...[...corpus.values()].map((record) => record.term)]) {
  const normalized = keyOf(term);
  if (!candidateTerms.has(normalized)) candidateTerms.set(normalized, { term, normalized });
}
const termTrie = buildTermTrie([...candidateTerms.values()]);

const testCoverage = {};
let pageCount = 0;
for (const test of sourceTests.tests ?? []) {
  const match = test.id?.match(/^cambridge-(\d+)-(listening|reading|writing|speaking)-(\d+)/i);
  if (!match) continue;
  const book = Number(match[1]);
  if (book < 10 || book > 21) continue;
  const section = match[2][0].toUpperCase() + match[2].slice(1).toLowerCase();
  const testNumber = Number(match[3]);
  const bucket = `${book}:${section}`;
  testCoverage[bucket] ??= { book, section, tests: 0, pages: 0 };
  testCoverage[bucket].tests += 1;

  for (const page of test.pages ?? []) {
    const text = searchable(page.text);
    if (!text) continue;
    pageCount += 1;
    testCoverage[bucket].pages += 1;

    for (const matchRecord of findTermsInPage(text, termTrie)) {
      const record = ensureTerm(matchRecord.term);
      const questionHeader = text.match(/questions?\s*(\d{1,2})\s*[-–]\s*(\d{1,2})/i);
      addUnique(
        record.references.cachedPageText,
        {
          book,
          test: testNumber,
          section,
          page: Number(page.page),
          pageQuestionRangeContext: questionHeader ? `${questionHeader[1]}-${questionHeader[2]}` : null,
          source: test.pdfAsset || test.source || `Cambridge IELTS ${book}`,
          evidence: 'cached-source-page-text',
          matchedTerm: record.term,
        },
        (ref) => `${ref.book}:${ref.test}:${ref.section}:${ref.page}`,
      );
    }
  }
}

const standaloneOcrFiles = [
  { book: 11, file: '.local-private/ielts-ocr/cambridge11-book.ocr.json' },
  { book: 12, file: '.local-private/ielts-ocr/cambridge12-book.ocr.json' },
  { book: 13, file: '.local-private/ielts-ocr/cambridge13-book.ocr.json' },
  { book: 14, file: '.local-private/ielts-ocr/cambridge14-book.ocr.json' },
  { book: 17, file: '.local-private/ielts-ocr/cambridge17-book.ocr.json' },
  { book: 18, file: '.local-private/ielts-ocr/cambridge18-book.ocr.json' },
  { book: 19, file: '.local-private/ielts-ocr/cambridge19-book.ocr.json' },
  { book: 20, file: '.local-private/ielts-ocr/cambridge20-academic.ocr.json' },
];
const standalonePdfTextFiles = [
  { book: 10, file: '.local-private/ielts-ocr/cambridge10-source-text.json' },
  { book: 21, file: '.local-private/ielts-ocr/cambridge21-book-selectable-text.json' },
];
const standaloneCoverage = [];
for (const source of standaloneOcrFiles) {
  if (!fs.existsSync(path.join(root, source.file))) continue;
  const ocr = readJson(source.file);
  const pages = Array.isArray(ocr.pages) ? ocr.pages : [];
  const coverageItem = { book: source.book, source: path.basename(source.file), extraction: 'ocr', pages: pages.length, textPages: pages.filter((page) => String(page.text ?? '').trim()).length, sectionPages: {} };
  standaloneCoverage.push(coverageItem);
  let currentTest = null;
  let currentSection = null;
  for (const page of pages) {
    const text = searchable(page.text);
    if (!text) continue;
    const testNumber = Number(text.match(/test\s*(\d+)/i)?.[1]) || null;
    if (testNumber) currentTest = testNumber;
    const heading = text.slice(0, 360);
    if (/\breading\s*passage|\breading\s*test|\btest\s*\d+\s+reading\b|^reading\b/i.test(heading)) currentSection = 'Reading';
    else if (/\blistening\s*(test|part)|\btest\s*\d+\s+listening\b|^listening\b/i.test(heading)) currentSection = 'Listening';
    else if (/\bwriting\s*task|model\s*answer.*writing|^writing\b/i.test(heading)) currentSection = 'Writing';
    else if (/\bspeaking\s*test|\bspeaking\s*part|^speaking\b/i.test(heading)) currentSection = 'Speaking';
    if (currentSection) coverageItem.sectionPages[currentSection] = (coverageItem.sectionPages[currentSection] ?? 0) + 1;

    const questionHeader = text.match(/questions?\s*(\d{1,2})\s*[-–]\s*(\d{1,2})/i);
    for (const matchRecord of findTermsInPage(text, termTrie)) {
      const record = ensureTerm(matchRecord.term);
      addUnique(
        record.references.standalonePdfOcr,
        {
          book: source.book,
          test: currentTest,
          section: currentSection,
          page: Number(page.page),
          pageQuestionRangeContext: questionHeader ? `${questionHeader[1]}-${questionHeader[2]}` : null,
          source: path.basename(source.file).replace('.ocr.json', '.pdf'),
          evidence: 'standalone-pdf-ocr-cache',
          matchedTerm: record.term,
        },
        (ref) => `${ref.book}:${ref.test ?? ''}:${ref.section ?? ''}:${ref.page}:${ref.evidence}`,
      );
    }
  }
}

const standalonePdfTextCoverage = [];
for (const source of standalonePdfTextFiles) {
  if (!fs.existsSync(path.join(root, source.file))) continue;
  const pdfText = readJson(source.file);
  const pages = Array.isArray(pdfText.pages) ? pdfText.pages : [];
  const coverageItem = { book: source.book, source: path.basename(source.file), extraction: 'selectable-pdf-text-layer', pages: pages.length, textPages: pages.filter((page) => String(page.text ?? '').trim()).length, sectionPages: {} };
  standalonePdfTextCoverage.push(coverageItem);
  let currentTest = null;
  let currentSection = null;
  for (const page of pages) {
    const text = searchable(page.text);
    if (!text) continue;
    const testNumber = Number(text.match(/test\s*(\d+)/i)?.[1]) || null;
    if (testNumber) currentTest = testNumber;
    const heading = text.slice(0, 360);
    if (/\breading\s*passage|\breading\s*test|\btest\s*\d+\s+reading\b|^reading\b/i.test(heading)) currentSection = 'Reading';
    else if (/\blistening\s*(test|part)|\btest\s*\d+\s+listening\b|^listening\b/i.test(heading)) currentSection = 'Listening';
    else if (/\bwriting\s*task|model\s*answer.*writing|^writing\b/i.test(heading)) currentSection = 'Writing';
    else if (/\bspeaking\s*test|\bspeaking\s*part|^speaking\b/i.test(heading)) currentSection = 'Speaking';
    if (currentSection) coverageItem.sectionPages[currentSection] = (coverageItem.sectionPages[currentSection] ?? 0) + 1;
    const questionHeader = text.match(/questions?\s*(\d{1,2})\s*[-–]\s*(\d{1,2})/i);
    for (const matchRecord of findTermsInPage(text, termTrie)) {
      const record = ensureTerm(matchRecord.term);
      addUnique(
        record.references.standalonePdfText,
        {
          book: source.book,
          test: currentTest,
          section: currentSection,
          page: Number(page.page),
          pageQuestionRangeContext: questionHeader ? `${questionHeader[1]}-${questionHeader[2]}` : null,
          source: String(pdfText.source || source.file).replace(/-text\.json|\.json$/, '.pdf'),
          evidence: 'standalone-pdf-text-layer',
          matchedTerm: record.term,
        },
        (ref) => `${ref.book}:${ref.test ?? ''}:${ref.section ?? ''}:${ref.page}:${ref.evidence}`,
      );
    }
  }
}

for (const record of corpus.values()) {
  const refs = record.references.readingPassages;
  const cached = record.references.cachedPageText;
  const pdfOcr = record.references.standalonePdfOcr;
  const pdfText = record.references.standalonePdfText;
  const ocr = cached.concat(pdfOcr, pdfText);
  const bookCount = new Set(refs.map((ref) => ref.book).concat(ocr.map((ref) => ref.book))).size;
  const testCount = new Set(refs.map((ref) => `${ref.book}:${ref.test}`).concat(ocr.map((ref) => `${ref.book}:${ref.test}`))).size;
  const tags = [];
  if (/\s/.test(record.term.trim())) tags.push('multiword-expression');
  if (record.term.includes('-')) tags.push('hyphenated-expression');
  if (record.dictionary?.collocation) tags.push('source-collocation');
  if (record.dictionary?.paraphrases?.length) tags.push('paraphrase-ready');
  if (testCount >= 3) tags.push('recurs-across-tests');
  if (bookCount >= 2) tags.push('recurs-across-books');
  if (!tags.length) tags.push('specialist-term');
  record.tags = tags;
  record.provenanceLayer = refs.length && ocr.length
    ? 'reading-baseline-and-page-evidence'
    : refs.length
      ? 'reading-baseline'
      : ocr.length
        ? 'page-evidence-only'
        : record.references.curatedExamLists.length
          ? 'curated-exam-list-only'
          : record.references.curatedLexicons.length
            ? 'curated-lexicon-only'
          : 'dictionary-only';
  record.priority = tags.includes('source-collocation') || tags.includes('recurs-across-books') || tags.includes('paraphrase-ready')
    ? 'high'
    : testCount >= 2
      ? 'useful'
      : 'extended';
}

const records = [...corpus.values()].sort((a, b) => a.normalized.localeCompare(b.normalized));
const baselineTerms = records.filter((record) => record.references.readingPassages.length > 0);
const ocrOnlyTerms = records.filter((record) => record.provenanceLayer === 'page-evidence-only');
const valuableOcrOnlyTerms = ocrOnlyTerms.filter((record) => record.priority === 'high' || record.priority === 'useful');
const additionalGroups = new Map();
for (const record of valuableOcrOnlyTerms) {
  const lemmaKey = keyOf(record.lemma || record.term);
  if (!additionalGroups.has(lemmaKey)) {
    additionalGroups.set(lemmaKey, {
      term: record.lemma || record.term,
      lemma: record.lemma || null,
      normalized: lemmaKey,
      variants: [],
      dictionary: record.dictionary,
      tags: [],
      priority: record.priority,
      confidence: null,
      references: { readingPassages: [], curatedExamLists: [], curatedLexicons: [], cachedPageText: [], standalonePdfOcr: [], standalonePdfText: [] },
    });
  }
  const group = additionalGroups.get(lemmaKey);
  addUnique(group.variants, record.term, (term) => keyOf(term));
  for (const tag of record.tags) addUnique(group.tags, tag, (item) => item);
  if (record.priority === 'high') group.priority = 'high';
  for (const referenceType of ['readingPassages', 'curatedExamLists', 'curatedLexicons', 'cachedPageText', 'standalonePdfOcr', 'standalonePdfText']) {
    for (const ref of record.references[referenceType]) {
      addUnique(group.references[referenceType], ref, (item) => `${item.book}:${item.test ?? ''}:${item.section ?? ''}:${item.page ?? ''}:${item.matchedTerm ?? ''}:${item.source}`);
    }
  }
}
const additionalTerms = [...additionalGroups.values()].sort((a, b) => a.normalized.localeCompare(b.normalized));
const additionalTermCoverage = new Map();
for (const record of additionalTerms) {
  for (const ref of record.references.cachedPageText.concat(record.references.standalonePdfOcr, record.references.standalonePdfText)) {
    const key = `${ref.book}:${ref.section ?? 'Unknown'}`;
    if (!additionalTermCoverage.has(key)) additionalTermCoverage.set(key, { book: ref.book, section: ref.section ?? 'Unknown', terms: new Set() });
    additionalTermCoverage.get(key).terms.add(record.normalized);
  }
}
const additionalTermsByBookSection = [...additionalTermCoverage.values()]
  .map((item) => ({ book: item.book, section: item.section, uniqueTerms: item.terms.size }))
  .sort((a, b) => a.book - b.book || a.section.localeCompare(b.section));
const sectionCounts = Object.values(testCoverage).reduce((acc, item) => {
  acc[item.section] = (acc[item.section] ?? 0) + item.tests;
  return acc;
}, {});
const byBook = [...books.entries()].map(([book, stats]) => ({ book, ...stats }));
const output = {
  schemaVersion: 1,
  title: 'Cambridge IELTS 10–21 vocabulary evidence corpus',
  generatedAt: new Date().toISOString(),
  policy: {
    contentScope: 'Vocabulary and short phrase records only; no complete passages, prompts, or model answers.',
    confidence: 'null means the cached OCR files do not expose token-level confidence scores.',
    priority: 'Derived from phrase/collocation status, dictionary paraphrases, and recurrence in indexed tests/books.',
  },
  coverage: {
    indexedReadingPassages: indexPassageCount,
    readingBaselineTerms: baselineTerms.length,
    uniqueVocabularyTerms: records.length,
    termsWithExactPageEvidence: records.filter((record) => record.references.cachedPageText.length + record.references.standalonePdfOcr.length + record.references.standalonePdfText.length > 0).length,
    termsFoundOnlyByExactOcr: ocrOnlyTerms.length,
    curatedExamListReferences: records.reduce((sum, record) => sum + record.references.curatedExamLists.length, 0),
    curatedLexiconReferences: records.reduce((sum, record) => sum + record.references.curatedLexicons.length, 0),
    valuableAdditionalTerms: additionalTerms.length,
    additionalTermsByBookSection,
    cachedSourceTestPages: pageCount,
    testRecordsBySection: sectionCounts,
    testCoverage: Object.values(testCoverage).sort((a, b) => a.book - b.book || a.section.localeCompare(b.section)),
    standalonePdfOcr: standaloneCoverage,
    standalonePdfTextLayers: standalonePdfTextCoverage,
    gaps: [
      'Standalone full-book OCR cache is present for Cambridge 11–14, Cambridge 17–19, and Cambridge 20 Academic (1,111 pages total). Selectable text is available for a partial Cambridge 10 PDF (92 pages, 91 classified as Reading) and most of Cambridge 21 (146 pages, 144 with text, covering Listening, Reading, Writing, and Speaking).',
      'No local full-book PDF/OCR cache is available for Cambridge 15–16; their SharePoint folder links require authenticated access, while cached source-test pages cover Listening and Reading only.',
      'The local source-test cache has Listening and Reading for Cambridge 10–16, but no Writing/Speaking records for those books.',
      'Listening page OCR contains question sheets; audio transcripts are not represented as OCR pages here.',
      'No token-level OCR confidence scores are stored, so confidence is null throughout.',
    ],
  },
  sourcePages: [
    { book: 10, url: 'https://onthiielts.com.vn/cambridge-ielts-10/', downloadProvider: 'SharePoint', status: 'download link redirects to Microsoft sign-in in this environment; a partial local text-layer PDF (92 pages) is indexed' },
    { book: 11, url: 'https://onthiielts.com.vn/cambridge-ielts-11/', downloadProvider: 'SharePoint', status: 'anonymous share download was accessible with download=1; full 143-page scanned PDF indexed with OCR' },
    { book: 12, url: 'https://onthiielts.com.vn/cambridge-ielts-12/', downloadProvider: 'SharePoint', status: 'anonymous ZIP download was accessible with download=1; full 129-page PDF indexed with OCR' },
    { book: 13, url: 'https://onthiielts.com.vn/cambridge-ielts-13/', downloadProvider: 'SharePoint', status: 'anonymous archive download was accessible with download=1; full 140-page PDF indexed with OCR' },
    { book: 14, url: 'https://onthiielts.com.vn/cambridge-ielts-14/', downloadProvider: 'SharePoint', status: 'anonymous RAR download was accessible with download=1; full 95-page PDF indexed with OCR' },
    { book: 15, url: 'https://onthiielts.com.vn/cambridge-ielts-15/', downloadProvider: 'SharePoint folder', status: 'folder link returns a SharePoint web app shell; listing/download endpoints require authenticated SharePoint access' },
    { book: 16, url: 'https://onthiielts.com.vn/cambridge-practice-tests-for-ielts-16-with-answers/', downloadProvider: 'SharePoint folder', status: 'folder link returns a SharePoint web app shell; listing/download endpoints require authenticated SharePoint access' },
    { book: 17, url: 'https://onthiielts.com.vn/cambridge-ielts-17/', downloadProvider: 'Google Drive', status: 'folder link is public but listing content is not text-extracted by this tool' },
    { book: 18, url: 'https://onthiielts.com.vn/ielts-cambridge-18/', downloadProvider: 'SharePoint', status: 'download link redirects to Microsoft sign-in in this environment' },
    { book: 19, url: 'https://onthiielts.com.vn/cambridge-19/', downloadProvider: 'SharePoint', status: 'download link redirects to Microsoft sign-in in this environment' },
    { book: 20, url: 'https://onthiielts.com.vn/sach-cambridge-ielts-20-pdf/', downloadProvider: 'SharePoint', status: 'download link redirects to Microsoft sign-in in this environment' },
    { book: 21, url: 'https://onthiielts.com.vn/cambridge-ielts-21/', downloadProvider: 'SharePoint', status: 'download link redirects to Microsoft sign-in in this environment; local selectable-text PDF has 144 non-empty pages' },
  ],
  records,
  additionalTerms,
};

const outPath = path.join(root, 'src/data/seed/vocab-cambridge/cambridge-10-21-vocabulary.json');
const tmpPath = `${outPath}.tmp`;
fs.writeFileSync(tmpPath, `${JSON.stringify(output)}\n`, 'utf8');
fs.renameSync(tmpPath, outPath);

const compactTerms = additionalTerms.map((record) => ({
  id: record.normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  term: record.term,
  lemma: record.lemma,
  normalized: record.normalized,
  variants: record.variants,
  dictionary: record.dictionary,
  tags: record.tags,
  priority: record.priority,
  confidence: record.confidence,
  references: record.references,
}));
const compactGroups = new Map();
for (const record of compactTerms) {
  const refs = record.references.cachedPageText.concat(record.references.standalonePdfOcr, record.references.standalonePdfText);
  for (const ref of refs) {
    if (!ref.section) continue;
    const key = `${ref.book}:${ref.section}`;
    if (!compactGroups.has(key)) compactGroups.set(key, { book: ref.book, section: ref.section, termIds: new Set() });
    compactGroups.get(key).termIds.add(record.id);
  }
}
const compactIndex = {
  schemaVersion: 1,
  source: 'Cambridge IELTS 10–21 cached page OCR, local selectable-PDF text layers, and existing Cambridge exam-vocabulary lists',
  termCount: compactTerms.length,
  groups: [...compactGroups.values()]
    .map((group) => ({ book: group.book, section: group.section, termIds: [...group.termIds] }))
    .sort((a, b) => a.book - b.book || a.section.localeCompare(b.section)),
  terms: compactTerms,
};
const compactOutPath = path.join(root, 'src/data/seed/vocab-cambridge/ocr-additions.json');
const compactTmpPath = `${compactOutPath}.tmp`;
fs.writeFileSync(compactTmpPath, `${JSON.stringify(compactIndex)}\n`, 'utf8');
fs.renameSync(compactTmpPath, compactOutPath);

console.log(JSON.stringify({ output: path.relative(root, outPath), compactOutput: path.relative(root, compactOutPath), terms: records.length, additionalTerms: compactTerms.length, compactGroups: compactIndex.groups.length, readingPassages: indexPassageCount, pages: pageCount, testRecordsBySection: sectionCounts, standaloneOcr: standaloneCoverage, standalonePdfTextLayers: standalonePdfTextCoverage }, null, 2));
