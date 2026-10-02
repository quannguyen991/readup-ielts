/**
 * PHẦN THUẦN của bộ âm thanh — danh mục tiếng và cổng chặn (tắt tiếng, âm lượng,
 * chống kêu dồn). Không chạm Web Audio hay react-native nên test được trong Node.
 *
 * MỘT cửa duy nhất: `playSfx(id)` ở `sfx.ts`. Danh sách dưới đây là bảng
 * "sự kiện → mã tiếng"; thêm tiếng mới thì thêm một dòng ở đây VÀ một hàm vẽ ở
 * `sfx.ts` (TypeScript báo lỗi nếu thiếu một trong hai).
 *
 * | Sự kiện                                  | Mã tiếng           | Chỗ gọi                              |
 * | ---------------------------------------- | ------------------ | ------------------------------------ |
 * | Bấm nút / thẻ / liên kết (mọi màn)       | tap                | sfx-bindings (bắt click toàn app)    |
 * | Chọn một đáp án / lựa chọn               | select             | sfx-bindings (role radio/checkbox)   |
 * | Chuyển tab / chế độ                      | tab                | sfx-bindings (role tab)              |
 * | Đổi trang                                | nav                | sfx-bindings (đổi pathname)          |
 * | Mở / đóng hộp thoại, sheet, bài thi      | modalOpen/Close    | sfx-bindings (aria-modal xuất hiện)  |
 * | Lật thẻ từ                               | flip               | FlipCard                             |
 * | Sang câu / thẻ kế tiếp                   | next               | nút "tiếp" ở màn đọc theo / phát âm  |
 * | Quay lại / thoát                         | back               | sfx-bindings (nút Quay lại)          |
 * | Trả lời ĐÚNG / SAI (có game)             | sfx.correct…       | useGameStore.answer                  |
 * | Trả lời SAI ngoài trận đấu               | wrong              | màn tự chấm                          |
 * | Xong một bộ / bài                        | success            | Confetti                             |
 * | Điểm đọc ≥ 85 / 60–84 / < 60             | perfect/good/retry | useVoiceCoach                        |
 * | Nhận sao / xu                            | coin               | sfx-bindings (sự kiện stars)         |
 * | Nhận quà, nhận mốc                       | reward             | sfx-bindings (kho thưởng / hộ chiếu) |
 * | Lên cấp                                  | sfx.levelUp        | useGameStore                         |
 * | Chuỗi ngày học tăng                      | streak             | sfx-bindings                         |
 * | Thông báo / toast                        | toast, notify      | sfx-bindings (role alert / status)   |
 * | Bật / tắt micro                          | micStart/micStop   | shadow/speech, speaking/recognizer   |
 * | Đồng hồ thi: còn ít / hết giờ            | timerWarn/timerEnd | SatExamShell, RwRunner               |
 * | Du ngoạn: bước chân                      | step               | CityEngine                   |
 * | Du ngoạn: mở / đóng cửa                  | doorOpen/doorClose | CityEngine                   |
 * | Du ngoạn: vào / ra toà nhà               | enter/leave        | CityEngine                   |
 * | Du ngoạn: được vé                        | ticket             | sfx-bindings (useTravelStore)        |
 * | Du ngoạn: đóng dấu hộ chiếu              | stamp              | sfx-bindings (useTravelStore)        |
 * | Du ngoạn: nhận quà lưu niệm              | souvenir           | sfx-bindings (useTravelStore)        |
 * | Du ngoạn: zoom / toàn màn hình           | zoom/fullscreen    | scenes/fullscreen               |
 * | Du ngoạn: máy bay cất cánh               | takeoff            | sfx-bindings (đổi thành phố)         |
 * | Du ngoạn: NPC nói                        | npc                | CityEngine (khi hiện bóng thoại)     |
 * | Du ngoạn: bước chân người chơi           | step               | CityEngine (cách 2 bước, rất nhẹ)    |
 * | Du ngoạn: tắt toàn màn hình              | fullscreenOff      | scenes/fullscreen                    |
 * | Du ngoạn: cửa bị khoá                    | locked             | CityEngine.showLocked                |
 * | Du ngoạn: chủ quán chào                  | greet              | CityEngine.callHost                  |
 * | Du ngoạn: sang mảnh bản đồ khác          | seam               | CityEngine (rất nhẹ)                 |
 * | Du ngoạn: máy bay bay qua (sân bay)      | plane              | CityEngine (rất nhỏ, thưa)           |
 */
export const SFX_CATALOG = {
  tap: { debounce: 70, group: 'neutral' },
  select: { debounce: 90, group: 'neutral' },
  tab: { debounce: 90, group: 'neutral' },
  nav: { debounce: 400, group: 'neutral' },
  flip: { debounce: 150, group: 'neutral' },
  next: { debounce: 150, group: 'neutral' },
  back: { debounce: 150, group: 'neutral' },
  modalOpen: { debounce: 250, group: 'neutral' },
  modalClose: { debounce: 250, group: 'neutral' },
  toast: { debounce: 500, group: 'neutral' },
  notify: { debounce: 800, group: 'neutral' },
  wrong: { debounce: 250, group: 'fail' },
  retry: { debounce: 400, group: 'fail' },
  success: { debounce: 600, group: 'success' },
  perfect: { debounce: 600, group: 'success' },
  good: { debounce: 600, group: 'success' },
  coin: { debounce: 120, group: 'reward' },
  reward: { debounce: 500, group: 'reward' },
  streak: { debounce: 800, group: 'reward' },
  micStart: { debounce: 300, group: 'neutral' },
  micStop: { debounce: 300, group: 'neutral' },
  timerTick: { debounce: 400, group: 'neutral' },
  timerWarn: { debounce: 1500, group: 'fail' },
  timerEnd: { debounce: 2000, group: 'fail' },
  step: { debounce: 150, group: 'travel' },
  doorOpen: { debounce: 300, group: 'travel' },
  doorClose: { debounce: 300, group: 'travel' },
  enter: { debounce: 400, group: 'travel' },
  leave: { debounce: 400, group: 'travel' },
  ticket: { debounce: 300, group: 'travel' },
  stamp: { debounce: 500, group: 'travel' },
  souvenir: { debounce: 500, group: 'travel' },
  zoom: { debounce: 150, group: 'travel' },
  fullscreen: { debounce: 300, group: 'travel' },
  takeoff: { debounce: 1500, group: 'travel' },
  npc: { debounce: 70, group: 'travel' },
  fullscreenOff: { debounce: 300, group: 'travel' },
  locked: { debounce: 800, group: 'travel' },
  greet: { debounce: 600, group: 'travel' },
  seam: { debounce: 1500, group: 'travel' },
  plane: { debounce: 8000, group: 'travel' },
} as const;

export type SfxId = keyof typeof SFX_CATALOG;

export function isSfxId(id: unknown): id is SfxId {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(SFX_CATALOG, id);
}

/** Âm lượng 0–1; giá trị lạ (NaN, âm, > 1) được kẹp lại. */
export function clampVolume(v: number): number {
  if (!Number.isFinite(v)) return 0.8;
  return Math.max(0, Math.min(1, v));
}

/**
 * Cổng cho `playSfx`: id lạ, đang tắt tiếng, âm lượng 0, hay cùng một tiếng kêu
 * lại trong khoảng chống dồn thì không cho phát. `now` tiêm vào để test.
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
      const t = now();
      if (t - (last.get(id) ?? -Infinity) < SFX_CATALOG[id].debounce) return false;
      last.set(id, t);
      return true;
    },
  };
}
