import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { LISTENING_TESTS } from '@/data/listening-tests';
import { validateAll, validateTest } from './validate';
import type { ListeningGroup, ListeningSection, ListeningTest } from './types';

const DIR = join(process.cwd(), 'src', 'data', 'listening-tests');

test('mọi đề trong src/data/listening-tests đạt bộ kiểm', () => {
  assert.deepEqual(validateAll(LISTENING_TESTS), []);
});

test('mọi tệp .json trong thư mục đều có trong kho đề', () => {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
  const ids = new Set(LISTENING_TESTS.map((t) => t.id));
  for (const f of files) assert.ok(ids.has(f), `${f}.json chưa có trong index.ts (id phải trùng tên tệp)`);
});

const grp = (t: ListeningTest, i: number) => (t.sections[0] as ListeningSection).groups[i] as ListeningGroup;
const base = (): ListeningTest => JSON.parse(JSON.stringify(LISTENING_TESTS[0]));

test('bộ kiểm bắt lỗi: số câu thiếu, đáp án ngoài options, ô gap lệch', () => {
  const a = base();
  grp(a, 0).questions.pop();
  assert.ok(validateTest(a).some((e) => e.includes('liên tục')));

  const b = base();
  grp(b, 1).questions[0]!.answer = 'Z';
  assert.ok(validateTest(b).some((e) => e.includes('không có trong options')));

  const c = base();
  grp(c, 0).lines = ['Name: {{1}}'];
  assert.ok(validateTest(c).some((e) => e.includes('không có ô')));

  const d = base();
  grp(d, 2).questions[0]!.answer = ['A'];
  assert.ok(validateTest(d).some((e) => e.includes('mảng 2-3')));

  const e = base();
  grp(e, 0).questions[0]!.answer = '';
  assert.ok(validateTest(e).some((x) => x.includes('thiếu đáp án')));

  const f = base();
  (f.sections[0] as ListeningSection).transcript[1]!.start = 5;
  assert.ok(validateTest(f).some((x) => x.includes('start/end')));
});

test('id trùng giữa các đề bị bắt', () => {
  assert.ok(validateAll([base(), base()]).some((e) => e.includes('trùng')));
});
