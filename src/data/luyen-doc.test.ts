import test from 'node:test';
import assert from 'node:assert/strict';

import {
  LIBRIVOX_BOOKS,
  NEWS,
  VIDEO_NEWS,
  VOA_VIDEOS,
  WIKI_NEWS,
  daysBetween,
  dayLabel,
  formatSeconds,
  groupNewsByDay,
  newsSections,
  sectionLabel,
} from './luyen-doc';

/**
 * Canh dữ liệu và logic của mục Luyện đọc.
 *
 * Phần seed chỉ kiểm CẤU TRÚC (id, ngày, nguồn, giấy phép, URL), không kiểm số lượng
 * cụ thể: tin Wikipedia thay đổi mỗi ngày khi script chạy lại.
 */

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

test('tin Wikipedia: id duy nhất, ngày đúng dạng, có tiêu đề, ghi nguồn và giấy phép CC BY-SA', () => {
  assert.ok(WIKI_NEWS.length >= 5, `chỉ có ${WIKI_NEWS.length} tin`);
  const ids = WIKI_NEWS.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, 'có id tin trùng');
  for (const it of WIKI_NEWS) {
    assert.match(it.date, ISO_DAY, `${it.id} có ngày lạ: ${it.date}`);
    assert.notEqual(it.headline.trim(), '', `${it.id} thiếu tiêu đề`);
    assert.ok(
      it.sourceUrl.startsWith('https://en.wikipedia.org/wiki/Portal:Current_events/'),
      `${it.id} có nguồn lạ: ${it.sourceUrl}`,
    );
    assert.equal(it.license, 'CC BY-SA 4.0', `${it.id} thiếu giấy phép`);
  }
});

test('tin Wikipedia không còn dấu đánh dấu wiki sót lại', () => {
  for (const it of WIKI_NEWS) {
    const text = [it.headline, ...it.details].join(' ');
    assert.doesNotMatch(text, /\[\[|\]\]|\{\{|\}\}|'''|<ref|&nbsp;/, `${it.id} còn đánh dấu wiki: ${text.slice(0, 80)}`);
  }
});

test('video VOA: id 11 ký tự, không trùng, đúng kênh, ngày đúng dạng, thời lượng không phải Short', () => {
  const ids = VOA_VIDEOS.map((v) => v.id);
  assert.equal(new Set(ids).size, ids.length, 'có video trùng');
  for (const v of VOA_VIDEOS) {
    assert.match(v.id, /^[A-Za-z0-9_-]{11}$/, `id lạ: ${v.id}`);
    assert.equal(v.channel, 'VOA Learning English', `${v.id} sai kênh`);
    assert.match(v.publishedAt, ISO_DAY, `${v.id} ngày lạ: ${v.publishedAt}`);
    assert.notEqual(v.title.trim(), '', `${v.id} thiếu tiêu đề`);
    if (v.durationSeconds !== null) assert.ok(v.durationSeconds >= 60, `${v.id} quá ngắn: ${v.durationSeconds}s`);
  }
  // Mới nhất trước.
  for (let i = 1; i < VOA_VIDEOS.length; i++) {
    assert.ok((VOA_VIDEOS[i - 1]?.publishedAt ?? '') >= (VOA_VIDEOS[i]?.publishedAt ?? ''), 'video chưa sắp mới nhất trước');
  }
});

test('sách nói: mỗi sách có chương MP3 HTTPS, thời lượng dương, có người đọc và nguồn LibriVox', () => {
  assert.ok(LIBRIVOX_BOOKS.length >= 3, `chỉ có ${LIBRIVOX_BOOKS.length} sách`);
  const ids = LIBRIVOX_BOOKS.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length, 'có sách trùng');
  for (const b of LIBRIVOX_BOOKS) {
    assert.notEqual(b.title.trim(), '', `${b.id} thiếu tên`);
    assert.ok(b.chapters.length >= 1, `${b.title} không có chương`);
    assert.ok(b.readers.length >= 1, `${b.title} thiếu tên người đọc`);
    assert.ok(b.sourceUrl.startsWith('https://librivox.org/'), `${b.title} có nguồn lạ`);
    for (const c of b.chapters) {
      assert.match(c.url, /^https:\/\/.+\.mp3$/i, `${b.title} chương ${c.n} không phải MP3 HTTPS`);
      assert.ok(c.seconds > 0, `${b.title} chương ${c.n} thời lượng 0`);
    }
    const sum = b.chapters.reduce((s, c) => s + c.seconds, 0);
    assert.equal(b.totalSeconds, sum, `${b.title}: tổng thời lượng không khớp các chương`);
  }
});

test('nhóm tin theo ngày: hôm nay, hôm qua, rồi các ngày trước; mới nhất đứng đầu', () => {
  const items = [
    { id: 'a-1', date: '2026-10-16', section: 'Sport', headline: 'x', details: [], sourceUrl: '', license: 'CC BY-SA 4.0', source: 'wiki' as const },
    { id: 'a-2', date: '2026-10-16', section: 'Sport', headline: 'y', details: [], sourceUrl: '', license: 'CC BY-SA 4.0', source: 'wiki' as const },
    { id: 'b-1', date: '2026-10-15', section: 'Politics and elections', headline: 'z', details: [], sourceUrl: '', license: 'CC BY-SA 4.0', source: 'wiki' as const },
    { id: 'c-1', date: '2026-10-13', section: 'Sport', headline: 'w', details: [], sourceUrl: '', license: 'CC BY-SA 4.0', source: 'wiki' as const },
  ];
  const days = groupNewsByDay(items, '2026-10-16');
  assert.deepEqual(
    days.map((d) => [d.date, d.label, d.items.length]),
    [
      ['2026-10-16', 'Hôm nay', 2],
      ['2026-10-15', 'Hôm qua', 1],
      ['2026-10-13', '13/10/2026', 1],
    ],
  );
  // Lọc theo mục.
  const sport = groupNewsByDay(items, '2026-10-16', 'Sport');
  assert.equal(sport.reduce((s, d) => s + d.items.length, 0), 3);
  assert.ok(sport.every((d) => d.items.every((i) => i.section === 'Sport')));
});

test('nhãn ngày và số ngày giữa hai ngày', () => {
  assert.equal(daysBetween('2026-10-14', '2026-10-17'), 3);
  assert.equal(dayLabel('2026-10-17', '2026-10-17'), 'Hôm nay');
  assert.equal(dayLabel('2026-10-16', '2026-10-17'), 'Hôm qua');
  assert.equal(dayLabel('2026-03-02', '2026-10-17'), '02/03/2026');
});

test('thời lượng dạng người đọc', () => {
  assert.equal(formatSeconds(45), '45 giây');
  assert.equal(formatSeconds(600), '10 phút');
  assert.equal(formatSeconds(3600), '1 giờ');
  assert.equal(formatSeconds(5400), '1 giờ 30 phút');
  assert.equal(formatSeconds(7380), '2 giờ 03 phút');
  assert.equal(formatSeconds(-5), '0 giây');
});

test('tên mục tiếng Việt, mục lạ thì giữ tiếng Anh', () => {
  assert.equal(sectionLabel('Health and environment'), 'Sức khoẻ và môi trường');
  assert.equal(sectionLabel('Sport'), 'Thể thao');
  assert.equal(sectionLabel('Some new section'), 'Some new section');
  const sections = newsSections(WIKI_NEWS);
  assert.equal(new Set(sections).size, sections.length);
});

test('video tin: id không trùng, nguồn đúng, ngày đúng dạng, thời lượng 1 đến 30 phút', () => {
  assert.ok(VIDEO_NEWS.length >= 3, `chỉ có ${VIDEO_NEWS.length} video tin`);
  const ids = VIDEO_NEWS.map((v) => v.id);
  assert.equal(new Set(ids).size, ids.length, 'có video tin trùng');
  for (const v of VIDEO_NEWS) {
    assert.match(v.id, /^[A-Za-z0-9_-]{11}$/, `id lạ: ${v.id}`);
    assert.match(v.publishedAt, ISO_DAY, `${v.id} ngày lạ`);
    assert.ok(['Vietnam Today', 'BBC News'].includes(v.source), `${v.id} nguồn lạ: ${v.source}`);
    assert.ok(v.durationSeconds !== null && v.durationSeconds >= 60 && v.durationSeconds <= 1800, `${v.id} thời lượng lạ`);
  }
});

test('tin NASA: giấy phép công cộng, liên kết nasa.gov, tách khỏi tin Wikipedia', () => {
  const nasa = NEWS.filter((i) => i.source === 'nasa');
  assert.ok(nasa.length >= 5, `chỉ có ${nasa.length} tin NASA`);
  for (const it of nasa) {
    assert.match(it.sourceUrl, /^https:\/\/([a-z0-9-]+\.)?nasa\.gov\//, `${it.id} nguồn lạ`);
    assert.match(it.license, /công cộng/, `${it.id} thiếu giấy phép công cộng`);
    assert.notEqual(it.headline.trim(), '', `${it.id} thiếu tiêu đề`);
  }
  assert.equal(WIKI_NEWS.length + nasa.length, NEWS.length);
});
