import React, { useEffect } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { color } from '@/theme/tokens';

/**
 * Nền xanh tím loang chuyển động chậm, nằm dưới toàn bộ nội dung.
 *
 * BA RÀNG BUỘC ĐỊNH HÌNH CÁCH LÀM:
 *
 * 1. KHÔNG ĐƯỢC LÀM KHÓ ĐỌC. Đây là app đọc hiểu — người dùng nhìn chữ hàng giờ.
 *    Nên các vệt màu để rất nhạt và cực lớn: nhìn ra là nền có màu, nhưng không
 *    có mép nào cắt qua dòng chữ. Vệt nhỏ và đậm sẽ đẹp trong ảnh chụp và mệt
 *    mắt sau mười phút.
 *
 * 2. ANIMATE BẰNG TRANSFORM, không animate thuộc tính SVG. Transform được trình
 *    duyệt và native đẩy xuống GPU nên chạy mượt cả trên máy yếu; đổi `cx`/`cy`
 *    của SVG bắt vẽ lại gradient mỗi khung hình, và đây là nền nằm dưới MỌI
 *    trang nên tốn kém ở đây là tốn kém ở khắp nơi.
 *
 * 3. TRÊN WEB DÙNG CSS, TRÊN NATIVE DÙNG REANIMATED. Bản đầu dùng Reanimated cho
 *    cả hai, và trên web nó CHẠY ĐƯỢC MỘT ĐOẠN RỒI ĐỨNG: đo trên bản deploy
 *    thật, transform nhích từ -110px tới 4,14px rồi giữ nguyên qua năm lần lấy
 *    mẫu, kể cả khi tab đang ở trước. `withRepeat` vô hạn ở đây phụ thuộc vòng
 *    lặp requestAnimationFrame của Reanimated, mà vòng đó không hồi lại sau khi
 *    tab bị ẩn — và một cái nền thì tab bị ẩn là chuyện xảy ra suốt.
 *
 *    CSS keyframes do chính trình duyệt chạy: nó tự dừng khi tab ẩn, tự chạy
 *    tiếp khi hiện, không tốn gì trên luồng JS. Với hiệu ứng thuần trang trí thì
 *    đó mới là công cụ đúng. Native không có CSS nên vẫn dùng Reanimated, ở đó
 *    vòng lặp chạy ổn định.
 *
 *    (Vẫn giữ nguyên luật cũ: KHÔNG dùng `entering=` của Reanimated trên web —
 *    nó để lại `visibility: hidden` và làm trắng cả trang.)
 */

/** Một vệt màu: to hơn màn hình nhiều lần để không bao giờ thấy mép. */
type Blob = {
  tint: string;
  /** Vị trí neo theo tỉ lệ màn hình, để nền cân ở mọi khổ. */
  x: number;
  y: number;
  size: number;
  /** Biên độ trôi tính theo px. */
  driftX: number;
  driftY: number;
  /** Một vòng trôi mất bao lâu. Số lẻ nhau để các vệt không bao giờ khớp nhịp. */
  durationMs: number;
  opacity: number;
};

/*
  Kích thước và độ đậm chỉnh theo mắt nhìn trên bản deploy thật, qua ba vòng.

  VÒNG 1 quá nhạt (0.12-0.22): phải nhân bốn lần trong DevTools mới thấy có màu.

  VÒNG 2 đậm hơn nhưng SAI KIỂU: bốn vệt đều to hơn cả màn hình (size 0.9-1.3)
  nên chồng lên nhau khắp nơi và hoà thành MỘT LỚP MÀU ĐỀU. Đậm thêm chỉ làm cả
  trang ngả tím chứ không ra vết.

  VÒNG 3 — bản này: vệt NHỎ LẠI còn khoảng nửa màn hình, lõi đậm hơn hẳn, rìa
  tắt nhanh hơn. Nhỏ lại mới là thay đổi quyết định: có chỗ vệt phủ thì mới có
  chỗ KHÔNG phủ, và chính khoảng trắng giữa chúng làm mắt đọc ra "vết loang"
  thay vì "nền màu". Đậm mà không chừa khoảng trắng thì vẫn không thành vết.
*/
const BLOBS: Blob[] = [
  { tint: color.primary, x: 0.14, y: 0.1, size: 0.62, driftX: 130, driftY: 90, durationMs: 17_000, opacity: 0.75 },
  { tint: color.accent, x: 0.86, y: 0.16, size: 0.56, driftX: -115, driftY: 110, durationMs: 21_000, opacity: 0.72 },
  { tint: '#CDA45E', x: 0.62, y: 0.62, size: 0.7, driftX: 100, driftY: -100, durationMs: 26_000, opacity: 0.55 },
  { tint: '#CEA662', x: 0.1, y: 0.74, size: 0.5, driftX: 120, driftY: -80, durationMs: 31_000, opacity: 0.5 },
  { tint: '#D5B377', x: 0.44, y: 0.94, size: 0.48, driftX: -90, driftY: -95, durationMs: 23_000, opacity: 0.45 },
];

const KEYFRAMES_ID = 'aurora-keyframes';

/**
 * Nhét keyframes vào trang một lần duy nhất.
 *
 * Mỗi vệt cần một quỹ đạo riêng nên phải sinh keyframes theo tham số, không
 * dùng chung một cái được. Viết thẳng vào <style> thay vì dùng thư viện CSS-in-JS
 * để không thêm phụ thuộc chỉ vì một hiệu ứng nền.
 */
function ensureKeyframes() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;

  const rules = BLOBS.map((b, i) => {
    // Đi từ một đầu quỹ đạo sang đầu kia; `alternate` lo phần quay về, nên
    // không cần khai chặng giữa và cũng không bị khựng ở điểm đảo chiều.
    return `@keyframes aurora-drift-${i} {
      from { transform: translate(${-b.driftX}px, ${-b.driftY}px) scale(0.92); }
      to   { transform: translate(${b.driftX}px, ${b.driftY}px) scale(1.08); }
    }`;
  }).join('\n');

  /*
    Người bật "giảm chuyển động" trong hệ điều hành thì nền đứng yên, nhưng VẪN
    GIỮ MÀU — họ tắt chuyển động, không phải tắt thiết kế.
  */
  const reducedMotion = `@media (prefers-reduced-motion: reduce) {
      .aurora-blob { animation: none !important; }
    }`;

  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `${rules}
${reducedMotion}`;
  document.head.appendChild(style);
}

function AuroraBlob({
  blob,
  index,
  screen,
}: {
  blob: Blob;
  index: number;
  screen: { width: number; height: number };
}) {
  const progress = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    if (reduced) {
      // Đứng yên ở giữa quỹ đạo: vẫn ra đúng bố cục màu, chỉ bỏ phần chuyển động.
      progress.value = 0.5;
      return;
    }

    progress.value = withRepeat(
      withTiming(1, { duration: blob.durationMs, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [blob.durationMs, progress, reduced]);

  const animatedStyle = useAnimatedStyle(() => {
    // progress 0→1 ánh xạ thành -1→1 để vệt trôi qua lại quanh điểm neo.
    const t = progress.value * 2 - 1;
    return {
      transform: [
        { translateX: t * blob.driftX },
        { translateY: t * blob.driftY },
        // Phình nhẹ theo nhịp trôi, đủ để mảng màu "loang" chứ không phải trượt cả khối.
        { scale: 1 + t * 0.08 },
      ],
    };
  });

  // Vệt lấy cạnh dài của màn hình làm gốc, nên trên điện thoại dọc nó vẫn phủ
  // hết bề ngang thay vì co thành một chấm.
  const diameter = Math.max(screen.width, screen.height) * blob.size;

  const box = {
    position: 'absolute' as const,
    left: screen.width * blob.x - diameter / 2,
    top: screen.height * blob.y - diameter / 2,
    width: diameter,
    height: diameter,
  };

  const svg = (
    <Svg width="100%" height="100%">
      <Defs>
        {/*
          Mỗi vệt một id RIÊNG. Trên web SVG dựng thành DOM thật, mà id trùng
          thì `url(#g)` luôn trỏ vào cái đầu tiên — bốn vệt sẽ ra cùng một màu
          và cả hiệu ứng xanh-tím biến mất, không kèm lỗi nào.
        */}
        <RadialGradient id={`aurora-${index}`} cx="50%" cy="50%" r="50%">
          {/*
            Bốn chốt, và HÌNH DẠNG của chúng mới là thứ tạo ra "vết".

            Lõi giữ gần nguyên độ đậm tới 28% bán kính — đó là phần mắt đọc ra
            là một vệt màu có thân. Từ đó tắt nhanh dần rồi về 0 hẳn ở rìa, nên
            vệt tan vào nền chứ không viền thành hình tròn.

            Hai chốt đầu-cuối tuyến tính thì ngược lại: không có lõi, chỉ có một
            quầng mờ đều — nhìn ra nền bị ám màu, không nhìn ra vết.
          */}
          <Stop offset="0%" stopColor={blob.tint} stopOpacity={blob.opacity} />
          <Stop offset="28%" stopColor={blob.tint} stopOpacity={blob.opacity * 0.82} />
          <Stop offset="62%" stopColor={blob.tint} stopOpacity={blob.opacity * 0.28} />
          <Stop offset="100%" stopColor={blob.tint} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#aurora-${index})`} />
    </Svg>
  );

  if (Platform.OS === 'web') {
    /*
      `div` thuần thay vì View: react-native-web không hứa chuyển tiếp các thuộc
      tính `animation*`, nên đi thẳng xuống DOM cho chắc. SVG bên trong vẫn là
      component bình thường, react-native-svg dựng ra <svg> thật trên web.

      `prefers-reduced-motion` xử bằng chính CSS ở dưới, không cần nhánh JS.
    */
    return React.createElement(
      'div',
      {
        className: 'aurora-blob',
        style: {
          ...box,
          pointerEvents: 'none',
          animationName: `aurora-drift-${index}`,
          animationDuration: `${blob.durationMs}ms`,
          animationIterationCount: 'infinite',
          animationDirection: 'alternate',
          animationTimingFunction: 'ease-in-out',
          willChange: 'transform',
        },
      },
      svg,
    );
  }

  return (
    <Animated.View pointerEvents="none" style={[box, animatedStyle]}>
      {svg}
    </Animated.View>
  );
}

/**
 * Đặt trong layout gốc, dưới mọi nội dung.
 *
 * `pointerEvents="none"` ở cả lớp ngoài lẫn từng vệt: nền phủ toàn màn hình nên
 * quên một chỗ là nuốt sạch cú bấm của cả app.
 */
export function AuroraBackground() {
  const { width, height } = useWindowDimensions();

  useEffect(ensureKeyframes, []);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {BLOBS.map((blob, i) => (
        <AuroraBlob key={i} blob={blob} index={i} screen={{ width, height }} />
      ))}
    </View>
  );
}
