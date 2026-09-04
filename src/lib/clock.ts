import { useSyncExternalStore } from 'react';

/**
 * Đồng hồ dùng chung cho những chỗ CẦN "bây giờ là mấy giờ" NGAY TRONG LÚC RENDER.
 *
 * Vì sao không gọi thẳng `Date.now()` trong thân component hay trong `useMemo`:
 * render phải thuần tuý — cùng props, cùng state thì phải ra cùng kết quả. Gọi
 * `Date.now()` ở đó phá giao kèo ấy, và React Compiler bắt đúng lỗi này. Nó không
 * phải lỗi hình thức: khi compiler ghi nhớ kết quả một khối render, cái mốc thời
 * gian bị đông cứng lại ở lần chạy đầu, còn danh sách "thẻ đến hạn" hay "30 ngày
 * gần đây" thì đứng im cho tới khi có thứ khác vô tình bắt render lại.
 *
 * Cách làm ở đây đảo ngược hướng dữ liệu: mốc thời gian nằm ngoài React, React
 * chỉ ĐỌC bản chụp gần nhất (`getSnapshot` trả về đúng một giá trị đã lưu, nên
 * thuần tuý), và cứ mỗi nhịp thì đồng hồ tự báo cho các component đang nghe.
 *
 * Đổi lại còn được một thứ vốn đang thiếu: giao diện tự cập nhật theo thời gian
 * thật. Trước đây mở tab "Ôn tập" rồi để đó, thẻ tới hạn lúc 9h01 vẫn không hiện
 * ra cho tới khi người dùng bấm vào đâu đó.
 *
 * Nhịp mặc định là một phút. Không nhanh hơn: mọi chỗ dùng đồng hồ này đều đo
 * bằng ngày hoặc bằng phút, đập render mỗi giây chỉ tốn pin.
 */

const DEFAULT_TICK_MS = 60_000;

type Clock = {
  now: number;
  listeners: Set<() => void>;
  timer: ReturnType<typeof setInterval> | null;
  /**
   * Hàm đăng ký, dựng MỘT LẦN rồi giữ nguyên tham chiếu.
   *
   * `useSyncExternalStore` so sánh `subscribe` bằng tham chiếu: đưa cho nó một
   * hàm mới sau mỗi lần render thì lần render nào cũng gỡ rồi gắn lại listener.
   */
  subscribe: (onChange: () => void) => () => void;
};

/** Một đồng hồ cho mỗi nhịp — hai component cùng nhịp thì dùng chung một timer. */
const clocks = new Map<number, Clock>();

function clockFor(tickMs: number): Clock {
  const existing = clocks.get(tickMs);
  if (existing) return existing;

  const clock: Clock = {
    now: Date.now(),
    listeners: new Set(),
    timer: null,
    subscribe: () => () => undefined,
  };

  // Timer chỉ chạy khi CÓ người nghe, và dừng hẳn khi người cuối cùng rời đi —
  // một `setInterval` mức module chạy vĩnh viễn sẽ giữ tiến trình test không
  // thoát và ngốn pin ở những màn không hề quan tâm tới thời gian.
  clock.subscribe = (onChange: () => void) => {
    clock.listeners.add(onChange);

    if (clock.timer === null) {
      clock.timer = setInterval(() => {
        clock.now = Date.now();
        for (const listener of clock.listeners) listener();
      }, tickMs);
    }

    return () => {
      clock.listeners.delete(onChange);
      if (clock.listeners.size === 0 && clock.timer !== null) {
        clearInterval(clock.timer);
        clock.timer = null;
      }
    };
  };

  clocks.set(tickMs, clock);
  return clock;
}

/**
 * Mốc thời gian hiện tại, đọc được trong lúc render mà không phá tính thuần tuý.
 *
 * `getServerSnapshot` trả về cùng giá trị: bản dựng tĩnh không có đồng hồ chạy,
 * và trả về một con số khác với lần hydrate đầu tiên sẽ làm lệch cây DOM.
 */
export function useNow(tickMs: number = DEFAULT_TICK_MS): number {
  const clock = clockFor(tickMs);
  const getSnapshot = () => clock.now;
  return useSyncExternalStore(clock.subscribe, getSnapshot, getSnapshot);
}

/**
 * Lối vào cho test — không dùng trong mã chạy thật.
 *
 * Phần đáng kiểm của đồng hồ là vòng đời timer, mà thứ đó nằm ngoài React; phơi
 * ra ở đây để test chạy được bằng `node:test` thuần, không cần dựng cây React.
 */
export const __clockInternals = { clockFor };
