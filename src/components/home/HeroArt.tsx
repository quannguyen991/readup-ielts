import React from 'react';
import Svg, { Circle, Defs, G, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';

/**
 * Minh hoạ phẳng cho khung đầu trang Band 9: chồng sách, đồng hồ thi, bút chì và vài
 * ngôi sao ánh kim. Chỉ dùng hình học và tông vàng–navy của logo. Không có nhân vật.
 *
 * Vẽ bằng SVG có toạ độ cố định (viewBox 400×320) nên co giãn đều theo khung.
 */
export function HeroArt({ width = 400, height = 320 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 400 320">
      <Defs>
        <SvgGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F6E3A8" />
          <Stop offset="0.5" stopColor="#D9B46A" />
          <Stop offset="1" stopColor="#6A4BD9" />
        </SvgGradient>
        <SvgGradient id="navy" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1B2D4D" />
          <Stop offset="1" stopColor="#0F1D33" />
        </SvgGradient>
        <SvgGradient id="ivory" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F3F0FB" />
          <Stop offset="1" stopColor="#F3F0FB" />
        </SvgGradient>
      </Defs>

      {/* Quầng sáng nền */}
      <Circle cx="250" cy="160" r="128" fill="rgba(255,255,255,0.22)" />
      <Circle cx="250" cy="160" r="92" fill="rgba(255,255,255,0.28)" />

      {/* Chấm lưới nhỏ */}
      <G fill="rgba(15,29,51,0.14)">
        {Array.from({ length: 6 }).map((_, r) =>
          Array.from({ length: 6 }).map((__, c) => <Circle key={`${r}-${c}`} cx={40 + c * 14} cy={36 + r * 14} r={1.4} />),
        )}
      </G>

      {/* Chồng sách: ba cuốn, mỗi cuốn một tông, gáy và trang lộ ra */}
      <G>
        {/* cuốn đáy */}
        <Rect x="196" y="214" width="150" height="34" rx="8" fill="url(#navy)" />
        <Rect x="196" y="222" width="150" height="4" fill="rgba(255,255,255,0.18)" />
        <Rect x="200" y="240" width="142" height="4" rx="2" fill="#E8DCC0" />
        {/* cuốn giữa */}
        <Rect x="208" y="180" width="138" height="34" rx="8" fill="url(#gold)" />
        <Rect x="222" y="180" width="6" height="34" fill="rgba(15,29,51,0.18)" />
        <Rect x="212" y="206" width="132" height="4" rx="2" fill="#F3F0FB" />
        {/* cuốn trên, nghiêng nhẹ */}
        <G transform="rotate(-4 262 166)">
          <Rect x="222" y="146" width="122" height="32" rx="8" fill="url(#ivory)" stroke="#E4D3A6" strokeWidth="1.2" />
          <Rect x="236" y="146" width="6" height="32" fill="#D9B46A" />
          <Rect x="248" y="162" width="88" height="4" rx="2" fill="#D9B46A" />
          <Rect x="248" y="170" width="60" height="3" rx="1.5" fill="#E4D3A6" />
        </G>
        {/* dải đánh dấu trang */}
        <Path d="M318 146 L318 128 L326 136 L334 128 L334 146 Z" fill="#0F1D33" />
      </G>

      {/* Đồng hồ thi: vòng ngoài vàng, mặt trắng, kim navy */}
      <G>
        <Circle cx="112" cy="132" r="54" fill="url(#gold)" />
        <Circle cx="112" cy="132" r="44" fill="url(#ivory)" />
        {[0, 1, 2, 3].map((k) => {
          const a = (k * Math.PI) / 2;
          return <Rect key={k} x={112 + Math.cos(a) * 36 - 2} y={132 + Math.sin(a) * 36 - 2} width="4" height="4" rx="1" fill="#0F1D33" />;
        })}
        <Path d="M112 132 L112 104" stroke="#0F1D33" strokeWidth="4" strokeLinecap="round" />
        <Path d="M112 132 L134 144" stroke="#0F1D33" strokeWidth="3" strokeLinecap="round" />
        <Circle cx="112" cy="132" r="4" fill="#0F1D33" />
        <Rect x="104" y="72" width="16" height="10" rx="3" fill="#0F1D33" />
      </G>

      {/* Bút chì nghiêng */}
      <G transform="rotate(32 70 250)">
        <Rect x="30" y="238" width="104" height="22" rx="6" fill="url(#gold)" />
        <Rect x="30" y="238" width="18" height="22" rx="4" fill="#0F1D33" />
        <Path d="M134 238 L152 249 L134 260 Z" fill="#F3E2B6" />
        <Path d="M146 245 L152 249 L146 253 Z" fill="#0F1D33" />
      </G>

      {/* Sao lấp lánh */}
      <Path d="M68 74 L72 86 L84 90 L72 94 L68 106 L64 94 L52 90 L64 86 Z" fill="#F0644F" />
      <Path d="M352 210 L355 218 L363 221 L355 224 L352 232 L349 224 L341 221 L349 218 Z" fill="#F0644F" />
      <Path d="M300 60 L302.5 67 L310 69.5 L302.5 72 L300 79 L297.5 72 L290 69.5 L297.5 67 Z" fill="#6A4BD9" />
      <Circle cx="366" cy="110" r="3" fill="#D9B46A" />
      <Circle cx="48" cy="180" r="2.5" fill="#D9B46A" />
    </Svg>
  );
}
