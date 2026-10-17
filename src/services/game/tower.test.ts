import assert from 'node:assert/strict';
import { test } from 'node:test';

import { comboBonus } from './rules';
import {
  answerTower,
  BUILD_COST,
  BREAK_TICKS,
  buildTower,
  createTowerGame,
  GOLD_CORRECT,
  LANE,
  makeFoe,
  onLane,
  shotDamage,
  tickTower,
  TOWER_HEARTS,
  towerAt,
  upgradeBlock,
  upgradeTower,
  waveSize,
  WAVES,
  type Cell,
  type TowerGame,
} from './tower';

/** Chặn sóng ra quái để test một tình huống có chủ đích. */
const quiet = (over: Partial<TowerGame> = {}) =>
  createTowerGame({ phase: 'spawn', spawned: waveSize(1), timer: 999, nextId: 100, ...over });

test('tháp bắn con tiến xa nhất trong tầm; con ngoài tầm không mất máu', () => {
  const near = makeFoe(1, 0, 6); // ô (4,2), cách tháp (4,3) chừng một ô
  const mid = makeFoe(2, 1, 5); // ô (4,1), vẫn trong tầm nhưng lùi hơn
  const far = makeFoe(3, 2, 0); // ô (0,0), ngoài tầm
  const g = quiet({ foes: [near, mid, far], towers: [{ id: 1, cell: { c: 4, r: 3 }, level: 1, cooldown: 0 }] });
  const { game, events } = tickTower(g);
  const hp = (id: number) => game.foes.find((f) => f.id === id)!.hp;
  assert.equal(hp(1), near.maxHp - shotDamage(0, 1));
  assert.equal(hp(2), mid.maxHp);
  assert.equal(hp(3), far.maxHp);
  const shots = events.filter((e) => e.kind === 'shot');
  assert.equal(shots.length, 1);
  assert.equal(shots[0]!.kind === 'shot' && shots[0]!.foe, 1);
});

test('tháp không bắn khi không có quái nào trong tầm', () => {
  const g = quiet({ foes: [makeFoe(1, 0, 0)], towers: [{ id: 1, cell: { c: 4, r: 3 }, level: 1, cooldown: 0 }] });
  const { game, events } = tickTower(g);
  assert.equal(events.filter((e) => e.kind === 'shot').length, 0);
  assert.equal(game.foes[0]!.hp, game.foes[0]!.maxHp);
});

test('quái đi tới đích thì lọt ra ngoài và trừ một tim', () => {
  const g = quiet({ foes: [makeFoe(1, 0, LANE.length - 1.05)] });
  const { game, events } = tickTower(g);
  assert.equal(game.foes.length, 0);
  assert.equal(game.hearts, TOWER_HEARTS - 1);
  assert.equal(game.leaked, 1);
  assert.ok(events.some((e) => e.kind === 'leak' && e.foe === 1));
});

test('câu sai: mất một tim, combo về 0, và con gần đích nhất lọt ra ngoài', () => {
  const g = quiet({ combo: 4, foes: [makeFoe(1, 0, 2), makeFoe(2, 1, 7)] });
  const { game, events, gold } = answerTower(g, false);
  assert.equal(gold, 0);
  assert.equal(game.hearts, TOWER_HEARTS - 1);
  assert.equal(game.combo, 0);
  assert.deepEqual(game.foes.map((f) => f.id), [1]);
  assert.equal(game.leaked, 1);
  assert.equal(game.wrong, 1);
  assert.ok(events.some((e) => e.kind === 'leak' && e.foe === 2));
});

test('thua khi hết tim: do quái lọt đích, và do câu sai', () => {
  const byLeak = quiet({ hearts: 1, foes: [makeFoe(1, 0, LANE.length - 1.05)] });
  const a = tickTower(byLeak);
  assert.equal(a.game.status, 'lost');
  assert.equal(a.game.hearts, 0);
  assert.ok(a.events.some((e) => e.kind === 'lost'));
  // Đã thua thì nhịp và câu trả lời không làm gì nữa.
  assert.equal(tickTower(a.game).game, a.game);
  assert.equal(answerTower(a.game, true).game, a.game);

  const byAnswer = answerTower(quiet({ hearts: 1, foes: [] }), false);
  assert.equal(byAnswer.game.status, 'lost');
  assert.equal(byAnswer.game.hearts, 0);
});

test('thắng khi quái của sóng cuối đã hết', () => {
  const g = quiet({ wave: WAVES, spawned: waveSize(WAVES), timer: 0, foes: [] });
  const { game, events } = tickTower(g);
  assert.equal(game.status, 'won');
  assert.ok(events.some((e) => e.kind === 'won'));
});

test('hết quái của sóng thường thì nghỉ rồi sang sóng sau', () => {
  const g = quiet({ wave: 1, spawned: waveSize(1), timer: 0, foes: [] });
  const { game } = tickTower(g);
  assert.equal(game.status, 'playing');
  assert.equal(game.wave, 2);
  assert.equal(game.phase, 'break');
  assert.equal(game.timer, BREAK_TICKS);
  assert.equal(game.spawned, 0);
});

test('đặt tháp chỉ khi đủ vàng, đúng chỗ và ô còn trống', () => {
  const free: Cell = { c: 0, r: 1 };
  const short = quiet({ gold: BUILD_COST - 1 });
  assert.equal(buildTower(short, free).block, 'gold');
  assert.equal(buildTower(short, free).game.towers.length, 0);

  const rich = quiet({ gold: BUILD_COST });
  assert.equal(buildTower(rich, { c: 0, r: 0 }).block, 'lane'); // đường quái đi
  assert.equal(buildTower(rich, { c: 9, r: 9 }).block, 'outside');

  const built = buildTower(rich, free);
  assert.equal(built.block, null);
  assert.equal(built.game.gold, 0);
  assert.equal(built.game.towers.length, 1);
  assert.ok(towerAt(built.game, free));
  assert.equal(onLane(free), false);

  const again = buildTower({ ...built.game, gold: BUILD_COST }, free);
  assert.equal(again.block, 'occupied');
});

test('đúng thì được vàng theo combo; sai thì combo về 0', () => {
  let g = quiet();
  let total = 0;
  for (let k = 1; k <= 3; k += 1) {
    const r = answerTower(g, true);
    assert.equal(r.gold, GOLD_CORRECT + comboBonus(k));
    total += r.gold;
    g = r.game;
  }
  assert.equal(g.gold, total);
  assert.equal(g.combo, 3);
  assert.equal(answerTower(g, false).game.combo, 0);
});

test('nâng cấp tốn đúng giá và dừng ở cấp tối đa', () => {
  let g = quiet({ gold: 40, towers: [{ id: 7, cell: { c: 2, r: 1 }, level: 1, cooldown: 0 }] });
  assert.equal(upgradeBlock(g, 7), null);
  g = upgradeTower(g, 7).game;
  assert.equal(g.towers[0]!.level, 2);
  assert.equal(g.gold, 0);
  assert.equal(upgradeBlock({ ...g, gold: 69 }, 7), 'gold');
  g = upgradeTower({ ...g, gold: 70 }, 7).game;
  assert.equal(g.towers[0]!.level, 3);
  assert.equal(upgradeBlock({ ...g, gold: 999 }, 7), 'max');
  assert.equal(upgradeBlock(g, 404), 'missing');
});

test('sóng tăng dần và quái ra đúng thứ tự, con cuối mỗi vòng là boss', () => {
  const sizes = Array.from({ length: WAVES }, (_, i) => waveSize(i + 1));
  assert.deepEqual(sizes, [...sizes].sort((a, b) => a - b));
  assert.equal(new Set(sizes).size, sizes.length);
  assert.equal(makeFoe(1, 6).boss, true);
  assert.equal(makeFoe(1, 0).boss, false);
});

/** Người chơi giả lập: trả lời đúng mỗi 2 giây, và tiêu vàng ngay khi đủ. */
function play(spend: boolean): TowerGame {
  const slots: Cell[] = [{ c: 2, r: 1 }, { c: 3, r: 1 }, { c: 1, r: 1 }, { c: 2, r: 3 }, { c: 3, r: 3 }, { c: 0, r: 1 }];
  let g = createTowerGame();
  for (let t = 0; t < 20000 && g.status === 'playing'; t += 1) {
    if (t % 20 === 0) g = answerTower(g, true).game;
    if (spend && t % 20 === 1) {
      const slot = slots.find((s) => !towerAt(g, s) && !onLane(s));
      if (g.towers.length < 6 && slot && g.gold >= BUILD_COST) g = buildTower(g, slot).game;
      else {
        const up = [...g.towers].sort((a, b) => a.level - b.level).find((x) => upgradeBlock(g, x.id) === null);
        if (up) g = upgradeTower(g, up.id).game;
      }
    }
    g = tickTower(g).game;
  }
  return g;
}

test('không đặt tháp nào thì quái lọt hết và thua', () => {
  const g = play(false);
  assert.equal(g.status, 'lost');
  assert.ok(g.leaked >= TOWER_HEARTS);
});

test('trả lời đúng đều và đặt, nâng tháp thì thắng cả bốn sóng', () => {
  const g = play(true);
  assert.equal(g.status, 'won', `status=${g.status} wave=${g.wave} hearts=${g.hearts} leaked=${g.leaked} killed=${g.killed} towers=${g.towers.length}`);
  assert.equal(g.wave, WAVES);
  assert.equal(g.killed + g.leaked, Array.from({ length: WAVES }, (_, i) => waveSize(i + 1)).reduce((a, b) => a + b, 0));
});
