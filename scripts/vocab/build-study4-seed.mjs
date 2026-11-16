import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RAW_PATHS = [
  'study4-raw.jsonl.txt',
  'study4-extra.jsonl.txt',
  'study4-extra2.jsonl.txt',
  'study4-extra3.jsonl.txt',
].map((file) => path.join(ROOT, 'tmp/study4-import', file));
const DICTIONARY_PATH = path.join(ROOT, 'content/bilingual-rich-dictionary.json');
const OUT_DIR = path.join(ROOT, 'src/data/seed/vocab-study4');
const OUT_PATH = path.join(OUT_DIR, 'index.json');
const ALLOW_PARTIAL = process.argv.includes('--partial');

const DECKS = [
  { id: 383, slug: 'study4-common-ielts-listening', name: 'Most common IELTS Listening words', category: 'ielts', expectedCount: 1124, sourceNote: 'Headwords and source sections from the source collection. Vietnamese glosses, examples, and supplementary synonyms are enriched from the local bilingual dictionary where available.' },
  { id: 329, slug: 'study4-barrons-essentials-ielts', name: "Barron's Essentials Words for IELTS", category: 'ielts', expectedCount: 750, sourceNote: 'Headwords and source sections from the source collection. Vietnamese glosses, examples, and supplementary synonyms are enriched from the local bilingual dictionary where available.' },
  { id: 497, slug: 'study4-toeic-word-list', name: 'TOEIC Word List', category: 'toeic', expectedCount: 1194, sourceNote: 'Headwords from the source collection. Vietnamese glosses, examples, and supplementary synonyms are enriched from the local bilingual dictionary where available.' },
  { id: 361, slug: 'study4-600-toeic-words', name: '600 TOEIC words', category: 'toeic', expectedCount: 620, sourceNote: 'Headwords and source sections from the source collection. Vietnamese glosses, examples, and supplementary synonyms are enriched from the local bilingual dictionary where available.' },
  { id: 355, slug: 'study4-barrons-sat-words', name: "Barron's SAT words", category: 'sat', expectedCount: 1467, sourceNote: 'Headwords from the source collection. Vietnamese glosses, examples, and supplementary synonyms are enriched from the local bilingual dictionary where available.' },
  { id: 352, slug: 'study4-college-panda-400-sat', name: 'The College Panda 400 SAT words', category: 'sat', expectedCount: 400, sourceNote: 'Headwords from the source collection. Vietnamese glosses, examples, and supplementary synonyms are enriched from the local bilingual dictionary where available.' },
  { id: 500, slug: 'study4-new-academic-word-list', name: 'New Academic Word List', category: 'academic', expectedCount: 924, sourceNote: 'Headwords from the source collection. Vietnamese glosses, examples, and supplementary synonyms are enriched from the local bilingual dictionary where available.' },
  { id: 499, slug: 'study4-business-word-list', name: 'Business Word List', category: 'academic', expectedCount: 1665, sourceNote: 'Headwords from the source collection. Vietnamese glosses, examples, and supplementary synonyms are enriched from the local bilingual dictionary where available.' },
  { id: 498, slug: 'study4-toefl-word-list', name: 'TOEFL Word List', category: 'academic', expectedCount: 3193, sourceNote: 'Headwords from the source collection. Vietnamese glosses, examples, and supplementary synonyms are enriched from the local bilingual dictionary where available.' },
  { id: 420, slug: 'study4-powerscore-gre-repeat-offenders', name: 'Powerscore GRE 700 Repeat Offenders', category: 'academic', expectedCount: 699, sourceNote: 'Headwords from the source collection. Vietnamese glosses, examples, and supplementary synonyms are enriched from the local bilingual dictionary where available.' },
  { id: 354, slug: 'study4-essential-english-idioms', name: 'Essential English Idioms', category: 'idioms', expectedCount: 468, sourceNote: 'Headwords from the source collection. Vietnamese glosses, examples, and supplementary synonyms are enriched from the local bilingual dictionary where available.' },
];

const DECK_BY_ID = new Map(DECKS.map((deck) => [deck.id, deck]));

function normalizeHeadword(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSourceText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSection(deckId, value) {
  let section = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (deckId === 329) section = section.replace(/^Barron's IELTS:\s*/iu, '');
  if (deckId === 383) section = section.replace(/^Most common IELTS Listening words:\s*/iu, '');
  return section;
}

function parseJsonObjects(text, source) {
  const rows = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (start < 0) {
      if (char === '{') {
        start = index;
        depth = 1;
        inString = false;
        escaped = false;
      }
      continue;
    }
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        try {
          rows.push(JSON.parse(text.slice(start, index + 1)));
        } catch (error) {
          throw new Error(`${source}: invalid JSON object near character ${start}: ${error instanceof Error ? error.message : String(error)}`);
        }
        start = -1;
      }
    }
  }
  if (start >= 0) throw new Error(`${source}: incomplete JSON object near character ${start}`);
  return rows;
}

function normalizeIpa(value) {
  const ipa = String(value ?? '').trim();
  if (!ipa) return '';
  return ipa.startsWith('/') && ipa.endsWith('/') ? ipa : `/${ipa.replace(/^\/+|\/+$/g, '')}/`;
}

function normalizePos(value) {
  const pos = String(value ?? '').trim().toLowerCase().replace(/[().]/g, '');
  const aliases = {
    n: 'noun', noun: 'noun', v: 'verb', verb: 'verb', adj: 'adjective', a: 'adjective', adjective: 'adjective',
    adv: 'adverb', adverb: 'adverb', prep: 'preposition', preposition: 'preposition', pron: 'pronoun', pronoun: 'pronoun',
    det: 'determiner', determiner: 'determiner', conj: 'conjunction', conjunction: 'conjunction', phr: 'phrase', phrase: 'phrase',
    idiom: 'idiom', num: 'numeral', numeral: 'numeral', interj: 'interjection', interjection: 'interjection',
  };
  return aliases[pos] ?? pos;
}

function dictionaryEntry(dictionary, headword) {
  const normalized = normalizeHeadword(headword);
  return dictionary.get(normalized) ?? dictionary.get(normalized.replace(/-/g, ' ')) ?? dictionary.get(normalized.replace(/\s+/g, '-'));
}

function enrichWord(row, dictionary) {
  const word = String(row.word ?? '').trim();
  const match = dictionaryEntry(dictionary, word);
  const [dictIpa = '', dictPos = '', dictDefinition = '', dictMeaning = '', dictExample = '', dictSynonyms = []] = match ?? [];
  const synonyms = [...new Set([
    ...(Array.isArray(row.synonyms) ? row.synonyms : []),
    ...(Array.isArray(dictSynonyms) ? dictSynonyms : []),
  ].map((item) => String(item).trim()).filter(Boolean))];
  const result = {
    word,
    pos: normalizePos(row.pos || dictPos) || 'word',
    ipa: normalizeIpa(row.ipa || dictIpa),
    meaningVi: String(dictMeaning || row.meaningVi || row.definitionEn || '').trim(),
    definitionEn: String(row.definitionEn || dictDefinition || '').trim(),
    example: String(dictExample || row.example || '').trim(),
    collocation: String(row.collocation ?? '').trim(),
    band: 'Study4',
  };
  if (synonyms.length) result.synonyms = synonyms;
  if (row.sourceSection) result.sourceLevel = String(row.sourceSection).trim();
  if (row.sourcePos) result.sourcePos = String(row.sourcePos).trim();
  else if (row.pos) result.sourcePos = String(row.pos).trim();
  return result;
}

async function main() {
  const [sourceTexts, dictionaryText] = await Promise.all([
    Promise.all(RAW_PATHS.map(async (file) => [file, await readFile(file, 'utf8')])) ,
    readFile(DICTIONARY_PATH, 'utf8'),
  ]);
  const dictionaryObject = JSON.parse(dictionaryText);
  const dictionary = new Map(Object.entries(dictionaryObject).map(([word, value]) => [normalizeHeadword(word), value]));
  const rows = [];
  const errors = [];

  for (const [file, text] of sourceTexts) {
    let parsedRows;
    try {
      parsedRows = parseJsonObjects(text, path.relative(ROOT, file));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      continue;
    }
    for (const row of parsedRows) {
      const deckId = Number(row.deckId);
      if (!DECK_BY_ID.has(deckId)) {
        errors.push(`${path.relative(ROOT, file)}: unexpected Study4 deck ID ${row.deckId}`);
        continue;
      }
      if (!normalizeHeadword(row.word)) {
        errors.push(`${path.relative(ROOT, file)}: missing headword for deck ${deckId}`);
        continue;
      }
      rows.push({ ...row, deckId, sourceSection: normalizeSection(deckId, row.sourceSection) });
    }
  }

  if (errors.length) {
    console.error(`Study4 import stopped: ${errors.length} malformed or unexpected row(s).`);
    for (const error of errors.slice(0, 20)) console.error(`- ${error}`);
    if (errors.length > 20) console.error(`- …and ${errors.length - 20} more`);
    process.exitCode = 1;
    return;
  }

  const presentIds = new Set(rows.map((row) => row.deckId));
  const missingDecks = DECKS.filter((deck) => !presentIds.has(deck.id));
  if (missingDecks.length && !ALLOW_PARTIAL) {
    console.error('Study4 import stopped; output was not written. Missing deck IDs:');
    for (const deck of missingDecks) console.error(`- ${deck.id}: ${deck.name}`);
    process.exitCode = 1;
    return;
  }
  if (missingDecks.length) {
    console.warn(`Building a partial Study4 seed; ${missingDecks.length} deck(s) are still missing.`);
  }

  const output = [];
  for (const deck of DECKS.filter((item) => presentIds.has(item.id))) {
    const seen = new Set();
    const words = [];
    for (const row of rows.filter((item) => item.deckId === deck.id)) {
      const section = normalizeHeadword(row.sourceSection ?? '');
      const key = [
        deck.id,
        normalizeSourceText(row.word),
        section,
        normalizePos(row.pos || ''),
        normalizeSourceText(row.ipa || ''),
        normalizeSourceText(row.definitionEn || ''),
      ].join(':');
      if (seen.has(key)) continue;
      seen.add(key);
      words.push(enrichWord(row, dictionary));
    }
    if (!words.length) {
      console.error(`Study4 import stopped; deck ${deck.id} has no unique headwords. Output was not written.`);
      process.exitCode = 1;
      return;
    }
    const sourceUrl = `https://study4.com/flashcards/lists/${deck.id}/`;
    output.push({
      slug: deck.slug,
      study4Id: deck.id,
      expectedCount: deck.expectedCount,
      name: deck.name,
      nameVi: deck.name,
      blurb: `${words.length.toLocaleString('en-US')} words · word collection`,
      category: deck.category,
      sourceUrl,
      sourceNote: `${deck.sourceNote}`,
      words,
    });
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${output.length} Study4 decks to ${path.relative(ROOT, OUT_PATH)}.`);
  for (const deck of output) {
    console.log(`- ${deck.name}: actual ${deck.words.length} / expected ${deck.expectedCount} words [${deck.category}]`);
    if (deck.words.length !== deck.expectedCount) {
      console.warn(`  Count mismatch for Study4 deck ${deck.study4Id}: review source coverage and section-aware deduplication.`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
