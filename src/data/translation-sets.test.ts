import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TRANSLATION_SETS,
  filterTranslationSets,
  getTranslationSet,
  translationSetStats,
} from './translation-sets';

/**
 * Canh kho bộ đề Dịch câu.
 *
 * Bốn mươi bộ trong đó do AI sinh rồi `scripts/generate-translation-sets.ts` lọc.
 * Bộ lọc ấy chạy MỘT LẦN lúc sinh; test này chạy MỖI LẦN sửa mã, và đó là điểm
 * khác nhau quan trọng — file seed có thể bị sửa tay, bị ghi đè bởi một lượt sinh
 * khác, hoặc bị hai tiến trình ghi chồng lên nhau. Đã suýt dính chuyện cuối:
 * một lượt sinh chạy nền và một lượt chạy tay cùng ghi vào một thư mục.
 *
 * Nên mọi luật lúc sinh được kiểm lại ở đây, trên dữ liệu đã nạp vào app.
 */

const VI_DAU =
  /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

test('có đủ 50 bộ đề', () => {
  assert.equal(TRANSLATION_SETS.length, 50, '10 bộ gom từ kho câu gốc + 40 bộ soạn thêm');
});

test('mỗi bộ đều có câu, và tổng số câu khớp phần thống kê', () => {
  for (const set of TRANSLATION_SETS) {
    assert.ok(set.items.length > 0, `bộ "${set.title}" rỗng`);
  }
  const stats = translationSetStats();
  assert.equal(stats.sets, TRANSLATION_SETS.length);
  assert.equal(
    stats.sentences,
    TRANSLATION_SETS.reduce((n, s) => n + s.items.length, 0),
  );
});

test('id không trùng nhau', () => {
  const ids = TRANSLATION_SETS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'id trùng thì mở bài này lại ra bài kia');
});

/**
 * Câu do AI sinh mang id `tr-<slug>-NN`; 100 câu viết tay gốc mang id `tr-NN`.
 *
 * Cần phân biệt vì vài luật dưới đây chỉ áp cho phần AI sinh — phần viết tay đã
 * có người đọc qua, và nó cố ý làm vài thứ mà luật máy sẽ hiểu nhầm là lỗi.
 */
function laAiSinh(id: string): boolean {
  return !/^tr-\d+$/.test(id);
}

/**
 * Bỏ các từ viết hoa trước khi soi xem câu có lẫn tiếng Việt hay không.
 *
 * Danh từ riêng tiếng Việt nằm trong câu tiếng Anh là HOÀN TOÀN ĐÚNG — "My family
 * will travel to Đà Lạt" không có gì sai cả. Luật đầu tiên tôi viết bắt luôn cả
 * những câu này, tức là luật sai chứ không phải dữ liệu sai.
 */
function boDanhTuRieng(s: string): string {
  return s
    .split(/\s+/)
    .filter((w) => !/^[A-ZÀ-Ỹ]/.test(w))
    .join(' ');
}

test('không đảo ô: câu tiếng Việt có dấu, câu tiếng Anh không lẫn tiếng Việt', () => {
  // Đảo hai ô là lỗi làm hỏng cả bài luyện: đề bài hiện ra bằng tiếng Anh.
  for (const set of TRANSLATION_SETS) {
    for (const item of set.items) {
      assert.ok(VI_DAU.test(item.vi), `[${set.id}] câu tiếng Việt không có dấu: "${item.vi}"`);
      assert.ok(
        !VI_DAU.test(boDanhTuRieng(item.en)),
        `[${set.id}] câu tiếng Anh lại chứa chữ tiếng Việt: "${item.en}"`,
      );
    }
  }
});

test('mọi câu đều có ghi chú cấu trúc', () => {
  for (const set of TRANSLATION_SETS) {
    for (const item of set.items) {
      assert.notEqual(item.hint.trim(), '', `[${set.id}] câu "${item.id}" thiếu ghi chú`);
    }
  }
});

test('ghi chú của phần AI sinh phải bằng tiếng Việt', () => {
  /*
    Chỉ áp cho phần AI sinh. Ghi chú viết tay đôi khi cố ý là một cấu trúc tiếng
    Anh nguyên khối — "blur the boundary between A and B." — và đó là ghi chú tốt:
    người học cần nhớ đúng cụm đó. Bắt nó phải có dấu tiếng Việt là ép sai chỗ.

    Với phần AI sinh thì luật này cần thật: model rất hay tuột về tiếng Anh, và đã
    làm đúng như vậy ở hai lượt trong lúc sinh (bộ sinh bắt được và cho sinh lại).
  */
  for (const set of TRANSLATION_SETS) {
    for (const item of set.items) {
      if (!laAiSinh(item.id)) continue;
      assert.ok(
        VI_DAU.test(item.hint),
        `[${set.id}] ghi chú không phải tiếng Việt: "${item.hint}"`,
      );
    }
  }
});

test('câu tiếng Anh không bị cụt', () => {
  for (const set of TRANSLATION_SETS) {
    for (const item of set.items) {
      assert.match(item.en, /[.!?]["']?$/, `[${set.id}] câu cụt: "${item.en}"`);
      assert.match(item.en, /^[A-Z"']/, `[${set.id}] không viết hoa đầu câu: "${item.en}"`);
    }
  }
});

test('không có câu tiếng Anh nào lặp lại trên toàn kho', () => {
  const seen = new Map<string, string>();
  for (const set of TRANSLATION_SETS) {
    for (const item of set.items) {
      const key = item.en.toLowerCase().replace(/[^a-z ]/g, '').trim();
      const truoc = seen.get(key);
      assert.equal(truoc, undefined, `câu "${item.en}" có ở cả ${truoc} và ${set.id}`);
      seen.set(key, set.id);
    }
  }
});

test('id câu không trùng nhau trên toàn kho', () => {
  const ids = TRANSLATION_SETS.flatMap((s) => s.items.map((i) => i.id));
  assert.equal(new Set(ids).size, ids.length);
});

test('bài xếp dễ trước khó sau', () => {
  const rank = { easy: 0, medium: 1, hard: 2 } as const;
  const levels = TRANSLATION_SETS.map((s) => rank[s.level]);
  for (let i = 1; i < levels.length; i += 1) {
    assert.ok(
      (levels[i] ?? 0) >= (levels[i - 1] ?? 0),
      `bài ${i + 1} (${TRANSLATION_SETS[i]?.level}) dễ hơn bài trước (${TRANSLATION_SETS[i - 1]?.level})`,
    );
  }
});

test('số thứ tự chạy liên tục từ 1', () => {
  TRANSLATION_SETS.forEach((set, i) => {
    assert.equal(set.order, i + 1, `bộ "${set.title}" mang số thứ tự sai`);
  });
});

test('tra được bộ theo id, id lạ thì trả về undefined', () => {
  const first = TRANSLATION_SETS[0];
  assert.ok(first);
  assert.equal(getTranslationSet(first.id)?.id, first.id);
  assert.equal(getTranslationSet('tset-khong-ton-tai'), undefined);
});

test('lọc theo trình độ trả về đúng nhóm, "all" trả về hết', () => {
  assert.equal(filterTranslationSets({ level: 'all' }).length, TRANSLATION_SETS.length);
  for (const level of ['easy', 'medium', 'hard'] as const) {
    const got = filterTranslationSets({ level });
    assert.ok(got.length > 0, `không có bộ nào ở mức ${level}`);
    assert.ok(got.every((s) => s.level === level));
  }
});

test('mỗi câu mang chủ đề dùng cho thống kê', () => {
  for (const set of TRANSLATION_SETS) {
    for (const item of set.items) {
      assert.ok(item.topic, `[${set.id}] câu "${item.id}" thiếu chủ đề`);
    }
  }
});
