import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ALL_SETS,
  ALL_UNITS,
  CURRICULUM_TOTALS,
  MATH_CURRICULUM,
  buildSetItems,
  findNextSet,
  getSet,
  getStageOfSet,
  getUnitOfSet,
  stageIndexOfSet,
} from './curriculum';
import { MATH_SKILL_DOMAIN, type MathSkill } from '@/lib/math/types';
import { MOCK_MODULE_LENGTH, MOCK_MODULE_MINUTES } from './mock';
import { SAT_MATH_COURSE_ASSESSMENTS } from './course';

/**
 * Lộ trình là thứ người học đi theo, nên hỏng ở đây không báo lỗi mà chỉ âm
 * thầm dẫn sai đường: một kỹ năng bị bỏ sót thì không bao giờ được luyện, một
 * bộ đề trùng id thì tiến độ của hai bài dính vào nhau.
 */

test('mỗi kỹ năng có đúng một bài học, không sót không lặp', () => {
  const skills = ALL_UNITS.filter((u) => u.skills.length === 1).map((u) => u.skills[0] as MathSkill);
  assert.equal(new Set(skills).size, 19, 'Có kỹ năng bị lặp hoặc bị bỏ sót.');
  assert.deepEqual(
    skills.slice().sort(),
    (Object.keys(MATH_SKILL_DOMAIN) as MathSkill[]).sort(),
    'Danh sách bài học không khớp taxonomy 19 kỹ năng.',
  );
});

test('bài học nằm đúng chặng của domain nó', () => {
  for (const stage of MATH_CURRICULUM) {
    if (!stage.domain) continue;
    for (const unit of stage.units) {
      assert.equal(unit.domain, stage.domain, `Bài "${unit.title}" nằm nhầm chặng.`);
      for (const skill of unit.skills) {
        assert.equal(
          MATH_SKILL_DOMAIN[skill],
          stage.domain,
          `Kỹ năng ${skill} không thuộc domain của chặng.`,
        );
      }
    }
  }
});

test('id bộ đề không trùng nhau', () => {
  const ids = ALL_SETS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'Có id trùng — tiến độ hai bài sẽ dính vào nhau.');
});

test('assessment 13-unit mở qua route cũ mà không nhập vào thứ tự/ID bộ luyện cũ', () => {
  const assessment = SAT_MATH_COURSE_ASSESSMENTS[0]!;
  assert.equal(getSet(assessment.id)?.id, assessment.id);
  assert.equal(getUnitOfSet(assessment.id)?.id, `unit-${assessment.id}`);
  assert.equal(getStageOfSet(assessment.id)?.domain, assessment.domain);
  assert.ok(stageIndexOfSet(assessment.id) >= 0);
  assert.equal(buildSetItems(assessment, 0).length, assessment.count);
  assert.equal(ALL_SETS.some((set) => set.id === assessment.id), false);
  assert.equal(ALL_SETS.length, CURRICULUM_TOTALS.sets);
});

test('thứ tự trong lộ trình liên tục và không trùng', () => {
  const orders = ALL_SETS.map((s) => s.order).sort((a, b) => a - b);
  for (let i = 0; i < orders.length; i += 1) {
    assert.equal(orders[i], i, `Thứ tự đứt quãng ở vị trí ${i}.`);
  }
});

test('mỗi bài học đi đủ bảy bước, và mỗi bước có lý do riêng', () => {
  /*
    Đây là ràng buộc THIẾT KẾ chứ không phải chính tả: bảy bộ mà cùng một nhịp
    thì chúng là bảy bản sao, và cả lộ trình mất ý nghĩa.

    Vòng học:  học dạng → luyện → luyện dài hơn → ép tốc độ → CHỨNG MINH ở nhịp
    đề thật → đẩy qua nhịp đó một bậc → quay lại sau vài ngày.

    Hai bước cuối là hai câu hỏi khác nhau. "Thử thách" hỏi: bị dồn thì bạn hỏng
    kiểu gì. "Ôn lại" hỏi: mấy hôm sau bạn còn nhớ không. Không bước nào trả lời
    thay được bước kia.
  */
  const skillUnits = ALL_UNITS.filter((u) => u.skills.length === 1);
  const pace = (s: { minutes: number; count: number }) => s.minutes / s.count;

  for (const unit of skillUnits) {
    assert.deepEqual(
      unit.sets.map((s) => s.kind),
      ['warmup', 'practice', 'practice', 'speed', 'checkpoint', 'speed', 'practice'],
      `Bài "${unit.title}" không đi đủ bảy bước đúng thứ tự.`,
    );

    const [warm, basic, extended, speed, check, challenge, retention] = unit.sets as [
      typeof unit.sets[0], typeof unit.sets[0], typeof unit.sets[0], typeof unit.sets[0],
      typeof unit.sets[0], typeof unit.sets[0], typeof unit.sets[0],
    ];

    assert.ok(pace(warm) > pace(basic), 'Làm quen phải rộng thời gian hơn luyện cơ bản.');
    assert.ok(pace(basic) > pace(extended), 'Luyện mở rộng phải siết hơn luyện cơ bản.');
    assert.ok(
      pace(speed) < pace(check),
      'Bộ tốc độ phải NHANH HƠN nhịp đề thật của bài kiểm tra — đó là toàn bộ lý do nó tồn tại.',
    );
    assert.ok(pace(check) <= pace(extended), 'Bài kiểm tra không được thong thả hơn phần luyện.');
    assert.ok(extended.count >= basic.count, 'Luyện mở rộng phải nhiều câu hơn luyện cơ bản.');

    assert.ok(
      pace(challenge) < pace(speed),
      'Thử thách phải là bộ NHANH NHẤT của bài học, nếu không nó chỉ là một bộ tốc độ thứ hai.',
    );
    // KHÔNG cắt bớt số câu để tạo khác biệt: mọi bộ đều tối thiểu 20 câu (xem
    // test bên dưới). Thứ làm nên bộ thử thách là NHỊP, không phải độ dài.
    assert.ok(
      pace(challenge) <= 1,
      'Thử thách phải từ một phút một câu trở xuống — đó là điều làm nó khác bài kiểm tra.',
    );
    assert.ok(
      Math.abs(pace(retention) - pace(check)) < 0.01,
      'Ôn lại phải ở ĐÚNG nhịp đề thật — nó đo trí nhớ, không đo tốc độ.',
    );
  }
});

test('bảy bộ của một bài học có id và tiêu đề khác nhau', () => {
  // Hai bộ trùng tiêu đề thì trên thẻ chúng trông y hệt nhau, và người học
  // không biết mình đang làm bộ nào.
  for (const unit of ALL_UNITS.filter((u) => u.skills.length === 1)) {
    const ids = new Set(unit.sets.map((s) => s.id));
    const titles = new Set(unit.sets.map((s) => s.title));
    assert.equal(ids.size, unit.sets.length, `Bài "${unit.title}" có id bộ đề trùng.`);
    assert.equal(titles.size, unit.sets.length, `Bài "${unit.title}" có tiêu đề bộ đề trùng.`);
  }
});

test('mỗi bài học nói rõ cái bẫy của kỹ năng đó', () => {
  for (const unit of ALL_UNITS) {
    assert.ok(unit.trap.trim().length > 30, `Bài "${unit.title}" chưa nói được bẫy nằm ở đâu.`);
    assert.ok(unit.englishName.trim().length > 0, 'Thiếu tên tiếng Anh để tra tài liệu.');
  }
});

test('đề tổng hợp đúng khổ một module của đề thật', () => {
  const exams = ALL_SETS.filter((s) => s.kind === 'exam');
  assert.ok(exams.length >= 8, `Mới có ${exams.length} đề tổng hợp.`);
  for (const exam of exams) {
    assert.equal(exam.count, MOCK_MODULE_LENGTH);
    assert.equal(exam.minutes, MOCK_MODULE_MINUTES);
    assert.equal(exam.skills.length, 19, 'Đề tổng hợp phải trộn cả 19 kỹ năng.');
  }
});

test('MỌI bộ đề đều tối thiểu 20 câu', () => {
  // Dưới 20 câu thì tỉ lệ đúng nhảy quá mạnh mỗi lần sai một câu, và ngưỡng
  // 70% của bài kiểm tra mất hết ý nghĩa thống kê.
  for (const set of ALL_SETS) {
    assert.ok(set.count >= 20, `Bộ "${set.id}" mới có ${set.count} câu.`);
  }
});

test('tổng số bộ đề và số câu đủ lớn để không lặp bài sớm', () => {
  assert.ok(CURRICULUM_TOTALS.sets >= 110, `Mới có ${CURRICULUM_TOTALS.sets} bộ đề.`);
  assert.ok(CURRICULUM_TOTALS.questions >= 2400, `Mới có ${CURRICULUM_TOTALS.questions} câu.`);
  assert.equal(CURRICULUM_TOTALS.units, ALL_UNITS.length);
  assert.equal(CURRICULUM_TOTALS.stages, MATH_CURRICULUM.length);
});

// ------------------------------------------------------------- sinh đề

test('bộ đề sinh đúng số câu và đúng kỹ năng đã khai báo', () => {
  for (const set of ALL_SETS) {
    const items = buildSetItems(set, 0);
    assert.equal(items.length, set.count, `Bộ "${set.id}" sinh sai số câu.`);
    for (const item of items) {
      assert.ok(
        set.skills.includes(item.skill),
        `Bộ "${set.id}" sinh ra câu thuộc kỹ năng ${item.skill} không nằm trong khai báo.`,
      );
    }
  }
});

test('làm lại lượt hai ra đề khác, không phải đề cũ', () => {
  // Nếu hạt chỉ là id bộ thì làm lại chỉ đang kiểm tra trí nhớ.
  const set = ALL_SETS.find((s) => s.kind === 'practice');
  assert.ok(set);
  const first = buildSetItems(set, 0).map((i) => i.id);
  const second = buildSetItems(set, 1).map((i) => i.id);
  assert.equal(first.filter((id) => second.includes(id)).length, 0, 'Lượt hai lặp lại câu cũ.');
});

test('cùng lượt thì đề không đổi giữa hai lần mở', () => {
  const set = ALL_SETS[0]!;
  assert.deepEqual(buildSetItems(set, 2), buildSetItems(set, 2));
});

test('bộ ôn trộn thật sự trộn nhiều kỹ năng', () => {
  const mixed = ALL_SETS.filter((s) => s.kind === 'mixed');
  assert.ok(mixed.length >= 8, `Mới có ${mixed.length} bộ ôn trộn.`);
  for (const domain of ['algebra', 'advanced_math', 'problem_solving_data', 'geometry_trig']) {
    assert.ok(
      mixed.filter((s) => s.domain === domain).length >= 2,
      `Mảng ${domain} chưa có đủ hai bộ ôn trộn.`,
    );
  }
  for (const set of mixed) {
    const skills = new Set(buildSetItems(set, 0).map((i) => i.skill));
    assert.ok(skills.size >= 3, `Bộ "${set.id}" chỉ ra ${skills.size} kỹ năng khác nhau.`);
  }
});

// ------------------------------------------------------------ tra cứu

test('tra được bộ đề, bài học và chặng từ id', () => {
  const set = ALL_SETS[10]!;
  assert.equal(getSet(set.id)?.id, set.id);
  assert.ok(getUnitOfSet(set.id), 'Không tìm được bài học chứa bộ đề.');
  assert.ok(getStageOfSet(set.id), 'Không tìm được chặng chứa bộ đề.');
  assert.equal(getSet('khong-co-that'), undefined);
});

test('bài kế tiếp là bộ đầu tiên chưa làm, theo đúng thứ tự lộ trình', () => {
  assert.equal(findNextSet(new Set())?.order, 0);

  const ordered = [...ALL_SETS].sort((a, b) => a.order - b.order);
  const done = new Set(ordered.slice(0, 5).map((s) => s.id));
  assert.equal(findNextSet(done)?.id, ordered[5]?.id);

  // Bỏ dở giữa chừng: bài kế tiếp phải là chỗ trống ĐẦU TIÊN, không phải chỗ
  // trống cuối cùng — người quay lại sau một tuần cần được đưa về đúng chỗ hụt.
  const skipped = new Set(ordered.map((s) => s.id));
  skipped.delete(ordered[3]!.id);
  assert.equal(findNextSet(skipped)?.id, ordered[3]?.id);
});

test('làm hết lộ trình thì không còn bài kế tiếp', () => {
  assert.equal(findNextSet(new Set(ALL_SETS.map((s) => s.id))), null);
});
