import test from 'node:test';
import assert from 'node:assert/strict';

import { CLIP_CATEGORIES, ENGLISH_CLIPS, clipsIn, clipVideo } from './english-clips';
import { LIBRARY_VIDEOS } from './video-library';

/**
 * Canh bộ clip tiếng Anh.
 *
 * Mỗi clip chỉ là một id trỏ vào thư viện video, nên id bịa hoặc trùng sẽ lộ ra ở
 * đây trước khi tới tay người học. Phần học cũng phải đủ: đúng hai từ, ví dụ chứa
 * chính từ đó, câu hỏi có bốn đáp án khác nhau và chỉ số đúng nằm trong khoảng.
 */

test('mọi clip trỏ tới một video có trong thư viện, không bịa id', () => {
  const ids = new Set(LIBRARY_VIDEOS.map((v) => v.id));
  for (const clip of ENGLISH_CLIPS) {
    assert.ok(ids.has(clip.videoId), `${clip.videoId} không có trong thư viện video`);
  }
});

test('không có video nào xuất hiện hai lần trong feed', () => {
  const ids = ENGLISH_CLIPS.map((c) => c.videoId);
  assert.equal(new Set(ids).size, ids.length, 'có clip trùng video');
});

test('mỗi nhóm có ít nhất ba clip để lọc không ra trống', () => {
  for (const cat of CLIP_CATEGORIES) {
    assert.ok(clipsIn(cat.key).length >= 3, `nhóm ${cat.key} chỉ có ${clipsIn(cat.key).length} clip`);
  }
  assert.equal(clipsIn('all').length, ENGLISH_CLIPS.length);
});

test('mỗi clip có đúng hai từ, đủ phiên âm, nghĩa và ví dụ chứa đúng từ đó', () => {
  for (const clip of ENGLISH_CLIPS) {
    assert.equal(clip.words.length, 2, `${clip.videoId} phải có đúng 2 từ`);
    for (const w of clip.words) {
      assert.notEqual(w.ipa.trim(), '', `${w.term} thiếu phiên âm`);
      assert.notEqual(w.meaningVi.trim(), '', `${w.term} thiếu nghĩa`);
      assert.ok(
        w.example.toLowerCase().includes(w.term.toLowerCase()),
        `ví dụ của "${w.term}" không chứa đúng từ đó`,
      );
    }
  }
});

test('câu hỏi có bốn đáp án khác nhau, chỉ số đúng nằm trong khoảng', () => {
  for (const clip of ENGLISH_CLIPS) {
    const { options, answer } = clip.quiz;
    assert.equal(options.length, 4, `${clip.videoId} không đủ 4 đáp án`);
    assert.equal(new Set(options).size, 4, `${clip.videoId} có đáp án trùng`);
    assert.ok(Number.isInteger(answer) && answer >= 0 && answer < 4, `${clip.videoId} có chỉ số đáp án lạ: ${answer}`);
  }
});

test('gợi ý tiếng Việt không rỗng và đủ ngắn để đọc lướt trong feed', () => {
  for (const clip of ENGLISH_CLIPS) {
    assert.notEqual(clip.gistVi.trim(), '', `${clip.videoId} thiếu gợi ý`);
    assert.ok(clip.gistVi.length <= 90, `${clip.videoId} gợi ý dài ${clip.gistVi.length} ký tự`);
  }
});

test('clip nào cũng lấy đủ trình độ và kênh từ thư viện, và không quá 15 phút', () => {
  for (const clip of ENGLISH_CLIPS) {
    const v = clipVideo(clip);
    assert.ok(v?.level, `${clip.videoId} thiếu trình độ`);
    assert.ok(v?.channel, `${clip.videoId} thiếu tên kênh`);
    if (v.durationSeconds !== null) {
      assert.ok(v.durationSeconds <= 900, `${clip.videoId} dài ${v.durationSeconds}s, quá dài cho một clip`);
    }
  }
});
