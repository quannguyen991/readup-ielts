import assert from 'node:assert/strict';
import { test } from 'node:test';

import { deckIconFor } from './deck-icon';

test('icon theo chủ đề của bộ từ', () => {
  assert.equal(deckIconFor('Hành động chung', 'General actions', 'oxford'), 'bolt');
  assert.equal(deckIconFor('Cảm xúc & Tính cách', 'Feelings & Personality', 'oxford'), 'sparkle');
  assert.equal(deckIconFor('Xã hội & Pháp luật', 'Society & Law', 'oxford'), 'medal');
  assert.equal(deckIconFor('Giáo dục', 'Education', 'ielts'), 'cap');
  assert.equal(deckIconFor('Kinh tế & Tiền bạc', 'Economy & Money', 'oxford'), 'coin');
  assert.equal(deckIconFor('Công việc', 'Work and Careers', 'ielts'), 'briefcase');
  assert.equal(deckIconFor('Thiên nhiên & Môi trường', 'Nature & Environment', 'oxford'), 'planet');
  assert.equal(deckIconFor('Thời gian & Số lượng', 'Time & Quantity', 'oxford'), 'clock');
});

test('không khớp luật nào thì dùng icon mặc định của nguồn', () => {
  assert.equal(deckIconFor('Unit 7', 'Unit 7', 'destination'), 'stairs');
  assert.equal(deckIconFor('???', '???', 'listening'), 'headphones');
  assert.equal(deckIconFor('???', '???', 'khong-co'), 'star5');
});

test('từ khoá ngắn không khớp nhầm trong từ khác', () => {
  assert.equal(deckIconFor('Thể thao & Giải trí', 'Sports & Leisure', 'oxford'), 'gamepad');
  assert.equal(deckIconFor('Tiếng Anh giao tiếp', 'Spoken English', 'daily'), 'speaker');
  assert.equal(deckIconFor('Việt Nam', 'Vietnam', 'x'), 'star5');
});

test('bộ Global Success: chủ đề lấy sau "Unit N:", không lấy chữ Success', () => {
  assert.equal(deckIconFor('Global Success 10 · Unit 1: Family Life', 'Global Success 10 · Unit 1: Family Life', 'globalSuccess'), 'heart');
  assert.equal(deckIconFor('Global Success 10 · Unit 3: Music', 'Global Success 10 · Unit 3: Music', 'globalSuccess'), 'note');
});
