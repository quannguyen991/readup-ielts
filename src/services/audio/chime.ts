import { sfx } from './sfx';

/**
 * Các tiếng cũ của app — giờ chỉ là lối gọi vào bộ âm thanh game (`sfx.ts`).
 *
 * Giữ nguyên tên để các màn đang gọi (chuông đúng ở màn từ vựng, pháo giấy ở
 * màn chép chính tả) không phải sửa, nhưng mọi tiếng giờ đi chung
 * MỘT `AudioContext`, cùng một bộ nén, cùng nút tắt tiếng, và cùng luật chống
 * kêu đôi: màn học báo "đúng" rồi luật game cũng báo "đúng" cho cùng một câu thì
 * chỉ nghe một tiếng.
 *
 * Nuốt mọi lỗi: tiếng không kêu được thì không đáng làm hỏng màn làm bài. Trả
 * về `true` khi thực sự phát.
 */

/** Tiếng "đúng": hai nốt đi lên — quãng lên nghe như "xong rồi, tiếp đi". */
export function playCorrectChime(): boolean {
  return sfx.correct(1);
}

/** Trận Quest: vung vũ khí. */
export function playQuestAttackSound(): boolean {
  return sfx.slash();
}

/** Trận Quest: trúng quái. */
export function playQuestHitSound(): boolean {
  return sfx.impact(false, 0.08);
}

/** Trận Quest: bị quái đánh trúng. */
export function playQuestDamageSound(): boolean {
  return sfx.hurt();
}

/** Lên cấp. */
export function playLevelUpSound(): boolean {
  return sfx.levelUp();
}

/** Hạ quái / nhặt đồ. */
export function playLootSound(): boolean {
  return sfx.loot();
}
