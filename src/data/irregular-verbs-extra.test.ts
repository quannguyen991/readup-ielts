import assert from 'node:assert/strict';
import { test } from 'node:test';

import { IRREGULAR_VERBS } from './irregular-verbs';
import { SOUND_GROUPS, VERB_EXAMPLES } from './irregular-verbs-extra';

const byBase = new Map(IRREGULAR_VERBS.map((v) => [v.base, v]));
const has = (sentence: string, forms: string) =>
  forms.split('/').some((f) => new RegExp(`\\b${f}\\b`, 'i').test(sentence));

test('mọi động từ trong nhóm âm đều có trong danh sách, và không nằm ở hai nhóm', () => {
  const seen = new Map<string, string>();
  for (const g of SOUND_GROUPS) {
    assert.ok(g.verbs.length >= 2, `${g.id}: nhóm quá nhỏ`);
    for (const base of g.verbs) {
      assert.ok(byBase.has(base), `${g.id}: "${base}" không có trong danh sách`);
      assert.equal(seen.get(base), undefined, `"${base}" nằm ở cả ${seen.get(base)} và ${g.id}`);
      seen.set(base, g.id);
    }
  }
});

test('nhóm âm đúng với dữ liệu: V2 hoặc V3 phải khớp quy luật nêu trong tên nhóm', () => {
  const g = (id: string) => SOUND_GROUPS.find((x) => x.id === id)!;
  for (const base of g('ought').verbs) assert.match(byBase.get(base)!.past, /ought|aught/);
  for (const base of g('ew-own').verbs) assert.match(byBase.get(base)!.pp, /own$|lown$|awn$/);
  for (const base of g('end-ent').verbs) assert.match(byBase.get(base)!.past, /nt$|lt$/);
  for (const base of g('same-3').verbs) {
    const v = byBase.get(base)!;
    assert.ok(v.base === v.past && v.past === v.pp, `${base} không giữ nguyên cả ba dạng`);
  }
  for (const base of g('come-run').verbs) assert.equal(byBase.get(base)!.base.endsWith(byBase.get(base)!.pp) || byBase.get(base)!.base === byBase.get(base)!.pp, true);
});

test('câu ví dụ: động từ có trong danh sách, câu 1 chứa V2, câu 2 chứa V3', () => {
  assert.ok(Object.keys(VERB_EXAMPLES).length >= 60);
  for (const [base, [past, pp]] of Object.entries(VERB_EXAMPLES)) {
    const v = byBase.get(base);
    assert.ok(v, `"${base}" không có trong danh sách`);
    assert.ok(has(past, v.past), `${base}: câu 1 thiếu V2 (${v.past}): ${past}`);
    assert.ok(has(pp, v.pp), `${base}: câu 2 thiếu V3 (${v.pp}): ${pp}`);
  }
});
