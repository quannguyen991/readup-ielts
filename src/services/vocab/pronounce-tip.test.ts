import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PRONOUNCE_TIP_LIMIT_PER_MONTH,
  buildPronounceTipCall,
  cleanTipInput,
  clipText,
  parsePronounceTip,
  pronounceTipPeriod,
} from './pronounce-tip';

test('clipText bỏ ký tự điều khiển, gộp khoảng trắng, cắt độ dài; không phải chuỗi thì thành rỗng', () => {
  assert.equal(clipText('  ship\u0007\n  it  ', 40), 'ship it');
  assert.equal(clipText('abcdef', 3), 'abc');
  assert.equal(clipText(42, 10), '');
});

test('cleanTipInput từ chối từ sai định dạng và lượt không có phương án nào', () => {
  assert.equal(cleanTipInput({ word: 'well-being', heard: ['well being'] })?.word, 'well-being', 'từ có gạch nối vẫn là từ vựng');
  assert.equal(cleanTipInput({ word: 'Dr. Who', heard: ['doctor'] }), null, 'dấu chấm không thuộc khuôn từ');
  assert.equal(cleanTipInput({ word: 'café', heard: ['cafe'] }), null, 'chữ ngoài a–z không đưa vào lời hỏi AI');
  assert.equal(cleanTipInput({ word: 'ship', heard: [] }), null, 'máy không nghe được gì thì không gọi AI');
  assert.equal(cleanTipInput({ word: '', heard: ['x'] }), null);
  assert.equal(cleanTipInput(null), null);
});

test('cleanTipInput giữ tối đa năm phương án, cắt từng phương án, và chỉ nhận correct === true', () => {
  const out = cleanTipInput({
    word: 'ship',
    ipa: '/ʃɪp/',
    pos: 'noun',
    meaningVi: 'tàu thủy',
    heard: ['sheep', 'sheet', 'seep', 'sip', 'shipp', 'extra', 'x'.repeat(200)],
    correct: 'yes',
  });
  assert.ok(out);
  assert.equal(out.heard.length, 5);
  assert.equal(out.heard[0], 'sheep');
  assert.equal(out.correct, false, 'chuỗi "yes" không được coi là đúng');
  assert.equal(cleanTipInput({ word: 'ship', heard: ['ship'], correct: true })?.correct, true);
});

test('buildPronounceTipCall: dữ liệu máy nghe nằm ở tin nhắn người dùng dưới dạng JSON, không lọt vào chỉ dẫn', () => {
  const input = cleanTipInput({ word: 'ship', ipa: '/ʃɪp/', heard: ['she"p\n}', 'sheep'] });
  assert.ok(input);
  const call = buildPronounceTipCall(input);
  assert.match(call.system, /untrusted data/);
  assert.match(call.system, /JSON only/);
  assert.match(call.user, /Target word: ship/);
  assert.match(call.user, /Verdict from the app: wrong/);
  assert.ok(call.user.includes(JSON.stringify(['she"p }', 'sheep'])), 'dấu nháy của phương án máy nghe phải được thoát');
  assert.ok(!call.system.includes('she"p'), 'không được chép dữ liệu học viên vào chỉ dẫn');
});

test('parsePronounceTip: thiếu phần cốt lõi thì null; thiếu bản tiếng Anh thì dùng bản tiếng Việt', () => {
  assert.equal(parsePronounceTip({ fixVi: 'x', sayEn: 'ship' }, 'ship'), null, 'thiếu issueVi');
  assert.equal(parsePronounceTip({ issueVi: 'x', sayEn: 'ship' }, 'ship'), null, 'thiếu fixVi');
  assert.equal(parsePronounceTip({ issueVi: 'x', fixVi: 'y' }, 'ship'), null, 'thiếu sayEn');
  assert.equal(parsePronounceTip('chuỗi', 'ship'), null);

  const tip = parsePronounceTip({ issueVi: 'Nguyên âm quá dài.', fixVi: 'Đọc ngắn hơn.', sayEn: 'Short vowel. Ship.' }, 'ship');
  assert.ok(tip);
  assert.equal(tip.issueEn, 'Nguyên âm quá dài.');
  assert.equal(tip.fixEn, 'Đọc ngắn hơn.');
  assert.deepEqual(tip.contrast, []);
});

test('parsePronounceTip: câu đọc to luôn có từ đích; contrast bỏ chính từ đích, ký tự lạ, trùng lặp, và quá ba từ', () => {
  const tip = parsePronounceTip(
    {
      issueVi: 'a',
      fixVi: 'b',
      sayEn: 'Keep the vowel short.',
      contrast: ['ship', 'sit', 'SIT', 'seat', 'sheet', 'bit', 'a b', '12ab', 'x'],
    },
    'ship',
  );
  assert.ok(tip);
  assert.equal(tip.sayEn, 'Keep the vowel short. ship', 'thiếu từ đích thì thêm vào cuối');
  assert.deepEqual(tip.contrast, ['sit', 'seat', 'sheet'], 'bỏ từ đích, bỏ trùng không phân biệt hoa thường, giữ tối đa ba');
});

test('hạn mức và kỳ đếm: đếm riêng theo tháng, không dùng chung khoá với chấm bài', () => {
  assert.equal(pronounceTipPeriod(new Date(2026, 9, 13)), 'pronounce:2026-10');
  assert.equal(pronounceTipPeriod(new Date(2026, 0, 2)), 'pronounce:2026-01');
  assert.ok(Number.isInteger(PRONOUNCE_TIP_LIMIT_PER_MONTH) && PRONOUNCE_TIP_LIMIT_PER_MONTH > 0);
});
