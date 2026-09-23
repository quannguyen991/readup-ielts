import assert from 'node:assert/strict';
import { test } from 'node:test';

import { diagnosePick, diagnoseTyped, editDistance, summarizeMistakes } from './mistake';

const kind = (a: string, t: string, others: { word: string; meaningVi: string }[] = []) => diagnoseTyped(a, t, others)?.kind ?? null;

test('đúng thì không có lỗi', () => {
  assert.equal(kind(' Habitat ', 'habitat'), null);
});

test('gọi đúng tên từng kiểu lỗi', () => {
  assert.equal(kind('', 'habitat'), 'blank');
  assert.equal(kind('predator', 'prey', [{ word: 'predator', meaningVi: 'kẻ săn mồi' }]), 'other_word');
  assert.equal(kind('habitats', 'habitat'), 'inflection');
  assert.equal(kind('migrated', 'migrate'), 'inflection');
  assert.equal(kind('acommodate', 'accommodate'), 'double_letter');
  assert.equal(kind('occurrence', 'occurence'), 'double_letter');
  assert.equal(kind('independance', 'independence'), 'suffix');
  assert.equal(kind('responsable', 'responsible'), 'suffix');
  assert.equal(kind('habiatt', 'habitat'), 'transposition');
  assert.equal(kind('habtat', 'habitat'), 'missing_letter');
  assert.equal(kind('habitaat', 'habitat'), 'double_letter');
  assert.equal(kind('habitaxt', 'habitat'), 'extra_letter');
  assert.equal(kind('habitet', 'habitat'), 'wrong_letter');
  assert.equal(kind('enviroment', 'environment'), 'missing_letter');
  assert.equal(kind('biodiversty', 'biodiversity'), 'missing_letter');
  assert.equal(kind('ecosistam', 'ecosystem'), 'spelling');
  assert.equal(kind('table', 'ecosystem'), 'unknown');
});

test('chỉ ra đúng chữ bị thiếu', () => {
  assert.match(diagnoseTyped('habtat', 'habitat')!.detail, /“i”.*thứ 4/);
});

test('khoảng cách chỉnh sửa tính đổi chỗ là một bước', () => {
  assert.equal(editDistance('ab', 'ba'), 1);
  assert.equal(editDistance('kitten', 'sitting'), 3);
});

test('trắc nghiệm sai: chỉ ra hai từ đang bị lẫn', () => {
  const pool = [
    { word: 'prey', meaningVi: 'con mồi' },
    { word: 'predator', meaningVi: 'kẻ săn mồi' },
  ];
  const m = diagnosePick('kẻ săn mồi', pool[0]!, pool);
  assert.equal(m.kind, 'other_word');
  assert.match(m.detail, /prey.*predator/);
});

test('tổng hợp: kiểu lỗi nhiều nhất lên đầu', () => {
  const s = summarizeMistakes([
    diagnoseTyped('habtat', 'habitat')!,
    diagnoseTyped('acommodate', 'accommodate')!,
    diagnoseTyped('ocasion', 'occasion')!,
  ]);
  assert.equal(s[0]!.kind, 'double_letter');
  assert.equal(s[0]!.count, 2);
});
