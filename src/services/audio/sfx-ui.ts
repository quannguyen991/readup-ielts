import { bindSfxPlayer, engine, gate, noise, tone, type Engine } from './sfx';
import { isSfxId, soundOf, type SfxId, type SoundKind } from './sfx-core';

/**
 * ÂM THANH GIAO DIỆN — chỉ BỐN nhóm, cùng âm lượng, ngắn và nhẹ:
 *   - đúng / sai: chuông tam giác đi LÊN (đúng) và sin trầm đi XUỐNG (sai);
 *   - lật: tiếng giấy xoẹt;
 *   - chuyển: gió khẽ khi đổi trang hay mở / đóng hộp thoại;
 *   - click: một tích rất ngắn khi bấm.
 * Tự tổng hợp bằng Web Audio, không nạp tệp. Bảng mã tiếng → nhóm ở `sfx-core.ts`.
 */

const bell = (e: Engine, notes: number[], step: number, gain = 0.08, dur = 0.3, at = 0) =>
  notes.forEach((hz, i) => tone(e, hz, { at: at + i * step, dur, gain, type: 'triangle', attack: 0.01 }));

const DRAW: Record<SoundKind, (e: Engine) => void> = {
  click: (e) => tone(e, 880, { dur: 0.04, gain: 0.04, type: 'triangle', to: 660 }),
  // Chuyển tab: một ting sin ngắn đi xuống, thay cho tiếng gió cũ.
  tab: (e) => {
    tone(e, 1318.5, { dur: 0.09, gain: 0.022, type: 'sine', to: 1174.66 });
    tone(e, 1760, { at: 0.035, dur: 0.07, gain: 0.01, type: 'sine' });
  },
  transition: (e) => {
    noise(e, { dur: 0.16, gain: 0.035, hz: 700, to: 2200, q: 0.7 });
    tone(e, 520, { dur: 0.12, gain: 0.02, to: 780 });
  },
  flip: (e) => {
    noise(e, { dur: 0.09, gain: 0.02, hz: 900, to: 2400, q: 0.6 });
    tone(e, 659.25, { dur: 0.12, gain: 0.035, type: 'sine', to: 783.99 });
    tone(e, 987.77, { at: 0.05, dur: 0.16, gain: 0.02, type: 'sine' });
  },
  correct: (e) => bell(e, [783.99, 1046.5], 0.09, 0.07, 0.26),
  wrong: (e) => {
    tone(e, 311, { dur: 0.14, gain: 0.1, to: 277 });
    tone(e, 233, { at: 0.12, dur: 0.26, gain: 0.1, to: 208 });
  },
};

/**
 * CỬA DUY NHẤT cho tiếng giao diện. Id lạ, mã không có nhóm âm (im), đang tắt tiếng,
 * âm lượng 0, chưa có cú chạm đầu tiên, hoặc cùng nhóm vừa kêu trong khoảng chống
 * dồn đều trả `false`.
 */
export function playSfx(id: string): boolean {
  if (!isSfxId(id)) return false;
  const kind = soundOf(id as SfxId);
  if (!kind) return false;
  const e = engine();
  if (!e || !gate.allow(id)) return false;
  try {
    DRAW[kind](e);
    return true;
  } catch {
    return false;
  }
}

// Nạp file này là đủ để các lối gọi `sfx.*` cũ có tiếng.
bindSfxPlayer(playSfx);
