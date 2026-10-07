import test from 'node:test';
import assert from 'node:assert/strict';

import { canonicalFriendPair, cleanCommunityText, validMessageBody, validPostInput } from './rules';

test('community text removes control characters but keeps Vietnamese and line breaks', () => {
  assert.equal(cleanCommunityText('  Xin\u0000 chào\n bạn  ', 100), 'Xin chào\n bạn');
});

test('post inputs require a known category, kind, title and body', () => {
  assert.deepEqual(validPostInput({ kind: 'question', category: 'speaking', title: 'Part 1', body: 'How do I extend my answer?' }), {
    kind: 'question', category: 'speaking', title: 'Part 1', body: 'How do I extend my answer?',
  });
  assert.equal(validPostInput({ kind: 'post', category: 'unknown', title: 'Hi', body: 'Hello' }), null);
});

test('message body rejects blank values and caps oversized messages', () => {
  assert.equal(validMessageBody(' \n '), null);
  assert.equal(validMessageBody('hello'), 'hello');
  assert.equal(validMessageBody('a'.repeat(2000))?.length, 1500);
});

test('friend pairs are canonical and reject self friendship', () => {
  const a = '00000000-0000-0000-0000-000000000001';
  const b = '00000000-0000-0000-0000-000000000002';
  assert.deepEqual(canonicalFriendPair(b, a), { low: a, high: b });
  assert.equal(canonicalFriendPair(a, a), null);
});
