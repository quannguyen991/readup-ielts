import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findCaptionTracks,
  groupIntoSentences,
  parseTranscriptXml,
  parseVideoId,
  pickEnglishTrack,
  usableSentences,
  speechCues,
} from './transcript';

test('rút được id video từ mọi kiểu liên kết hay dán', () => {
  const id = 'dQw4w9WgXcQ';
  for (const input of [
    id,
    `https://www.youtube.com/watch?v=${id}`,
    `https://www.youtube.com/watch?v=${id}&t=42s`,
    `https://youtu.be/${id}`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/shorts/${id}`,
    `  https://m.youtube.com/watch?v=${id}  `,
  ]) {
    assert.equal(parseVideoId(input), id, `không rút được id từ: ${input}`);
  }
});

test('liên kết không phải YouTube thì trả về null, không đoán bừa', () => {
  for (const input of ['', '   ', 'https://vimeo.com/12345', 'chỉ là một câu chữ']) {
    assert.equal(parseVideoId(input), null);
  }
});

test('tìm đúng mảng phụ đề trong HTML dù JSON lồng nhau', () => {
  const html = `junk{"other":[{"a":[1,2]}],"captionTracks":[{"baseUrl":"https://x/y?a=1\\u0026b=2","languageCode":"en","kind":"asr"},{"baseUrl":"https://x/z","languageCode":"vi"}],"more":[]}`;
  const tracks = findCaptionTracks(html);
  assert.equal(tracks.length, 2);
  assert.equal(tracks[0]?.baseUrl, 'https://x/y?a=1&b=2', 'phải giải mã \\u0026 thành &');
  assert.equal(tracks[0]?.languageCode, 'en');
});

test('HTML không có phụ đề thì trả mảng rỗng, không ném lỗi', () => {
  assert.deepEqual(findCaptionTracks('<html>không có gì</html>'), []);
  assert.deepEqual(findCaptionTracks('"captionTracks": hỏng'), []);
});

test('ưu tiên phụ đề người soạn hơn bản máy tự sinh', () => {
  const picked = pickEnglishTrack([
    { baseUrl: 'a', languageCode: 'en', kind: 'asr' },
    { baseUrl: 'b', languageCode: 'en' },
    { baseUrl: 'c', languageCode: 'vi' },
  ]);
  assert.equal(picked?.baseUrl, 'b');
});

test('không có phụ đề tiếng Anh thì trả null', () => {
  assert.equal(pickEnglishTrack([{ baseUrl: 'a', languageCode: 'vi' }]), null);
  assert.equal(pickEnglishTrack([]), null);
});

test('đọc được XML phụ đề và giải mã thực thể', () => {
  const xml = `<transcript>
    <text start="0.5" dur="2.0">Hello &amp;amp; welcome</text>
    <text start="2.5" dur="1.5">it&amp;#39;s a test</text>
    <text start="4.0" dur="1.0">   </text>
  </transcript>`;
  const cues = parseTranscriptXml(xml);
  assert.equal(cues.length, 2, 'mẩu rỗng phải bị bỏ');
  assert.equal(cues[0]?.text, 'Hello & welcome');
  assert.equal(cues[0]?.start, 0.5);
  assert.equal(cues[1]?.text, "it's a test");
});

test('gộp các mẩu thành câu trọn vẹn theo dấu kết câu', () => {
  const cues = [
    { start: 0, duration: 1, text: 'I woke up early' },
    { start: 1, duration: 1, text: 'and made coffee.' },
    { start: 2, duration: 1, text: 'Then I went out.' },
  ];
  const sentences = groupIntoSentences(cues);
  assert.equal(sentences.length, 2);
  assert.equal(sentences[0]?.text, 'I woke up early and made coffee.');
  assert.equal(sentences[0]?.start, 0);
  assert.equal(sentences[1]?.text, 'Then I went out.');
});

test('phụ đề không có dấu câu vẫn bị cắt theo ngưỡng số từ', () => {
  const cues = Array.from({ length: 10 }, (_, i) => ({
    start: i,
    duration: 1,
    text: 'word word word',
  }));
  const sentences = groupIntoSentences(cues, 9);
  assert.ok(sentences.length > 1, 'phải cắt ra nhiều câu chứ không dồn thành một khối');
  for (const sentence of sentences) {
    assert.ok(sentence.text.split(/\s+/).length <= 12, 'câu vẫn dài quá ngưỡng');
  }
});

test('bỏ câu quá ngắn, câu không có chữ, và chú thích trong ngoặc vuông', () => {
  const kept = usableSentences([
    { start: 0, end: 1, text: 'Okay.' },
    { start: 1, end: 2, text: '[Music]' },
    { start: 2, end: 3, text: '♪♪♪' },
    { start: 3, end: 4, text: '[Music] This one is long enough to keep.' },
  ]);
  assert.equal(kept.length, 1);
  assert.equal(kept[0]?.text, 'This one is long enough to keep.');
});

/* ------------------------------------------------- khuôn XML đời mới */

test('đọc được khuôn <p t d> của InnerTube, và đổi mili giây sang giây', () => {
  /*
    Đây là lỗi đã làm chết cả tính năng mà không ai thấy: InnerTube trả
    `<timedtext format="3">` với `<p t="19514" d="1712">`, còn bộ đọc chỉ biết
    `<text start="19.514" dur="1.712">`. Nhận về 8.256 byte phụ đề hợp lệ rồi
    trả ra không cue nào, và người dùng đọc được đúng một dòng "phụ đề quá rời
    rạc" — nói sai hẳn nguyên nhân.

    Đơn vị khác nhau nên phải chia 1000; quên chia thì mọi mốc tua lệch một
    nghìn lần và bài nghe nhảy thẳng tới cuối video.
  */
  const xml =
    '<?xml version="1.0" encoding="utf-8" ?><timedtext format="3">' +
    '<body><p t="19514" d="1712">Hear that?</p>' +
    '<p t="21762" d="2265">That&#39;s nothing.</p></body></timedtext>';

  const cues = parseTranscriptXml(xml);
  assert.equal(cues.length, 2);
  assert.equal(cues[0]!.start, 19.514);
  assert.equal(cues[0]!.duration, 1.712);
  assert.equal(cues[0]!.text, 'Hear that?');
  assert.equal(cues[1]!.text, "That's nothing.");
});

test('khuôn cũ vẫn đọc được, và ĐƯỢC ƯU TIÊN', () => {
  const xml =
    '<transcript><text start="1.5" dur="2">One two three.</text></transcript>';
  const cues = parseTranscriptXml(xml);
  assert.equal(cues.length, 1);
  assert.equal(cues[0]!.start, 1.5, 'khuôn cũ tính bằng giây, không được chia 1000');
});

test('mẩu ghi công người dịch bị bỏ trước khi gộp câu', () => {
  /*
    Không được nói ra trong video. Để lại là bắt người học gõ một cái tên riêng
    họ chưa từng nghe, ngay ở câu ĐẦU TIÊN của bài.
  */
  const cues = [
    { start: 0, duration: 7, text: 'Translator: Gustavo Rocha' },
    { start: 7, duration: 2, text: 'Reviewer: Ariana Bleau Lugo' },
    { start: 19, duration: 2, text: 'Hear that? That is nothing at all.' },
  ];
  const kept = speechCues(cues);
  assert.equal(kept.length, 1);
  assert.match(kept[0]!.text, /Hear that/);
});

test('câu có chữ "translator" giữa dòng thì KHÔNG bị bỏ', () => {
  // Lọc theo dấu hai chấm ở đầu dòng, không lọc theo từ khoá xuất hiện bất kỳ đâu.
  const cues = [{ start: 0, duration: 3, text: 'The translator explained the idea clearly.' }];
  assert.equal(speechCues(cues).length, 1);
});

/* ------------------------------------------------- mỗi đoạn chép chính tả là một câu */

test('một mẩu chứa hai câu được tách thành hai đoạn, mốc thời gian nằm trong mẩu gốc', () => {
  const [a, b] = usableSentences([
    { start: 10, end: 14, text: 'The weather was cold yesterday. We stayed inside all day.' },
  ]);
  assert.equal(a?.text, 'The weather was cold yesterday.');
  assert.equal(b?.text, 'We stayed inside all day.');
  assert.ok((a?.start ?? -1) >= 10 && (b?.end ?? 99) <= 14, 'mốc thời gian phải nằm trong đoạn gốc');
  assert.ok((a?.end ?? 0) <= (b?.start ?? 0) + 1e-9, 'hai đoạn không được chồng lên nhau');
});

test('câu quá dài được tách ở dấu phẩy gần giữa, mọi đoạn đều không quá ngưỡng', () => {
  const long =
    'In Tirana, anti-government demonstrations have entered their fourth consecutive day, with thousands gathering outside the prime minister office and police using tear gas to disperse them.';
  const parts = usableSentences([{ start: 0, end: 12, text: long }]);
  assert.ok(parts.length >= 2, 'câu dài phải được tách');
  for (const p of parts) {
    assert.ok(p.text.split(/\s+/).length <= 18, `còn quá dài: ${p.text}`);
  }
});

test('câu ngắn sẵn thì giữ nguyên, không tách', () => {
  const [only] = usableSentences([{ start: 1, end: 3, text: 'Hello there, how are you today?' }]);
  assert.equal(only?.text, 'Hello there, how are you today?');
  assert.equal(only?.start, 1);
  assert.equal(only?.end, 3);
});
