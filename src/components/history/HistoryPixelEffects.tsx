import React from 'react';
import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { SceneMotionLayer } from '@/services/history/types';

const RIPPLES = [
  [3, 14, 13, 2], [27, 24, 8, 2], [57, 18, 18, 2], [76, 33, 13, 2],
  [14, 40, 19, 3], [42, 46, 11, 2], [64, 53, 23, 3], [4, 69, 10, 2],
  [25, 74, 16, 2], [52, 79, 10, 2], [80, 72, 14, 2], [39, 90, 18, 2],
] as const;
const LEAVES = [
  [4, 10], [6, 20], [9, 65], [11, 45], [15, 8], [19, 31],
  [21, 74], [25, 14], [29, 61], [32, 28], [35, 39], [38, 82],
  [43, 19], [46, 55], [48, 68], [51, 13], [55, 46], [58, 78],
  [62, 26], [65, 66], [69, 57], [73, 15], [76, 42], [79, 72],
  [81, 37], [85, 8], [87, 64], [89, 51], [92, 25], [94, 75],
  [96, 48], [98, 14],
] as const;
const MOTES = [
  [8, 15], [20, 59], [29, 31], [37, 79], [49, 18], [54, 52],
  [65, 37], [73, 83], [82, 22], [91, 62],
] as const;

/** Sharp SVG pixels move with their scene layer on both web and native. */
export function HistoryPixelEffects({ sceneId, layer }: { sceneId: string; layer: SceneMotionLayer }) {
  const fillId = ('history-fill-' + sceneId + '-' + layer.id).replace(/[^a-zA-Z0-9_-]/g, '-');
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      {(layer.effect === 'smoke' || layer.effect === 'sunlight') ? (
        <Defs>
          <LinearGradient id={fillId} x1={layer.effect === 'smoke' ? '50%' : '0%'} y1={layer.effect === 'smoke' ? '100%' : '50%'} x2={layer.effect === 'smoke' ? '50%' : '100%'} y2={layer.effect === 'smoke' ? '0%' : '50%'}>
            <Stop offset="0%" stopColor={layer.effect === 'sunlight' ? '#FFE8A6' : '#E7F2EF'} stopOpacity={0} />
            <Stop offset="24%" stopColor={layer.effect === 'sunlight' ? '#FFE8A6' : '#E7F2EF'} stopOpacity={0.55} />
            <Stop offset="55%" stopColor={layer.effect === 'sunlight' ? '#FFF2BF' : '#F0F5EC'} stopOpacity={0.82} />
            <Stop offset="100%" stopColor={layer.effect === 'sunlight' ? '#FFE8A6' : '#E7F2EF'} stopOpacity={0} />
          </LinearGradient>
        </Defs>
      ) : null}
      {layer.effect === 'mist' ? (
        <Defs>
          <RadialGradient id={fillId} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#EDF5F2" stopOpacity={0.82} />
            <Stop offset="52%" stopColor="#E7F0EA" stopOpacity={0.55} />
            <Stop offset="100%" stopColor="#E4EFEA" stopOpacity={0} />
          </RadialGradient>
        </Defs>
      ) : null}
      {(layer.effect === 'glow' || layer.effect === 'lamp') ? (
        <Defs>
          <RadialGradient id={fillId} cx="50%" cy="42%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#FFE5A2" stopOpacity={0.78} />
            <Stop offset="45%" stopColor="#FFD486" stopOpacity={0.3} />
            <Stop offset="100%" stopColor="#FFD486" stopOpacity={0} />
          </RadialGradient>
        </Defs>
      ) : null}
      {layer.effect === 'mist' ? (
        <>
          <Ellipse cx="27" cy="38" rx="32" ry="18" fill={'url(#' + fillId + ')'} />
          <Ellipse cx="68" cy="35" rx="38" ry="17" fill={'url(#' + fillId + ')'} opacity={0.84} />
          <Ellipse cx="43" cy="72" rx="40" ry="16" fill={'url(#' + fillId + ')'} opacity={0.68} />
          <Ellipse cx="90" cy="69" rx="26" ry="14" fill={'url(#' + fillId + ')'} opacity={0.6} />
        </>
      ) : null}
      {layer.effect === 'smoke' ? (
        <>
          <Path d="M41 100V84H37V75H43V65H39V52H46V42H43V31H51V20H49V11H58V24H62V37H57V48H64V63H58V74H62V87H57V100Z" fill={'url(#' + fillId + ')'} />
          <Rect x="36" y="41" width="8" height="6" fill="#E7E9DC" opacity={0.43} />
          <Rect x="60" y="19" width="6" height="6" fill="#E7E9DC" opacity={0.3} />
        </>
      ) : null}
      {layer.effect === 'water' ? RIPPLES.map(([x, y, width, height], i) => (
        <Rect key={i} x={x} y={y} width={width} height={height} fill={i % 3 === 0 ? '#FFF0BB' : '#E0F5F2'} opacity={i % 3 === 0 ? 0.9 : 0.68} />
      )) : null}
      {layer.effect === 'sunlight' ? (
        <>
          <Path d="M41 0H57L82 100H49Z" fill={'url(#' + fillId + ')'} opacity={0.8} />
          <Path d="M23 0H32L53 100H39Z" fill="#FFE6A0" opacity={0.22} />
          <Path d="M68 0H76L100 100H87Z" fill="#FFF2C6" opacity={0.17} />
        </>
      ) : null}
      {layer.effect === 'glow' || layer.effect === 'lamp' ? (
        <>
          <Rect x="0" y="0" width="100" height="100" fill={'url(#' + fillId + ')'} />
          <Rect x="47" y="29" width="3" height="3" fill="#FFF5CB" opacity={0.8} />
          <Rect x="54" y="35" width="2" height="2" fill="#FFF5CB" opacity={0.65} />
          <Rect x="42" y="38" width="2" height="2" fill="#FFF5CB" opacity={0.5} />
        </>
      ) : null}
      {layer.effect === 'foliage' ? LEAVES.map(([x, y], i) => (
        <React.Fragment key={i}>
          <Rect x={x} y={y} width={i % 3 === 0 ? 2 : 1.3} height={i % 4 === 0 ? 2.6 : 1.7} fill={i % 3 === 0 ? '#FFDF77' : '#C8E08B'} opacity={i % 3 === 0 ? 0.85 : 0.68} />
          {i % 4 === 0 ? <Rect x={x + 2} y={y + 2} width="1.2" height="1.2" fill="#8FB357" opacity={0.7} /> : null}
        </React.Fragment>
      )) : null}
      {layer.effect === 'dust' ? MOTES.map(([x, y], i) => (
        <Rect key={i} x={x} y={y} width={i % 3 === 0 ? 1.2 : 0.7} height={i % 3 === 0 ? 1.2 : 0.7} fill="#FFF0BE" opacity={i % 3 === 0 ? 0.82 : 0.55} />
      )) : null}
    </Svg>
  );
}
