import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildRwModule,
  continueRwMock,
  routeRwSecondModule,
  rwPool,
  RW_BLUEPRINT,
  RW_MODULE_LENGTH,
  RW_MODULE_MINUTES,
  RW_TOTAL_QUESTIONS,
  startRwMock,
} from './build';
import { difficultyOf, difficultyScore } from './difficulty';
import { estimateRwScore, totalSatScore } from './scoring';
import type { MockDomain } from './item';

const POOL = rwPool();

/* --------------------------------------------------------------- kho câu */

test('kho gộp đủ bốn nguồn và không có id trùng', () => {
  const ids = POOL.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, 'có id trùng giữa các nguồn');
  for (const prefix of ['repo:', 'vocab:', 'synthesis:', 'evidence:']) {
    assert.ok(ids.some((id) => id.startsWith(prefix)), `thiếu nguồn ${prefix}`);
  }
});

test('mỗi mảng có đủ câu để dựng hai module không trùng', () => {
  /*
    Hai module lấy từ cùng một kho và KHÔNG được trùng câu, nên mỗi mảng phải có
    ít nhất gấp đôi số câu blueprint đòi. Thiếu ở đây là đề thi thử sẽ lặng lẽ
    thiếu câu — kiểu hỏng chỉ lộ ra khi ai đó ngồi đếm.
  */
  for (const [domain, want] of Object.entries(RW_BLUEPRINT) as [MockDomain, number][]) {
    const have = POOL.filter((i) => i.domain === domain).length;
    assert.ok(have >= want * 2, `${domain}: chỉ có ${have} câu, cần ít nhất ${want * 2}`);
  }
});

/* ------------------------------------------------------------ khổ đề thật */

test('module đúng 27 câu, 32 phút — khổ đề số hoá', () => {
  const m = buildRwModule('s1', 1, 'mixed');
  assert.equal(m.items.length, RW_MODULE_LENGTH);
  assert.equal(m.minutes, RW_MODULE_MINUTES);
  assert.equal(RW_TOTAL_QUESTIONS, 54);
});

test('tỉ lệ mảng bám blueprint, không bám hình dạng kho', () => {
  /*
    Kho nghiêng hẳn về ngữ pháp (192/384). Lấy theo kho sẽ ra một đề nửa ngữ
    pháp — làm xong không nói lên được gì về sức thi thật.
  */
  const m = buildRwModule('s2', 1, 'mixed');
  for (const [domain, want] of Object.entries(RW_BLUEPRINT) as [MockDomain, number][]) {
    const got = m.items.filter((i) => i.domain === domain).length;
    assert.equal(got, want, `${domain}: ${got} câu, blueprint đòi ${want}`);
  }
});

test('blueprint cộng lại đúng một module', () => {
  const sum = Object.values(RW_BLUEPRINT).reduce((a, b) => a + b, 0);
  assert.equal(sum, RW_MODULE_LENGTH);
});

test('tất định: cùng hạt giống ra cùng đề, cùng thứ tự', () => {
  const a = buildRwModule('lap-lai', 1, 'mixed');
  const b = buildRwModule('lap-lai', 1, 'mixed');
  assert.deepEqual(
    a.items.map((i) => i.id),
    b.items.map((i) => i.id),
  );
});

test('hạt giống khác thì đề khác', () => {
  const a = buildRwModule('x1', 1, 'mixed').items.map((i) => i.id);
  const b = buildRwModule('x2', 1, 'mixed').items.map((i) => i.id);
  assert.notDeepEqual(a, b);
});

test('không câu nào lặp trong cùng một module', () => {
  const ids = buildRwModule('s3', 1, 'mixed').items.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('đề không đi thành từng khối mảng', () => {
  // Bảy câu ngữ pháp liên tiếp thì tới câu thứ ba đã biết đang bị hỏi gì.
  const domains = buildRwModule('s4', 1, 'mixed').items.map((i) => i.domain);
  const runs = domains.filter((d, k) => k > 0 && d === domains[k - 1]).length;
  assert.ok(runs < 12, `quá nhiều câu cùng mảng đứng liền nhau: ${runs}`);
});

/* --------------------------------------------------------------- thích ứng */

test('ngưỡng chuyển module: từ 60% trở lên thì sang module khó', () => {
  assert.equal(routeRwSecondModule(17, 27), 'harder'); // 63%
  assert.equal(routeRwSecondModule(16, 27), 'easier'); // 59%
  assert.equal(routeRwSecondModule(0, 0), 'easier');
});

test('module 2 KHÔNG lặp lại câu của module 1', () => {
  /*
    Gặp lại một câu vừa làm cách đó nửa tiếng thì câu ấy đo trí nhớ ngắn hạn chứ
    không đo kỹ năng.
  */
  const first = startRwMock('s5');
  const next = continueRwMock('s5', first.module.items, { correct: 20, total: 27 });
  const used = new Set(first.module.items.map((i) => i.id));
  for (const item of next.module.items) {
    assert.ok(!used.has(item.id), `${item.id} lặp lại ở module 2`);
  }
  assert.equal(next.module.items.length, RW_MODULE_LENGTH);
});

test('làm tốt module 1 thì module 2 nghiêng về câu khó, và ngược lại', () => {
  /*
    ĐO TRÊN NHIỀU HẠT GIỐNG, KHÔNG TRÊN MỘT.

    Hai lần hỏng liên tiếp ở đúng chỗ này, đáng ghi lại cả hai:

    · Bản đầu chỉ kiểm `>`. Nó xanh trong khi cơ chế gần như không làm gì —
      module "khó" 15 câu khó, module "dễ" 13. Nguyên nhân: mảng bị cho trọng số
      0,5 nên độ khó gần bằng mảng, mà blueprint đã ghim tỉ lệ mảng.

    · Bản sau đòi chênh lệch ≥5, nhưng con số 5 lấy từ ĐÚNG MỘT lần chạy tay
      (hạt giống `demo` cho 9 vs 0). Hạt `s6` cho 7 vs 3 và test đỏ — không phải
      vì mã hỏng mà vì ngưỡng được bịa theo dữ liệu đã thấy.

    Bốc có trọng số thì mỗi đề lệch một kiểu; kiểm trung bình trên mười hạt giống
    mới nói được về CƠ CHẾ thay vì về một lần bốc may rủi.
  */
  const seeds = Array.from({ length: 10 }, (_, i) => `contrast-${i}`);
  let hardGap = 0;
  let easyGap = 0;

  for (const seed of seeds) {
    const first = startRwMock(seed);
    const hard = continueRwMock(seed, first.module.items, { correct: 24, total: 27 });
    const easy = continueRwMock(seed, first.module.items, { correct: 8, total: 27 });

    assert.equal(hard.module.tier, 'harder');
    assert.equal(easy.module.tier, 'easier');

    const count = (items: typeof hard.module.items, level: 'hard' | 'easy') =>
      items.filter((i) => difficultyOf(i) === level).length;

    hardGap += count(hard.module.items, 'hard') - count(easy.module.items, 'hard');
    easyGap += count(easy.module.items, 'easy') - count(hard.module.items, 'easy');
  }

  const meanHard = hardGap / seeds.length;
  const meanEasy = easyGap / seeds.length;
  assert.ok(meanHard >= 3, `module khó chỉ hơn ${meanHard.toFixed(1)} câu khó, trung bình`);
  assert.ok(meanEasy >= 4, `module dễ chỉ hơn ${meanEasy.toFixed(1)} câu dễ, trung bình`);
});

test('mỗi mảng phải có chênh lệch độ khó bên trong, nếu không thích ứng vô nghĩa', () => {
  /*
    Blueprint ghim tỉ lệ mảng của mỗi module. Nếu trong một mảng mọi câu cùng một
    bậc thì bộ chọn không có gì để chọn, và cơ chế thích ứng chỉ còn là hình thức.
    Đây là luật giữ cho công thức độ khó không trôi về chỗ "độ khó = mảng".
  */
  for (const domain of Object.keys(RW_BLUEPRINT) as MockDomain[]) {
    const levels = new Set(POOL.filter((i) => i.domain === domain).map(difficultyOf));
    assert.ok(levels.size >= 2, `${domain}: mọi câu cùng bậc ${[...levels][0]}`);
  }
});

/* -------------------------------------------------------------- độ khó */

test('độ khó nằm trong [0,1] và ba bậc đều có mặt trong kho', () => {
  const seen = new Set(POOL.map(difficultyOf));
  for (const item of POOL) {
    const s = difficultyScore(item);
    assert.ok(s >= 0 && s <= 1, `${item.id}: điểm khó ${s} ngoài khoảng`);
  }
  for (const level of ['easy', 'medium', 'hard'] as const) {
    assert.ok(seen.has(level), `kho không có câu bậc ${level}`);
  }
});

test('phương án lệch độ dài nhiều thì DỄ hơn — nhiễu tự lộ bằng hình dáng', () => {
  const base = {
    id: 'x',
    domain: 'Craft and Structure' as const,
    skill: 's',
    passage: 'A passage of a certain length used for both sides of this comparison.',
    stem: 'q',
    answerIndex: 0,
    solutionVi: 'v',
  };
  const even = difficultyScore({ ...base, options: ['alpha', 'gamma', 'delta', 'sigma'] });
  const uneven = difficultyScore({
    ...base,
    options: ['alpha', 'gamma', 'delta', 'a much longer option that stands out at a glance'],
  });
  assert.ok(even > uneven, 'bốn phương án dài xấp xỉ nhau phải khó hơn');
});

test('mảng suy luận khó hơn mảng tra luật', () => {
  const base = {
    id: 'x',
    skill: 's',
    passage: 'Same passage for both.',
    stem: 'q',
    options: ['a', 'b', 'c', 'd'],
    answerIndex: 0,
    solutionVi: 'v',
  };
  const rules = difficultyScore({ ...base, domain: 'Standard English Conventions' });
  const inference = difficultyScore({ ...base, domain: 'Information and Ideas' });
  assert.ok(inference > rules);
});

test('bậc khó chỉ phụ thuộc vào chính câu ấy, không phụ thuộc kho', () => {
  /*
    Cắt theo phân vị thì thêm câu mới vào kho là đổi bậc của những câu cũ — một
    đề đã làm hôm qua hôm nay thành đề khác, và hai lần làm không so được với nhau.

    Kiểm bằng cách gọi `difficultyOf` trên một câu ĐỘC LẬP, dựng tại chỗ, không
    nằm trong kho: nếu ngưỡng phụ thuộc kho thì hàm đã phải nhận kho làm tham số.
    (Bản đầu của test này so `difficultyOf(item)` với chính nó — không kiểm gì cả.)
  */
  const lone = {
    id: 'khong-nam-trong-kho',
    domain: 'Information and Ideas' as const,
    skill: 's',
    passage: 'A short passage.',
    stem: 'q',
    options: ['aa', 'bb', 'cc', 'dd'],
    answerIndex: 0,
    solutionVi: 'v',
  };
  assert.equal(difficultyOf(lone), difficultyOf(lone));
  assert.equal(difficultyOf.length, 1, 'hàm chỉ nhận CÂU, không nhận kho');

  // Và ngưỡng là hằng số: một câu ngay dưới ngưỡng luôn là bậc thấp hơn.
  const easyOne = { ...lone, domain: 'Standard English Conventions' as const };
  assert.equal(difficultyOf(easyOne), 'easy');
  assert.equal(difficultyOf(lone), 'hard');
});

/* ----------------------------------------------------------------- điểm */

test('trần điểm phụ thuộc module 2 đã đi hướng nào', () => {
  // Ai bị đẩy sang module dễ thì làm đúng hết cũng không chạm trần — đúng cách
  // đề thích ứng thật hoạt động.
  assert.equal(estimateRwScore(27, 27, 'easier'), 600);
  assert.equal(estimateRwScore(27, 27, 'harder'), 800);
  assert.equal(estimateRwScore(0, 27, 'easier'), 200);
  assert.equal(estimateRwScore(0, 27, 'harder'), 400);
});

test('điểm tổng cộng hai phần, thang 400–1600', () => {
  assert.equal(totalSatScore(800, 800), 1600);
  assert.equal(totalSatScore(200, 200), 400);
});
