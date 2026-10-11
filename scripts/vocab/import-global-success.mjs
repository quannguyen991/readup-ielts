import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'src/data/seed/vocab-global-success/index.json');
const SOURCES = {
  10: 'https://vietjack.com/tieng-anh-10-moi/tu-vung-tieng-anh-lop-10-ket-noi.jsp',
  11: 'https://vietjack.com/tieng-anh-11-moi/tong-hop-tu-vung-tieng-anh-lop-11-moi.jsp',
  12: 'https://vietjack.com/tieng-anh-12-moi/tong-hop-tu-vung-tieng-anh-lop-12-moi.jsp',
};

function text(html) {
  return html
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

function tables(html) {
  return [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].map((match) => match[1]);
}

function tableRows(html) {
  return [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((row) => [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => text(cell[1])))
    .filter((row) => row.length >= 3 && !/^(word|từ vựng)$/i.test(row[0] ?? ''));
}

function partOfSpeech(value, fallback = 'word') {
  const pos = value.trim().toLowerCase().replace(/[().]/g, '');
  const aliases = { n: 'noun', v: 'verb', adj: 'adjective', a: 'adjective', adv: 'adverb', np: 'noun phrase', phr: 'phrase', 'n v': 'noun, verb', 'n, v': 'noun, verb', 'n adj': 'noun, adjective', 'n, adj': 'noun, adjective' };
  return aliases[pos] ?? (pos || fallback);
}

function normalizeRow(row, grade) {
  const [rawWord = '', column2 = '', column3 = '', column4 = ''] = row;
  const rawPos = grade === 10 ? column2 : '';
  const rawIpa = grade === 10 ? column3 : column2;
  const rawMeaning = grade === 10 ? column4 : column3;
  let word = rawWord.trim();
  let pos = rawPos.trim();
  if (grade !== 10) {
    word = word.replace(/\s+\(số nhiều\)$/i, '').trim();
    const suffix = word.match(/\s+\((n(?:oun)?|v(?:erb)?|adj(?:ective)?|a|adv(?:erb)?|np|n,?\s*v|n,?\s*adj)\)$/i);
    if (suffix) {
      pos ||= suffix[1];
      word = word.slice(0, suffix.index).trim();
    }
  }
  return {
    word,
    pos: partOfSpeech(pos),
    ipa: rawIpa.trim(),
    meaningVi: rawMeaning.trim(),
    definitionEn: '',
    example: '',
    collocation: '',
    band: '5-6',
  };
}

async function fetchPage(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'Band9-vocabulary-import/1.0' } });
  if (!response.ok) throw new Error(`Không tải được ${url}: HTTP ${response.status}`);
  return response.text();
}

function unitDeck(grade, unit, title, sourceUrl, rows) {
  const words = rows.map((row) => normalizeRow(row, grade)).filter((word) => word.word && word.meaningVi);
  return {
    slug: `global-success-${grade}-unit-${String(unit).padStart(2, '0')}`,
    name: `Global Success ${grade} · Unit ${unit}: ${title}`,
    nameVi: `Global Success ${grade} · Unit ${unit}: ${title}`,
    blurb: `Từ vựng trọng tâm theo Unit ${unit}, tham khảo danh sách VietJack.`,
    grade,
    unit,
    sourceUrl,
    words,
  };
}

async function grade10Decks() {
  const grade = 10;
  const indexUrl = SOURCES[grade];
  const html = await fetchPage(indexUrl);
  const decks = [];
  for (const match of html.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)) {
    const heading = text(match[1]);
    const unitMatch = heading.match(/Từ vựng Unit\s+(\d+)\s+lớp\s+10/i);
    if (!unitMatch) continue;
    const unit = Number(unitMatch[1]);
    const start = html.indexOf('<table', match.index + match[0].length);
    const end = html.indexOf('</table>', start);
    if (start < 0 || end < 0) continue;
    const table = html.slice(start, end + '</table>'.length);
    const title = [
      'Family Life', 'Humans and the Environment', 'Music', 'For a Better Community', 'Inventions',
      'Gender Equality', 'Viet Nam and International Organisations', 'New Ways to Learn',
      'Protecting the Environment', 'Ecotourism',
    ][unit - 1];
    if (!title) continue;
    decks.push(unitDeck(grade, unit, title, indexUrl, tableRows(table)));
  }
  return decks;
}

async function linkedGradeDecks(grade) {
  const indexUrl = SOURCES[grade];
  const html = await fetchPage(indexUrl);
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({ url: new URL(match[1], indexUrl).href, title: text(match[2]) }))
    .filter((link) => new RegExp(`Từ vựng Tiếng Anh ${grade} Unit \\d+`, 'i').test(link.title));
  const decks = [];
  for (const link of links) {
    const match = link.title.match(/Unit\s+(\d+)\s*:\s*(.+)$/i);
    if (!match) continue;
    const page = await fetchPage(link.url);
    const table = tables(page).find((candidate) => /(?:WORD|Từ vựng)/i.test(text(candidate.slice(0, 800))));
    if (!table) throw new Error(`Không tìm thấy bảng từ vựng tại ${link.url}`);
    decks.push(unitDeck(grade, Number(match[1]), match[2].trim(), link.url, tableRows(table)));
  }
  return decks;
}

const current = JSON.parse(await readFile(OUT, 'utf8'));
const advanced = current.filter((deck) => deck.slug === 'global-success-advanced');
const advancedByUnit = new Map(
  current
    .filter((deck) => deck.grade && deck.unit)
    .map((deck) => [deck.slug, deck.words.filter((word) => word.origin === 'original-advanced')]),
);
const imported = [
  ...(await grade10Decks()),
  ...(await linkedGradeDecks(11)),
  ...(await linkedGradeDecks(12)),
];
if (imported.length !== 30 || imported.some((deck) => deck.words.length === 0)) {
  throw new Error(`Dữ liệu chưa đủ 30 Unit: ${imported.length} bộ; ${imported.filter((deck) => !deck.words.length).length} bộ rỗng.`);
}
for (const deck of imported) {
  deck.words.push(...(advancedByUnit.get(deck.slug) ?? []));
  if (deck.words.some((word) => word.origin === 'original-advanced')) {
    deck.blurb = `Từ vựng theo Unit ${deck.unit} tham khảo VietJack, kèm 30 từ nâng cao tự biên soạn.`;
  }
}
await writeFile(OUT, `${JSON.stringify([...imported, ...advanced], null, 2)}\n`, 'utf8');
const sourceWordCount = imported.reduce((n, deck) => n + deck.words.filter((word) => word.origin !== 'original-advanced').length, 0);
const expandedWordCount = imported.reduce((n, deck) => n + deck.words.filter((word) => word.origin === 'original-advanced').length, 0);
console.log(`Đã nhập ${imported.length} bộ, ${sourceWordCount} từ nguồn, giữ ${expandedWordCount} từ nâng cao theo Unit và ${advanced.length} bộ nâng cao riêng.`);
