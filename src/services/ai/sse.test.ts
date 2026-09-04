import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseSse } from './fallback';

/** Dựng stream từ các mẩu byte đã định sẵn, để ép đúng kiểu chẻ dòng cần thử. */
function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
}

async function collect(chunks: string[]): Promise<string> {
  let out = '';
  for await (const piece of parseSse(streamOf(chunks))) out += piece;
  return out;
}

const line = (text: string) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n`;

test('ghép các mẩu chữ theo đúng thứ tự', async () => {
  assert.equal(await collect([line('Xin '), line('chào'), 'data: [DONE]\n']), 'Xin chào');
});

test('một dòng bị chẻ làm đôi giữa hai gói tin vẫn ghép lại được', async () => {
  /*
    ĐÂY LÀ CA QUAN TRỌNG NHẤT. Mạng không cắt gói theo dòng, nên một dòng
    `data: {...}` hoàn toàn có thể bị đứt giữa chừng. Bóc ngay từng gói nhận được
    sẽ ra JSON hỏng — và chỉ hỏng ở câu trả lời DÀI, tức là không bao giờ gặp lúc
    thử nhanh, chỉ gặp khi người dùng đang hỏi thật.
  */
  const full = line('rạn san hô');
  const cut = Math.floor(full.length / 2);
  assert.equal(await collect([full.slice(0, cut), full.slice(cut)]), 'rạn san hô');
});

test('chẻ vụn từng ký tự một vẫn ra đúng câu', async () => {
  const full = line('abc') + line('def');
  assert.equal(await collect([...full]), 'abcdef');
});

test('[DONE] kết thúc, không đọc tiếp phần sau', async () => {
  assert.equal(await collect([line('xong'), 'data: [DONE]\n', line('thừa')]), 'xong');
});

test('một mẩu JSON hỏng không giết cả câu trả lời', async () => {
  // Thà mất một mẩu còn hơn cụt hẳn từ giữa câu.
  assert.equal(await collect([line('a'), 'data: {hỏng\n', line('b')]), 'ab');
});

test('bỏ qua dòng không phải data và dòng trống', async () => {
  assert.equal(await collect([': keep-alive\n', '\n', line('a'), 'event: ping\n']), 'a');
});

test('delta rỗng không sinh mẩu chữ nào', async () => {
  const empty = `data: ${JSON.stringify({ choices: [{ delta: {} }] })}\n`;
  assert.equal(await collect([empty, line('a')]), 'a');
});

test('stream không có [DONE] vẫn kết thúc khi hết dữ liệu', async () => {
  assert.equal(await collect([line('a')]), 'a');
});

test('chữ có dấu bị chẻ giữa hai byte của cùng một ký tự', async () => {
  // "ệ" là 3 byte UTF-8; cắt giữa nó mà không dùng decoder có stream sẽ ra "�".
  const bytes = new TextEncoder().encode(line('tuyệt'));
  const cut = 20;
  const decoder = new TextDecoder();
  const parts = [decoder.decode(bytes.slice(0, cut), { stream: true }), decoder.decode(bytes.slice(cut))];
  assert.equal(await collect(parts), 'tuyệt');
});
