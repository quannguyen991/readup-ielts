import React, { useEffect, useMemo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/ui/Icon';
import type { MapNode } from '@/services/roadmap/map';
import { LABEL_WIDTH, NODE_SIZE, curvePath, layoutPath, type NodePoint } from '@/services/roadmap/path-layout';
import { rmColors, type RmColors } from './theme';
import { STICKERS, STICKER_BASE } from './stickers';

/**
 * Bản đồ lộ trình: đường cong nét đứt nối các nút bài học, mỗi nút là một huy hiệu tròn có viền
 * trắng (kiểu nhãn dán). Bài đang học đập vòng sáng; bài chưa mở thì khoá. Bấm một nút là vào làm bài.
 */
/** Kỹ năng đã có ảnh huy hiệu trong public/roadmap/badges. Thêm ảnh thì thêm khoá vào đây. */
/** Huy hiệu đã có ảnh trong public/roadmap/badges (khoá là tên file, không kèm .png). */
const BADGE_READY = new Set<string>(['play', 'listen', 'read', 'write', 'lock', 'done']);

/** Kỹ năng đang mở → huy hiệu theo kỹ năng. Kỹ năng khác dùng icon tạm. */
const SKILL_BADGE: Partial<Record<string, string>> = { listening: 'listen', reading: 'read', writing: 'write' };

/** Chọn huy hiệu theo trạng thái: đang học = play, đã xong = tick, khoá = ổ khoá, mở = theo kỹ năng. */
function badgeKeyOf(node: MapNode): string | null {
  if (node.status === 'current') return 'play';
  if (node.status === 'done') return 'done';
  if (node.status === 'locked') return 'lock';
  return SKILL_BADGE[node.skill] ?? null;
}

export function PathMap({ nodes, width, onOpen }: { nodes: MapNode[]; width: number; onOpen: (node: MapNode) => void }) {
  const c = rmColors();
  const { points, height } = useMemo(() => layoutPath(nodes.length, width), [nodes.length, width]);
  const d = useMemo(() => curvePath(points), [points]);

  return (
    <View style={{ width, height, alignSelf: 'center' }}>
      <StickerLayer width={width} height={height} />
      <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Path d={d} stroke={c.groundDeep} strokeWidth={14} fill="none" strokeLinecap="round" />
        <Path d={d} stroke={c.path} strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray="2 10" />
      </Svg>
      {nodes.map((node, i) => (
        <NodeView key={node.key} node={node} index={i} point={points[i]!} colors={c} onOpen={onOpen} />
      ))}
    </View>
  );
}

function NodeView({
  node,
  index,
  point,
  colors,
  onOpen,
}: {
  node: MapNode;
  index: number;
  point: NodePoint;
  colors: RmColors;
  onOpen: (node: MapNode) => void;
}) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);
  const current = node.status === 'current';

  useEffect(() => {
    if (!current || reduced) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(pulse);
  }, [current, reduced, pulse]);

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.7 }],
    opacity: 0.55 - pulse.value * 0.55,
  }));

  const fill =
    node.status === 'done' ? colors.gold : node.status === 'current' ? colors.gold : node.status === 'open' ? colors.green : colors.locked;
  // Bài đang học dùng nút play vàng như bản tham chiếu; đã xong thì dấu tick; khoá thì ổ khoá.
  const iconName = node.status === 'done' ? 'check' : node.status === 'locked' ? 'lock' : node.status === 'current' ? 'play' : node.icon;
  // Huy hiệu vẽ riêng: chỉ dùng ảnh khi kỹ năng đã có trong BADGE_READY (file ở public/roadmap/badges).
  const badgeKey = badgeKeyOf(node);
  const hasBadge = badgeKey !== null && BADGE_READY.has(badgeKey);
  const locked = node.status === 'locked';
  const left = point.x - NODE_SIZE / 2;
  const top = point.y - NODE_SIZE / 2;
  const labelOnRight = point.side === 'left';
  const labelLeft = labelOnRight ? point.x + NODE_SIZE / 2 + 12 : point.x - NODE_SIZE / 2 - 12 - LABEL_WIDTH;

  const statusText =
    node.status === 'done'
      ? 'Đã xong'
      : node.status === 'current'
        ? `Đang học · ${Math.round(node.progress * 100)}%`
        : node.status === 'open'
          ? 'Sẵn sàng'
          : 'Mở khi xong bài trước';

  return (
    <>
      {current ? (
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: left - 6, top: top - 6, width: NODE_SIZE + 12, height: NODE_SIZE + 12, borderRadius: (NODE_SIZE + 12) / 2, borderWidth: 3, borderColor: colors.gold },
            ring,
          ]}
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Bài ${index + 1}: ${node.title}, ${statusText}`}
        disabled={locked}
        onPress={() => onOpen(node)}
        style={({ pressed }) => ({
          position: 'absolute',
          left,
          top,
          width: NODE_SIZE,
          height: NODE_SIZE,
          borderRadius: NODE_SIZE / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: fill,
          borderWidth: 5,
          borderColor: colors.card,
          boxShadow: '0 8px 16px rgba(120,80,20,0.22)',
          transform: [{ scale: pressed ? 0.94 : 1 }],
        } as never)}
      >
        {hasBadge ? (
          <Image source={{ uri: `/roadmap/badges/${badgeKey}.png` }} resizeMode="contain" accessibilityIgnoresInvertColors style={{ width: 66, height: 66 }} />
        ) : (
          <Icon name={iconName} size={node.status === 'done' ? 30 : 28} color="#FFFFFF" strokeWidth={2.4} />
        )}
      </Pressable>

      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: labelLeft,
          top: point.y - 46,
          width: LABEL_WIDTH,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 18,
          backgroundColor: colors.card,
          boxShadow: '0 8px 18px rgba(120,80,20,0.14)',
          gap: 3,
        } as never}
      >
        <Text style={{ color: colors.goldDeep, fontSize: 12, fontWeight: '800' }}>Bài {index + 1}</Text>
        <Text numberOfLines={1} style={{ color: colors.ink, fontSize: 16, fontWeight: '800' }}>
          {node.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {[1, 2, 3].map((s) => (
            <Icon key={s} name="sparkle" size={14} color={s <= node.stars ? colors.gold : colors.locked} strokeWidth={2} />
          ))}
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700', marginLeft: 6 }}>{statusText}</Text>
        </View>
      </View>
    </>
  );
}


/** Nhãn dán trang trí: chỉ vẽ những nhãn đã có ảnh (ready), nằm dưới đường đi và các nút. */
function StickerLayer({ width, height }: { width: number; height: number }) {
  // Trên màn hẹp nhãn nhỏ lại để không che nút bài học; màn rộng giữ đúng cỡ thiết kế.
  const scale = Math.min(1, Math.max(0.5, width / 560));
  return (
    <>
      {STICKERS.filter((st) => st.ready).map((st) => (
        <Image
          key={st.id}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          source={{ uri: `${STICKER_BASE}${st.file}` }}
          resizeMode="contain"
          style={{
            position: 'absolute',
            left: Math.round(st.x * width - (st.size * scale) / 2),
            top: Math.round(st.y * height - (st.size * scale) / 2),
            width: Math.round(st.size * scale),
            height: Math.round(st.size * scale),
          }}
        />
      ))}
    </>
  );
}
