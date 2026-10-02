import assert from 'node:assert/strict';
import { test } from 'node:test';

import { INITIAL_SCROLL_BAR_STATE, nextScrollBarState, type ScrollBarState } from './scroll-direction';

function run(ys: number[], start: ScrollBarState = INITIAL_SCROLL_BAR_STATE): ScrollBarState[] {
  const out: ScrollBarState[] = [];
  let s = start;
  for (const y of ys) {
    s = nextScrollBarState(s, y);
    out.push(s);
  }
  return out;
}

test('gần đầu trang thì luôn hiện', () => {
  assert.equal(nextScrollBarState({ hidden: true, anchor: 500 }, 20).hidden, false);
  assert.equal(nextScrollBarState(INITIAL_SCROLL_BAR_STATE, -40).hidden, false);
});

test('cuộn xuống đủ xa thì ẩn, nhích vài px thì chưa', () => {
  const states = run([108, 115], { hidden: false, anchor: 100 });
  assert.equal(states[1]!.hidden, false);
  const down = run([130], { hidden: false, anchor: 100 });
  assert.equal(down[0]!.hidden, true);
});

test('đang ẩn: cuộn lên đủ ngưỡng thì hiện, tay run thì không', () => {
  const hidden = run([140], { hidden: false, anchor: 100 })[0]!;
  assert.equal(hidden.hidden, true);
  assert.equal(nextScrollBarState(hidden, 135).hidden, true);
  assert.equal(nextScrollBarState(hidden, 125).hidden, false);
});

test('đang cuộn xuống tiếp thì mốc dời theo, không hiện lại giữa chừng', () => {
  const s = run([140, 200, 260, 255, 258, 300], { hidden: false, anchor: 100 });
  assert.equal(s[2]!.hidden, true);
  assert.equal(s[3]!.hidden, true);
  assert.equal(s[5]!.hidden, true);
  assert.equal(s[5]!.anchor, 300);
});

test('cuộn lên rồi lại xuống thì mốc tính từ điểm cao nhất mới', () => {
  const s = run([340, 320, 200, 210, 215, 240], { hidden: false, anchor: 300 });
  assert.equal(s[1]!.hidden, false);
  assert.equal(s[4]!.hidden, false);
  assert.equal(s[5]!.hidden, true);
});
