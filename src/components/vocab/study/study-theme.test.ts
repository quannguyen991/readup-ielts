import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ALL_THEMES, ART_THEME_IDS, contrast, STUDY_THEMES, themeOf } from './study-theme';

const CHECKED = [...ALL_THEMES, ...ART_THEME_IDS];

test('mỗi chủ đề có đủ màu và id khớp khoá', () => {
  assert.equal(ALL_THEMES.length, 8);
  assert.equal(STUDY_THEMES.plain.fx, false, 'Mặc định phẳng không có lớp trang trí');
  for (const id of ALL_THEMES) {
    const t = STUDY_THEMES[id];
    assert.equal(t.id, id);
    for (const k of ['card', 'ink', 'muted', 'optBg', 'accent', 'good', 'bad', 'onBg', 'sky', 'swatch'] as const) assert.ok(t[k], `${id}.${k}`);
  }
  assert.equal(themeOf('khong-co').id, 'plain');
  assert.equal(themeOf(undefined).id, 'plain');
});

test('chữ thân trong thẻ đạt AA (>= 4,5:1) ở mọi chủ đề', () => {
  for (const id of CHECKED) {
    const t = STUDY_THEMES[id];
    const under = t.skyBase;
    const cardSolid = t.card.startsWith('rgba') ? under : t.card;
    assert.ok(contrast(t.ink, t.card, under) >= 7, `${id}: ink/card ${contrast(t.ink, t.card, under).toFixed(2)}`);
    assert.ok(contrast(t.muted, t.card, under) >= 4.5, `${id}: muted/card ${contrast(t.muted, t.card, under).toFixed(2)}`);
    assert.ok(contrast(t.muted, t.soft, cardSolid) >= 4.5, `${id}: muted/soft ${contrast(t.muted, t.soft, cardSolid).toFixed(2)}`);
    assert.ok(contrast(t.ink, t.optBg, cardSolid) >= 7, `${id}: ink/option`);
    assert.ok(contrast(t.good, t.card, under) >= 4.5, `${id}: good/card ${contrast(t.good, t.card, under).toFixed(2)}`);
    assert.ok(contrast(t.bad, t.card, under) >= 4.5, `${id}: bad/card ${contrast(t.bad, t.card, under).toFixed(2)}`);
  }
});

test('chữ ngoài thẻ (onBg) đọc được trên mọi đầu mút của nền trời; nút chính chữ trắng đạt AA', () => {
  for (const id of CHECKED) {
    const t = STUDY_THEMES[id];
    if (id === 'scene') continue; // nền cảnh bay có lớp tối phủ riêng, đo ở trình duyệt
    for (const stop of t.skyStops) assert.ok(contrast(t.onBg, stop) >= 4.5, `${id}: onBg trên ${stop} = ${contrast(t.onBg, stop).toFixed(2)}`);
    assert.ok(contrast('#FFFFFF', t.accent) >= 4.5, `${id}: nút chính ${contrast('#FFFFFF', t.accent).toFixed(2)}`);
  }
});
