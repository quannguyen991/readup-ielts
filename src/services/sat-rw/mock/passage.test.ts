import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { markUnderline, splitPassage } from './passage';

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

/* ----------------------------------------------------------- gạch chân */

test('không có dấu thì trả về nguyên khối, một mẩu', () => {
  assert.deepEqual(markUnderline('A B C'), [{ text: 'A B C', underlined: false }]);
});

test('cắt làm ba mẩu khi dấu nằm giữa', () => {
  assert.deepEqual(markUnderline('one two three', 'two'), [
    { text: 'one ', underlined: false },
    { text: 'two', underlined: true },
    { text: ' three', underlined: false },
  ]);
});

test('dấu ở đầu hoặc cuối KHÔNG sinh mẩu rỗng', () => {
  /*
    Mẩu rỗng lọt vào là một <Text> rỗng giữa dòng — trên RN Web nó vẫn chiếm chỗ
    và làm chữ giật một nhịp ngay chỗ bắt đầu gạch chân.
  */
  assert.deepEqual(markUnderline('two three', 'two'), [
    { text: 'two', underlined: true },
    { text: ' three', underlined: false },
  ]);
  assert.deepEqual(markUnderline('one two', 'two'), [
    { text: 'one ', underlined: false },
    { text: 'two', underlined: true },
  ]);
});

test('không tìm thấy dấu trong khối này thì trả nguyên khối, KHÔNG ném', () => {
  /*
    Dấu nằm ở Text 1, nên lúc vẽ Text 2 nó chắc chắn không khớp. Đó là chuyện
    bình thường của câu ghép chứ không phải hỏng.
  */
  assert.deepEqual(markUnderline('Text 2 body', 'a claim in text one'), [
    { text: 'Text 2 body', underlined: false },
  ]);
});

test('ghép các mẩu lại luôn ra đúng chuỗi ban đầu', () => {
  for (const [text, mark] of [
    ['one two three', 'two'],
    ['two three', 'two'],
    ['one two', 'two'],
    ['abc', 'xyz'],
  ] as const) {
    assert.equal(
      markUnderline(text, mark)
        .map((r) => r.text)
        .join(''),
      text,
      `mất chữ khi cắt "${text}"`,
    );
  }
});

test('MỌI câu hỏi về "underlined" trong kho đều có dấu, và dấu nằm đúng chỗ', () => {
  /*
    Đây là test giữ cho 17 câu ấy không lặng lẽ mất dấu khi kho được xuất lại từ
    `sat-rw-luyen-tap`. Mất dấu thì đề vẫn chạy, vẫn chấm được — chỉ có người học
    là phải đoán câu nào đang bị hỏi.
  */
  const items = seedQuestions() as { id: string; stem: string; passage: string; underline?: string }[];
  const asking = items.filter((q) => /underlined/i.test(q.stem ?? ''));
  assert.equal(asking.length, 17, 'số câu hỏi về "underlined" đã đổi — xem lại bảng trong script');

  for (const q of asking) {
    assert.ok(q.underline, `${q.id}: đề hỏi "underlined" nhưng không có dấu`);

    const first = q.passage.indexOf(q.underline!);
    assert.ok(first >= 0, `${q.id}: chuỗi gạch chân không có trong đoạn`);
    assert.equal(
      q.passage.indexOf(q.underline!, first + 1),
      -1,
      `${q.id}: chuỗi gạch chân xuất hiện nhiều hơn một lần`,
    );

    /* Đề hỏi "in Text 1" thì dấu phải nằm trong Text 1. */
    if (/Text 1/.test(q.stem)) {
      const boundary = q.passage.search(/Văn bản\s*2/);
      assert.ok(boundary > 0, `${q.id}: đề nhắc Text 1 nhưng đoạn không có hai văn bản`);
      assert.ok(first < boundary, `${q.id}: dấu rơi vào Text 2`);
    }

    /* Đề hỏi "sentence" thì dấu phải là một câu trọn, kết bằng dấu câu. */
    if (/underlined sentence/i.test(q.stem)) {
      assert.match(q.underline!, /[.!?]$/, `${q.id}: dấu không kết thúc bằng dấu câu`);
    }
  }
});

test('KHÔNG câu nào ngoài 17 câu ấy bị đánh dấu thừa', () => {
  /*
    Một câu có gạch chân mà đề không hỏi tới sẽ kéo mắt về đúng chỗ không cần
    nhìn — tệ hơn là không gạch gì.
  */
  const items = seedQuestions() as { id: string; stem: string; underline?: string }[];
  for (const q of items) {
    if (q.underline) assert.match(q.stem, /underlined/i, `${q.id}: đánh dấu thừa`);
  }
});

test('dấu cắt ra khỏi đoạn phải nằm gọn trong ĐÚNG MỘT khối của splitPassage', () => {
  /*
    Nếu chuỗi gạch chân vắt qua ranh giới hai văn bản thì không khối nào chứa
    trọn nó, và màn hình sẽ vẽ ra một đoạn không có gạch chân nào — im lặng.
  */
  const items = seedQuestions() as { stem: string; passage: string; underline?: string; id: string }[];
  for (const q of items) {
    if (!q.underline) continue;
    const hits = splitPassage(q.passage).filter((b) => b.text.includes(q.underline!));
    assert.equal(hits.length, 1, `${q.id}: dấu nằm trong ${hits.length} khối, phải là 1`);
  }
});
