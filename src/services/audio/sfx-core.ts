/**
 * PHẦN THUẦN của bộ âm thanh — danh mục tiếng và cổng chặn (tắt tiếng, âm lượng,
 * chống kêu dồn). Không chạm Web Audio hay react-native nên test được trong Node.
 *
 * Toàn app chỉ còn BỐN nhóm âm thanh:
 *   - đúng / sai  (correct, wrong)  — một nhóm, hai sắc: đúng đi lên, sai đi xuống;
 *   - lật         (flip)            — lật thẻ, lật bài;
 *   - chuyển      (transition)      — đổi trang, mở / đóng hộp thoại, vào / ra cửa;
 *   - click       (click)           — bấm nút, chọn, chuyển tab, quay lại.
 * Mỗi mã tiếng trong `SFX_CATALOG` trỏ tới đúng một nhóm qua trường `sound`. Mã nào
 * `sound: null` thì im — đó là chủ ý, không phải thiếu sót.
 *
 * MỘT cửa duy nhất: `playSfx(id)` ở `sfx-ui.ts`. Thêm tiếng mới thì thêm một dòng
 * ở đây; nếu nhóm mới thì thêm hàm vẽ ở `sfx-ui.ts` (TypeScript báo nếu thiếu).
 */

export type SoundKind = 'correct' | 'wrong' | 'flip' | 'transition' | 'click';

/** Bốn nhóm âm thanh của app. `correct` và `wrong` cùng một nhóm "đúng / sai". */
export const SOUND_FAMILY: Record<SoundKind, 'đúng-sai' | 'lật' | 'chuyển' | 'click'> = {
  correct: 'đúng-sai',
  wrong: 'đúng-sai',
  flip: 'lật',
  transition: 'chuyển',
  click: 'click',
};

export const SFX_CATALOG = {
  tap: { debounce: 70, group: 'neutral', sound: 'click' },
  select: { debounce: 90, group: 'neutral', sound: 'click' },
  tab: { debounce: 90, group: 'neutral', sound: 'click' },
  back: { debounce: 150, group: 'neutral', sound: 'click' },
  next: { debounce: 150, group: 'neutral', sound: 'click' },
  micStart: { debounce: 300, group: 'neutral', sound: 'click' },
  micStop: { debounce: 300, group: 'neutral', sound: 'click' },
  nav: { debounce: 400, group: 'neutral', sound: 'transition' },
  modalOpen: { debounce: 250, group: 'neutral', sound: 'transition' },
  modalClose: { debounce: 250, group: 'neutral', sound: 'transition' },
  flip: { debounce: 150, group: 'neutral', sound: 'flip' },
  correct: { debounce: 250, group: 'success', sound: 'correct' },
  success: { debounce: 600, group: 'success', sound: 'correct' },
  perfect: { debounce: 600, group: 'success', sound: 'correct' },
  good: { debounce: 600, group: 'success', sound: 'correct' },
  wrong: { debounce: 250, group: 'fail', sound: 'wrong' },
  retry: { debounce: 400, group: 'fail', sound: 'wrong' },
  toast: { debounce: 500, group: 'neutral', sound: null },
  notify: { debounce: 800, group: 'neutral', sound: null },
  timerTick: { debounce: 400, group: 'neutral', sound: null },
  timerWarn: { debounce: 1500, group: 'fail', sound: null },
  timerEnd: { debounce: 2000, group: 'fail', sound: null },
  coin: { debounce: 120, group: 'reward', sound: null },
  reward: { debounce: 500, group: 'reward', sound: null },
  streak: { debounce: 800, group: 'reward', sound: null },
  step: { debounce: 150, group: 'travel', sound: null },
  doorOpen: { debounce: 300, group: 'travel', sound: 'transition' },
  doorClose: { debounce: 300, group: 'travel', sound: 'transition' },
  enter: { debounce: 400, group: 'travel', sound: 'transition' },
  leave: { debounce: 400, group: 'travel', sound: 'transition' },
  ticket: { debounce: 300, group: 'travel', sound: null },
  stamp: { debounce: 500, group: 'travel', sound: null },
  souvenir: { debounce: 500, group: 'travel', sound: null },
  zoom: { debounce: 150, group: 'travel', sound: 'transition' },
  fullscreen: { debounce: 300, group: 'travel', sound: 'transition' },
  fullscreenOff: { debounce: 300, group: 'travel', sound: 'transition' },
  takeoff: { debounce: 1500, group: 'travel', sound: 'transition' },
  npc: { debounce: 70, group: 'travel', sound: null },
  locked: { debounce: 800, group: 'travel', sound: null },
  greet: { debounce: 600, group: 'travel', sound: null },
  seam: { debounce: 1500, group: 'travel', sound: null },
  plane: { debounce: 8000, group: 'travel', sound: null },
  train: { debounce: 20000, group: 'travel', sound: null },
} as const;

export type SfxId = keyof typeof SFX_CATALOG;

export function isSfxId(id: unknown): id is SfxId {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(SFX_CATALOG, id);
}

/** Nhóm âm thanh của một mã tiếng; `null` nghĩa là im. */
export function soundOf(id: SfxId): SoundKind | null {
  return SFX_CATALOG[id].sound;
}

/** Âm lượng 0–1; giá trị lạ (NaN, âm, > 1) được kẹp lại. */
export function clampVolume(v: number): number {
  if (!Number.isFinite(v)) return 0.8;
  return Math.max(0, Math.min(1, v));
}

/**
 * Cổng cho `playSfx`: id lạ, đang tắt tiếng, âm lượng 0, hay cùng một NHÓM âm thanh
 * vừa kêu trong khoảng chống dồn thì không cho phát. Chống theo nhóm (không theo mã)
 * để "đúng" từ màn học và "đúng" từ luật game không thành hai tiếng chồng nhau.
 * `now` tiêm vào để test.
 */
export function createSfxGate(now: () => number = Date.now) {
  let muted = false;
  let volume = 0.8;
  const last = new Map<string, number>();
  return {
    setMuted(v: boolean) {
      muted = v;
    },
    isMuted: () => muted,
    setVolume(v: number) {
      volume = clampVolume(v);
    },
    getVolume: () => volume,
    allow(id: string): boolean {
      if (!isSfxId(id) || muted || volume <= 0) return false;
      const sound = SFX_CATALOG[id].sound;
      if (!sound) return false;
      const t = now();
      if (t - (last.get(sound) ?? -Infinity) < SFX_CATALOG[id].debounce) return false;
      last.set(sound, t);
      return true;
    },
  };
}
