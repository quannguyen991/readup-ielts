import assert from 'node:assert/strict';
import { test } from 'node:test';

import { analyzeSentence } from './sentence-analyze';
import { STRUCTURES, getStructure } from './structure-bank';
import { detectStructures } from './structure-detect';

const ids = (s: string) => detectStructures(s).hits.map((h) => h.id);

test('kho cấu trúc: mỗi mục đủ trường và có 3 câu mẫu', () => {
  const seen = new Set<string>();
  for (const s of STRUCTURES) {
    assert.ok(!seen.has(s.id), `trùng id ${s.id}`);
    seen.add(s.id);
    assert.ok(s.vi && s.en && s.formula && s.usage && s.pitfall, s.id);
    assert.equal(s.examples.length, 3, s.id);
    for (const e of s.examples) assert.ok(e.en.length > 10 && e.vi.length > 5, s.id);
  }
  assert.ok(getStructure('passive'));
});

test('nhận diện thì', () => {
  assert.equal(detectStructures('She studies English every morning.').tenseId, 'present-simple');
  assert.equal(detectStructures('We visited my aunt last weekend.').tenseId, 'past-simple');
  assert.equal(detectStructures('I am cooking dinner at the moment.').tenseId, 'present-continuous');
  assert.ok(ids('I have lived here since 2018.').includes('present-perfect'));
  assert.ok(ids('She had already left when I arrived.').includes('past-perfect'));
  assert.ok(ids('I will call you tomorrow.').includes('future-simple'));
  assert.ok(ids('I am going to study abroad next year.').includes('be-going-to'));
  assert.ok(ids('Turn left at the second traffic light.').includes('imperative'));
});

test('nhận diện mệnh đề và mẫu câu', () => {
  assert.ok(ids('The bridge was built in 1998.').includes('passive'));
  assert.ok(ids('The man who lives next door is a doctor.').includes('relative-clause'));
  assert.ok(ids('If it rains tomorrow, we will stay at home.').includes('conditional-1'));
  assert.ok(ids('If I had more time, I would learn the piano.').includes('conditional-2'));
  assert.ok(ids('If I had left earlier, I would have caught the train.').includes('conditional-3'));
  assert.ok(ids('Although it was late, we kept working.').includes('concession'));
  assert.ok(ids('We stayed inside because it was raining.').includes('reason-clause'));
  assert.ok(ids('It is important to sleep well.').includes('it-extraposition'));
  assert.ok(ids('Walking after dinner helps digestion.').includes('gerund-subject'));
  assert.ok(ids('Trains are faster than buses.').includes('comparative'));
  assert.ok(ids('This is the tallest building in the city.').includes('superlative'));
  assert.ok(ids('The more you practise, the better you become.').includes('double-comparative'));
  assert.ok(ids('She is not only talented but also hard-working.').includes('correlative'));
  assert.ok(ids('The box is too heavy for me to lift.').includes('too-enough'));
  assert.ok(ids('There is a small park near my house.').includes('there-be'));
  assert.ok(ids('I used to walk to school.').includes('used-to'));
  assert.ok(ids('The rain prevented us from going out.').includes('prevent-from'));
  assert.ok(ids('Many people find it hard to wake up early.').includes('find-it-adj'));
  assert.ok(ids('She saves money in order to buy a laptop.').includes('purpose-clause'));
});

test('không báo nhầm: "after dinner", "at once" không phải mệnh đề thời gian', () => {
  assert.ok(!ids('After dinner I read for an hour.').includes('time-clause'));
  assert.ok(!ids('He did not ask me to change everything at once.').includes('time-clause'));
  assert.ok(ids('I read a few pages before I sleep.').includes('time-clause'));
});

test('bộ chia khối: câu đơn giản cho đúng vai trò', () => {
  const a = analyzeSentence('I wake up at six every morning.');
  const roles = a.clauses[0]!.chunks.map((c) => c.role);
  assert.deepEqual(roles.slice(0, 2), ['subject', 'verb']);
  assert.ok(roles.includes('time'));
  const b = analyzeSentence('Although she earns a high salary, she still lives frugally.');
  assert.equal(b.clauses[0]!.kind, 'subordinate');
  assert.equal(b.type, 'complex');
});
