/**
 * KHÁM PHÁ: các khu vui chơi khác của Quest, cùng một cỡ ô — sticker minh hoạ,
 * tên, một dòng nói khu đó làm gì. Thay cho cụm "liên kết chữ" và thẻ "Trận
 * nhanh" rải rác trước đây (hai chỗ trùng nhau: Đấu 1–1, Bản đồ, Đề tuần).
 */
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { CuteGlobe, CuteTrain } from '@/components/illust/Cute';
import { CuteFlame, CuteMic, CuteRocket, CuteStar, CuteTrophy, Motion } from '@/components/illust/CuteMore';
import { Sticker } from '@/components/illust/Sticker';
import { PixelSprite } from '@/components/game/PixelSprite';
import { Icon } from '@/components/ui/Icon';
import { skinOf, useRewardStore } from '@/store/useRewardStore';
import { Cols, GAP, HUB, lift, WEB } from './kit';

type Tile = { title: string; detail: string; href: string; tone: string; art: (size: number) => React.ReactNode };

const TILES: Tile[] = [
  { title: 'Toa Từ Vựng', detail: 'Học từ trên chuyến tàu qua các thành phố', href: '/quest/rail', tone: HUB.sky, art: (s) => <CuteTrain size={s * 1.25} /> },
  { title: 'Bản đồ ReadUp', detail: 'Đi bộ qua sáu đảo bài học', href: '/quest/world', tone: HUB.blue, art: (s) => <CuteGlobe size={s} /> },
  { title: 'Đấu 1–1', detail: 'Thách một người bạn 10 câu', href: '/duel', tone: HUB.orange, art: (s) => <CuteFlame size={s} /> },
  { title: 'Đề của tuần', detail: 'Cả nước làm chung một đề', href: '/weekly', tone: HUB.amber, art: (s) => <CuteTrophy size={s} /> },
  { title: 'Đọc theo VOA', detail: 'Nghe một câu, nói lại theo', href: '/shadow', tone: HUB.green, art: (s) => <CuteMic size={s} /> },
  { title: 'Xếp hạng', detail: 'So điểm với các bạn học khác', href: '/leaderboard', tone: HUB.red, art: (s) => <CuteRocket size={s} /> },
  { title: 'Đổi quà', detail: 'Dùng sao đổi skin, linh vật, vật phẩm', href: '/shop', tone: HUB.pink, art: (s) => <CuteStar size={s} /> },
  { title: 'Nhân vật & túi đồ', detail: 'Túi đồ, sổ quái, huy hiệu, luật chơi', href: '/quest/hero', tone: HUB.gold, art: () => null },
];

function HeroArtTile({ size }: { size: number }) {
  const skin = skinOf(useRewardStore((s) => s.skin));
  return <PixelSprite name="hero" size={size} skin={skin} />;
}

function ExploreTile({ tile, compact }: { tile: Tile; compact: boolean }) {
  const [hover, setHover] = useState(false);
  const art = compact ? 44 : 52;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${tile.title}: ${tile.detail}`}
      onPress={() => router.push(tile.href as never)}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        flex: 1,
        minHeight: compact ? 150 : 164,
        borderRadius: 20,
        padding: compact ? 14 : 16,
        overflow: 'hidden',
        backgroundColor: HUB.panel,
        borderWidth: 1,
        borderColor: hover ? `${tile.tone}AA` : HUB.line,
        ...(WEB ? ({ boxShadow: hover ? `0 16px 34px ${tile.tone}2E` : '0 10px 26px rgba(2,8,23,0.3)' } as object) : null),
        ...lift(hover),
      }}
    >
      {/* Dải màu nhận diện ở cạnh trên. */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 4, backgroundColor: tile.tone }} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View aria-hidden style={{ height: art + 8, justifyContent: 'center' }}>
          <Motion kind="hover">
            {tile.href === '/quest/hero' ? (
              <HeroArtTile size={art + 4} />
            ) : (
              <Sticker tilt={-6}>{tile.art(art)}</Sticker>
            )}
          </Motion>
        </View>
        <View style={{ width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: hover ? tile.tone : HUB.raised, ...(WEB ? ({ transition: 'background-color 160ms ease' } as object) : null) }}>
          <Icon name="arrow-right" size={15} color={hover ? '#FFFFFF' : HUB.muted} strokeWidth={2.4} />
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <Text className="font-heavy" style={{ marginTop: 10, fontSize: compact ? 15 : 16, lineHeight: 20, color: HUB.ink }} numberOfLines={1}>
        {tile.title}
      </Text>
      <Text className="font-sans" style={{ marginTop: 3, fontSize: 12.5, lineHeight: 17, color: HUB.muted }} numberOfLines={2}>
        {tile.detail}
      </Text>
    </Pressable>
  );
}

export function ExploreTiles({ width }: { width: number }) {
  const cols = width >= 900 ? 4 : 2;
  return (
    <Cols cols={cols} gap={cols === 4 ? GAP.md : GAP.sm}>
      {TILES.map((t) => (
        <ExploreTile key={t.href} tile={t} compact={width < 640} />
      ))}
    </Cols>
  );
}
