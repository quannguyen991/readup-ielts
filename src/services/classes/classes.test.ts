import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PASS_RATIO } from '@/data/sat-roadmap';

import { ASSIGNMENT_KINDS, CHAPTER_PASS_RATIO, assignmentHref, assignmentStatus, storesNeeded, type Assignment, type StudentData } from './assignments';
import { catalogOf, deckWords, findCatalogItem, searchCatalog } from './catalog';
import { CLASS_CODE_ALPHABET, formatClassCode, generateClassCode, isValidClassCode, normalizeClassCode } from './code';
import { attentionReasons, dayDiff, sortMembers, summarizeStudent, vnDay } from './progress';
import { cleanName, parseDueOn } from './rules';

const NOW = Date.parse('2026-10-01T05:00:00Z'); // 12:00 giờ VN
const DAY = 86_400_000;
const ago = (d: number) => new Date(NOW - d * DAY).toISOString();
const resolvers = { deckWords: (slug: string) => (slug === 'deck' ? ['a', 'b', 'c', 'd', 'e'] : undefined) };

const A = (over: Partial<Assignment>): Assignment => ({
  id: over.id ?? 'x',
  kind: over.kind ?? 'vocab_deck',
  ref: over.ref ?? 'deck',
  title: 't',
  due_on: over.due_on ?? null,
  created_at: over.created_at ?? ago(2),
});

// ------------------------------------------------------------------ mã lớp

test('mã lớp: 6 ký tự trong bảng chữ không gây nhầm', () => {
  for (let i = 0; i < 200; i += 1) {
    const code = generateClassCode();
    assert.equal(code.length, 6);
    assert.ok(isValidClassCode(code), code);
  }
  for (const bad of ['0', 'O', '1', 'I', 'L', 'U']) assert.ok(!CLASS_CODE_ALPHABET.includes(bad), bad);
});

test('mã lớp: bỏ byte lệch để các ký tự đều nhau', () => {
  // 255 ≥ 240 phải bị bỏ; 0 → ký tự đầu bảng.
  let calls = 0;
  const code = generateClassCode((n) => {
    calls += 1;
    return new Uint8Array(n).fill(calls === 1 ? 255 : 0);
  });
  assert.equal(code, CLASS_CODE_ALPHABET[0]!.repeat(6));
});

test('mã lớp: gõ thường, có cách, có gạch vẫn nhận', () => {
  assert.equal(normalizeClassCode(' abc-23 4 '), 'ABC234');
  assert.equal(normalizeClassCode('ab_c.234'), 'ABC234');
  assert.ok(isValidClassCode(normalizeClassCode('abc 234')));
  assert.ok(!isValidClassCode('ABC23'), 'thiếu ký tự');
  assert.ok(!isValidClassCode('ABC230'), 'có số 0');
  assert.ok(!isValidClassCode('ABCDEFG'), 'thừa ký tự');
  assert.equal(formatClassCode('ABC234'), 'ABC 234');
});

test('tên lớp và ngày hạn', () => {
  assert.equal(cleanName('  Lớp   10A1 ', 60), 'Lớp 10A1');
  assert.equal(cleanName('   ', 60), null);
  assert.equal(cleanName('x'.repeat(61), 60), null);
  assert.equal(parseDueOn(''), null);
  assert.equal(parseDueOn('2026-10-08'), '2026-10-08');
  assert.equal(parseDueOn('2026-02-30'), false);
  assert.equal(parseDueOn('8/10/2026'), false);
});

// ------------------------------------------------------------------ bài giao

test('ngưỡng chương lộ trình trùng ngưỡng của màn lộ trình', () => {
  assert.equal(CHAPTER_PASS_RATIO, PASS_RATIO);
});

test('bộ từ: xong khi nhớ được ≥ 80% số từ', () => {
  const a = A({ kind: 'vocab_deck', ref: 'deck' });
  const base: StudentData = { synced: true };
  assert.equal(assignmentStatus(a, base, resolvers).state, 'todo');
  assert.equal(assignmentStatus(a, { synced: true, topicStudy: { stages: {}, lastAt: { deck: ago(1) } } }, resolvers).state, 'started');
  const three = { synced: true, topicStudy: { stages: { deck: { a: 2, b: 2, c: 2, d: 1 } } } };
  assert.deepEqual(assignmentStatus(a, three, resolvers), { state: 'started', have: 3, need: 4 });
  const four = { synced: true, topicStudy: { stages: { deck: { a: 2, b: 2, c: 2, d: 2 } } } };
  assert.equal(assignmentStatus(a, four, resolvers).state, 'done');
  assert.equal(assignmentStatus(A({ ref: 'mất' }), four, resolvers).state, 'unknown', 'bộ không còn tồn tại');
});

test('chương SAT: xong khi một mức đạt 80%', () => {
  const a = A({ kind: 'sat_chapter', ref: 'ch1' });
  assert.equal(assignmentStatus(a, { synced: true }, resolvers).state, 'todo');
  const tried = { synced: true, satRoadmap: { progress: { ch1: { easy: { correct: 7, total: 10 } } } } };
  assert.equal(assignmentStatus(a, tried, resolvers).state, 'started');
  const passed = { synced: true, satRoadmap: { progress: { ch1: { easy: { correct: 7, total: 10 }, medium: { correct: 8, total: 10 } } } } };
  assert.equal(assignmentStatus(a, passed, resolvers).state, 'done');
});

test('bộ đề Math: xong khi có lượt làm bộ đó', () => {
  const a = A({ kind: 'math_set', ref: 's1' });
  assert.equal(assignmentStatus(a, { synced: true, math: { sessions: [{ setId: 's2', finishedAt: ago(1) }] } }, resolvers).state, 'todo');
  assert.equal(assignmentStatus(a, { synced: true, math: { sessions: [{ setId: 's1', finishedAt: ago(30) }] } }, resolvers).state, 'done');
});

test('Speaking: chỉ tính lượt cùng phần, sau lúc giao, có câu trả lời thật', () => {
  const a = A({ kind: 'speaking', ref: 'p2', created_at: ago(2) });
  const st = (attempts: NonNullable<StudentData['speaking']>['attempts']) => assignmentStatus(a, { synced: true, speaking: { attempts } }, resolvers).state;
  assert.equal(st([{ mode: 'p2', finishedAt: ago(3), answers: [{}] }]), 'todo', 'làm trước khi giao');
  assert.equal(st([{ mode: 'p1', finishedAt: ago(1), answers: [{}] }]), 'todo', 'sai phần thi');
  assert.equal(st([{ mode: 'p2', finishedAt: ago(1), answers: [{ skipped: true }] }]), 'todo', 'bỏ qua hết');
  assert.equal(st([{ mode: 'p2', finishedAt: ago(1), answers: [{ skipped: true }, {}] }]), 'done');
});

test('chưa đồng bộ gì thì trạng thái là KHÔNG BIẾT, không phải chưa làm', () => {
  for (const kind of ASSIGNMENT_KINDS) assert.equal(assignmentStatus(A({ kind }), { synced: false }, resolvers).state, 'unknown');
});

test('đường dẫn làm bài và khoá dữ liệu cần đọc', () => {
  assert.equal(assignmentHref('vocab_deck', 'environment'), '/vocabulary/topic/environment');
  assert.equal(assignmentHref('sat_chapter', 'ratios'), '/sat/lo-trinh/ratios');
  assert.equal(assignmentHref('math_set', 'a b'), '/math/set/a%20b');
  assert.equal(assignmentHref('speaking', 'p1'), '/speaking?mode=p1');
  assert.deepEqual(storesNeeded(['vocab_deck', 'sat_chapter']), []);
  assert.deepEqual(storesNeeded(['speaking', 'math_set']), ['math', 'speaking']);
});

// ------------------------------------------------------------------ danh mục

test('danh mục: mỗi loại có nội dung thật, mã không trùng, bộ từ có danh sách từ', () => {
  for (const kind of ASSIGNMENT_KINDS) {
    const items = catalogOf(kind);
    assert.ok(items.length > 0, kind);
    assert.equal(new Set(items.map((i) => i.ref)).size, items.length, `${kind} trùng mã`);
    for (const i of items) assert.ok(i.ref.length <= 80 && i.title.vi && i.title.en, `${kind}:${i.ref}`);
  }
  for (const d of catalogOf('vocab_deck')) assert.ok((deckWords(d.ref)?.length ?? 0) > 0, d.ref);
  assert.ok(catalogOf('vocab_deck').length >= 50);
  assert.ok(catalogOf('sat_chapter').length >= 27);
  assert.equal(findCatalogItem('speaking', 'p2')?.ref, 'p2');
  assert.equal(findCatalogItem('speaking', 'q'), undefined);
});

test('tìm trong danh mục không cần gõ dấu', () => {
  const vi = catalogOf('vocab_deck').find((i) => /[À-ỹ]/u.test(i.title.vi));
  assert.ok(vi);
  const folded = vi.title.vi.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').toLowerCase();
  assert.ok(searchCatalog('vocab_deck', folded).some((i) => i.ref === vi.ref));
});

// ------------------------------------------------------------------ tiến độ

test('khoá ngày theo giờ Việt Nam', () => {
  assert.equal(vnDay(Date.parse('2026-09-30T18:30:00Z')), '2026-10-01');
  assert.equal(dayDiff('2026-09-28', '2026-10-01'), 3);
});

test('tóm tắt học sinh: phút, chuỗi, từ, bài đã xong, quá hạn', () => {
  const daily: Record<string, { minutes: number; questions: number; wordsReviewed: number }> = {};
  for (let i = 1; i <= 3; i += 1) daily[vnDay(NOW - i * DAY)] = { minutes: 20, questions: 10, wordsReviewed: 5 };
  daily[vnDay(NOW - 10 * DAY)] = { minutes: 50, questions: 0, wordsReviewed: 0 };
  const data: StudentData = {
    synced: true,
    study: { daily },
    topicStudy: { stages: { deck: { a: 2, b: 2, c: 2, d: 2 }, other: { x: 2, y: 1 } } },
  };
  const assignments = [A({ id: 'v', kind: 'vocab_deck', ref: 'deck' }), A({ id: 'm', kind: 'math_set', ref: 's1', due_on: '2026-09-29' })];
  const s = summarizeStudent(data, assignments, NOW, resolvers);
  assert.equal(s.minutes7, 60);
  assert.equal(s.questions7, 30);
  assert.equal(s.wordsReviewed7, 15);
  assert.equal(s.activeDays7, 3);
  assert.equal(s.streak, 3, 'hôm nay chưa học vẫn giữ chuỗi tới hôm qua');
  assert.equal(s.wordsLearned, 5);
  assert.equal(s.lastActive, vnDay(NOW - DAY));
  assert.equal(s.daysInactive, 1);
  assert.deepEqual(s.assignments, { done: 1, total: 2, overdue: 1 });
  assert.equal(s.statuses.v!.state, 'done');
  assert.deepEqual(attentionReasons(s), ['overdue']);
});

test('chưa có dữ liệu thì mọi số là null (giao diện hiện —), không phải 0', () => {
  const s = summarizeStudent({ synced: false }, [A({ due_on: '2026-09-01' })], NOW, resolvers);
  assert.equal(s.minutes7, null);
  assert.equal(s.streak, null);
  assert.equal(s.wordsLearned, null);
  assert.equal(s.lastActive, null);
  assert.equal(s.assignments.overdue, 0, 'không kết luận quá hạn khi không thấy dữ liệu');
  assert.deepEqual(attentionReasons(s), ['no_data']);
});

test('đồng bộ một phần: thiếu khoá nào thì số của khoá đó là null', () => {
  const s = summarizeStudent({ synced: true, satRoadmap: { progress: { ch: { easy: { correct: 1, total: 10, at: ago(5) } } } } }, [], NOW, resolvers);
  assert.equal(s.minutes7, null);
  assert.equal(s.wordsLearned, null);
  assert.equal(s.lastActive, vnDay(NOW - 5 * DAY));
  assert.deepEqual(attentionReasons(s), ['inactive']);
});

test('xếp học sinh theo lần học gần nhất, chưa có dữ liệu xuống cuối', () => {
  const mk = (displayName: string, lastActive: string | null, done = 0) => ({
    displayName,
    summary: { ...summarizeStudent({ synced: false }, [], NOW, resolvers), lastActive, assignments: { done, total: 2, overdue: 0 } },
  });
  const rows = [mk('Bình', null), mk('An', '2026-09-20', 2), mk('Chi', '2026-09-30', 1)];
  assert.deepEqual(sortMembers(rows, 'lastActive').map((r) => r.displayName), ['Chi', 'An', 'Bình']);
  assert.deepEqual(sortMembers(rows, 'name').map((r) => r.displayName), ['An', 'Bình', 'Chi']);
  assert.deepEqual(sortMembers(rows, 'assignments').map((r) => r.displayName), ['An', 'Chi', 'Bình']);
});
