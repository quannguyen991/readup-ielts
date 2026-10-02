import assert from 'node:assert/strict';
import { test } from 'node:test';

import { lemmaCandidates } from './lemma-candidates';
import { cachedLookup, lookupOffline, resolveWord, type KeyValueStore } from './word-lookup';
import type { WordLookup } from './lookup';

function memStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

const REMOTE: WordLookup = {
  word: 'zorbling',
  lemma: 'zorbling',
  phonetic: '/z/',
  partOfSpeech: 'noun',
  definitionGeneral: 'a made-up thing',
  definitionVi: null,
  definitionContext: null,
  examples: [],
  audioUrl: null,
};

test('ứng viên dạng gốc: chia -e, -s, -ed, -ing, -ies', () => {
  assert.ok(lemmaCandidates('implements').includes('implement'));
  assert.ok(lemmaCandidates('enhances').includes('enhance'));
  assert.ok(lemmaCandidates('enhanced').includes('enhance'));
  assert.ok(lemmaCandidates('studies').includes('study'));
  assert.ok(lemmaCandidates('running').includes('run'));
  assert.equal(lemmaCandidates('Implement.')[0], 'implement');
  assert.deepEqual(lemmaCandidates('123'), []);
});

test('tra trong máy khớp dạng chia, có nghĩa Việt', () => {
  const hit = lookupOffline('Implements');
  assert.ok(hit, 'implement có trong bộ từ hoặc từ điển dựng sẵn');
  assert.ok(hit.definitionVi);
  assert.equal(hit.englishOnly, false);
  assert.equal(lookupOffline('zzzzqqq'), null);
});

test('thứ tự: máy trước, mạng chỉ khi không có; kết quả dương được nhớ', async () => {
  const store = memStore();
  let calls = 0;
  const fetchRemote = async () => {
    calls += 1;
    return REMOTE;
  };

  assert.ok(await resolveWord('implement', '', { fetchRemote, store }));
  assert.equal(calls, 0, 'từ có sẵn không gọi mạng');

  const first = await resolveWord('zorbling', 'x', { fetchRemote, store });
  assert.equal(first?.source, 'network');
  assert.equal(first?.englishOnly, true, 'chỉ có nghĩa Anh thì đánh dấu EN');
  const second = await resolveWord('zorbling', 'x', { fetchRemote, store });
  assert.equal(second?.source, 'cache');
  assert.equal(calls, 1);
  assert.ok(cachedLookup('zorbling', store));
});

test('mạng hỏng hoặc rỗng: trả null và KHÔNG nhớ', async () => {
  const store = memStore();
  const boom = async () => {
    throw new Error('x');
  };
  assert.equal(await resolveWord('qwxzv', '', { fetchRemote: boom, store }), null);
  const empty = { ...REMOTE, definitionGeneral: null };
  assert.equal(await resolveWord('qwxzv', '', { fetchRemote: async () => empty, store }), null);
  assert.equal(store.data.size, 0);
});
