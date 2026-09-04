import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LIBRARY_VIDEOS,
  VIDEO_CHANNELS,
  VIDEO_LEVELS,
  VIDEO_TOPICS,
  filterVideos,
  formatDuration,
  getLibraryVideo,
  thumbnailUrl,
  videoLibraryStats,
} from './video-library';

/**
 * Canh thư viện video.
 *
 * Dữ liệu do `scripts/build-video-library.mjs` thu từ YouTube, và YouTube đổi
 * hình dạng trang khá thường xuyên — đã dính một lần: thời lượng bóc trượt sạch
 * 220 video vì chuỗi thời gian nằm TRƯỚC id chứ không phải sau. Bộ thu chạy một
 * lần, còn test này chạy mỗi lần sửa mã, nên nó là chỗ bắt được kiểu hỏng ấy.
 */

test('có đủ 200 video trở lên', () => {
  assert.ok(LIBRARY_VIDEOS.length >= 200, `mới có ${LIBRARY_VIDEOS.length} video`);
});

test('id video đúng dạng 11 ký tự của YouTube và không trùng nhau', () => {
  for (const v of LIBRARY_VIDEOS) {
    assert.match(v.id, /^[A-Za-z0-9_-]{11}$/, `id lạ: ${v.id}`);
  }
  const ids = LIBRARY_VIDEOS.map((v) => v.id);
  assert.equal(new Set(ids).size, ids.length, 'có id trùng — cùng một video hiện hai thẻ');
});

test('mọi video đều có tiêu đề và tên kênh', () => {
  for (const v of LIBRARY_VIDEOS) {
    assert.notEqual(v.title.trim(), '', `${v.id} thiếu tiêu đề`);
    assert.notEqual(v.channel.trim(), '', `${v.id} thiếu tên kênh`);
  }
});

test('trình độ chỉ nhận bốn mức đã biết', () => {
  const hop = new Set<string>(VIDEO_LEVELS);
  for (const v of LIBRARY_VIDEOS) {
    assert.ok(hop.has(v.level), `${v.id} mang trình độ lạ: ${v.level}`);
  }
});

test('mỗi trình độ đều có video — không mức nào rỗng', () => {
  const stats = videoLibraryStats();
  for (const level of VIDEO_LEVELS) {
    assert.ok((stats.byLevel[level] ?? 0) > 0, `mức ${level} không có video nào`);
  }
});

test('phần lớn video có thời lượng', () => {
  // Trường này là best-effort, nhưng trượt gần hết thì nghĩa là YouTube đã đổi
  // hình dạng và bộ thu cần sửa — đó chính là lỗi đã gặp thật.
  const co = LIBRARY_VIDEOS.filter((v) => v.durationSeconds !== null).length;
  const tiLe = co / LIBRARY_VIDEOS.length;
  assert.ok(tiLe > 0.6, `chỉ ${Math.round(tiLe * 100)}% video có thời lượng`);
});

test('thời lượng nằm trong khoảng hợp lý để chép chính tả', () => {
  for (const v of LIBRARY_VIDEOS) {
    if (v.durationSeconds === null) continue;
    assert.ok(v.durationSeconds >= 40, `${v.id} chỉ ${v.durationSeconds}s — nhiều khả năng là Short`);
    assert.ok(v.durationSeconds <= 2400, `${v.id} dài ${v.durationSeconds}s, quá dài để chép`);
  }
});

test('có nhiều kênh và nhiều chủ đề, không dồn về một nguồn', () => {
  assert.ok(VIDEO_CHANNELS.length >= 5, `mới có ${VIDEO_CHANNELS.length} kênh`);
  assert.ok(VIDEO_TOPICS.length >= 5, `mới có ${VIDEO_TOPICS.length} chủ đề`);
});

test('tra được video theo id, id lạ thì trả undefined', () => {
  const first = LIBRARY_VIDEOS[0];
  assert.ok(first);
  assert.equal(getLibraryVideo(first.id)?.id, first.id);
  assert.equal(getLibraryVideo('khong-co-that'), undefined);
});

test('lọc theo trình độ và chủ đề', () => {
  assert.equal(filterVideos().length, LIBRARY_VIDEOS.length);
  for (const level of VIDEO_LEVELS) {
    const got = filterVideos({ level });
    assert.ok(got.every((v) => v.level === level));
  }
  const topic = VIDEO_TOPICS[0];
  assert.ok(topic);
  assert.ok(filterVideos({ topic }).every((v) => v.topic === topic));
});

test('tìm theo tên khớp cả tiêu đề lẫn tên kênh, không phân biệt hoa thường', () => {
  const first = LIBRARY_VIDEOS[0];
  assert.ok(first);
  const theoKenh = filterVideos({ search: first.channel.toUpperCase() });
  assert.ok(theoKenh.length > 0, 'tìm theo tên kênh phải ra kết quả');

  const tu = first.title.split(' ')[0];
  if (tu && tu.length > 3) {
    assert.ok(filterVideos({ search: tu.toLowerCase() }).length > 0);
  }
  assert.equal(filterVideos({ search: 'zzzzz-khong-the-co' }).length, 0);
});

test('ảnh đại diện dẫn thẳng CDN của YouTube', () => {
  assert.equal(thumbnailUrl('abcdefghijk'), 'https://i.ytimg.com/vi/abcdefghijk/mqdefault.jpg');
});

test('thời lượng hiện thành phút, thiếu thì trả null chứ không bịa số 0', () => {
  assert.equal(formatDuration(null), null);
  assert.equal(formatDuration(360), '6 phút');
  assert.equal(formatDuration(45), 'dưới 1 phút');
});
