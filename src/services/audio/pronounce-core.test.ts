import assert from 'node:assert/strict';
import { test } from 'node:test';

import { audioUrlsOf, createLookup, isSingleWord, pickAudioUrl, guessAudioUrls, planPlayback, type FetchLike } from './pronounce-core';

const body = [
  { phonetics: [{ text: '/a/', audio: '' }, { audio: '//ssl.gstatic.com/dictionary/static/sounds/20200429/test--1_gb_1.mp3' }] },
  {
    phonetics: [
      { audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/test-uk.mp3' },
      { audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/test-us.mp3' },
      { audio: '' },
    ],
  },
];

test('lấy mp3 không rỗng, vá URL bắt đầu bằng //', () => {
  const u = audioUrlsOf(body);
  assert.equal(u.length, 3);
  assert.ok(u[0]?.startsWith('https://ssl.gstatic.com/'));
  assert.deepEqual(audioUrlsOf({ title: 'No Definitions Found' }), []);
});

test('chọn đúng giọng Mỹ / Anh, rồi lùi dần', () => {
  const u = audioUrlsOf(body);
  assert.ok(pickAudioUrl(u, 'us')!.endsWith('test-us.mp3'));
  assert.ok(pickAudioUrl(u, 'uk')!.endsWith('test-uk.mp3'));
  assert.equal(pickAudioUrl(['https://x/a-uk.mp3'], 'us'), 'https://x/a-uk.mp3');
  assert.equal(pickAudioUrl(['https://x/a-au.mp3'], 'uk'), 'https://x/a-au.mp3');
  assert.equal(pickAudioUrl([], 'us'), null);
});

test('từ đơn vs cụm từ', () => {
  assert.ok(isSingleWord('occupation'));
  assert.ok(isSingleWord("don't"));
  assert.ok(isSingleWord('well-known'));
  assert.ok(!isSingleWord('take off'));
  assert.ok(!isSingleWord(''));
});

function mkKV() {
  const m = new Map<string, string>();
  return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

test('nhớ kết quả, kể cả kết quả không có (404), và ghi xuống kho', async () => {
  let calls = 0;
  const f: FetchLike = async (url) => {
    calls++;
    if (url.endsWith('/nonexistentword')) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => body };
  };
  const kv = mkKV();
  const lk = createLookup({ fetch: f, kv });
  assert.equal((await lk.urls('Test'))!.length, 3);
  assert.equal((await lk.urls('test'))!.length, 3);
  assert.equal(calls, 1);
  assert.deepEqual(await lk.urls('nonexistentword'), []);
  assert.deepEqual(await lk.urls('nonexistentword'), []);
  assert.equal(calls, 2);
  assert.ok(kv.m.get('readup:pron-v1')!.includes('nonexistentword'));
  // Phiên mới đọc lại từ kho, không gọi mạng.
  const lk2 = createLookup({ fetch: f, kv });
  assert.deepEqual(lk2.peek('nonexistentword'), []);
  await lk2.urls('nonexistentword');
  assert.equal(calls, 2);
});

test('lỗi mạng / quá giờ không bị nhớ thành "không có" (đường lùi sang giọng máy)', async () => {
  let calls = 0;
  const f: FetchLike = async () => {
    calls++;
    throw new Error('offline');
  };
  const lk = createLookup({ fetch: f, kv: mkKV(), cooldownMs: 0 });
  assert.equal(await lk.urls('word'), null);
  assert.equal(await lk.urls('word'), null);
  assert.equal(calls, 2);
  const slow: FetchLike = () => new Promise(() => undefined);
  const lk2 = createLookup({ fetch: slow, kv: null, timeoutMs: 30 });
  assert.equal(await lk2.urls('word'), null);
});

test('hai lần hỏi cùng lúc chỉ gọi mạng một lần', async () => {
  let calls = 0;
  const f: FetchLike = async () => {
    calls++;
    return { ok: true, status: 200, json: async () => body };
  };
  const lk = createLookup({ fetch: f, kv: null });
  await Promise.all([lk.urls('a'), lk.urls('a')]);
  assert.equal(calls, 1);
});

test('kế hoạch phát: ưu tiên dictionaryapi, rồi tên tệp đoán sẵn, cuối cùng giọng máy', async () => {
  const ok: FetchLike = async () => ({ ok: true, status: 200, json: async () => body });
  const nf: FetchLike = async () => ({ ok: false, status: 404, json: async () => ({}) });
  const off: FetchLike = async () => {
    throw new Error('offline');
  };
  const plan = (f: FetchLike, t: string, a: 'us' | 'uk' = 'us') => planPlayback(t, a, createLookup({ fetch: f, kv: null }));
  const p = await plan(ok, 'test');
  assert.ok(p.kind === 'audio' && p.url.endsWith('test-us.mp3'));
  assert.ok(p.kind === 'audio' && p.alts.some((u) => u.endsWith('test--_us_1.mp3')));
  const uk = await plan(ok, 'test', 'uk');
  assert.ok(uk.kind === 'audio' && uk.url.endsWith('test-uk.mp3'));
  // Cụm từ, hoặc từ có gạch nối mà tra không ra: giọng máy.
  assert.deepEqual(await plan(ok, 'take off the lid'), { kind: 'tts' });
  assert.deepEqual(await plan(off, 'well-known'), { kind: 'tts' });
  // Offline / không có trong từ điển: thử tên tệp đoán sẵn (hỏng thì người phát lùi sang giọng máy).
  const o = await plan(off, 'test');
  assert.ok(o.kind === 'audio' && o.url.endsWith('/test--_us_1.mp3') && o.alts[0]!.endsWith('/test--_gb_1.mp3'));
  const n = await plan(nf, 'zzzz', 'uk');
  assert.ok(n.kind === 'audio' && n.url.endsWith('/zzzz--_gb_1.mp3'));
  const empty = await plan(async () => ({ ok: true, status: 200, json: async () => [{ phonetics: [{ audio: '' }] }] }), 'test');
  assert.ok(empty.kind === 'audio' && empty.url.includes('gstatic'));
});

test('từ điển lỗi một lần thì tạm nghỉ, từ sau không phải chờ lại', async () => {
  let calls = 0;
  let t = 1000;
  const f: FetchLike = async () => {
    calls++;
    throw new Error('down');
  };
  const lk = createLookup({ fetch: f, kv: null, cooldownMs: 5000, now: () => t });
  assert.equal(await lk.urls('one'), null);
  assert.equal(await lk.urls('two'), null);
  assert.equal(calls, 1);
  t += 6000;
  assert.equal(await lk.urls('three'), null);
  assert.equal(calls, 2);
});

test('tên tệp đoán sẵn chỉ cho từ chữ cái thuần', () => {
  assert.equal(guessAudioUrls('Occupation', 'uk')[0], 'https://ssl.gstatic.com/dictionary/static/sounds/20200429/occupation--_gb_1.mp3');
  assert.deepEqual(guessAudioUrls("don't", 'us'), []);
});
