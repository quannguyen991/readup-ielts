import React from 'react';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';

import { color } from '@/theme/tokens';

/**
 * Bộ icon line-style, nét đều 1.7px, bo tròn đầu nét — khớp ngôn ngữ icon
 * trong 5 ảnh tham chiếu. Bước 2 sẽ sinh thêm bộ icon minh hoạ qua OpenAI API,
 * còn icon điều hướng dùng vector nội bộ cho nhẹ và sắc nét ở mọi kích thước.
 */
export type IconName =
  | 'home'
  | 'pencil'
  | 'book'
  | 'letters'
  | 'trending'
  | 'clipboard'
  | 'note'
  | 'bookmark'
  | 'settings'
  | 'bell'
  | 'search'
  | 'flame'
  | 'target'
  | 'trophy'
  | 'clock'
  | 'check'
  | 'close'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-right'
  | 'info'
  | 'sparkle'
  | 'lock'
  | 'gauge'
  | 'calendar'
  | 'refresh'
  | 'chat'
  | 'volume'
  | 'mic'
  | 'grid'
  | 'list'
  | 'filter'
  | 'plus'
  | 'play'
  | 'languages'
  | 'leaf'
  | 'heart'
  | 'briefcase'
  | 'compass'
  | 'building'
  | 'flask'
  | 'more'
  | 'mail'
  | 'download'
  | 'shield'
  | 'external'
  | 'gift';

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({
  name,
  size = 20,
  color: stroke = color.muted,
  strokeWidth = 1.7,
}: IconProps) {
  const common = {
    stroke,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderPaths(name, common)}
    </Svg>
  );
}

type CommonProps = {
  stroke: string;
  strokeWidth: number;
  strokeLinecap: 'round';
  strokeLinejoin: 'round';
  fill: 'none';
};

function renderPaths(name: IconName, p: CommonProps) {
  switch (name) {
    case 'home':
      return (
        <>
          <Path {...p} d="M4 10.2 12 4l8 6.2V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
          <Path {...p} d="M9.5 20.5v-6h5v6" />
        </>
      );
    case 'pencil':
      return (
        <>
          <Path {...p} d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z" />
          <Path {...p} d="M14.5 6.5 17.5 9.5" />
        </>
      );
    case 'book':
      return (
        <>
          <Path {...p} d="M12 6.5C10.4 5.2 8.4 4.6 5.6 4.5A1.1 1.1 0 0 0 4.5 5.6v11.3c0 .6.5 1.1 1.1 1.1 2.7.1 4.7.7 6.4 2 1.7-1.3 3.7-1.9 6.4-2 .6 0 1.1-.5 1.1-1.1V5.6a1.1 1.1 0 0 0-1.1-1.1c-2.8.1-4.8.7-6.4 2z" />
          <Path {...p} d="M12 6.5V20" />
        </>
      );
    case 'letters':
      return (
        <>
          <Path {...p} d="M3 18 7.5 6.5 12 18" />
          <Path {...p} d="M4.6 14.3h5.8" />
          <Path {...p} d="M20.5 11.6a3.4 3.4 0 1 0-6.8 0v2.8a3.4 3.4 0 1 0 6.8 0z" />
          <Path {...p} d="M20.5 8.4V18" />
        </>
      );
    case 'trending':
      return (
        <>
          <Polyline {...p} points="3.5 16.5 9 11 12.5 14.5 20.5 6.5" />
          <Polyline {...p} points="15.5 6.5 20.5 6.5 20.5 11.5" />
        </>
      );
    case 'clipboard':
      return (
        <>
          <Path {...p} d="M9 4.5h6a1 1 0 0 1 1 1v1.2H8V5.5a1 1 0 0 1 1-1z" />
          <Path {...p} d="M8 6.2H6.5A1.5 1.5 0 0 0 5 7.7v11.3a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V7.7a1.5 1.5 0 0 0-1.5-1.5H16" />
          <Path {...p} d="M8.8 11.5h6.4M8.8 15.3h4.4" />
        </>
      );
    case 'note':
      return (
        <>
          <Path {...p} d="M6.5 3.8h11a1.5 1.5 0 0 1 1.5 1.5v13.4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.7V5.3a1.5 1.5 0 0 1 1.5-1.5z" />
          <Path {...p} d="M8.6 8.2h6.8M8.6 12h6.8M8.6 15.8h4" />
        </>
      );
    case 'bookmark':
      return <Path {...p} d="M7 4.5h10a1 1 0 0 1 1 1v14.2l-6-3.7-6 3.7V5.5a1 1 0 0 1 1-1z" />;
    case 'settings':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={2.9} />
          <Path
            {...p}
            d="M19.3 14.1a1.3 1.3 0 0 0 .3 1.4l.1.1a1.6 1.6 0 1 1-2.2 2.2l-.1-.1a1.3 1.3 0 0 0-1.4-.3 1.3 1.3 0 0 0-.8 1.2v.2a1.6 1.6 0 1 1-3.2 0v-.1a1.3 1.3 0 0 0-.9-1.2 1.3 1.3 0 0 0-1.4.3l-.1.1a1.6 1.6 0 1 1-2.2-2.2l.1-.1a1.3 1.3 0 0 0 .3-1.4 1.3 1.3 0 0 0-1.2-.8h-.2a1.6 1.6 0 1 1 0-3.2h.1a1.3 1.3 0 0 0 1.2-.9 1.3 1.3 0 0 0-.3-1.4l-.1-.1a1.6 1.6 0 1 1 2.2-2.2l.1.1a1.3 1.3 0 0 0 1.4.3h.1a1.3 1.3 0 0 0 .8-1.2v-.2a1.6 1.6 0 1 1 3.2 0v.1a1.3 1.3 0 0 0 .8 1.2 1.3 1.3 0 0 0 1.4-.3l.1-.1a1.6 1.6 0 1 1 2.2 2.2l-.1.1a1.3 1.3 0 0 0-.3 1.4v.1a1.3 1.3 0 0 0 1.2.8h.2a1.6 1.6 0 1 1 0 3.2h-.1a1.3 1.3 0 0 0-1.2.8z"
          />
        </>
      );
    case 'bell':
      return (
        <>
          <Path {...p} d="M18 8.8a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5z" />
          <Path {...p} d="M13.7 19a2 2 0 0 1-3.4 0" />
        </>
      );
    case 'search':
      return (
        <>
          <Circle {...p} cx={11} cy={11} r={6.5} />
          <Path {...p} d="m20 20-3.7-3.7" />
        </>
      );
    case 'flame':
      return (
        <>
          <Path {...p} d="M12 3.5s5.5 4 5.5 8.8a5.5 5.5 0 1 1-11 0C6.5 9.6 8 8 8 8s.4 2 1.8 2.6C10.6 8.4 12 6.6 12 3.5z" />
        </>
      );
    case 'target':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={8} />
          <Circle {...p} cx={12} cy={12} r={4.4} />
          <Circle {...p} cx={12} cy={12} r={1.1} />
        </>
      );
    case 'trophy':
      return (
        <>
          <Path {...p} d="M8 4.5h8v4.2a4 4 0 1 1-8 0z" />
          <Path {...p} d="M8 6H5.6v1.2A3.2 3.2 0 0 0 8 10.3M16 6h2.4v1.2a3.2 3.2 0 0 1-2.4 3.1" />
          <Path {...p} d="M12 12.7V16M9 19.5h6M10 16h4l.7 3.5h-5.4z" />
        </>
      );
    case 'clock':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={8} />
          <Path {...p} d="M12 7.6V12l3 1.8" />
        </>
      );
    case 'check':
      return <Polyline {...p} points="5 12.8 9.6 17 19 7.4" />;
    case 'lock':
      return (
        <>
          <Rect {...p} x={4.8} y={10.5} width={14.4} height={9} rx={2.4} />
          <Path {...p} d="M8.4 10.5V7.8a3.6 3.6 0 0 1 7.2 0v2.7" />
        </>
      );
    case 'close':
      return <Path {...p} d="m6.5 6.5 11 11m0-11-11 11" />;
    case 'chevron-down':
      return <Polyline {...p} points="6.5 9.5 12 15 17.5 9.5" />;
    case 'chevron-right':
      return <Polyline {...p} points="9.5 6.5 15 12 9.5 17.5" />;
    case 'chevron-left':
      return <Polyline {...p} points="14.5 6.5 9 12 14.5 17.5" />;
    case 'arrow-up':
      return (
        <>
          <Path {...p} d="M12 19V5.5" />
          <Polyline {...p} points="6.6 10.9 12 5.5 17.4 10.9" />
        </>
      );
    case 'arrow-down':
      return (
        <>
          <Path {...p} d="M12 5v13.5" />
          <Polyline {...p} points="6.6 13.1 12 18.5 17.4 13.1" />
        </>
      );
    case 'arrow-right':
      return (
        <>
          <Path {...p} d="M5 12h13.5" />
          <Polyline {...p} points="13.1 6.6 18.5 12 13.1 17.4" />
        </>
      );
    case 'info':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={8} />
          <Path {...p} d="M12 11v5.2M12 8.2v.1" />
        </>
      );
    case 'sparkle':
      return (
        <>
          <Path {...p} d="M12 4.2 13.6 9l4.8 1.6-4.8 1.6L12 17l-1.6-4.8L5.6 10.6 10.4 9z" />
          <Path {...p} d="M18.4 16.2l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
        </>
      );
    case 'gauge':
      return (
        <>
          <Path {...p} d="M4.2 17.2a8.5 8.5 0 1 1 15.6 0" />
          <Path {...p} d="m12 13.6 3.6-3.9" />
          <Circle {...p} cx={12} cy={14.6} r={1.2} />
        </>
      );
    case 'calendar':
      return (
        <>
          <Rect {...p} x={4} y={5.6} width={16} height={14.4} rx={2.2} />
          <Path {...p} d="M4 10h16M8.6 3.6v3.6M15.4 3.6v3.6" />
        </>
      );
    case 'play':
      // Tam giác đặc: nút "chạy tiếp" mà vẽ rỗng nét thì nhìn như cái nêm.
      return <Path {...p} d="M8 5.5 18 12 8 18.5Z" fill={p.stroke} />;
    case 'refresh':
      return (
        <>
          <Path {...p} d="M19.3 11.3a7.3 7.3 0 1 0-.8 4.4" />
          <Polyline {...p} points="19.6 6.6 19.6 11.4 14.8 11.4" />
        </>
      );
    case 'chat':
      return (
        <>
          <Path {...p} d="M5.5 4.8h13a1.6 1.6 0 0 1 1.6 1.6v8.2a1.6 1.6 0 0 1-1.6 1.6H10l-4.3 3.3v-3.3h-.2A1.6 1.6 0 0 1 3.9 14.6V6.4a1.6 1.6 0 0 1 1.6-1.6z" />
          <Path {...p} d="M8.2 9.2h7.6M8.2 12.4h5" />
        </>
      );
    case 'mic':
      return (
        <>
          <Path {...p} d="M12 3.5a2.8 2.8 0 0 0-2.8 2.8v5.4a2.8 2.8 0 0 0 5.6 0V6.3A2.8 2.8 0 0 0 12 3.5z" />
          <Path {...p} d="M6.5 11.2a5.5 5.5 0 0 0 11 0M12 16.7v3.8M9 20.5h6" />
        </>
      );
    case 'volume':
      return (
        <>
          <Path {...p} d="M5 9.6h3.1L12 6v12l-3.9-3.6H5z" />
          <Path {...p} d="M15.5 9.6a3.4 3.4 0 0 1 0 4.8M18 7.2a6.8 6.8 0 0 1 0 9.6" />
        </>
      );
    case 'grid':
      return (
        <>
          <Rect {...p} x={4.2} y={4.2} width={6.4} height={6.4} rx={1.8} />
          <Rect {...p} x={13.4} y={4.2} width={6.4} height={6.4} rx={1.8} />
          <Rect {...p} x={4.2} y={13.4} width={6.4} height={6.4} rx={1.8} />
          <Rect {...p} x={13.4} y={13.4} width={6.4} height={6.4} rx={1.8} />
        </>
      );
    case 'list':
      return (
        <>
          <Path {...p} d="M9 6.5h11M9 12h11M9 17.5h11" />
          <Path {...p} d="M4.6 6.5h.1M4.6 12h.1M4.6 17.5h.1" />
        </>
      );
    case 'filter':
      return <Path {...p} d="M4.5 5.8h15l-5.8 6.7v5.3l-3.4 2v-7.3z" />;
    case 'plus':
      return <Path {...p} d="M12 5.5v13M5.5 12h13" />;
    case 'languages':
      // Hai mũi tên ngược chiều — quy ước phổ biến cho "đổi/dịch ngôn ngữ",
      // không vẽ chữ cái cụ thể vì bộ icon này toàn nét trừu tượng.
      return (
        <>
          <Path {...p} d="M4.5 8.5h13" />
          <Polyline {...p} points="14.3 5.3 17.5 8.5 14.3 11.7" />
          <Path {...p} d="M19.5 15.5h-13" />
          <Polyline {...p} points="9.7 12.3 6.5 15.5 9.7 18.7" />
        </>
      );
    case 'leaf':
      return (
        <>
          <Path {...p} d="M11 20a7 7 0 0 1-1.2-13.9C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" />
          <Path {...p} d="M2 21c0-3 1.9-5.4 5.1-6 2.4-.5 4.9-2 5.9-3" />
        </>
      );
    case 'heart':
      return (
        <Path
          {...p}
          d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5C2 10.8 3.5 12.5 5 14l7 7z"
        />
      );
    case 'briefcase':
      return (
        <>
          <Rect {...p} x={3.5} y={8} width={17} height={11.5} rx={2} />
          <Path {...p} d="M9 8V6.3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2V8" />
          <Path {...p} d="M3.5 13.5h17" />
        </>
      );
    case 'compass':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={8} />
          <Path {...p} d="M14.8 9.2 13 13l-3.8 1.8L11 11z" fill={p.stroke} />
        </>
      );
    case 'building':
      return (
        <>
          <Rect {...p} x={6} y={3.5} width={12} height={17} rx={1.5} />
          <Path {...p} d="M9 7.5h.01M15 7.5h.01M9 11.5h.01M15 11.5h.01M9 15.5h.01M15 15.5h.01" strokeWidth={2.4} />
        </>
      );
    case 'flask':
      return (
        <>
          <Path
            {...p}
            d="M10 3v6.3c0 .4-.1.8-.4 1.1l-4.9 6.9A2.6 2.6 0 0 0 6.8 21h10.4a2.6 2.6 0 0 0 2.1-4.1l-4.9-6.9a1.9 1.9 0 0 1-.4-1.1V3"
          />
          <Path {...p} d="M9 3h6" />
          <Path {...p} d="M6.7 15h10.6" />
        </>
      );
    case 'mail':
      return (
        <>
          <Rect {...p} x={3.8} y={5.8} width={16.4} height={12.4} rx={2} />
          <Path {...p} d="m4.6 7.2 7.4 5.6 7.4-5.6" />
        </>
      );
    case 'download':
      return (
        <>
          <Path {...p} d="M12 4.5v10.5" />
          <Polyline {...p} points="7.5 10.5 12 15 16.5 10.5" />
          <Path {...p} d="M5 19.5h14" />
        </>
      );
    case 'shield':
      return (
        <>
          <Path {...p} d="M12 3.8 5.5 6.3v5.2c0 4.1 2.8 7.3 6.5 8.7 3.7-1.4 6.5-4.6 6.5-8.7V6.3z" />
          <Polyline {...p} points="9.2 12 11.3 14.1 15 10.2" />
        </>
      );
    case 'external':
      return (
        <>
          <Path {...p} d="M13.5 5H19v5.5" />
          <Path {...p} d="m19 5-8 8" />
          <Path {...p} d="M17.5 13.5v4a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 17.5V8a1.5 1.5 0 0 1 1.5-1.5h4" />
        </>
      );
    case 'gift':
      return (
        <>
          <Rect {...p} x={4} y={8.5} width={16} height={4} rx={1} />
          <Path {...p} d="M5.5 12.5v6A1.5 1.5 0 0 0 7 20h10a1.5 1.5 0 0 0 1.5-1.5v-6" />
          <Path {...p} d="M12 8.5V20" />
          <Path {...p} d="M12 8.5C10.6 5.2 7.2 4.9 7.2 6.8c0 1.4 2.3 1.7 4.8 1.7zm0 0c1.4-3.3 4.8-3.6 4.8-1.7 0 1.4-2.3 1.7-4.8 1.7z" />
        </>
      );
    case 'more':
      return (
        <>
          <Circle {...p} cx={12} cy={5.6} r={1.2} />
          <Circle {...p} cx={12} cy={12} r={1.2} />
          <Circle {...p} cx={12} cy={18.4} r={1.2} />
        </>
      );
    default:
      return null;
  }
}
