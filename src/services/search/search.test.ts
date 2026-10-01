import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { test } from 'node:test';

import { getCatalog, getEntry } from './catalog';
import { buildAiSearchPrompt, mergeCandidates, parseAiPicks, shortlistIds, MAX_CANDIDATES, MAX_PICKS } from './ai';
import { groupHits, parseQuery, searchEntries } from './match';
import { fold, tokenize } from './normalize';
import { KIND_ORDER } from './types';

const catalog = getCatalog();
const titles = (q: string, limit = 10) => searchEntries(q, catalog, { limit }).map((h) => h.entry);

// ---------------------------------------------------------------------------
// Chuẩn hoá
// ---------------------------------------------------------------------------

test('bỏ dấu tiếng Việt, đ → d, chữ thường', () => {
  assert.equal(fold('Môi Trường Đà Lạt'), 'moi truong da lat');
  assert.deepEqual(tokenize('Hàm số bậc hai — SAT!'), ['ham', 'so', 'bac', 'hai', 'sat']);
  // Chữ có dấu không bị cắt vụn (lỗi kinh điển của `\b`).
  assert.deepEqual(tokenize('trường'), ['truong']);
});

// ---------------------------------------------------------------------------
// Chỉ mục
// ---------------------------------------------------------------------------

/** Mọi tuyến trong `app/` thành biểu thức chính quy (bỏ api, layout). */
function routePatterns(): RegExp[] {
  const root = join(process.cwd(), 'app');
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        if (name !== 'api') walk(full);
      } else if (/\.tsx$/.test(name) && !name.startsWith('_') && !name.startsWith('+')) {
        files.push(relative(root, full).split(sep).join('/'));
      }
    }
  };
  walk(root);
  return files.map((f) => {
    const path = `/${f.replace(/\.tsx$/, '')}`.replace(/\/index$/, '') || '/';
    const source = path
      .split('/')
      .map((seg) => (/^\[.+\]$/.test(seg) ? '[^/]+' : seg.replace(/[.*+?^${}()|\\]/g, '\\$&')))
      .join('/');
    return new RegExp(`^${source || '/'}$`);
  });
}

test('chỉ mục có đủ các mảng nội dung', () => {
  const kinds = new Set(catalog.map((e) => e.kind));
  for (const kind of KIND_ORDER) assert.ok(kinds.has(kind), `thiếu loại ${kind}`);
  assert.ok(catalog.length > 1500, `chỉ có ${catalog.length} mục`);
  const prefixes = new Set(catalog.map((e) => e.id.split(':')[0]));
  for (const p of ['page', 'roadmap', 'lesson-math', 'lesson-rw', 'math-drill', 'rw-skill', 'rw-unit', 'vocab', 'sat-vocab', 'read', 'bilingual', 'dictation', 'voa', 'video', 'writing', 'translation-step', 'translate-set', 'speaking-mode', 'speaking-p1', 'speaking-cue', 'lp-level', 'lp']) {
    assert.ok(prefixes.has(p), `thiếu nguồn ${p}`);
  }
});

test('mã mục là duy nhất, tiêu đề không rỗng, đường dẫn trỏ tới tuyến có thật', () => {
  const ids = new Set<string>();
  const routes = routePatterns();
  for (const e of catalog) {
    assert.ok(!ids.has(e.id), `trùng mã ${e.id}`);
    ids.add(e.id);
    assert.ok(e.title.vi.trim().length > 0, `${e.id}: tiêu đề vi rỗng`);
    assert.ok(e.title.en.trim().length > 0, `${e.id}: tiêu đề en rỗng`);
    assert.ok(e.href.startsWith('/') && !e.href.startsWith('//'), `${e.id}: href lạ ${e.href}`);
    assert.ok(!/\s/.test(e.href), `${e.id}: href có dấu cách ${e.href}`);
    const path = e.href.split('?')[0]!;
    assert.ok(routes.some((r) => r.test(path)), `${e.id}: không có tuyến cho ${path}`);
  }
});

test('getEntry tra lại đúng mục', () => {
  const sample = catalog[Math.floor(catalog.length / 2)]!;
  assert.equal(getEntry(sample.id), sample);
  assert.equal(getEntry('khong-ton-tai:1'), undefined);
});

// ---------------------------------------------------------------------------
// So khớp
// ---------------------------------------------------------------------------

test('gõ không dấu vẫn ra mục có dấu: "moi truong" → Môi trường', () => {
  const top = titles('moi truong', 5);
  assert.ok(top.some((e) => e.title.vi === 'Môi trường'), top.map((e) => e.title.vi).join(' | '));
});

test('tìm bằng tiếng Anh: "environment" ra cùng bộ từ chủ đề Môi trường', () => {
  const top = titles('environment', 5);
  assert.ok(top.some((e) => e.id === 'vocab:environment'));
});

test('"task 2" chỉ ra đề Task 2, không lẫn Task 1', () => {
  const writing = searchEntries('task 2', catalog, { limit: 200 }).filter((h) => h.entry.id.startsWith('writing:'));
  assert.ok(writing.length > 10);
  for (const h of writing) assert.ok(h.entry.subtitle?.en.includes('Task 2'), h.entry.id);
});

test('"ham so" ra chương Hàm số của lộ trình SAT Math', () => {
  const top = titles('ham so', 5);
  assert.equal(top[0]?.id, 'roadmap:functions');
});

test('đồng nghĩa: "nghe" ra nhóm luyện nghe, "từ vựng" ra mục từ vựng, "ngữ pháp" ra SAT conventions', () => {
  assert.ok(titles('nghe', 6).some((e) => e.skill === 'listening'));
  assert.ok(titles('từ vựng', 6).every((e) => e.skill === 'vocab' || fold(e.title.vi).includes('tu vung')));
  assert.ok(titles('ngữ pháp', 10).some((e) => e.id.startsWith('rw-unit:') || e.id.startsWith('rw-skill:')));
  assert.ok(titles('toan', 10).some((e) => e.skill === 'math'));
  assert.ok(titles('part 2', 10).filter((e) => e.skill === 'speaking').length >= 6);
  // "bac hai" → quadratic: chương Hàm bậc hai có tên tiếng Anh Quadratics.
  assert.ok(titles('hàm số bậc hai', 3).some((e) => e.id === 'roadmap:quadratics'));
});

test('gõ có dấu ưu tiên mục đúng dấu: "nghe" có dấu không để "công nghệ" đứng đầu', () => {
  const top = titles('nghe chép', 3);
  assert.equal(top[0]?.id, 'page:sentence');
});

test('câu hỏi dài vẫn ra kết quả ở chế độ lỏng; nhóm theo loại', () => {
  const q = 'mình yếu nghe điền số, muốn luyện chủ đề môi trường';
  const loose = searchEntries(q, catalog, { mode: 'loose', limit: 30 });
  assert.ok(loose.length > 0);
  const groups = groupHits(loose, 3);
  for (const g of groups) assert.ok(g.hits.length <= 3 && g.hits.every((h) => h.entry.kind === g.kind));
  // Hư từ là tuỳ chọn, ý chính thì bắt buộc.
  const parsed = parseQuery(q);
  assert.ok(parsed.some((g) => g.optional));
  assert.ok(parsed.some((g) => !g.optional && g.alts[0]!.join(' ') === 'moi truong'));
});

test('câu rỗng hoặc toàn dấu câu không trả gì', () => {
  assert.deepEqual(searchEntries('', catalog), []);
  assert.deepEqual(searchEntries('  ?!  ', catalog), []);
});

// ---------------------------------------------------------------------------
// AI: dựng lời nhắc + kiểm câu trả lời
// ---------------------------------------------------------------------------

test('danh sách ứng viên có mục khớp và các mục cấp trang, không quá trần', () => {
  const ids = shortlistIds('SAT hàm số bậc hai', catalog);
  assert.ok(ids.length <= MAX_CANDIDATES);
  assert.ok(ids.includes('roadmap:quadratics'));
  assert.ok(ids.includes('page:math'));
});

test('mergeCandidates bỏ mã lạ do client gửi', () => {
  const out = mergeCandidates(['vocab:environment', 'bịa:1', 42, 'vocab:environment'], ['page:math'], getEntry);
  assert.deepEqual(out.map((e) => e.id), ['vocab:environment', 'page:math']);
  assert.deepEqual(mergeCandidates('không phải mảng', [], getEntry), []);
});

test('lời nhắc đánh số ứng viên, dặn trả JSON, đúng ngôn ngữ', () => {
  const cands = ['vocab:environment', 'roadmap:functions'].map((id) => getEntry(id)!);
  const vi = buildAiSearchPrompt('muốn học | chủ đề\nmôi trường', cands, 'vi');
  assert.deepEqual(vi.aliases, ['vocab:environment', 'roadmap:functions']);
  assert.match(vi.user, /^c1 \| vocab \| IELTS \| Môi trường/m);
  assert.match(vi.user, /^c2 \| path \| SAT \| Hàm số/m);
  assert.ok(!vi.user.includes('học | chủ'), 'ký tự | trong câu hỏi bị làm sạch');
  assert.match(vi.system, /tiếng Việt/);
  assert.match(vi.system, /"picks"/);
  const en = buildAiSearchPrompt('environment', cands, 'en');
  assert.match(en.user, /^c1 \| vocab \| IELTS \| Environment/m);
  assert.match(en.system, /in English/);
});

test('parseAiPicks: nhận c7/7/mã thật, bỏ mã lạ và trùng, cắt trần', () => {
  const aliases = ['a:1', 'b:2', 'c:3'];
  const text =
    'Đây là kết quả:\n```json\n{"picks":[{"id":"c2","reason":"**Hợp** chủ đề"},{"id":"9","reason":"bịa"},{"id":"c2","reason":"trùng"},{"id":3,"reason":"số"},{"id":"a:1"},{"id":"x:9","reason":"lạ"}],"tip":"Nghe mỗi ngày."}\n```';
  const parsed = parseAiPicks(text, aliases);
  assert.ok(parsed);
  assert.deepEqual(parsed.picks, [
    { id: 'b:2', reason: 'Hợp chủ đề' },
    { id: 'c:3', reason: 'số' },
    { id: 'a:1', reason: '' },
  ]);
  assert.equal(parsed.tip, 'Nghe mỗi ngày.');

  const many = { picks: Array.from({ length: 10 }, (_, i) => ({ id: `c${i + 1}`, reason: 'x' })) };
  const ten = Array.from({ length: 10 }, (_, i) => `e:${i}`);
  assert.equal(parseAiPicks(JSON.stringify(many), ten)?.picks.length, MAX_PICKS);
});

test('parseAiPicks trả null khi không dùng được', () => {
  assert.equal(parseAiPicks('không có json', ['a']), null);
  assert.equal(parseAiPicks('{"picks": "x"}', ['a']), null);
  assert.equal(parseAiPicks('{"picks":[{"id":"c5"}]}', ['a']), null);
  assert.equal(parseAiPicks('{bad json}', ['a']), null);
});
