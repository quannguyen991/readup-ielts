import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ALBUMS } from '../../data/album';
import {
  ALBUM_SLOTS,
  ALBUM_THRESHOLDS,
  albumForWeek,
  albumHistory,
  albumProgress,
  recordCorrect,
  remainingMs,
  slotStates,
  splitDuration,
  weekById,
  weekDays,
  weekOf,
} from './album';

// Giờ VN = UTC+7. Thứ Hai 12/10/2026 00:00 VN = 11/10 17:00 UTC.
const MON_12_OCT_00H_VN = new Date('2026-10-11T17:00:00Z');
const SUN_18_OCT_2330_VN = new Date('2026-10-18T16:30:00Z');
const MON_19_OCT_00H_VN = new Date('2026-10-18T17:00:00Z');

test('cùng số câu đúng thì luôn ra cùng trạng thái, không phụ thuộc tuần', () => {
  assert.deepEqual(slotStates(12), slotStates(12));
  assert.deepEqual(albumProgress(12), albumProgress(12));
  // Hai tuần khác nhau, cùng số câu đúng: trạng thái ô giống hệt nhau.
  const a = weekOf(new Date('2026-10-13T03:00:00Z'));
  const b = weekOf(new Date('2026-10-27T03:00:00Z'));
  assert.notEqual(a.id, b.id);
  assert.deepEqual(slotStates(20), slotStates(20));
});

test('ngưỡng mở ô chính xác: đủ mốc thì mở, thiếu một câu thì vẫn khoá', () => {
  assert.equal(ALBUM_THRESHOLDS.length, ALBUM_SLOTS);
  ALBUM_THRESHOLDS.forEach((t, i) => {
    const before = slotStates(t - 1)[i]!;
    const at = slotStates(t)[i]!;
    assert.equal(before.unlocked, false, `ô ${i + 1} phải khoá ở ${t - 1} câu`);
    assert.equal(before.missing, 1);
    assert.equal(at.unlocked, true, `ô ${i + 1} phải mở ở đúng ${t} câu`);
    assert.equal(at.missing, 0);
  });
  assert.equal(slotStates(0).filter((s) => s.unlocked).length, 0);
  assert.equal(slotStates(50).filter((s) => s.unlocked).length, ALBUM_SLOTS);
  assert.equal(slotStates(999).filter((s) => s.unlocked).length, ALBUM_SLOTS);
});

test('các ô mở theo thứ tự: luôn là một tiền tố liên tiếp', () => {
  for (let n = 0; n <= 60; n += 1) {
    const flags = slotStates(n).map((s) => s.unlocked);
    const firstLocked = flags.indexOf(false);
    if (firstLocked === -1) continue;
    assert.ok(flags.slice(firstLocked).every((f) => f === false), `n=${n} mở ô không liền mạch`);
  }
});

test('tiến độ tới ô kế tiếp và số ô đã mở', () => {
  const p7 = albumProgress(7);
  assert.equal(p7.unlocked, 1);
  assert.equal(p7.next?.index, 1);
  assert.equal(p7.next?.threshold, 10);
  assert.equal(p7.next?.missing, 3);
  assert.equal(p7.fraction, 0.4);

  const full = albumProgress(50);
  assert.equal(full.unlocked, ALBUM_SLOTS);
  assert.equal(full.next, null);
  assert.equal(full.fraction, 1);
});

test('tuần mới bắt đầu: album đếm lại từ 0', () => {
  const sunday = new Date(SUN_18_OCT_2330_VN);
  let counts = {};
  for (let i = 0; i < 9; i += 1) counts = recordCorrect(counts, sunday);
  assert.deepEqual(counts, { '2026-10-12': 9 });

  // Thứ Hai 00:00 VN đã sang tuần mới: câu đúng đầu tiên là 1, không phải 10.
  counts = recordCorrect(counts, MON_19_OCT_00H_VN);
  assert.deepEqual(counts, { '2026-10-12': 9, '2026-10-19': 1 });
  assert.equal(albumProgress(counts['2026-10-19']!).unlocked, 0);
});

test('tuần cũ không được cộng thêm', () => {
  const oldCounts = { '2026-10-12': 9 };
  const wedNextWeek = new Date('2026-10-20T03:00:00Z');
  const after = recordCorrect(oldCounts, wedNextWeek);
  assert.equal(after['2026-10-12'], 9);
  assert.equal(after['2026-10-19'], 1);
  // Không sửa đối tượng đầu vào.
  assert.deepEqual(oldCounts, { '2026-10-12': 9 });

  const rows = albumHistory(after, wedNextWeek);
  const old = rows.find((r) => r.week.id === '2026-10-12')!;
  assert.equal(old.current, false);
  assert.equal(old.correct, 9);
  assert.equal(rows.find((r) => r.week.id === '2026-10-19')!.current, true);
  // Tuần mới nhất đứng đầu danh sách lịch sử.
  assert.equal(rows[0]!.week.id, '2026-10-19');
});

test('ranh giới tuần theo giờ Việt Nam và mốc đóng là Chủ nhật 23:59:59', () => {
  assert.equal(weekOf(MON_12_OCT_00H_VN).id, '2026-10-12');
  assert.equal(weekOf(SUN_18_OCT_2330_VN).id, '2026-10-12');
  assert.equal(weekOf(MON_19_OCT_00H_VN).id, '2026-10-19');
  // 23:59:59 Chủ nhật VN = 16:59:59 UTC Chủ nhật.
  assert.equal(weekOf(SUN_18_OCT_2330_VN).closesAt, Date.parse('2026-10-18T16:59:59Z'));
  assert.equal(remainingMs(weekOf(SUN_18_OCT_2330_VN), Date.parse('2026-10-18T16:59:59Z')), 0);
  assert.equal(remainingMs(weekOf(SUN_18_OCT_2330_VN), Date.parse('2026-10-18T16:59:00Z')), 59_000);
  assert.deepEqual(weekDays(weekById('2026-10-12')), { first: '2026-10-12', last: '2026-10-18' });
});

test('album xoay vòng đều, ba tuần liền nhau cho ba album khác nhau', () => {
  assert.ok(ALBUMS.length >= 3, 'cần tối thiểu 3 album trong dữ liệu');
  const keys = [MON_12_OCT_00H_VN, MON_19_OCT_00H_VN, new Date('2026-10-25T17:00:00Z')].map(
    (d) => albumForWeek(weekOf(d)).key,
  );
  assert.equal(new Set(keys).size, 3);
  // Cùng tuần thì luôn cùng album.
  assert.equal(albumForWeek(weekOf(MON_12_OCT_00H_VN)).key, albumForWeek(weekOf(SUN_18_OCT_2330_VN)).key);
});

test('dữ liệu album: mỗi album đúng 8 ô, mã ô không trùng, tên đủ hai ngôn ngữ', () => {
  const ids = new Set<string>();
  for (const album of ALBUMS) {
    assert.equal(album.stickers.length, ALBUM_SLOTS, `${album.key} phải có 8 ô`);
    assert.ok(album.title && album.titleEn);
    for (const s of album.stickers) {
      assert.ok(!ids.has(s.id), `mã ô trùng: ${s.id}`);
      ids.add(s.id);
      assert.ok(s.name && s.nameEn && s.topic && s.topicEn, `ô ${s.id} thiếu chữ`);
      assert.match(s.tone, /^#[0-9A-Fa-f]{6}$/);
    }
  }
});

test('tách thời gian đếm ngược', () => {
  assert.deepEqual(splitDuration(((3 * 24 + 4) * 3600 + 21 * 60 + 9) * 1000), { days: 3, hours: 4, minutes: 21, seconds: 9 });
  assert.deepEqual(splitDuration(-5), { days: 0, hours: 0, minutes: 0, seconds: 0 });
});
