import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addMyWord, findMyWord, undoMyWord, MY_WORDS_CAP, type MyWordsApi } from './my-words';
import type { VocabEntry } from '@/store/useVocabStore';

function fakeApi(): MyWordsApi {
  const api: MyWordsApi = {
    entries: {},
    saveWord: (input) => {
      const id = `id${Object.keys(api.entries).length}_${input.lemma}`;
      api.entries = { ...api.entries, [id]: { ...input, id, createdAt: '', masteryPercent: 0 } as VocabEntry };
      return id;
    },
    removeWord: (id) => {
      const next = { ...api.entries };
      delete next[id];
      api.entries = next;
    },
  };
  return api;
}

const W = { word: 'Implement', lemma: 'Implement', phonetic: null, partOfSpeech: 'noun', definitionVi: 'dụng cụ', definitionGeneral: null };
const CTX = { sentence: 'She uses an implement.', source: 'Từ mới của tôi' };

test('thêm từ: lưu kèm câu ví dụ và nơi gặp, lemma chữ thường', () => {
  const api = fakeApi();
  const r = addMyWord(api, W, CTX);
  assert.equal(r.status, 'added');
  const e = Object.values(api.entries)[0]!;
  assert.equal(e.lemma, 'implement');
  assert.equal(e.sourceSentence, CTX.sentence);
  assert.equal(e.articleTitle, CTX.source);
});

test('trùng không phân biệt hoa thường thì không thêm lần hai', () => {
  const api = fakeApi();
  addMyWord(api, W, CTX);
  const again = addMyWord(api, { ...W, word: 'IMPLEMENT', lemma: 'IMPLEMENT' }, CTX);
  assert.equal(again.status, 'exists');
  assert.equal(Object.keys(api.entries).length, 1);
});

test('hoàn tác: xoá đúng mục rồi thêm lại được', () => {
  const api = fakeApi();
  addMyWord(api, W, CTX);
  assert.equal(undoMyWord(api, 'implement'), true);
  assert.equal(findMyWord(api.entries, 'implement'), null);
  assert.equal(undoMyWord(api, 'implement'), false);
  assert.equal(addMyWord(api, W, CTX).status, 'added');
});

test('đầy trần thì từ chối', () => {
  const api = fakeApi();
  for (let i = 0; i < MY_WORDS_CAP; i++) api.entries[`k${i}`] = { id: `k${i}`, lemma: `w${i}` } as VocabEntry;
  assert.equal(addMyWord(api, W, CTX).status, 'full');
});
