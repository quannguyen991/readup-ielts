/**
 * SƠ ĐỒ TƯ DUY trực quan: một nút giữa, các nhánh toả tròn quanh, nối bằng
 * đường cong màu theo nhánh. Màn hẹp (< 620px) thì xếp dọc thành cây: nút giữa
 * trên cùng, nhánh bên dưới nối bằng đường dọc.
 *
 * Nút là View thật (chữ tiếng Việt hiển thị chuẩn, bấm được), đường nối vẽ bằng SVG.
 */
import React, { useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type MindNode = { label: string; sub?: string; color: string; icon?: React.ReactNode; onPress?: () => void };

export function MindMap({ center, branches, height = 440, narrowBelow = 620 }: { center: MindNode; branches: MindNode[]; height?: number; /** Rộng dưới mức này thì xếp dọc. */ narrowBelow?: number }) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const narrow = w > 0 && w < narrowBelow;

  if (narrow) {
    return (
      <View onLayout={onLayout} style={{ alignItems: 'stretch' }}>
        <Node n={center} big />
        <View style={{ marginLeft: 22, borderLeftWidth: 3, borderColor: 'rgba(15,23,42,0.12)', paddingLeft: 14, paddingTop: 10, gap: 10 }}>
          {branches.map((b) => (
            <View key={b.label} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 14, height: 3, backgroundColor: b.color, marginLeft: -14 }} />
              <Node n={b} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  const H = height;
  const cx = w / 2;
  const cy = H / 2;
  const rx = w * 0.34;
  const ry = H * 0.38;
  const pts = branches.map((_, i) => {
    // Bắt đầu từ phía trên, rải đều; lệch nửa bước để nhánh không nằm đúng trục đứng.
    const a = -Math.PI / 2 + ((i + 0.5) / branches.length) * Math.PI * 2;
    return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry };
  });

  return (
    <View onLayout={onLayout} style={{ height: H, position: 'relative' }}>
      {w > 0 ? (
        <>
          <Svg width={w} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
            {pts.map((p, i) => {
              const mx = (cx + p.x) / 2;
              return <Path key={i} d={`M ${cx} ${cy} Q ${mx} ${cy} ${p.x} ${p.y}`} stroke={branches[i]!.color} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.75} />;
            })}
          </Svg>
          {pts.map((p, i) => (
            <View key={branches[i]!.label} style={{ position: 'absolute', left: p.x, top: p.y, width: 'max-content' as never, transform: [{ translateX: '-50%' as never }, { translateY: '-50%' as never }] }}>
              <Node n={branches[i]!} />
            </View>
          ))}
          <View style={{ position: 'absolute', left: cx, top: cy, width: 'max-content' as never, transform: [{ translateX: '-50%' as never }, { translateY: '-50%' as never }] }}>
            <Node n={center} big />
          </View>
        </>
      ) : null}
    </View>
  );
}

function Node({ n, big = false }: { n: MindNode; big?: boolean }) {
  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: big ? 22 : 16,
        paddingHorizontal: big ? 18 : 12,
        paddingVertical: big ? 14 : 8,
        backgroundColor: big ? n.color : '#FFFFFF',
        borderWidth: big ? 0 : 3,
        borderColor: n.color,
        maxWidth: big ? 240 : 190,
        boxShadow: '0 6px 16px rgba(15,23,42,0.12)',
      } as object}
    >
      {n.icon}
      <View style={{ flexShrink: 1 }}>
        <Text className="font-heavy" style={{ fontSize: big ? 18 : 14, color: big ? '#FFFFFF' : '#0F172A' }}>
          {n.label}
        </Text>
        {n.sub ? (
          <Text className="font-semi" style={{ fontSize: 12, color: big ? 'rgba(255,255,255,0.85)' : n.color }}>
            {n.sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
  if (!n.onPress) return body;
  return (
    <Pressable accessibilityRole="link" onPress={n.onPress} style={({ hovered }: { hovered?: boolean }) => ({ transform: [{ scale: hovered ? 1.05 : 1 }], transition: 'transform 150ms ease' } as object)}>
      {body}
    </Pressable>
  );
}
