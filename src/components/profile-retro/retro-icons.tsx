/**
 * Bộ icon retro: nét mực đậm, nền màu phẳng, cùng ngôn ngữ với bình thuỷ tinh và
 * máy chứa trong trang. Vẽ mới bằng SVG cho Band 9, không dùng icon của bên nào khác.
 */
import React from 'react';
import { Text } from 'react-native';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

import { Icon, type IconName } from '@/components/ui/Icon';

import { RFONT, RGOLD, RINK, RLEAF, RPAPER, RPINK, RSKY, Sparkle, starPoints } from './retro-art';

type IconProps = { size?: number };

const STROKE = 2.4;

function Base({ size = 22, children }: IconProps & { children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {children}
    </Svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Rect x={3} y={3} width={8} height={8} rx={2.5} fill={RPINK} stroke={RINK} strokeWidth={STROKE} />
      <Rect x={13} y={3} width={8} height={8} rx={2.5} fill={RSKY} stroke={RINK} strokeWidth={STROKE} />
      <Rect x={3} y={13} width={8} height={8} rx={2.5} fill={RGOLD} stroke={RINK} strokeWidth={STROKE} />
      <Rect x={13} y={13} width={8} height={8} rx={2.5} fill={RPAPER} stroke={RINK} strokeWidth={STROKE} />
    </Base>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Circle cx={10.5} cy={10.5} r={6.5} fill={RSKY} stroke={RINK} strokeWidth={STROKE} />
      <Path d="M7.4 9.2 Q8.2 7.2 10.4 6.9" fill="none" stroke={RPAPER} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M15.6 15.6 L20.4 20.4" stroke={RINK} strokeWidth={3.2} strokeLinecap="round" />
    </Base>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M3.5 11.5 L12 4 L20.5 11.5 L18 13 V19.5 H6 V13 Z" fill={RGOLD} stroke={RINK} strokeWidth={STROKE} strokeLinejoin="round" />
      <Rect x={10} y={13.5} width={4} height={6} rx={1.4} fill={RPAPER} stroke={RINK} strokeWidth={2} />
    </Base>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M3 6.5 Q7.5 4.5 12 7.5 Q16.5 4.5 21 6.5 V19 Q16.5 17 12 20 Q7.5 17 3 19 Z" fill={RSKY} stroke={RINK} strokeWidth={STROKE} strokeLinejoin="round" />
      <Path d="M12 7.5 V20" stroke={RINK} strokeWidth={2} />
    </Base>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Rect x={3.5} y={5} width={17} height={15.5} rx={4} fill={RPAPER} stroke={RINK} strokeWidth={STROKE} />
      <Rect x={3.5} y={5} width={17} height={5} rx={4} fill={RPINK} stroke={RINK} strokeWidth={STROKE} />
      <Path d="M8 3 V7 M16 3 V7" stroke={RINK} strokeWidth={STROKE} strokeLinecap="round" />
      <Circle cx={8} cy={14.5} r={1.3} fill={RINK} />
      <Circle cx={12} cy={14.5} r={1.3} fill={RINK} />
      <Circle cx={16} cy={14.5} r={1.3} fill={RINK} />
    </Base>
  );
}

export function GiftIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Rect x={4} y={9.5} width={16} height={10.5} rx={2} fill={RPINK} stroke={RINK} strokeWidth={STROKE} />
      <Rect x={3} y={6} width={18} height={4.5} rx={1.6} fill={RGOLD} stroke={RINK} strokeWidth={STROKE} />
      <Path d="M12 6 V20" stroke={RINK} strokeWidth={2} />
      <Path d="M12 6 C9 2.5 6 3.5 7.5 6 M12 6 C15 2.5 18 3.5 16.5 6" fill="none" stroke={RINK} strokeWidth={STROKE} strokeLinecap="round" />
    </Base>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Rect x={8.5} y={8.5} width={11} height={11} rx={3} fill={RPAPER} stroke={RINK} strokeWidth={STROKE} />
      <Rect x={4} y={4} width={11} height={11} rx={3} fill={RSKY} stroke={RINK} strokeWidth={STROKE} />
    </Base>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path
        d="M4 7 Q4 4.5 6.5 4.5 H17.5 Q20 4.5 20 7 V14.5 Q20 17 17.5 17 H11 L6.5 20.5 V17 Q4 17 4 14.5 Z"
        fill={RPAPER}
        stroke={RINK}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Circle cx={8.5} cy={10.8} r={1.4} fill={RINK} />
      <Circle cx={12} cy={10.8} r={1.4} fill={RINK} />
      <Circle cx={15.5} cy={10.8} r={1.4} fill={RINK} />
    </Base>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M6.5 6.5 L17.5 17.5 M17.5 6.5 L6.5 17.5" stroke={RINK} strokeWidth={3} strokeLinecap="round" />
    </Base>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M15 5.5 L8 12 L15 18.5" fill="none" stroke={RINK} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M8 11 V8 A4 4 0 0 1 16 8 V11" fill="none" stroke={RINK} strokeWidth={STROKE} strokeLinecap="round" />
      <Rect x={5} y={11} width={14} height={10} rx={3} fill={RGOLD} stroke={RINK} strokeWidth={STROKE} />
      <Circle cx={12} cy={16} r={1.4} fill={RINK} />
    </Base>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M5 12.5 L10 17 L19 7" fill="none" stroke={RINK} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  );
}

/** Đồng hồ tốc độ nửa vòng với kim, dùng cho mục Hôm nay. */
export function GaugeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M3 16.5 A9 9 0 0 1 21 16.5 Z" fill={RSKY} stroke={RINK} strokeWidth={STROKE} strokeLinejoin="round" />
      <Path d="M6.4 11.6 L7.4 12.5 M12 7.6 V9.1 M17.6 11.6 L16.6 12.5" stroke={RINK} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M12 16.5 L16.4 10.9" stroke={RINK} strokeWidth={2.6} strokeLinecap="round" />
      <Circle cx={12} cy={16.5} r={2} fill={RPAPER} stroke={RINK} strokeWidth={2} />
    </Base>
  );
}

/** Ngôi sao vàng có viền mực, dùng cho mục Cá nhân và số sao. */
export function StarIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Polygon points={starPoints(12, 12.4, 9.6, 4.3)} fill={RGOLD} stroke={RINK} strokeWidth={2} strokeLinejoin="round" />
    </Base>
  );
}

/** Bánh răng xanh, dùng cho mục Cài đặt. */
export function GearIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Circle cx={12} cy={12} r={9} fill="none" stroke={RINK} strokeWidth={3.4} strokeDasharray="3 2.4" />
      <Circle cx={12} cy={12} r={7} fill={RSKY} stroke={RINK} strokeWidth={STROKE} />
      <Circle cx={12} cy={12} r={2.6} fill={RPAPER} stroke={RINK} strokeWidth={2} />
    </Base>
  );
}

/** Bảng kẹp giấy, dùng cho mục Lớp học và Sổ bằng chứng. */
export function ClipboardIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Rect x={5} y={4.5} width={14} height={16} rx={3} fill={RPAPER} stroke={RINK} strokeWidth={STROKE} />
      <Rect x={8.5} y={2.8} width={7} height={3.4} rx={1.4} fill={RGOLD} stroke={RINK} strokeWidth={2} />
      <Path d="M8.5 11 H15.5 M8.5 14.5 H13.5" stroke={RINK} strokeWidth={2} strokeLinecap="round" />
    </Base>
  );
}

/** Cúp vàng, dùng cho mục Xếp hạng và Đề của tuần. */
export function TrophyIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Path d="M7 4.5 H17 V9.5 Q17 14.5 12 14.5 Q7 14.5 7 9.5 Z" fill={RGOLD} stroke={RINK} strokeWidth={STROKE} strokeLinejoin="round" />
      <Path d="M7 6.5 H4.5 Q4.5 10.5 7.8 10.5 M17 6.5 H19.5 Q19.5 10.5 16.2 10.5" fill="none" stroke={RINK} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 14.5 V18" stroke={RINK} strokeWidth={STROKE} />
      <Rect x={8} y={18} width={8} height={2.8} rx={1.2} fill={RPINK} stroke={RINK} strokeWidth={2} />
    </Base>
  );
}

/** Bia ngắm, dùng cho mục Hồ sơ lỗi và Đấu 1–1. */
export function TargetIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Circle cx={12} cy={12} r={9} fill={RPINK} stroke={RINK} strokeWidth={STROKE} />
      <Circle cx={12} cy={12} r={5.2} fill={RPAPER} stroke={RINK} strokeWidth={2} />
      <Circle cx={12} cy={12} r={1.8} fill={RINK} />
    </Base>
  );
}

/** La bàn, dùng cho mục Lộ trình học và các mục khám phá. */
export function CompassIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Circle cx={12} cy={12} r={9} fill={RSKY} stroke={RINK} strokeWidth={STROKE} />
      <Path d="M15 9 L13 13 L9 15 L11 11 Z" fill={RGOLD} stroke={RINK} strokeWidth={2} strokeLinejoin="round" />
    </Base>
  );
}

/** Đồng hồ, dùng cho mục Thi thử SAT. */
export function ClockIcon(props: IconProps) {
  return (
    <Base {...props}>
      <Circle cx={12} cy={12} r={9} fill={RPAPER} stroke={RINK} strokeWidth={STROKE} />
      <Path d="M12 7 V12 L15.5 14" fill="none" stroke={RINK} strokeWidth={STROKE} strokeLinecap="round" />
    </Base>
  );
}

/**
 * Icon của một mục điều hướng, theo tên icon trong nav-items. Mục đã có hình retro thì dùng hình đó;
 * mục chưa có thì dùng nét đơn của app đặt trong thân màu kem, để không mục nào bị trống.
 */
export function RetroGlyph({ icon, size = 20 }: { icon: IconName; size?: number }) {
  switch (icon) {
    case 'home':
      return <HomeIcon size={size} />;
    case 'gauge':
      return <GaugeIcon size={size} />;
    case 'book':
      return <BookIcon size={size} />;
    case 'grid':
      return <GridIcon size={size} />;
    case 'calendar':
      return <CalendarIcon size={size} />;
    case 'gift':
      return <GiftIcon size={size} />;
    case 'chat':
      return <ChatIcon size={size} />;
    case 'star':
      return <StarIcon size={size} />;
    case 'lock':
      return <LockIcon size={size} />;
    case 'search':
      return <SearchIcon size={size} />;
    case 'sparkle':
      return <Sparkle size={size} color={RGOLD} />;
    case 'settings':
      return <GearIcon size={size} />;
    case 'clipboard':
      return <ClipboardIcon size={size} />;
    case 'trophy':
      return <TrophyIcon size={size} />;
    case 'target':
      return <TargetIcon size={size} />;
    case 'compass':
      return <CompassIcon size={size} />;
    case 'clock':
      return <ClockIcon size={size} />;
    case 'letters':
      return <Text style={{ fontFamily: RFONT.display, fontSize: size * 0.8, color: RINK }}>Aa</Text>;
    default:
      return <Icon name={icon} size={size * 0.85} color={RINK} strokeWidth={2.2} />;
  }
}

/** Chấm xanh lá, dấu nhỏ dùng trong các chữ chạy. */
export function LeafDot({ size = 10 }: IconProps) {
  return (
    <Base size={size}>
      <Circle cx={12} cy={12} r={6} fill={RLEAF} stroke={RINK} strokeWidth={3} />
    </Base>
  );
}
