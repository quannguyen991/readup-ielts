import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  answerGold,
  applyTile,
  BOARD_LEN,
  createGoldQuest,
  GOAL,
  makeBoard,
  STAR_MULT,
  TILE_GOLD,
  TRAP_PENALTY,
  TURNS,
  type GoldEvent,
  type GoldQuest,
  type TileKind,
} from './goldquest';

/** Bàn mà mọi ô cùng một loại: mỗi lần đứng là nhận đúng một mức vàng của loại đó. */
const uniform = (kind: TileKind): TileKind[] => Array.from({ length: BOARD_LEN }, () => kind);

const rollOf = (events: GoldEvent[]) => events.find((e): e is Extract<GoldEvent, { kind: 'roll' }> => e.kind === 'roll')!;
const landOf = (events: GoldEvent[]) => events.find((e): e is Extract<GoldEvent, { kind: 'land' }> => e.kind === 'land')!;
const endOf = (events: GoldEvent[]) => events.find((e): e is Extract<GoldEvent, { kind: 'end' }> => e.kind === 'end');

test('bàn có đúng 20 ô, đủ số ô mỗi loại, và cùng seed thì cùng bàn', () => {
  const a = makeBoard('bộ-x');
  const b = makeBoard('bộ-x');
  assert.equal(a.length, BOARD_LEN);
  assert.deepEqual(a, b);
  const count = (k: TileKind) => a.filter((t) => t === k).length;
  assert.equal(count('plain'), 5);
  assert.equal(count('gold'), 9);
  assert.equal(count('chest'), 2);
  assert.equal(count('star'), 2);
  assert.equal(count('trap'), 2);
});

test('đúng thì đi đúng số ô bằng xúc xắc và nhận đúng vàng theo ô đến', () => {
  for (const kind of ['plain', 'gold', 'chest', 'star', 'trap'] as const) {
    const g = createGoldQuest({ seed: 'đi-đúng', board: uniform(kind), turns: TURNS });
    const { game, events } = answerGold(g, true);
    const roll = rollOf(events);
    const land = landOf(events);
    assert.ok(roll.value >= 1 && roll.value <= 3, 'xúc xắc từ 1 tới 3');
    assert.equal(game.you.pos, roll.value + roll.bonus, `đi đúng ${roll.value + roll.bonus} ô`);
    assert.equal(land.tile, kind);
    assert.equal(game.you.gold, Math.max(0, TILE_GOLD[kind]), `ô ${kind} cho ${TILE_GOLD[kind]} vàng`);
  }
});

test('sai thì đứng yên, mất 1 combo, vẫn mất lượt', () => {
  const g = { ...createGoldQuest({ seed: 'sai', board: uniform('chest') }), combo: 2, you: { pos: 5, gold: 40 } };
  const { game, events } = answerGold(g, false);
  assert.equal(game.you.pos, 5);
  assert.equal(game.you.gold, 40);
  assert.equal(game.combo, 1);
  assert.equal(game.turn, 1);
  assert.equal(game.wrong, 1);
  assert.ok(events.some((e) => e.kind === 'wrong'));
  assert.ok(!events.some((e) => e.kind === 'roll'), 'sai thì không tung xúc xắc');
});

test('combo từ 3 trở lên thì xúc xắc được cộng thêm 1; dưới 3 thì không', () => {
  const base = createGoldQuest({ seed: 'combo', board: uniform('plain') });
  const second = answerGold({ ...base, combo: 1 }, true);
  assert.equal(rollOf(second.events).bonus, 0, 'combo lên 2 thì chưa cộng');
  const third = answerGold({ ...base, combo: 2 }, true);
  assert.equal(rollOf(third.events).bonus, 1, 'combo lên 3 thì được cộng 1');
  assert.equal(third.game.you.pos, rollOf(third.events).value + 1);
  assert.equal(third.game.combo, 3);
  assert.equal(third.game.maxCombo, 3);
});

test('bẫy trừ 8 vàng nhưng không làm vàng xuống dưới 0', () => {
  assert.deepEqual(applyTile(3, 'trap', 1), { gold: 0, gain: -3, boosted: false });
  assert.deepEqual(applyTile(20, 'trap', 1), { gold: 12, gain: -TRAP_PENALTY, boosted: false });

  const g = createGoldQuest({ seed: 'bẫy', board: uniform('trap') });
  let s: GoldQuest = g;
  for (let i = 0; i < 5; i += 1) {
    const r = answerGold(s, true);
    s = r.game;
    assert.ok(s.you.gold >= 0, 'vàng không âm');
  }
  assert.equal(s.you.gold, 0);
});

test('ô sao nhân 2 vàng ở lần đúng kế tiếp, rồi mới hết nhân', () => {
  const g = createGoldQuest({ seed: 'sao', board: uniform('star') });
  const first = answerGold(g, true);
  assert.equal(first.game.you.gold, TILE_GOLD.star);
  assert.equal(first.game.boost, STAR_MULT, 'đứng sao thì lần sau được nhân');
  const second = answerGold(first.game, true);
  assert.equal(landOf(second.events).boosted, true);
  assert.equal(second.game.you.gold, TILE_GOLD.star + TILE_GOLD.star * STAR_MULT);
});

test('đi đủ một vòng (>= 20 ô) thì thắng ngay', () => {
  const g = { ...createGoldQuest({ seed: 'vòng', board: uniform('plain') }), you: { pos: BOARD_LEN - 1, gold: 0 } };
  const { game, events } = answerGold(g, true);
  assert.equal(game.status, 'won');
  assert.equal(game.reason, 'lap');
  assert.deepEqual(endOf(events), { kind: 'end', status: 'won', reason: 'lap' });
});

test('hết lượt đạt 120 vàng thì thắng; chưa đạt thì thua', () => {
  const near = { ...createGoldQuest({ seed: 'mục-tiêu', board: uniform('plain') }), turn: TURNS - 1, you: { pos: 0, gold: GOAL - 5 } };
  const won = answerGold(near, true);
  assert.equal(won.game.status, 'won');
  assert.equal(won.game.reason, 'goal');
  assert.equal(won.game.you.gold, GOAL);

  const short = answerGold({ ...near, you: { pos: 0, gold: GOAL - 6 } }, true);
  assert.equal(short.game.status, 'lost');
  assert.equal(short.game.reason, 'short');
});

test('có bot: hết lượt không đạt 120 thì so vàng với bot', () => {
  const base = { ...createGoldQuest({ seed: 'bot', board: uniform('plain'), rival: true }), turn: TURNS - 1 };
  const ahead = answerGold({ ...base, you: { pos: 0, gold: 50 }, bot: { pos: 0, gold: 40 } }, true);
  assert.equal(ahead.game.status, 'won');
  assert.equal(ahead.game.reason, 'beat');

  const behind = answerGold({ ...base, you: { pos: 0, gold: 50 }, bot: { pos: 0, gold: 60 } }, false);
  assert.equal(behind.game.status, 'lost');
  assert.equal(behind.game.reason, 'behind');
});

test('bot đi 1–2 ô mỗi lượt và vẫn nhận vàng theo ô', () => {
  let s = createGoldQuest({ seed: 'bot-bước', board: uniform('gold'), rival: true });
  // Chỉ trả lời sai: quân người chơi đứng yên, không đi đủ vòng giữa chừng; bot vẫn đi mỗi lượt.
  for (let i = 0; i < 8; i += 1) {
    const before = s.bot!.pos;
    const r = answerGold(s, false);
    s = r.game;
    const botEv = r.events.find((e): e is Extract<GoldEvent, { kind: 'botMove' }> => e.kind === 'botMove')!;
    const step = s.bot!.pos - before;
    assert.ok(step === 1 || step === 2, `bước bot ${step}`);
    assert.equal(botEv.to - botEv.from, step);
    assert.equal(s.bot!.gold, Math.floor(TILE_GOLD.gold / 2) * (i + 1), 'bot nhận nửa vàng ô vàng');
  }
});

test('cùng seed và cùng chuỗi đúng/sai thì ra cùng diễn biến', () => {
  const answers = [true, true, false, true, true, true, false, true, true, true, true, false, true, true, true];
  const play = (seed: string) => {
    let s = createGoldQuest({ seed, rival: true });
    const log: GoldEvent[][] = [];
    for (const a of answers) {
      const r = answerGold(s, a);
      s = r.game;
      log.push(r.events);
    }
    return { s, log };
  };
  const one = play('giống-nhau');
  const two = play('giống-nhau');
  assert.deepEqual(one, two);
  assert.notEqual(one.s.status, 'playing', 'đủ lượt thì trận đã kết thúc');
});

test('trận đã kết thúc thì câu trả lời không đổi gì', () => {
  const done = { ...createGoldQuest({ seed: 'xong', board: uniform('chest') }), status: 'won' as const, reason: 'lap' as const };
  const r = answerGold(done, true);
  assert.equal(r.game, done);
  assert.equal(r.events.length, 0);
});
