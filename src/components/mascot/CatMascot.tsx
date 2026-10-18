import React from 'react';
import { Image } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Text as SvgText } from 'react-native-svg';

import type { LionPose } from './LionMascot';
import { useLionSkin } from './lion-skin';

/**
 * MÈO LINH VẬT CỦA BAND 9 — tự vẽ bằng SVG, không lấy hình có bản quyền.
 *
 * Phong cách theo bộ sticker: thân trắng, viền mực mảnh, ba vạch xám trên đầu,
 * má hồng, đuôi cong. Mỗi trạng thái đổi mắt, miệng và một dấu nhỏ bên cạnh:
 *   - idle: đang ngồi, mắt chấm;
 *   - happy: trả lời đúng, mắt cười, sao nhỏ;
 *   - oops: trả lời sai, mắt buồn, hơi rũ tai;
 *   - think: đang chờ / đang nghĩ, dấu hỏi;
 *   - sleep: nghỉ, mắt nhắm, chữ z.
 * Chỗ gọi chỉ đổi `state`; hình mới (dáng, trang phục) thêm ở đây, không đổi chỗ gọi.
 */

export type CatState = 'idle' | 'happy' | 'oops' | 'think' | 'sleep';

const INK = '#1F2430';
const BODY = '#FFFFFF';
const STRIPE = '#B9BFC9';
const BLUSH = '#F6B3C0';

type Props = { size?: number; state?: CatState; pose?: 'sit' | 'lie' };

function Eyes({ state }: { state: CatState }) {
  if (state === 'happy') {
    return (
      <G stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round">
        <Path d="M38 52 Q45 44 52 52" />
        <Path d="M68 52 Q75 44 82 52" />
      </G>
    );
  }
  if (state === 'sleep') {
    return (
      <G stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round">
        <Path d="M38 53 Q45 58 52 53" />
        <Path d="M68 53 Q75 58 82 53" />
      </G>
    );
  }
  if (state === 'oops') {
    return (
      <G>
        <Circle cx={45} cy={52} r={3.6} fill={INK} />
        <Circle cx={75} cy={52} r={3.6} fill={INK} />
        <Path d="M38 43 L51 47" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        <Path d="M82 43 L69 47" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      </G>
    );
  }
  return (
    <G>
      <Circle cx={45} cy={52} r={3.8} fill={INK} />
      <Circle cx={75} cy={52} r={3.8} fill={INK} />
    </G>
  );
}

function Mouth({ state }: { state: CatState }) {
  const d = state === 'oops' ? 'M54 66 Q60 61 66 66' : state === 'happy' ? 'M53 62 Q60 71 67 62' : 'M55 63 Q57.5 66.5 60 63 Q62.5 66.5 65 63';
  return <Path d={d} stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round" />;
}

function Accent({ state }: { state: CatState }) {
  if (state === 'think') {
    return <SvgText x={96} y={26} fontSize={22} fontWeight="700" fill={INK}>?</SvgText>;
  }
  if (state === 'sleep') {
    return (
      <G>
        <SvgText x={92} y={24} fontSize={14} fontWeight="700" fill={INK}>z</SvgText>
        <SvgText x={100} y={14} fontSize={11} fontWeight="700" fill={INK}>z</SvgText>
      </G>
    );
  }
  if (state === 'happy') {
    return (
      <G fill="#FFC94D" stroke={INK} strokeWidth={1.2}>
        <Path d="M100 18 L102.5 24 L109 24.5 L103.8 28.5 L105.6 35 L100 31.2 L94.4 35 L96.2 28.5 L91 24.5 L97.5 24 Z" />
      </G>
    );
  }
  return null;
}

/**
 * Dáng NẰM DÀI, ngủ ngon: đầu đặt trên chân trước, thân duỗi ngang. Dùng cho giờ
 * nghỉ (`pose="lie"`). Cùng bảng màu và viền mực với dáng ngồi.
 */
function LyingCat({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel="Mèo Band 9 đang ngủ">
      {/* đuôi buông ra phía sau */}
      <Path d="M100 96 Q120 96 114 80" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
      <Path d="M100 96 Q120 96 114 80" stroke={BODY} strokeWidth={5} fill="none" strokeLinecap="round" />

      {/* thân nằm dài */}
      <Ellipse cx={66} cy={92} rx={42} ry={18} fill={BODY} stroke={INK} strokeWidth={3} />

      {/* chân trước duỗi dưới cằm */}
      <Ellipse cx={36} cy={106} rx={10} ry={5} fill={BODY} stroke={INK} strokeWidth={2.6} />

      {/* tai */}
      <Path d="M14 74 L16 50 L34 66 Z" fill={BODY} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M44 66 L54 52 L56 76 Z" fill={BODY} stroke={INK} strokeWidth={3} strokeLinejoin="round" />

      {/* đầu gối trên chân trước */}
      <Ellipse cx={34} cy={84} rx={24} ry={18} fill={BODY} stroke={INK} strokeWidth={3} />

      {/* ba vạch xám trên đầu */}
      <G stroke={STRIPE} strokeWidth={3} strokeLinecap="round">
        <Line x1={26} y1={70} x2={27} y2={76} />
        <Line x1={34} y1={68} x2={34} y2={75} />
        <Line x1={42} y1={70} x2={41} y2={76} />
      </G>

      {/* mắt nhắm */}
      <G stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round">
        <Path d="M20 86 Q25 91 30 86" />
        <Path d="M38 86 Q43 91 48 86" />
      </G>

      {/* má hồng, mũi */}
      <Ellipse cx={18} cy={95} rx={5} ry={3} fill={BLUSH} />
      <Ellipse cx={50} cy={95} rx={5} ry={3} fill={BLUSH} />
      <Path d="M31 93 L37 93 L34 96 Z" fill={BLUSH} stroke={INK} strokeWidth={1} strokeLinejoin="round" />

      {/* râu */}
      <G stroke={INK} strokeWidth={1.4} strokeLinecap="round">
        <Line x1={8} y1={89} x2={16} y2={90} />
        <Line x1={8} y1={95} x2={16} y2={94} />
      </G>

      {/* chữ z bay lên */}
      <SvgText x={76} y={60} fontSize={16} fontWeight="700" fill={INK}>z</SvgText>
      <SvgText x={89} y={47} fontSize={12} fontWeight="700" fill={INK}>z</SvgText>
    </Svg>
  );
}

const LION_FOR_STATE: Record<CatState, LionPose> = { idle: 'wave', happy: 'cheer', oops: 'point', think: 'think', sleep: 'sleep' };

export function CatMascot({ size = 120, state = 'idle', pose = 'sit' }: Props) {
  const lion = useLionSkin();
  if (lion) {
    return <Image source={{ uri: `/mascot/lion/lion-${pose === 'lie' ? 'sleep' : LION_FOR_STATE[state]}.webp` }} resizeMode="contain" style={{ width: size, height: size }} accessibilityLabel="Leo" />;
  }
  if (pose === 'lie') return <LyingCat size={size} />;
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel="Mèo Band 9">
      {/* đuôi: viền mực rồi lớp trắng đè lên */}
      <Path d="M88 96 Q116 92 110 68" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
      <Path d="M88 96 Q116 92 110 68" stroke={BODY} strokeWidth={5} fill="none" strokeLinecap="round" />

      {/* thân */}
      <Ellipse cx={60} cy={82} rx={34} ry={27} fill={BODY} stroke={INK} strokeWidth={3} />

      {/* tai: hơi rũ khi buồn */}
      <Path d={state === 'oops' ? 'M30 38 L30 14 L52 30 Z' : 'M29 36 L33 8 L52 27 Z'} fill={BODY} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <Path d={state === 'oops' ? 'M90 38 L90 14 L68 30 Z' : 'M91 36 L87 8 L68 27 Z'} fill={BODY} stroke={INK} strokeWidth={3} strokeLinejoin="round" />

      {/* đầu */}
      <Ellipse cx={60} cy={52} rx={33} ry={27} fill={BODY} stroke={INK} strokeWidth={3} />

      {/* ba vạch xám trên đầu */}
      <G stroke={STRIPE} strokeWidth={3.2} strokeLinecap="round">
        <Line x1={50} y1={29} x2={51} y2={37} />
        <Line x1={60} y1={27} x2={60} y2={36} />
        <Line x1={70} y1={29} x2={69} y2={37} />
      </G>

      <Eyes state={state} />

      {/* má hồng */}
      <Ellipse cx={34} cy={62} rx={5.5} ry={3.4} fill={BLUSH} />
      <Ellipse cx={86} cy={62} rx={5.5} ry={3.4} fill={BLUSH} />

      {/* mũi và miệng */}
      <Path d="M57 58 L63 58 L60 61.5 Z" fill={BLUSH} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      <Mouth state={state} />

      {/* râu */}
      <G stroke={INK} strokeWidth={1.6} strokeLinecap="round">
        <Line x1={22} y1={58} x2={32} y2={60} />
        <Line x1={22} y1={65} x2={32} y2={64} />
        <Line x1={98} y1={58} x2={88} y2={60} />
        <Line x1={98} y1={65} x2={88} y2={64} />
      </G>

      {/* hai chân trước */}
      <Ellipse cx={46} cy={104} rx={9} ry={5.5} fill={BODY} stroke={INK} strokeWidth={2.6} />
      <Ellipse cx={74} cy={104} rx={9} ry={5.5} fill={BODY} stroke={INK} strokeWidth={2.6} />

      <Accent state={state} />
    </Svg>
  );
}
