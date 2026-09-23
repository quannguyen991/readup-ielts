import React from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';

/**
 * Bộ chuyển động dùng chung.
 *
 * BA QUY TẮC, cả ba đều nhằm giữ chuyển động ở mức KHÔNG AI ĐỂ Ý:
 *
 * 1. NGẮN. 180–280ms. Chuyển cảnh dài hơn 300ms thì lần đầu thấy đẹp, lần thứ
 *    hai mươi thấy chậm — mà app học thì người dùng bấm qua lại cả trăm lần.
 * 2. ĐI XUỐNG MỘT ĐOẠN NGẮN, không trượt ngang. Trượt ngang gợi ý "quay lại
 *    được", mà phần lớn điều hướng ở đây không phải quan hệ trước/sau.
 * 3. XẾP LỚP CÓ TRẦN. Thẻ thứ n hiện chậm hơn thẻ trước 40ms nhưng KHÔNG quá
 *    240ms — lưới 60 thẻ mà xếp lớp đều thì thẻ cuối đợi 2,4 giây.
 *
 * KHÔNG DÙNG `entering=` (layout animation) của Reanimated. Trên web nó đặt
 * `visibility: hidden; position: absolute` lên phần tử để đo trước khi chạy, và
 * ở app này bước đo đó không bao giờ kết thúc — cả trang trắng bóc, không lỗi
 * console, sidebar vẫn hiện vì nằm ngoài vùng bọc. Hiệu ứng dưới đây tự chạy
 * bằng shared value nên chỉ là style nội tuyến: web và native giống hệt nhau,
 * và trạng thái xấu nhất khi JS hỏng cũng chỉ là mất hiệu ứng, không mất nội dung.
 */

/** Thời lượng chuẩn, dùng chung để mọi thứ trong app cùng một nhịp. */
export const MOTION = {
  page: 240,
  item: 220,
  press: 110,
  /** Khoảng lệch giữa hai phần tử liền nhau khi xếp lớp. */
  stagger: 40,
  /** Trần tổng độ trễ khi xếp lớp. */
  staggerCap: 240,
} as const;

/**
 * Chạy 0 → 1 một lần khi gắn vào cây, rồi trả ra style mờ dần + nhích lên.
 *
 * Tôn trọng "giảm chuyển động" của hệ điều hành: bật thì nhảy thẳng tới 1, nội
 * dung hiện ngay chứ không phải hiện chậm hơn.
 */
function useEnter(delay: number, duration: number, lift: number) {
  const reduced = useReducedMotion();
  const t = useSharedValue(reduced ? 1 : 0);

  React.useEffect(() => {
    if (reduced) {
      t.value = 1;
      return;
    }
    t.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.cubic) }));
    // Chỉ chạy một lần cho mỗi lần gắn; đổi hiệu ứng giữa chừng là giật.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * lift }],
  }));
}

/**
 * Bọc nội dung một trang. Đổi `routeKey` là chạy lại hiệu ứng vào.
 *
 * Dùng ở layout gốc với key là đường dẫn, nên mỗi lần đổi trang là một lần nội
 * dung mờ dần lên — đủ để mắt biết "vừa sang chỗ khác" mà không phải chờ.
 */
export function PageTransition({
  routeKey,
  children,
}: {
  routeKey: string;
  children: React.ReactNode;
}) {
  // `key` nằm ở đây chứ không ở trong: đổi key là dựng lại `Enter`, tức là chạy
  // lại effect. Không có nó thì hiệu ứng chỉ chạy đúng một lần lúc mở app.
  return (
    <Enter key={routeKey} duration={MOTION.page} lift={10} style={{ flex: 1 }}>
      {children}
    </Enter>
  );
}

/**
 * Phần tử hiện dần khi vào màn hình, có thể xếp lớp theo `index`.
 *
 * `index` là vị trí trong danh sách, không phải số mili giây — nơi gọi không
 * phải tự tính độ trễ, và trần chống-chờ nằm ở một chỗ duy nhất.
 */
export function Appear({
  index = 0,
  duration = MOTION.item,
  style,
  children,
}: {
  index?: number;
  duration?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  return (
    <Enter
      delay={Math.min(index * MOTION.stagger, MOTION.staggerCap)}
      duration={duration}
      lift={8}
      style={style}
    >
      {children}
    </Enter>
  );
}

/**
 * Hiện dần tại chỗ, không dịch chuyển — dùng cho nội dung đổi trong cùng một khung.
 *
 * `style` cho trường hợp bọc cả một màn toàn khung (câu tiếp theo của bài luyện):
 * thiếu `flex: 1` thì màn bên trong co về chiều cao nội dung và nền lưới hụt đáy.
 */
export function CrossFade({
  swapKey,
  style,
  children,
}: {
  swapKey: string;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  return (
    <Enter key={swapKey} duration={MOTION.item} lift={0} style={style}>
      {children}
    </Enter>
  );
}

function Enter({
  delay = 0,
  duration,
  lift,
  style,
  children,
}: {
  delay?: number;
  duration: number;
  lift: number;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  const animated = useEnter(delay, duration, lift);
  return (
    <Animated.View style={[style, animated as AnimatedStyle<ViewStyle>]}>{children}</Animated.View>
  );
}

/**
 * Vùng bấm có phản hồi thu nhỏ.
 *
 * Thu 2% là con số cố ý nhỏ: đủ để ngón tay thấy máy đã nhận lệnh, không đủ để
 * thành hiệu ứng. Thẻ nội dung co rúm lại mỗi lần chạm là thứ gây mệt sau vài
 * chục lần bấm.
 */
export function PressScale({
  children,
  style,
  fill,
  ...rest
}: PressableProps & {
  children: React.ReactNode;
  style?: ViewStyle;
  /**
   * Vùng bấm lấp đầy khung (đặt `style={{ flex: 1 }}` cho khung). Dùng trong
   * lưới cần các thẻ cùng hàng cao bằng nhau: không có nó, lớp Pressable ở giữa
   * cao theo nội dung và thẻ bên trong không kéo giãn theo hàng được.
   */
  fill?: boolean;
}) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[style, animated as AnimatedStyle<ViewStyle>]}>
      {/*
        Gán thẳng vào `.value` là cách duy nhất để đổi shared value của
        Reanimated; luật `react-hooks/immutability` không biết kiểu này nên báo
        nhầm. Tắt đúng hai dòng, không tắt cả file.
      */}
      <Pressable
        {...rest}
        style={fill ? { flex: 1 } : undefined}
        onPressIn={(e) => {
          // eslint-disable-next-line react-hooks/immutability
          if (!reduced) scale.value = withTiming(0.98, { duration: MOTION.press });
          rest.onPressIn?.(e);
        }}
        onPressOut={(e) => {
          // eslint-disable-next-line react-hooks/immutability
          if (!reduced) scale.value = withTiming(1, { duration: MOTION.press });
          rest.onPressOut?.(e);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
