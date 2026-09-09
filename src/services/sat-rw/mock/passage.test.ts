import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { splitPassage } from './passage';

test('văn bản đơn giữ nguyên, KHÔNG sinh nhãn', () => {
  const one = 'Digital archives make manuscripts available to anyone with a connection.';
  assert.deepEqual(splitPassage(one), [{ label: null, text: one }]);
});

test('văn bản kép tách làm hai khối, nhãn dịch sang Text N', () => {
  const paired = 'Văn bản 1 Trees cool a city. Văn bản 2 Placement matters more than count.';
  assert.deepEqual(splitPassage(paired), [
    { label: 'Text 1', text: 'Trees cool a city.' },
    { label: 'Text 2', text: 'Placement matters more than count.' },
  ]);
});

test('dấu ngăn đứng ngay đầu chuỗi không tạo khối rỗng', () => {
  /*
    Khối rỗng in ra là một nhãn treo lơ lửng không có văn bản nào dưới nó — mà
    dấu ngăn đứng đầu chuỗi lại là trường hợp THƯỜNG GẶP NHẤT trong kho.
  */
  const blocks = splitPassage('Văn bản 1 A. Văn bản 2 B.');
  assert.equal(blocks.length, 2);
  assert.ok(blocks.every((b) => b.text.length > 0));
});

test('chuỗi rỗng vẫn trả về một khối, không phải mảng rỗng', () => {
  /*
    Mảng rỗng làm màn hình vẽ ra một bài đọc không có chữ nào mà không báo gì.
    Thà hiện đúng cái chuỗi rỗng ấy để nhìn là biết dữ liệu hỏng.
  */
  assert.deepEqual(splitPassage(''), [{ label: null, text: '' }]);
});

/** Kho câu hỏi thật, đọc từ seed. */
function seedQuestions(): { passage?: string }[] {
  const raw = readFileSync(
    new URL('../../../data/seed/sat-rw/index.json', import.meta.url),
    'utf8',
  );
  const parsed = JSON.parse(raw) as { questions?: unknown };
  assert.ok(Array.isArray(parsed.questions), 'seed đổi khuôn: không còn khoá `questions`');
  return parsed.questions as { passage?: string }[];
}

test('mọi câu ghép trong kho tách được thành đúng hai khối có nhãn', () => {
  /*
    Test này chạy trên DỮ LIỆU THẬT chứ không trên chuỗi tự bịa: hàm chỉ có ích
    nếu nó khớp với đúng cách 384 câu trong kho đang lưu văn bản. Một ngày nào đó
    có người sửa dấu ngăn trong seed thì test này đỏ, chứ không phải người học
    phát hiện ra khi đang thi.
  */
  const items = seedQuestions();
  assert.ok(items.length > 0, 'không đọc được kho câu hỏi');

  const paired = items.filter((i) => typeof i.passage === 'string' && /Văn bản \d/.test(i.passage));
  assert.ok(paired.length > 0, 'kho không còn câu ghép nào — dấu ngăn đã đổi?');

  for (const item of paired) {
    const blocks = splitPassage(item.passage!);
    assert.equal(blocks.length, 2, `"${item.passage!.slice(0, 40)}…" không tách được làm hai`);
    assert.deepEqual(
      blocks.map((b) => b.label),
      ['Text 1', 'Text 2'],
    );
    for (const b of blocks) assert.ok(b.text.length > 20, 'khối quá ngắn, có thể cắt nhầm');
  }
});

test('KHÔNG câu ghép nào để lại chữ "Văn bản" trong phần thân', () => {
  /*
    Sót một dấu ngăn nghĩa là hai văn bản vẫn dính nhau ở đâu đó — đúng cái lỗi
    hàm này sinh ra để chữa, chỉ khác là nó lẩn vào giữa đoạn nên khó thấy hơn.
  */
  for (const item of seedQuestions()) {
    if (typeof item.passage !== 'string') continue;
    for (const b of splitPassage(item.passage)) {
      assert.ok(!/Văn bản\s*\d/.test(b.text), `còn sót dấu ngăn: ${b.text.slice(0, 50)}`);
    }
  }
});
