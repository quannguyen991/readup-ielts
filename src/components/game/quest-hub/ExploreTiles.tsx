/**
 * KHÁM PHÁ: các khu vui chơi khác của Quest, cùng một cỡ ô — sticker minh hoạ,
 * tên, một dòng nói khu đó làm gì. Thay cho cụm "liên kết chữ" và thẻ "Trận
 * nhanh" rải rác trước đây (hai chỗ trùng nhau: Đấu 1–1, Bản đồ, Đề tuần).
 */
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { CuteGlobe, CutePlane } from '@/components/illust/Cute';
import { CuteChat, CuteFlame, CuteMic, CuteNotebook, CuteRocket, CuteStar, CuteTrophy, Motion } from '@/components/illust/CuteMore';
import { Sticker } from '@/components/illust/Sticker';
import { HeroSprite } from '@/components/game/HeroSprite';
import { Icon } from '@/components/ui/Icon';
import { skinOf, useRewardStore } from '@/store/useRewardStore';
import { Cols, GAP, HUB, lift, WEB } from './kit';
import { useL } from '@/i18n/useL';

type Tile = { title: string; titleEn: string; detail: string; detailEn: string; href: string; tone: string; art: (size: number) => React.ReactNode };

const TILES: Tile[] = [
  { title: 'Chuyến bay từ vựng', titleEn: 'Vocab Flight', detail: 'Bay qua các thành phố và học từ', detailEn: 'Fly over cities and learn words', href: '/quest/rail', tone: HUB.sky, art: (s) => <CutePlane size={s * 1.25} /> },
  { title: 'Bản đồ Band 9', titleEn: 'Band 9 map', detail: 'Đi bộ qua sáu đảo bài học', detailEn: 'Walk across six lesson islands', href: '/quest/world', tone: HUB.blue, art: (s) => <CuteGlobe size={s} /> },
  { title: 'Đấu 1–1', titleEn: '1-on-1 duel', detail: 'Thách một người bạn 10 câu', detailEn: 'Challenge a friend to 10 questions', href: '/duel', tone: HUB.orange, art: (s) => <CuteFlame size={s} /> },
  { title: 'Đấu chiếu lớp', titleEn: 'Class showdown', detail: 'Giáo viên mở phòng, cả lớp trả lời trên điện thoại', detailEn: 'Teacher opens a room, the class answers on phones', href: '/duel/show', tone: '#1368CE', art: (s) => <CuteChat size={s} /> },
  { title: 'Thách bạn bè', titleEn: 'Challenge a friend', detail: 'Gửi đường dẫn, bạn làm đúng bộ câu của bạn', detailEn: 'Send a link, your friend plays your exact questions', href: '/duel/challenge', tone: HUB.green, art: (s) => <CuteRocket size={s} /> },
  { title: 'Đề của tuần', titleEn: 'Weekly challenge', detail: 'Cả nước làm chung một đề', detailEn: 'The whole country takes the same test', href: '/weekly', tone: HUB.amber, art: (s) => <CuteTrophy size={s} /> },
  { title: 'Album sưu tầm', titleEn: 'Weekly album', detail: 'Câu đúng trong tuần mở ô mới', detailEn: 'Correct answers this week open new slots', href: '/quest/album', tone: '#8B5CF6', art: (s) => <CuteNotebook size={s} /> },
  { title: 'Đọc theo VOA', titleEn: 'VOA shadowing', detail: 'Nghe một câu, nói lại theo', detailEn: 'Hear a sentence, say it back', href: '/shadow', tone: HUB.green, art: (s) => <CuteMic size={s} /> },
  { title: 'Xếp hạng', titleEn: 'Leaderboard', detail: 'So điểm với các bạn học khác', detailEn: 'Compare scores with other learners', href: '/leaderboard', tone: HUB.red, art: (s) => <CuteRocket size={s} /> },
  { title: 'Đổi quà', titleEn: 'Rewards shop', detail: 'Dùng sao đổi skin, linh vật, vật phẩm', detailEn: 'Spend stars on skins, mascots and items', href: '/shop', tone: HUB.pink, art: (s) => <CuteStar size={s} /> },
  { title: 'Nhân vật & túi đồ', titleEn: 'Hero & bag', detail: 'Túi đồ, sổ quái, huy hiệu, luật chơi', detailEn: 'Bag, bestiary, badges, rules', href: '/quest/hero', tone: HUB.gold, art: () => null },
  { title: 'Đua Xe Từ', titleEn: 'Word Racing', detail: 'Trả lời đúng để tăng tốc và bứt đối thủ', detailEn: 'Answer right to boost and pass your rival', href: '/quest/race', tone: '#EF4444', art: (s) => <Icon name="play" size={s} color="#EF4444" /> },
  { title: 'Đường Vàng', titleEn: 'Gold Road', detail: 'Tung xúc xắc đi trên bàn cờ, nhặt vàng', detailEn: 'Roll dice across the board and collect gold', href: '/quest/goldquest', tone: '#F59E0B', art: (s) => <Icon name="star" size={s} color="#F59E0B" /> },
  { title: 'Quán Cà Phê Band 9', titleEn: 'Band 9 Café', detail: 'Phục vụ đúng món để kiếm coin và nâng cấp quán', detailEn: 'Serve the right words to earn coins and upgrade your café', href: '/quest/cafe', tone: '#A16207', art: (s) => <Icon name="star" size={s} color="#A16207" /> },
  { title: 'Tháp Band', titleEn: 'Band Tower', detail: 'Trả lời đúng để có vàng, đặt tháp chặn quái', detailEn: 'Answer right for gold, build towers to stop monsters', href: '/quest/tower', tone: '#7C5CD6', art: (s) => <Icon name="shield" size={s} color="#7C5CD6" /> },
  { title: 'Mưa Từ Vựng', titleEn: 'Vocab Rain', detail: 'Chạm đúng nghĩa trước khi bong bóng chạm đáy', detailEn: 'Tap the right meaning before the bubble hits the floor', href: '/quest/rain', tone: '#0EA5E9', art: (s) => <Icon name="sparkle" size={s} color="#0EA5E9" /> },
];

function HeroArtTile({ size }: { size: number }) {
  const skin = skinOf(useRewardStore((s) => s.skin));
  return <HeroSprite size={size} skin={skin} />;
}

function ExploreTile({ tile, compact }: { tile: Tile; compact: boolean }) {
  const [hover, setHover] = useState(false);
  const art = compact ? 44 : 52;
  const { en } = useL();
  const title = en ? tile.titleEn : tile.title;
  const detail = en ? tile.detailEn : tile.detail;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${title}: ${detail}`}
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
        ...(WEB ? ({ boxShadow: hover ? `0 16px 34px ${tile.tone}2E` : '0 9px 22px rgba(180,86,117,0.1)' } as object) : null),
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
        {title}
      </Text>
      <Text className="font-sans" style={{ marginTop: 3, fontSize: 12.5, lineHeight: 17, color: HUB.muted }} numberOfLines={2}>
        {detail}
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
