import React, { useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect } from 'react-native-svg';

import { anim, MOVE } from '@/components/game/game-anim';
import { Icon } from '@/components/ui';
import type { IconName } from '@/components/ui/Icon';
import type { Island, IslandId, Mission } from '@/services/world/islands';
import { HUB } from './quest-hub/kit';
import { useL } from '@/i18n/useL';
import { islandShortName, islandTagline, levelLabel, missionTitle } from '@/components/world/island-label';

/**
 * Các mảnh của MÀN CHỌN TRẬN (`/quest/pick`) và trang Band 9 Quest.
 *
 * Luồng người dùng chốt ngày 25/09/2026: bấm "Vào trận" thì phải cho CHỌN MẢNG
 * (loại bài học), rồi CHỌN BÀI (phần học nào), rồi mới vào lý thuyết và luyện —
 * không nhảy thẳng vào một bài lý thuyết do máy tự chọn.
 *
 * Nền hồng sữa kiểu arcade, thẻ mềm cùng tông màu mảng; không viền đen, không ô số tròn
 * đầu hàng. Mỗi bài là một "màn" có lá cờ pixel: cờ màu
 * mảng là chưa qua, cờ vàng là đã qua.
 */

export const QUEST_GOLD = '#FACC15';
export const QUEST_MUTED = HUB.muted;
const WEB = Platform.OS === 'web';
const CRISP = { shapeRendering: 'crispEdges' } as object;

/** Mảng có danh sách bài để chọn (đảo Đấu trường không có — quái đánh ở mọi bài). */
export const PICK_AREAS: IslandId[] = ['math', 'verbal', 'vocab', 'listen', 'translate'];

export const AREA_ICON: Record<IslandId, IconName> = {
  math: 'grid',
  verbal: 'book',
  vocab: 'letters',
  listen: 'volume',
  translate: 'languages',
  arena: 'target',
};

/** Tên ngắn của loại bài, dùng trên thẻ mảng. */
export const AREA_KIND: Record<IslandId, string> = {
  math: 'Lý thuyết + luyện dạng',
  verbal: 'Lý thuyết + luyện kỹ năng',
  vocab: 'Học xen kẽ bộ từ',
  listen: 'Nghe một câu, gõ lại',
  translate: 'Dịch Việt → Anh',
  arena: 'Săn quái',
};

export const AREA_KIND_EN: Record<IslandId, string> = {
  math: 'Theory + question-type practice',
  verbal: 'Theory + skill practice',
  vocab: 'Mixed word-set study',
  listen: 'Hear a sentence, type it back',
  translate: 'Vietnamese → English',
  arena: 'Monster hunt',
};

/** Dòng thời lượng / số lượng của bài ("12 phút", "30 câu", "3/20 từ đã nhớ") khi giao diện tiếng Anh. */
function metaEn(meta: string): string {
  const min = /^(\d+) phút$/.exec(meta);
  if (min) return `${min[1]} min`;
  const words = /^(\d+)\/(\d+) từ đã nhớ$/.exec(meta);
  if (words) return `${words[1]}/${words[2]} words learned`;
  const sent = /^(\d+) câu$/.exec(meta);
  if (sent) return `${sent[1]} sentences`;
  return meta;
}

/**
 * Màu hiển thị của từng mảng trong game. Màu gốc của đảo (services/world) có
 * chàm và tím — người dùng không thích tông tím, nên ở các trang game đổi sang
 * bảng màu chung: Math xanh dương, Verbal đỏ, Từ vựng xanh lá, Nghe xanh trời,
 * Dịch hồng.
 */
export const AREA_TONE: Record<IslandId, string> = {
  math: '#C96F91',
  verbal: '#BA597B',
  vocab: '#E18EAA',
  listen: '#DA7C9D',
  translate: '#CE6D91',
  arena: '#E9A2B8',
};

/** Trận nhanh: vào thẳng, không có danh sách bài. */
export const QUICK_FIGHTS: { title: string; titleEn: string; detail: string; detailEn: string; href: string; icon: IconName; color: string }[] = [
  { title: 'Đọc theo VOA', titleEn: 'VOA shadowing', detail: 'Nói lại từng câu', detailEn: 'Repeat each sentence', href: '/shadow', icon: 'mic', color: '#D47D9B' },
  { title: 'Đề của tuần', titleEn: 'Weekly challenge', detail: 'Cả nước cùng một đề', detailEn: 'One test for the whole country', href: '/weekly', icon: 'trophy', color: '#C96888' },
  { title: 'Đấu 1–1', titleEn: '1-on-1 duel', detail: 'Thách bạn 10 câu', detailEn: 'Challenge a friend to 10 questions', href: '/duel', icon: 'target', color: '#E09AB1' },
  { title: 'Bản đồ Band 9', titleEn: 'Band 9 map', detail: 'Đi bộ qua sáu đảo', detailEn: 'Walk across six islands', href: '/quest/world', icon: 'compass', color: '#BC6683' },
];

/** Màu theo bậc khó (0 dễ → 3 khó) — màu mang thông tin, không xoay vòng. */
export const TIER_TONE = ['#4ADE80', '#CEA662', '#FBBF24', '#FB7185'] as const;

function hoverStyle(hovered: boolean | undefined, lift = 3): object {
  return WEB
    ? ({
        transform: hovered ? `translateY(-${lift}px)` : 'none',
        transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
      } as object)
    : {};
}

/** Thanh ba bước: Chọn mảng → Chọn bài → Vào học. */
export function StepBar({ step }: { step: 1 | 2 | 3 }) {
  const { L } = useL();
  const labels = [L('Chọn mảng', 'Choose area'), L('Chọn bài', 'Choose lesson'), L('Lý thuyết & luyện', 'Theory & practice')];
  const { width } = useWindowDimensions();
  if (width < 640) {
    // Khổ hẹp: ba nhãn không vừa một hàng — hiện ba chấm tiến độ + tên bước đang đứng.
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(250,204,21,0.14)' }}>
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {labels.map((l, i) => (
            <View key={l} style={{ width: i + 1 === step ? 14 : 6, height: 6, borderRadius: 3, backgroundColor: i + 1 <= step ? QUEST_GOLD : 'rgba(255,255,255,0.3)' }} />
          ))}
        </View>
        <Text className="font-strong" style={{ fontSize: 12, color: HUB.ink }}>
          {L('Bước', 'Step')} {step}/3 · {labels[step - 1]}
        </Text>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
      {labels.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <React.Fragment key={label}>
            {i > 0 ? <View style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: done || active ? QUEST_GOLD : 'rgba(255,255,255,0.18)' }} /> : null}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 5,
                backgroundColor: active ? 'rgba(250,204,21,0.16)' : 'rgba(255,255,255,0.05)',
              }}
            >
              {done ? (
                <Icon name="check" size={12} color={QUEST_GOLD} strokeWidth={2.8} />
              ) : (
                <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: active ? QUEST_GOLD : 'rgba(255,255,255,0.35)' }} />
              )}
              <Text className="font-strong" style={{ fontSize: 12, color: active ? QUEST_GOLD : done ? HUB.ink : QUEST_MUTED }}>
                {label}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

/** Thẻ một mảng học: tên, loại bài, tiến độ thật, bài kế tiếp. */
export function AreaCard({ island, onPress }: { island: Island; onPress: () => void }) {
  const next = island.missions.find((m) => !m.done);
  const [hover, setHover] = useState(false);
  const tone = AREA_TONE[island.id] ?? island.color;
  const { L, en, locale } = useL();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={L(`${island.name}: ${island.done}/${island.missions.length} bài đã qua`, `${islandShortName(island, locale)}: ${island.done}/${island.missions.length} lessons passed`)}
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        height: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: HUB.panel,
        borderWidth: 1,
        borderColor: hover ? `${tone}AA` : HUB.line,
        ...(WEB ? ({ boxShadow: hover ? `0 18px 40px ${tone}33` : '0 9px 22px rgba(180,86,117,0.1)' } as object) : null),
        ...hoverStyle(hover),
      }}
    >
      <LinearGradient
        colors={[`${tone}33`, `${tone}00`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 0.9 }}
        style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
      />
      <View style={{ padding: 16, flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: tone }}>
            <Icon name={AREA_ICON[island.id]} size={22} color="#FFFFFF" strokeWidth={2.1} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text className="font-heavy" style={{ fontSize: 17, color: HUB.ink }} numberOfLines={1}>
              {islandShortName(island, locale)}
            </Text>
            <Text className="font-semi" style={{ fontSize: 12, color: QUEST_MUTED }} numberOfLines={1}>
              {en ? AREA_KIND_EN[island.id] : AREA_KIND[island.id]} · {L(`${island.missions.length} bài`, `${island.missions.length} lessons`)}
            </Text>
          </View>
          <Icon name="arrow-right" size={18} color={hover ? tone : '#C4AAB5'} />
        </View>

        <Text className="font-sans" style={{ marginTop: 12, fontSize: 13, lineHeight: 19, color: HUB.muted }} numberOfLines={2}>
          {islandTagline(island, locale)}
        </Text>

        <View style={{ flex: 1 }} />
        <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: HUB.track, overflow: 'hidden' }}>
            <View style={{ height: 6, width: '100%', backgroundColor: tone, transform: [{ scaleX: Math.max(0.02, island.progress) }], transformOrigin: 'left' }} />
          </View>
          <Text className="font-strong" style={{ fontSize: 12, color: HUB.ink, fontVariant: ['tabular-nums'] }}>
            {island.done}/{island.missions.length}
          </Text>
        </View>
        <Text className="font-semi" style={{ marginTop: 6, fontSize: 12, color: QUEST_MUTED }} numberOfLines={1}>
          {next ? L(`Bài kế: ${next.title}`, `Next: ${missionTitle(next, locale)}`) : L('Đã qua hết — vào lại bài nào cũng được', 'All passed — revisit any lesson you like')}
        </Text>
      </View>
    </Pressable>
  );
}

/** Lá cờ pixel đánh dấu một màn. Vàng = đã qua. */
function StageFlag({ color, done }: { color: string; done: boolean }) {
  const cloth = done ? QUEST_GOLD : color;
  return (
    <Svg width={20} height={22} viewBox="0 0 10 11" {...CRISP}>
      <Rect x={1} y={0} width={1} height={11} fill="rgba(255,255,255,0.75)" />
      <Rect x={2} y={1} width={6} height={4} fill={cloth} />
      <Rect x={8} y={2} width={1} height={2} fill={cloth} />
      <Rect x={3} y={2} width={2} height={1} fill="rgba(255,255,255,0.45)" />
      <Rect x={0} y={10} width={4} height={1} fill="rgba(255,255,255,0.45)" />
    </Svg>
  );
}

/** Thẻ một bài (một "màn"): cờ, độ khó, tên, bài luyện gì, thời lượng. */
export function StageTile({
  mission,
  color,
  isNext,
}: {
  mission: Mission;
  color: string;
  isNext: boolean;
}) {
  const [hover, setHover] = useState(false);
  const tier = TIER_TONE[Math.max(0, Math.min(3, mission.tier ?? 1))];
  const { L, en, locale } = useL();
  const title = missionTitle(mission, locale);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${title}${mission.done ? L(', đã qua', ', passed') : ''}`}
      onPress={() => router.push(mission.href as never)}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={{
        height: '100%',
        minHeight: 158,
        borderRadius: 18,
        padding: 14,
        backgroundColor: hover ? '#FAF3E8' : isNext ? '#FFFDF7' : HUB.panel,
        borderWidth: 1,
        borderColor: isNext ? 'rgba(250,204,21,0.55)' : hover ? `${color}99` : HUB.line,
        ...hoverStyle(hover, 2),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <StageFlag color={color} done={mission.done} />
        {mission.level ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: tier }} />
            <Text className="font-strong" style={{ fontSize: 12, color: tier }}>
              {levelLabel(mission.level, locale)}
            </Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        {mission.done ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: 'rgba(250,204,21,0.16)' }}>
            <Icon name="check" size={11} color={QUEST_GOLD} strokeWidth={2.8} />
            <Text className="font-strong" style={{ fontSize: 11, color: HUB.gold }}>
              {L('Đã qua', 'Passed')}
            </Text>
          </View>
        ) : isNext ? (
          <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: QUEST_GOLD, ...anim('rg-aura', 1800, { loop: true, timing: 'ease-in-out' }) }} {...MOVE}>
            <Text className="font-heavy" style={{ fontSize: 11, color: '#2A1B02' }}>
              {L('Nên học tiếp', 'Up next')}
            </Text>
          </View>
        ) : null}
      </View>

      <Text className="font-heavy" style={{ marginTop: 10, fontSize: 16, lineHeight: 21, color: HUB.ink }} numberOfLines={2}>
        {title}
      </Text>
      {mission.blurb ? (
        <Text className="font-sans" style={{ marginTop: 4, fontSize: 13, lineHeight: 18, color: QUEST_MUTED }} numberOfLines={2}>
          {mission.blurb}
        </Text>
      ) : null}

      <View style={{ flex: 1 }} />
      <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {mission.meta ? (
          <>
            <Icon name="clock" size={12} color="rgba(255,255,255,0.5)" />
            <Text className="font-semi" style={{ fontSize: 12, color: HUB.muted, flex: 1 }} numberOfLines={1}>
              {en ? metaEn(mission.meta) : mission.meta}
            </Text>
          </>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <Text className="font-strong" style={{ fontSize: 12, color: hover || isNext ? QUEST_GOLD : HUB.muted }}>
          {mission.done ? L('Học lại', 'Review') : L('Vào học', 'Start')}
        </Text>
        <Icon name="arrow-right" size={13} color={hover || isNext ? QUEST_GOLD : HUB.muted} />
      </View>
    </Pressable>
  );
}

/** Nút lọc trên nền tối. */
export function DarkChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={active}
      onPress={onPress}
      style={({ hovered }: { hovered?: boolean }) => ({
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
        backgroundColor: active ? HUB.gold : hovered ? HUB.raisedHover : HUB.panel,
        borderWidth: 1,
        borderColor: active ? HUB.gold : HUB.line,
        ...(WEB ? ({ transition: 'background-color 150ms ease' } as object) : null),
      })}
    >
      <Text className="font-strong" style={{ fontSize: 12, color: active ? '#FFFFFF' : HUB.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Thẻ trận nhanh (vào thẳng). */
export function QuickFight({ item, stacked = false }: { item: (typeof QUICK_FIGHTS)[number]; stacked?: boolean }) {
  const { en } = useL();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={en ? item.titleEn : item.title}
      onPress={() => router.push(item.href as never)}
      style={({ hovered }: { hovered?: boolean }) => ({
        ...(stacked ? null : { flexGrow: 1, flexShrink: 1, flexBasis: 200 }),
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 14,
        padding: stacked ? 8 : 11,
        backgroundColor: hovered ? HUB.raisedHover : HUB.raised,
        ...hoverStyle(hovered, 2),
      })}
    >
      <View style={{ width: stacked ? 30 : 36, height: stacked ? 30 : 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: item.color }}>
        <Icon name={item.icon} size={17} color="#FFFFFF" strokeWidth={2.1} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text className="font-strong" style={{ fontSize: 14, color: HUB.ink }} numberOfLines={1}>
          {en ? item.titleEn : item.title}
        </Text>
        <Text className="font-sans" style={{ fontSize: 12, color: QUEST_MUTED }} numberOfLines={1}>
          {en ? item.detailEn : item.detail}
        </Text>
      </View>
    </Pressable>
  );
}
