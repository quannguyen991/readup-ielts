import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { GLASS_CARD } from '@/components/hub/theme';
import { CuteBook, CuteCalendar, CuteCloud, CuteGlobe, CutePencil, CutePlane } from '@/components/illust/Cute';
import {
  CuteBulb,
  CuteCalculator,
  CuteChat,
  CuteFlame,
  CuteHeadphones,
  CuteMagnifier,
  CuteMic,
  CuteNotebook,
  CutePlant,
  CuteRocket,
  CuteStar,
  CuteTrophy,
} from '@/components/illust/CuteMore';
import { Icon } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import { tutorRoute, type Tutor, type TutorTag } from '@/services/hub/tutors';
import { tutorCopy } from '@/services/hub/tutors-en';

/** Bảng màu chung của trang Luyện nói (app/hub/index.tsx). */
export const PASTEL_INK = '#2B1D3A';
export const PASTEL_INK_SOFT = '#6E5D78';
export const PASTEL_ORANGE = '#C2410C';

/** Bốn cặp gradient pastel: xanh, vàng, hồng, tím — luân phiên theo thứ tự thẻ. */
export const PASTEL_PAIRS: [string, string][] = [
  ['#CFE3FF', '#A9CCFF'],
  ['#FFF0BF', '#FFE08A'],
  ['#FFD6E3', '#FFB8CE'],
  ['#E3D7FF', '#C9B5FA'],
];

export function pastelFor(index: number): [string, string] {
  return PASTEL_PAIRS[index % PASTEL_PAIRS.length]!;
}

type Art = (p: { size?: number }) => React.ReactElement;

/** Minh hoạ cho từng gia sư: lấy từ bộ Cute, không dùng emoji. */
const TUTOR_ART: Record<string, Art> = {
  grammar: CuteBook,
  'speech-analysis': CuteMic,
  vocab: CuteNotebook,
  pronounce: CuteHeadphones,
  meeting: CuteCalendar,
  interview: CuteChat,
  'public-speaking': CuteStar,
  presentation: CuteBulb,
  sales: CuteRocket,
  dating: CutePlant,
  travel: CutePlane,
  negotiation: CuteCalculator,
  conflict: CuteCloud,
  'leader-comms': CuteTrophy,
  storytelling: CutePencil,
  leadership: CuteFlame,
  'ielts-examiner': CuteMagnifier,
  profile: CuteGlobe,
  phone: CuteChat,
  diary: CuteNotebook,
};

export function TutorArt({ id, size }: { id: string; size: number }) {
  const Art = TUTOR_ART[id] ?? CuteStar;
  return <Art size={size} />;
}

/** Nhãn nhỏ viền màu: trắng, chữ mực, viền theo loại. */
const TAG_BORDER: Record<string, string> = {
  NEW: '#7FB2F5',
  BETA: '#B39BF0',
  PREMIUM: '#E8B33C',
  'BAND 9': '#E0789A',
};

export function tagLabel(tag: TutorTag): { text: string; border: string } {
  if (tag === 'MỚI' || tag === 'NEW') return { text: 'NEW', border: TAG_BORDER.NEW! };
  if (tag === 'BETA') return { text: 'BETA', border: TAG_BORDER.BETA! };
  if (tag === 'PREMIUM') return { text: 'PREMIUM', border: TAG_BORDER.PREMIUM! };
  return { text: 'BAND 9', border: TAG_BORDER['BAND 9']! };
}

export function TagLabel({ tag }: { tag: TutorTag }) {
  const p = tagLabel(tag);
  return (
    <View
      style={{
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderWidth: 1.2,
        borderColor: p.border,
      }}
    >
      <Text style={{ color: PASTEL_INK, fontSize: 10, fontWeight: '900', letterSpacing: 0.3 }}>{p.text}</Text>
    </View>
  );
}

/** Chip nhỏ: trình độ hoặc kỹ năng chính. */
export function InfoChip({ text, tint }: { text: string; tint?: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        backgroundColor: tint ?? '#F6F1F8',
        borderWidth: 1,
        borderColor: 'rgba(43, 29, 58, 0.10)',
      }}
    >
      <Text numberOfLines={1} style={{ color: PASTEL_INK, fontSize: 11, fontWeight: '800' }}>
        {text}
      </Text>
    </View>
  );
}

/** Thẻ gia sư dạng lưới trên trang chủ Luyện nói: nền pastel, minh hoạ, nhãn, mô tả ngắn, mũi tên. */
export function TutorTile({ t, index, wide }: { t: Tutor; index: number; wide: boolean }) {
  const { en } = useL();
  const copy = tutorCopy(t, en);
  const [from, to] = pastelFor(index);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy.name}
      onPress={() => router.push(tutorRoute(t) as never)}
      style={{ flexBasis: wide ? '31%' : '48%', flexGrow: 1, borderRadius: 22, overflow: 'hidden' }}
    >
      <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 14, gap: 6, minHeight: wide ? 178 : 170 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {t.tag ? <TagLabel tag={t.tag} /> : <View />}
          <TutorArt id={t.id} size={wide ? 62 : 54} />
        </View>
        <Text numberOfLines={2} style={{ color: PASTEL_INK, fontSize: 15, fontWeight: '900', marginTop: 'auto' }}>
          {copy.name}
        </Text>
        <Text numberOfLines={2} style={{ color: PASTEL_INK, opacity: 0.75, fontSize: 12, fontWeight: '600', lineHeight: 17 }}>
          {copy.desc}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          {t.level ? <InfoChip text={t.level} tint="rgba(255,255,255,0.85)" /> : <View />}
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: 'rgba(255,255,255,0.95)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="arrow-right" size={14} color={PASTEL_INK} />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

/** Dòng gia sư trên trang danh sách: minh hoạ trên nền pastel, tên, nhãn, mô tả, kỹ năng chính. */
export function TutorRow({ t, index, wide }: { t: Tutor; index: number; wide: boolean }) {
  const { en } = useL();
  const copy = tutorCopy(t, en);
  const [from, to] = pastelFor(index);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy.name}
      onPress={() => router.push(tutorRoute(t) as never)}
      style={[GLASS_CARD, { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, width: wide ? '48.6%' : '100%', flexGrow: 0 }]}
    >
      <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
        <TutorArt id={t.id} size={44} />
      </LinearGradient>

      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text style={{ color: PASTEL_INK, fontSize: 15, fontWeight: '900', flexShrink: 1 }}>{copy.name}</Text>
          {t.tag ? <TagLabel tag={t.tag} /> : null}
        </View>
        <Text numberOfLines={2} style={{ color: PASTEL_INK_SOFT, fontSize: 12, fontWeight: '600', lineHeight: 17 }}>
          {copy.desc}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          {t.level ? <InfoChip text={t.level} tint="#FFF0BF" /> : null}
          {copy.focus.slice(0, 2).map((f) => (
            <InfoChip key={f} text={f} tint="#EEF4FF" />
          ))}
        </View>
      </View>

      <Icon name="chevron-right" size={18} color={PASTEL_INK_SOFT} />
    </Pressable>
  );
}
