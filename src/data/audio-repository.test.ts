import assert from 'node:assert/strict';
import test from 'node:test';

import { estimateSentences, pickTranscript } from './audio-repository';

const chunk = {
  'voa-1': { paragraphs: ['Alpha beta.', 'Gamma delta.'], glossary: [{ term: 'a', definition: 'b' }] },
  'voa-hong': { paragraphs: [], glossary: [] },
};

test('pickTranscript: tra được lời đọc theo id', () => {
  const t = pickTranscript(chunk as never, 'voa-1');
  assert.deepEqual(t?.paragraphs, ['Alpha beta.', 'Gamma delta.']);
});

test('pickTranscript: id không có thì trả null, không throw', () => {
  assert.equal(pickTranscript(chunk as never, 'voa-999'), null);
});

test('pickTranscript: lời đọc rỗng cũng coi là không dùng được', () => {
  // Một bài không có lời thì màn luyện không làm gì được với nó. Trả về bản
  // ghi rỗng sẽ đẩy lỗi xuống tận chỗ hiển thị, nơi khó lần ra nguyên nhân.
  assert.equal(pickTranscript(chunk as never, 'voa-hong'), null);
});

test('pickTranscript: chunk null thì trả null', () => {
  assert.equal(pickTranscript(null, 'voa-1'), null);
});

test('pickTranscript: thiếu glossary thì bù mảng rỗng chứ không undefined', () => {
  const t = pickTranscript({ x: { paragraphs: ['A b c.'] } } as never, 'x');
  assert.deepEqual(t?.glossary, []);
});

// ------------------------------------------------------------ mốc ước lượng

test('estimateSentences: tách được câu và gắn đúng số đoạn', () => {
  const s = estimateSentences(['One two. Three four.', 'Five six.'], 60);
  assert.equal(s.length, 3);
  assert.deepEqual(
    s.map((x) => x.paragraph),
    [0, 0, 1],
  );
});

test('estimateSentences: câu đầu bắt đầu ở 0 và câu cuối kết thúc ở hết bài', () => {
  const s = estimateSentences(['One two. Three four.'], 60);
  assert.equal(s[0]?.start, 0);
  assert.equal(s.at(-1)?.end, 60);
});

test('estimateSentences: mốc tăng dần, không có câu nào lùi lại', () => {
  const s = estimateSentences(['A b c d. E f. G h i j k l.'], 120);
  for (let i = 1; i < s.length; i += 1) {
    assert.ok(s[i]!.start >= s[i - 1]!.start, `câu ${i} lùi về trước câu ${i - 1}`);
  }
});

test('estimateSentences: câu dài chiếm khoảng thời gian dài hơn câu ngắn', () => {
  // Đây là toàn bộ giả định của phép chia — nếu nó không đúng thì mốc ước lượng
  // vô nghĩa. Kiểm bằng hai câu chênh nhau hẳn về số từ.
  const s = estimateSentences(['A. B c d e f g h i j.'], 100);
  const ngan = s[0]!.end - s[0]!.start;
  const dai = s[1]!.end - s[1]!.start;
  assert.ok(dai > ngan * 3, `ngắn ${ngan}, dài ${dai}`);
});

test('estimateSentences: chưa biết thời lượng thì mọi mốc bằng 0, không chia cho 0', () => {
  // Lúc audio chưa nạp xong metadata thì duration là 0 hoặc NaN. Phải ra 0 chứ
  // không được ra NaN — NaN lọt xuống `currentTime` sẽ ném lỗi trong trình duyệt.
  const s = estimateSentences(['One two three.'], 0);
  assert.equal(s[0]?.start, 0);
  assert.equal(s[0]?.end, 0);
});

test('estimateSentences: không có chữ nào thì trả mảng rỗng', () => {
  assert.deepEqual(estimateSentences([], 60), []);
  assert.deepEqual(estimateSentences(['   '], 60), []);
});
