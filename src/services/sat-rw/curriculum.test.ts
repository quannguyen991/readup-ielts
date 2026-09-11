import test from 'node:test';
import assert from 'node:assert/strict';

import { SAT_RW_QUESTIONS, SAT_RW_UNITS } from '@/data/sat-rw-repository';
import {
  SAT_RW_ALL_SETS,
  SAT_RW_CURRICULUM_TOTALS,
  SAT_RW_STAGES,
  getSatRwSet,
  nextSatRwSet,
} from './curriculum';

test('mọi unit trong kho đều có mặt trong lộ trình, không sót bài nào', () => {
  /*
    Sót một unit thì 24 câu của nó không có đường nào đi tới — chúng vẫn nằm
    trong kho, vẫn được đề trộn bốc trúng, nhưng không ai luyện riêng được.
  */
  const inCurriculum = new Set(SAT_RW_STAGES.flatMap((s) => s.units.map((u) => u.number)));
  for (const unit of SAT_RW_UNITS) {
    assert.ok(inCurriculum.has(unit.unit), `unit ${unit.unit} (${unit.title}) không có trong lộ trình`);
  }
  assert.equal(inCurriculum.size, SAT_RW_UNITS.length);
});

test('không unit nào xuất hiện ở hai chặng', () => {
  const seen = new Set<number>();
  for (const stage of SAT_RW_STAGES) {
    for (const unit of stage.units) {
      assert.ok(!seen.has(unit.number), `unit ${unit.number} nằm ở hai chặng`);
      seen.add(unit.number);
    }
  }
});

test('chặng và unit khớp domain — không xếp bài luật vào chặng đọc hiểu', () => {
  for (const stage of SAT_RW_STAGES) {
    for (const unit of stage.units) {
      assert.equal(unit.domain, stage.domain, `unit ${unit.number} lệch domain khỏi chặng`);
    }
  }
});

test('mọi bài học đều có bẫy trung tâm, và nó không rỗng', () => {
  // Thiếu dòng này thì thẻ bài học in ra một khoảng trắng, và người học mất
  // đúng thứ giúp họ biết phải canh cái gì trước khi làm câu đầu tiên.
  for (const stage of SAT_RW_STAGES) {
    for (const unit of stage.units) {
      assert.ok(unit.trap.length > 30, `unit ${unit.number} thiếu bẫy trung tâm`);
    }
  }
});

test('hai lát cắt của một bài phủ TRỌN 24 câu, không chồng nhau', () => {
  /*
    Chồng nhau thì có câu hiện hai lần trong lúc học; hụt thì có câu không bao
    giờ được luyện ở bộ nào. Cả hai đều không lộ ra khi bấm thử vài cái.
  */
  for (const stage of SAT_RW_STAGES) {
    for (const unit of stage.units) {
      const sliced = unit.sets.filter((s) => s.slice !== null);
      assert.equal(sliced.length, 2, `unit ${unit.number} phải có đúng hai bộ cắt lát`);
      const [a, b] = sliced;
      assert.equal(a!.slice!.from, 0);
      assert.equal(a!.slice!.to, b!.slice!.from, 'hai lát không nối liền nhau');
      assert.equal(b!.slice!.to, unit.questionCount, 'lát cuối không chạm hết bài');
    }
  }
});

test('bộ chốt KHÔNG hiện lời giải giữa chừng, hai bộ học thì có', () => {
  for (const set of SAT_RW_ALL_SETS) {
    if (set.kind === 'checkpoint') {
      assert.equal(set.instantSolution, false, `${set.id} là bộ chốt mà vẫn hiện lời giải`);
    }
    if (set.kind === 'learn' || set.kind === 'drill') {
      assert.equal(set.instantSolution, true, `${set.id} là bộ học mà không hiện lời giải`);
    }
  }
});

test('CHỈ ba bài có bộ sinh mới, và đúng ba bài có bộ sinh đứng sau', () => {
  /*
    Hứa "câu mới vô hạn" ở một bài không có bộ sinh là nói dối về thứ người học
    kiểm được trong ba phút — họ bấm hai lần và thấy y hệt.
  */
  const withGenerated = SAT_RW_ALL_SETS.filter((s) => s.kind === 'generated').map((s) => s.unitNumber);
  assert.deepEqual(withGenerated.sort((a, b) => a - b), [11, 15, 16]);
});

test('số câu của mỗi bộ khớp số câu thật của bài', () => {
  for (const stage of SAT_RW_STAGES) {
    for (const unit of stage.units) {
      const real = SAT_RW_QUESTIONS.filter((q) => q.unit === unit.number).length;
      assert.equal(unit.questionCount, real, `unit ${unit.number} đếm sai số câu`);
      const checkpoint = unit.sets.find((s) => s.kind === 'checkpoint');
      assert.equal(checkpoint?.count, real, 'bộ chốt phải phủ cả bài');
    }
  }
});

test('thứ tự bộ đề chạy liên tục từ 0, không trùng không hụt', () => {
  const orders = SAT_RW_ALL_SETS.map((s) => s.order).sort((a, b) => a - b);
  for (let i = 0; i < orders.length; i += 1) {
    assert.equal(orders[i], i, `thứ tự đứt ở vị trí ${i}`);
  }
});

test('mã bộ đề không trùng nhau', () => {
  const ids = SAT_RW_ALL_SETS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(getSatRwSet(id), `${id} không tra ngược được`);
});

test('bài kế tiếp là bộ CHƯA XONG sớm nhất, không phải bộ ngay sau bộ vừa làm', () => {
  /*
    Người học nhảy cóc xuống chặng 4 rồi quay lại vẫn phải được dẫn về chỗ còn
    dở sớm nhất. Dẫn về chỗ họ vừa rời là bỏ quên cả một chặng.
  */
  const first = SAT_RW_ALL_SETS.find((s) => s.order === 0)!;
  const late = SAT_RW_ALL_SETS[SAT_RW_ALL_SETS.length - 1]!;

  assert.equal(nextSatRwSet([])?.id, first.id);
  assert.equal(nextSatRwSet([late.id])?.id, first.id, 'làm bộ cuối trước không được đẩy lộ trình đi');
  assert.equal(nextSatRwSet([first.id])?.order, 1);
});

test('xong hết thì không còn bài kế tiếp, và trả null chứ không nổ', () => {
  assert.equal(nextSatRwSet(SAT_RW_ALL_SETS.map((s) => s.id)), null);
});

test('tổng số khớp với dữ liệu thật', () => {
  assert.equal(SAT_RW_CURRICULUM_TOTALS.units, SAT_RW_UNITS.length);
  assert.equal(SAT_RW_CURRICULUM_TOTALS.questions, SAT_RW_QUESTIONS.length);
  assert.equal(SAT_RW_CURRICULUM_TOTALS.sets, SAT_RW_ALL_SETS.length);
  assert.equal(SAT_RW_CURRICULUM_TOTALS.stages, 4);
});
