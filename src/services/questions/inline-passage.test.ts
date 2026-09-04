import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Kiểm luật siết văn bản gửi kèm của `POST /api/questions`.
 *
 * Bản sao của `readInlinePassage` — không import được vì nó nằm trong file
 * `+api.ts`, mà file ấy chỉ chạy trong runtime của Expo Router. Chép luật sang
 * đây có cái giá là hai bản có thể trôi lệch nhau; đổi lại, luật này canh một
 * endpoint CÔNG KHAI nhận văn bản tuỳ ý rồi đẩy thẳng vào lời gọi AI tính tiền,
 * nên không kiểm được nó thì rủi ro lớn hơn nhiều.
 */

const MAX_INLINE_PARAGRAPHS = 60;
const MAX_INLINE_CHARS = 24_000;

function readInlinePassage(
  raw: { title?: string; paragraphs?: string[] } | undefined,
): { title: string; paragraphs: string[] } | null {
  if (!raw || !Array.isArray(raw.paragraphs)) return null;

  const paragraphs: string[] = [];
  let chars = 0;
  for (const p of raw.paragraphs) {
    if (typeof p !== 'string') continue;
    const clean = p.replace(/\s+/g, ' ').trim();
    if (clean.split(' ').length < 8) continue;
    paragraphs.push(clean);
    chars += clean.length;
    if (paragraphs.length >= MAX_INLINE_PARAGRAPHS || chars >= MAX_INLINE_CHARS) break;
  }

  if (paragraphs.length === 0) return null;
  return { title: (raw.title ?? '').trim() || 'Văn bản gửi kèm', paragraphs };
}

const DOAN = 'This is a sentence long enough to survive the minimum word filter applied here.';

test('không có văn bản kèm thì trả null, luồng tra bài theo id chạy tiếp', () => {
  assert.equal(readInlinePassage(undefined), null);
  assert.equal(readInlinePassage({}), null);
  assert.equal(readInlinePassage({ paragraphs: [] }), null);
});

test('đoạn quá ngắn bị loại — không đủ để hỏi bất cứ điều gì', () => {
  assert.equal(readInlinePassage({ paragraphs: ['Hello there.', 'Yes.'] }), null);

  const got = readInlinePassage({ paragraphs: ['Too short.', DOAN] });
  assert.equal(got?.paragraphs.length, 1);
  assert.equal(got?.paragraphs[0], DOAN);
});

test('khoảng trắng thừa và xuống dòng được gộp lại', () => {
  const got = readInlinePassage({ paragraphs: ['  a  b\n\nc   d e f g h i  '] });
  assert.equal(got?.paragraphs[0], 'a b c d e f g h i');
});

test('mục không phải chuỗi bị bỏ qua chứ không làm hỏng cả request', () => {
  const got = readInlinePassage({
    paragraphs: [DOAN, null as unknown as string, 42 as unknown as string, DOAN + ' Extra.'],
  });
  assert.equal(got?.paragraphs.length, 2);
});

test('chặn trần số đoạn', () => {
  const got = readInlinePassage({ paragraphs: Array.from({ length: 500 }, () => DOAN) });
  assert.equal(got?.paragraphs.length, MAX_INLINE_PARAGRAPHS);
});

test('chặn trần số ký tự', () => {
  // Mỗi đoạn ~2.000 ký tự: chạm trần ký tự trước khi chạm trần số đoạn.
  const dai = Array.from({ length: 40 }, () => 'word'.repeat(500)).map((w) => `${w} a b c d e f g h`);
  const got = readInlinePassage({ paragraphs: dai });
  assert.ok(got);
  const chars = got.paragraphs.reduce((n, p) => n + p.length, 0);
  assert.ok(chars < MAX_INLINE_CHARS * 1.5, `giữ lại ${chars} ký tự, vượt xa trần ${MAX_INLINE_CHARS}`);
  assert.ok(got.paragraphs.length < 40, 'phải cắt bớt trước khi hết mảng');
});

test('thiếu tiêu đề thì có tên thay thế, không để rỗng', () => {
  assert.equal(readInlinePassage({ paragraphs: [DOAN] })?.title, 'Văn bản gửi kèm');
  assert.equal(readInlinePassage({ title: '   ', paragraphs: [DOAN] })?.title, 'Văn bản gửi kèm');
  assert.equal(readInlinePassage({ title: 'Bài của tôi', paragraphs: [DOAN] })?.title, 'Bài của tôi');
});
