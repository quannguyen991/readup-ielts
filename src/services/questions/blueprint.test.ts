import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BLOCK_RUBRIC,
  QUESTIONS_PER_PASSAGE,
  blueprintFor,
  totalOf,
  typesOf,
} from './blueprint';
import { AVAILABLE_IELTS_TYPES } from './types';

/**
 * Canh bản thiết kế đề.
 *
 * Ràng buộc ở đây là ràng buộc VỀ ĐỀ THI, không phải về mã: một passage phải đủ
 * 13 câu, phải đi thành khối chứ không trộn, và cùng một đề thì lần nào mở cũng
 * ra cùng cấu trúc — nếu không thì "làm lại đề cũ" không còn là làm lại.
 */

const POSITIONS = [1, 2, 3] as const;

test('mỗi passage đủ 13 câu, đúng khổ đề 40 câu', () => {
  for (const pos of POSITIONS) {
    for (let i = 0; i < 30; i += 1) {
      const bp = blueprintFor(pos, `bai-${i}`);
      assert.equal(totalOf(bp), QUESTIONS_PER_PASSAGE, `vị trí ${pos}, hạt ${i}`);
    }
  }
});

test('cùng một hạt thì luôn ra cùng bố cục', () => {
  for (const pos of POSITIONS) {
    const first = blueprintFor(pos, 'bai-cu-the');
    for (let i = 0; i < 8; i += 1) {
      assert.deepEqual(blueprintFor(pos, 'bai-cu-the'), first);
    }
  }
});

/*
  Đây là lý do cả tệp blueprint tồn tại: đề thật đi thành KHỐI. Một dạng xuất
  hiện hai lần rời nhau trong cùng một passage nghĩa là đã trộn lẫn trở lại.
*/
test('trong một passage, mỗi dạng chỉ xuất hiện ĐÚNG MỘT khối', () => {
  for (const pos of POSITIONS) {
    for (let i = 0; i < 30; i += 1) {
      const types = typesOf(blueprintFor(pos, `bai-${i}`));
      assert.equal(new Set(types).size, types.length, `vị trí ${pos} có dạng lặp: ${types.join(', ')}`);
    }
  }
});

test('mỗi passage có từ hai tới ba khối', () => {
  for (const pos of POSITIONS) {
    for (let i = 0; i < 20; i += 1) {
      const n = blueprintFor(pos, `bai-${i}`).blocks.length;
      assert.ok(n >= 2 && n <= 3, `vị trí ${pos} có ${n} khối`);
    }
  }
});

test('không khối nào quá ngắn để thành một khối', () => {
  for (const pos of POSITIONS) {
    for (let i = 0; i < 20; i += 1) {
      for (const b of blueprintFor(pos, `bai-${i}`).blocks) {
        assert.ok(b.count >= 3, `khối ${b.type} chỉ có ${b.count} câu`);
      }
    }
  }
});

test('chỉ dùng dạng câu mà app thật sự sinh được', () => {
  const available = new Set(AVAILABLE_IELTS_TYPES);
  for (const pos of POSITIONS) {
    for (let i = 0; i < 20; i += 1) {
      for (const t of typesOf(blueprintFor(pos, `bai-${i}`))) {
        assert.ok(available.has(t), `bố cục dùng dạng ${t} mà bộ sinh chưa có`);
      }
    }
  }
});

/*
  Passage 3 là passage lập luận: đề thật dồn trắc nghiệm và quan điểm tác giả vào
  đây. Nếu ba vị trí ra cùng một rổ dạng câu thì đường dốc độ khó của đề biến mất.
*/
test('ba vị trí không dùng cùng một rổ dạng câu', () => {
  const bag = (pos: 1 | 2 | 3) =>
    new Set(Array.from({ length: 20 }, (_, i) => typesOf(blueprintFor(pos, `bai-${i}`))).flat());
  const p1 = bag(1);
  const p3 = bag(3);
  assert.notDeepEqual([...p1].sort(), [...p3].sort());
  // Passage 3 phải có quan điểm tác giả; passage 1 thì không.
  assert.ok(p3.has('yes_no_not_given'));
  assert.ok(!p1.has('yes_no_not_given'));
});

test('mọi dạng IELTS đều có lời dẫn, và lời dẫn không rỗng', () => {
  for (const t of AVAILABLE_IELTS_TYPES) {
    assert.ok(BLOCK_RUBRIC[t].length > 20, `dạng ${t} thiếu lời dẫn`);
  }
});

/*
  Lời dẫn TFNG phải nêu đủ ba nhãn. Rất nhiều người mất điểm dạng này chỉ vì
  không phân biệt được NOT GIVEN với FALSE, và chỗ phân biệt nằm ngay trong lời
  dẫn — cắt bớt cho gọn là cắt mất phần đang được kiểm tra.
*/
test('lời dẫn TFNG và YNNG nêu đủ ba lựa chọn', () => {
  for (const label of ['TRUE', 'FALSE', 'NOT GIVEN']) {
    assert.ok(BLOCK_RUBRIC.true_false_not_given.includes(label));
  }
  for (const label of ['YES', 'NO', 'NOT GIVEN']) {
    assert.ok(BLOCK_RUBRIC.yes_no_not_given.includes(label));
  }
});
