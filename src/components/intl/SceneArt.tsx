import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

/**
 * Tranh minh hoạ tự vẽ cho Part 1 (không dùng ảnh bên ngoài, nên không có vấn đề bản quyền).
 * Mỗi cảnh khớp mô tả trong `TOEIC_PART1`.
 */

function OfficeWriting() {
  return (
    <>
      <Rect x={0} y={0} width={400} height={260} fill="#F3F0FB" />
      <Rect x={250} y={30} width={120} height={110} fill="#BFE0F0" stroke="#8A7A62" strokeWidth={6} />
      <Line x1={310} y1={30} x2={310} y2={140} stroke="#8A7A62" strokeWidth={4} />
      <Line x1={250} y1={85} x2={370} y2={85} stroke="#8A7A62" strokeWidth={4} />
      <Rect x={40} y={170} width={320} height={12} fill="#8B6B4A" />
      <Rect x={60} y={182} width={10} height={60} fill="#6E5538" />
      <Rect x={330} y={182} width={10} height={60} fill="#6E5538" />
      <Rect x={150} y={138} width={90} height={32} fill="#5B6B7A" />
      <Rect x={140} y={170} width={110} height={6} fill="#3E4A56" />
      <Rect x={110} y={158} width={60} height={10} fill="#FFFFFF" stroke="#B9AE9A" strokeWidth={1} />
      <Rect x={85} y={120} width={60} height={44} fill="#8E7B9E" />
      <Circle cx={112} cy={92} r={22} fill="#F2C9A0" />
      <Path d="M90 86 Q112 60 134 86 L134 80 Q112 64 90 80 Z" fill="#2B2350" />
      <Path d="M92 118 L132 118 L140 170 L84 170 Z" fill="#4C78A8" />
      <Path d="M132 128 L160 150" stroke="#4C78A8" strokeWidth={10} strokeLinecap="round" />
      <Line x1={158} y1={148} x2={182} y2={142} stroke="#222222" strokeWidth={3} strokeLinecap="round" />
    </>
  );
}

function WorkersAtTable() {
  return (
    <>
      <Rect x={0} y={0} width={400} height={260} fill="#EEF3F0" />
      <Rect x={60} y={150} width={280} height={14} fill="#8B6B4A" />
      <Rect x={80} y={164} width={10} height={70} fill="#6E5538" />
      <Rect x={310} y={164} width={10} height={70} fill="#6E5538" />
      <Rect x={130} y={122} width={140} height={28} fill="#2D6A9F" />
      <Line x1={142} y1={130} x2={258} y2={130} stroke="#FFFFFF" strokeWidth={2} />
      <Line x1={142} y1={140} x2={230} y2={140} stroke="#FFFFFF" strokeWidth={2} />
      <Circle cx={92} cy={82} r={18} fill="#E0B48C" />
      <Rect x={74} y={100} width={36} height={50} fill="#C0504D" />
      <Circle cx={200} cy={74} r={18} fill="#D9A77A" />
      <Rect x={182} y={92} width={36} height={58} fill="#4F81BD" />
      <Circle cx={308} cy={84} r={18} fill="#8C5E3C" />
      <Rect x={290} y={102} width={36} height={48} fill="#9BBB59" />
      <Line x1={118} y1={124} x2={128} y2={114} stroke="#E0B48C" strokeWidth={6} strokeLinecap="round" />
      <Line x1={282} y1={122} x2={270} y2={112} stroke="#8C5E3C" strokeWidth={6} strokeLinecap="round" />
    </>
  );
}

function VanAtWarehouse() {
  return (
    <>
      <Rect x={0} y={0} width={400} height={260} fill="#DDEBF5" />
      <Rect x={0} y={210} width={400} height={50} fill="#9A9A8F" />
      <Rect x={20} y={90} width={170} height={120} fill="#C9B99A" />
      <Rect x={14} y={80} width={182} height={12} fill="#8A7A62" />
      <Rect x={70} y={130} width={70} height={80} fill="#7C6A52" />
      <Line x1={70} y1={150} x2={140} y2={150} stroke="#5E4F3D" strokeWidth={3} />
      <Line x1={70} y1={170} x2={140} y2={170} stroke="#5E4F3D" strokeWidth={3} />
      <Rect x={230} y={130} width={110} height={60} fill="#F0F0F0" stroke="#555555" strokeWidth={2} />
      <Rect x={300} y={145} width={40} height={45} fill="#E0E0E0" stroke="#555555" strokeWidth={2} />
      <Rect x={240} y={142} width={44} height={20} fill="#5B8DB8" />
      <Circle cx={256} cy={194} r={12} fill="#333333" />
      <Circle cx={322} cy={194} r={12} fill="#333333" />
      <Rect x={195} y={165} width={24} height={24} fill="#C58B4E" />
      <Rect x={198} y={140} width={24} height={24} fill="#C58B4E" />
    </>
  );
}

const SCENES: Record<string, () => React.ReactElement> = {
  'p1-1': OfficeWriting,
  'p1-2': WorkersAtTable,
  'p1-3': VanAtWarehouse,
};

export function hasSceneArt(id: string): boolean {
  return id in SCENES;
}

export function SceneArt({ id, width = 400 }: { id: string; width?: number }) {
  const Scene = SCENES[id];
  if (!Scene) return null;
  return (
    <Svg width="100%" style={{ maxWidth: width, aspectRatio: 400 / 260, borderRadius: 12 }} viewBox="0 0 400 260">
      <Scene />
    </Svg>
  );
}
