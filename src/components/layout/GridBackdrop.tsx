import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Pattern, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * Nền giấy kẻ ô, tông xanh dương loang sang tím.
 *
 * Ba lớp chồng lên nhau, vẽ trong CÙNG MỘT thẻ `<Svg>`:
 *
 *   1. Nền chuyển màu chéo xanh → chàm → tím.
 *   2. Hai vệt loang tròn mờ (một xanh sáng ở trên trái, một hồng tím ở dưới
 *      phải) để mặt nền không phẳng lì như một khối màu đặc.
 *   3. Lưới kẻ ô mảnh phủ đều lên trên.
 *
 * Vẽ bằng `<Pattern>` và `<RadialGradient>` của react-native-svg chứ không lát
 * ảnh nền: pattern là vector nên nét kẻ mảnh đều nhau ở mọi mật độ điểm ảnh, và
 * không phải nạp thêm tệp nào. Cách lát ảnh PNG sẽ mờ trên màn Retina và phải
 * kèm ba kích cỡ.
 *
 * Cả ba lớp nằm dưới cùng, `pointerEvents="none"`, nên không chắn thao tác chạm
 * của nội dung phía trên.
 */

/** Xanh dương đậm → chàm → tím. Đủ tối để chữ trắng và thẻ giấy sáng nổi lên. */
const BASE_STOPS = ['#1E3A9E', '#3B3BBF', '#6D28D9'] as const;

/**
 * Bản SÁNG của cùng một nền: xanh nước biển rất nhạt, ngả tím ở góc dưới.
 *
 * Dùng cho màn ĐANG LÀM VIỆC — đọc bài, gõ bài, tra từ. Ở đó thẻ vẫn trắng, nên
 * nền chỉ cần đủ màu để tách thẻ ra khỏi trang; nền tối sẽ biến mỗi thẻ thành
 * một ô sáng chói giữa màn hình mà người ta phải nhìn vào hàng chục phút.
 *
 * ĐỨNG Ở ĐÂY chứ không nằm riêng trong `TaskShell`: giờ có sáu bảy màn dùng
 * chung, mà hai bộ số gần giống nhau ở hai file là hai bộ số sẽ trôi khỏi nhau.
 */
export const LIGHT_STOPS = ['#E9F0FE', '#E3EAFC', '#EBE6FB'] as const;

/** Nét kẻ cho bản sáng — chàm rất mờ, không phải trắng. */
export const LIGHT_LINE = 'rgba(60, 82, 160, 0.10)';

/**
 * Nền CHUNG của các màn duyệt: xanh cornflower, kẻ caro.
 *
 * Trước đây là `bg-canvas` — một mảng xám bạc phẳng. Thẻ trắng trên nền gần
 * trắng thì không còn ranh giới, và cả app trông nhạt. Xanh đủ đậm để thẻ trắng
 * bật hẳn lên; ô kẻ để mặt nền không phẳng lì.
 *
 * LƯU Ý KHI ĐẶT CHỮ TRỰC TIẾP LÊN NỀN NÀY: chữ xám nhạt (`text-muted`) đọc
 * không nổi nữa. Chữ nằm ngoài thẻ phải là `text-ink` hoặc trắng.
 */
export const CANVAS_STOPS = ['#93B5FC', '#89ACFB', '#9BA9FA'] as const;
export const CANVAS_LINE = 'rgba(23, 47, 110, 0.13)';

export function GridBackdrop({
  cell = 34,
  colors = BASE_STOPS,
  line = 'rgba(255,255,255,0.12)',
  showGrid = true,
  pattern = 'grid',
  blobs = ['#60A5FA', '#C084FC'],
  margin,
  children,
}: {
  cell?: number;
  colors?: readonly string[];
  line?: string;
  showGrid?: boolean;
  /** Hoạ tiết: kẻ ô (mặc định), chấm bi, kẻ dòng, kẻ chéo, trơn — nền học đổi bằng sao dùng các kiểu khác. */
  pattern?: 'grid' | 'dots' | 'ruled' | 'diagonal' | 'plain';
  /** Màu hai vệt loang (trên trái, dưới phải). */
  blobs?: readonly [string, string];
  /** Đường lề dọc bên trái (kiểu vở học trò). */
  margin?: string;
  children?: React.ReactNode;
}) {
  /*
    Id RIÊNG cho mỗi lần vẽ. Id cố định ("grid-base"…) nằm chung một không
    gian tên trong cả trang web: khi trang có hai nền lưới — nền xanh của app
    và nền sáng của hero — hero lấy nhầm gradient của nền app, hoà vào nền và
    mất hẳn đường viền.
  */
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (name: string) => `${name}-${uid}`;
  return (
    <View className="flex-1" style={{ backgroundColor: colors[0] }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={id('grid-base')} x1="0" y1="0" x2="1" y2="1">
              {colors.map((stop, index) => (
                <Stop
                  key={index}
                  offset={colors.length === 1 ? 0 : index / (colors.length - 1)}
                  stopColor={stop}
                />
              ))}
            </LinearGradient>

            <RadialGradient id={id('grid-blob-a')} cx="0.5" cy="0.5" r="0.5">
              <Stop offset={0} stopColor={blobs[0]} stopOpacity={0.45} />
              <Stop offset={1} stopColor={blobs[0]} stopOpacity={0} />
            </RadialGradient>

            <RadialGradient id={id('grid-blob-b')} cx="0.5" cy="0.5" r="0.5">
              <Stop offset={0} stopColor={blobs[1]} stopOpacity={0.4} />
              <Stop offset={1} stopColor={blobs[1]} stopOpacity={0} />
            </RadialGradient>

            <Pattern id={id('grid-cell')} width={cell} height={cell} patternUnits="userSpaceOnUse">
              {pattern === 'dots' ? (
                <Ellipse cx={cell / 2} cy={cell / 2} rx={1.4} ry={1.4} fill={line} />
              ) : pattern === 'ruled' ? (
                <Path d={`M 0 ${cell - 0.5} L ${cell} ${cell - 0.5}`} fill="none" stroke={line} strokeWidth={1} />
              ) : pattern === 'diagonal' ? (
                <Path d={`M 0 ${cell} L ${cell} 0`} fill="none" stroke={line} strokeWidth={1} />
              ) : (
                <Path d={`M ${cell} 0 L 0 0 L 0 ${cell}`} fill="none" stroke={line} strokeWidth={1} />
              )}
            </Pattern>
          </Defs>

          <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id('grid-base')})`} />

          {/* Vệt loang: bán kính tính theo phần trăm nên chúng co giãn theo khung. */}
          <Ellipse cx="18%" cy="12%" rx="55%" ry="45%" fill={`url(#${id('grid-blob-a')})`} />
          <Ellipse cx="88%" cy="82%" rx="50%" ry="55%" fill={`url(#${id('grid-blob-b')})`} />

          {showGrid && pattern !== 'plain' ? <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id('grid-cell')})`} /> : null}
          {margin ? <Rect x={64} y={0} width={1.5} height="100%" fill={margin} /> : null}
        </Svg>
      </View>
      {children}
    </View>
  );
}
