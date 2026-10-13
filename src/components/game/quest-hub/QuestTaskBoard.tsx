import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { dateKey } from '@/services/gamification/points';
import { levelProgress, levelForXp, MAX_HEARTS } from '@/services/game/rules';
import { useGameStore } from '@/store/useGameStore';

const P = {
  ink: '#513A4A', muted: '#8E7885', border: '#EFCBD7', pink: '#D95D83', blush: '#FFF1F5',
};

/** Bảng tác vụ arcade: cấp, điểm hôm nay, XP, tim và các lối luyện nhanh. */
export function QuestTaskBoard() {
  const { L } = useL();
  const game = useGameStore((s) => ({ xp: s.xp, hearts: s.hearts, today: s.today, day: s.day }));
  const level = levelProgress(game.xp);
  const score = game.day === dateKey(new Date()) ? game.today.correct : 0;
  const actions = [
    { glyph: '▶', label: L('Luyện ngay', 'Play'), detail: L('Chọn bộ từ', 'Choose a deck'), href: '/vocabulary/quiz', tone: '#D95D83' },
    { glyph: '♡', label: L('Nhiệm vụ', 'Missions'), detail: L('Nhận XP & quà', 'XP and rewards'), href: '/quest/hero', tone: '#EA87A6' },
    { glyph: '✦', label: L('Du ngoạn', 'Explore'), detail: L('Mở bản đồ', 'Open the map'), href: '/quest/du-ngoan', tone: '#D985A1' },
    { glyph: '♕', label: L('Đổi quà', 'Rewards'), detail: L('Mở cửa hàng', 'Visit the shop'), href: '/shop', tone: '#C96F91' },
  ];

  return (
    <View style={{ marginBottom: 20, overflow: 'hidden', borderRadius: 22, backgroundColor: '#FFFBFC', borderWidth: 1, borderColor: P.border, ...(typeof document !== 'undefined' ? { boxShadow: '0 10px 26px rgba(180,86,117,0.1)' } : null) }}>
      <View style={{ height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 13, backgroundColor: '#F7C6D5' }}>
        <Text className="font-heavy" style={{ color: '#754854', fontSize: 10, letterSpacing: 1.2 }}>BAND 9  ·  QUEST ARCADE</Text>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {['#FFF0B5', '#FFE0E9', '#E985A2'].map((c) => <View key={c} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c, borderWidth: 1, borderColor: '#C87992' }} />)}
        </View>
      </View>

      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#FFEAF0', borderWidth: 1, borderColor: '#F6C9D7' }}>
            <Image source={require('../../../../assets/illustrations/cute-home/mascot-peace.png')} resizeMode="contain" style={{ width: 54, height: 54 }} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text className="font-heavy" style={{ fontSize: 17, color: P.ink }}>{L('Nhiệm vụ của bạn', 'Your mission board')}</Text>
            <Text className="font-medium" style={{ marginTop: 2, fontSize: 12, color: P.muted }}>{L('Mỗi lượt học thêm XP, tiến gần cấp tiếp theo.', 'Earn XP with every study session.')}</Text>
            <View style={{ marginTop: 8, height: 8, overflow: 'hidden', borderRadius: 6, backgroundColor: '#F5DCE4' }}>
              <View style={{ width: `${Math.round(level.need > 0 ? (level.into / level.need) * 100 : 0)}%`, height: 8, borderRadius: 6, backgroundColor: '#E985A2' }} />
            </View>
          </View>
        </View>

        <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          <Stat glyph="♕" title={L(`CẤP ${levelForXp(game.xp)}`, `LEVEL ${levelForXp(game.xp)}`)} value={L('Nhà thám hiểm', 'Explorer')} />
          <Stat glyph="★" title={L('ĐIỂM HÔM NAY', 'SCORE TODAY')} value={String(score).padStart(2, '0')} />
          <Stat glyph="XP" title={L('KINH NGHIỆM', 'EXPERIENCE')} value={game.xp.toLocaleString()} />
          <Stat glyph="♥" title={L('TRÁI TIM', 'HEARTS')} value={`${'♥'.repeat(game.hearts)}${'♡'.repeat(Math.max(0, MAX_HEARTS - game.hearts))}`} />
        </View>

        <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {actions.map((a) => (
            <Pressable key={a.href} accessibilityRole="link" accessibilityLabel={`${a.label}: ${a.detail}`} onPress={() => router.push(a.href as never)} style={{ minWidth: 125, flexGrow: 1, flexBasis: 125, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: a.tone, borderWidth: 1, borderColor: '#C85F80', boxShadow: '0 3px 0 rgba(163,64,97,0.18), inset 0 1px 0 rgba(255,255,255,0.4)' } as object}>
              <Text style={{ width: 24, textAlign: 'center', color: '#FFF', fontSize: 19, fontWeight: '900' }}>{a.glyph}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text className="font-heavy" numberOfLines={1} style={{ color: '#FFF', fontSize: 12 }}>{a.label}</Text>
                <Text className="font-semi" numberOfLines={1} style={{ color: '#FFF7FA', fontSize: 9 }}>{a.detail}</Text>
              </View>
              <Icon name="arrow-right" size={13} color="#FFF" strokeWidth={2.7} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function Stat({ glyph, title, value }: { glyph: string; title: string; value: string }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: 105, minWidth: 90, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: P.blush, borderWidth: 1, borderColor: '#F6DDE5' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ color: P.pink, fontSize: 11, fontWeight: '900' }}>{glyph}</Text>
        <Text className="font-strong" numberOfLines={1} style={{ color: P.muted, fontSize: 8, letterSpacing: 0.5 }}>{title}</Text>
      </View>
      <Text className="font-heavy" numberOfLines={1} style={{ marginTop: 2, color: P.ink, fontSize: 13 }}>{value}</Text>
    </View>
  );
}

