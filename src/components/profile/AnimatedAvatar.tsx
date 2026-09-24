import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ensureProfileKeyframes, loop, MOVE } from './profile-anim';
import { PixelSprite } from '@/components/game/PixelSprite';
import type { SkinId } from '@/components/game/sprites';
import { GlowStars } from '@/components/ui/GlowStars';
import { findItem, type AvatarLook } from '@/services/gamification/shop';

/**
 * AVATAR ĐỘNG — nhân vật pixel chuyển động trong một vòng tròn có viền màu.
 * Đổi bằng sao ở trang Đổi quà; hiện ở hồ sơ, thanh bên, bảng xếp hạng.
 */

ensureProfileKeyframes();

const RINGS: Record<AvatarLook, [string, string]> = {
  hero: ['#60A5FA', '#6366F1'],
  slime: ['#67E8F9', '#0EA5E9'],
  ghost: ['#C4B5FD', '#8B5CF6'],
  owl: ['#FCD34D', '#D97706'],
  dragon: ['#FB7185', '#DC2626'],
  star: ['#FDE68A', '#F59E0B'],
};

export function AnimatedAvatar({ look, size, skin }: { look: AvatarLook; size: number; skin?: SkinId }) {
  const inner = Math.round(size * 0.78);
  const sprite = Math.round(size * 0.66);
  const [a, b] = RINGS[look];
  return (
    <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: inner + size * 0.1, height: inner + size * 0.1, borderRadius: size, backgroundColor: '#1B1540', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {look === 'hero' ? (
          <View style={loop('rp-bob', 1200)} {...MOVE}>
            <PixelSprite name="hero" size={sprite} skin={skin} />
          </View>
        ) : look === 'slime' ? (
          <View style={{ ...loop('rp-bounce', 900), transformOrigin: 'bottom' } as object} {...MOVE}>
            <PixelSprite name="slime" color="#38BDF8" size={sprite} />
          </View>
        ) : look === 'ghost' ? (
          <View style={loop('rp-float', 1800)} {...MOVE}>
            <PixelSprite name="ghost" color="#C4B5FD" size={sprite} />
          </View>
        ) : look === 'owl' ? (
          <View style={loop('rp-tilt', 2200)} {...MOVE}>
            <PixelSprite name="owl" color="#A16207" size={sprite} />
          </View>
        ) : look === 'dragon' ? (
          <View>
            <View style={loop('rp-bob', 1000)} {...MOVE}>
              <PixelSprite name="dragon" color="#EF4444" size={sprite} />
            </View>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                pointerEvents="none"
                style={{ position: 'absolute', right: -size * 0.02, top: sprite * 0.42, width: size * 0.14, height: size * 0.14, borderRadius: size, backgroundColor: i === 1 ? '#FDE047' : '#FB923C', ...loop('rp-puff', 1200, { delay: i * 400, timing: 'ease-out' }) }}
                {...MOVE}
              />
            ))}
          </View>
        ) : (
          <View style={{ width: sprite, height: sprite, alignItems: 'center', justifyContent: 'center' }}>
            <GlowStars scale={sprite / 64} />
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

/**
 * Avatar dùng chung cho mọi nơi hiện người học: avatar động nếu đang đeo, emoji
 * nếu đeo avatar emoji, không thì chữ cái đầu của tên.
 */
export function AvatarBadge({ avatarId, name, size, skin }: { avatarId: string | null; name: string; size: number; skin?: SkinId }) {
  const item = findItem(avatarId);
  if (item?.avatarLook) return <AnimatedAvatar look={item.avatarLook} size={size} skin={skin} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDE9FE' }}>
      <Text style={{ fontSize: item?.glyph ? size * 0.5 : size * 0.4, fontWeight: '800', color: '#4C1D95' }}>{item?.glyph ?? (name.trim().slice(0, 1).toUpperCase() || '?')}</Text>
    </View>
  );
}
