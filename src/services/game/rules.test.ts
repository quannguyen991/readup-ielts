import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ACHIEVEMENTS,
  CRIT_EVERY,
  dailyQuests,
  EMPTY_DAY,
  EMPTY_LIFE,
  enemyAt,
  ENEMIES,
  FEVER_AT,
  damageFor,
  isBoss,
  levelForXp,
  levelProgress,
  lootFor,
  MAX_HEARTS,
  mergeGame,
  newAchievements,
  resolveAnswer,
  resolveBatch,
  xpForLevel,
  type BattleState,
  type GamePayload,
} from './rules';

const fresh = (): BattleState => ({ xp: 0, combo: 0, hearts: MAX_HEARTS, enemyIndex: 0, enemyHp: enemyAt(0).hp, shield: false, doubleLeft: 0 });

test('cấp độ: 0 XP là cấp 1, 100 XP cấp 2, 300 XP cấp 3', () => {
  assert.equal(levelForXp(0), 1);
  assert.equal(levelForXp(99), 1);
  assert.equal(levelForXp(100), 2);
  assert.equal(levelForXp(300), 3);
  assert.equal(xpForLevel(4), 600);
  assert.deepEqual(levelProgress(150), { level: 2, into: 50, need: 200 });
});

test('câu đúng: cộng XP, combo tăng, chí mạng ở câu thứ 5 liên tiếp', () => {
  let s = fresh();
  const gains: number[] = [];
  const crits: boolean[] = [];
  for (let k = 0; k < CRIT_EVERY; k += 1) {
    const o = resolveAnswer(s, true);
    gains.push(o.xpGained - (o.defeated?.bonusXp ?? 0));
    crits.push(o.crit);
    s = o.state;
  }
  assert.equal(s.combo, 5);
  assert.deepEqual(crits, [false, false, false, false, true]);
  assert.equal(gains[0], 10);
  assert.ok(gains[4]! > gains[3]! * 1.5, 'chí mạng gấp đôi');
});

test('câu sai: mất combo và một tim; khiên chặn được một lần', () => {
  let s = { ...fresh(), combo: 4 };
  let o = resolveAnswer({ ...s, shield: true }, false);
  assert.ok(o.blocked);
  assert.equal(o.state.combo, 4);
  assert.equal(o.state.hearts, MAX_HEARTS);
  o = resolveAnswer(s, false);
  assert.equal(o.state.combo, 0);
  assert.equal(o.state.hearts, MAX_HEARTS - 1);
  // Hết tim: bị đánh lui, tim đầy lại, quái hồi máu — không kẹt.
  s = { ...fresh(), hearts: 1, enemyHp: 5 };
  o = resolveAnswer(s, false);
  assert.ok(o.knockedOut);
  assert.equal(o.state.hearts, MAX_HEARTS);
  assert.equal(o.state.enemyHp, enemyAt(0).hp);
});

test('hạ quái: thưởng XP, rơi đồ con chẵn, quái sau khoẻ hơn', () => {
  let s = fresh();
  let defeatedAt = -1;
  for (let k = 0; k < 20 && defeatedAt < 0; k += 1) {
    const o = resolveAnswer(s, true);
    if (o.defeated) {
      defeatedAt = k;
      assert.equal(o.defeated.name, ENEMIES[0]!.name);
      assert.deepEqual(o.defeated.loot, ['potion']);
      assert.equal(o.defeated.boss, false);
      assert.equal(o.state.enemyIndex, 1);
      assert.equal(o.state.enemyHp, enemyAt(1).hp);
    }
    s = o.state;
  }
  assert.ok(defeatedAt >= 1 && defeatedAt <= 4, `hạ quái đầu sau ${defeatedAt + 1} câu`);
  assert.deepEqual(lootFor(1), []);
  assert.ok(enemyAt(ENEMIES.length).hp > enemyAt(0).hp, 'vòng hai khoẻ hơn');
});

test('nhân đôi XP chỉ áp cho đúng số câu đã mua', () => {
  let s = { ...fresh(), doubleLeft: 2 };
  const a = resolveAnswer(s, true);
  s = a.state;
  const b = resolveAnswer(s, true);
  s = b.state;
  const c = resolveAnswer(s, true);
  const earned = (o: typeof a) => o.xpGained - (o.defeated?.bonusXp ?? 0);
  assert.equal(earned(a), 20);
  assert.equal(c.state.doubleLeft, 0);
  assert.ok(earned(c) < earned(b), 'hết lượt nhân đôi thì XP mỗi câu về mức thường');
});

test('nhiệm vụ ngày: ba nhiệm vụ khác thước đo, cố định theo ngày', () => {
  const a = dailyQuests('2026-09-24');
  assert.equal(a.length, 3);
  assert.equal(new Set(a.map((q) => q.metric)).size, 3);
  assert.deepEqual(a, dailyQuests('2026-09-24'));
  const days = ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28'];
  assert.ok(days.some((d) => JSON.stringify(dailyQuests(d)) !== JSON.stringify(a)), 'ngày khác bộ khác');
});

test('chấm cả bài một lượt: XP theo câu đúng, không combo, không mất tim, hạ được nhiều quái', () => {
  const s = fresh();
  const o = resolveBatch(s, 12);
  assert.equal(o.damage, 240);
  assert.equal(o.state.combo, 0);
  assert.equal(o.state.hearts, MAX_HEARTS);
  // 240 máu: con 1 (60) + con 2 (80) + con 3 (100) = 240 → hạ đúng ba con.
  assert.equal(o.defeated.length, 3);
  assert.equal(o.state.enemyIndex, 3);
  assert.equal(o.state.enemyHp, enemyAt(3).hp);
  assert.equal(o.xpGained, 120 + 30 + 40 + 50);
  assert.equal(resolveBatch(s, 0).xpGained, 0);
  assert.equal(resolveBatch({ ...s, doubleLeft: 3, enemyHp: 1000 }, 5).xpGained, 80);
});

test('gộp hai máy: giữ trận của máy nhiều XP, huy hiệu và kỷ lục lấy hợp', () => {
  const day = '2026-09-24';
  const a: GamePayload = {
    ...fresh(),
    xp: 500,
    enemyIndex: 4,
    items: { potion: 1, shield: 0, double: 0, hint: 2 },
    life: { ...EMPTY_LIFE, correct: 50, bestCombo: 12 },
    day,
    today: { ...EMPTY_DAY, correct: 10 },
    claimed: ['correct-20'],
    achievements: { 'first-blood': '2026-09-01' },
    bonusStars: 40,
    perkDay: day,
    perkHints: 0,
    perkShieldUsed: false,
  };
  const b: GamePayload = {
    ...fresh(),
    xp: 300,
    enemyIndex: 2,
    items: { potion: 5, shield: 5, double: 5, hint: 5 },
    life: { ...EMPTY_LIFE, correct: 60, bestCombo: 8 },
    day,
    today: { ...EMPTY_DAY, correct: 14, bestCombo: 6 },
    claimed: ['combo-8'],
    achievements: { 'first-blood': '2026-08-30', 'combo-10': '2026-09-02' },
    bonusStars: 55,
    perkDay: day,
    perkHints: 2,
    perkShieldUsed: true,
  };
  const m = mergeGame(a, b)!;
  assert.equal(m.xp, 500);
  assert.equal(m.enemyIndex, 4);
  assert.deepEqual(m.items, a.items);
  assert.equal(m.life.correct, 60);
  assert.equal(m.life.bestCombo, 12);
  assert.equal(m.today.correct, 14);
  assert.deepEqual([...m.claimed].sort(), ['combo-8', 'correct-20']);
  assert.equal(m.achievements['first-blood'], '2026-08-30');
  assert.equal(m.bonusStars, 55, 'sao thưởng chỉ tăng: lấy phần lớn');
  assert.ok(m.achievements['combo-10']);
  assert.equal(mergeGame(null, b), b);
});

test('huy hiệu: chỉ trao cái mới đạt, không trao lại', () => {
  const life = { correct: 120, answers: 150, bestCombo: 11, defeated: 5, xp: 1200, knockouts: 0 };
  const got = newAchievements(life, {}).map((a) => a.id);
  assert.ok(got.includes('hundred') && got.includes('combo-10') && got.includes('hunter-5') && got.includes('level-5'));
  assert.ok(!got.includes('thousand'));
  assert.equal(newAchievements(life, Object.fromEntries(got.map((id) => [id, 'x']))).length, 0);
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
});

test('boss: con cuối mỗi vòng, máu thêm 25%, hạ được thưởng trọn máu và rơi hai món', () => {
  assert.equal(isBoss(6), true);
  assert.equal(isBoss(13), true);
  assert.equal(isBoss(5), false);
  const boss = enemyAt(6);
  assert.equal(boss.boss, true);
  assert.equal(boss.hp, Math.round(ENEMIES[6]!.baseHp * 1.25));
  assert.deepEqual(lootFor(6), ['shield', 'double']);
  const o = resolveAnswer({ ...fresh(), enemyIndex: 6, enemyHp: 1 }, true);
  assert.ok(o.defeated?.boss);
  assert.equal(o.defeated?.bonusXp, boss.hp);
  assert.deepEqual(o.defeated?.loot, ['shield', 'double']);
  assert.equal(o.state.enemyIndex, 7);
  assert.equal(enemyAt(7).boss, false);
});

test('bùng cháy: từ combo 10 mỗi nhát mạnh gấp rưỡi', () => {
  assert.equal(damageFor(FEVER_AT - 1, false), 20 + 3 * (FEVER_AT - 1));
  assert.equal(damageFor(FEVER_AT, true), Math.round((20 + 3 * FEVER_AT) * 2 * 1.5));
  assert.equal(damageFor(11, false), Math.round((20 + 33) * 1.5));
});

test('Rồng Con: nhát chém mạnh thêm 20%', () => {
  const base = resolveAnswer({ ...fresh(), enemyHp: 1000 }, true);
  const boosted = resolveAnswer({ ...fresh(), enemyHp: 1000 }, true, 1.2);
  assert.equal(boosted.damage, Math.round(base.damage * 1.2));
  assert.equal(resolveBatch({ ...fresh(), enemyHp: 1000 }, 5, 1.2).damage, 120);
});
