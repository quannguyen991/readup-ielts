import React, { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Rect } from 'react-native-svg';

import { hashString, mulberry32 } from '@/services/questions/rng';

/**
 * Thanh tiến độ dạng "đường chạy pixel".
 *
 * Vì sao không dùng một thanh tiến độ thường: bài chép chính tả có 12 câu và
 * mỗi câu mất vài phút, nên một thanh nhích 8% mỗi lần gần như không nhìn thấy
 * gì. Ở đây tiến độ là một nhân vật ĐI QUA một quãng đường có mốc — bụi cây,
 * đám mây, hộp thưởng — nên mỗi câu xong là thấy mình vừa đi qua một cái gì đó,
 * và cái cột cờ ở cuối cho biết còn bao xa.
 *
 * Vẽ bằng SVG chứ không lát ảnh sprite: nét vuông của phong cách pixel phải sắc
 * ở mọi mật độ điểm ảnh, mà ảnh PNG phóng to trên màn Retina thì nhoè. Vẽ bằng
 * hình chữ nhật cũng cho phép đổi màu theo tông của app mà không phải xuất lại
 * ảnh.
 *
 * Vị trí vật trang trí sinh từ RNG GIEO HẠT theo `seed`, nên cùng một bài thì
 * quãng đường luôn giống hệt nhau — không có gì nhảy chỗ mỗi lần React vẽ lại.
 */

const VIEW_W = 720;
const VIEW_H = 64;
const GROUND_Y = 46;

type Prop = { kind: 'bush' | 'cloud' | 'block'; x: number };

export function PixelTrack({
  progress,
  seed,
  label,
}: {
  /** 0..1 */
  progress: number;
  seed: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(1, progress));

  const props = useMemo<Prop[]>(() => {
    const rng = mulberry32(hashString(seed));
    const out: Prop[] = [];
    // Rải đều theo bảy khoảng để không có chỗ nào trống hoác hay chen chúc.
    for (let i = 0; i < 7; i += 1) {
      const slot = 60 + i * 86 + rng() * 36;
      const roll = rng();
      out.push({ kind: roll < 0.45 ? 'bush' : roll < 0.8 ? 'cloud' : 'block', x: slot });
    }
    return out;
  }, [seed]);

  const travel = useSharedValue(clamped);
  useEffect(() => {
    travel.value = withTiming(clamped, { duration: 520, easing: Easing.out(Easing.cubic) });
  }, [clamped, travel]);

  // Nhân vật đi từ mép trái tới ngay trước cột cờ.
  const runnerStyle = useAnimatedStyle(() => ({
    left: `${travel.value * 88}%`,
  }));

  const fillStyle = useAnimatedStyle(() => ({ width: `${travel.value * 100}%` }));

  return (
    <View>
      <View style={{ height: VIEW_H, width: '100%' }}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none">
          {props.map((prop, i) =>
            prop.kind === 'cloud' ? (
              <Cloud key={i} x={prop.x} y={10 + (i % 2) * 7} />
            ) : prop.kind === 'block' ? (
              <QuestionBlock key={i} x={prop.x} y={20} />
            ) : (
              <Bush key={i} x={prop.x} y={GROUND_Y - 7} />
            ),
          )}
          <Flag x={VIEW_W - 34} />
          <Rect x={0} y={GROUND_Y} width={VIEW_W} height={6} rx={3} fill="#8FA95C" />
        </Svg>

        {/* Nhân vật nằm ngoài SVG để chạy được bằng Reanimated mà không vẽ lại cả khung. */}
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', bottom: VIEW_H - GROUND_Y - 2, width: 18, height: 18 }, runnerStyle]}
        >
          <Svg width={18} height={18} viewBox="0 0 9 9">
            {/* Mũ */}
            <Rect x={2} y={0} width={5} height={2} fill="#E4572E" />
            <Rect x={1} y={1} width={7} height={1} fill="#E4572E" />
            {/* Mặt */}
            <Rect x={2} y={2} width={5} height={2} fill="#F2C79B" />
            <Rect x={5} y={2} width={1} height={1} fill="#1A1A33" />
            {/* Thân */}
            <Rect x={2} y={4} width={5} height={3} fill="#4F46E5" />
            <Rect x={1} y={4} width={1} height={2} fill="#F2C79B" />
            <Rect x={7} y={4} width={1} height={2} fill="#F2C79B" />
            {/* Chân */}
            <Rect x={2} y={7} width={2} height={2} fill="#2B2B55" />
            <Rect x={5} y={7} width={2} height={2} fill="#2B2B55" />
          </Svg>
        </Animated.View>
      </View>

      <View className="mt-1.5 h-2 overflow-hidden rounded-pill bg-brand-soft">
        <Animated.View style={[{ height: '100%', backgroundColor: '#8FA95C', borderRadius: 999 }, fillStyle]} />
      </View>

      {label ? (
        <Text className="mt-1.5 font-semi uppercase tracking-wide text-paper-muted" style={{ fontSize: 9 }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

function Bush({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Rect x={x} y={y + 2} width={22} height={5} rx={2} fill="#7FA34A" />
      <Rect x={x + 4} y={y - 3} width={7} height={6} rx={2} fill="#7FA34A" />
      <Rect x={x + 12} y={y - 1} width={7} height={4} rx={2} fill="#7FA34A" />
    </>
  );
}

function Cloud({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Rect x={x} y={y + 3} width={30} height={6} rx={3} fill="#D8E4F7" />
      <Rect x={x + 6} y={y - 1} width={11} height={6} rx={3} fill="#D8E4F7" />
      <Rect x={x + 17} y={y + 1} width={9} height={4} rx={2} fill="#D8E4F7" />
    </>
  );
}

function QuestionBlock({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Rect x={x} y={y} width={16} height={16} rx={2} fill="#F0B429" />
      <Rect x={x + 2} y={y + 2} width={12} height={12} rx={1.5} fill="#FCD34D" />
      <Rect x={x + 6} y={y + 4} width={4} height={3} fill="#8A6100" />
      <Rect x={x + 7} y={y + 9} width={3} height={2} fill="#8A6100" />
      <Circle cx={x + 8} cy={y + 7.5} r={1} fill="#8A6100" />
    </>
  );
}

function Flag({ x }: { x: number }) {
  return (
    <>
      <Rect x={x} y={14} width={3} height={GROUND_Y - 14} fill="#8A8A9E" />
      <Rect x={x + 3} y={15} width={20} height={14} rx={2} fill="#E4572E" />
      <Rect x={x + 9} y={19} width={9} height={7} rx={1} fill="#FCD34D" />
    </>
  );
}
