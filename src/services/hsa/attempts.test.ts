import assert from 'node:assert/strict';
import { test } from 'node:test';

import { HSA_QUESTION_BANK } from '@/data/hsa-bank';
import { MAX_ATTEMPTS, mergeSynced, readSynced, restoreItems, storeItems, type StoredAttempt } from './attempts';
import { itemsFrom } from './scoring';

const index = new Map(HSA_QUESTION_BANK.map((q) => [q.id, q]));
const at = (id: string, finishedAt: string): StoredAttempt => ({ id, activity: 'practice:cloze', finishedAt, seconds: 0, items: [] });

test('lưu gọn rồi dựng lại từ ngân hàng cho ra đúng các câu đã làm', () => {
  const qs = HSA_QUESTION_BANK.slice(0, 4);
  const items = itemsFrom(qs, [0, null, 2, 1]);
  const stored: StoredAttempt = { id: 'a', activity: 'x', finishedAt: 't', seconds: 0, items: storeItems(items) };
  assert.deepEqual(restoreItems(stored, index), items);
  assert.ok(JSON.stringify(stored.items).length < 4 * 40);
});

test('mã câu không còn trong ngân hàng thì bị bỏ khi dựng lại', () => {
  const stored: StoredAttempt = { id: 'a', activity: 'x', finishedAt: 't', seconds: 0, items: [['khong-co', 1], [HSA_QUESTION_BANK[0]!.id, 0]] };
  assert.equal(restoreItems(stored, index).length, 1);
});

test('đọc dữ liệu hỏng thành rỗng thay vì ném lỗi', () => {
  for (const bad of [null, 'x', 5, [], { attempts: 'x', plans: 3, done: 'y', profile: 'z' }]) {
    const r = readSynced(bad);
    assert.deepEqual([r.attempts, r.plans, r.done, r.profile], [[], {}, {}, null]);
  }
});

test('gộp: lượt làm bài hợp theo mã, mới nhất trước, có trần', () => {
  const local = { attempts: [at('1', '2026-11-01'), at('2', '2026-11-03')] };
  const remote = { attempts: [at('2', '2026-11-03'), at('3', '2026-11-02')] };
  assert.deepEqual(mergeSynced(local, remote).attempts.map((x) => x.id), ['2', '3', '1']);
  const many = { attempts: Array.from({ length: MAX_ATTEMPTS + 10 }, (_, i) => at(String(i), `2026-11-${String((i % 28) + 1).padStart(2, '0')}T${String(i).padStart(2, '0')}`)) };
  assert.equal(mergeSynced(many, null).attempts.length, MAX_ATTEMPTS);
});

test('gộp: hồ sơ lấy bản mới hơn; thiếu một phía thì lấy phía còn lại', () => {
  const p = (createdAt: string, target: number) => ({ grade: 'g12', reason: 'try', target, focus: 'all', selfLevel: 'B1', minutesPerDay: 45, daysPerWeek: 6, examDate: null, startTime: '19:30', createdAt });
  assert.equal(mergeSynced({ profile: p('2026-11-01', 30) }, { profile: p('2026-11-05', 40) }).profile?.target, 40);
  assert.equal(mergeSynced({ profile: p('2026-11-01', 30) }, null).profile?.target, 30);
  assert.equal(mergeSynced(null, null).profile, null);
});

test('gộp: kế hoạch mỗi ngày giữ bản mới hơn và dấu đã xong của ngày bị cắt thì bỏ', () => {
  const plan = (createdAt: string, headline: string) => ({ day: 'x', headline: { vi: headline, en: headline }, tasks: [], source: 'auto', createdAt });
  const m = mergeSynced(
    { plans: { '2026-11-01': plan('2026-11-01T08', 'cũ') }, done: { '2026-11-01|kind:cloze': true, '2026-10-01|vocab': true } },
    { plans: { '2026-11-01': plan('2026-11-01T09', 'mới') } },
  );
  assert.equal(m.plans['2026-11-01']!.headline.vi, 'mới');
  assert.deepEqual(Object.keys(m.done), ['2026-11-01|kind:cloze']);
});
