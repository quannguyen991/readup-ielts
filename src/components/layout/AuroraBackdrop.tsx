import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Nền loang: những khối sáng lớn trôi chậm trên gradient xanh → tím.
 *
 * THAY CHO NỀN KẺ Ô Ở CÁC MÀN ĐỂ NHÌN. Lưới caro làm tốt việc của nó ở màn ĐANG
 * GÕ — nó gợi tờ giấy kẻ, và giấy kẻ là chỗ để viết. Nhưng ở màn giới thiệu và
 * các banner, cùng cái lưới ấy lại băm mặt nền thành hàng nghìn ô nhỏ ngay sau
 * tiêu đề, khiến chữ phải cạnh tranh với hoạ tiết. Khối loang thì ngược lại: lớn,
 * mờ, không có cạnh, nên mắt lướt qua mà vẫn thấy nền "có gì đó".
 *
 * HAI NỀN TẢNG DÙNG HAI CƠ CHẾ:
 *
 *   · Web    — CSS keyframes.
 *   · Native — `useFrameCallback` của Reanimated.
 *
 * Trên web, CSS keyframes là cách đúng cho một chuyển động TRANG TRÍ lặp vô hạn:
 * trình duyệt chạy nó ngoài luồng chính, tự đóng băng khi tab bị ẩn, và tự tôn
 * trọng `prefers-reduced-motion` qua media query — ba thứ mà bộ dẫn động chạy
 * bằng JavaScript đều phải tự làm lấy, và thường quên làm.
 *
 * MỘT GHI CHÚ ĐỂ NGƯỜI SAU KHỎI ĐUỔI THEO CON MA GIỐNG TÔI: lúc đo, cả
 * `withRepeat` lẫn `useFrameCallback` đều hiện ra là "đứng yên" — transform của
 * bốn khối nằm nguyên ở `matrix(0.94, 0, 0, 0.94, -46, -30)` suốt nhiều giây.
 * Nguyên nhân KHÔNG phải Reanimated: khung xem trình duyệt lúc ấy đang ẩn
 * (`document.visibilityState === 'hidden'`), mà tab ẩn thì trình duyệt đóng băng
 * mọi animation — `document.getAnimations()` báo `playState: 'running'` nhưng
 * `currentTime` đứng ở 0. Muốn kiểm chuyển động trong tab ẩn thì phải tự đẩy
 * `currentTime` rồi đọc lại transform.
 *
 * Bốn khối có CHU KỲ LỆCH NHAU và không chia hết cho nhau (17/23/29/37 giây).
 * Chu kỳ bằng nhau thì chúng gặp lại nhau đều đặn và mắt bắt ngay ra vòng lặp.
 */

/**
 * Trời đêm, không phải nền xanh dương.
 *
 * Bản trước lấy xanh dương đậm → chàm → tím (#1E3A9E → #3B3BBF → #6D28D9). Nền
 * ấy đủ tối cho chữ trắng, nhưng nó SÁNG NGANG với các dải sáng vẽ đè lên, nên
 * bốn dải chìm nghỉm và cả khối đọc ra thành một mảng gradient phẳng.
 *
 * Cực quang chỉ hiện ra khi có trời đêm để hiện lên. Hạ nền xuống gần đen mực
 * rồi mới có chỗ cho dải sáng.
 */
const BASE_STOPS = ['#080C2A', '#161046', '#2A1152'] as const;

type Blob = {
  color: string;
  /**
   * Tâm và bán kính, tính trên khung 100×100 của `viewBox`.
   *
   * Dùng SỐ chứ không dùng chuỗi '20%': phép `rotate(góc cx cy)` của SVG cần toạ
   * độ số, và `viewBox` + `preserveAspectRatio="none"` vẫn cho co giãn theo mọi
   * khổ màn y như phần trăm.
   */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  opacity: number;
  /** Biên độ trôi, tính bằng điểm ảnh. */
  driftX: number;
  driftY: number;
  seconds: number;
  /** Nghiêng dải, tính bằng độ. Dải nằm ngang thì không ra cực quang. */
  tilt?: number;
};

/*
  DẢI, KHÔNG PHẢI QUẦNG.

  Bốn khối cũ đều gần tròn (rx ≈ ry), và bốn quầng tròn mờ chồng lên nhau thì ra
  gradient lưới — thứ có ở mọi trang chủ. Cực quang đọc ra được là nhờ HÌNH DẠNG:
  dải dài, mỏng, nghiêng, chồng chéo nhau ở các góc khác nhau.

  Nên ba dải chính đều rất bẹt (rx gấp 2–3 lần ry) và nghiêng khác nhau, còn hai
  quầng tròn giữ lại chỉ để làm nền ấm phía sau, mờ hơn hẳn.

  Màu lấy đúng dải cực quang thật — lục lam, xanh ngọc, tím, hồng — chứ không lấy
  bốn sắc độ của cùng một màu thương hiệu. Bốn sắc độ cùng màu thì dù đậm tới đâu
  vẫn đọc ra là một mảng.
*/
const BLOBS: Blob[] = [
  { color: '#22D3EE', cx: 26, cy: 20, rx: 62, ry: 22, opacity: 0.55, driftX: 52, driftY: 26, seconds: 17, tilt: -18 },
  { color: '#34D399', cx: 70, cy: 32, rx: 54, ry: 18, opacity: 0.4, driftX: -44, driftY: 34, seconds: 23, tilt: 12 },
  { color: '#A855F7', cx: 58, cy: 76, rx: 68, ry: 26, opacity: 0.62, driftX: 38, driftY: -30, seconds: 29, tilt: -9 },
  { color: '#F472B6', cx: 14, cy: 88, rx: 46, ry: 20, opacity: 0.34, driftX: -32, driftY: -24, seconds: 37, tilt: 16 },
  { color: '#6366F1', cx: 88, cy: 62, rx: 40, ry: 40, opacity: 0.3, driftX: 26, driftY: 30, seconds: 31 },
];

const STYLE_TAG_ID = 'aurora-backdrop-keyframes';

/**
 * Nhồi keyframes vào trang MỘT LẦN cho cả app.
 *
 * Mỗi khối có quãng trôi riêng nên cần keyframes riêng; dựng sẵn cả bốn ngay lần
 * đầu thay vì mỗi lần gắn một khối lại chèn thêm một thẻ style.
 *
 * Khối `prefers-reduced-motion` nằm ngay trong CSS: người bật tuỳ chọn đó muốn
 * bớt chuyển động, và cách rẻ nhất để tôn trọng họ là để trình duyệt tự lo.
 */
function ensureKeyframes(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById(STYLE_TAG_ID)) return;

  const rules = BLOBS.map(
    (b, i) => `
@keyframes aurora-drift-${i} {
  from { transform: translate(${-b.driftX}px, ${-b.driftY}px) scale(0.94); }
  to   { transform: translate(${b.driftX}px, ${b.driftY}px) scale(1.06); }
}`,
  ).join('\n');

  const el = document.createElement('style');
  el.id = STYLE_TAG_ID;
  el.textContent = `${rules}
@media (prefers-reduced-motion: reduce) {
  [data-aurora-blob] { animation: none !important; }
}`;
  document.head.appendChild(el);
}

export function AuroraBackdrop({
  colors = BASE_STOPS,
  children,
}: {
  colors?: readonly string[];
  children?: React.ReactNode;
}) {
  useEffect(ensureKeyframes, []);

  return (
    <View className="flex-1" style={{ backgroundColor: colors[0] }}>
      {/* `overflow: hidden`: vệt loang trôi bằng transform có lúc dạt ra ngoài mép — không cắt thì trang sinh thanh cuộn ngang lúc có lúc không. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <LinearGradient
          colors={[...colors] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {BLOBS.map((blob, i) => (
          <DriftingBlob key={i} blob={blob} index={i} />
        ))}
      </View>
      {children}
    </View>
  );
}

const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

function DriftingBlob({ blob, index }: { blob: Blob; index: number }) {
  if (Platform.OS === 'web') return <WebBlob blob={blob} index={index} />;
  return <NativeBlob blob={blob} index={index} />;
}

function WebBlob({ blob, index }: { blob: Blob; index: number }) {
  return (
    <View
      pointerEvents="none"
      // `dataSet` là đường của react-native-web để đặt data-* — dùng cho luật
      // `prefers-reduced-motion` ở trên.
      {...({ dataSet: { auroraBlob: String(index) } } as Record<string, unknown>)}
      style={[
        FILL,
        {
          animationName: `aurora-drift-${index}`,
          animationDuration: `${blob.seconds}s`,
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDirection: 'alternate',
          // Lệch pha để bốn khối không cùng xuất phát ở một mốc.
          animationDelay: `${-index * 3.1}s`,
        } as Record<string, unknown>,
      ]}
    >
      <BlobShape blob={blob} index={index} />
    </View>
  );
}

function NativeBlob({ blob, index }: { blob: Blob; index: number }) {
  const t = useSharedValue(0.5);
  const reduced = useReducedMotion();

  useFrameCallback((frame) => {
    'worklet';
    const phase = index * 1.7;
    t.value =
      0.5 + 0.5 * Math.sin((frame.timeSinceFirstFrame / (blob.seconds * 1000)) * Math.PI * 2 + phase);
  }, !reduced);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: (t.value - 0.5) * 2 * blob.driftX },
      { translateY: (t.value - 0.5) * 2 * blob.driftY },
      // Phình nhẹ theo, để khối trông như đang thở chứ không như bị kéo lê.
      { scale: 1 + (t.value - 0.5) * 0.12 },
    ],
  }));

  return (
    <Animated.View style={[FILL, style]} pointerEvents="none">
      <BlobShape blob={blob} index={index} />
    </Animated.View>
  );
}

/*
  Nghiêng dải bằng cách xoay LỚP BỌC, không xoay hình trong SVG.

  `rotation` + `origin` trên `<Ellipse>` là API của react-native-svg cho native;
  trên web nó rơi thẳng xuống DOM và trình duyệt kêu `Invalid DOM property
  'transform-origin'`. Xoay ở View thì cả hai nền tảng cùng hiểu, và cũng không
  đụng vào transform mà lớp chuyển động bên ngoài đang dùng để trôi.
*/
function BlobShape({ blob, index }: { blob: Blob; index: number }) {
  const gradientId = `aurora-blob-${index}`;
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id={gradientId} cx="0.5" cy="0.5" r="0.5">
          <Stop offset={0} stopColor={blob.color} stopOpacity={blob.opacity} />
          <Stop offset={0.55} stopColor={blob.color} stopOpacity={blob.opacity * 0.45} />
          <Stop offset={1} stopColor={blob.color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse
        cx={blob.cx}
        cy={blob.cy}
        rx={blob.rx}
        ry={blob.ry}
        fill={`url(#${gradientId})`}
        transform={blob.tilt ? `rotate(${blob.tilt} ${blob.cx} ${blob.cy})` : undefined}
      />
    </Svg>
  );
}
