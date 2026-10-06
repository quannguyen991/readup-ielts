import assert from 'node:assert/strict';
import test from 'node:test';

import { CITY_MAPS } from '@/data/travel/maps';
import { STUDY_ABROAD_CHAPTERS, STUDY_ABROAD_MISSIONS } from './study-abroad-campaign';
import { PERSONA_SPRITE, STAGE_SPECS, checkBeat, speakScore, spotsOf, type Beat } from './study-abroad-stage';

const CITY_OF_CHAPTER = { 1: 'singapore', 2: 'london', 3: 'paris', 4: 'tokyo', 5: 'newyork' } as const;

test('20 nhiệm vụ trong 5 chặng, mỗi chặng 4 nhiệm vụ, xếp đúng thứ tự chặng', () => {
  assert.equal(STUDY_ABROAD_MISSIONS.length, 20);
  assert.equal(STUDY_ABROAD_CHAPTERS.length, 5);
  for (const c of STUDY_ABROAD_CHAPTERS) assert.equal(STUDY_ABROAD_MISSIONS.filter((m) => m.chapter === c.id).length, 4, `chặng ${c.id}`);
  const chapters = STUDY_ABROAD_MISSIONS.map((m) => m.chapter);
  assert.deepEqual(chapters, [...chapters].sort(), 'thứ tự chặng tăng dần');
});

test('mỗi nhiệm vụ có cảnh: địa điểm có thật, đúng thành phố, ít nhất hai lượt với hai kiểu hành động khác nhau', () => {
  for (const mission of STUDY_ABROAD_MISSIONS) {
    const spec = STAGE_SPECS[mission.id];
    assert.ok(spec, `${mission.id} thiếu cảnh`);
    for (const spot of spotsOf(spec!)) {
      const city = spot.split('-')[0] as keyof typeof CITY_MAPS;
      assert.equal(city, CITY_OF_CHAPTER[mission.chapter], `${mission.id}: ${spot} sai thành phố`);
      assert.ok(CITY_MAPS[city]?.pois.some((p) => p.id === spot), `${mission.id}: địa điểm ${spot} không có trên bản đồ`);
    }
    assert.ok(PERSONA_SPRITE[spec!.persona], `${mission.id} persona`);
    assert.ok(spec!.beats.length >= 2, `${mission.id} cần ≥ 2 lượt sau lượt mở đầu`);
    assert.ok(new Set(spec!.beats.map((b) => b.kind)).size >= 2, `${mission.id} cần ≥ 2 kiểu hành động`);
    assert.ok(spec!.reaction.en && spec!.reaction.vi && spec!.starters.every((s) => s.en && s.vi));
  }
});

test('mọi lượt đều trả lời được bằng chính đáp án của nó, và đáp án sai bị từ chối', () => {
  for (const [id, spec] of Object.entries(STAGE_SPECS)) {
    spec.beats.forEach((b: Beat, i) => {
      const where = `${id}#${i + 1} (${b.kind})`;
      assert.ok(b.say.en && b.say.vi && b.prompt.vi && b.prompt.en && b.hint.vi && b.reaction.en && b.reaction.vi, `${where} thiếu chữ`);
      if (b.kind === 'choice' || b.kind === 'listen') {
        assert.equal(b.options.length, 4, where);
        assert.ok(checkBeat(b, b.answer), where);
        assert.ok(!checkBeat(b, (b.answer + 1) % 4), where);
      } else if (b.kind === 'give') {
        assert.equal(b.items.length, 4, where);
        const ok = Array.isArray(b.answer) ? b.answer : [b.answer];
        for (const a of ok) assert.ok(checkBeat(b, a), where);
        assert.ok(b.items.some((_, k) => !ok.includes(k)) && !checkBeat(b, b.items.findIndex((_, k) => !ok.includes(k))), where);
      } else if (b.kind === 'arrange') {
        const words = b.target.split(' ');
        assert.ok(checkBeat(b, words), where);
        assert.ok(!checkBeat(b, [...words].reverse()), where);
        for (const x of b.extra ?? []) assert.ok(!words.map((w) => w.toLowerCase()).includes(x), `${where}: từ gây nhiễu "${x}" trùng câu mẫu`);
      } else if (b.kind === 'type') {
        for (const a of b.answers) assert.ok(checkBeat(b, a), `${where} ${a}`);
        assert.ok(!checkBeat(b, 'banana'), where);
      } else if (b.kind === 'speak') {
        assert.ok(checkBeat(b, b.target), where);
        assert.ok(!checkBeat(b, 'banana'), where);
      }
    });
  }
});

test('lời nhắc và gợi ý: trường tiếng Việt chứa tiếng Việt, trường tiếng Anh không có dấu tiếng Việt', () => {
  const vn = /[À-ỹ]/;
  for (const [id, spec] of Object.entries(STAGE_SPECS)) {
    spec.beats.forEach((b, i) => {
      for (const f of ['prompt', 'hint'] as const) {
        const { vi, en } = b[f];
        assert.ok(!vn.test(en), `${id}#${i + 1}.${f}.en có dấu tiếng Việt: ${en}`);
        if (vi !== en) assert.ok(vn.test(vi), `${id}#${i + 1}.${f}.vi không có tiếng Việt: ${vi}`);
      }
      assert.ok(!vn.test(b.say.en) && !vn.test(b.reaction.en), `${id}#${i + 1} say/reaction.en`);
    });
  }
});

test('speakScore: bỏ dấu câu, chịu lỗi nhận dạng nhẹ, từ lạc bị phạt', () => {
  assert.equal(speakScore('No, that is all. Thank you.', 'no that is all thank you'), 1);
  assert.ok(speakScore('Thank you for this opportunity', 'thank you for opportunity') >= 0.75);
  assert.ok(speakScore('Thank you for this opportunity', 'hello banana') < 0.75);
});
