import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Canh cách Thành Phố Tri Thức nối vào việc học — kiểm bằng mã nguồn, vì các
 * store dùng react-native không nạp được trong test Node.
 */
const root = path.resolve(__dirname, '../../..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

test('học trên điện thoại vẫn cộng vật liệu: đường cộng không đi qua cửa "chỉ máy tính"', () => {
  for (const f of ['src/store/useGameStore.ts', 'src/store/useCityStore.ts', 'src/services/city/economy.ts', 'src/services/city/useStreakGlass.ts']) {
    assert.ok(!read(f).includes('useCityAvailable'), `${f} không được phụ thuộc useCityAvailable`);
  }
  const game = read('src/store/useGameStore.ts');
  // Cộng vật liệu đứng TRƯỚC nhánh "tắt game".
  const answerAt = game.indexOf('answer: (correct, source, opts)');
  const earnAt = game.indexOf("earn({ type: 'answer'", answerAt);
  const disabledAt = game.indexOf('if (!s.enabled)', answerAt);
  assert.ok(answerAt > 0 && earnAt > answerAt && earnAt < disabledAt, 'earn() phải chạy cả khi tắt game');
});

test('Reading: vật liệu chỉ khi NỘP (awardBatch có mã bài), không gắn thanh trận đấu', () => {
  const src = read('app/read/[id].tsx');
  assert.ok(src.includes("awardBatch(correct, attempts.length, 'read', `read:${article.id}`)"));
  assert.ok(!/\.answer\(/.test(src), 'màn đọc không chấm từng câu cho game');
  assert.ok(!src.includes('BattleStrip') && !src.includes('battle'), 'Reading không có thanh trận đấu');
});

test('Writing: không gắn thanh trận đấu; chấm xong ra thép có mã bài', () => {
  const src = read('app/write/result/[submissionId].tsx');
  assert.ok(src.includes("earn({ type: 'writing_graded', id: submission.id })"));
  assert.ok(!src.includes('BattleStrip'));
});

test('SAT Verbal tắt lời giải tức thì: chỉ chấm lúc nộp (giữ nguyên hành vi cũ)', () => {
  const src = read('src/components/sat-rw/UnitRunner.tsx');
  assert.ok(src.includes("if (instantSolution) useGameStore.getState().answer("));
  assert.ok(src.includes("if (!instantSolution) useGameStore.getState().awardBatch("));
});

test('màn từ vựng và luyện nghe gửi khoá câu hỏi (chỉ thưởng lần thử đầu)', () => {
  for (const f of [
    'app/vocabulary/topic/[slug]/learn.tsx',
    'app/vocabulary/topic/[slug]/quiz.tsx',
    'app/vocabulary/topic/[slug]/cloze.tsx',
    'app/vocabulary/topic/[slug]/dictation.tsx',
    'app/vocabulary/topic/[slug]/game.tsx',
    'app/vocabulary/topic/[slug]/speak.tsx',
    'app/vocabulary/sat-quiz/[slug].tsx',
    'src/components/sentence/ListeningQuiz.tsx',
    'src/components/game/useSentenceStrike.ts',
  ]) {
    const src = read(f);
    const calls = src.split('\n').filter((line) => line.includes('.answer('));
    assert.ok(calls.length > 0, f);
    for (const c of calls) assert.ok(/key/.test(c), `${f}: ${c.trim()} thiếu khoá câu hỏi`);
  }
});

test('lật thẻ tự chấm không gọi answer() (0 vật liệu)', () => {
  const src = read('src/components/vocab/study/Flashcards.tsx');
  assert.ok(!src.includes('.answer('), 'thẻ lật tự chấm không được chấm cho game / vật liệu');
});

test('không có đường mua vật liệu bằng sao hay tiền', () => {
  const store = read('src/store/useCityStore.ts');
  assert.ok(!/spendStars|buy\s*:|price|checkout/i.test(store), 'store thành phố không có hành động mua');
  const economy = read('src/services/city/economy.ts');
  assert.ok(!/\bstars?\b|payment|price/i.test(economy), 'kinh tế không có nguồn sao / tiền');
});

test('mục điều hướng Thành phố chỉ hiện trên máy tính', async () => {
  const { NAV_GROUPS, visibleGroups } = await import('@/navigation/nav-items');
  const has = (desktop: boolean) =>
    visibleGroups(NAV_GROUPS, desktop).some((g) => g.items.some((i) => i.key === 'quest-city' || (i.children ?? []).some((c) => c.key === 'quest-city')));
  assert.equal(has(true), true);
  assert.equal(has(false), false);
});
